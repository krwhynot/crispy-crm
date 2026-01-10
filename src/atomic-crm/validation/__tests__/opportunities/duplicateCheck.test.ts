import { describe, it, expect, vi, beforeEach } from "vitest";
import type { DataProvider } from "ra-core";
import {
  checkExactDuplicate,
  validateNoDuplicate,
  type DuplicateCheckParams,
} from "../../opportunities";

/**
 * Tests for checkExactDuplicate utility
 *
 * Verifies:
 * - P1 constraint: Fail-fast behavior (throws immediately on duplicate)
 * - P2 constraint: Uses dataProvider.getList (not direct Supabase)
 * - Focus: Blocks identical principal_id + customer_id + product_id
 */
describe("checkExactDuplicate", () => {
  let mockDataProvider: DataProvider;

  beforeEach(() => {
    // Reset mock before each test
    mockDataProvider = {
      getList: vi.fn(),
      getOne: vi.fn(),
      getMany: vi.fn(),
      getManyReference: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    };
  });

  describe("when no matching opportunities exist", () => {
    it("should return isDuplicate: false", async () => {
      // Mock: No opportunities match principal + customer
      vi.mocked(mockDataProvider.getList).mockResolvedValueOnce({
        data: [],
        total: 0,
      });

      const params: DuplicateCheckParams = {
        principal_id: "principal-1",
        customer_id: "customer-1",
        product_id: "product-1",
      };

      const result = await checkExactDuplicate(mockDataProvider, params);

      expect(result.isDuplicate).toBe(false);
      expect(result.existingOpportunity).toBeUndefined();

      // Verify dataProvider.getList was called with correct filters (P2 constraint)
      expect(mockDataProvider.getList).toHaveBeenCalledWith("opportunities", {
        filter: {
          principal_organization_id: "principal-1",
          customer_organization_id: "customer-1",
          "deleted_at@is": null,
        },
        pagination: { page: 1, perPage: 100 },
        sort: { field: "created_at", order: "DESC" },
      });
    });
  });

  describe("when matching principal + customer exists but different product", () => {
    it("should return isDuplicate: false", async () => {
      // Mock: Opportunity exists with matching principal + customer
      vi.mocked(mockDataProvider.getList)
        .mockResolvedValueOnce({
          data: [
            {
              id: "opp-existing",
              name: "Existing Opportunity",
              principal_organization_id: "principal-1",
              customer_organization_id: "customer-1",
              stage: "new_lead",
            },
          ],
          total: 1,
        })
        // Mock: But no matching product in opportunity_products
        .mockResolvedValueOnce({
          data: [],
          total: 0,
        });

      const params: DuplicateCheckParams = {
        principal_id: "principal-1",
        customer_id: "customer-1",
        product_id: "product-different",
      };

      const result = await checkExactDuplicate(mockDataProvider, params);

      expect(result.isDuplicate).toBe(false);

      // Verify opportunity_products was queried
      expect(mockDataProvider.getList).toHaveBeenCalledWith("opportunity_products", {
        filter: {
          opportunity_id: "opp-existing",
          product_id: "product-different",
          "deleted_at@is": null,
        },
        pagination: { page: 1, perPage: 1 },
        sort: { field: "id", order: "ASC" },
      });
    });
  });

  describe("when exact duplicate exists (principal + customer + product)", () => {
    it("should throw error with DUPLICATE_OPPORTUNITY code (P1: fail-fast)", async () => {
      // Mock: Opportunity exists with matching principal + customer
      vi.mocked(mockDataProvider.getList)
        .mockResolvedValueOnce({
          data: [
            {
              id: "opp-existing",
              name: "Existing Deal",
              principal_organization_id: "principal-1",
              customer_organization_id: "customer-1",
              stage: "demo_scheduled",
            },
          ],
          total: 1,
        })
        // Mock: AND matching product exists
        .mockResolvedValueOnce({
          data: [{ id: "op-1", opportunity_id: "opp-existing", product_id: "product-1" }],
          total: 1,
        });

      const params: DuplicateCheckParams = {
        principal_id: "principal-1",
        customer_id: "customer-1",
        product_id: "product-1",
      };

      // P1: Should throw immediately (fail-fast)
      // Verify error structure in one call
      let caughtError: any;
      try {
        await checkExactDuplicate(mockDataProvider, params);
      } catch (error: unknown) {
        caughtError = error;
      }

      expect(caughtError).toBeDefined();
      expect(caughtError.message).toMatch(/Duplicate opportunity detected/);
      expect(caughtError.code).toBe("DUPLICATE_OPPORTUNITY");
      expect(caughtError.existingOpportunity).toEqual({
        id: "opp-existing",
        name: "Existing Deal",
        stage: "demo_scheduled",
      });
    });

    it("should include existing opportunity details in error message", async () => {
      vi.mocked(mockDataProvider.getList)
        .mockResolvedValueOnce({
          data: [
            {
              id: "opp-123",
              name: "McCRUM - Sysco - Chicago",
              principal_organization_id: "principal-1",
              customer_organization_id: "customer-1",
              stage: "sample_visit_offered",
            },
          ],
          total: 1,
        })
        .mockResolvedValueOnce({
          data: [{ id: "op-1", opportunity_id: "opp-123", product_id: "product-1" }],
          total: 1,
        });

      const params: DuplicateCheckParams = {
        principal_id: "principal-1",
        customer_id: "customer-1",
        product_id: "product-1",
      };

      await expect(checkExactDuplicate(mockDataProvider, params)).rejects.toThrow(
        'Existing opportunity: "McCRUM - Sysco - Chicago" (ID: opp-123, Stage: sample_visit_offered)'
      );
    });
  });

  describe("when updating an existing opportunity (exclude_id)", () => {
    it("should exclude the current opportunity from duplicate check", async () => {
      // Mock: The same opportunity exists (which we're updating)
      vi.mocked(mockDataProvider.getList).mockResolvedValueOnce({
        data: [
          {
            id: "opp-current", // Same as exclude_id
            name: "Current Opportunity",
            principal_organization_id: "principal-1",
            customer_organization_id: "customer-1",
            stage: "new_lead",
          },
        ],
        total: 1,
      });

      const params: DuplicateCheckParams = {
        principal_id: "principal-1",
        customer_id: "customer-1",
        product_id: "product-1",
        exclude_id: "opp-current", // Exclude self from check
      };

      const result = await checkExactDuplicate(mockDataProvider, params);

      // Should NOT be a duplicate (it's the same opportunity we're updating)
      expect(result.isDuplicate).toBe(false);

      // Should NOT query opportunity_products since candidate list is empty after filtering
      expect(mockDataProvider.getList).toHaveBeenCalledTimes(1);
    });

    it("should still detect duplicates with other opportunities", async () => {
      // Mock: Two opportunities exist
      vi.mocked(mockDataProvider.getList)
        .mockResolvedValueOnce({
          data: [
            {
              id: "opp-current",
              name: "Current Opportunity",
              principal_organization_id: "principal-1",
              customer_organization_id: "customer-1",
              stage: "new_lead",
            },
            {
              id: "opp-other",
              name: "Other Opportunity",
              principal_organization_id: "principal-1",
              customer_organization_id: "customer-1",
              stage: "closed_won",
            },
          ],
          total: 2,
        })
        // Mock: opp-other has the same product
        .mockResolvedValueOnce({
          data: [{ id: "op-1", opportunity_id: "opp-other", product_id: "product-1" }],
          total: 1,
        });

      const params: DuplicateCheckParams = {
        principal_id: "principal-1",
        customer_id: "customer-1",
        product_id: "product-1",
        exclude_id: "opp-current",
      };

      // Should detect opp-other as duplicate
      await expect(checkExactDuplicate(mockDataProvider, params)).rejects.toThrow(
        /Duplicate opportunity detected/
      );
    });
  });

  describe("multiple candidate opportunities", () => {
    it("should check each candidate until duplicate found", async () => {
      // Mock: Multiple opportunities with same principal + customer
      vi.mocked(mockDataProvider.getList)
        .mockResolvedValueOnce({
          data: [
            {
              id: "opp-1",
              name: "Opportunity 1",
              principal_organization_id: "principal-1",
              customer_organization_id: "customer-1",
              stage: "new_lead",
            },
            {
              id: "opp-2",
              name: "Opportunity 2",
              principal_organization_id: "principal-1",
              customer_organization_id: "customer-1",
              stage: "feedback_logged",
            },
          ],
          total: 2,
        })
        // Mock: opp-1 has different product
        .mockResolvedValueOnce({
          data: [],
          total: 0,
        })
        // Mock: opp-2 has matching product
        .mockResolvedValueOnce({
          data: [{ id: "op-1", opportunity_id: "opp-2", product_id: "product-1" }],
          total: 1,
        });

      const params: DuplicateCheckParams = {
        principal_id: "principal-1",
        customer_id: "customer-1",
        product_id: "product-1",
      };

      await expect(checkExactDuplicate(mockDataProvider, params)).rejects.toThrow(
        'Existing opportunity: "Opportunity 2"'
      );

      // Verify both opportunity_products queries were made
      expect(mockDataProvider.getList).toHaveBeenCalledTimes(3);
    });
  });
});

describe("validateNoDuplicate", () => {
  let mockDataProvider: DataProvider;

  beforeEach(() => {
    mockDataProvider = {
      getList: vi.fn(),
      getOne: vi.fn(),
      getMany: vi.fn(),
      getManyReference: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    };
  });

  it("should resolve successfully when no duplicate exists", async () => {
    vi.mocked(mockDataProvider.getList).mockResolvedValueOnce({
      data: [],
      total: 0,
    });

    const params: DuplicateCheckParams = {
      principal_id: "principal-1",
      customer_id: "customer-1",
      product_id: "product-1",
    };

    await expect(validateNoDuplicate(mockDataProvider, params)).resolves.toBeUndefined();
  });

  it("should throw React Admin formatted error when duplicate exists", async () => {
    vi.mocked(mockDataProvider.getList)
      .mockResolvedValueOnce({
        data: [
          {
            id: "opp-existing",
            name: "Existing Deal",
            principal_organization_id: "principal-1",
            customer_organization_id: "customer-1",
            stage: "new_lead",
          },
        ],
        total: 1,
      })
      .mockResolvedValueOnce({
        data: [{ id: "op-1", opportunity_id: "opp-existing", product_id: "product-1" }],
        total: 1,
      });

    const params: DuplicateCheckParams = {
      principal_id: "principal-1",
      customer_id: "customer-1",
      product_id: "product-1",
    };

    await expect(validateNoDuplicate(mockDataProvider, params)).rejects.toMatchObject({
      message: "Validation failed",
      body: {
        errors: {
          product_id: expect.stringContaining("Duplicate opportunity detected"),
        },
      },
    });
  });
});
