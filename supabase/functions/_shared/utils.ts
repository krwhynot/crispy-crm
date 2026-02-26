/**
 * Shared Edge Function utilities.
 *
 * CORS: Use createCorsHeaders() from cors-config.ts for dynamic origin
 * validation. The legacy wildcard corsHeaders export is removed.
 */

export function createErrorResponse(
  status: number,
  message: string,
  corsHeaders: Record<string, string>
) {
  return new Response(JSON.stringify({ status, message }), {
    headers: { "Content-Type": "application/json", ...corsHeaders },
    status,
  });
}

export function createJsonResponse(
  data: unknown,
  corsHeaders: Record<string, string>,
  status = 200
) {
  return new Response(JSON.stringify({ data }), {
    headers: { "Content-Type": "application/json", ...corsHeaders },
    status,
  });
}
