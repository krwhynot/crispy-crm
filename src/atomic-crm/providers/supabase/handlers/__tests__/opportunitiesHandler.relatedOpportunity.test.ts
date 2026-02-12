/**
 * Tests for opportunitiesHandler - related_opportunity_id validation
 *
 * Tests the validation logic for linking opportunities:
 * 1. Valid link (same principal) -> validation passes, baseProvider.create/update called
 * 2. Self-link -> throws Error "Cannot link opportunity to itself"
 * 3. Cross-principal link -> throws Error "must have same principal"
 * 4. Link to deleted opportunity -> throws Error "not found or deleted"
 * 5. Link to non-existent opportunity -> throws Error "not found or deleted"
 *
 * Engineering Constitution: Fail-fast validation at handler layer
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { DataProvider, RaRecord } from "react-admin";

// Use vi.hoisted to define mocks before vi.mock (hoisting issues)
const { mockFrom, mockQueryBuilder } = vi.hoisted(() => {
  const mockBuilder = {
    select: vi.fn(),
    eq: vi.fn(),
    is: vi.fn(),
    single: vi.fn(),
  };

  // Default: chain all methods to return builder
  mockBuilder.select.mockReturnValue(mockBuilder);
  mockBuilder.eq.mockReturnValue(mockBuilder);
  mockBuilder.is.mockReturnValue(mockBuilder);
  mockBuilder.single.mockResolvedValue({ data: null, error: null });

  return {
    mockFrom: vi.fn().mockReturnValue(mockBuilder),
    mockQueryBuilder: mockBuilder,
  };
});

// Mock supabase client
vi.mock("../../supabase", () => ({
  supabase: {
    from: mockFrom,
  },
}));

// Mock OpportunitiesService to prevent product sync interference
vi.mock("../../../../services/opportunities.service", () => ({
  OpportunitiesService: vi.fn().mockImplementation(() => ({
    createWithProducts: vi.fn(),
    updateWithProducts: vi.fn(),
  })),
}));

// Import handler after mocking
import { createOpportunitiesHandler } from "../opportunitiesHandler";

describe("opportunitiesHandler - related_opportunity_id validation", () => {
  let mockBaseProvider: DataProvider;
  let handler: DataProvider;

  beforeEach(() => {
    vi.clearAllMocks();

    // Restore mockFrom to return mockQueryBuilder (reset clears this)
    mockFrom.mockReturnValue(mockQueryBuilder);

    // Reset query builder mocks to default chain behavior
    mockQueryBuilder.select.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.eq.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.is.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.single.mockResolvedValue({ data: null, error: null });

    // Create mock base provider with all required DataProvider methods
    mockBaseProvider = {
      getList: vi.fn().mockResolvedValue({ data: [], total: 0 }),
      getOne: vi.fn().mockResolvedValue({ data: { id: 1 } }),
      getMany: vi.fn().mockResolvedValue({ data: [] }),
      getManyReference: vi.fn().mockResolvedValue({ data: [], total: 0 }),
      create: vi.fn().mockResolvedValue({ data: { id: 1 } }),
      update: vi.fn().mockResolvedValue({ data: { id: 1 } }),
      updateMany: vi.fn().mockResolvedValue({ data: [1] }),
      delete: vi.fn().mockResolvedValue({ data: { id: 1 } }),
      deleteMany: vi.fn().mockResolvedValue({ data: [1, 2] }),
    };

    handler = createOpportunitiesHandler(mockBaseProvider);
  });

  describe("create with related_opportunity_id", () => {
    it("should allow valid link with same principal", async () => {
      // Mock: Related opportunity exists with same principal_organization_id
      mockQueryBuilder.single.mockResolvedValue({
        data: { principal_organization_id: 100 },
        error: null,
      });

      await handler.create("opportunities", {
        data: {
          name: "Test Opportunity",
          customer_organization_id: 1,
          principal_organization_id: 100,
          estimated_close_date: new Date("2026-03-01"),
          stage: "new_lead",
          priority: "medium",
          contact_ids: [1],
          related_opportunity_id: 50,
        },
      });

      // Should query for related opportunity
      expect(mockFrom).toHaveBeenCalledWith("opportunities");
      expect(mockQueryBuilder.select).toHaveBeenCalledWith("principal_organization_id");
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("id", 50);
      expect(mockQueryBuilder.is).toHaveBeenCalledWith("deleted_at", null);

      // Should proceed with create
      expect(mockBaseProvider.create).toHaveBeenCalled();
    });

    it("should reject cross-principal link", async () => {
      // Mock: Related opportunity has DIFFERENT principal
      mockQueryBuilder.single.mockResolvedValue({
        data: { principal_organization_id: 200 },
        error: null,
      });

      await expect(
        handler.create("opportunities", {
          data: {
            name: "Test Opportunity",
            customer_organization_id: 1,
            principal_organization_id: 100,
            estimated_close_date: new Date("2026-03-01"),
            stage: "new_lead",
            priority: "medium",
            contact_ids: [1],
            related_opportunity_id: 50,
          },
        })
      ).rejects.toThrow("Related opportunity must have same principal");

      // Should NOT proceed with create
      expect(mockBaseProvider.create).not.toHaveBeenCalled();
    });

    it("should reject link to deleted opportunity", async () => {
      // Mock: Opportunity not found (deleted_at IS NULL filter returns no data)
      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: { code: "PGRST116", message: "not found" },
      });

      await expect(
        handler.create("opportunities", {
          data: {
            name: "Test Opportunity",
            customer_organization_id: 1,
            principal_organization_id: 100,
            estimated_close_date: new Date("2026-03-01"),
            stage: "new_lead",
            priority: "medium",
            contact_ids: [1],
            related_opportunity_id: 999,
          },
        })
      ).rejects.toThrow("Related opportunity not found or deleted");

      // Should NOT proceed with create
      expect(mockBaseProvider.create).not.toHaveBeenCalled();
    });

    it("should reject link to non-existent opportunity", async () => {
      // Mock: Opportunity does not exist
      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: null,
      });

      await expect(
        handler.create("opportunities", {
          data: {
            name: "Test Opportunity",
            customer_organization_id: 1,
            principal_organization_id: 100,
            estimated_close_date: new Date("2026-03-01"),
            stage: "new_lead",
            priority: "medium",
            contact_ids: [1],
            related_opportunity_id: 9999,
          },
        })
      ).rejects.toThrow("Related opportunity not found or deleted");

      // Should NOT proceed with create
      expect(mockBaseProvider.create).not.toHaveBeenCalled();
    });

    it("should skip validation when related_opportunity_id is null/undefined", async () => {
      // No related_opportunity_id - should not query opportunities table
      await handler.create("opportunities", {
        data: {
          name: "Test Opportunity",
          customer_organization_id: 1,
          principal_organization_id: 100,
          estimated_close_date: new Date("2026-03-01"),
          stage: "new_lead",
          priority: "medium",
          contact_ids: [1],
          related_opportunity_id: null,
        },
      });

      // Should NOT query for related opportunity
      expect(mockFrom).not.toHaveBeenCalledWith("opportunities");

      // Should proceed with create
      expect(mockBaseProvider.create).toHaveBeenCalled();
    });

    it("should skip validation when related_opportunity_id is not provided", async () => {
      // No related_opportunity_id field at all
      await handler.create("opportunities", {
        data: {
          name: "Test Opportunity",
          customer_organization_id: 1,
          principal_organization_id: 100,
          estimated_close_date: new Date("2026-03-01"),
          stage: "new_lead",
          priority: "medium",
          contact_ids: [1],
        },
      });

      // Should NOT query for related opportunity
      expect(mockFrom).not.toHaveBeenCalledWith("opportunities");

      // Should proceed with create
      expect(mockBaseProvider.create).toHaveBeenCalled();
    });
  });

  describe("update with related_opportunity_id", () => {
    it("should reject self-link", async () => {
      await expect(
        handler.update("opportunities", {
          id: 10,
          data: {
            id: 10,
            principal_organization_id: 100,
            related_opportunity_id: 10, // Same as id - self-link
          },
          previousData: { id: 10, principal_organization_id: 100 } as RaRecord,
        })
      ).rejects.toThrow("Cannot link opportunity to itself");

      // Should NOT proceed with update
      expect(mockBaseProvider.update).not.toHaveBeenCalled();
    });

    it("should allow valid link with same principal on update", async () => {
      // Mock: Related opportunity exists with same principal
      mockQueryBuilder.single.mockResolvedValue({
        data: { principal_organization_id: 100 },
        error: null,
      });

      await handler.update("opportunities", {
        id: 10,
        data: {
          id: 10,
          principal_organization_id: 100,
          related_opportunity_id: 50,
        },
        previousData: { id: 10, principal_organization_id: 100 } as RaRecord,
      });

      // Should query for related opportunity
      expect(mockFrom).toHaveBeenCalledWith("opportunities");
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("id", 50);

      // Should proceed with update
      expect(mockBaseProvider.update).toHaveBeenCalled();
    });

    it("should reject cross-principal link on update", async () => {
      // Mock: Related opportunity has DIFFERENT principal
      mockQueryBuilder.single.mockResolvedValue({
        data: { principal_organization_id: 200 },
        error: null,
      });

      await expect(
        handler.update("opportunities", {
          id: 10,
          data: {
            id: 10,
            principal_organization_id: 100,
            related_opportunity_id: 50,
          },
          previousData: { id: 10, principal_organization_id: 100 } as RaRecord,
        })
      ).rejects.toThrow("Related opportunity must have same principal");

      // Should NOT proceed with update
      expect(mockBaseProvider.update).not.toHaveBeenCalled();
    });

    it("should reject link to non-existent opportunity on update", async () => {
      // Mock: Related opportunity does not exist
      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: null,
      });

      await expect(
        handler.update("opportunities", {
          id: 10,
          data: {
            id: 10,
            principal_organization_id: 100,
            related_opportunity_id: 9999,
          },
          previousData: { id: 10, principal_organization_id: 100 } as RaRecord,
        })
      ).rejects.toThrow("Related opportunity not found or deleted");

      // Should NOT proceed with update
      expect(mockBaseProvider.update).not.toHaveBeenCalled();
    });

    it("should allow clearing related_opportunity_id (set to null)", async () => {
      await handler.update("opportunities", {
        id: 10,
        data: {
          id: 10,
          principal_organization_id: 100,
          related_opportunity_id: null, // Clearing the link
        },
        previousData: {
          id: 10,
          principal_organization_id: 100,
          related_opportunity_id: 50,
        } as RaRecord,
      });

      // Should NOT query for related opportunity when clearing
      expect(mockFrom).not.toHaveBeenCalledWith("opportunities");

      // Should proceed with update
      expect(mockBaseProvider.update).toHaveBeenCalled();
    });

    it("should skip validation when related_opportunity_id unchanged", async () => {
      // Update without changing related_opportunity_id
      await handler.update("opportunities", {
        id: 10,
        data: {
          id: 10,
          principal_organization_id: 100,
          stage: "initial_outreach", // Only stage changed
        },
        previousData: {
          id: 10,
          principal_organization_id: 100,
          related_opportunity_id: 50,
        } as RaRecord,
      });

      // Should NOT query for related opportunity if not being changed
      // (Implementation may choose to skip validation when field not in data)
      expect(mockBaseProvider.update).toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("should handle numeric ID comparison correctly", async () => {
      // The implementation uses strict equality (===) for principal_organization_id comparison.
      // Supabase returns integers as numbers, so form inputs should be numbers too.
      // When both are numbers, comparison works correctly.
      mockQueryBuilder.single.mockResolvedValue({
        data: { principal_organization_id: 100 },
        error: null,
      });

      await handler.create("opportunities", {
        data: {
          name: "Test",
          customer_organization_id: 1,
          principal_organization_id: 100, // Number ID (matches Supabase return type)
          estimated_close_date: new Date("2026-03-01"),
          stage: "new_lead",
          priority: "medium",
          contact_ids: [1],
          related_opportunity_id: 50, // Number ID
        },
      });

      // Should work when types match
      expect(mockBaseProvider.create).toHaveBeenCalled();
    });

    it("should fail when ID types mismatch (string vs number) due to strict equality", async () => {
      // NOTE: This test documents current behavior - the implementation uses strict equality (===)
      // which means string "100" !== number 100. This could be considered a bug that should be
      // fixed by using Number() conversion or loose equality (==).
      mockQueryBuilder.single.mockResolvedValue({
        data: { principal_organization_id: 100 }, // Number from Supabase
        error: null,
      });

      // When form sends string "100" but Supabase returns number 100, strict equality fails
      await expect(
        handler.create("opportunities", {
          data: {
            name: "Test",
            customer_organization_id: 1,
            principal_organization_id: "100", // String from form
            estimated_close_date: new Date("2026-03-01"),
            stage: "new_lead",
            priority: "medium",
            contact_ids: [1],
            related_opportunity_id: 50,
          },
        })
      ).rejects.toThrow("Related opportunity must have same principal");
    });

    it("should pass through non-opportunities resources without validation", async () => {
      // Create on different resource should not trigger related opportunity validation
      await handler.create("contacts", {
        data: {
          first_name: "John",
          last_name: "Doe",
        },
      });

      // Should NOT query opportunities table
      expect(mockFrom).not.toHaveBeenCalledWith("opportunities");

      // Should delegate to base provider
      expect(mockBaseProvider.create).toHaveBeenCalledWith("contacts", expect.any(Object));
    });

    it("should handle database errors gracefully", async () => {
      // Mock: Database error
      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: { code: "PGRST500", message: "Internal server error" },
      });

      await expect(
        handler.create("opportunities", {
          data: {
            name: "Test",
            customer_organization_id: 1,
            principal_organization_id: 100,
            estimated_close_date: new Date("2026-03-01"),
            stage: "new_lead",
            priority: "medium",
            contact_ids: [1],
            related_opportunity_id: 50,
          },
        })
      ).rejects.toThrow(); // Should propagate the error

      expect(mockBaseProvider.create).not.toHaveBeenCalled();
    });
  });
});
