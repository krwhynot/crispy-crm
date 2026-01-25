/**
 * Unit tests for useImportWizard - Preview State Management
 *
 * Tests cover:
 * - PREVIEW state transitions
 * - UPDATE_PREVIEW action
 * - UPDATE_DATA_QUALITY_DECISIONS action
 * - START_IMPORT transition from preview
 *
 * @see useImportWizard.ts
 * @see useImportWizard.types.ts
 */

import { describe, it, expect, beforeEach } from "vitest";
import { importWizardReducer } from "../reducers/importWizardReducer";
import type { WizardAction, WizardStatePreview } from "../useImportWizard.types";
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
// PREVIEW STATE TRANSITIONS
// ============================================================

describe("importWizardReducer - PREVIEW state transitions", () => {
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
