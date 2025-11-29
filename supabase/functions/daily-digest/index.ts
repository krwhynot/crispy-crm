import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";

/**
 * Daily Digest Edge Function
 *
 * Purpose: Generate and send daily activity digest emails to sales reps
 * Runs: Daily via pg_cron at 7 AM server time (UTC)
 *
 * Process:
 * 1. Query all active sales users
 * 2. For each user, aggregate:
 *    - Tasks due today
 *    - Tasks overdue
 *    - Opportunities updated in last 24h
 *    - Activities logged yesterday
 * 3. Generate digest summary
 * 4. Create notification records (email sending is Phase 2)
 *
 * Scheduling: pg_cron configured in migration (0 7 * * *)
 */

interface SalesUser {
  id: number;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface DigestData {
  user: SalesUser;
  tasksDueToday: number;
  tasksOverdue: number;
  opportunitiesUpdated: number;
  activitiesYesterday: number;
}

interface DigestResult {
  success: boolean;
  digestsGenerated: number;
  notificationsCreated: number;
  executedAt: string;
  details?: DigestData[];
}

Deno.serve(async (_req) => {
  try {
    console.log("Starting daily digest generation...");

    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString().split("T")[0]; // YYYY-MM-DD

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayISO = yesterday.toISOString().split("T")[0];

    // 1. Query all active sales users
    const { data: salesUsers, error: salesError } = await supabaseAdmin
      .from("sales")
      .select("id, user_id, first_name, last_name, email")
      .eq("disabled", false);

    if (salesError) {
      console.error("Error querying sales users:", salesError);
      return new Response(
        JSON.stringify({ error: "Failed to query sales users", details: salesError }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!salesUsers || salesUsers.length === 0) {
      console.log("No active sales users found");
      return new Response(
        JSON.stringify({ message: "No active sales users", digestsGenerated: 0 }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${salesUsers.length} active sales users`);

    const digests: DigestData[] = [];
    const notifications: Array<{
      user_id: string;
      type: string;
      message: string;
      entity_type: string;
      entity_id: number | null;
      metadata: Record<string, unknown>;
    }> = [];

    // 2. Generate digest for each user
    for (const user of salesUsers as SalesUser[]) {
      // Tasks due today
      const { count: tasksDueToday } = await supabaseAdmin
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("sales_id", user.id)
        .eq("due_date", todayISO)
        .eq("completed", false);

      // Tasks overdue
      const { count: tasksOverdue } = await supabaseAdmin
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("sales_id", user.id)
        .lt("due_date", todayISO)
        .eq("completed", false);

      // Opportunities updated in last 24h
      const { count: opportunitiesUpdated } = await supabaseAdmin
        .from("opportunities")
        .select("*", { count: "exact", head: true })
        .eq("sales_id", user.id)
        .gte("updated_at", yesterdayISO)
        .lt("updated_at", todayISO);

      // Activities logged yesterday
      const { count: activitiesYesterday } = await supabaseAdmin
        .from("activities")
        .select("*", { count: "exact", head: true })
        .eq("sales_id", user.id)
        .gte("date", yesterdayISO)
        .lt("date", todayISO);

      const digestData: DigestData = {
        user,
        tasksDueToday: tasksDueToday ?? 0,
        tasksOverdue: tasksOverdue ?? 0,
        opportunitiesUpdated: opportunitiesUpdated ?? 0,
        activitiesYesterday: activitiesYesterday ?? 0,
      };

      digests.push(digestData);

      // 3. Create notification for digest (only if there's something to report)
      const hasContent =
        digestData.tasksDueToday > 0 ||
        digestData.tasksOverdue > 0 ||
        digestData.opportunitiesUpdated > 0 ||
        digestData.activitiesYesterday > 0;

      if (hasContent) {
        const messageParts: string[] = [];
        if (digestData.tasksDueToday > 0) {
          messageParts.push(`${digestData.tasksDueToday} task${digestData.tasksDueToday === 1 ? "" : "s"} due today`);
        }
        if (digestData.tasksOverdue > 0) {
          messageParts.push(`${digestData.tasksOverdue} overdue task${digestData.tasksOverdue === 1 ? "" : "s"}`);
        }
        if (digestData.opportunitiesUpdated > 0) {
          messageParts.push(`${digestData.opportunitiesUpdated} opportunity update${digestData.opportunitiesUpdated === 1 ? "" : "s"}`);
        }

        notifications.push({
          user_id: user.user_id,
          type: "daily_digest",
          message: `Daily Digest: ${messageParts.join(", ")}`,
          entity_type: "digest",
          entity_id: null,
          metadata: {
            tasksDueToday: digestData.tasksDueToday,
            tasksOverdue: digestData.tasksOverdue,
            opportunitiesUpdated: digestData.opportunitiesUpdated,
            activitiesYesterday: digestData.activitiesYesterday,
            digestDate: todayISO,
          },
        });
      }
    }

    // 4. Insert notifications
    if (notifications.length > 0) {
      const { error: notifError } = await supabaseAdmin
        .from("notifications")
        .insert(notifications);

      if (notifError) {
        console.error("Error creating digest notifications:", notifError);
        return new Response(
          JSON.stringify({ error: "Failed to create notifications", details: notifError }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      console.log(`Created ${notifications.length} digest notifications`);
    }

    const result: DigestResult = {
      success: true,
      digestsGenerated: digests.length,
      notificationsCreated: notifications.length,
      executedAt: now.toISOString(),
    };

    console.log("Daily digest generation complete:", result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error in daily-digest:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: (error as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
