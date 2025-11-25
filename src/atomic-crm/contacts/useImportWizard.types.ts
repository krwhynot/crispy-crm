/**
 * Discriminated union types for the Import Wizard state machine.
 *
 * This pattern makes illegal states UNREPRESENTABLE at the type level:
 * - Each state variant carries only its relevant data
 * - TypeScript enforces exhaustive handling in switch statements
 * - State transitions are explicit and type-safe
 *
 * @see https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions
 */

import type { ImportResult, ImportError, DataQualityDecisions } from "./contactImport.types";
import type { PreviewData } from "./ContactImportPreview";
import type { CsvValidationError } from "../utils/csvUploadValidator";

// ============================================================
// STATE DISCRIMINANTS
// ============================================================

/**
 * All possible wizard steps as a literal union.
 * Used as the discriminant property in WizardState.
 */
export type WizardStep =
  | "idle"
  | "file_selected"
  | "parsing"
  | "preview"
  | "importing"
  | "complete"
  | "error";

// ============================================================
// PROGRESS & ACCUMULATED RESULT TYPES
// ============================================================

/**
 * Progress tracking for batch import operations.
 */
export interface ImportProgress {
  /** Number of contacts processed so far */
  count: number;
  /** Total contacts to process */
  total: number;
}

/**
 * Accumulated results across all import batches.
 * Mutable during import, frozen when complete.
 */
export interface AccumulatedResult {
  totalProcessed: number;
  successCount: number;
  skippedCount: number;
  failedCount: number;
  errors: ImportError[];
  startTime: Date | null;
}

/**
 * Initial accumulated result state.
 */
export const INITIAL_ACCUMULATED_RESULT: AccumulatedResult = {
  totalProcessed: 0,
  successCount: 0,
  skippedCount: 0,
  failedCount: 0,
  errors: [],
  startTime: null,
};

// ============================================================
// WIZARD STATE DISCRIMINATED UNION
// ============================================================

/**
 * IDLE: Initial state, no file selected.
 *
 * Transitions to: FILE_SELECTED (when file is selected)
 */
export interface WizardStateIdle {
  step: "idle";
}

/**
 * FILE_SELECTED: File has been selected and validated.
 *
 * Transitions to:
 * - PARSING (when Import button clicked)
 * - IDLE (when file is cleared)
 */
export interface WizardStateFileSelected {
  step: "file_selected";
  file: File;
  validationErrors: CsvValidationError[];
  validationWarnings: string[];
}

/**
 * PARSING: CSV file is being parsed by PapaParse.
 *
 * Transitions to:
 * - PREVIEW (when parsing completes successfully)
 * - ERROR (when parsing fails)
 */
export interface WizardStateParsing {
  step: "parsing";
  file: File;
}

/**
 * PREVIEW: Parsed data is being previewed before import.
 *
 * Transitions to:
 * - IMPORTING (when user confirms)
 * - IDLE (when user cancels)
 */
export interface WizardStatePreview {
  step: "preview";
  file: File;
  previewData: PreviewData;
  dataQualityDecisions: DataQualityDecisions;
}

/**
 * IMPORTING: Contacts are being imported in batches.
 *
 * Transitions to:
 * - COMPLETE (when all batches finish)
 * - ERROR (when fatal error occurs)
 */
export interface WizardStateImporting {
  step: "importing";
  file: File;
  progress: ImportProgress;
  accumulated: AccumulatedResult;
  /** Current row offset for batch tracking */
  rowOffset: number;
}

/**
 * COMPLETE: Import finished (success or partial failure).
 *
 * Transitions to:
 * - IDLE (when dialog is closed)
 */
export interface WizardStateComplete {
  step: "complete";
  result: ImportResult;
}

/**
 * ERROR: Fatal error occurred during parsing or import.
 *
 * Transitions to:
 * - IDLE (when dialog is closed)
 */
export interface WizardStateError {
  step: "error";
  error: Error;
  /** The step where the error occurred */
  previousStep: Exclude<WizardStep, "error">;
}

/**
 * Discriminated union of all wizard states.
 *
 * Usage with exhaustive checking:
 * ```typescript
 * switch (state.step) {
 *   case "idle": // state is WizardStateIdle
 *   case "file_selected": // state is WizardStateFileSelected
 *   case "parsing": // state is WizardStateParsing
 *   case "preview": // state is WizardStatePreview
 *   case "importing": // state is WizardStateImporting
 *   case "complete": // state is WizardStateComplete
 *   case "error": // state is WizardStateError
 *   default: assertNever(state); // TypeScript ensures exhaustiveness
 * }
 * ```
 */
export type WizardState =
  | WizardStateIdle
  | WizardStateFileSelected
  | WizardStateParsing
  | WizardStatePreview
  | WizardStateImporting
  | WizardStateComplete
  | WizardStateError;

// ============================================================
// ACTION TYPES
// ============================================================

/**
 * All possible wizard action types as a literal union.
 */
export type WizardActionType =
  | "SELECT_FILE"
  | "CLEAR_FILE"
  | "START_PARSING"
  | "PARSING_COMPLETE"
  | "PARSING_FAILED"
  | "UPDATE_PREVIEW"
  | "UPDATE_DATA_QUALITY_DECISIONS"
  | "START_IMPORT"
  | "UPDATE_PROGRESS"
  | "ACCUMULATE_RESULT"
  | "IMPORT_COMPLETE"
  | "IMPORT_FAILED"
  | "CANCEL"
  | "RESET";

/**
 * Action: Select a file for import.
 * Transition: IDLE → FILE_SELECTED
 */
export interface ActionSelectFile {
  type: "SELECT_FILE";
  payload: {
    file: File;
    validationErrors: CsvValidationError[];
    validationWarnings: string[];
  };
}

/**
 * Action: Clear the selected file.
 * Transition: FILE_SELECTED → IDLE
 */
export interface ActionClearFile {
  type: "CLEAR_FILE";
}

/**
 * Action: Start parsing the CSV file.
 * Transition: FILE_SELECTED → PARSING
 */
export interface ActionStartParsing {
  type: "START_PARSING";
}

/**
 * Action: Parsing completed successfully.
 * Transition: PARSING → PREVIEW
 */
export interface ActionParsingComplete {
  type: "PARSING_COMPLETE";
  payload: {
    previewData: PreviewData;
  };
}

/**
 * Action: Parsing failed with error.
 * Transition: PARSING → ERROR
 */
export interface ActionParsingFailed {
  type: "PARSING_FAILED";
  payload: {
    error: Error;
  };
}

/**
 * Action: Update preview data (e.g., when column mappings change).
 * Transition: PREVIEW → PREVIEW (same step, updated data)
 */
export interface ActionUpdatePreview {
  type: "UPDATE_PREVIEW";
  payload: {
    previewData: PreviewData;
  };
}

/**
 * Action: Update data quality decisions.
 * Transition: PREVIEW → PREVIEW (same step, updated decisions)
 */
export interface ActionUpdateDataQualityDecisions {
  type: "UPDATE_DATA_QUALITY_DECISIONS";
  payload: {
    decisions: DataQualityDecisions;
  };
}

/**
 * Action: Start the import process.
 * Transition: PREVIEW → IMPORTING
 */
export interface ActionStartImport {
  type: "START_IMPORT";
  payload: {
    totalContacts: number;
  };
}

/**
 * Action: Update import progress.
 * Transition: IMPORTING → IMPORTING (same step, updated progress)
 */
export interface ActionUpdateProgress {
  type: "UPDATE_PROGRESS";
  payload: {
    count: number;
  };
}

/**
 * Action: Accumulate batch results.
 * Transition: IMPORTING → IMPORTING (same step, accumulated results)
 */
export interface ActionAccumulateResult {
  type: "ACCUMULATE_RESULT";
  payload: {
    batchProcessed: number;
    batchSuccess: number;
    batchSkipped: number;
    batchFailed: number;
    batchErrors: ImportError[];
    batchSize: number;
  };
}

/**
 * Action: Import completed.
 * Transition: IMPORTING → COMPLETE
 */
export interface ActionImportComplete {
  type: "IMPORT_COMPLETE";
}

/**
 * Action: Import failed with fatal error.
 * Transition: IMPORTING → ERROR
 */
export interface ActionImportFailed {
  type: "IMPORT_FAILED";
  payload: {
    error: Error;
  };
}

/**
 * Action: Cancel current operation.
 * Transition: PREVIEW|IMPORTING → IDLE
 */
export interface ActionCancel {
  type: "CANCEL";
}

/**
 * Action: Reset to initial state.
 * Transition: * → IDLE
 */
export interface ActionReset {
  type: "RESET";
}

/**
 * Discriminated union of all wizard actions.
 */
export type WizardAction =
  | ActionSelectFile
  | ActionClearFile
  | ActionStartParsing
  | ActionParsingComplete
  | ActionParsingFailed
  | ActionUpdatePreview
  | ActionUpdateDataQualityDecisions
  | ActionStartImport
  | ActionUpdateProgress
  | ActionAccumulateResult
  | ActionImportComplete
  | ActionImportFailed
  | ActionCancel
  | ActionReset;

// ============================================================
// TYPE GUARDS & UTILITIES
// ============================================================

/**
 * Exhaustive check helper for switch statements.
 * TypeScript will error if any case is not handled.
 *
 * @example
 * switch (state.step) {
 *   case "idle": return <IdleView />;
 *   case "file_selected": return <FileView />;
 *   // ...
 *   default: return assertNever(state);
 * }
 */
export function assertNever(value: never): never {
  throw new Error(`Unhandled discriminated union member: ${JSON.stringify(value)}`);
}

/**
 * Type guard: Check if state allows file selection.
 */
export function canSelectFile(state: WizardState): state is WizardStateIdle {
  return state.step === "idle";
}

/**
 * Type guard: Check if state allows starting import.
 */
export function canStartImport(
  state: WizardState
): state is WizardStateFileSelected | WizardStatePreview {
  return state.step === "file_selected" || state.step === "preview";
}

/**
 * Type guard: Check if state is cancellable.
 */
export function canCancel(state: WizardState): state is WizardStatePreview | WizardStateImporting {
  return state.step === "preview" || state.step === "importing";
}

/**
 * Type guard: Check if state has a file.
 */
export function hasFile(
  state: WizardState
): state is
  | WizardStateFileSelected
  | WizardStateParsing
  | WizardStatePreview
  | WizardStateImporting {
  return (
    state.step === "file_selected" ||
    state.step === "parsing" ||
    state.step === "preview" ||
    state.step === "importing"
  );
}

/**
 * Type guard: Check if state is in a terminal state (complete or error).
 */
export function isTerminal(state: WizardState): state is WizardStateComplete | WizardStateError {
  return state.step === "complete" || state.step === "error";
}

/**
 * Type guard: Check if state is actively processing.
 */
export function isProcessing(
  state: WizardState
): state is WizardStateParsing | WizardStateImporting {
  return state.step === "parsing" || state.step === "importing";
}

// ============================================================
// INITIAL STATE
// ============================================================

/**
 * Initial wizard state.
 */
export const INITIAL_WIZARD_STATE: WizardStateIdle = {
  step: "idle",
};

// ============================================================
// STATE DERIVATION HELPERS
// ============================================================

/**
 * Derive boolean flags from wizard state.
 * These replace the multiple useState booleans in the original implementation.
 */
export function deriveWizardFlags(state: WizardState) {
  return {
    /** True if preview dialog should be shown */
    showPreview: state.step === "preview",
    /** True if result dialog should be shown */
    showResult: state.step === "complete",
    /** True if import is in progress */
    isImporting: state.step === "importing",
    /** True if parsing is in progress */
    isParsing: state.step === "parsing",
    /** True if in error state */
    hasError: state.step === "error",
    /** True if a file is selected */
    hasFile: hasFile(state),
    /** True if in a terminal state */
    isTerminal: isTerminal(state),
    /** True if actively processing */
    isProcessing: isProcessing(state),
  };
}
