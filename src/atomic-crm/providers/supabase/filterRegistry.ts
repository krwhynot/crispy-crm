/**
 * Filter Registry - DEPRECATED ENTRY POINT
 *
 * This file has been split into domain-specific modules for better maintainability.
 * All exports are re-exported from the new filters/ directory.
 *
 * Migration Date: 2026-01-25
 * New Location: src/atomic-crm/providers/supabase/filters/
 *
 * To use the new imports, update your code:
 * ```typescript
 * // OLD (still works via re-export)
 * import { filterableFields, getFilterableFields } from '@/atomic-crm/providers/supabase/filterRegistry';
 *
 * // NEW (preferred)
 * import { filterableFields, getFilterableFields } from '@/atomic-crm/providers/supabase/filters';
 * ```
 *
 * This file maintains backward compatibility and will be removed in a future version.
 */

// Re-export everything from the new filters module
export * from "./filters";
