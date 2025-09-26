/**
 * CORS Configuration for Supabase Edge Functions
 *
 * This configuration replaces the security-vulnerable wildcard CORS policy
 * with a secure domain allowlist that validates origins dynamically based
 * on environment configuration.
 */

// Default allowed origins for development and production environments
const DEFAULT_DEVELOPMENT_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

const DEFAULT_PRODUCTION_ORIGINS = [
  // Production domains will be added via environment variables
];

/**
 * Parse allowed origins from environment variable
 * Expected format: comma-separated list of origins
 * Example: "https://app.atomic-crm.com,https://staging.atomic-crm.com"
 */
function parseAllowedOrigins(): string[] {
  const envOrigins = Deno.env.get("ALLOWED_ORIGINS");

  if (!envOrigins) {
    // Default to development origins in local environment
    const isProduction = Deno.env.get("DENO_ENV") === "production";
    return isProduction
      ? DEFAULT_PRODUCTION_ORIGINS
      : DEFAULT_DEVELOPMENT_ORIGINS;
  }

  return envOrigins
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

/**
 * Validate if an origin is allowed based on the allowlist
 */
function isOriginAllowed(
  origin: string | null,
  allowedOrigins: string[],
): boolean {
  if (!origin) {
    return false;
  }

  return allowedOrigins.includes(origin);
}

/**
 * Generate CORS headers with dynamic origin validation
 * This replaces the insecure "*" wildcard with proper origin validation
 */
export function createCorsHeaders(
  requestOrigin?: string | null,
): Record<string, string> {
  const allowedOrigins = parseAllowedOrigins();

  // Determine the allowed origin for this request
  let allowOrigin = "null"; // Default fallback

  if (requestOrigin && isOriginAllowed(requestOrigin, allowedOrigins)) {
    allowOrigin = requestOrigin;
  } else if (allowedOrigins.length > 0) {
    // For development, allow the first origin as fallback
    const isDevelopment = Deno.env.get("DENO_ENV") !== "production";
    if (isDevelopment && allowedOrigins.includes("http://localhost:5173")) {
      allowOrigin = "http://localhost:5173";
    }
  }

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, PATCH, DELETE",
    "Access-Control-Allow-Credentials": "true",
  };
}

/**
 * Legacy export for backward compatibility
 * @deprecated Use createCorsHeaders() instead for proper origin validation
 */
export const corsHeaders = createCorsHeaders();

/**
 * Get allowed origins for debugging/logging purposes
 */
export function getAllowedOrigins(): string[] {
  return parseAllowedOrigins();
}
