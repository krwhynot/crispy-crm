/**
 * useContactImportUpload - File upload hook for CSV import
 *
 * Extracted from ContactImportDialog.tsx to:
 * 1. Reduce component complexity (716 → <300 lines)
 * 2. Isolate file validation logic for reusability
 * 3. Enable unit testing of upload behavior
 *
 * Responsibilities:
 * - File selection handling
 * - CSV security validation
 * - Error state management
 */

import { useCallback } from "react";
import type { WizardActions } from "./useImportWizard";
import { validateCsvFile } from "../utils/csvUploadValidator";

export interface UseContactImportUploadProps {
  wizardActions: WizardActions;
}

/**
 * Hook for handling CSV file upload with security validation.
 *
 * @example
 * ```tsx
 * const { handleFileChange } = useContactImportUpload({ wizardActions });
 *
 * <FileInput onChange={handleFileChange} />
 * ```
 */
export function useContactImportUpload({ wizardActions }: UseContactImportUploadProps) {
  /**
   * Handle file selection with validation.
   * Validates file security (size, MIME, content) before accepting.
   */
  const handleFileChange = useCallback(
    async (file: File | null) => {
      if (!file) {
        wizardActions.reset();
        return;
      }

      // SECURITY: Validate file before processing
      const validation = await validateCsvFile(file);

      if (!validation.valid && validation.errors) {
        wizardActions.selectFile(file, validation.errors, []);
        return;
      }

      // File is valid - store with any warnings
      wizardActions.selectFile(file, [], validation.warnings || []);
    },
    [wizardActions]
  );

  return {
    handleFileChange,
  };
}
