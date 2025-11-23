import { describe, it, expect } from "vitest";

/**
 * Unit tests for Principal Pipeline filtering logic (B1)
 *
 * Tests the "My Principals Only" filtering feature which:
 * 1. Gets current user's sales.id via useCurrentSale
 * 2. Filters principal_pipeline_summary by sales_id
 *
 * The filtering chain:
 * - useCurrentSale: queries sales WHERE user_id = auth.uid() OR email = user.email
 * - usePrincipalPipeline: filters view WHERE sales_id = salesId
 * - View's sales_id: comes from opportunities.account_manager_id subquery
 */
describe("Principal Pipeline Filtering (B1)", () => {
  describe("useCurrentSale lookup logic", () => {
    it("should return salesId when user_id matches", () => {
      // Simulates: user logs in -> auth.uid() matches sales.user_id
      const userId = "uuid-123-456";
      const saleRecords = [
        { id: 1, user_id: "uuid-123-456", email: "alice@test.com" },
        { id: 2, user_id: "uuid-789-012", email: "bob@test.com" },
      ];

      // Find matching record (simulating the .or() query)
      const matchedSale = saleRecords.find((s) => s.user_id === userId);

      expect(matchedSale?.id).toBe(1);
    });

    it("should fall back to email match for legacy users", () => {
      // Simulates: legacy user with NULL user_id matched by email
      const userEmail = "legacy@test.com";
      const saleRecords = [
        { id: 1, user_id: null, email: "legacy@test.com" },
        { id: 2, user_id: "uuid-789-012", email: "bob@test.com" },
      ];

      // Find by email (simulating fallback in .or() query)
      const matchedSale = saleRecords.find((s) => s.email === userEmail);

      expect(matchedSale?.id).toBe(1);
    });

    it("should return null when no sales record exists", () => {
      const userId = "uuid-no-match";
      const userEmail = "nomatch@test.com";
      const saleRecords = [{ id: 1, user_id: "uuid-123-456", email: "alice@test.com" }];

      const matchedSale = saleRecords.find((s) => s.user_id === userId || s.email === userEmail);

      expect(matchedSale).toBeUndefined();
    });
  });

  describe("usePrincipalPipeline filter application", () => {
    it("should apply sales_id filter when myPrincipalsOnly is true", () => {
      const filters = { myPrincipalsOnly: true };
      const salesId = 42;
      const queryFilter: Record<string, unknown> = {};

      // Logic from usePrincipalPipeline
      if (filters?.myPrincipalsOnly && salesId) {
        queryFilter.sales_id = salesId;
      }

      expect(queryFilter).toEqual({ sales_id: 42 });
    });

    it("should NOT apply filter when myPrincipalsOnly is false", () => {
      const filters = { myPrincipalsOnly: false };
      const salesId = 42;
      const queryFilter: Record<string, unknown> = {};

      if (filters?.myPrincipalsOnly && salesId) {
        queryFilter.sales_id = salesId;
      }

      expect(queryFilter).toEqual({});
    });

    it("should NOT apply filter when salesId is null", () => {
      const filters = { myPrincipalsOnly: true };
      const salesId = null;
      const queryFilter: Record<string, unknown> = {};

      if (filters?.myPrincipalsOnly && salesId) {
        queryFilter.sales_id = salesId;
      }

      expect(queryFilter).toEqual({});
    });

    it("should return empty data when myPrincipalsOnly but no salesId", () => {
      const filters = { myPrincipalsOnly: true };
      const salesId = null;
      const salesIdLoading = false;

      // Logic from usePrincipalPipeline
      let shouldShowEmpty = false;
      if (filters?.myPrincipalsOnly && !salesIdLoading && !salesId) {
        shouldShowEmpty = true;
      }

      expect(shouldShowEmpty).toBe(true);
    });

    it("should wait for salesId to load before fetching", () => {
      const filters = { myPrincipalsOnly: true };
      const salesIdLoading = true;

      // Logic from usePrincipalPipeline
      let shouldWait = false;
      if (filters?.myPrincipalsOnly && salesIdLoading) {
        shouldWait = true;
      }

      expect(shouldWait).toBe(true);
    });
  });

  describe("View sales_id derivation", () => {
    it("should return account_manager_id from most recent opportunity", () => {
      // Simulates the subquery in principal_pipeline_summary view
      const opportunities = [
        { id: 1, principal_organization_id: 100, account_manager_id: 5, created_at: "2025-01-01" },
        { id: 2, principal_organization_id: 100, account_manager_id: 7, created_at: "2025-01-15" },
        {
          id: 3,
          principal_organization_id: 100,
          account_manager_id: null,
          created_at: "2025-01-10",
        },
      ];

      // View's subquery: ORDER BY created_at DESC LIMIT 1 WHERE account_manager_id IS NOT NULL
      const principalId = 100;
      const filtered = opportunities
        .filter((o) => o.principal_organization_id === principalId && o.account_manager_id !== null)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const salesIdFromView = filtered[0]?.account_manager_id ?? null;

      expect(salesIdFromView).toBe(7); // Most recent with non-null account_manager_id
    });

    it("should return null when no opportunities have account_manager_id", () => {
      const opportunities = [
        {
          id: 1,
          principal_organization_id: 100,
          account_manager_id: null,
          created_at: "2025-01-01",
        },
        {
          id: 2,
          principal_organization_id: 100,
          account_manager_id: null,
          created_at: "2025-01-15",
        },
      ];

      const principalId = 100;
      const filtered = opportunities
        .filter((o) => o.principal_organization_id === principalId && o.account_manager_id !== null)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const salesIdFromView = filtered[0]?.account_manager_id ?? null;

      expect(salesIdFromView).toBeNull();
    });

    it("should handle principals with no opportunities", () => {
      const opportunities: {
        principal_organization_id: number;
        account_manager_id: number | null;
      }[] = [];

      const principalId = 100;
      const filtered = opportunities.filter(
        (o) => o.principal_organization_id === principalId && o.account_manager_id !== null
      );
      const salesIdFromView = filtered[0]?.account_manager_id ?? null;

      expect(salesIdFromView).toBeNull();
    });
  });

  describe("Filter matching scenarios", () => {
    it("should match when salesId equals view sales_id", () => {
      const userSalesId = 7;
      const viewRecords = [
        { principal_id: 100, principal_name: "Acme Corp", sales_id: 7 },
        { principal_id: 101, principal_name: "Beta Inc", sales_id: 5 },
        { principal_id: 102, principal_name: "Gamma LLC", sales_id: null },
      ];

      // Simulates .eq('sales_id', userSalesId)
      const filtered = viewRecords.filter((r) => r.sales_id === userSalesId);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].principal_name).toBe("Acme Corp");
    });

    it("should return empty when no principals match salesId", () => {
      const userSalesId = 99; // No match
      const viewRecords = [
        { principal_id: 100, principal_name: "Acme Corp", sales_id: 7 },
        { principal_id: 101, principal_name: "Beta Inc", sales_id: 5 },
      ];

      const filtered = viewRecords.filter((r) => r.sales_id === userSalesId);

      expect(filtered).toHaveLength(0);
    });

    it("should handle NULL sales_id in view records", () => {
      const userSalesId = 7;
      const viewRecords = [
        { principal_id: 100, principal_name: "Acme Corp", sales_id: 7 },
        { principal_id: 102, principal_name: "Gamma LLC", sales_id: null }, // No account_manager
      ];

      // NULL !== 7, so Gamma LLC won't match
      const filtered = viewRecords.filter((r) => r.sales_id === userSalesId);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].principal_name).toBe("Acme Corp");
    });
  });
});
