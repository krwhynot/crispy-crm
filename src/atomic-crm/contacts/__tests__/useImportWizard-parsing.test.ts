/**
 * Unit tests for useImportWizard - Parsing and File Selection
 *
 * Tests cover:
 * - IDLE state transitions
 * - FILE_SELECTED state transitions
 * - PARSING state transitions
 * - createInitialState function
 *
 * @see useImportWizard.ts
 * @see useImportWizard.types.ts
 */

import { describe, it, expect, beforeEach } from "vitest";
import { importWizardReducer, createInitialState } from "../reducers/importWizardReducer";
import type {
  WizardAction,
  WizardStateIdle,
  WizardStateFileSelected,
  WizardStateParsing,
} from "../useImportWizard.types";
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
// IDLE STATE TRANSITIONS
// ============================================================

describe("importWizardReducer - IDLE state transitions", () => {
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

describe("importWizardReducer - FILE_SELECTED state transitions", () => {
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

describe("importWizardReducer - PARSING state transitions", () => {
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
