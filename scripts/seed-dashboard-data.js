#!/usr/bin/env node
/**
 * Seed Dashboard V3 Demo Data
 * Runs SQL directly via Supabase client
 *
 * SECURITY REQUIREMENT: This script requires SUPABASE_SERVICE_ROLE_KEY
 * The exec_sql RPC function only accepts calls from service_role JWT claims.
 * Using anon key will result in permission denied errors.
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=your_key node scripts/seed-dashboard-data.js
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read environment
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://aaqnanddcqvfiwhshndl.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error("❌ Error: SUPABASE_SERVICE_ROLE_KEY not found in environment");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function seedData() {
  console.log("\n🌱 Seeding Dashboard V3 demo data...\n");

  try {
    // Read SQL file
    const sqlPath = join(__dirname, "create-demo-data.sql");
    const sql = readFileSync(sqlPath, "utf8");

    // Execute SQL
    const { data, error } = await supabase.rpc("exec_sql", { sql_query: sql });

    if (error) {
      // Try direct approach if RPC doesn't exist
      console.log("   Trying direct SQL execution...");

      const { error: directError } = await supabase.from("_sql").insert({ query: sql });

      if (directError) {
        throw new Error(`SQL execution failed: ${directError.message}`);
      }
    }

    console.log("✅ Demo data created successfully!\n");
    console.log("📊 Created:");
    console.log("   • 1 principal organization (Demo Principal Org)");
    console.log("   • 1 customer organization (Demo Customer)");
    console.log("   • 1 opportunity (Demo Active Deal)");
    console.log("   • 2 activities (for momentum calculation)");
    console.log("   • 3 tasks (overdue, today, upcoming)\n");
    console.log("🚀 Next: Reload http://127.0.0.1:5173/dashboard-v3\n");
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.log("\n💡 Alternative: Run SQL manually via Supabase Dashboard");
    console.log("   1. Visit: https://supabase.com/dashboard/project/aaqnanddcqvfiwhshndl/sql");
    console.log("   2. Copy contents of: scripts/create-demo-data.sql");
    console.log('   3. Click "Run"\n');
    process.exit(1);
  }
}

seedData();
