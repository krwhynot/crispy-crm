/**
 * Tests for SegmentsService - Segment management business logic
 *
 * Tests verify:
 * 1. Get-or-create segment operations
 * 2. RPC function invocation correctness
 * 3. Array response unwrapping (RPC returns wrapped array)
 * 4. Error handling and logging
 * 5. Edge cases (empty arrays, null/undefined, non-array responses)
 */

import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { SegmentsService } from "../segments.service";
import type { DataProvider } from "ra-core";
import type { Segment } from "../../validation/segments";

// Mock supabase module
vi.mock("../../providers/supabase/supabase", () => ({
  supabase: {
    rpc: vi.fn(),
  },
}));

describe("SegmentsService", () => {
  let service: SegmentsService;
  let mockDataProvider: DataProvider;
  let mockSegment: Segment;

  beforeEach(() => {
    // Create a minimal mock DataProvider
    mockDataProvider = {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      getList: vi.fn(),
      getOne: vi.fn(),
      getMany: vi.fn(),
      getManyReference: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    };

    service = new SegmentsService(mockDataProvider);

    mockSegment = {
      id: 1,
      name: "VIP Customers",
      description: "High-value customer segment",
      created_at: "2025-11-24T00:00:00Z",
      updated_at: "2025-11-24T00:00:00Z",
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("getOrCreateSegment - Success Cases", () => {
    test("should retrieve existing segment via RPC", async () => {
      const { supabase } = await import("../../providers/supabase/supabase");
      (supabase.rpc as any).mockResolvedValueOnce({
        data: [mockSegment],
        error: null,
      });

      const result = await service.getOrCreateSegment("VIP Customers");

      expect(supabase.rpc).toHaveBeenCalledWith("get_or_create_segment", {
        p_name: "VIP Customers",
      });
      expect(result).toEqual(mockSegment);
    });

    test("should create new segment if not found", async () => {
      const { supabase } = await import("../../providers/supabase/supabase");
      const newSegment: Segment = {
        id: 2,
        name: "New Segment",
        description: null,
        created_at: "2025-11-24T00:00:00Z",
        updated_at: "2025-11-24T00:00:00Z",
      };

      (supabase.rpc as any).mockResolvedValueOnce({
        data: [newSegment],
        error: null,
      });

      const result = await service.getOrCreateSegment("New Segment");

      expect(supabase.rpc).toHaveBeenCalledWith("get_or_create_segment", {
        p_name: "New Segment",
      });
      expect(result).toEqual(newSegment);
      expect(result.id).toBe(2);
    });

    test("should unwrap RPC array response (RPC returns [segment])", async () => {
      const { supabase } = await import("../../providers/supabase/supabase");
      const wrappedResponse = [mockSegment];

      (supabase.rpc as any).mockResolvedValueOnce({
        data: wrappedResponse,
        error: null,
      });

      const result = await service.getOrCreateSegment("VIP Customers");

      // Should return the unwrapped segment, not the array
      expect(result).toEqual(mockSegment);
      expect(Array.isArray(result)).toBe(false);
    });

    test("should handle segment names with special characters", async () => {
      const { supabase } = await import("../../providers/supabase/supabase");
      const specialSegment: Segment = {
        ...mockSegment,
        name: "High-Value (>$1M)",
      };

      (supabase.rpc as any).mockResolvedValueOnce({
        data: [specialSegment],
        error: null,
      });

      const result = await service.getOrCreateSegment("High-Value (>$1M)");

      expect(supabase.rpc).toHaveBeenCalledWith("get_or_create_segment", {
        p_name: "High-Value (>$1M)",
      });
      expect(result.name).toBe("High-Value (>$1M)");
    });

    test("should handle segment names with spaces and case preservation", async () => {
      const { supabase } = await import("../../providers/supabase/supabase");
      const casePreservedSegment: Segment = {
        ...mockSegment,
        name: "Active Enterprise Accounts",
      };

      (supabase.rpc as any).mockResolvedValueOnce({
        data: [casePreservedSegment],
        error: null,
      });

      const result = await service.getOrCreateSegment("Active Enterprise Accounts");

      expect(result.name).toBe("Active Enterprise Accounts");
    });

    test("should log success on retrieval", async () => {
      const { supabase } = await import("../../providers/supabase/supabase");
      const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      (supabase.rpc as any).mockResolvedValueOnce({
        data: [mockSegment],
        error: null,
      });

      await service.getOrCreateSegment("VIP Customers");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("[SegmentsService] Segment retrieved or created successfully"),
        mockSegment
      );

      consoleLogSpy.mockRestore();
    });
  });

  describe("getOrCreateSegment - Error Cases", () => {
    test("should throw with enhanced error message on RPC error", async () => {
      const { supabase } = await import("../../providers/supabase/supabase");
      const rpcError = { message: "Permission denied" };

      (supabase.rpc as any).mockResolvedValueOnce({
        data: null,
        error: rpcError,
      });

      await expect(service.getOrCreateSegment("VIP Customers")).rejects.toThrow(
        "Get or create segment failed: Permission denied"
      );
    });

    test("should handle RPC rejection", async () => {
      const { supabase } = await import("../../providers/supabase/supabase");

      (supabase.rpc as any).mockRejectedValueOnce(
        new Error("Network connection failed")
      );

      await expect(service.getOrCreateSegment("VIP Customers")).rejects.toThrow(
        "Network connection failed"
      );
    });

    test("should handle RLS policy violations", async () => {
      const { supabase } = await import("../../providers/supabase/supabase");

      (supabase.rpc as any).mockResolvedValueOnce({
        data: null,
        error: { message: "new row violates row-level security policy" },
      });

      await expect(service.getOrCreateSegment("VIP Customers")).rejects.toThrow(
        "Get or create segment failed: new row violates row-level security policy"
      );
    });

    test("should throw when RPC returns empty array", async () => {
      const { supabase } = await import("../../providers/supabase/supabase");

      (supabase.rpc as any).mockResolvedValueOnce({
        data: [],
        error: null,
      });

      await expect(service.getOrCreateSegment("VIP Customers")).rejects.toThrow(
        "Get or create segment returned empty result"
      );
    });

    test("should throw when RPC returns null data", async () => {
      const { supabase } = await import("../../providers/supabase/supabase");

      (supabase.rpc as any).mockResolvedValueOnce({
        data: null,
        error: null,
      });

      await expect(service.getOrCreateSegment("VIP Customers")).rejects.toThrow(
        "Get or create segment returned empty result"
      );
    });

    test("should throw when RPC returns undefined data", async () => {
      const { supabase } = await import("../../providers/supabase/supabase");

      (supabase.rpc as any).mockResolvedValueOnce({
        data: undefined,
        error: null,
      });

      await expect(service.getOrCreateSegment("VIP Customers")).rejects.toThrow(
        "Get or create segment returned empty result"
      );
    });

    test("should throw when RPC returns non-array data", async () => {
      const { supabase } = await import("../../providers/supabase/supabase");

      (supabase.rpc as any).mockResolvedValueOnce({
        data: { id: 1, name: "Segment" }, // Not wrapped in array
        error: null,
      });

      await expect(service.getOrCreateSegment("VIP Customers")).rejects.toThrow(
        "Get or create segment returned empty result"
      );
    });

    test("should log error details on failure", async () => {
      const { supabase } = await import("../../providers/supabase/supabase");
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      (supabase.rpc as any).mockResolvedValueOnce({
        data: null,
        error: { message: "Database error" },
      });

      await expect(service.getOrCreateSegment("VIP Customers")).rejects.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("[SegmentsService] Failed to get or create segment"),
        expect.objectContaining({
          name: "VIP Customers",
          error: expect.any(Error),
        })
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe("getOrCreateSegment - Idempotency", () => {
    test("should handle multiple calls with same segment name", async () => {
      const { supabase } = await import("../../providers/supabase/supabase");

      (supabase.rpc as any)
        .mockResolvedValueOnce({ data: [mockSegment], error: null })
        .mockResolvedValueOnce({ data: [mockSegment], error: null });

      // Call twice with same name
      const result1 = await service.getOrCreateSegment("VIP Customers");
      const result2 = await service.getOrCreateSegment("VIP Customers");

      expect(result1).toEqual(mockSegment);
      expect(result2).toEqual(mockSegment);
      expect(supabase.rpc).toHaveBeenCalledTimes(2);
    });

    test("should handle multiple different segment names", async () => {
      const { supabase } = await import("../../providers/supabase/supabase");

      const segment1: Segment = { ...mockSegment, id: 1, name: "Segment 1" };
      const segment2: Segment = { ...mockSegment, id: 2, name: "Segment 2" };

      (supabase.rpc as any)
        .mockResolvedValueOnce({ data: [segment1], error: null })
        .mockResolvedValueOnce({ data: [segment2], error: null });

      const result1 = await service.getOrCreateSegment("Segment 1");
      const result2 = await service.getOrCreateSegment("Segment 2");

      expect(result1.name).toBe("Segment 1");
      expect(result2.name).toBe("Segment 2");
      expect(supabase.rpc).toHaveBeenCalledTimes(2);
    });
  });

  describe("getOrCreateSegment - Edge Cases", () => {
    test("should handle empty string segment name", async () => {
      const { supabase } = await import("../../providers/supabase/supabase");

      (supabase.rpc as any).mockResolvedValueOnce({
        data: [{ ...mockSegment, name: "" }],
        error: null,
      });

      const result = await service.getOrCreateSegment("");

      expect(supabase.rpc).toHaveBeenCalledWith("get_or_create_segment", {
        p_name: "",
      });
      expect(result.name).toBe("");
    });

    test("should handle very long segment names", async () => {
      const { supabase } = await import("../../providers/supabase/supabase");
      const longName =
        "This is a very long segment name with multiple words and special characters that might be used in real-world scenarios";
      const longSegment: Segment = { ...mockSegment, name: longName };

      (supabase.rpc as any).mockResolvedValueOnce({
        data: [longSegment],
        error: null,
      });

      const result = await service.getOrCreateSegment(longName);

      expect(result.name).toBe(longName);
    });

    test("should pass segment name with proper parameter name (p_name)", async () => {
      const { supabase } = await import("../../providers/supabase/supabase");

      (supabase.rpc as any).mockResolvedValueOnce({
        data: [mockSegment],
        error: null,
      });

      await service.getOrCreateSegment("VIP Customers");

      // Verify the RPC parameter name matches the PostgreSQL function signature
      expect(supabase.rpc).toHaveBeenCalledWith(
        "get_or_create_segment",
        expect.objectContaining({
          p_name: "VIP Customers",
        })
      );
    });
  });

  describe("Service Integration", () => {
    test("should not use dataProvider (all logic via RPC)", async () => {
      const { supabase } = await import("../../providers/supabase/supabase");

      (supabase.rpc as any).mockResolvedValueOnce({
        data: [mockSegment],
        error: null,
      });

      await service.getOrCreateSegment("VIP Customers");

      // DataProvider should not be called since we use RPC directly
      expect(mockDataProvider.create).not.toHaveBeenCalled();
      expect(mockDataProvider.getList).not.toHaveBeenCalled();
      expect(mockDataProvider.getOne).not.toHaveBeenCalled();
    });

    test("should verify service receives DataProvider dependency (even if unused)", () => {
      // Service is constructed with DataProvider as dependency
      expect(service).toBeDefined();
      // This allows for future expansion (e.g., fallback CRUD if RPC unavailable)
    });
  });
});
