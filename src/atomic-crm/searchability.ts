/**
 * Searchability helpers — neutral module consumed by both UI and provider layers.
 *
 * Avoids coupling layout components to provider internals (resources.ts).
 */
import { SEARCHABLE_RESOURCES, getResourceName } from "./providers/supabase/resources";

/**
 * Check whether a resource supports text search (FTS or ILIKE).
 *
 * Resolves aliases via `getResourceName()` and checks both direct key
 * and base/summary pair in `SEARCHABLE_RESOURCES`.
 */
export function isResourceSearchable(resource: string): boolean {
  const resolved = getResourceName(resource);

  // Direct hit
  if (resolved in SEARCHABLE_RESOURCES) {
    return true;
  }

  // Try base name if resolved is a _summary variant
  const base = resolved.replace(/_summary$/, "");
  if (base !== resolved && base in SEARCHABLE_RESOURCES) {
    return true;
  }

  // Try _summary variant if resolved is a base name
  const summary = `${resolved}_summary`;
  if (summary in SEARCHABLE_RESOURCES) {
    return true;
  }

  return false;
}
