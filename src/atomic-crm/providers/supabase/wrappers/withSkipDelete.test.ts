/**
 * Tests for withSkipDelete wrapper
 *
 * TDD: These tests verify the skipDelete flag interception behavior
 * that allows lifecycle callbacks to signal "don't do hard DELETE"
 *
 * Key behaviors:
 * 1. When meta.skipDelete=true, return fake success without calling base provider
 * 2. When meta.skipDelete is not set, pass through to base provider
 * 3. Works for both delete() and deleteMany() methods
 * 4. Preserves all other DataProvider methods unchanged
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { DataProvider } from "ra-core";
import { withSkipDelete } from "./withSkipDelete";

describe("withSkipDelete", () => {
  let mockProvider: DataProvider;

  beforeEach(() => {
    // Create mock DataProvider
    mockProvider = {
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

  describe("delete() with skipDelete flag", () => {
    it("should return fake success when meta.skipDelete is true", async () => {
      // The base provider should NOT be called
      (mockProvider.delete as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("Should not be called")
      );

      const wrappedProvider = withSkipDelete(mockProvider);
      const result = await wrappedProvider.delete("organizations", {
        id: 123,
        previousData: { id: 123, name: "Test Org" },
        meta: { skipDelete: true },
      });

      // Should return success without calling base provider
      expect(result).toEqual({ data: { id: 123 } });
      expect(mockProvider.delete).not.toHaveBeenCalled();
    });

    it("should pass through to base provider when skipDelete is not set", async () => {
      const expectedResult = { data: { id: 456, name: "Deleted Org" } };
      (mockProvider.delete as ReturnType<typeof vi.fn>).mockResolvedValue(expectedResult);

      const wrappedProvider = withSkipDelete(mockProvider);
      const result = await wrappedProvider.delete("organizations", {
        id: 456,
        previousData: { id: 456, name: "Deleted Org" },
      });

      // Should call base provider and return its result
      expect(mockProvider.delete).toHaveBeenCalledWith("organizations", {
        id: 456,
        previousData: { id: 456, name: "Deleted Org" },
      });
      expect(result).toEqual(expectedResult);
    });

    it("should pass through to base provider when skipDelete is false", async () => {
      const expectedResult = { data: { id: 789 } };
      (mockProvider.delete as ReturnType<typeof vi.fn>).mockResolvedValue(expectedResult);

      const wrappedProvider = withSkipDelete(mockProvider);
      const result = await wrappedProvider.delete("contacts", {
        id: 789,
        previousData: { id: 789 },
        meta: { skipDelete: false },
      });

      // Should call base provider when skipDelete is explicitly false
      expect(mockProvider.delete).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });

    it("should pass through to base provider when meta exists but skipDelete is missing", async () => {
      const expectedResult = { data: { id: 101 } };
      (mockProvider.delete as ReturnType<typeof vi.fn>).mockResolvedValue(expectedResult);

      const wrappedProvider = withSkipDelete(mockProvider);
      const result = await wrappedProvider.delete("tasks", {
        id: 101,
        previousData: { id: 101 },
        meta: { someOtherFlag: true },
      });

      // Should call base provider when skipDelete is not present
      expect(mockProvider.delete).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });

    it("should propagate errors from base provider when skipDelete is not set", async () => {
      const error = new Error("Foreign key constraint violation");
      (mockProvider.delete as ReturnType<typeof vi.fn>).mockRejectedValue(error);

      const wrappedProvider = withSkipDelete(mockProvider);
      await expect(
        wrappedProvider.delete("organizations", {
          id: 999,
          previousData: { id: 999 },
        })
      ).rejects.toThrow("Foreign key constraint violation");
    });
  });

  describe("deleteMany() with skipDelete flag", () => {
    it("should return fake success when meta.skipDelete is true", async () => {
      // The base provider should NOT be called
      (mockProvider.deleteMany as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("Should not be called")
      );

      const wrappedProvider = withSkipDelete(mockProvider);
      const result = await wrappedProvider.deleteMany("organizations", {
        ids: [1, 2, 3],
        meta: { skipDelete: true },
      });

      // Should return success with ids without calling base provider
      expect(result).toEqual({ data: [1, 2, 3] });
      expect(mockProvider.deleteMany).not.toHaveBeenCalled();
    });

    it("should pass through to base provider when skipDelete is not set", async () => {
      const expectedResult = { data: [4, 5, 6] };
      (mockProvider.deleteMany as ReturnType<typeof vi.fn>).mockResolvedValue(expectedResult);

      const wrappedProvider = withSkipDelete(mockProvider);
      const result = await wrappedProvider.deleteMany("contacts", {
        ids: [4, 5, 6],
      });

      // Should call base provider and return its result
      expect(mockProvider.deleteMany).toHaveBeenCalledWith("contacts", {
        ids: [4, 5, 6],
      });
      expect(result).toEqual(expectedResult);
    });

    it("should propagate errors from base provider when skipDelete is not set", async () => {
      const error = new Error("Batch delete failed");
      (mockProvider.deleteMany as ReturnType<typeof vi.fn>).mockRejectedValue(error);

      const wrappedProvider = withSkipDelete(mockProvider);
      await expect(
        wrappedProvider.deleteMany("organizations", {
          ids: [7, 8, 9],
        })
      ).rejects.toThrow("Batch delete failed");
    });
  });

  describe("other methods passthrough", () => {
    it("should pass through getList unchanged", async () => {
      const expectedResult = { data: [{ id: 1 }], total: 1 };
      (mockProvider.getList as ReturnType<typeof vi.fn>).mockResolvedValue(expectedResult);

      const wrappedProvider = withSkipDelete(mockProvider);
      const result = await wrappedProvider.getList("organizations", {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "id", order: "ASC" },
        filter: {},
      });

      expect(result).toEqual(expectedResult);
      expect(mockProvider.getList).toHaveBeenCalled();
    });

    it("should pass through getOne unchanged", async () => {
      const expectedResult = { data: { id: 1, name: "Test" } };
      (mockProvider.getOne as ReturnType<typeof vi.fn>).mockResolvedValue(expectedResult);

      const wrappedProvider = withSkipDelete(mockProvider);
      const result = await wrappedProvider.getOne("organizations", { id: 1 });

      expect(result).toEqual(expectedResult);
    });

    it("should pass through create unchanged", async () => {
      const expectedResult = { data: { id: 1, name: "New Org" } };
      (mockProvider.create as ReturnType<typeof vi.fn>).mockResolvedValue(expectedResult);

      const wrappedProvider = withSkipDelete(mockProvider);
      const result = await wrappedProvider.create("organizations", {
        data: { name: "New Org" },
      });

      expect(result).toEqual(expectedResult);
    });

    it("should pass through update unchanged", async () => {
      const expectedResult = { data: { id: 1, name: "Updated Org" } };
      (mockProvider.update as ReturnType<typeof vi.fn>).mockResolvedValue(expectedResult);

      const wrappedProvider = withSkipDelete(mockProvider);
      const result = await wrappedProvider.update("organizations", {
        id: 1,
        data: { name: "Updated Org" },
        previousData: { id: 1, name: "Old Name" },
      });

      expect(result).toEqual(expectedResult);
    });
  });

  describe("custom methods passthrough", () => {
    it("should preserve custom methods on the provider", async () => {
      const extendedProvider = {
        ...mockProvider,
        customMethod: vi.fn().mockResolvedValue({ success: true }),
      };

      const wrappedProvider = withSkipDelete(extendedProvider);
      expect((wrappedProvider as any).customMethod).toBeDefined();
      const result = await (wrappedProvider as any).customMethod();
      expect(result).toEqual({ success: true });
    });
  });

  describe("integration scenario: lifecycle callback flow", () => {
    /**
     * Simulates the real-world scenario where:
     * 1. withLifecycleCallbacks runs beforeDelete
     * 2. beforeDelete archives via RPC and sets skipDelete=true
     * 3. withLifecycleCallbacks calls inner provider with modified params
     * 4. withSkipDelete intercepts and returns success without hard DELETE
     */
    it("should work correctly when composed with lifecycle callbacks pattern", async () => {
      // Simulate the params that would come from withLifecycleCallbacks
      // after beforeDelete has modified them
      const paramsFromLifecycleCallback = {
        id: 90059,
        previousData: { id: 90059, name: "Hell Kitchen Test" },
        meta: { skipDelete: true }, // Set by beforeDelete after RPC archive
      };

      // The base provider's delete should throw FK error if called
      (mockProvider.delete as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("update or delete on table 'organizations' violates foreign key constraint")
      );

      const wrappedProvider = withSkipDelete(mockProvider);

      // This should NOT throw - skipDelete should prevent the hard DELETE
      const result = await wrappedProvider.delete("organizations", paramsFromLifecycleCallback);

      // Verify fake success was returned
      expect(result).toEqual({ data: { id: 90059 } });

      // Verify base provider was NOT called (would have thrown FK error)
      expect(mockProvider.delete).not.toHaveBeenCalled();
    });
  });
});
