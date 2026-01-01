import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";

/**
 * Daily Digest Edge Function (v3.0 - Fail-Fast Per User)
 *
 * Purpose: Generate and send daily activity digest notifications to sales reps
 * Runs: Daily via pg_cron at 7 AM UTC (see migration for setup)
 *
 * V3.0 Architecture - Fail-Fast Per User:
 *   - Processes each user INDEPENDENTLY (one user's error doesn't affect others)
 *   - Uses Promise.allSettled for parallel processing with isolated failures
 *   - Respects digest_opt_in user preference (skips opted-out users)
 *   - Skips empty digests (no actionable items)
 *   - Uses per-stage stale thresholds from PRD Section 6.3
 *   - Detailed error reporting per user for debugging
 *
 * Per-Stage Stale Thresholds (PRD Section 6.3):
 *   - new_lead: 7 days
 *   - initial_outreach: 14 days
 *   - sample_visit_offered: 14 days
 *   - feedback_logged: 21 days
 *   - demo_scheduled: 14 days
 *
 * Scheduling: pg_cron + pg_net (0 7 * * *) - see migration file
 *
 * Engineering Constitution Alignment:
 *   - Fail-fast: Errors surface immediately, don't cascade
 *   - No circuit breakers: Each user processed independently
 *   - Explicit error handling at boundaries
 */

interface UserDigestSummary {
  sales_id: number;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  tasks_due_today: number;
  tasks_overdue: number;
  stale_deals: number;
  opportunities_updated_24h: number;
  activities_logged_24h: number;
  overdue_tasks: unknown[];
  stale_deals_list: unknown[];
}

interface SalesUser {
  id: number;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  digest_opt_in: boolean;
}

interface UserProcessingResult {
  salesId: number;
  status: "success" | "skipped_opted_out" | "skipped_empty" | "error";
  notificationCreated: boolean;
  error?: string;
}

interface DigestResult {
  success: boolean;
  usersProcessed: number;
  notificationsCreated: number;
  skippedEmpty: number;
  skippedOptedOut: number;
  errors: Array<{ salesId: number; error: string }>;
  executedAt: string;
  version: string;
}

// Authentication secrets
// LOCAL_ prefixed vars allow Docker container to use host.docker.internal
const CRON_SECRET = Deno.env.get("CRON_SECRET");
const SERVICE_ROLE_KEY =
  Deno.env.get("LOCAL_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

/**
 * Process a single user's digest - FAIL-FAST pattern
 * Each user is processed independently; errors don't cascade
 */
async function processUserDigest(user: SalesUser): Promise<UserProcessingResult> {
  const { id: salesId, user_id: userId, digest_opt_in: optedIn } = user;

  // Check opt-in status first (fast path)
  if (!optedIn) {
    console.log(`User ${salesId} opted out of digests, skipping`);
    return { salesId, status: "skipped_opted_out", notificationCreated: false };
  }

  try {
    // Get digest summary for this user
    const { data: summary, error: summaryError } = await supabaseAdmin.rpc(
      "get_user_digest_summary",
      { p_sales_id: salesId }
    );

    if (summaryError) {
      throw new Error(`RPC error: ${summaryError.message}`);
    }

    if (!summary) {
      throw new Error("User not found or disabled");
    }

    const digestSummary = summary as UserDigestSummary;

    // Check if there's actionable content
    const hasContent =
      digestSummary.tasks_due_today > 0 ||
      digestSummary.tasks_overdue > 0 ||
      digestSummary.stale_deals > 0;

    if (!hasContent) {
      console.log(`User ${salesId}: No actionable items, skipping notification`);
      return { salesId, status: "skipped_empty", notificationCreated: false };
    }

    // Build notification message
    const messageParts: string[] = [];

    if (digestSummary.tasks_due_today > 0) {
      const taskWord = digestSummary.tasks_due_today === 1 ? "task" : "tasks";
      messageParts.push(`${digestSummary.tasks_due_today} ${taskWord} due today`);
    }

    if (digestSummary.tasks_overdue > 0) {
      const taskWord = digestSummary.tasks_overdue === 1 ? "overdue task" : "overdue tasks";
      messageParts.push(`${digestSummary.tasks_overdue} ${taskWord}`);
    }

    if (digestSummary.stale_deals > 0) {
      const dealWord = digestSummary.stale_deals === 1 ? "stale deal" : "stale deals";
      messageParts.push(`${digestSummary.stale_deals} ${dealWord} needing attention`);
    }

    const digestMessage = `Daily Digest: ${messageParts.join(", ")}`;

    // Create notification
    const { error: insertError } = await supabaseAdmin.from("notifications").insert({
      user_id: userId,
      type: "daily_digest",
      message: digestMessage,
      entity_type: "digest",
      metadata: {
        tasksDueToday: digestSummary.tasks_due_today,
        tasksOverdue: digestSummary.tasks_overdue,
        staleDeals: digestSummary.stale_deals,
        opportunitiesUpdated: digestSummary.opportunities_updated_24h,
        activitiesLogged: digestSummary.activities_logged_24h,
        overdueTasks: digestSummary.overdue_tasks,
        staleDealsList: digestSummary.stale_deals_list,
        digestDate: new Date().toISOString().split("T")[0],
        version: "v3",
      },
    });

    if (insertError) {
      throw new Error(`Notification insert failed: ${insertError.message}`);
    }

    console.log(`User ${salesId}: Notification created successfully`);
    return { salesId, status: "success", notificationCreated: true };
  } catch (error) {
    // Fail-fast: Log error and return failure status (don't throw)
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`User ${salesId}: Error processing digest - ${errorMessage}`);
    return { salesId, status: "error", notificationCreated: false, error: errorMessage };
  }
}

Deno.serve(async (req) => {
  const startTime = Date.now();

  try {
    console.log("=== Daily Digest v3.0 (Fail-Fast Per User) ===");
    console.log(`Started at: ${new Date().toISOString()}`);

    // Check for manual trigger with specific user (for testing)
    let specificSalesId: number | null = null;
    if (req.method === "POST") {
      // Manual triggers require authentication
      const authHeader = req.headers.get("Authorization");

      // Check for cron secret OR service role key (internal cron jobs)
      const token = authHeader?.replace("Bearer ", "");
      if (token === CRON_SECRET || token === SERVICE_ROLE_KEY) {
        console.log("Authenticated via cron/service key");
      } else if (authHeader?.startsWith("Bearer ")) {
        // Verify JWT for manual API calls
        // LOCAL_ prefixed vars allow Docker container to use host.docker.internal
        const localClient = createClient(
          Deno.env.get("LOCAL_SUPABASE_URL") || Deno.env.get("SUPABASE_URL") || "",
          Deno.env.get("LOCAL_SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_ANON_KEY") || "",
          { global: { headers: { Authorization: authHeader } } }
        );
        const { data: authData } = await localClient.auth.getUser();

        if (!authData?.user) {
          return new Response(
            JSON.stringify({ error: "Unauthorized - Valid JWT required for manual triggers" }),
            { status: 401, headers: { "Content-Type": "application/json" } }
          );
        }

        // Verify admin role for manual triggers
        const { data: sale } = await supabaseAdmin
          .from("sales")
          .select("administrator")
          .eq("user_id", authData.user.id)
          .single();

        if (!sale?.administrator) {
          return new Response(
            JSON.stringify({ error: "Forbidden - Admin role required for manual triggers" }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          );
        }

        console.log(`Manual trigger by admin user: ${authData.user.id}`);
      } else {
        return new Response(JSON.stringify({ error: "Unauthorized - Authentication required" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      try {
        const body = await req.json();
        if (body.sales_id && typeof body.sales_id === "number") {
          specificSalesId = body.sales_id;
          console.log(`Manual trigger for specific user: ${specificSalesId}`);
        }
      } catch {
        // No body or invalid JSON, proceed with full digest
      }
    }

    // If specific user requested, get their digest summary only (testing mode)
    if (specificSalesId !== null) {
      const { data: summary, error: summaryError } = await supabaseAdmin.rpc(
        "get_user_digest_summary",
        { p_sales_id: specificSalesId }
      );

      if (summaryError) {
        console.error("Error getting user digest summary:", summaryError);
        return new Response(
          JSON.stringify({ error: "Failed to get digest summary", details: summaryError }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      if (!summary) {
        return new Response(
          JSON.stringify({ error: "User not found or disabled", sales_id: specificSalesId }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      console.log("User digest summary retrieved:", {
        sales_id: (summary as UserDigestSummary).sales_id,
        tasks_due_today: (summary as UserDigestSummary).tasks_due_today,
        tasks_overdue: (summary as UserDigestSummary).tasks_overdue,
        stale_deals: (summary as UserDigestSummary).stale_deals,
      });

      return new Response(JSON.stringify(summary), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ========== FULL DIGEST GENERATION (Fail-Fast Per User) ==========

    // Step 1: Fetch all active sales users
    const { data: users, error: usersError } = await supabaseAdmin
      .from("sales")
      .select("id, user_id, first_name, last_name, email, digest_opt_in")
      .eq("disabled", false)
      .not("user_id", "is", null);

    if (usersError) {
      console.error("Error fetching sales users:", usersError);
      return new Response(JSON.stringify({ error: "Failed to fetch users", details: usersError }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!users || users.length === 0) {
      console.log("No active users found");
      return new Response(
        JSON.stringify({
          success: true,
          usersProcessed: 0,
          notificationsCreated: 0,
          skippedEmpty: 0,
          skippedOptedOut: 0,
          errors: [],
          executedAt: new Date().toISOString(),
          version: "v3",
        } as DigestResult),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${users.length} active users...`);

    // Step 2: Process each user independently using Promise.allSettled
    // This ensures one user's failure doesn't affect others
    const processingPromises = users.map((user) => processUserDigest(user as SalesUser));

    const results = await Promise.allSettled(processingPromises);

    // Step 3: Aggregate results
    let notificationsCreated = 0;
    let skippedEmpty = 0;
    let skippedOptedOut = 0;
    const errors: Array<{ salesId: number; error: string }> = [];

    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        const userResult = result.value;
        switch (userResult.status) {
          case "success":
            notificationsCreated++;
            break;
          case "skipped_empty":
            skippedEmpty++;
            break;
          case "skipped_opted_out":
            skippedOptedOut++;
            break;
          case "error":
            errors.push({
              salesId: userResult.salesId,
              error: userResult.error || "Unknown error",
            });
            break;
        }
      } else {
        // Promise itself rejected (shouldn't happen with our try/catch, but handle defensively)
        const user = users[index] as SalesUser;
        errors.push({
          salesId: user.id,
          error: result.reason?.message || "Promise rejected",
        });
      }
    });

    const elapsedMs = Date.now() - startTime;

    const digestResult: DigestResult = {
      success: errors.length === 0,
      usersProcessed: users.length,
      notificationsCreated,
      skippedEmpty,
      skippedOptedOut,
      errors,
      executedAt: new Date().toISOString(),
      version: "v3",
    };

    console.log("=== Daily Digest v3.0 Complete ===");
    console.log(`Users processed: ${users.length}`);
    console.log(`Notifications created: ${notificationsCreated}`);
    console.log(`Skipped (empty): ${skippedEmpty}`);
    console.log(`Skipped (opted out): ${skippedOptedOut}`);
    console.log(`Errors: ${errors.length}`);
    console.log(`Elapsed time: ${elapsedMs}ms`);

    if (errors.length > 0) {
      console.error("User errors:", JSON.stringify(errors, null, 2));
    }

    return new Response(JSON.stringify(digestResult), {
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
