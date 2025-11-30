import { useCallback } from "react";

interface UseFormShortcutsProps {
  onSave: () => void;
  onSaveAndNew?: () => void;
  onCancel: () => void;
}

interface UseFormShortcutsReturn {
  handleKeyDown: (e: React.KeyboardEvent) => void;
}

export const useFormShortcuts = ({
  onSave,
  onSaveAndNew,
  onCancel,
}: UseFormShortcutsProps): UseFormShortcutsReturn => {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTextarea = target.tagName === "TEXTAREA";
      const isContentEditable = target.contentEditable === "true";

      // Cmd+Enter (or Ctrl+Enter on Windows/Linux)
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        // Cmd+Shift+Enter: Save and New
        if (e.shiftKey && onSaveAndNew) {
          e.preventDefault();
          onSaveAndNew();
          return;
        }

        // Cmd+Enter: Save (works in textareas too)
        if (!e.shiftKey) {
          e.preventDefault();
          onSave();
          return;
        }
      }

      // Escape: Cancel (but NOT in textarea or contentEditable)
      if (e.key === "Escape") {
        if (!isTextarea && !isContentEditable) {
          e.preventDefault();
          onCancel();
        }
      }
    },
    [onSave, onSaveAndNew, onCancel]
  );

  return { handleKeyDown };
};
