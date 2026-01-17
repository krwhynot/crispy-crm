import { NoteCreate } from "./NoteCreate";
import { NotesList } from "./NotesList";

interface NotesIteratorProps {
  reference: "contacts" | "opportunities" | "organizations";
  showEmptyState?: boolean;
}

/**
 * Combines NoteCreate form with NotesList.
 *
 * The showEmptyState prop controls whether to display an empty state message
 * when there are no notes. This should be true when using ReferenceManyField
 * without the `empty` prop (to avoid hiding the create form).
 */
export const NotesIterator = ({
  reference,
  showEmptyState = false,
}: NotesIteratorProps) => {
  return (
    <div className="mt-4">
      <NoteCreate reference={reference} />
      <NotesList showEmptyState={showEmptyState} />
    </div>
  );
};
