#!/usr/bin/env node

/**
 * Apply database migration script for Supabase
 * This script applies SQL migration files to the database
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Supabase credentials not found in environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration(fileName) {
  try {
    const filePath = path.join(__dirname, "..", "supabase", "migrations", fileName);

    console.log(`\n📄 Reading migration file: ${fileName}`);
    const sqlContent = await fs.readFile(filePath, "utf8");

    console.log(`⚙️  Applying migration...`);

    // Use Supabase's SQL function to execute the migration
    const { error } = await supabase
      .rpc("exec_sql", {
        sql_query: sqlContent,
      })
      .single();

    if (error) {
      // If RPC doesn't exist, we'll need to use a different approach
      console.log("⚠️  Note: Direct SQL execution through Supabase client is limited.");
      console.log("Please run this migration using the Supabase CLI:");
      console.log(`  npx supabase db execute --sql "${sqlContent.substring(0, 100)}..."`);
      return false;
    }

    console.log(`✅ Migration applied successfully: ${fileName}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to apply migration: ${error.message}`);
    return false;
  }
}

// Main execution
async function main() {
  const migrationFile = process.argv[2] || "20250926230000_comprehensive_rls_policies.sql";

  console.log("🚀 Supabase Migration Tool");
  console.log("=".repeat(60));

  const success = await applyMigration(migrationFile);

  if (success) {
    console.log("\n✅ Migration completed successfully!");
  } else {
    console.log("\n⚠️  Migration requires manual execution via Supabase CLI");
    console.log("\nTo apply the migration manually, run:");
    console.log(`  npx supabase db push`);
    console.log("\nOr if you have direct database access:");
    console.log(`  psql $DATABASE_URL < supabase/migrations/${migrationFile}`);
  }
}

main().catch(console.error);
