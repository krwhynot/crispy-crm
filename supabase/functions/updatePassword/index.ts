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
  const { data, error } = await supabaseAdmin.auth.resetPasswordForEmail(user.email);

  if (!data || error) {
    return createErrorResponse(500, "Internal Server Error", corsHeaders);
  }

  return new Response(
    JSON.stringify({
      data,
    }),
    {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    }
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

  // Extract and validate Authorization header
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return createErrorResponse(401, "Unauthorized - No auth header", corsHeaders);
  }

  // Extract JWT token from "Bearer <token>" format
  const token = authHeader.replace("Bearer ", "");
  if (!token || token === authHeader) {
    return createErrorResponse(401, "Unauthorized - Invalid auth format", corsHeaders);
  }

  // CORRECT PATTERN (per Supabase docs): Create user-context client with ANON_KEY
  // This client has the user's auth context set via the Authorization header
  // LOCAL_ prefixed vars allow Docker container to use host.docker.internal
  const supabaseClient = createClient(
    Deno.env.get("LOCAL_SUPABASE_URL") || Deno.env.get("SUPABASE_URL") || "",
    Deno.env.get("LOCAL_SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_ANON_KEY") || "",
    {
      global: {
        headers: { Authorization: authHeader },
      },
    }
  );

  // Validate JWT using user-context client (NOT supabaseAdmin)
  const { data, error: authError } = await supabaseClient.auth.getUser(token);
  if (!data?.user || authError) {
    return createErrorResponse(401, "Unauthorized - getUser failed", corsHeaders);
  }

  if (req.method === "PATCH") {
    return updatePassword(data.user, corsHeaders);
  }

  return createErrorResponse(405, "Method Not Allowed", corsHeaders);
});
