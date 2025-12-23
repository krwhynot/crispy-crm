import { useState, useCallback } from "react";
import { useFormState } from "react-hook-form";

/**
 * Hook to warn users before discarding unsaved form changes during in-app navigation.
 * Must be used inside a Form context (child of FormProvider).
 *
 * @returns Object with warning state and handlers
 */
export function useInAppUnsavedChanges() {
  const { isDirty } = useFormState();
  const [showWarning, setShowWarning] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const handlePotentialDiscard = useCallback((action: () => void) => {
    if (isDirty) {
      setPendingAction(() => action);
      setShowWarning(true);
    } else {
      action();
    }
  }, [isDirty]);

  const confirmDiscard = useCallback(() => {
    setShowWarning(false);
    pendingAction?.();
    setPendingAction(null);
  }, [pendingAction]);

  const cancelDiscard = useCallback(() => {
    setShowWarning(false);
    setPendingAction(null);
  }, []);

  return {
    showWarning,
    isDirty,
    confirmDiscard,
    cancelDiscard,
    handlePotentialDiscard,
  };
}
