import { useEffect } from "react";
import { useFormState } from "react-hook-form";

interface DirtyStateTrackerProps {
  onDirtyChange?: (isDirty: boolean) => void;
}

/**
 * Place this component INSIDE a Form context to track dirty state
 * and report it to a parent component outside the form.
 *
 * Usage:
 * ```tsx
 * <Form>
 *   <DirtyStateTracker onDirtyChange={onDirtyChange} />
 *   <TextInput source="name" />
 * </Form>
 * ```
 *
 * Why a separate component? React hooks rules require hooks at the top level.
 * Since tabs conditionally render Form based on mode, we can't call useFormState()
 * in the tab component itself. This extracted component solves that.
 */
export function DirtyStateTracker({ onDirtyChange }: DirtyStateTrackerProps) {
  const { isDirty } = useFormState();

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  return null;
}
