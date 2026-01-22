/**
 * Notes Module - Embedded note components for contacts, opportunities, and organizations
 *
 * Architecture: Notes are embedded components, NOT standalone React Admin resources.
 * They are displayed within parent resources (contacts, opportunities, organizations).
 *
 * Exports:
 * - NoteCreate: Form for creating new notes within a parent context
 * - NotesList: Displays list of notes from ListContext
 * - NotesIterator: Combines NoteCreate + NotesList (primary usage pattern)
 *
 * Intentionally NOT exported:
 * - Note: Internal component used by NotesList (handles inline editing via useUpdate)
 * - NoteInputs: Internal form inputs shared between Note and NoteCreate
 *
 * NoteEdit.tsx intentionally omitted:
 * - Editing is handled inline within Note.tsx via isEditing state + useUpdate hook
 * - Notes don't have standalone routes - they're always embedded in parent resources
 */
export * from "./NoteCreate";
export * from "./NotesList";
export * from "./NotesIterator";
