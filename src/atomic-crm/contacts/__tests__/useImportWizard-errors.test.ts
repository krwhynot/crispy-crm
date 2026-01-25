/**
 * Unit tests for useImportWizard - Error Handling and Hook Behavior
 *
 * Tests cover:
 * - ERROR state transitions
 * - Edge cases (null startTime, immutability)
 * - IMPORT_FAILED action
 * - useImportWizard hook (AbortController, stable references)
 *
 * @see useImportWizard.ts
 * @see useImportWizard.types.ts
 */

import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { importWizardReducer } from "../reducers/importWizardReducer";
import { useImportWizard } from "../useImportWizard";
import type {
  WizardState,
  WizardAction,
  WizardStateIdle,
  WizardStateImporting,
} from "../useImportWizard.types";
import { INITIAL_ACCUMULATED_RESULT } from "../useImportWizard.types";
import type { PreviewData } from "../ContactImportPreview";

// ============================================================
// TEST FIXTURES
// ============================================================

const mockFile = new File(["test,data"], "test.csv", { type: "text/csv" });

const mockPreviewData: PreviewData = {
  mappings: [{ source: "Name", target: "first_name", confidence: 1.0 }],
  sampleRows: [{ first_name: "John" }],
  validCount: 10,
  skipCount: 0,
  totalRows: 10,
  errors: [],
  warnings: [],
  newOrganizations: ["Acme Inc"],
  newTags: ["VIP"],
  hasErrors: false,
  lowConfidenceMappings: 0,
  organizationsWithoutContacts: [],
  contactsWithoutContactInfo: [],
};

// ============================================================
// ERROR STATE TRANSITIONS
// ============================================================

describe("importWizardReducer - ERROR state transitions", () => {
  it("transitions to IDLE on RESET", () => {
    const errorState: WizardState = {
      step: "error",
      error: new Error("Test error"),
      previousStep: "parsing",
    };

    const action: WizardAction = { type: "RESET" };
    const nextState = importWizardReducer(errorState, action);

    expect(nextState.step).toBe("idle");
  });

  it("ignores other actions in ERROR state", () => {
    const errorState: WizardState = {
      step: "error",
      error: new Error("Test error"),
      previousStep: "importing",
    };

    const invalidActions: WizardAction[] = [
      { type: "START_PARSING" },
      { type: "START_IMPORT", payload: { totalContacts: 10 } },
      { type: "IMPORT_COMPLETE" },
    ];

    invalidActions.forEach((action) => {
      const nextState = importWizardReducer(errorState, action);
      expect(nextState).toBe(errorState);
    });
  });
});

// ============================================================
// IMPORT_FAILED TRANSITIONS
// ============================================================

describe("importWizardReducer - IMPORT_FAILED", () => {
  let importingState: WizardStateImporting;

  beforeEach(() => {
    importingState = {
      step: "importing",
      file: mockFile,
      progress: { count: 0, total: 100 },
      accumulated: { ...INITIAL_ACCUMULATED_RESULT, startTime: new Date() },
      rowOffset: 0,
    };
  });

  it("transitions to ERROR on IMPORT_FAILED", () => {
    const error = new Error("Database connection lost");
    const action: WizardAction = {
      type: "IMPORT_FAILED",
      payload: { error },
    };

    const nextState = importWizardReducer(importingState, action);

    expect(nextState.step).toBe("error");
    if (nextState.step === "error") {
      expect(nextState.error).toBe(error);
      expect(nextState.previousStep).toBe("importing");
    }
  });
});

// ============================================================
// EDGE CASES
// ============================================================

describe("importWizardReducer - edge cases", () => {
  it("handles IMPORT_COMPLETE with null startTime", () => {
    const stateWithNullStart: WizardStateImporting = {
      step: "importing",
      file: mockFile,
      progress: { count: 10, total: 10 },
      accumulated: {
        ...INITIAL_ACCUMULATED_RESULT,
        totalProcessed: 10,
        successCount: 10,
        startTime: null,
      },
      rowOffset: 10,
    };

    const action: WizardAction = { type: "IMPORT_COMPLETE" };
    const nextState = importWizardReducer(stateWithNullStart, action);

    expect(nextState.step).toBe("complete");
    if (nextState.step === "complete") {
      // When startTime is null, both start and end should be the same (endTime)
      expect(nextState.result.startTime).toEqual(nextState.result.endTime);
      expect(nextState.result.duration).toBe(0);
    }
  });

  it("preserves immutability - original state is not mutated", () => {
    const originalState: WizardStateIdle = { step: "idle" };
    const originalCopy = { ...originalState };

    importWizardReducer(originalState, {
      type: "SELECT_FILE",
      payload: {
        file: mockFile,
        validationErrors: [],
        validationWarnings: [],
      },
    });

    expect(originalState).toEqual(originalCopy);
  });
});

// ============================================================
// HOOK TESTS - AbortController & Stable References
// ============================================================

describe("useImportWizard hook", () => {
  it("returns stable action references across renders", () => {
    const { result, rerender } = renderHook(() => useImportWizard());

    const actions1 = result.current.actions;
    rerender();
    const actions2 = result.current.actions;

    // Actions object should be stable (same reference)
    expect(actions1).toBe(actions2);
  });

  it("provides isAborted function", () => {
    const { result } = renderHook(() => useImportWizard());

    expect(typeof result.current.isAborted).toBe("function");
    // Initially not aborted
    expect(result.current.isAborted()).toBe(false);
  });

  it("provides getAbortSignal function", () => {
    const { result } = renderHook(() => useImportWizard());

    expect(typeof result.current.getAbortSignal).toBe("function");
    // Initially no signal (no operation started)
    expect(result.current.getAbortSignal()).toBeNull();
  });

  it("creates AbortController on startParsing", () => {
    const { result } = renderHook(() => useImportWizard());

    // Select a file first
    act(() => {
      result.current.actions.selectFile(mockFile, [], []);
    });

    // Start parsing creates AbortController
    act(() => {
      result.current.actions.startParsing();
    });

    // Now there should be a signal
    expect(result.current.getAbortSignal()).not.toBeNull();
    expect(result.current.isAborted()).toBe(false);
  });

  it("creates AbortController on startImport", () => {
    const { result } = renderHook(() => useImportWizard());

    // Set up state to preview
    act(() => {
      result.current.actions.selectFile(mockFile, [], []);
    });
    act(() => {
      result.current.actions.startParsing();
    });
    act(() => {
      result.current.actions.parsingComplete(mockPreviewData);
    });

    // Start import creates AbortController
    act(() => {
      result.current.actions.startImport(100);
    });

    expect(result.current.getAbortSignal()).not.toBeNull();
    expect(result.current.isAborted()).toBe(false);
  });

  it("aborts on cancel action", () => {
    const { result } = renderHook(() => useImportWizard());

    // Set up state to importing
    act(() => {
      result.current.actions.selectFile(mockFile, [], []);
    });
    act(() => {
      result.current.actions.startParsing();
    });
    act(() => {
      result.current.actions.parsingComplete(mockPreviewData);
    });
    act(() => {
      result.current.actions.startImport(100);
    });

    // Capture signal before cancel
    const signalBeforeCancel = result.current.getAbortSignal();
    expect(signalBeforeCancel).not.toBeNull();

    // Cancel should abort
    act(() => {
      result.current.actions.cancel();
    });

    // The signal that was active should now be aborted
    expect(signalBeforeCancel?.aborted).toBe(true);
  });

  it("aborts on reset action", () => {
    const { result } = renderHook(() => useImportWizard());

    // Set up state to importing
    act(() => {
      result.current.actions.selectFile(mockFile, [], []);
    });
    act(() => {
      result.current.actions.startParsing();
    });
    act(() => {
      result.current.actions.parsingComplete(mockPreviewData);
    });
    act(() => {
      result.current.actions.startImport(100);
    });

    // Capture signal before reset
    const signalBeforeReset = result.current.getAbortSignal();
    expect(signalBeforeReset).not.toBeNull();

    // Reset should abort
    act(() => {
      result.current.actions.reset();
    });

    // The signal that was active should now be aborted
    expect(signalBeforeReset?.aborted).toBe(true);
  });

  it("cleans up AbortController on unmount", () => {
    const { result, unmount } = renderHook(() => useImportWizard());

    // Start an operation
    act(() => {
      result.current.actions.selectFile(mockFile, [], []);
    });
    act(() => {
      result.current.actions.startParsing();
    });

    const signalBeforeUnmount = result.current.getAbortSignal();
    expect(signalBeforeUnmount).not.toBeNull();

    // Unmount should abort
    unmount();

    // The signal should now be aborted
    expect(signalBeforeUnmount?.aborted).toBe(true);
  });

  it("creates fresh AbortController for each new operation", () => {
    const { result } = renderHook(() => useImportWizard());

    // First operation
    act(() => {
      result.current.actions.selectFile(mockFile, [], []);
    });
    act(() => {
      result.current.actions.startParsing();
    });

    const firstSignal = result.current.getAbortSignal();

    // Complete first operation and start second
    act(() => {
      result.current.actions.parsingComplete(mockPreviewData);
    });
    act(() => {
      result.current.actions.startImport(100);
    });

    const secondSignal = result.current.getAbortSignal();

    // Should be different signals
    expect(firstSignal).not.toBe(secondSignal);
    // First signal should be aborted (replaced by second)
    expect(firstSignal?.aborted).toBe(true);
    // Second signal should be active
    expect(secondSignal?.aborted).toBe(false);
  });
});
