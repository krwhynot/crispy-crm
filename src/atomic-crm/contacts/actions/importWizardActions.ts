/**
 * Action creators for import wizard state machine.
 *
 * Provides type-safe action creator functions that dispatch properly typed actions.
 * All action creators return void and dispatch immediately.
 *
 * @see ../useImportWizard.types.ts for action type definitions
 */

import type { WizardAction } from "../useImportWizard.types";
import type { PreviewData } from "../ContactImportPreview";
import type { CsvValidationError } from "../../utils/csvUploadValidator";

// ============================================================
// ACTION CREATORS
// ============================================================

/**
 * Creates type-safe action creators for wizard transitions.
 * These are memoized functions that create properly typed actions.
 *
 * @param dispatch - React dispatch function for wizard actions
 * @returns Object with action creator methods
 */
export function createWizardActions(dispatch: React.Dispatch<WizardAction>) {
  return {
    /**
     * Select a file for import.
     *
     * @param file - The CSV file to import
     * @param validationErrors - Validation errors from file upload
     * @param validationWarnings - Validation warnings from file upload
     */
    selectFile: (
      file: File,
      validationErrors: CsvValidationError[] = [],
      validationWarnings: string[] = []
    ) => {
      dispatch({
        type: "SELECT_FILE",
        payload: { file, validationErrors, validationWarnings },
      });
    },

    /**
     * Clear the selected file.
     * Transitions: FILE_SELECTED → IDLE
     */
    clearFile: () => {
      dispatch({ type: "CLEAR_FILE" });
    },

    /**
     * Start parsing the selected file.
     * Transitions: FILE_SELECTED → PARSING
     */
    startParsing: () => {
      dispatch({ type: "START_PARSING" });
    },

    /**
     * Mark parsing as complete with preview data.
     * Transitions: PARSING → PREVIEW
     *
     * @param previewData - Parsed and validated preview data
     */
    parsingComplete: (previewData: PreviewData) => {
      dispatch({ type: "PARSING_COMPLETE", payload: { previewData } });
    },

    /**
     * Mark parsing as failed with error.
     * Transitions: PARSING → ERROR
     *
     * @param error - Error that occurred during parsing
     */
    parsingFailed: (error: Error) => {
      dispatch({ type: "PARSING_FAILED", payload: { error } });
    },

    /**
     * Update preview data (e.g., when column mappings change).
     * Transitions: PREVIEW → PREVIEW (same step, updated data)
     *
     * @param previewData - Updated preview data
     */
    updatePreview: (previewData: PreviewData) => {
      dispatch({ type: "UPDATE_PREVIEW", payload: { previewData } });
    },

    /**
     * Update data quality decisions.
     * Transitions: PREVIEW → PREVIEW (same step, updated decisions)
     *
     * @param decisions - Data quality import decisions
     */
    updateDataQualityDecisions: (decisions: {
      importOrganizationsWithoutContacts: boolean;
      importContactsWithoutContactInfo: boolean;
    }) => {
      dispatch({ type: "UPDATE_DATA_QUALITY_DECISIONS", payload: { decisions } });
    },

    /**
     * Start the import process.
     * Transitions: PREVIEW → IMPORTING
     *
     * @param totalContacts - Total number of contacts to import
     */
    startImport: (totalContacts: number) => {
      dispatch({ type: "START_IMPORT", payload: { totalContacts } });
    },

    /**
     * Update import progress.
     * Transitions: IMPORTING → IMPORTING (same step, updated progress)
     *
     * @param count - Number of contacts processed so far
     */
    updateProgress: (count: number) => {
      dispatch({ type: "UPDATE_PROGRESS", payload: { count } });
    },

    /**
     * Accumulate batch results.
     * Transitions: IMPORTING → IMPORTING (same step, accumulated results)
     *
     * @param payload - Batch processing results
     */
    accumulateResult: (payload: {
      batchProcessed: number;
      batchSuccess: number;
      batchSkipped: number;
      batchFailed: number;
      batchErrors: Array<{
        row: number;
        data: unknown;
        errors: Array<{ field: string; message: string }>;
      }>;
      batchSize: number;
    }) => {
      dispatch({ type: "ACCUMULATE_RESULT", payload });
    },

    /**
     * Mark import as complete.
     * Transitions: IMPORTING → COMPLETE
     */
    importComplete: () => {
      dispatch({ type: "IMPORT_COMPLETE" });
    },

    /**
     * Mark import as failed with error.
     * Transitions: IMPORTING → ERROR
     *
     * @param error - Error that occurred during import
     */
    importFailed: (error: Error) => {
      dispatch({ type: "IMPORT_FAILED", payload: { error } });
    },

    /**
     * Cancel current operation.
     * Transitions: PREVIEW|IMPORTING → IDLE
     */
    cancel: () => {
      dispatch({ type: "CANCEL" });
    },

    /**
     * Reset wizard to initial state.
     * Transitions: * → IDLE
     */
    reset: () => {
      dispatch({ type: "RESET" });
    },
  };
}

/**
 * Type of the actions object returned by createWizardActions.
 */
export type WizardActions = ReturnType<typeof createWizardActions>;
