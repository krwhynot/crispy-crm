import { useListContext } from "ra-core";
import * as React from "react";

import { Separator } from "@/components/ui/separator";
import { SidepaneEmptyState } from "@/components/layouts/sidepane/SidepaneEmptyState";
import { EMPTY_STATE_CONTENT } from "@/components/layouts/sidepane/empty-state-content";
import { Note } from "./Note";

interface NotesListProps {
  showEmptyState?: boolean;
}

/**
 * Displays a list of notes from the current ListContext.
 *
 * Extracted from NotesIterator to allow the NoteCreate form to always be visible
 * even when there are no notes (solving the ReferenceManyField empty prop issue).
 */
export const NotesList = ({ showEmptyState = false }: NotesListProps) => {
  const { data, error, isPending } = useListContext();

  if (isPending || error) return null;

  // Show empty state when no notes and showEmptyState is enabled
  if (showEmptyState && (!data || data.length === 0)) {
    return (
      <div className="mt-4">
        <SidepaneEmptyState
          title={EMPTY_STATE_CONTENT.notes.title}
          description={EMPTY_STATE_CONTENT.notes.description}
        />
      </div>
    );
  }

  // No notes and empty state disabled - render nothing
  if (!data || data.length === 0) return null;

  return (
    <div className="mt-4 space-y-4">
      {data.map((note, index) => (
        <React.Fragment key={note.id}>
          <Note note={note} isLast={index === data.length - 1} />
          {index < data.length - 1 && <Separator />}
        </React.Fragment>
      ))}
    </div>
  );
};
