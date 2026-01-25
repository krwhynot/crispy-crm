/**
 * Reducer for import wizard state machine.
 *
 * Pure reducer function implementing a discriminated union state machine pattern:
 * - No side effects - only returns new state
 * - Invalid transitions return unchanged state (same reference)
 * - Exhaustive handling of all action types per state
 * - Immutable updates - never mutates input state
 *
 * State flow:
 * IDLE → FILE_SELECTED → PARSING → PREVIEW → IMPORTING → COMPLETE
 *                            ↓          ↓           ↓
 *                          ERROR      IDLE       ERROR
 *
 * @see ../useImportWizard.types.ts for type definitions
 */

import type {
  WizardState,
  WizardAction,
  WizardStateIdle,
  WizardStateFileSelected,
  WizardStateParsing,
  WizardStatePreview,
  WizardStateImporting,
  WizardStateComplete,
  WizardStateError,
} from "../useImportWizard.types";
import { INITIAL_ACCUMULATED_RESULT, assertNever } from "../useImportWizard.types";
import type { ImportResult } from "../contactImport.types";

// ============================================================
// INITIAL STATE FACTORY
// ============================================================

/**
 * Creates the initial wizard state.
 * Returns a new object each time to ensure immutability.
 */
export function createInitialState(): WizardStateIdle {
  return { step: "idle" };
}

// ============================================================
// MAIN REDUCER
// ============================================================

/**
 * Pure reducer function for the import wizard state machine.
 *
 * Design principles:
 * 1. No side effects - only returns new state
 * 2. Invalid transitions return unchanged state (same reference)
 * 3. Exhaustive handling of all action types per state
 * 4. Immutable updates - never mutates input state
 *
 * @param state - Current wizard state
 * @param action - Action to process
 * @returns New state (or same reference if action is invalid for current state)
 */
export function importWizardReducer(state: WizardState, action: WizardAction): WizardState {
  // Handle RESET action from any state
  if (action.type === "RESET") {
    return createInitialState();
  }

  // Dispatch to state-specific handlers
  switch (state.step) {
    case "idle":
      return reduceIdleState(state, action);

    case "file_selected":
      return reduceFileSelectedState(state, action);

    case "parsing":
      return reduceParsingState(state, action);

    case "preview":
      return reducePreviewState(state, action);

    case "importing":
      return reduceImportingState(state, action);

    case "complete":
      return reduceCompleteState(state, action);

    case "error":
      return reduceErrorState(state, action);

    default:
      // TypeScript exhaustive check
      return assertNever(state);
  }
}

// ============================================================
// STATE-SPECIFIC REDUCERS
// ============================================================

/**
 * Handles actions when in IDLE state.
 * Valid transitions: SELECT_FILE → file_selected
 */
function reduceIdleState(state: WizardStateIdle, action: WizardAction): WizardState {
  switch (action.type) {
    case "SELECT_FILE":
      return {
        step: "file_selected",
        file: action.payload.file,
        validationErrors: action.payload.validationErrors,
        validationWarnings: action.payload.validationWarnings,
      };

    default:
      // Invalid action for this state - return unchanged
      return state;
  }
}

/**
 * Handles actions when in FILE_SELECTED state.
 * Valid transitions:
 * - START_PARSING → parsing
 * - CLEAR_FILE → idle
 * - SELECT_FILE → file_selected (replace file)
 */
function reduceFileSelectedState(
  state: WizardStateFileSelected,
  action: WizardAction
): WizardState {
  switch (action.type) {
    case "START_PARSING":
      return {
        step: "parsing",
        file: state.file,
      };

    case "CLEAR_FILE":
      return createInitialState();

    case "SELECT_FILE":
      // Allow replacing file
      return {
        step: "file_selected",
        file: action.payload.file,
        validationErrors: action.payload.validationErrors,
        validationWarnings: action.payload.validationWarnings,
      };

    default:
      return state;
  }
}

/**
 * Handles actions when in PARSING state.
 * Valid transitions:
 * - PARSING_COMPLETE → preview
 * - PARSING_FAILED → error
 * - CANCEL → idle
 */
function reduceParsingState(state: WizardStateParsing, action: WizardAction): WizardState {
  switch (action.type) {
    case "PARSING_COMPLETE":
      return {
        step: "preview",
        file: state.file,
        previewData: action.payload.previewData,
        dataQualityDecisions: {
          importOrganizationsWithoutContacts: false,
          importContactsWithoutContactInfo: false,
        },
      };

    case "PARSING_FAILED":
      return {
        step: "error",
        error: action.payload.error,
        previousStep: "parsing",
      };

    case "CANCEL":
      return createInitialState();

    default:
      return state;
  }
}

/**
 * Handles actions when in PREVIEW state.
 * Valid transitions:
 * - START_IMPORT → importing
 * - UPDATE_PREVIEW → preview (updated)
 * - UPDATE_DATA_QUALITY_DECISIONS → preview (updated)
 * - CANCEL → idle
 */
function reducePreviewState(state: WizardStatePreview, action: WizardAction): WizardState {
  switch (action.type) {
    case "START_IMPORT":
      return {
        step: "importing",
        file: state.file,
        progress: {
          count: 0,
          total: action.payload.totalContacts,
        },
        accumulated: {
          ...INITIAL_ACCUMULATED_RESULT,
          startTime: new Date(),
        },
        rowOffset: 0,
      };

    case "UPDATE_PREVIEW":
      return {
        ...state,
        previewData: action.payload.previewData,
      };

    case "UPDATE_DATA_QUALITY_DECISIONS":
      return {
        ...state,
        dataQualityDecisions: action.payload.decisions,
      };

    case "CANCEL":
      return createInitialState();

    default:
      return state;
  }
}

/**
 * Handles actions when in IMPORTING state.
 * Valid transitions:
 * - UPDATE_PROGRESS → importing (updated)
 * - ACCUMULATE_RESULT → importing (updated)
 * - IMPORT_COMPLETE → complete
 * - IMPORT_FAILED → error
 * - CANCEL → idle
 */
function reduceImportingState(state: WizardStateImporting, action: WizardAction): WizardState {
  switch (action.type) {
    case "UPDATE_PROGRESS":
      return {
        ...state,
        progress: {
          ...state.progress,
          count: action.payload.count,
        },
      };

    case "ACCUMULATE_RESULT": {
      const { batchProcessed, batchSuccess, batchSkipped, batchFailed, batchErrors, batchSize } =
        action.payload;

      return {
        ...state,
        accumulated: {
          ...state.accumulated,
          totalProcessed: state.accumulated.totalProcessed + batchProcessed,
          successCount: state.accumulated.successCount + batchSuccess,
          skippedCount: state.accumulated.skippedCount + batchSkipped,
          failedCount: state.accumulated.failedCount + batchFailed,
          errors: [...state.accumulated.errors, ...batchErrors],
        },
        rowOffset: state.rowOffset + batchSize,
      };
    }

    case "IMPORT_COMPLETE": {
      const endTime = new Date();
      const startTime = state.accumulated.startTime || endTime;
      const duration = endTime.getTime() - startTime.getTime();

      const result: ImportResult = {
        totalProcessed: state.accumulated.totalProcessed,
        successCount: state.accumulated.successCount,
        skippedCount: state.accumulated.skippedCount,
        failedCount: state.accumulated.failedCount,
        errors: state.accumulated.errors,
        duration,
        startTime,
        endTime,
      };

      return {
        step: "complete",
        result,
      };
    }

    case "IMPORT_FAILED":
      return {
        step: "error",
        error: action.payload.error,
        previousStep: "importing",
      };

    case "CANCEL":
      return createInitialState();

    default:
      return state;
  }
}

/**
 * Handles actions when in COMPLETE state.
 * Valid transitions: (only RESET, handled globally)
 */
function reduceCompleteState(state: WizardStateComplete, _action: WizardAction): WizardState {
  // No valid transitions from complete except RESET (handled globally)
  return state;
}

/**
 * Handles actions when in ERROR state.
 * Valid transitions: (only RESET, handled globally)
 */
function reduceErrorState(state: WizardStateError, _action: WizardAction): WizardState {
  // No valid transitions from error except RESET (handled globally)
  return state;
}
