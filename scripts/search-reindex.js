#!/usr/bin/env node

/**
 * Search Index Rebuild Script for CRM Migration
 *
 * This script rebuilds all search indexes during the CRM migration from deals to opportunities.
 * It handles PostgreSQL full-text search indexes, materialized views, and any external search engines.
 *
 * Usage:
 *   node scripts/search-reindex.js [options]
 *
 * Options:
 *   --dry-run           Show what would be reindexed without executing
 *   --verbose           Show detailed output
 *   --skip-postgres     Skip PostgreSQL index rebuilding
 *   --skip-views        Skip materialized view refresh
 *   --tables=table1,table2  Only reindex specific tables
 *   --help              Show this help message
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs/promises";
import path from "path";

// Configuration
const CONFIG = {
  LOG_FILE: "logs/search-reindex.log",
  SUPABASE_URL: process.env.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
  BATCH_SIZE: 10000, // For batched reindexing
  TIMEOUT_MS: 300000, // 5 minutes timeout for large operations
};

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const isVerbose = args.includes("--verbose") || isDryRun;
const skipPostgres = args.includes("--skip-postgres");
const skipViews = args.includes("--skip-views");
const showHelp = args.includes("--help");

// Parse tables filter
const tablesArg = args.find((arg) => arg.startsWith("--tables="));
const specificTables = tablesArg
  ? tablesArg
      .split("=")[1]
      .split(",")
      .map((t) => t.trim())
  : null;

if (showHelp) {
  console.log(`
Search Index Rebuild Script for CRM Migration

This script rebuilds all search indexes during the CRM migration from deals to opportunities.

Usage:
  node scripts/search-reindex.js [options]

Options:
  --dry-run           Show what would be reindexed without executing
  --verbose           Show detailed output
  --skip-postgres     Skip PostgreSQL index rebuilding
  --skip-views        Skip materialized view refresh
  --tables=table1,table2  Only reindex specific tables
  --help              Show this help message

Search Components Rebuilt:
  1. PostgreSQL B-tree indexes (primary keys, foreign keys)
  2. PostgreSQL GIN indexes (JSONB columns, arrays)
  3. Full-text search vectors (tsvector columns)
  4. Materialized views (summary tables)
  5. Custom search indexes (opportunities, contacts, companies)

Tables with Search Indexes:
  - opportunities (name, description, category, next_action)
  - contacts (first_name, last_name, email_fts, phone_fts, background)
  - companies (name, website, phone_number, city, zipcode)
  - contact_organizations (junction table indexes)
  - opportunity_participants (junction table indexes)
  `);
  process.exit(0);
}

// Logging utility
async function log(message, level = "INFO") {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;

  console.log(logMessage);

  if (!isDryRun) {
    try {
      await fs.mkdir(path.dirname(CONFIG.LOG_FILE), { recursive: true });
      await fs.appendFile(CONFIG.LOG_FILE, logMessage + "\n");
    } catch (error) {
      console.error("Failed to write to log file:", error.message);
    }
  }
}

// Initialize Supabase client
let supabase = null;
if (CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY) {
  supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
} else {
  console.error(
    "Missing Supabase configuration. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables."
  );
  process.exit(1);
}

/**
 * Execute SQL with proper error handling and logging
 */
async function executeSql(sql, description) {
  try {
    if (isDryRun) {
      await log(`[DRY RUN] Would execute: ${description}`);
      if (isVerbose) {
        await log(`SQL: ${sql.substring(0, 200)}${sql.length > 200 ? "..." : ""}`);
      }
      return { success: true };
    }

    const startTime = Date.now();
    const { data, error } = await supabase.rpc("execute_sql", { sql });
    const duration = Date.now() - startTime;

    if (error) {
      await log(`Failed ${description}: ${error.message}`, "ERROR");
      return { success: false, error };
    }

    await log(`Completed ${description} (${duration}ms)`);
    return { success: true, data };
  } catch (error) {
    await log(`Exception during ${description}: ${error.message}`, "ERROR");
    return { success: false, error };
  }
}

/**
 * Get list of all indexes in the database
 */
async function getExistingIndexes() {
  const sql = `
    SELECT
      schemaname,
      tablename,
      indexname,
      indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
    ORDER BY tablename, indexname;
  `;

  const result = await executeSql(sql, "fetching existing indexes");
  return result.success ? result.data || [] : [];
}

/**
 * Rebuild standard B-tree indexes
 */
async function rebuildBTreeIndexes() {
  if (skipPostgres) {
    await log("Skipping PostgreSQL index rebuilding (--skip-postgres)");
    return;
  }

  await log("=== Rebuilding B-tree Indexes ===");

  // Get all non-primary key indexes that might need rebuilding
  const indexes = await getExistingIndexes();

  const targetTables = specificTables || [
    "opportunities",
    "contacts",
    "companies",
    "contact_organizations",
    "opportunity_participants",
  ];
  const btreeIndexes = indexes.filter(
    (idx) =>
      targetTables.includes(idx.tablename) &&
      !idx.indexname.endsWith("_pkey") && // Skip primary keys
      idx.indexdef.includes("btree")
  );

  if (btreeIndexes.length === 0) {
    await log("No B-tree indexes found to rebuild");
    return;
  }

  for (const index of btreeIndexes) {
    await log(`Rebuilding B-tree index: ${index.indexname} on ${index.tablename}`);

    const result = await executeSql(
      `REINDEX INDEX CONCURRENTLY ${index.indexname};`,
      `reindexing ${index.indexname}`
    );

    if (!result.success) {
      await log(`Failed to rebuild index ${index.indexname}`, "ERROR");
    }
  }

  await log("B-tree index rebuilding completed");
}

/**
 * Rebuild GIN indexes for JSONB and array columns
 */
async function rebuildGinIndexes() {
  if (skipPostgres) {
    await log("Skipping GIN index rebuilding (--skip-postgres)");
    return;
  }

  await log("=== Rebuilding GIN Indexes ===");

  // Define GIN indexes that might exist or need to be created
  const ginIndexes = [
    {
      table: "contacts",
      column: "email",
      indexName: "idx_contacts_email_gin",
      createSql:
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_email_gin ON contacts USING gin(email);",
    },
    {
      table: "contacts",
      column: "phone",
      indexName: "idx_contacts_phone_gin",
      createSql:
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_phone_gin ON contacts USING gin(phone);",
    },
    {
      table: "contacts",
      column: "tags",
      indexName: "idx_contacts_tags_gin",
      createSql:
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_tags_gin ON contacts USING gin(tags);",
    },
    {
      table: "opportunities",
      column: "contact_ids",
      indexName: "idx_opportunities_contact_ids_gin",
      createSql:
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_opportunities_contact_ids_gin ON opportunities USING gin(contact_ids);",
    },
  ];

  const targetTables = specificTables || ["contacts", "opportunities"];
  const filteredIndexes = ginIndexes.filter((idx) => targetTables.includes(idx.table));

  for (const index of filteredIndexes) {
    await log(`Processing GIN index: ${index.indexName} on ${index.table}.${index.column}`);

    // Try to reindex if exists, otherwise create
    const reindexResult = await executeSql(
      `REINDEX INDEX CONCURRENTLY ${index.indexName};`,
      `reindexing GIN ${index.indexName}`
    );

    if (!reindexResult.success) {
      // Index might not exist, try to create it
      await log(`Creating new GIN index: ${index.indexName}`);
      await executeSql(index.createSql, `creating GIN index ${index.indexName}`);
    }
  }

  await log("GIN index rebuilding completed");
}

/**
 * Rebuild full-text search indexes
 */
async function rebuildFullTextSearch() {
  if (skipPostgres) {
    await log("Skipping full-text search rebuilding (--skip-postgres)");
    return;
  }

  await log("=== Rebuilding Full-Text Search Indexes ===");

  // Define full-text search configurations
  const ftsConfigs = [
    {
      table: "opportunities",
      columns: ["name", "description", "category", "next_action"],
      tsvectorColumn: "search_vector",
      updateSql: `
        UPDATE opportunities SET search_vector =
          to_tsvector('english',
            COALESCE(name, '') || ' ' ||
            COALESCE(description, '') || ' ' ||
            COALESCE(category, '') || ' ' ||
            COALESCE(next_action, '')
          )
        WHERE search_vector IS NULL OR search_vector = '';
      `,
    },
    {
      table: "contacts",
      columns: ["first_name", "last_name", "background", "title"],
      tsvectorColumn: "search_vector",
      updateSql: `
        UPDATE contacts SET search_vector =
          to_tsvector('english',
            COALESCE(first_name, '') || ' ' ||
            COALESCE(last_name, '') || ' ' ||
            COALESCE(background, '') || ' ' ||
            COALESCE(title, '')
          )
        WHERE search_vector IS NULL OR search_vector = '';
      `,
    },
    {
      table: "companies",
      columns: ["name", "website", "city"],
      tsvectorColumn: "search_vector",
      updateSql: `
        UPDATE companies SET search_vector =
          to_tsvector('english',
            COALESCE(name, '') || ' ' ||
            COALESCE(website, '') || ' ' ||
            COALESCE(city, '')
          )
        WHERE search_vector IS NULL OR search_vector = '';
      `,
    },
  ];

  const targetTables = specificTables || ["opportunities", "contacts", "companies"];
  const filteredConfigs = ftsConfigs.filter((config) => targetTables.includes(config.table));

  for (const config of filteredConfigs) {
    await log(`Rebuilding full-text search for: ${config.table}`);

    // First, ensure the search_vector column exists
    const addColumnResult = await executeSql(
      `ALTER TABLE ${config.table} ADD COLUMN IF NOT EXISTS ${config.tsvectorColumn} tsvector;`,
      `adding search vector column to ${config.table}`
    );

    if (addColumnResult.success) {
      // Update search vectors
      await executeSql(config.updateSql, `updating search vectors for ${config.table}`);

      // Create or rebuild the GIN index on the tsvector column
      const indexName = `idx_${config.table}_${config.tsvectorColumn}_gin`;
      await executeSql(
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS ${indexName} ON ${config.table} USING gin(${config.tsvectorColumn});`,
        `creating search index ${indexName}`
      );
    }
  }

  await log("Full-text search rebuilding completed");
}

/**
 * Rebuild materialized views
 */
async function rebuildMaterializedViews() {
  if (skipViews) {
    await log("Skipping materialized view rebuilding (--skip-views)");
    return;
  }

  await log("=== Rebuilding Materialized Views ===");

  // Get all materialized views
  const sql = `
    SELECT schemaname, matviewname, definition
    FROM pg_matviews
    WHERE schemaname = 'public'
    ORDER BY matviewname;
  `;

  const result = await executeSql(sql, "fetching materialized views");

  if (!result.success || !result.data || result.data.length === 0) {
    await log("No materialized views found to rebuild");
    return;
  }

  for (const view of result.data) {
    await log(`Refreshing materialized view: ${view.matviewname}`);

    await executeSql(
      `REFRESH MATERIALIZED VIEW CONCURRENTLY ${view.matviewname};`,
      `refreshing materialized view ${view.matviewname}`
    );
  }

  await log("Materialized view rebuilding completed");
}

/**
 * Create new indexes for migrated tables
 */
async function createMigrationIndexes() {
  await log("=== Creating Migration-Specific Indexes ===");

  const migrationIndexes = [
    // Opportunity-specific indexes
    {
      name: "idx_opportunities_customer_organization_id",
      sql: "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_opportunities_customer_organization_id ON opportunities(customer_organization_id);",
      description: "customer organization lookup for opportunities",
    },
    {
      name: "idx_opportunities_stage_status",
      sql: "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_opportunities_stage_status ON opportunities(stage, status);",
      description: "stage and status filtering for opportunities",
    },
    {
      name: "idx_opportunities_estimated_close_date",
      sql: "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_opportunities_estimated_close_date ON opportunities(estimated_close_date);",
      description: "close date filtering for opportunities",
    },
    {
      name: "idx_opportunities_probability",
      sql: "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_opportunities_probability ON opportunities(probability);",
      description: "probability-based queries for opportunities",
    },

    // Contact-organization junction table indexes
    {
      name: "idx_contact_organizations_contact_id",
      sql: "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contact_organizations_contact_id ON contact_organizations(contact_id);",
      description: "contact lookup in junction table",
    },
    {
      name: "idx_contact_organizations_organization_id",
      sql: "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contact_organizations_organization_id ON contact_organizations(organization_id);",
      description: "organization lookup in junction table",
    },
    {
      name: "idx_contact_organizations_primary",
      sql: "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contact_organizations_primary ON contact_organizations(is_primary_contact) WHERE is_primary_contact = true;",
      description: "primary contact filtering",
    },

    // Opportunity participants indexes
    {
      name: "idx_opportunity_participants_opportunity_id",
      sql: "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_opportunity_participants_opportunity_id ON opportunity_participants(opportunity_id);",
      description: "opportunity lookup in participants table",
    },
    {
      name: "idx_opportunity_participants_organization_id",
      sql: "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_opportunity_participants_organization_id ON opportunity_participants(organization_id);",
      description: "organization lookup in participants table",
    },
    {
      name: "idx_opportunity_participants_role",
      sql: "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_opportunity_participants_role ON opportunity_participants(role);",
      description: "role-based filtering for participants",
    },
  ];

  for (const index of migrationIndexes) {
    await log(`Creating index: ${index.name} (${index.description})`);
    await executeSql(index.sql, `creating ${index.name}`);
  }

  await log("Migration-specific index creation completed");
}

/**
 * Update table statistics for query optimizer
 */
async function updateTableStatistics() {
  await log("=== Updating Table Statistics ===");

  const tables = specificTables || [
    "opportunities",
    "contacts",
    "companies",
    "contact_organizations",
    "opportunity_participants",
    "contactNotes",
    "dealNotes",
    "opportunityNotes",
    "tasks",
  ];

  for (const table of tables) {
    await log(`Analyzing table statistics: ${table}`);
    await executeSql(`ANALYZE ${table};`, `analyzing ${table}`);
  }

  await log("Table statistics update completed");
}

/**
 * Verify search functionality
 */
async function verifySearchFunctionality() {
  await log("=== Verifying Search Functionality ===");

  const testQueries = [
    {
      description: "opportunities full-text search",
      sql: `SELECT COUNT(*) as count FROM opportunities WHERE search_vector @@ to_tsquery('english', 'test');`,
    },
    {
      description: "contacts email search",
      sql: `SELECT COUNT(*) as count FROM contacts WHERE email ? 'email';`,
    },
    {
      description: "opportunities summary view",
      sql: `SELECT COUNT(*) as count FROM opportunities_summary LIMIT 1;`,
    },
    {
      description: "contact organizations junction",
      sql: `SELECT COUNT(*) as count FROM contact_organizations LIMIT 1;`,
    },
  ];

  let successCount = 0;
  for (const query of testQueries) {
    const result = await executeSql(query.sql, `testing ${query.description}`);
    if (result.success) {
      successCount++;
      await log(`✓ ${query.description}: OK`);
    } else {
      await log(`✗ ${query.description}: FAILED`, "ERROR");
    }
  }

  await log(`Search verification completed: ${successCount}/${testQueries.length} tests passed`);
  return successCount === testQueries.length;
}

/**
 * Generate search reindex report
 */
async function generateReport() {
  await log("=== Search Reindex Report ===");
  await log(`Execution mode: ${isDryRun ? "DRY RUN" : "LIVE"}`);
  await log(`Timestamp: ${new Date().toISOString()}`);

  if (specificTables) {
    await log(`Targeted tables: ${specificTables.join(", ")}`);
  } else {
    await log("Scope: All tables");
  }

  await log("");
  await log("Search components processed:");
  await log(`✓ B-tree indexes: ${skipPostgres ? "SKIPPED" : "PROCESSED"}`);
  await log(`✓ GIN indexes: ${skipPostgres ? "SKIPPED" : "PROCESSED"}`);
  await log(`✓ Full-text search: ${skipPostgres ? "SKIPPED" : "PROCESSED"}`);
  await log(`✓ Materialized views: ${skipViews ? "SKIPPED" : "PROCESSED"}`);
  await log("✓ Migration indexes: PROCESSED");
  await log("✓ Table statistics: PROCESSED");
  await log("");

  if (!isDryRun) {
    const verificationPassed = await verifySearchFunctionality();
    await log(`Search verification: ${verificationPassed ? "PASSED" : "FAILED"}`);
    await log(`Full log available at: ${CONFIG.LOG_FILE}`);
  }
}

/**
 * Main execution function
 */
async function main() {
  try {
    await log("Starting search index rebuild for CRM migration...");
    await log(`Mode: ${isDryRun ? "DRY RUN" : "LIVE EXECUTION"}`);

    if (specificTables) {
      await log(`Targeting specific tables: ${specificTables.join(", ")}`);
    }
    await log("");

    // Execute search rebuilding steps
    await rebuildBTreeIndexes();
    await rebuildGinIndexes();
    await rebuildFullTextSearch();
    await rebuildMaterializedViews();
    await createMigrationIndexes();
    await updateTableStatistics();

    // Generate final report
    await generateReport();

    await log("");
    await log("Search index rebuild completed successfully!");

    if (!isDryRun) {
      await log("");
      await log("Next steps:");
      await log("1. Test search functionality in the application");
      await log("2. Monitor query performance with EXPLAIN ANALYZE");
      await log("3. Clear application cache: node scripts/cache-invalidation.js");
    }
  } catch (error) {
    await log(`Search index rebuild failed: ${error.message}`, "ERROR");
    if (isVerbose) {
      await log(`Stack trace: ${error.stack}`, "ERROR");
    }
    process.exit(1);
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  rebuildBTreeIndexes,
  rebuildGinIndexes,
  rebuildFullTextSearch,
  rebuildMaterializedViews,
  createMigrationIndexes,
  verifySearchFunctionality,
};
