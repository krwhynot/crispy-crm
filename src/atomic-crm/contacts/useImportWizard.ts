/**
 * useImportWizard - State machine hook for CSV import wizard
 *
 * Implements a discriminated union state machine pattern:
 * - Pure reducer function with no side effects
 * - Exhaustive switch statements for type safety
 * - Invalid transitions return unchanged state
 * - All state transitions are explicit and predictable
 *
 * State flow:
 * IDLE → FILE_SELECTED → PARSING → PREVIEW → IMPORTING → COMPLETE
 *                            ↓          ↓           ↓
 *                          ERROR      IDLE       ERROR
 *
 * @see useImportWizard.types.ts for type definitions
 */

import { useReducer, useCallback, useMemo, useRef, useEffect } from "react";
import type { WizardState, WizardAction, ImportProgress } from "./useImportWizard.types";
import { deriveWizardFlags } from "./useImportWizard.types";
import { importWizardReducer, createInitialState } from "./reducers/importWizardReducer";
import { createWizardActions } from "./actions/importWizardActions";
import type { WizardActions } from "./actions/importWizardActions";

// ============================================================
// HOOK IMPLEMENTATION
// ============================================================

/**
 * Hook for managing CSV import wizard state with AbortController support.
 *
 * Provides:
 * - `state`: Current wizard state (discriminated union)
 * - `actions`: Type-safe action creators with stable references
 * - `flags`: Derived boolean flags for UI conditions
 * - `abortSignal`: AbortSignal for cancelling async operations
 * - `isAborted`: Check if current operation was aborted
 *
 * @example
 * ```tsx
 * const { state, actions, flags, abortSignal, isAborted } = useImportWizard();
 *
 * // Access state based on step
 * if (state.step === "preview") {
 *   console.log(state.previewData.validCount);
 * }
 *
 * // Use derived flags
 * if (flags.showPreview) {
 *   return <PreviewDialog data={state.previewData} />;
 * }
 *
 * // Dispatch actions
 * actions.selectFile(file);
 * actions.startImport(contacts.length);
 *
 * // Check abort signal in async loops
 * for (const batch of batches) {
 *   if (isAborted()) break;
 *   await processBatch(batch, { signal: abortSignal });
 * }
 * ```
 */
export function useImportWizard() {
  const [state, dispatch] = useReducer(importWizardReducer, undefined, createInitialState);

  // AbortController for cancelling async operations
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Creates a new AbortController for the current operation.
   * Aborts any previous controller first.
   */
  const createAbortController = useCallback(() => {
    // Abort any existing operation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    // Create fresh controller
    abortControllerRef.current = new AbortController();
    return abortControllerRef.current;
  }, []);

  /**
   * Aborts the current operation and resets the controller.
   */
  const abortCurrentOperation = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  /**
   * Check if the current operation was aborted.
   * Returns stable function reference.
   */
  const isAborted = useCallback(() => {
    return abortControllerRef.current?.signal.aborted ?? false;
  }, []);

  /**
   * Get the current abort signal for passing to async operations.
   * Returns null if no operation is active.
   */
  const getAbortSignal = useCallback(() => {
    return abortControllerRef.current?.signal ?? null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  // Memoize actions with stable references using useCallback wrappers
  const actions = useMemo(() => {
    const baseActions = createWizardActions(dispatch);

    return {
      ...baseActions,

      /**
       * Start parsing - creates new AbortController.
       * Override to manage abort lifecycle.
       */
      startParsing: () => {
        createAbortController();
        baseActions.startParsing();
      },

      /**
       * Start import - creates new AbortController.
       * Override to manage abort lifecycle.
       */
      startImport: (totalContacts: number) => {
        createAbortController();
        baseActions.startImport(totalContacts);
      },

      /**
       * Cancel - aborts current operation and dispatches CANCEL.
       * Override to abort async operations.
       */
      cancel: () => {
        abortCurrentOperation();
        baseActions.cancel();
      },

      /**
       * Reset - aborts current operation and dispatches RESET.
       * Override to abort async operations.
       */
      reset: () => {
        abortCurrentOperation();
        baseActions.reset();
      },
    };
  }, [createAbortController, abortCurrentOperation]);

  // Derive boolean flags from state
  const flags = useMemo(() => deriveWizardFlags(state), [state]);

  return {
    state,
    actions,
    flags,
    dispatch, // Expose raw dispatch for advanced use cases
    // Abort controller utilities
    abortSignal: getAbortSignal(),
    isAborted,
    getAbortSignal,
  };
}

// ============================================================
// TYPE EXPORTS
// ============================================================

export type { WizardState, WizardAction, ImportProgress };
export type WizardActions = ReturnType<typeof createWizardActions>;
