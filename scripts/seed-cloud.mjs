import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const url = "https://aaqnanddcqvfiwhshndl.supabase.co";
const key =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhcW5hbmRkY3F2Zml3aHNobmRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODU4MjE4NSwiZXhwIjoyMDc0MTU4MTg1fQ.8UTCpBUhDTFoNw9hMD43Tok3t3gYJ7cWEwwDoeB_nP4";

const supabase = createClient(url, key);

const sql = readFileSync("/tmp/seed-dashboard.sql", "utf8");

console.log("🌱 Seeding demo data...\n");

// Extract the DO block content
const match = sql.match(/DO \$\$([\s\S]*?)END \$\$/);
if (!match) {
  console.error("❌ Could not parse SQL");
  process.exit(1);
}

const _plpgsqlCode = match[1];

// Execute each insert individually via the client
try {
  const salesId = 6;

  // Create principal org
  const { data: principal, error: err1 } = await supabase
    .from("organizations")
    .insert({
      name: "Demo Principal Org",
      organization_type: "principal",
      priority: "A",
      city: "San Francisco",
      state: "CA",
      created_by: salesId,
    })
    .select()
    .single();

  if (err1 && !err1.message.includes("duplicate")) throw err1;

  const principalId =
    principal?.id ||
    (
      await supabase
        .from("organizations")
        .select("id")
        .eq("name", "Demo Principal Org")
        .eq("organization_type", "principal")
        .single()
    ).data.id;

  console.log("✓ Principal org:", principalId);

  // Create customer org
  const { data: customer, error: err2 } = await supabase
    .from("organizations")
    .insert({
      name: "Demo Customer",
      organization_type: "customer",
      principal_organization_id: principalId,
      priority: "C",
      city: "Oakland",
      state: "CA",
      created_by: salesId,
    })
    .select()
    .single();

  if (err2 && !err2.message.includes("duplicate")) throw err2;

  const customerId =
    customer?.id ||
    (await supabase.from("organizations").select("id").eq("name", "Demo Customer").single()).data
      .id;

  console.log("✓ Customer org:", customerId);

  // Create opportunity
  const closeDate = new Date();
  closeDate.setDate(closeDate.getDate() + 30);

  const { data: opp, error: err3 } = await supabase
    .from("opportunities")
    .insert({
      name: "Demo Active Deal",
      stage: "discovery",
      priority: "high",
      estimated_close_date: closeDate.toISOString().split("T")[0],
      principal_organization_id: principalId,
      customer_organization_id: customerId,
      created_by: salesId,
    })
    .select()
    .single();

  if (err3 && !err3.message.includes("duplicate")) throw err3;

  const oppId =
    opp?.id ||
    (await supabase.from("opportunities").select("id").eq("name", "Demo Active Deal").single()).data
      .id;

  console.log("✓ Opportunity:", oppId);

  // Create activities
  const now = new Date();
  const twoDaysAgo = new Date(now);
  twoDaysAgo.setDate(now.getDate() - 2);
  const oneDayAgo = new Date(now);
  oneDayAgo.setDate(now.getDate() - 1);

  await supabase.from("activities").insert([
    {
      activity_type: "interaction",
      type: "call",
      subject: "Discovery call",
      description: "Discussed requirements",
      activity_date: twoDaysAgo.toISOString(),
      outcome: "Connected",
      duration_minutes: 45,
      opportunity_id: oppId,
      organization_id: customerId,
      created_by: salesId,
    },
    {
      activity_type: "interaction",
      type: "email",
      subject: "Follow-up email",
      description: "Sent proposal",
      activity_date: oneDayAgo.toISOString(),
      outcome: "Completed",
      opportunity_id: oppId,
      organization_id: customerId,
      created_by: salesId,
    },
  ]);

  console.log("✓ Activities created");

  // Create tasks
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 2);

  await supabase.from("tasks").insert([
    {
      title: "Call back prospect",
      description: "Follow up",
      type: "Call",
      priority: "high",
      due_date: yesterday.toISOString().split("T")[0],
      completed: false,
      opportunity_id: oppId,
      sales_id: salesId,
      created_by: salesId,
    },
    {
      title: "Prepare demo",
      description: "Slides",
      type: "Meeting",
      priority: "high",
      due_date: today,
      completed: false,
      opportunity_id: oppId,
      sales_id: salesId,
      created_by: salesId,
    },
    {
      title: "Schedule follow-up",
      description: "Book time",
      type: "Call",
      priority: "medium",
      due_date: tomorrow.toISOString().split("T")[0],
      completed: false,
      opportunity_id: oppId,
      sales_id: salesId,
      created_by: salesId,
    },
  ]);

  console.log("✓ Tasks created");

  console.log("\n✅ Demo data seeded successfully!\n");
  console.log("📊 Created:");
  console.log("   • 1 principal organization");
  console.log("   • 1 customer organization");
  console.log("   • 1 opportunity");
  console.log("   • 2 activities");
  console.log("   • 3 tasks\n");
  console.log("🚀 Reload: http://127.0.0.1:5173/dashboard-v3\n");
} catch (error) {
  console.error("\n❌ Error:", error.message);
  if (error.details) console.error("Details:", error.details);
  if (error.hint) console.error("Hint:", error.hint);
  process.exit(1);
}
