import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://aaqnanddcqvfiwhshndl.supabase.co";
const supabaseKey =
  process.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhcW5hbmRkY3F2Zml3aHNobmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1ODIxODUsImV4cCI6MjA3NDE1ODE4NX0.wJi2sGLrvrI5OQUujTByVWjdyCT7Prjlpsx9LC_CUzU";

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugTaskRLS() {
  console.log("🔍 Debugging Task Completion RLS Issue\n");
  console.log("=".repeat(60));

  // Step 1: Login as admin@test.com
  console.log("\n📝 Step 1: Authenticating as admin@test.com...");
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: "admin@test.com",
    password: "password123",
  });

  if (authError) {
    console.error("❌ Auth failed:", authError.message);
    return;
  }

  console.log("✅ Authenticated successfully");
  console.log("User ID:", authData.user.id);

  // Step 2: Get current user's sales record
  console.log("\n📝 Step 2: Fetching sales record for current user...");
  const { data: salesData, error: salesError } = await supabase
    .from("sales")
    .select("id, email, first_name, last_name, role")
    .eq("user_id", authData.user.id)
    .single();

  if (salesError) {
    console.error("❌ Sales fetch failed:", salesError.message);
    return;
  }

  console.log("✅ Sales record:", salesData);
  const currentSalesId = salesData.id;

  // Step 3: Get first incomplete task (any principal)
  console.log("\n📝 Step 3: Fetching first incomplete task (any principal)...");
  const { data: tasks, error: tasksError } = await supabase
    .from("tasks")
    .select("id, title, sales_id, completed, opportunity_id")
    .eq("completed", false)
    .limit(5);

  if (tasksError) {
    console.error("❌ Tasks fetch failed:", tasksError.message);
    return;
  }

  console.log(`✅ Found ${tasks?.length || 0} incomplete tasks`);
  if (tasks && tasks.length > 0) {
    console.table(tasks);
  }

  if (!tasks || tasks.length === 0) {
    console.log("⚠️  No incomplete tasks found");
    return;
  }

  const task = tasks[0];
  console.log("✅ Found task:", task);
  console.log(`   Task sales_id: ${task.sales_id}`);
  console.log(`   Current sales_id: ${currentSalesId}`);
  console.log(`   Match: ${task.sales_id === currentSalesId ? "✅ YES" : "❌ NO"}`);

  // Step 4: Test helper functions
  console.log("\n📝 Step 4: Testing RLS helper functions...");

  const { data: currentSalesIdCheck, error: currentSalesIdError } =
    await supabase.rpc("current_sales_id");

  if (currentSalesIdError) {
    console.error("❌ current_sales_id() failed:", currentSalesIdError.message);
  } else {
    console.log(`✅ current_sales_id() = ${currentSalesIdCheck}`);
  }

  const { data: isManagerOrAdmin, error: isManagerError } =
    await supabase.rpc("is_manager_or_admin");

  if (isManagerError) {
    console.error("❌ is_manager_or_admin() failed:", isManagerError.message);
  } else {
    console.log(`✅ is_manager_or_admin() = ${isManagerOrAdmin}`);
  }

  // Step 5: Attempt UPDATE via Supabase (bypassing React Admin)
  console.log("\n📝 Step 5: Attempting direct UPDATE via Supabase...");
  const { data: updateData, error: updateError } = await supabase
    .from("tasks")
    .update({
      completed: true,
      completed_at: new Date().toISOString(),
    })
    .eq("id", task.id) // Fixed: use task.id instead of task.task_id
    .select();

  if (updateError) {
    console.error("❌ UPDATE failed:", updateError);
    console.error("   Code:", updateError.code);
    console.error("   Details:", updateError.details);
    console.error("   Hint:", updateError.hint);
    console.error("   Message:", updateError.message);
  } else {
    console.log("✅ UPDATE succeeded!");
    console.log("   Updated task:", updateData);
  }

  // Step 6: Query RLS policies
  console.log("\n📝 Step 6: Querying RLS policies for tasks table...");
  const { data: policies, error: policiesError } = await supabase.rpc("exec_sql", {
    query: `
        SELECT
          schemaname,
          tablename,
          policyname,
          permissive,
          roles,
          cmd,
          qual,
          with_check
        FROM pg_policies
        WHERE tablename = 'tasks'
        AND cmd = 'UPDATE'
        ORDER BY policyname;
      `,
  });

  if (policiesError) {
    console.log("⚠️  Could not query pg_policies (requires service role)");
    console.log("   Error:", policiesError.message);
  } else {
    console.log("✅ RLS Policies for UPDATE on tasks:");
    console.table(policies);
  }

  console.log("\n" + "=".repeat(60));
  console.log("🏁 Debug complete!\n");

  // Cleanup
  await supabase.auth.signOut();
}

debugTaskRLS()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
