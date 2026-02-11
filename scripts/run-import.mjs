#!/usr/bin/env node
/**
 * Run SQL Import Script
 * Executes SQL files via Supabase exec_sql RPC
 *
 * SECURITY REQUIREMENT: This script requires SUPABASE_SERVICE_ROLE_KEY
 * The exec_sql RPC function only accepts calls from service_role JWT claims.
 * Using anon key will result in permission denied errors.
 *
 * Usage:
 *   node scripts/run-import.mjs
 *   (requires SUPABASE_SERVICE_ROLE_KEY in .env)
 */

import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// Support both env var names for backward compatibility
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl) {
  console.error("❌ Missing VITE_SUPABASE_URL in .env file");
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.error("❌ Missing SUPABASE_SERVICE_ROLE_KEY in .env file");
  console.error("💡 You need the service role key to execute raw SQL");
  console.error("   The exec_sql RPC requires service_role JWT claims.");
  console.error(
    "   Get it from: https://supabase.com/dashboard/project/aaqnanddcqvfiwhshndl/settings/api"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeImport() {
  try {
    console.log("📖 Reading import file...");
    const sqlContent = readFileSync("./data/grand_rapids_import_wrapped.sql", "utf8");

    console.log(`📊 File size: ${(sqlContent.length / 1024).toFixed(2)} KB`);
    console.log("⏳ Executing SQL (this may take 1-2 minutes)...\n");

    // Execute the SQL using Supabase's REST API
    const { error } = await supabase.rpc("exec_sql", {
      sql_query: sqlContent,
    });

    if (error) {
      console.error("❌ Import failed:");
      console.error(JSON.stringify(error, null, 2));
      process.exit(1);
    }

    console.log("✅ Import completed successfully!");
    console.log("\n📋 Next steps:");
    console.log("   - Verify counts with validation queries");
    console.log(
      "   - Check that organizations, contacts, opportunities, and activities were created"
    );
  } catch (err) {
    console.error("❌ Unexpected error:", err.message);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  }
}

executeImport();
