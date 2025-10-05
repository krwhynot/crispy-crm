import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { createCorsHeaders } from "../_shared/cors-config.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";

function createErrorResponse(status: number, message: string, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify({ status, message }), {
    headers: { "Content-Type": "application/json", ...corsHeaders },
    status,
  });
}

async function updatePassword(user: any, corsHeaders: Record<string, string>) {
  const { data, error } = await supabaseAdmin.auth.resetPasswordForEmail(
    user.email,
  );

  if (!data || error) {
    return createErrorResponse(500, "Internal Server Error", corsHeaders);
  }

  return new Response(
    JSON.stringify({
      data,
    }),
    {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    },
  );
}

Deno.serve(async (req: Request) => {
  // Generate secure CORS headers based on request origin
  const corsHeaders = createCorsHeaders(req.headers.get("origin"));

  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  const authHeader = req.headers.get("Authorization")!;
  const localClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data } = await localClient.auth.getUser();
  if (!data?.user) {
    return createErrorResponse(401, "Unauthorized", corsHeaders);
  }

  if (req.method === "PATCH") {
    return updatePassword(data.user, corsHeaders);
  }

  return createErrorResponse(405, "Method Not Allowed", corsHeaders);
});
