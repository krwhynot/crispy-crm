#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function applyRLSFix() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ Missing Supabase credentials in environment variables");
    console.error("Please ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_KEY are set");
    process.exit(1);
  }

  console.log("🔧 Applying RLS policies to fix 403 errors...\n");

  // Create Supabase admin client
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  // Read the migration SQL file
  const migrationPath = join(
    __dirname,
    "..",
    "supabase",
    "migrations",
    "20250926220000_fix_tasks_and_notes_rls_policies.sql"
  );
  const sqlContent = await readFile(migrationPath, "utf8");

  // Split SQL into individual statements (simple split by semicolon at end of line)
  const statements = sqlContent
    .split(/;\s*$/m)
    .filter((stmt) => stmt.trim().length > 0 && !stmt.trim().startsWith("--"))
    .map((stmt) => stmt.trim() + ";");

  console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];

    // Extract policy name from CREATE POLICY statement
    const policyMatch = statement.match(/CREATE POLICY\s+"([^"]+)"/i);
    const policyName = policyMatch ? policyMatch[1] : `Statement ${i + 1}`;

    console.log(`Executing: ${policyName}...`);

    try {
      // Execute the SQL statement using Supabase RPC
      // Note: This requires a database function to execute arbitrary SQL
      // For production, you should use proper migration tools

      // Since we can't execute arbitrary SQL through the JS client,
      // we'll need to use the REST API directly
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseServiceKey,
          Authorization: `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({ query: statement }),
      });

      if (!response.ok) {
        // Try alternative approach - the policies might not require RPC
        // Let's check if it's a permission issue vs missing function
        const errorText = await response.text();
        if (errorText.includes("function") && errorText.includes("does not exist")) {
          console.log("⚠️  exec_sql function not available, statement needs manual execution");
          console.log(`SQL: ${statement.substring(0, 100)}...`);
          errorCount++;
        } else {
          throw new Error(errorText);
        }
      } else {
        console.log(`✅ ${policyName} created successfully`);
        successCount++;
      }
    } catch (error) {
      console.error(`❌ Failed to create ${policyName}: ${error.message}`);
      errorCount++;
    }
  }

  console.log("\n" + "=".repeat(60));

  if (errorCount === 0) {
    console.log("✅ RLS policies applied successfully!");
    console.log("The 403 permission errors should now be resolved.");
  } else if (errorCount === statements.length) {
    console.log("❌ Unable to apply policies via JavaScript client.");
    console.log("\n📋 Please execute the following SQL directly in your Supabase SQL Editor:");
    console.log("\nFile: supabase/migrations/20250926220000_fix_tasks_and_notes_rls_policies.sql");
    console.log("\nOr use the Supabase CLI with proper authentication:");
    console.log("  1. Run: npx supabase login");
    console.log("  2. Link project: npx supabase link --project-ref <your-project-ref>");
    console.log("  3. Push migration: npx supabase db push");
  } else {
    console.log(`⚠️  Partially applied: ${successCount} succeeded, ${errorCount} failed`);
    console.log("Some policies may need manual application.");
  }

  process.exit(errorCount > 0 ? 1 : 0);
}

// Run the migration
applyRLSFix().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
