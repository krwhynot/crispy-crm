/* eslint-disable react-refresh/only-export-components -- React Admin resource config requires mixed exports */

/**
 * Tags Module - Simple lookup entity for categorizing contacts, opportunities, and organizations.
 *
 * Architecture Decision: TagShow intentionally omitted
 * ─────────────────────────────────────────────────────
 * Tags are ultra-simple entities (id, name, color) with no relationships or computed fields.
 * A dedicated Show view would:
 *   - Display only name + color preview (already visible in TagList row)
 *   - Add unnecessary friction (extra click to view read-only data)
 *   - Provide no additional context (no related entities to display)
 *
 * Pattern: Follows tasks/resource.tsx which also omits Show for similar reasons.
 * UX: TagList uses rowClick="edit" - users go directly to Edit for full context.
 *
 * If future requirements add tag relationships (e.g., "show all contacts with this tag"),
 * revisit this decision and implement TagShow.tsx with those relationships.
 */

// CRUD components for admin management
export { TagList } from "./TagList";
export { TagCreate } from "./TagCreate";
export { TagEdit } from "./TagEdit";
export { TagInputs } from "./TagInputs";

// Existing tag components (not modified)
export { TagSelectWithCreate } from "./TagSelectWithCreate";
export { TagChip } from "./TagChip";
export { TagDialog } from "./TagDialog";
export { RoundButton } from "./RoundButton";
