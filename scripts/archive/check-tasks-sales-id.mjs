import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://aaqnanddcqvfiwhshndl.supabase.co";
const supabaseKey =
  process.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhcW5hbmRkY3F2Zml3aHNobmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1ODIxODUsImV4cCI6MjA3NDE1ODE4NX0.wJi2sGLrvrI5OQUujTByVWjdyCT7Prjlpsx9LC_CUzU";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTasks() {
  console.log("🔍 Checking tasks table for sales_id...\n");

  // Get total task count
  const { count: totalCount } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true });

  console.log(`Total tasks: ${totalCount}`);

  // Get tasks without sales_id
  const { data: nullSalesId, count: nullCount } = await supabase
    .from("tasks")
    .select("id, title, sales_id", { count: "exact" })
    .is("sales_id", null);

  console.log(`Tasks with NULL sales_id: ${nullCount}`);

  if (nullCount > 0) {
    console.log("\n❌ ISSUE: Found tasks without sales_id:");
    console.table(nullSalesId?.slice(0, 5));
  }

  // Get sample tasks with sales_id
  const { data: withSalesId } = await supabase
    .from("tasks")
    .select("id, title, sales_id, completed")
    .not("sales_id", "is", null)
    .limit(5);

  console.log(`\n✅ Sample tasks WITH sales_id:`);
  console.table(withSalesId);

  // Check if admin@test.com has a sales record
  const { data: adminSales } = await supabase
    .from("sales")
    .select("id, email, first_name, last_name, role")
    .eq("email", "admin@test.com")
    .single();

  console.log("\n👤 Admin user sales record:");
  console.log(adminSales);

  return nullCount === 0;
}

checkTasks()
  .then((success) => {
    if (success) {
      console.log("\n✅ All tasks have sales_id set!");
      process.exit(0);
    } else {
      console.log("\n❌ Some tasks are missing sales_id!");
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error("Error:", err.message);
    process.exit(1);
  });
