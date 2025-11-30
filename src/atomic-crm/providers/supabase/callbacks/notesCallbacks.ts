/**
 * Notes Resource Lifecycle Callbacks
 *
 * Generic callbacks for contact_notes, opportunity_notes, and organization_notes.
 * All note types share the same lifecycle behavior:
 * 1. Soft delete - Sets deleted_at instead of hard delete
 * 2. No computed fields (notes are simple text records)
 *
 * Engineering Constitution: DRY - one factory for all note types
 */

import {
  createResourceCallbacks,
  type ResourceCallbacks,
} from "./createResourceCallbacks";

/**
 * Note resource types supported by this factory
 */
export type NoteResourceType =
  | "contactNotes"
  | "contact_notes"
  | "opportunityNotes"
  | "opportunity_notes"
  | "organizationNotes"
  | "organization_notes";

/**
 * Create callbacks for a note resource
 *
 * All note types use identical lifecycle behavior:
 * - Soft delete enabled
 * - No computed fields to strip
 * - No custom transforms needed
 *
 * @param resource - The note resource name (e.g., 'contact_notes')
 * @returns ResourceCallbacks for use with withLifecycleCallbacks
 */
export function createNotesCallbacks(resource: NoteResourceType): ResourceCallbacks {
  return createResourceCallbacks({
    resource,
    supportsSoftDelete: true,
    // Notes are simple - no computed fields or transforms needed
  });
}

/**
 * Pre-built callbacks for each note type
 * These map to database table names (snake_case)
 */
export const contactNotesCallbacks = createNotesCallbacks("contact_notes");
export const opportunityNotesCallbacks = createNotesCallbacks("opportunity_notes");
export const organizationNotesCallbacks = createNotesCallbacks("organization_notes");
