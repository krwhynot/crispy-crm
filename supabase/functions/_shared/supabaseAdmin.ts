import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Lazy initialization to ensure env vars are available at runtime
let _supabaseAdmin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    const url = Deno.env.get("SUPABASE_URL");
    // Try custom secret first (CLI-settable), fallback to auto-injected
    const serviceKey = Deno.env.get("SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    console.log("Initializing supabaseAdmin client");
    console.log("SUPABASE_URL present:", !!url);
    console.log("SUPABASE_SERVICE_ROLE_KEY present:", !!serviceKey);
    console.log("SUPABASE_SERVICE_ROLE_KEY length:", serviceKey?.length ?? 0);

    if (!url || !serviceKey) {
      throw new Error(`Missing env vars: URL=${!!url}, SERVICE_KEY=${!!serviceKey}`);
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

// Legacy export for backward compatibility - now uses lazy init
export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabaseAdmin() as any)[prop];
  },
});
