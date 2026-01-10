/**
 * useContactImportProcessor - Import batch processing hook
 *
 * Extracted from ContactImportDialog.tsx to:
 * 1. Isolate batch processing logic
 * 2. Encapsulate rate limiting and progress tracking
 * 3. Enable testing of import flow
 *
 * Responsibilities:
 * - Batch processing of contacts
 * - Progress tracking and accumulation
 * - Rate limit validation
 * - Abort signal handling
 */

import { useCallback } from "react";
import { useRefresh } from "ra-core";
import type { ContactImportSchema } from "./useContactImport";
import type { DataQualityDecisions } from "./ContactImportPreview";
import type { WizardState, WizardActions } from "./useImportWizard";
import { useContactImport } from "./useContactImport";
import { contactImportLimiter } from "../utils/rateLimiter";

export interface UseContactImportProcessorProps {
  wizardState: WizardState;
  wizardActions: WizardActions;
  isAborted: () => boolean;
}

/**
 * Hook for processing contact import batches.
 *
 * @example
 * ```tsx
 * const { processBatch, handlePreviewContinue } = useContactImportProcessor({
 *   wizardState,
 *   wizardActions,
 *   isAborted,
 * });
 *
 * // Start import from preview
 * await handlePreviewContinue(decisions, contacts);
 * ```
 */
export function useContactImportProcessor({
  wizardState,
  wizardActions,
  isAborted,
}: UseContactImportProcessorProps) {
  const refresh = useRefresh();
  const processBatchHook = useContactImport();

  /**
   * Process a single batch of contacts during import.
   * Updates wizard state with accumulated results.
   */
  const processBatch = useCallback(
    async (batch: ContactImportSchema[], dataQualityDecisions: DataQualityDecisions) => {
      if (wizardState.step !== "importing") return;

      try {
        const result = await processBatchHook(batch, {
          preview: false,
          startingRow: wizardState.rowOffset + 1,
          dataQualityDecisions,
          onProgress: () => {
            // Progress is updated at batch level, not per-contact
          },
        });

        // Accumulate results in wizard state
        wizardActions.accumulateResult({
          batchProcessed: result.totalProcessed,
          batchSuccess: result.successCount,
          batchSkipped: result.skippedCount,
          batchFailed: result.failedCount,
          batchErrors: result.errors,
          batchSize: batch.length,
        });
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "A critical error occurred during batch processing.";
        const batchStartRow = wizardState.rowOffset + 1;

        // Add an error entry for each contact in the failed batch
        const batchErrors = batch.map((contactData, index) => ({
          row: batchStartRow + index,
          data: contactData,
          errors: [{ field: "batch_processing", message: errorMessage }],
        }));

        wizardActions.accumulateResult({
          batchProcessed: batch.length,
          batchSuccess: 0,
          batchSkipped: 0,
          batchFailed: batch.length,
          batchErrors,
          batchSize: batch.length,
        });
      }
    },
    [processBatchHook, wizardState, wizardActions]
  );

  /**
   * Handle preview confirmation - start the actual import.
   * Validates rate limits and processes contacts in batches.
   */
  const handlePreviewContinue = useCallback(
    async (decisions: DataQualityDecisions, contacts: ContactImportSchema[]) => {
      // SECURITY: Check rate limit before starting import
      if (!contactImportLimiter.canProceed()) {
        const resetTime = contactImportLimiter.getResetTimeFormatted();
        const remaining = contactImportLimiter.getRemaining();
        alert(
          `Import rate limit exceeded.\n\n` +
            `You have ${remaining} imports remaining.\n` +
            `Rate limit resets in ${resetTime}.\n\n` +
            `This limit prevents accidental bulk data corruption and protects database performance.`
        );
        return;
      }

      // Update data quality decisions in wizard state
      wizardActions.updateDataQualityDecisions(decisions);

      // Transition to importing state
      wizardActions.startImport(contacts.length);

      // Process contacts in batches with abort support
      const batchSize = 10;
      for (let i = 0; i < contacts.length; i += batchSize) {
        // Check if operation was cancelled
        if (isAborted()) {
          // Don't mark as complete - user cancelled
          return;
        }

        const batch = contacts.slice(i, i + batchSize);
        await processBatch(batch, decisions);
        wizardActions.updateProgress(i + batch.length);
      }

      // Check abort one final time before marking complete
      if (isAborted()) {
        return;
      }

      // Mark import as complete
      wizardActions.importComplete();
      refresh();
    },
    [processBatch, refresh, wizardActions, isAborted]
  );

  return {
    processBatch,
    handlePreviewContinue,
  };
}
