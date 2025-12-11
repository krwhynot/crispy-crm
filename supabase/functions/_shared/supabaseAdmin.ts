import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Lazy initialization to ensure env vars are available at runtime
let _supabaseAdmin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    const url = Deno.env.get("SUPABASE_URL");
    // Try custom secret first (CLI-settable), fallback to auto-injected
    const serviceKey = Deno.env.get("SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    console.log("=== SUPABASE ADMIN INIT (v2 - Auth Header Fix) ===");
    console.log("SUPABASE_URL present:", !!url);
    console.log("SERVICE_ROLE_KEY present:", !!serviceKey);
    console.log("SERVICE_ROLE_KEY length:", serviceKey?.length ?? 0);
    console.log("SERVICE_ROLE_KEY prefix:", serviceKey?.substring(0, 20) ?? "MISSING");

    if (!url || !serviceKey) {
      throw new Error(`Missing env vars: URL=${!!url}, SERVICE_KEY=${!!serviceKey}`);
    }

    // CRITICAL: Authorization header is required for PostgREST role switching
    const authHeader = `Bearer ${serviceKey}`;
    console.log("Setting Authorization header, length:", authHeader.length);

    _supabaseAdmin = createClient(url, serviceKey, {
      global: {
        headers: { Authorization: authHeader },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log("=== SUPABASE ADMIN INITIALIZED ===");
  }
  return _supabaseAdmin;
}

// Legacy export for backward compatibility - now uses lazy init
export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabaseAdmin() as any)[prop];
  },
});
