/**
 * Re-export handlers from atomic-crm location
 *
 * ARCHITECTURE NOTE: Handlers are implemented in src/atomic-crm/providers/supabase/handlers/
 * This re-export satisfies the expected top-level structure from PROVIDER_RULES.md
 */
export * from "@/atomic-crm/providers/supabase/handlers";
