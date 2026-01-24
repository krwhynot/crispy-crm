/**
 * Tests for OpportunitiesService - Core business logic for opportunity management
 *
 * Tests verify:
 * 1. Archive operations (soft delete with cascading to related records)
 * 2. Unarchive operations (restore soft-deleted opportunities)
 * 3. RPC function invocation correctness
 * 4. Error handling and logging
 */

import { describe, test, expect, vi, beforeEach, type Mock } from "vitest";
import { OpportunitiesService } from "../opportunities.service";
import type { Opportunity } from "../../types";
import { createMockDataProvider, createMockOpportunity } from "@/tests/utils/mock-providers";
import { createMockDataProviderWithRpc, type DataProviderWithRpc } from "@/tests/utils/typed-mocks";

// Mock supabase module
vi.mock("../../providers/supabase/supabase", () => ({
  supabase: {
    rpc: vi.fn(),
  },
}));

describe("OpportunitiesService", () => {
  let service: OpportunitiesService;
  let mockDataProvider: DataProviderWithRpc;
  let mockOpportunity: Opportunity;

  beforeEach(() => {
    mockDataProvider = createMockDataProviderWithRpc(createMockDataProvider());
    service = new OpportunitiesService(mockDataProvider);

    mockOpportunity = createMockOpportunity({
      id: 1,
      name: "Test Opportunity",
      deleted_at: null,
    });
  });

  describe("archiveOpportunity", () => {
    test("should call archive RPC function with opportunity ID", async () => {
      mockDataProvider.rpc = vi.fn().mockResolvedValue({ success: true });

      await service.archiveOpportunity(mockOpportunity);

      expect(mockDataProvider.rpc).toHaveBeenCalledWith("archive_opportunity_with_relations", {
        opp_id: mockOpportunity.id,
      });
    });

    test("should cascade to related records (activities, notes, participants, tasks)", async () => {
      // This test verifies the RPC function name matches the expected cascade behavior
      // The actual cascade logic is in the database RPC function
      mockDataProvider.rpc = vi.fn().mockResolvedValue({ success: true });

      await service.archiveOpportunity(mockOpportunity);

      // Verify we're calling the correct RPC function that handles cascades
      expect(mockDataProvider.rpc).toHaveBeenCalledWith(
        "archive_opportunity_with_relations", // "with_relations" indicates cascade
        expect.any(Object)
      );
    });

    test("should return RPC response", async () => {
      const mockResponse = {
        success: true,
        archived_count: 1,
        related_records: { activities: 5, notes: 3, participants: 2, tasks: 4 },
      };
      mockDataProvider.rpc = vi.fn().mockResolvedValue(mockResponse);

      const result = await service.archiveOpportunity(mockOpportunity);

      expect(result).toEqual(mockResponse);
    });

    test("should throw with enhanced error message on RPC failure", async () => {
      mockDataProvider.rpc = vi.fn().mockRejectedValue(new Error("RPC execution failed"));

      await expect(service.archiveOpportunity(mockOpportunity)).rejects.toThrow(
        "Archive opportunity failed: RPC execution failed"
      );
    });

    test("should handle database constraint errors gracefully", async () => {
      mockDataProvider.rpc = vi
        .fn()
        .mockRejectedValue(new Error("violates foreign key constraint"));

      await expect(service.archiveOpportunity(mockOpportunity)).rejects.toThrow(
        "Archive opportunity failed: violates foreign key constraint"
      );
    });

    test("should work with numeric and string IDs", async () => {
      mockDataProvider.rpc = vi.fn().mockResolvedValue({ success: true });

      // Numeric ID
      await service.archiveOpportunity({ ...mockOpportunity, id: 123 });
      expect(mockDataProvider.rpc).toHaveBeenCalledWith("archive_opportunity_with_relations", {
        opp_id: 123,
      });

      // String ID
      await service.archiveOpportunity({ ...mockOpportunity, id: "uuid-123" });
      expect(mockDataProvider.rpc).toHaveBeenCalledWith("archive_opportunity_with_relations", {
        opp_id: "uuid-123",
      });
    });

    test("should log error details on failure", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      mockDataProvider.rpc = vi.fn().mockRejectedValue(new Error("Database connection lost"));

      await expect(service.archiveOpportunity(mockOpportunity)).rejects.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[OpportunitiesService]",
        "Failed to archive opportunity",
        expect.objectContaining({
          opportunityId: mockOpportunity.id,
          error: expect.any(Error),
        })
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe("unarchiveOpportunity", () => {
    beforeEach(() => {
      // Set opportunity as archived
      mockOpportunity.deleted_at = new Date().toISOString();
    });

    test("should call unarchive RPC function with opportunity ID", async () => {
      mockDataProvider.rpc = vi.fn().mockResolvedValue({ success: true });

      await service.unarchiveOpportunity(mockOpportunity);

      expect(mockDataProvider.rpc).toHaveBeenCalledWith("unarchive_opportunity_with_relations", {
        opp_id: mockOpportunity.id,
      });
    });

    test("should cascade to related records (activities, notes, participants, tasks)", async () => {
      mockDataProvider.rpc = vi.fn().mockResolvedValue({ success: true });

      await service.unarchiveOpportunity(mockOpportunity);

      // Verify we're calling the correct RPC function that handles cascades
      expect(mockDataProvider.rpc).toHaveBeenCalledWith(
        "unarchive_opportunity_with_relations", // "with_relations" indicates cascade
        expect.any(Object)
      );
    });

    test("should return RPC response", async () => {
      const mockResponse = {
        success: true,
        unarchived_count: 1,
        related_records: { activities: 5, notes: 3, participants: 2, tasks: 4 },
      };
      mockDataProvider.rpc = vi.fn().mockResolvedValue(mockResponse);

      const result = await service.unarchiveOpportunity(mockOpportunity);

      expect(result).toEqual(mockResponse);
    });

    test("should throw with enhanced error message on RPC failure", async () => {
      mockDataProvider.rpc = vi.fn().mockRejectedValue(new Error("RPC execution failed"));

      await expect(service.unarchiveOpportunity(mockOpportunity)).rejects.toThrow(
        "Unarchive opportunity failed: RPC execution failed"
      );
    });

    test("should handle already unarchived opportunities gracefully", async () => {
      // RPC function should be idempotent
      mockDataProvider.rpc = vi.fn().mockResolvedValue({
        success: true,
        unarchived_count: 0, // No records updated
      });

      const result = await service.unarchiveOpportunity({
        ...mockOpportunity,
        deleted_at: null, // Already unarchived
      });

      expect(result.success).toBe(true);
    });

    test("should work with numeric and string IDs", async () => {
      mockDataProvider.rpc = vi.fn().mockResolvedValue({ success: true });

      // Numeric ID
      await service.unarchiveOpportunity({ ...mockOpportunity, id: 456 });
      expect(mockDataProvider.rpc).toHaveBeenCalledWith("unarchive_opportunity_with_relations", {
        opp_id: 456,
      });

      // String ID
      await service.unarchiveOpportunity({ ...mockOpportunity, id: "uuid-456" });
      expect(mockDataProvider.rpc).toHaveBeenCalledWith("unarchive_opportunity_with_relations", {
        opp_id: "uuid-456",
      });
    });

    test("should log error details on failure", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      mockDataProvider.rpc = vi.fn().mockRejectedValue(new Error("Database connection lost"));

      await expect(service.unarchiveOpportunity(mockOpportunity)).rejects.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[OpportunitiesService]",
        "Failed to unarchive opportunity",
        expect.objectContaining({
          opportunityId: mockOpportunity.id,
          error: expect.any(Error),
        })
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe("Archive/Unarchive Integration", () => {
    test("should support archive -> unarchive workflow", async () => {
      mockDataProvider.rpc = vi
        .fn()
        .mockResolvedValueOnce({ success: true, archived_count: 1 })
        .mockResolvedValueOnce({ success: true, unarchived_count: 1 });

      // Archive
      await service.archiveOpportunity(mockOpportunity);
      expect(mockDataProvider.rpc).toHaveBeenCalledWith(
        "archive_opportunity_with_relations",
        expect.any(Object)
      );

      // Unarchive
      await service.unarchiveOpportunity(mockOpportunity);
      expect(mockDataProvider.rpc).toHaveBeenCalledWith(
        "unarchive_opportunity_with_relations",
        expect.any(Object)
      );

      expect(mockDataProvider.rpc).toHaveBeenCalledTimes(2);
    });

    test("should handle multiple archive operations (idempotency)", async () => {
      mockDataProvider.rpc = vi.fn().mockResolvedValue({ success: true });

      // Archive twice
      await service.archiveOpportunity(mockOpportunity);
      await service.archiveOpportunity(mockOpportunity);

      // Both should succeed (RPC should be idempotent)
      expect(mockDataProvider.rpc).toHaveBeenCalledTimes(2);
    });

    test("should handle multiple unarchive operations (idempotency)", async () => {
      mockDataProvider.rpc = vi.fn().mockResolvedValue({ success: true });

      // Unarchive twice
      await service.unarchiveOpportunity(mockOpportunity);
      await service.unarchiveOpportunity(mockOpportunity);

      // Both should succeed (RPC should be idempotent)
      expect(mockDataProvider.rpc).toHaveBeenCalledTimes(2);
    });
  });

  describe("Error Handling Edge Cases", () => {
    test("should handle null RPC response gracefully", async () => {
      mockDataProvider.rpc = vi.fn().mockResolvedValue(null);

      const result = await service.archiveOpportunity(mockOpportunity);
      expect(result).toBeNull();
    });

    test("should handle undefined opportunity ID", async () => {
      mockDataProvider.rpc = vi.fn().mockResolvedValue({ success: true });

      // Intentional: testing undefined ID handling - bypasses type check
      const opportunityWithUndefinedId = {
        ...mockOpportunity,
        id: undefined,
      } as unknown as Opportunity;
      await service.archiveOpportunity(opportunityWithUndefinedId);

      expect(mockDataProvider.rpc).toHaveBeenCalledWith("archive_opportunity_with_relations", {
        opp_id: undefined,
      });
    });

    test("should handle network timeout errors", async () => {
      mockDataProvider.rpc = vi
        .fn()
        .mockRejectedValue(new Error("Network request failed: timeout"));

      await expect(service.archiveOpportunity(mockOpportunity)).rejects.toThrow(
        "Archive opportunity failed: Network request failed: timeout"
      );
    });

    test("should handle RLS policy violations", async () => {
      mockDataProvider.rpc = vi
        .fn()
        .mockRejectedValue(new Error("new row violates row-level security policy"));

      await expect(service.archiveOpportunity(mockOpportunity)).rejects.toThrow(
        "Archive opportunity failed: new row violates row-level security policy"
      );
    });
  });

  describe("createWithProducts", () => {
    const mockInputData = {
      name: "New Opportunity",
      customer_organization_id: 1,
      principal_organization_id: 2,
      estimated_close_date: "2025-12-31",
      contact_ids: [1, 2],
      stage: "new_lead",
      priority: "high",
    };

    test("should create opportunity without products using standard create when no products provided", async () => {
      mockDataProvider.create = vi.fn().mockResolvedValue({
        data: { ...mockOpportunity, ...mockInputData },
      });

      const result = await service.createWithProducts(mockInputData);

      expect(mockDataProvider.create).toHaveBeenCalledWith("opportunities", {
        data: mockInputData,
      });
      expect(result).toEqual({ ...mockOpportunity, ...mockInputData });
    });

    test("should create opportunity without products when products_to_sync is empty array", async () => {
      mockDataProvider.create = vi.fn().mockResolvedValue({
        data: { ...mockOpportunity, ...mockInputData },
      });

      const result = await service.createWithProducts({
        ...mockInputData,
        products_to_sync: [],
      });

      expect(mockDataProvider.create).toHaveBeenCalledWith("opportunities", {
        data: mockInputData,
      });
      expect(result).toEqual({ ...mockOpportunity, ...mockInputData });
    });

    test("should call RPC sync function when products_to_sync provided", async () => {
      const mockRpcData = { ...mockOpportunity, id: 1, ...mockInputData };
      mockDataProvider.rpc = vi.fn().mockResolvedValue(mockRpcData);

      const products = [
        { product_id_reference: 1, notes: "Test product" },
        { product_id_reference: 2, notes: "Another product" },
      ];

      const result = await service.createWithProducts({
        ...mockInputData,
        products_to_sync: products,
      });

      expect(mockDataProvider.rpc).toHaveBeenCalledWith("sync_opportunity_with_products", {
        opportunity_data: mockInputData,
        products_to_create: products,
        products_to_update: [],
        product_ids_to_delete: [],
      });

      expect(result).toEqual(mockRpcData);
    });

    test("should remove products_to_sync from opportunity data before sending to database", async () => {
      mockDataProvider.rpc = vi.fn().mockResolvedValue({
        ...mockOpportunity,
        ...mockInputData,
        id: 1,
      });

      const products = [{ product_id_reference: 1, notes: "Test" }];

      await service.createWithProducts({
        ...mockInputData,
        products_to_sync: products,
      });

      const rpcMock = mockDataProvider.rpc as Mock;
      const callArgs = rpcMock.mock.calls[0][1];

      // Verify products_to_sync is not in opportunity_data
      expect(callArgs.opportunity_data).not.toHaveProperty("products_to_sync");
      expect(callArgs.opportunity_data).toEqual(mockInputData);
    });

    test("should handle RPC error and throw enhanced error message", async () => {
      const rpcError = new Error("RPC sync failed");
      mockDataProvider.rpc = vi.fn().mockRejectedValue(rpcError);

      const products = [{ product_id_reference: 1 }];

      await expect(
        service.createWithProducts({
          ...mockInputData,
          products_to_sync: products,
        })
      ).rejects.toThrow("RPC sync failed");
    });
  });

  describe("updateWithProducts", () => {
    const mockUpdateData = {
      name: "Updated Opportunity",
      priority: "critical",
    };

    const previousProducts = [
      { id: 1, product_id_reference: 1, product_name: "Product 1", notes: "Old notes" },
      { id: 2, product_id_reference: 2, product_name: "Product 2", notes: null },
    ];

    test("should update opportunity without products using standard update when no products provided", async () => {
      mockDataProvider.update = vi.fn().mockResolvedValue({
        data: { ...mockOpportunity, ...mockUpdateData },
      });

      const result = await service.updateWithProducts(1, mockUpdateData, []);

      expect(mockDataProvider.update).toHaveBeenCalledWith("opportunities", {
        id: 1,
        data: { ...mockUpdateData, id: 1 },
      });
      expect(result).toEqual({ ...mockOpportunity, ...mockUpdateData });
    });

    test("should update opportunity without products when products_to_sync is empty array", async () => {
      mockDataProvider.update = vi.fn().mockResolvedValue({
        data: { ...mockOpportunity, ...mockUpdateData },
      });

      const result = await service.updateWithProducts(
        1,
        { ...mockUpdateData, products_to_sync: [] },
        previousProducts
      );

      expect(mockDataProvider.update).toHaveBeenCalled();
      expect(result).toEqual({ ...mockOpportunity, ...mockUpdateData });
    });

    test("should diff products correctly (creates, updates, deletes)", async () => {
      mockDataProvider.rpc = vi.fn().mockResolvedValue({
        ...mockOpportunity,
        id: 1,
        ...mockUpdateData,
      });

      const formProducts = [
        { id: 1, product_id_reference: 1, product_name: "Product 1", notes: "New notes" }, // Update (changed notes)
        { product_id_reference: 3, product_name: "Product 3", notes: "New product" }, // Create (no id)
        // Product 2 is deleted (not in form)
      ];

      await service.updateWithProducts(
        1,
        {
          ...mockUpdateData,
          products_to_sync: formProducts,
        },
        previousProducts
      );

      expect(mockDataProvider.rpc).toHaveBeenCalledWith(
        "sync_opportunity_with_products",
        expect.objectContaining({
          products_to_create: expect.arrayContaining([
            expect.objectContaining({ product_id_reference: 3 }),
          ]),
          products_to_update: expect.arrayContaining([expect.objectContaining({ id: 1 })]),
          product_ids_to_delete: expect.arrayContaining([2]),
        })
      );
    });

    test("should preserve opportunity ID when sending update to RPC", async () => {
      mockDataProvider.rpc = vi.fn().mockResolvedValue({
        ...mockOpportunity,
        id: 789,
        ...mockUpdateData,
      });

      const formProducts = [{ product_id_reference: 1 }];

      await service.updateWithProducts(
        789,
        {
          ...mockUpdateData,
          products_to_sync: formProducts,
        },
        previousProducts
      );

      expect(mockDataProvider.rpc).toHaveBeenCalledWith(
        "sync_opportunity_with_products",
        expect.objectContaining({
          opportunity_data: expect.objectContaining({ id: 789 }),
        })
      );
    });
  });
});
