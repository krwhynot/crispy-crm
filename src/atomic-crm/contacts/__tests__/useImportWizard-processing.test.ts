/**
 * Unit tests for useImportWizard - Import Processing
 *
 * Tests cover:
 * - IMPORTING state transitions
 * - Progress updates (UPDATE_PROGRESS)
 * - Result accumulation (ACCUMULATE_RESULT)
 * - Import completion (IMPORT_COMPLETE)
 * - COMPLETE state transitions
 *
 * @see useImportWizard.ts
 * @see useImportWizard.types.ts
 */

import { describe, it, expect, beforeEach } from "vitest";
import { importWizardReducer } from "../reducers/importWizardReducer";
import type { WizardState, WizardAction, WizardStateImporting } from "../useImportWizard.types";
import { INITIAL_ACCUMULATED_RESULT } from "../useImportWizard.types";

// ============================================================
// TEST FIXTURES
// ============================================================

const mockFile = new File(["test,data"], "test.csv", { type: "text/csv" });

// ============================================================
// IMPORTING STATE TRANSITIONS
// ============================================================

describe("importWizardReducer - IMPORTING state transitions", () => {
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

  it("transitions to IDLE on CANCEL", () => {
    const action: WizardAction = { type: "CANCEL" };
    const nextState = importWizardReducer(importingState, action);
    expect(nextState.step).toBe("idle");
  });
});

// ============================================================
// COMPLETE STATE TRANSITIONS
// ============================================================

describe("importWizardReducer - COMPLETE state transitions", () => {
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
