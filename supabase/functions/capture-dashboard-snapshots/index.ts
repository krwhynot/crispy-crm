import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { startOfWeek, endOfWeek, startOfDay } from "npm:date-fns@3";

/**
 * Capture Dashboard Snapshots Edge Function
 *
 * Purpose: Capture daily snapshots of dashboard metrics for historical trend analysis
 * Issue: PERF-02 + FUNC-01 - Week-over-week trends currently inaccurate
 * Runs: Daily via pg_cron at 23:00 UTC (see migration for setup)
 *
 * Architecture:
 *   - Processes each active user INDEPENDENTLY (fail-fast per user)
 *   - Uses Promise.allSettled for resilient parallel processing
 *   - Calculates metrics matching useMyPerformance and useKPIMetrics hooks
 *   - Inserts snapshots using service_role (bypasses RLS)
 *
 * Metrics Captured:
 *   Performance:
 *     - activities_count: Activities logged this week
 *     - tasks_completed_count: Tasks completed this week
 *     - deals_moved_count: Opportunities with stage changes this week
 *     - open_opportunities_count: Current open opportunities
 *   KPIs:
 *     - total_opportunities_count: All opportunities (open + closed)
 *     - overdue_tasks_count: Tasks past due date
 *     - activities_this_week_count: Activities in rolling 7-day window
 *     - stale_deals_count: Deals past stage-specific thresholds
 *
 * Engineering Constitution:
 *   - Fail-fast: Each user's error logged but doesn't block others
 *   - No retries: Single attempt per user per day
 *   - Explicit boundaries: Clear separation between user processing
 */

interface SalesUser {
  id: number;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

interface SnapshotMetrics {
  sales_id: number;
  snapshot_date: string; // ISO date string
  activities_count: number;
  tasks_completed_count: number;
  deals_moved_count: number;
  open_opportunities_count: number;
  total_opportunities_count: number;
  overdue_tasks_count: number;
  activities_this_week_count: number;
  stale_deals_count: number;
}

/**
 * Supabase query result type for count queries
 */
interface SupabaseCountResult {
  count: number | null;
}

/**
 * Opportunity data for stale deals calculation
 */
interface OpportunityStaleData {
  id: string;
  stage: string;
  updated_at: string;
}

// Per-stage stale thresholds (PRD Section 6.3)
const STALE_THRESHOLDS: Record<string, number> = {
  new_lead: 7,
  initial_outreach: 14,
  sample_visit_offered: 14,
  feedback_logged: 21,
  demo_scheduled: 14,
};

/**
 * Calculate metrics for a single user
 */
async function calculateUserMetrics(
  salesId: number,
  snapshotDate: Date
): Promise<Omit<SnapshotMetrics, "sales_id" | "snapshot_date">> {
  const today = startOfDay(snapshotDate);
  const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
  const thisWeekEnd = endOfWeek(today, { weekStartsOn: 1 }); // Sunday

  // Fetch all metrics in parallel using Promise.allSettled
  const [
    activitiesResult,
    tasksCompletedResult,
    dealsMovedResult,
    openOpportunitiesResult,
    totalOpportunitiesResult,
    overdueTasksResult,
    activitiesThisWeekResult,
    staleDealsResult,
  ] = await Promise.allSettled([
    // 1. Activities this week (by created_by)
    supabaseAdmin
      .from("activities")
      .select("id", { count: "exact", head: true })
      .eq("created_by", salesId)
      .gte("activity_date", thisWeekStart.toISOString())
      .lte("activity_date", thisWeekEnd.toISOString())
      .is("deleted_at", null),

    // 2. Tasks completed this week
    supabaseAdmin
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("sales_id", salesId)
      .eq("completed", true)
      .gte("completed_at", thisWeekStart.toISOString())
      .lte("completed_at", thisWeekEnd.toISOString())
      .is("deleted_at", null),

    // 3. Deals moved this week (updated, not closed)
    supabaseAdmin
      .from("opportunities")
      .select("id", { count: "exact", head: true })
      .eq("opportunity_owner_id", salesId)
      .gte("updated_at", thisWeekStart.toISOString())
      .lte("updated_at", thisWeekEnd.toISOString())
      .not("stage", "in", "(closed_won,closed_lost)")
      .is("deleted_at", null),

    // 4. Open opportunities (current snapshot)
    supabaseAdmin
      .from("opportunities")
      .select("id", { count: "exact", head: true })
      .eq("opportunity_owner_id", salesId)
      .not("stage", "in", "(closed_won,closed_lost)")
      .is("deleted_at", null),

    // 5. Total opportunities (for KPI)
    supabaseAdmin
      .from("opportunities")
      .select("id", { count: "exact", head: true })
      .not("stage", "in", "(closed_won,closed_lost)")
      .is("deleted_at", null),

    // 6. Overdue tasks
    supabaseAdmin
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("sales_id", salesId)
      .eq("completed", false)
      .lt("due_date", today.toISOString())
      .is("deleted_at", null),

    // 7. Activities this week (rolling 7-day window) - same as #1 for now
    supabaseAdmin
      .from("activities")
      .select("id", { count: "exact", head: true })
      .eq("created_by", salesId)
      .gte("activity_date", thisWeekStart.toISOString())
      .is("deleted_at", null),

    // 8. Stale deals (requires fetching data to calculate per-stage thresholds)
    supabaseAdmin
      .from("opportunities")
      .select("id, stage, updated_at")
      .eq("opportunity_owner_id", salesId)
      .not("stage", "in", "(closed_won,closed_lost)")
      .is("deleted_at", null),
  ]);

  // Extract counts with fallback to 0
  const getCount = (result: PromiseSettledResult<SupabaseCountResult>): number => {
    if (result.status === "fulfilled" && result.value.count !== null) {
      return result.value.count;
    }
    return 0;
  };

  // Calculate stale deals count
  let staleDealsCount = 0;
  if (staleDealsResult.status === "fulfilled" && staleDealsResult.value.data) {
    const deals = staleDealsResult.value.data as OpportunityStaleData[];
    const now = snapshotDate.getTime();

    staleDealsCount = deals.filter((deal: OpportunityStaleData) => {
      const threshold = STALE_THRESHOLDS[deal.stage] || 14; // Default 14 days
      const lastUpdate = new Date(deal.updated_at).getTime();
      const daysSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60 * 24);
      return daysSinceUpdate > threshold;
    }).length;
  }

  return {
    activities_count: getCount(activitiesResult),
    tasks_completed_count: getCount(tasksCompletedResult),
    deals_moved_count: getCount(dealsMovedResult),
    open_opportunities_count: getCount(openOpportunitiesResult),
    total_opportunities_count: getCount(totalOpportunitiesResult),
    overdue_tasks_count: getCount(overdueTasksResult),
    activities_this_week_count: getCount(activitiesThisWeekResult),
    stale_deals_count: staleDealsCount,
  };
}

/**
 * Process snapshot for a single user
 */
async function captureUserSnapshot(
  user: SalesUser,
  snapshotDate: Date
): Promise<{ success: boolean; error?: string }> {
  try {
    const metrics = await calculateUserMetrics(user.id, snapshotDate);

    const snapshot: SnapshotMetrics = {
      sales_id: user.id,
      snapshot_date: snapshotDate.toISOString().split("T")[0], // Date only
      ...metrics,
    };

    // Insert snapshot (using upsert to handle re-runs)
    const { error } = await supabaseAdmin.from("dashboard_snapshots").upsert(snapshot, {
      onConflict: "sales_id,snapshot_date",
      ignoreDuplicates: false, // Update if exists
    });

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error(`Failed to capture snapshot for user ${user.id}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

Deno.serve(async (req) => {
  try {
    // Verify authorization (internal cron job or service role)
    const authHeader = req.headers.get("Authorization");
    // LOCAL_ prefixed vars allow Docker container to use host.docker.internal
    const serviceKey =
      Deno.env.get("LOCAL_SERVICE_ROLE_KEY") ||
      Deno.env.get("SERVICE_ROLE_KEY") ||
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!authHeader?.includes(serviceKey || "")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get snapshot date (default to today)
    const url = new URL(req.url);
    const dateParam = url.searchParams.get("date");
    const snapshotDate = dateParam ? new Date(dateParam) : new Date();

    console.log(`Starting snapshot capture for date: ${snapshotDate.toISOString().split("T")[0]}`);

    // Fetch all active sales users
    const { data: users, error: usersError } = await supabaseAdmin
      .from("sales")
      .select("id, user_id, first_name, last_name, email")
      .is("deleted_at", null)
      .order("id");

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`);
    }

    if (!users || users.length === 0) {
      return new Response(
        JSON.stringify({ message: "No active users found", snapshots_created: 0 }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${users.length} users...`);

    // Process all users in parallel with fail-fast per user
    const results = await Promise.allSettled(
      users.map((user) => captureUserSnapshot(user, snapshotDate))
    );

    // Aggregate results
    const summary = {
      total_users: users.length,
      successful: 0,
      failed: 0,
      errors: [] as Array<{ user_id: number; error: string }>,
    };

    results.forEach((result, index) => {
      if (result.status === "fulfilled" && result.value.success) {
        summary.successful++;
      } else {
        summary.failed++;
        const error =
          result.status === "fulfilled"
            ? result.value.error
            : result.reason instanceof Error
              ? result.reason.message
              : String(result.reason);
        summary.errors.push({
          user_id: users[index].id,
          error: error || "Unknown error",
        });
      }
    });

    console.log(
      `Snapshot capture complete: ${summary.successful}/${summary.total_users} succeeded`
    );

    // Return success even if some users failed (fail-fast per user)
    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Fatal error in snapshot capture:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
