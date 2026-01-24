import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";

/**
 * Supabase Client Initialization
 * Phase 1 Security Remediation:
 * - Removed dangerous environment variable logging
 * - Added proper validation with fail-fast behavior
 * - Only logs project ID in development (never logs keys)
 */

// SECURITY: Only log minimal info in development, never log keys
if (import.meta.env.DEV) {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const projectId = url?.split(".")[0]?.split("//")[1] || "unknown";
  logger.debug("Initializing Supabase project", { feature: "Supabase", projectId });
  // Never log API keys, even partially
}

// Validate required environment variables (fail fast)
const requiredEnvVars = ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY"];
const missing = requiredEnvVars.filter((key) => !import.meta.env[key]);

if (missing.length > 0) {
  const message = `Missing required environment variables: ${missing.join(", ")}`;
  logger.error("Supabase configuration error", undefined, {
    feature: "Supabase",
    missingVars: missing,
  });
  throw new Error(message);
}

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);
