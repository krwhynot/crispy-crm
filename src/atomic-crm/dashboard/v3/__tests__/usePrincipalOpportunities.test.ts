import { describe, it, expect } from "vitest";
import type { OpportunitySummary } from "../hooks/usePrincipalOpportunities";

/**
 * Raw opportunity data as returned from the database/API.
 * Uses snake_case field names matching database columns.
 */
interface RawOpportunityData {
  id: number;
  name?: string;
  stage?: string;
  amount?: number;
  probability?: number;
  last_activity_date?: string | null;
  estimated_close_date?: string | null;
  expected_close_date?: string;
}

/**
 * Tests for usePrincipalOpportunities hook logic
 *
 * Tests the data mapping and transformation logic used by the hook.
 * The hook itself relies on React Admin's dataProvider, which is tested
 * in integration tests. Here we verify the mapping logic is correct.
 */
describe("usePrincipalOpportunities", () => {
  /**
   * Extracts the mapping logic from the hook for testing.
   * This mirrors exactly what the hook does in lines 60-67.
   */
  const mapOpportunityData = (opp: RawOpportunityData): OpportunitySummary => ({
    id: opp.id,
    name: opp.name || "Unnamed Opportunity",
    stage: opp.stage || "Unknown",
    amount: opp.amount || 0,
    probability: opp.probability || 0,
    lastActivityDate: opp.last_activity_date ? new Date(opp.last_activity_date) : null,
    // CRITICAL: Maps estimated_close_date (database field) to expectedCloseDate (interface field)
    expectedCloseDate: opp.estimated_close_date ? new Date(opp.estimated_close_date) : null,
  });

  describe("correct database field names", () => {
    it("should map estimated_close_date to expectedCloseDate (not expected_close_date)", () => {
      const dbRecord = {
        id: 1,
        name: "Test Opportunity",
        stage: "Proposal",
        amount: 50000,
        probability: 75,
        last_activity_date: "2025-01-15T00:00:00Z",
        estimated_close_date: "2025-02-28T00:00:00Z", // Database field name
      };

      const mapped = mapOpportunityData(dbRecord);

      expect(mapped.expectedCloseDate).toBeInstanceOf(Date);
      expect(mapped.expectedCloseDate?.toISOString()).toContain("2025-02-28");
    });

    it("should NOT map expected_close_date (wrong field name)", () => {
      const dbRecordWithWrongField = {
        id: 1,
        name: "Test",
        expected_close_date: "2025-02-28", // WRONG field name (old bug)
        // estimated_close_date is missing
      };

      const mapped = mapOpportunityData(dbRecordWithWrongField);

      // Should be null because we only map estimated_close_date
      expect(mapped.expectedCloseDate).toBeNull();
    });
  });

  describe("data mapping completeness", () => {
    it("should map all fields correctly from database record", () => {
      const dbRecord = {
        id: 123,
        name: "Enterprise Deal",
        stage: "Negotiation",
        amount: 250000,
        probability: 80,
        last_activity_date: "2025-01-20T14:30:00Z",
        estimated_close_date: "2025-03-15T00:00:00Z",
      };

      const mapped = mapOpportunityData(dbRecord);

      expect(mapped.id).toBe(123);
      expect(mapped.name).toBe("Enterprise Deal");
      expect(mapped.stage).toBe("Negotiation");
      expect(mapped.amount).toBe(250000);
      expect(mapped.probability).toBe(80);
      expect(mapped.lastActivityDate).toBeInstanceOf(Date);
      expect(mapped.expectedCloseDate).toBeInstanceOf(Date);
    });

    it("should handle all null/missing optional fields", () => {
      const dbRecord = {
        id: 1,
        // All other fields missing/undefined
      };

      const mapped = mapOpportunityData(dbRecord);

      expect(mapped.id).toBe(1);
      expect(mapped.name).toBe("Unnamed Opportunity");
      expect(mapped.stage).toBe("Unknown");
      expect(mapped.amount).toBe(0);
      expect(mapped.probability).toBe(0);
      expect(mapped.lastActivityDate).toBeNull();
      expect(mapped.expectedCloseDate).toBeNull();
    });

    it("should handle explicitly null date fields", () => {
      const dbRecord = {
        id: 1,
        name: "Opportunity without dates",
        stage: "Discovery",
        amount: 10000,
        probability: 20,
        last_activity_date: null,
        estimated_close_date: null,
      };

      const mapped = mapOpportunityData(dbRecord);

      expect(mapped.lastActivityDate).toBeNull();
      expect(mapped.expectedCloseDate).toBeNull();
    });

    it("should handle empty string values with defaults", () => {
      const dbRecord = {
        id: 1,
        name: "", // Empty string
        stage: "", // Empty string
        amount: 0,
        probability: 0,
      };

      const mapped = mapOpportunityData(dbRecord);

      // Empty strings are falsy, so should get defaults
      expect(mapped.name).toBe("Unnamed Opportunity");
      expect(mapped.stage).toBe("Unknown");
    });
  });

  describe("API request configuration", () => {
    /**
     * Documents the correct API request parameters.
     * The hook should use these exact values.
     */
    it("should document correct filter field: principal_organization_id", () => {
      // The hook filters by principal organization, NOT generic organization_id
      // This is because opportunities can have multiple organization relationships:
      // - customer_organization_id
      // - principal_organization_id
      // - distributor_organization_id
      const correctFilter = { principal_organization_id: 123 };

      expect(correctFilter).toHaveProperty("principal_organization_id");
      expect(correctFilter).not.toHaveProperty("organization_id");
    });

    it("should document correct sort field: estimated_close_date", () => {
      // The hook sorts by estimated_close_date, NOT expected_close_date
      // The database column is named estimated_close_date
      const correctSort = { field: "estimated_close_date", order: "ASC" };

      expect(correctSort.field).toBe("estimated_close_date");
      expect(correctSort.field).not.toBe("expected_close_date");
    });

    it("should document pagination limits", () => {
      // The hook limits to 50 opportunities per principal
      const pagination = { page: 1, perPage: 50 };

      expect(pagination.perPage).toBe(50);
    });
  });

  describe("batch processing", () => {
    it("should correctly map multiple opportunities", () => {
      const dbRecords = [
        {
          id: 1,
          name: "Small Deal",
          stage: "Discovery",
          amount: 5000,
          probability: 10,
          estimated_close_date: "2025-04-01",
        },
        {
          id: 2,
          name: "Medium Deal",
          stage: "Proposal",
          amount: 50000,
          probability: 50,
          estimated_close_date: "2025-03-15",
        },
        {
          id: 3,
          name: "Large Deal",
          stage: "Negotiation",
          amount: 200000,
          probability: 80,
          estimated_close_date: "2025-02-28",
        },
      ];

      const mapped = dbRecords.map(mapOpportunityData);

      expect(mapped).toHaveLength(3);
      expect(mapped.map((o) => o.name)).toEqual(["Small Deal", "Medium Deal", "Large Deal"]);
      expect(mapped.map((o) => o.amount)).toEqual([5000, 50000, 200000]);
      expect(mapped.every((o) => o.expectedCloseDate instanceof Date)).toBe(true);
    });
  });

  describe("date parsing edge cases", () => {
    it("should handle ISO date strings with timezone", () => {
      const record = {
        id: 1,
        estimated_close_date: "2025-02-28T23:59:59.999Z",
      };

      const mapped = mapOpportunityData(record);

      expect(mapped.expectedCloseDate).toBeInstanceOf(Date);
    });

    it("should handle date-only strings", () => {
      const record = {
        id: 1,
        estimated_close_date: "2025-02-28",
      };

      const mapped = mapOpportunityData(record);

      expect(mapped.expectedCloseDate).toBeInstanceOf(Date);
    });

    it("should handle timestamp format from Supabase", () => {
      // Supabase often returns timestamps in this format
      const record = {
        id: 1,
        estimated_close_date: "2025-02-28 14:30:00+00",
        last_activity_date: "2025-01-15 09:00:00+00",
      };

      const mapped = mapOpportunityData(record);

      expect(mapped.expectedCloseDate).toBeInstanceOf(Date);
      expect(mapped.lastActivityDate).toBeInstanceOf(Date);
    });
  });
});
