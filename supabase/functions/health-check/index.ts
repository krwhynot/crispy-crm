import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";

/**
 * Health Check Edge Function
 *
 * Purpose: Verify critical seed data exists in the database
 * Use cases:
 *   - Monitoring/alerting for production health
 *   - CI/CD deployment verification
 *   - Debugging environment configuration issues
 *
 * Checks performed:
 *   1. All 9 Playbook segments exist (deterministic UUIDs)
 *   2. No required segments are soft-deleted
 *
 * Authentication: None required (returns limited info)
 * With service role: Returns detailed check results
 */

// Required Playbook segments with deterministic UUIDs
// Must match: src/atomic-crm/validation/segments.ts
const REQUIRED_SEGMENTS = [
  { id: "22222222-2222-4222-8222-000000000001", name: "Major Broadline" },
  { id: "22222222-2222-4222-8222-000000000002", name: "Specialty/Regional" },
  { id: "22222222-2222-4222-8222-000000000003", name: "Management Company" },
  { id: "22222222-2222-4222-8222-000000000004", name: "GPO" },
  { id: "22222222-2222-4222-8222-000000000005", name: "University" },
  { id: "22222222-2222-4222-8222-000000000006", name: "Restaurant Group" },
  { id: "22222222-2222-4222-8222-000000000007", name: "Chain Restaurant" },
  { id: "22222222-2222-4222-8222-000000000008", name: "Hotel & Aviation" },
  { id: "22222222-2222-4222-8222-000000000009", name: "Unknown" },
] as const;

interface SegmentCheck {
  id: string;
  name: string;
  status: "ok" | "missing" | "deleted";
}

interface HealthCheckResult {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  checks: {
    segments: {
      status: "pass" | "fail";
      total: number;
      found: number;
      missing: string[];
      deleted: string[];
      details?: SegmentCheck[];
    };
  };
  version: string;
}

// Lazy-init Supabase admin client
let _supabaseAdmin: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    const url = Deno.env.get("LOCAL_SUPABASE_URL") || Deno.env.get("SUPABASE_URL");
    const serviceKey =
      Deno.env.get("LOCAL_SERVICE_ROLE_KEY") ||
      Deno.env.get("SERVICE_ROLE_KEY") ||
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!url || !serviceKey) {
      throw new Error("Missing required environment variables for Supabase admin client");
    }

    _supabaseAdmin = createClient(url, serviceKey, {
      global: {
        headers: { Authorization: `Bearer ${serviceKey}` },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return _supabaseAdmin;
}

// Service role key for detailed responses
const SERVICE_ROLE_KEY =
  Deno.env.get("LOCAL_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

Deno.serve(async (req) => {
  const startTime = Date.now();

  try {
    // Check if caller has service role (for detailed response)
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    const isServiceRole = token === SERVICE_ROLE_KEY;

    const supabaseAdmin = getSupabaseAdmin();

    // Query all required segments in one call
    const segmentIds = REQUIRED_SEGMENTS.map((s) => s.id);
    const { data: foundSegments, error: queryError } = await supabaseAdmin
      .from("segments")
      .select("id, name, deleted_at")
      .in("id", segmentIds);

    if (queryError) {
      console.error("Health check query failed:", queryError);
      return new Response(
        JSON.stringify({
          status: "unhealthy",
          timestamp: new Date().toISOString(),
          error: "Database query failed",
          latency_ms: Date.now() - startTime,
        }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }

    // Build a map of found segments
    const foundMap = new Map(
      (foundSegments || []).map((s: { id: string; name: string; deleted_at: string | null }) => [
        s.id,
        { name: s.name, deleted_at: s.deleted_at },
      ])
    );

    // Check each required segment
    const segmentChecks: SegmentCheck[] = [];
    const missing: string[] = [];
    const deleted: string[] = [];

    for (const required of REQUIRED_SEGMENTS) {
      const found = foundMap.get(required.id);
      if (!found) {
        segmentChecks.push({ id: required.id, name: required.name, status: "missing" });
        missing.push(required.name);
      } else if (found.deleted_at) {
        segmentChecks.push({ id: required.id, name: required.name, status: "deleted" });
        deleted.push(required.name);
      } else {
        segmentChecks.push({ id: required.id, name: required.name, status: "ok" });
      }
    }

    // Determine overall health status
    const foundCount = REQUIRED_SEGMENTS.length - missing.length - deleted.length;
    const segmentsPass = missing.length === 0 && deleted.length === 0;

    let overallStatus: "healthy" | "degraded" | "unhealthy";
    if (segmentsPass) {
      overallStatus = "healthy";
    } else if (foundCount >= REQUIRED_SEGMENTS.length - 1) {
      // Only one segment missing/deleted = degraded
      overallStatus = "degraded";
    } else {
      overallStatus = "unhealthy";
    }

    const result: HealthCheckResult = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks: {
        segments: {
          status: segmentsPass ? "pass" : "fail",
          total: REQUIRED_SEGMENTS.length,
          found: foundCount,
          missing,
          deleted,
          // Only include detailed checks for service role
          ...(isServiceRole && { details: segmentChecks }),
        },
      },
      version: "1.0.0",
    };

    // Log any issues for monitoring
    if (!segmentsPass) {
      console.warn("Health check found issues:", { missing, deleted });
    }

    const httpStatus = overallStatus === "healthy" ? 200 : overallStatus === "degraded" ? 200 : 503;

    return new Response(
      JSON.stringify({
        ...result,
        latency_ms: Date.now() - startTime,
      }),
      {
        status: httpStatus,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Unexpected error in health-check:", error);
    return new Response(
      JSON.stringify({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: "Internal server error",
        latency_ms: Date.now() - startTime,
      }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }
});
