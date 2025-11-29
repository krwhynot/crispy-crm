/**
 * Unit tests for useImportWizard reducer and hook
 *
 * Tests follow TDD approach - written before implementation.
 * Focus areas:
 * 1. Valid state transitions only
 * 2. Invalid transitions return unchanged state
 * 3. Exhaustive action handling
 * 4. Progress accumulation
 *
 * @see useImportWizard.ts
 * @see useImportWizard.types.ts
 */

import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  importWizardReducer,
  createInitialState,
  useImportWizard,
} from "../useImportWizard";
import type {
  WizardState,
  WizardAction,
  WizardStateIdle,
  WizardStateFileSelected,
  WizardStateParsing,
  WizardStatePreview,
  WizardStateImporting,
  AccumulatedResult,
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

const _mockAccumulatedResult: AccumulatedResult = {
  totalProcessed: 5,
  successCount: 4,
  skippedCount: 0,
  failedCount: 1,
  errors: [],
  startTime: new Date(),
};

// ============================================================
// REDUCER TESTS
// ============================================================

describe("importWizardReducer", () => {
  // ============================================================
  // IDLE STATE TRANSITIONS
  // ============================================================

  describe("from IDLE state", () => {
    let idleState: WizardStateIdle;

    beforeEach(() => {
      idleState = createInitialState();
    });

    it("transitions to FILE_SELECTED on SELECT_FILE", () => {
      const action: WizardAction = {
        type: "SELECT_FILE",
        payload: {
          file: mockFile,
          validationErrors: [],
          validationWarnings: ["Large file"],
        },
      };

      const nextState = importWizardReducer(idleState, action);

      expect(nextState.step).toBe("file_selected");
      if (nextState.step === "file_selected") {
        expect(nextState.file).toBe(mockFile);
        expect(nextState.validationErrors).toEqual([]);
        expect(nextState.validationWarnings).toEqual(["Large file"]);
      }
    });

    it("ignores invalid actions in IDLE state", () => {
      const invalidActions: WizardAction[] = [
        { type: "CLEAR_FILE" },
        { type: "START_PARSING" },
        { type: "PARSING_COMPLETE", payload: { previewData: mockPreviewData } },
        { type: "START_IMPORT", payload: { totalContacts: 10 } },
        { type: "UPDATE_PROGRESS", payload: { count: 5 } },
        { type: "IMPORT_COMPLETE" },
      ];

      invalidActions.forEach((action) => {
        const nextState = importWizardReducer(idleState, action);
        expect(nextState).toBe(idleState); // Same reference = no change
      });
    });

    it("RESET in IDLE returns same state", () => {
      const action: WizardAction = { type: "RESET" };
      const nextState = importWizardReducer(idleState, action);
      expect(nextState.step).toBe("idle");
    });
  });

  // ============================================================
  // FILE_SELECTED STATE TRANSITIONS
  // ============================================================

  describe("from FILE_SELECTED state", () => {
    let fileSelectedState: WizardStateFileSelected;

    beforeEach(() => {
      fileSelectedState = {
        step: "file_selected",
        file: mockFile,
        validationErrors: [],
        validationWarnings: [],
      };
    });

    it("transitions to PARSING on START_PARSING", () => {
      const action: WizardAction = { type: "START_PARSING" };
      const nextState = importWizardReducer(fileSelectedState, action);

      expect(nextState.step).toBe("parsing");
      if (nextState.step === "parsing") {
        expect(nextState.file).toBe(mockFile);
      }
    });

    it("transitions to IDLE on CLEAR_FILE", () => {
      const action: WizardAction = { type: "CLEAR_FILE" };
      const nextState = importWizardReducer(fileSelectedState, action);

      expect(nextState.step).toBe("idle");
    });

    it("allows SELECT_FILE to replace file", () => {
      const newFile = new File(["new"], "new.csv", { type: "text/csv" });
      const action: WizardAction = {
        type: "SELECT_FILE",
        payload: {
          file: newFile,
          validationErrors: [],
          validationWarnings: [],
        },
      };

      const nextState = importWizardReducer(fileSelectedState, action);

      expect(nextState.step).toBe("file_selected");
      if (nextState.step === "file_selected") {
        expect(nextState.file).toBe(newFile);
      }
    });

    it("transitions to IDLE on RESET", () => {
      const action: WizardAction = { type: "RESET" };
      const nextState = importWizardReducer(fileSelectedState, action);
      expect(nextState.step).toBe("idle");
    });
  });

  // ============================================================
  // PARSING STATE TRANSITIONS
  // ============================================================

  describe("from PARSING state", () => {
    let parsingState: WizardStateParsing;

    beforeEach(() => {
      parsingState = {
        step: "parsing",
        file: mockFile,
      };
    });

    it("transitions to PREVIEW on PARSING_COMPLETE", () => {
      const action: WizardAction = {
        type: "PARSING_COMPLETE",
        payload: { previewData: mockPreviewData },
      };

      const nextState = importWizardReducer(parsingState, action);

      expect(nextState.step).toBe("preview");
      if (nextState.step === "preview") {
        expect(nextState.previewData).toBe(mockPreviewData);
        expect(nextState.file).toBe(mockFile);
        expect(nextState.dataQualityDecisions).toEqual({
          importOrganizationsWithoutContacts: false,
          importContactsWithoutContactInfo: false,
        });
      }
    });

    it("transitions to ERROR on PARSING_FAILED", () => {
      const error = new Error("Invalid CSV format");
      const action: WizardAction = {
        type: "PARSING_FAILED",
        payload: { error },
      };

      const nextState = importWizardReducer(parsingState, action);

      expect(nextState.step).toBe("error");
      if (nextState.step === "error") {
        expect(nextState.error).toBe(error);
        expect(nextState.previousStep).toBe("parsing");
      }
    });

    it("transitions to IDLE on CANCEL", () => {
      const action: WizardAction = { type: "CANCEL" };
      const nextState = importWizardReducer(parsingState, action);
      expect(nextState.step).toBe("idle");
    });

    it("transitions to IDLE on RESET", () => {
      const action: WizardAction = { type: "RESET" };
      const nextState = importWizardReducer(parsingState, action);
      expect(nextState.step).toBe("idle");
    });
  });

  // ============================================================
  // PREVIEW STATE TRANSITIONS
  // ============================================================

  describe("from PREVIEW state", () => {
    let previewState: WizardStatePreview;

    beforeEach(() => {
      previewState = {
        step: "preview",
        file: mockFile,
        previewData: mockPreviewData,
        dataQualityDecisions: {
          importOrganizationsWithoutContacts: false,
          importContactsWithoutContactInfo: false,
        },
      };
    });

    it("transitions to IMPORTING on START_IMPORT", () => {
      const action: WizardAction = {
        type: "START_IMPORT",
        payload: { totalContacts: 100 },
      };

      const nextState = importWizardReducer(previewState, action);

      expect(nextState.step).toBe("importing");
      if (nextState.step === "importing") {
        expect(nextState.file).toBe(mockFile);
        expect(nextState.progress).toEqual({ count: 0, total: 100 });
        expect(nextState.accumulated.totalProcessed).toBe(0);
        expect(nextState.rowOffset).toBe(0);
      }
    });

    it("updates previewData on UPDATE_PREVIEW", () => {
      const updatedPreview = { ...mockPreviewData, validCount: 20 };
      const action: WizardAction = {
        type: "UPDATE_PREVIEW",
        payload: { previewData: updatedPreview },
      };

      const nextState = importWizardReducer(previewState, action);

      expect(nextState.step).toBe("preview");
      if (nextState.step === "preview") {
        expect(nextState.previewData.validCount).toBe(20);
      }
    });

    it("updates dataQualityDecisions on UPDATE_DATA_QUALITY_DECISIONS", () => {
      const action: WizardAction = {
        type: "UPDATE_DATA_QUALITY_DECISIONS",
        payload: {
          decisions: {
            importOrganizationsWithoutContacts: true,
            importContactsWithoutContactInfo: true,
          },
        },
      };

      const nextState = importWizardReducer(previewState, action);

      expect(nextState.step).toBe("preview");
      if (nextState.step === "preview") {
        expect(nextState.dataQualityDecisions.importOrganizationsWithoutContacts).toBe(true);
        expect(nextState.dataQualityDecisions.importContactsWithoutContactInfo).toBe(true);
      }
    });

    it("transitions to IDLE on CANCEL", () => {
      const action: WizardAction = { type: "CANCEL" };
      const nextState = importWizardReducer(previewState, action);
      expect(nextState.step).toBe("idle");
    });

    it("transitions to IDLE on RESET", () => {
      const action: WizardAction = { type: "RESET" };
      const nextState = importWizardReducer(previewState, action);
      expect(nextState.step).toBe("idle");
    });
  });

  // ============================================================
  // IMPORTING STATE TRANSITIONS
  // ============================================================

  describe("from IMPORTING state", () => {
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

    it("updates progress on UPDATE_PROGRESS", () => {
      const action: WizardAction = {
        type: "UPDATE_PROGRESS",
        payload: { count: 50 },
      };

      const nextState = importWizardReducer(importingState, action);

      expect(nextState.step).toBe("importing");
      if (nextState.step === "importing") {
        expect(nextState.progress.count).toBe(50);
        expect(nextState.progress.total).toBe(100);
      }
    });

    it("accumulates results on ACCUMULATE_RESULT", () => {
      const action: WizardAction = {
        type: "ACCUMULATE_RESULT",
        payload: {
          batchProcessed: 10,
          batchSuccess: 8,
          batchSkipped: 1,
          batchFailed: 1,
          batchErrors: [{ row: 5, data: {}, errors: [{ field: "email", message: "Invalid" }] }],
          batchSize: 10,
        },
      };

      const nextState = importWizardReducer(importingState, action);

      expect(nextState.step).toBe("importing");
      if (nextState.step === "importing") {
        expect(nextState.accumulated.totalProcessed).toBe(10);
        expect(nextState.accumulated.successCount).toBe(8);
        expect(nextState.accumulated.skippedCount).toBe(1);
        expect(nextState.accumulated.failedCount).toBe(1);
        expect(nextState.accumulated.errors).toHaveLength(1);
        expect(nextState.rowOffset).toBe(10);
      }
    });

    it("accumulates multiple batches correctly", () => {
      // First batch
      let state = importWizardReducer(importingState, {
        type: "ACCUMULATE_RESULT",
        payload: {
          batchProcessed: 10,
          batchSuccess: 9,
          batchSkipped: 0,
          batchFailed: 1,
          batchErrors: [],
          batchSize: 10,
        },
      });

      // Second batch
      state = importWizardReducer(state, {
        type: "ACCUMULATE_RESULT",
        payload: {
          batchProcessed: 10,
          batchSuccess: 10,
          batchSkipped: 0,
          batchFailed: 0,
          batchErrors: [],
          batchSize: 10,
        },
      });

      expect(state.step).toBe("importing");
      if (state.step === "importing") {
        expect(state.accumulated.totalProcessed).toBe(20);
        expect(state.accumulated.successCount).toBe(19);
        expect(state.accumulated.failedCount).toBe(1);
        expect(state.rowOffset).toBe(20);
      }
    });

    it("transitions to COMPLETE on IMPORT_COMPLETE", () => {
      // Set up state with accumulated results
      const stateWithResults: WizardStateImporting = {
        ...importingState,
        accumulated: {
          totalProcessed: 100,
          successCount: 95,
          skippedCount: 2,
          failedCount: 3,
          errors: [],
          startTime: new Date(Date.now() - 5000),
        },
      };

      const action: WizardAction = { type: "IMPORT_COMPLETE" };
      const nextState = importWizardReducer(stateWithResults, action);

      expect(nextState.step).toBe("complete");
      if (nextState.step === "complete") {
        expect(nextState.result.totalProcessed).toBe(100);
        expect(nextState.result.successCount).toBe(95);
        expect(nextState.result.skippedCount).toBe(2);
        expect(nextState.result.failedCount).toBe(3);
        expect(nextState.result.duration).toBeGreaterThan(0);
        expect(nextState.result.startTime).toBeInstanceOf(Date);
        expect(nextState.result.endTime).toBeInstanceOf(Date);
      }
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

    it("transitions to IDLE on CANCEL", () => {
      const action: WizardAction = { type: "CANCEL" };
      const nextState = importWizardReducer(importingState, action);
      expect(nextState.step).toBe("idle");
    });
  });

  // ============================================================
  // COMPLETE STATE TRANSITIONS
  // ============================================================

  describe("from COMPLETE state", () => {
    it("transitions to IDLE on RESET", () => {
      const completeState: WizardState = {
        step: "complete",
        result: {
          totalProcessed: 100,
          successCount: 100,
          skippedCount: 0,
          failedCount: 0,
          errors: [],
          duration: 5000,
          startTime: new Date(),
          endTime: new Date(),
        },
      };

      const action: WizardAction = { type: "RESET" };
      const nextState = importWizardReducer(completeState, action);

      expect(nextState.step).toBe("idle");
    });

    it("ignores other actions in COMPLETE state", () => {
      const completeState: WizardState = {
        step: "complete",
        result: {
          totalProcessed: 100,
          successCount: 100,
          skippedCount: 0,
          failedCount: 0,
          errors: [],
          duration: 5000,
          startTime: new Date(),
          endTime: new Date(),
        },
      };

      const invalidActions: WizardAction[] = [
        { type: "START_PARSING" },
        { type: "START_IMPORT", payload: { totalContacts: 10 } },
        { type: "UPDATE_PROGRESS", payload: { count: 5 } },
      ];

      invalidActions.forEach((action) => {
        const nextState = importWizardReducer(completeState, action);
        expect(nextState).toBe(completeState);
      });
    });
  });

  // ============================================================
  // ERROR STATE TRANSITIONS
  // ============================================================

  describe("from ERROR state", () => {
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
  // EDGE CASES
  // ============================================================

  describe("edge cases", () => {
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
});

// ============================================================
// INITIAL STATE TESTS
// ============================================================

describe("createInitialState", () => {
  it("returns idle state", () => {
    const state = createInitialState();
    expect(state.step).toBe("idle");
  });

  it("returns a new object each call", () => {
    const state1 = createInitialState();
    const state2 = createInitialState();
    expect(state1).not.toBe(state2);
    expect(state1).toEqual(state2);
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
