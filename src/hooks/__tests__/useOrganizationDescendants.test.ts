/**
 * useOrganizationDescendants Hook Test Suite
 *
 * Tests RPC error handling for hierarchy cycle prevention:
 * - Graceful degradation when RPC fails (returns empty array)
 * - Error logging on failure
 * - Recovery on subsequent successful call
 *
 * The hook is used by ParentOrganizationInput to exclude self + descendants
 * from parent selection dropdown, preventing circular references.
 *
 * These tests FAIL initially because error handling is not yet implemented.
 * Implement error handling in the hook to make tests pass.
 */

import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useOrganizationDescendants } from "../useOrganizationDescendants";
import { logger } from "@/lib/logger";

// Track invoke calls
const mockInvoke = vi.fn();

// Mock react-admin
vi.mock("ra-core", async () => {
  return {
    useDataProvider: () => ({
      invoke: mockInvoke,
      getList: vi.fn(),
      getOne: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    }),
  };
});

// Mock logger to verify error logging
vi.mock("@/lib/logger", () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

// Create a wrapper component that provides QueryClient
function createQueryClientWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retries in tests for predictable behavior
      },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe("useOrganizationDescendants", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(logger.warn).mockClear();
    vi.mocked(logger.error).mockClear();
  });

  describe("RPC error handling", () => {
    it("returns empty array when RPC fails (graceful degradation)", async () => {
      const orgId = 123;

      // Mock RPC to fail
      mockInvoke.mockRejectedValueOnce(new Error("RPC error: get_organization_descendants failed"));

      const { result } = renderHook(() => useOrganizationDescendants(orgId), {
        wrapper: createQueryClientWrapper(),
      });

      // Initially loading
      expect(result.current.isLoading).toBe(true);

      // Wait for query to settle
      await waitFor(
        () => {
          expect(result.current.isFetched).toBe(true);
        },
        { timeout: 3000 }
      );

      // Should return empty array instead of throwing
      expect(result.current.descendants).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isFetched).toBe(true);

      // Verify RPC was called with correct params
      expect(mockInvoke).toHaveBeenCalledWith("get_organization_descendants", {
        org_id: orgId,
      });
    });

    it("logs warning when RPC fails", async () => {
      const orgId = 456;
      const rpcError = new Error("RPC timeout: descendants query took too long");

      // Mock RPC to fail
      mockInvoke.mockRejectedValueOnce(rpcError);

      const { result } = renderHook(() => useOrganizationDescendants(orgId), {
        wrapper: createQueryClientWrapper(),
      });

      // Wait for query to settle
      await waitFor(
        () => {
          expect(result.current.isFetched).toBe(true);
        },
        { timeout: 3000 }
      );

      // Should have logged a warning about the RPC failure
      // This test FAILS until error handling is implemented in the hook
      expect(vi.mocked(logger.warn)).toHaveBeenCalled();

      // Verify the log contains relevant context
      const callArgs = vi.mocked(logger.warn).mock.calls[0];
      expect(callArgs[0]).toContain("descendants");
      expect(callArgs[1]).toMatchObject({
        orgId: expect.any(Number),
        operation: "useOrganizationDescendants",
      });
    });

    it("recovers on successful call after previous failure", async () => {
      const orgId = 789;
      const descendants = [100, 101, 102];

      // Setup: first call fails, second succeeds
      mockInvoke.mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(({ id }) => useOrganizationDescendants(id), {
        initialProps: { id: orgId },
        wrapper: createQueryClientWrapper(),
      });

      // Wait for first query to settle (with error)
      await waitFor(
        () => {
          expect(result.current.isFetched).toBe(true);
        },
        { timeout: 3000 }
      );

      expect(result.current.descendants).toEqual([]);

      // Setup mock for the recovery call
      mockInvoke.mockResolvedValueOnce({ data: descendants });

      // Re-render with same orgId to trigger new query
      // (relies on useQuery's behavior to refetch)
      const { result: result2 } = renderHook(() => useOrganizationDescendants(orgId), {
        wrapper: createQueryClientWrapper(),
      });

      await waitFor(
        () => {
          expect(result2.current.isFetched).toBe(true);
        },
        { timeout: 3000 }
      );

      // Should now return the descendants array
      expect(result2.current.descendants).toEqual(descendants);
    });
  });

  describe("successful RPC calls", () => {
    it("returns descendants array when RPC succeeds", async () => {
      const orgId = 999;
      const descendants = [100, 101, 102, 103];

      mockInvoke.mockResolvedValueOnce({
        data: descendants,
      });

      const { result } = renderHook(() => useOrganizationDescendants(orgId), {
        wrapper: createQueryClientWrapper(),
      });

      await waitFor(
        () => {
          expect(result.current.isFetched).toBe(true);
        },
        { timeout: 3000 }
      );

      expect(result.current.descendants).toEqual(descendants);
      expect(result.current.isLoading).toBe(false);
      expect(vi.mocked(logger.warn)).not.toHaveBeenCalled();
    });

    it("returns empty array when RPC returns empty data", async () => {
      const orgId = 111;

      mockInvoke.mockResolvedValueOnce({
        data: [],
      });

      const { result } = renderHook(() => useOrganizationDescendants(orgId), {
        wrapper: createQueryClientWrapper(),
      });

      await waitFor(
        () => {
          expect(result.current.isFetched).toBe(true);
        },
        { timeout: 3000 }
      );

      expect(result.current.descendants).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(vi.mocked(logger.warn)).not.toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("does not fetch when orgId is undefined", () => {
      const { result } = renderHook(() => useOrganizationDescendants(undefined), {
        wrapper: createQueryClientWrapper(),
      });

      // Should not make any RPC call
      expect(mockInvoke).not.toHaveBeenCalled();
      expect(result.current.descendants).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isFetched).toBe(false);
    });

    it("does not fetch when orgId is 0 (falsy but invalid)", () => {
      const { result } = renderHook(() => useOrganizationDescendants(0), {
        wrapper: createQueryClientWrapper(),
      });

      // Should not make RPC call for invalid orgId
      expect(mockInvoke).not.toHaveBeenCalled();
      expect(result.current.descendants).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isFetched).toBe(false);
    });

    it("handles RPC returning undefined data gracefully", async () => {
      const orgId = 222;

      mockInvoke.mockResolvedValueOnce({
        data: undefined,
      });

      const { result } = renderHook(() => useOrganizationDescendants(orgId), {
        wrapper: createQueryClientWrapper(),
      });

      await waitFor(
        () => {
          expect(result.current.isFetched).toBe(true);
        },
        { timeout: 3000 }
      );

      // Should default to empty array when data is undefined
      expect(result.current.descendants).toEqual([]);
    });
  });
});
