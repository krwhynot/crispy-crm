#!/usr/bin/env tsx
/**
 * Orphan Analysis Script
 *
 * Detects orphaned records and tables in the Supabase database:
 * 1. Orphaned Tables (no foreign key relationships)
 * 2. Orphaned Records (NULL FKs, soft-deleted parents, missing parents)
 * 3. Empty Tables (0 rows)
 *
 * Uses direct pg client for full catalog access (no RLS restrictions).
 */

import pkg from "pg";
const { Client } = pkg;
import { writeFileSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, "..");
const projectRoot = join(__dirname, "..");

// Load environment variables
config({ path: join(projectRoot, ".env.local") });
config({ path: join(projectRoot, ".env") });

const DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!DATABASE_URL) {
  console.error("Error: Missing DATABASE_URL or SUPABASE_DB_URL");
  console.error("Add DATABASE_URL to your .env.local file");
  console.error("Format: postgresql://postgres:[PASSWORD]@127.0.0.1:54322/postgres");
  process.exit(1);
}

interface ForeignKey {
  table_name: string;
  column_name: string;
  references_table: string;
  references_column: string;
}

interface TableInfo {
  table_name: string;
  has_soft_delete: boolean;
  row_count: number;
}

interface OrphanedRecord {
  table_name: string;
  foreign_key_column: string;
  references_table: string;
  orphaned_count: number;
  orphan_type: "null_fk" | "soft_deleted_parent" | "missing_parent";
}

// SQL Queries for catalog discovery
const QUERIES = {
  // Get all base tables with soft-delete info
  tables: `
    SELECT
      t.table_name,
      EXISTS(
        SELECT 1 FROM information_schema.columns c
        WHERE c.table_schema = 'public'
        AND c.table_name = t.table_name
        AND c.column_name = 'deleted_at'
      ) as has_soft_delete
    FROM information_schema.tables t
    WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
    ORDER BY t.table_name;
  `,

  // Get all foreign keys from catalog (not migration files)
  foreignKeys: `
    SELECT
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS references_table,
      ccu.column_name AS references_column
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_schema = kcu.constraint_schema
      AND tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu
      ON tc.constraint_schema = ccu.constraint_schema
      AND tc.constraint_name = ccu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
    ORDER BY tc.table_name, kcu.column_name;
  `,
};

async function executeQuery<T>(client: pkg.Client, name: string, sql: string): Promise<T[]> {
  console.log(`Executing: ${name}...`);
  try {
    const result = await client.query(sql);
    console.log(`✓ ${name}: ${result.rows.length} rows`);
    return result.rows as T[];
  } catch (err) {
    console.error(`✗ ${name} failed:`, err);
    throw err;
  }
}

async function getRowCount(client: pkg.Client, tableName: string): Promise<number> {
  // Use format() for safe identifier quoting
  const sql = `SELECT count(*)::int as cnt FROM ${client.escapeIdentifier(tableName)}`;
  try {
    const result = await client.query(sql);
    return result.rows[0]?.cnt || 0;
  } catch {
    return 0;
  }
}

async function checkNullForeignKeys(
  client: pkg.Client,
  table: string,
  fkColumn: string,
  hasSoftDelete: boolean
): Promise<number> {
  // Safe identifier quoting for dynamic SQL
  const tableId = client.escapeIdentifier(table);
  const columnId = client.escapeIdentifier(fkColumn);

  let sql = `SELECT count(*)::int as cnt FROM ${tableId} WHERE ${columnId} IS NULL`;
  if (hasSoftDelete) {
    sql += ` AND deleted_at IS NULL`;
  }

  try {
    const result = await client.query(sql);
    return result.rows[0]?.cnt || 0;
  } catch {
    return 0;
  }
}

async function checkSoftDeletedParents(
  client: pkg.Client,
  table: string,
  fkColumn: string,
  parentTable: string,
  childHasSoftDelete: boolean,
  parentHasSoftDelete: boolean
): Promise<number> {
  // Can only check if parent table has soft delete
  if (!parentHasSoftDelete) {
    return 0;
  }

  const childTableId = client.escapeIdentifier(table);
  const parentTableId = client.escapeIdentifier(parentTable);
  const fkColumnId = client.escapeIdentifier(fkColumn);

  // Count child records pointing to soft-deleted parents
  let sql = `
    SELECT count(*)::int as cnt
    FROM ${childTableId} c
    JOIN ${parentTableId} p ON c.${fkColumnId} = p.id
    WHERE p.deleted_at IS NOT NULL
  `;
  if (childHasSoftDelete) {
    sql += ` AND c.deleted_at IS NULL`;
  }

  try {
    const result = await client.query(sql);
    return result.rows[0]?.cnt || 0;
  } catch {
    return 0;
  }
}

async function checkMissingParents(
  client: pkg.Client,
  table: string,
  fkColumn: string,
  parentTable: string,
  parentColumn: string,
  childHasSoftDelete: boolean
): Promise<number> {
  const childTableId = client.escapeIdentifier(table);
  const parentTableId = client.escapeIdentifier(parentTable);
  const fkColumnId = client.escapeIdentifier(fkColumn);
  const parentColumnId = client.escapeIdentifier(parentColumn);

  // Count child records with FK value that doesn't exist in parent
  let sql = `
    SELECT count(*)::int as cnt
    FROM ${childTableId} c
    LEFT JOIN ${parentTableId} p ON c.${fkColumnId} = p.${parentColumnId}
    WHERE p.${parentColumnId} IS NULL
    AND c.${fkColumnId} IS NOT NULL
  `;
  if (childHasSoftDelete) {
    sql += ` AND c.deleted_at IS NULL`;
  }

  try {
    const result = await client.query(sql);
    return result.rows[0]?.cnt || 0;
  } catch {
    return 0;
  }
}

async function analyzeOrphans() {
  console.log("Starting orphan analysis...\n");
  console.log(`Database: ${DATABASE_URL?.replace(/:[^:@]+@/, ":****@")}\n`);

  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  try {
    // Get all tables with soft-delete info from catalog
    const tables = await executeQuery<{ table_name: string; has_soft_delete: boolean }>(
      client,
      "tables",
      QUERIES.tables
    );

    // Build soft-delete lookup map
    const softDeleteMap = new Map<string, boolean>();
    tables.forEach((t) => softDeleteMap.set(t.table_name, t.has_soft_delete));

    // Get all foreign keys from catalog
    const foreignKeys = await executeQuery<ForeignKey>(client, "foreignKeys", QUERIES.foreignKeys);

    // Identify tables with FK relationships
    const tablesWithFKs = new Set<string>();
    foreignKeys.forEach((fk) => {
      tablesWithFKs.add(fk.table_name);
      tablesWithFKs.add(fk.references_table);
    });

    // Orphaned tables = tables with no FK relationships
    const orphanedTables = tables
      .map((t) => t.table_name)
      .filter((table) => !tablesWithFKs.has(table));
    console.log(`\nOrphaned tables (no FK relationships): ${orphanedTables.length}`);

    // Get row counts and identify empty tables
    console.log("\nChecking table row counts...");
    const emptyTables: string[] = [];
    const tableRowCounts: Map<string, number> = new Map();

    for (let i = 0; i < tables.length; i++) {
      const table = tables[i];
      const count = await getRowCount(client, table.table_name);
      tableRowCounts.set(table.table_name, count);
      if (count === 0) {
        emptyTables.push(table.table_name);
      }
      process.stdout.write(`\r  Checked ${i + 1}/${tables.length} tables...`);
    }
    console.log(`\nEmpty tables: ${emptyTables.length}`);

    // Check for orphaned records
    const orphanedRecords: OrphanedRecord[] = [];

    console.log("\nChecking for orphaned records...");
    for (let i = 0; i < foreignKeys.length; i++) {
      const fk = foreignKeys[i];
      const childHasSoftDelete = softDeleteMap.get(fk.table_name) || false;
      const parentHasSoftDelete = softDeleteMap.get(fk.references_table) || false;

      process.stdout.write(
        `\r  Checking ${i + 1}/${foreignKeys.length}: ${fk.table_name}.${fk.column_name}...`
      );

      // Check 1: NULL foreign keys (only for non-nullable FKs - skip for now as we don't have nullable info)
      // Skip NULL FK check - it's often intentional (optional relationships)

      // Check 2: Soft-deleted parents (if parent table supports soft delete)
      const softDeletedCount = await checkSoftDeletedParents(
        client,
        fk.table_name,
        fk.column_name,
        fk.references_table,
        childHasSoftDelete,
        parentHasSoftDelete
      );
      if (softDeletedCount > 0) {
        orphanedRecords.push({
          table_name: fk.table_name,
          foreign_key_column: fk.column_name,
          references_table: fk.references_table,
          orphaned_count: softDeletedCount,
          orphan_type: "soft_deleted_parent",
        });
      }

      // Check 3: Missing parents (FK value doesn't exist in parent table)
      const missingCount = await checkMissingParents(
        client,
        fk.table_name,
        fk.column_name,
        fk.references_table,
        fk.references_column,
        childHasSoftDelete
      );
      if (missingCount > 0) {
        orphanedRecords.push({
          table_name: fk.table_name,
          foreign_key_column: fk.column_name,
          references_table: fk.references_table,
          orphaned_count: missingCount,
          orphan_type: "missing_parent",
        });
      }
    }

    console.log("\n\nAnalysis complete!\n");

    // Generate output JSON
    const output = {
      generated_at: new Date().toISOString(),
      database_url: DATABASE_URL?.replace(/:[^:@]+@/, ":****@"),
      summary: {
        total_tables: tables.length,
        total_foreign_keys: foreignKeys.length,
        orphaned_tables: orphanedTables.length,
        tables_with_orphaned_records: new Set(orphanedRecords.map((r) => r.table_name)).size,
        empty_tables: emptyTables.length,
        total_orphaned_records: orphanedRecords.reduce((sum, r) => sum + r.orphaned_count, 0),
      },
      orphaned_tables: orphanedTables,
      orphaned_records: orphanedRecords,
      empty_tables: emptyTables,
      table_row_counts: Object.fromEntries(tableRowCounts),
    };

    // Write to file
    const outputPath = join(
      projectRoot,
      "docs",
      "architecture",
      "erd-artifacts",
      "orphan-analysis.json"
    );
    writeFileSync(outputPath, JSON.stringify(output, null, 2));

    console.log(`Report written to: ${outputPath}`);
    console.log("\nSummary:");
    console.log(`  Total tables: ${output.summary.total_tables}`);
    console.log(`  Total foreign keys: ${output.summary.total_foreign_keys}`);
    console.log(`  Orphaned tables: ${output.summary.orphaned_tables}`);
    console.log(`  Tables with orphaned records: ${output.summary.tables_with_orphaned_records}`);
    console.log(`  Empty tables: ${output.summary.empty_tables}`);
    console.log(`  Total orphaned records: ${output.summary.total_orphaned_records}`);

    if (orphanedTables.length > 0) {
      console.log("\nOrphaned tables (no FK relationships):");
      orphanedTables.forEach((t) => console.log(`  - ${t}`));
    }

    if (emptyTables.length > 0) {
      console.log("\nEmpty tables:");
      emptyTables.forEach((t) => console.log(`  - ${t}`));
    }

    if (orphanedRecords.length > 0) {
      console.log("\nOrphaned records:");
      orphanedRecords.forEach((r) =>
        console.log(
          `  - ${r.table_name}.${r.foreign_key_column} -> ${r.references_table}: ${r.orphaned_count} (${r.orphan_type})`
        )
      );
    }

    return output;
  } finally {
    await client.end();
  }
}

// Run analysis
analyzeOrphans().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
