import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";

/**
 * Daily Digest Edge Function (v2)
 *
 * Purpose: Generate and send daily activity digest emails to sales reps
 * Runs: Daily via pg_cron at 7 AM server time (UTC)
 *
 * V2 Enhancements:
 *   - Uses per-stage stale thresholds from PRD Section 6.3
 *   - Includes stale deals count and detail lists
 *   - Delegates to generate_daily_digest_v2() PostgreSQL function
 *
 * Per-Stage Stale Thresholds:
 *   - new_lead: 7 days
 *   - initial_outreach: 14 days
 *   - sample_visit_offered: 14 days
 *   - feedback_logged: 21 days
 *   - demo_scheduled: 14 days
 *
 * Scheduling: pg_cron configured in migration (0 7 * * *)
 */

interface DigestResult {
  success: boolean;
  digestsGenerated: number;
  notificationsCreated: number;
  executedAt: string;
  version?: string;
}

Deno.serve(async (req) => {
  try {
    console.log("Starting daily digest v2 generation...");

    // Check for manual trigger with specific user (for testing)
    let specificSalesId: number | null = null;
    if (req.method === "POST") {
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

    // If specific user requested, get their digest summary only
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
        sales_id: summary.sales_id,
        tasks_due_today: summary.tasks_due_today,
        tasks_overdue: summary.tasks_overdue,
        stale_deals: summary.stale_deals,
      });

      return new Response(JSON.stringify(summary), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Full digest generation for all users via RPC
    const { data: result, error: rpcError } = await supabaseAdmin.rpc(
      "generate_daily_digest_v2"
    );

    if (rpcError) {
      console.error("Error generating daily digests:", rpcError);
      return new Response(
        JSON.stringify({ error: "Failed to generate digests", details: rpcError }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const digestResult: DigestResult = {
      success: result?.success ?? true,
      digestsGenerated: result?.digestsGenerated ?? 0,
      notificationsCreated: result?.notificationsCreated ?? 0,
      executedAt: result?.executedAt ?? new Date().toISOString(),
      version: "v2",
    };

    console.log("Daily digest v2 generation complete:", digestResult);

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
