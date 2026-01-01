#!/usr/bin/env npx tsx
/**
 * Generate Database Schema Documentation
 *
 * Connects to Supabase PostgreSQL database and generates markdown documentation
 * from information_schema. Includes tables, columns, types, foreign keys, and indexes.
 *
 * Usage: npx tsx scripts/generate-schema-docs.ts
 *        npm run docs:schema
 *
 * Environment Variables:
 *   DATABASE_URL - PostgreSQL connection string (preferred)
 *   or: VITE_SUPABASE_URL + SUPABASE_DB_PASSWORD (will construct connection)
 *
 * Output: docs/architecture/data-model.md
 */

import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, "../.env") });
dotenv.config({ path: resolve(__dirname, "../.env.local") });

const { Client } = pg;

// ============================================================================
// TYPES
// ============================================================================

interface TableInfo {
  table_name: string;
  table_type: string;
}

interface ColumnInfo {
  table_name: string;
  column_name: string;
  data_type: string;
  udt_name: string;
  is_nullable: string;
  column_default: string | null;
  character_maximum_length: number | null;
  numeric_precision: number | null;
  description: string | null;
}

interface ForeignKeyInfo {
  table_name: string;
  column_name: string;
  foreign_table_name: string;
  foreign_column_name: string;
  constraint_name: string;
}

interface IndexInfo {
  table_name: string;
  index_name: string;
  index_def: string;
  is_unique: boolean;
  is_primary: boolean;
  columns: string;
}

// ============================================================================
// DATABASE CONNECTION
// ============================================================================

function getConnectionString(): string {
  // Prefer explicit DATABASE_URL
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  // For local Supabase development
  const localUrl = "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

  // Check if we can construct from Supabase URL
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const dbPassword = process.env.SUPABASE_DB_PASSWORD;

  if (supabaseUrl && dbPassword) {
    // Extract project ref from Supabase URL
    // Format: https://PROJECT_REF.supabase.co
    const match = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
    if (match) {
      const projectRef = match[1];
      return `postgresql://postgres.${projectRef}:${dbPassword}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;
    }
  }

  // Check if local URL seems valid (try to ping it)
  console.log("⚠️  No DATABASE_URL found. Using local Supabase default.");
  console.log(`   Connection: ${localUrl}\n`);
  return localUrl;
}

async function connectToDatabase(): Promise<pg.Client> {
  const connectionString = getConnectionString();

  const client = new Client({
    connectionString,
    ssl: connectionString.includes("supabase.com") ? { rejectUnauthorized: false } : undefined,
  });

  try {
    await client.connect();
    console.log("✅ Connected to database\n");
    return client;
  } catch (error) {
    const err = error as Error;
    console.error("❌ Failed to connect to database");
    console.error(`   Error: ${err.message}`);
    console.error("\n💡 Make sure either:");
    console.error("   1. Local Supabase is running: npm run db:local:start");
    console.error("   2. DATABASE_URL is set in .env");
    console.error("   3. VITE_SUPABASE_URL and SUPABASE_DB_PASSWORD are set for cloud\n");
    process.exit(1);
  }
}

// ============================================================================
// SCHEMA QUERIES
// ============================================================================

async function getTables(client: pg.Client): Promise<TableInfo[]> {
  const result = await client.query<TableInfo>(`
    SELECT table_name, table_type
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      AND table_name NOT LIKE 'pg_%'
      AND table_name NOT LIKE '_prisma_%'
    ORDER BY table_name ASC
  `);
  return result.rows;
}

async function getColumns(client: pg.Client): Promise<ColumnInfo[]> {
  const result = await client.query<ColumnInfo>(`
    SELECT
      c.table_name,
      c.column_name,
      c.data_type,
      c.udt_name,
      c.is_nullable,
      c.column_default,
      c.character_maximum_length,
      c.numeric_precision,
      pgd.description
    FROM information_schema.columns c
    LEFT JOIN pg_catalog.pg_statio_all_tables st
      ON st.schemaname = c.table_schema AND st.relname = c.table_name
    LEFT JOIN pg_catalog.pg_description pgd
      ON pgd.objoid = st.relid AND pgd.objsubid = c.ordinal_position
    WHERE c.table_schema = 'public'
    ORDER BY c.table_name, c.ordinal_position
  `);
  return result.rows;
}

async function getForeignKeys(client: pg.Client): Promise<ForeignKeyInfo[]> {
  const result = await client.query<ForeignKeyInfo>(`
    SELECT
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name,
      tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
    ORDER BY tc.table_name, kcu.column_name
  `);
  return result.rows;
}

async function getIndexes(client: pg.Client): Promise<IndexInfo[]> {
  const result = await client.query<IndexInfo>(`
    SELECT
      t.relname AS table_name,
      i.relname AS index_name,
      pg_get_indexdef(i.oid) AS index_def,
      ix.indisunique AS is_unique,
      ix.indisprimary AS is_primary,
      array_to_string(array_agg(a.attname ORDER BY array_position(ix.indkey, a.attnum)), ', ') AS columns
    FROM pg_class t
    JOIN pg_index ix ON t.oid = ix.indrelid
    JOIN pg_class i ON i.oid = ix.indexrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    LEFT JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
    WHERE n.nspname = 'public'
      AND t.relkind = 'r'
    GROUP BY t.relname, i.relname, i.oid, ix.indisunique, ix.indisprimary
    ORDER BY t.relname, i.relname
  `);
  return result.rows;
}

// ============================================================================
// MARKDOWN GENERATION
// ============================================================================

function formatType(col: ColumnInfo): string {
  let type = col.data_type;

  // Use the underlying type for user-defined types (enums)
  if (type === "USER-DEFINED") {
    type = col.udt_name;
  }

  // Add length/precision info
  if (col.character_maximum_length) {
    type += `(${col.character_maximum_length})`;
  } else if (col.numeric_precision && !["integer", "bigint", "smallint"].includes(col.data_type)) {
    type += `(${col.numeric_precision})`;
  }

  // Handle array types
  if (type.startsWith("_")) {
    type = type.substring(1) + "[]";
  }

  return type;
}

function formatDefault(defaultValue: string | null): string {
  if (!defaultValue) return "-";

  // Truncate long defaults
  if (defaultValue.length > 40) {
    return defaultValue.substring(0, 37) + "...";
  }

  // Escape pipe characters for markdown table
  return defaultValue.replace(/\|/g, "\\|");
}

function escapeMarkdown(text: string | null): string {
  if (!text) return "-";
  return text.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function generateMarkdown(
  tables: TableInfo[],
  columns: ColumnInfo[],
  foreignKeys: ForeignKeyInfo[],
  indexes: IndexInfo[]
): string {
  const timestamp = new Date().toISOString().replace("T", " ").substring(0, 19);

  let md = `# Data Model Reference

> ⚠️ AUTO-GENERATED - DO NOT EDIT MANUALLY
> Generated: ${timestamp}
> Run \`npx tsx scripts/generate-schema-docs.ts\` to regenerate

## Quick Stats

- **Tables:** ${tables.length}
- **Foreign Keys:** ${foreignKeys.length}
- **Indexes:** ${indexes.length}

## Table of Contents

`;

  // Generate TOC
  for (const table of tables) {
    md += `- [${table.table_name}](#${table.table_name})\n`;
  }

  md += `\n---\n\n## Tables\n\n`;

  // Group data by table
  const columnsByTable = new Map<string, ColumnInfo[]>();
  const fksByTable = new Map<string, ForeignKeyInfo[]>();
  const indexesByTable = new Map<string, IndexInfo[]>();

  for (const col of columns) {
    if (!columnsByTable.has(col.table_name)) {
      columnsByTable.set(col.table_name, []);
    }
    columnsByTable.get(col.table_name)!.push(col);
  }

  for (const fk of foreignKeys) {
    if (!fksByTable.has(fk.table_name)) {
      fksByTable.set(fk.table_name, []);
    }
    fksByTable.get(fk.table_name)!.push(fk);
  }

  for (const idx of indexes) {
    if (!indexesByTable.has(idx.table_name)) {
      indexesByTable.set(idx.table_name, []);
    }
    indexesByTable.get(idx.table_name)!.push(idx);
  }

  // Generate table documentation
  for (const table of tables) {
    const tableCols = columnsByTable.get(table.table_name) || [];
    const tableFKs = fksByTable.get(table.table_name) || [];
    const tableIndexes = indexesByTable.get(table.table_name) || [];

    md += `### ${table.table_name}\n\n`;

    // Columns table
    md += `| Column | Type | Nullable | Default | Description |\n`;
    md += `|--------|------|----------|---------|-------------|\n`;

    for (const col of tableCols) {
      md += `| ${col.column_name} `;
      md += `| ${formatType(col)} `;
      md += `| ${col.is_nullable === "YES" ? "✓" : "✗"} `;
      md += `| ${formatDefault(col.column_default)} `;
      md += `| ${escapeMarkdown(col.description)} |\n`;
    }

    md += `\n`;

    // Relationships (Foreign Keys)
    if (tableFKs.length > 0) {
      md += `**Relationships:**\n`;
      for (const fk of tableFKs) {
        md += `- \`${fk.column_name}\` → \`${fk.foreign_table_name}.${fk.foreign_column_name}\`\n`;
      }
      md += `\n`;
    }

    // Indexes
    if (tableIndexes.length > 0) {
      md += `**Indexes:**\n`;
      for (const idx of tableIndexes) {
        const tags: string[] = [];
        if (idx.is_primary) tags.push("PRIMARY");
        if (idx.is_unique && !idx.is_primary) tags.push("UNIQUE");

        const tagStr = tags.length > 0 ? ` [${tags.join(", ")}]` : "";
        md += `- \`${idx.index_name}\` (${idx.columns})${tagStr}\n`;
      }
      md += `\n`;
    }

    md += `---\n\n`;
  }

  // Footer with regeneration instructions
  md += `## Regeneration

To regenerate this documentation:

\`\`\`bash
# With local Supabase running
npm run docs:schema

# Or directly
npx tsx scripts/generate-schema-docs.ts
\`\`\`

Make sure either:
1. Local Supabase is running (\`npm run db:local:start\`)
2. \`DATABASE_URL\` is set in your \`.env\` file
3. \`VITE_SUPABASE_URL\` and \`SUPABASE_DB_PASSWORD\` are set for cloud connection
`;

  return md;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log("📊 Generating Database Schema Documentation\n");
  console.log("=".repeat(60) + "\n");

  // Connect to database
  const client = await connectToDatabase();

  try {
    // Fetch schema information
    console.log("📋 Fetching schema information...");

    const [tables, columns, foreignKeys, indexes] = await Promise.all([
      getTables(client),
      getColumns(client),
      getForeignKeys(client),
      getIndexes(client),
    ]);

    console.log(`   Tables: ${tables.length}`);
    console.log(`   Columns: ${columns.length}`);
    console.log(`   Foreign Keys: ${foreignKeys.length}`);
    console.log(`   Indexes: ${indexes.length}\n`);

    // Generate markdown
    console.log("📝 Generating markdown...\n");
    const markdown = generateMarkdown(tables, columns, foreignKeys, indexes);

    // Write output
    const outputPath = resolve(__dirname, "../docs/architecture/data-model.md");
    writeFileSync(outputPath, markdown, "utf-8");

    console.log("✅ Documentation generated successfully!");
    console.log(`   Output: docs/architecture/data-model.md`);
    console.log(`   Tables documented: ${tables.length}\n`);

    // List tables
    console.log("📋 Tables included:");
    for (const table of tables) {
      const colCount = columns.filter((c) => c.table_name === table.table_name).length;
      console.log(`   - ${table.table_name} (${colCount} columns)`);
    }
    console.log("");
  } finally {
    await client.end();
    console.log("🔌 Database connection closed\n");
  }
}

main().catch((error) => {
  console.error("❌ Fatal error:", error.message);
  process.exit(1);
});
