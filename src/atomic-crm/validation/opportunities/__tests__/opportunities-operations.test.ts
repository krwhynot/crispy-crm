import { describe, it, expect } from "vitest";
import { createOpportunitySchema, quickCreateOpportunitySchema } from "../opportunities-operations";

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
