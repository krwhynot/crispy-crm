#!/usr/bin/env node

/**
 * Generate schema-metadata.json from Supabase PostgreSQL database
 * Uses direct pg client connection for system catalog access
 */

import pkg from "pg";
const { Client } = pkg;
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

// Load environment variables
const useCloud = process.argv.includes("--cloud");

if (useCloud) {
  console.log("Loading environment from .env (cloud)...");
  dotenv.config({ path: path.join(projectRoot, ".env") });
} else {
  console.log("Loading environment from .env.local (local)...");
  dotenv.config({ path: path.join(projectRoot, ".env.local") });
  dotenv.config({ path: path.join(projectRoot, ".env") });
}

// Get connection string
const DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!DATABASE_URL) {
  console.error("Error: Missing DATABASE_URL or SUPABASE_DB_URL");
  console.error("Add DATABASE_URL to your .env file");
  console.error("Format: postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres");
  process.exit(1);
}

// SQL Queries
const QUERIES = {
  tables: `
    SELECT
      t.table_name,
      COALESCE(s.n_live_tup, 0) as row_count,
      EXISTS(
        SELECT 1 FROM information_schema.columns c
        WHERE c.table_schema = 'public'
        AND c.table_name = t.table_name
        AND c.column_name = 'deleted_at'
      ) as has_soft_delete
    FROM information_schema.tables t
    LEFT JOIN pg_stat_user_tables s ON t.table_name = s.relname AND s.schemaname = 'public'
    WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
    ORDER BY t.table_name;
  `,

  columns: `
    SELECT
      table_name,
      column_name,
      data_type,
      is_nullable,
      column_default,
      character_maximum_length,
      ordinal_position
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position;
  `,

  primaryKeys: `
    SELECT
      tc.table_name,
      array_agg(kcu.column_name ORDER BY kcu.ordinal_position) as pk_columns
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_schema = kcu.constraint_schema
      AND tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'PRIMARY KEY'
      AND tc.table_schema = 'public'
    GROUP BY tc.table_name;
  `,

  foreignKeys: `
    SELECT
      tc.table_name,
      tc.constraint_name,
      kcu.column_name,
      ccu.table_name AS references_table,
      ccu.column_name AS references_column,
      rc.delete_rule,
      rc.update_rule
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_schema = kcu.constraint_schema
      AND tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu
      ON tc.constraint_schema = ccu.constraint_schema
      AND tc.constraint_name = ccu.constraint_name
    JOIN information_schema.referential_constraints rc
      ON tc.constraint_schema = rc.constraint_schema
      AND tc.constraint_name = rc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
    ORDER BY tc.table_name, tc.constraint_name;
  `,

  indexes: `
    SELECT
      tablename as table_name,
      indexname as index_name,
      indexdef as definition
    FROM pg_indexes
    WHERE schemaname = 'public'
    ORDER BY tablename, indexname;
  `,

  rlsPolicies: `
    SELECT
      tablename as table_name,
      policyname as policy_name,
      permissive,
      roles,
      cmd as command
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname;
  `,
};

async function executeQuery(client, name, sql) {
  console.log(`Executing query: ${name}...`);

  try {
    const result = await client.query(sql);
    console.log(`✓ ${name}: ${result.rows.length} rows`);
    return result.rows;
  } catch (err) {
    console.error(`Exception executing ${name}:`, err.message);
    throw err;
  }
}

async function generateMetadata() {
  console.log("Starting schema introspection...\n");

  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    console.log("Connecting to database...");
    await client.connect();
    console.log("✓ Connected\n");

    // Execute all queries sequentially
    console.log("Fetching tables...");
    const tables = await executeQuery(client, "tables", QUERIES.tables);

    console.log("Fetching columns...");
    const columns = await executeQuery(client, "columns", QUERIES.columns);

    console.log("Fetching primary keys...");
    const primaryKeys = await executeQuery(client, "primaryKeys", QUERIES.primaryKeys);

    console.log("Fetching foreign keys...");
    const foreignKeys = await executeQuery(client, "foreignKeys", QUERIES.foreignKeys);

    console.log("Fetching indexes...");
    const indexes = await executeQuery(client, "indexes", QUERIES.indexes);

    console.log("Fetching RLS policies...");
    const rlsPolicies = await executeQuery(client, "rlsPolicies", QUERIES.rlsPolicies);

    console.log("\nBuilding metadata structure...");

    // Group data by table
    const columnsByTable = {};
    columns.forEach((col) => {
      if (!columnsByTable[col.table_name]) {
        columnsByTable[col.table_name] = [];
      }
      columnsByTable[col.table_name].push({
        name: col.column_name,
        type: col.data_type,
        nullable: col.is_nullable === "YES",
        default: col.column_default,
        max_length: col.character_maximum_length,
        position: col.ordinal_position,
      });
    });

    const pkByTable = {};
    primaryKeys.forEach((pk) => {
      pkByTable[pk.table_name] = pk.pk_columns;
    });

    const fksByTable = {};
    foreignKeys.forEach((fk) => {
      if (!fksByTable[fk.table_name]) {
        fksByTable[fk.table_name] = [];
      }
      fksByTable[fk.table_name].push({
        constraint_name: fk.constraint_name,
        column: fk.column_name,
        references_table: fk.references_table,
        references_column: fk.references_column,
        on_delete: fk.delete_rule,
        on_update: fk.update_rule,
      });
    });

    const indexesByTable = {};
    indexes.forEach((idx) => {
      if (!indexesByTable[idx.table_name]) {
        indexesByTable[idx.table_name] = [];
      }
      indexesByTable[idx.table_name].push({
        name: idx.index_name,
        definition: idx.definition,
      });
    });

    const rlsByTable = {};
    rlsPolicies.forEach((policy) => {
      if (!rlsByTable[policy.table_name]) {
        rlsByTable[policy.table_name] = [];
      }
      rlsByTable[policy.table_name].push({
        name: policy.policy_name,
        permissive: policy.permissive,
        roles: policy.roles,
        command: policy.command,
      });
    });

    // Build final structure
    const metadata = {
      generated_at: new Date().toISOString(),
      summary: {
        total_tables: tables.length,
        total_foreign_keys: foreignKeys.length,
        total_indexes: indexes.length,
        total_rls_policies: rlsPolicies.length,
      },
      tables: tables.map((table) => ({
        name: table.table_name,
        row_count: parseInt(table.row_count) || 0,
        has_soft_delete: table.has_soft_delete,
        columns: columnsByTable[table.table_name] || [],
        primary_key: pkByTable[table.table_name] || [],
        foreign_keys: fksByTable[table.table_name] || [],
        indexes: indexesByTable[table.table_name] || [],
        rls_policies: rlsByTable[table.table_name] || [],
      })),
    };

    // Write output
    const outputPath = path.join(
      projectRoot,
      "docs",
      "architecture",
      "erd-artifacts",
      "schema-metadata.json"
    );
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(metadata, null, 2), "utf8");

    console.log("\n✓ Schema metadata generated successfully!");
    console.log(`  Output: ${outputPath}`);
    console.log("\nSummary:");
    console.log(`  Tables: ${metadata.summary.total_tables}`);
    console.log(`  Foreign Keys: ${metadata.summary.total_foreign_keys}`);
    console.log(`  Indexes: ${metadata.summary.total_indexes}`);
    console.log(`  RLS Policies: ${metadata.summary.total_rls_policies}`);
  } catch (error) {
    console.error("\n✗ Failed to generate schema metadata");
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

generateMetadata();
