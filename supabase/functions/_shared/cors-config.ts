/**
 * CORS Configuration for Supabase Edge Functions
 *
 * This configuration validates origins dynamically based on environment.
 * Production domains are explicitly allowlisted for security.
 */

// Allowed origins for development environments
const DEVELOPMENT_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

// Allowed origins for production environments
// IMPORTANT: Add all production domains here
const PRODUCTION_ORIGINS = [
  "https://crispy-crm.vercel.app",
  "https://www.crispy-crm.vercel.app",
];

/**
 * Get all allowed origins (both dev and prod, plus any from env var)
 * Expected env format: comma-separated list of origins
 * Example: "https://app.atomic-crm.com,https://staging.atomic-crm.com"
 */
function getAllAllowedOrigins(): string[] {
  const envOrigins = Deno.env.get("ALLOWED_ORIGINS");

  // Start with built-in origins (both dev and prod for flexibility)
  const origins = [...DEVELOPMENT_ORIGINS, ...PRODUCTION_ORIGINS];

  // Add any additional origins from environment variable
  if (envOrigins) {
    const additionalOrigins = envOrigins
      .split(",")
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0);
    origins.push(...additionalOrigins);
  }

  return origins;
}

/**
 * Validate if an origin is allowed based on the allowlist
 */
function isOriginAllowed(origin: string | null, allowedOrigins: string[]): boolean {
  if (!origin) {
    return false;
  }
  return allowedOrigins.includes(origin);
}

/**
 * Generate CORS headers with dynamic origin validation
 * Returns the request origin if allowed, otherwise falls back to first allowed origin
 */
export function createCorsHeaders(requestOrigin?: string | null): Record<string, string> {
  const allowedOrigins = getAllAllowedOrigins();

  // Determine the allowed origin for this request
  let allowOrigin: string;

  if (requestOrigin && isOriginAllowed(requestOrigin, allowedOrigins)) {
    // Request origin is in allowlist - echo it back
    allowOrigin = requestOrigin;
  } else if (allowedOrigins.length > 0) {
    // Fallback to first allowed origin (for development)
    allowOrigin = allowedOrigins[0];
  } else {
    // Ultimate fallback
    allowOrigin = "http://localhost:5173";
  }

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, PATCH, DELETE, OPTIONS",
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
  return getAllAllowedOrigins();
}
