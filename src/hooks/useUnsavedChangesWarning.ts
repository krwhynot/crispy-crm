import { useEffect } from "react";
import { useFormState } from "react-hook-form";

/**
 * Hook to warn users before leaving a page with unsaved form changes.
 * Must be used inside a Form context (child of FormProvider).
 *
 * @param enabled - Whether the warning is active (default: true)
 * @returns Object containing isDirty state
 */
export function useUnsavedChangesWarning(enabled = true) {
  const { isDirty } = useFormState();

  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty, enabled]);

  return { isDirty };
}
