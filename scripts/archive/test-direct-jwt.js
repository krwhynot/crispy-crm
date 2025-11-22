import { createClient } from "@supabase/supabase-js";

// Hardcoded JWT keys to rule out env loading issues
const supabaseUrl = "http://127.0.0.1:54321";
const serviceRoleKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5NiwiaWF0IjoxNzYwODQ3NTA4fQ.Uyb-UvTeQ7Knpqw2W8Is1l_FANaRQ6pROPCOwfDrIPM";

console.log("Creating Supabase client with hardcoded JWT...");
console.log("URL:", supabaseUrl);
console.log("Key (first 50 chars):", serviceRoleKey.substring(0, 50) + "...");

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

console.log("\n=== Test 1: SELECT ===");
const { data: selectData, error: selectError } = await supabase
  .from("organizations")
  .select("*")
  .limit(2);

if (selectError) {
  console.error("SELECT Error:", selectError);
} else {
  console.log(`Success! Found ${selectData.length} organizations:`);
  selectData.forEach((org) => console.log(`  - ${org.name} (id: ${org.id})`));
}

console.log("\n=== Test 2: INSERT ===");
const { data: insertData, error: insertError } = await supabase
  .from("organizations")
  .insert({
    name: "Test from JS Client",
    organization_type: "customer",
    priority: "B",
  })
  .select();

if (insertError) {
  console.error("INSERT Error:", insertError);
} else {
  console.log("Success! Inserted organization:", insertData[0]);
}

process.exit(0);
