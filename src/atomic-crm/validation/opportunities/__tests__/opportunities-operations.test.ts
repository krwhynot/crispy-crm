import { describe, it, expect } from "vitest";
import {
  createOpportunitySchema,
  quickCreateOpportunitySchema,
  isValidOpportunityStageTransition,
} from "../opportunities-operations";

describe("createOpportunitySchema - WF-C1-001", () => {
  it("should NOT have a silent status default - status must be explicit", () => {
    // Constitution: Fail-fast - no implicit values
    const inputWithoutStatus = {
      name: "Test Opportunity",
      principal_organization_id: 1,
      customer_organization_id: 2,
      stage: "new_lead",
      priority: "high",
      contact_ids: [1],
      // status intentionally omitted
    };

    const result = createOpportunitySchema.safeParse(inputWithoutStatus);

    if (result.success) {
      // If parsing succeeds, status should NOT be auto-filled
      expect(result.data).not.toHaveProperty("status");
    }
    // If parsing fails, that's also acceptable (status required)
  });
});

describe("quickCreateOpportunitySchema - WF-C1-002", () => {
  it("should NOT have a silent status default - status must be explicit", () => {
    // Constitution: Fail-fast - no implicit values for business-critical fields
    const inputWithoutStatus = {
      name: "Quick Add Opportunity",
      principal_organization_id: 1,
      customer_organization_id: 2,
      stage: "new_lead",
      // status intentionally omitted
      priority: "high",
    };

    const result = quickCreateOpportunitySchema.safeParse(inputWithoutStatus);

    if (result.success) {
      // Status should NOT be auto-filled by Zod
      expect(result.data).not.toHaveProperty("status");
    }
  });
});

describe("quickCreateOpportunitySchema - WF-C1-003", () => {
  it("should NOT have a silent priority default - priority must be explicit", () => {
    // Constitution: Fail-fast - no implicit values
    const inputWithoutPriority = {
      name: "Quick Add Opportunity",
      principal_organization_id: 1,
      customer_organization_id: 2,
      stage: "new_lead",
      status: "active",
      // priority intentionally omitted
    };

    const result = quickCreateOpportunitySchema.safeParse(inputWithoutPriority);

    if (result.success) {
      // Priority should NOT be auto-filled by Zod
      expect(result.data).not.toHaveProperty("priority");
    }
  });
});

describe("Stage transition policy - any-stage jump", () => {
  it("allows active → non-adjacent active: new_lead → demo_scheduled", () => {
    expect(isValidOpportunityStageTransition("new_lead", "demo_scheduled")).toBe(true);
  });

  it("allows active → adjacent active: new_lead → initial_outreach", () => {
    expect(isValidOpportunityStageTransition("new_lead", "initial_outreach")).toBe(true);
  });

  it("allows active → closed_won: demo_scheduled → closed_won", () => {
    expect(isValidOpportunityStageTransition("demo_scheduled", "closed_won")).toBe(true);
  });

  it("allows active → closed_lost: new_lead → closed_lost", () => {
    expect(isValidOpportunityStageTransition("new_lead", "closed_lost")).toBe(true);
  });

  it("allows reopen from won to any active: closed_won → new_lead", () => {
    expect(isValidOpportunityStageTransition("closed_won", "new_lead")).toBe(true);
  });

  it("allows reopen from lost to any active: closed_lost → feedback_logged", () => {
    expect(isValidOpportunityStageTransition("closed_lost", "feedback_logged")).toBe(true);
  });

  it("rejects closed → closed: closed_won → closed_lost", () => {
    expect(isValidOpportunityStageTransition("closed_won", "closed_lost")).toBe(false);
  });

  it("rejects same stage: new_lead → new_lead", () => {
    expect(isValidOpportunityStageTransition("new_lead", "new_lead")).toBe(false);
  });
});
