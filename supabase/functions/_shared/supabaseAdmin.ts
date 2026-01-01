import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Lazy initialization to ensure env vars are available at runtime
let _supabaseAdmin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    // LOCAL_ prefixed vars allow Docker container to use host.docker.internal
    // (Supabase CLI blocks SUPABASE_* prefixed vars in .env files for security)
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

// Legacy export for backward compatibility - now uses lazy init
export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabaseAdmin() as any)[prop];
  },
});
