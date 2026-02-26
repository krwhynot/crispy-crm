import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { createCorsHeaders } from "../_shared/cors-config.ts";
import { createErrorResponse, createJsonResponse } from "../_shared/utils.ts";

Deno.serve(async (req: Request) => {
  const corsHeaders = createCorsHeaders(req.headers.get("origin"));

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "PATCH") {
    return createErrorResponse(405, "Method Not Allowed", corsHeaders);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return createErrorResponse(401, "Missing or invalid Authorization header", corsHeaders);
  }

  const supabaseUrl = Deno.env.get("LOCAL_SUPABASE_URL") || Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey =
    Deno.env.get("LOCAL_SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing environment variables");
    return createErrorResponse(500, "Server configuration error", corsHeaders);
  }

  const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: authHeader },
    },
  });

  const { data: authData, error: authError } = await supabaseClient.auth.getUser();

  if (authError || !authData?.user) {
    console.error("Auth error:", authError?.message);
    return createErrorResponse(401, "Invalid or expired token", corsHeaders);
  }

  const callerUser = authData.user;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return createErrorResponse(400, "Invalid JSON body", corsHeaders);
  }

  // Admin-initiated reset: body contains target_email
  if (body.target_email) {
    const targetEmail = String(body.target_email);

    // Verify caller is admin
    const { data: callerSale, error: saleError } = await supabaseClient
      .rpc("get_sale_by_user_id", { target_user_id: callerUser.id })
      .single();

    if (saleError || !callerSale) {
      console.error("Sales lookup error:", saleError?.message ?? "User not found");
      return createErrorResponse(401, "User profile not found", corsHeaders);
    }

    if (callerSale.role !== "admin") {
      return createErrorResponse(403, "Only admins can reset other users' passwords", corsHeaders);
    }

    const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(targetEmail);

    if (resetError) {
      console.error("Password reset error:", resetError.message);
      return createErrorResponse(500, "Failed to send password reset email", corsHeaders);
    }

    return createJsonResponse({ success: true }, corsHeaders);
  }

  // Self-service reset: send reset email to the authenticated caller
  if (!callerUser.email) {
    return createErrorResponse(400, "No email associated with authenticated user", corsHeaders);
  }

  const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(callerUser.email);

  if (resetError) {
    console.error("Password reset error:", resetError.message);
    return createErrorResponse(500, "Failed to send password reset email", corsHeaders);
  }

  return createJsonResponse({ success: true }, corsHeaders);
});
