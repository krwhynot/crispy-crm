#!/usr/bin/env node

const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");

// Read environment variables
require("dotenv").config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env file");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeImport() {
  try {
    console.log("Reading import file...");
    const sql = fs.readFileSync("./data/grand_rapids_import_wrapped.sql", "utf8");

    console.log(`Executing ${sql.length} characters of SQL...`);
    console.log("This may take a minute...\n");

    const { data, error } = await supabase.rpc("exec_sql", { sql_query: sql });

    if (error) {
      console.error("❌ Import failed:");
      console.error(error);
      process.exit(1);
    }

    console.log("✅ Import completed successfully!");
    console.log("\nRun validation queries to verify counts.");
  } catch (err) {
    console.error("❌ Unexpected error:");
    console.error(err.message);
    process.exit(1);
  }
}

executeImport();
