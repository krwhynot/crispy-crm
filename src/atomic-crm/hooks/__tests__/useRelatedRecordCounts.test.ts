/**
 * useRelatedRecordCounts Hook Test Suite
 *
 * Tests error aggregation from Promise.allSettled for cascade delete warnings.
 * Critical behaviors tested:
 * - All queries succeed → hasPartialFailure = false
 * - Some queries fail → hasPartialFailure = true, errors logged
 * - All queries fail → error state (not hasPartialFailure)
 * - Partial results show only successful counts
 * - Logger.warn called with structured details
 */

import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useRelatedRecordCounts } from "../useRelatedRecordCounts";

// Create stable mock functions outside the factory
const mockGetManyReference = vi.fn();

// Mock react-admin to avoid ES module resolution issues
vi.mock("react-admin", async () => {
  return {
    useDataProvider: () => ({
      getList: vi.fn(),
      getOne: vi.fn(),
      getMany: vi.fn(),
      getManyReference: mockGetManyReference,
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    }),
  };
});

// Mock logger to verify structured logging
const mockLoggerWarn = vi.fn();
vi.mock("@/lib/logger", () => ({
  logger: {
    warn: mockLoggerWarn,
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

describe("useRelatedRecordCounts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoggerWarn.mockClear();
    // Default mock implementation
    mockGetManyReference.mockResolvedValue({ data: [], total: 0 });
  });

  it("returns hasPartialFailure = false when all queries succeed", async () => {
    // Mock all queries to succeed
    mockGetManyReference.mockResolvedValue({
      data: [],
      total: 5,
    });

    // Use stable array reference to prevent infinite useEffect loop
    const ids = [1];

    const { result } = renderHook(() =>
      useRelatedRecordCounts({
        resource: "organizations",
        ids,
        enabled: true,
      })
    );

    // Wait for loading to complete
    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 3000 }
    );

    expect(result.current.hasPartialFailure).toBe(false);
    expect(result.current.error).toBeNull();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("returns hasPartialFailure = true and logs errors when some queries fail", async () => {
    let callCount = 0;

    // Mock: First 2 queries succeed, next queries fail
    mockGetManyReference.mockImplementation(() => {
      callCount++;
      if (callCount <= 2) {
        return Promise.resolve({ data: [], total: 10 });
      }
      return Promise.reject(new Error(`Network timeout for query ${callCount}`));
    });

    // Use stable array reference
    const ids = [1];

    const { result } = renderHook(() =>
      useRelatedRecordCounts({
        resource: "organizations",
        ids,
        enabled: true,
      })
    );

    // Wait for loading to complete
    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 3000 }
    );

    // Should show partial results with warning
    expect(result.current.hasPartialFailure).toBe(true);
    expect(result.current.error).toBeNull(); // Not full error, just partial failure
    expect(result.current.relatedCounts.length).toBeGreaterThan(0); // Successful queries returned data

    // Verify logger.warn was called with structured details
    expect(mockLoggerWarn).toHaveBeenCalledWith(
      "Partial failures detected in related record counts",
      expect.objectContaining({
        resource: "organizations",
        operation: "useRelatedRecordCounts",
        succeeded: expect.any(Number),
        failed: expect.any(Number),
        errors: expect.any(Array),
        note: "Showing partial results - some relationship counts may be missing",
      })
    );
  });

  it("returns error state (not hasPartialFailure) when ALL queries fail", async () => {
    // Mock all queries to fail
    mockGetManyReference.mockRejectedValue(new Error("Database connection lost"));

    // Use stable array reference
    const ids = [1];

    const { result } = renderHook(() =>
      useRelatedRecordCounts({
        resource: "organizations",
        ids,
        enabled: true,
      })
    );

    // Wait for loading to complete
    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 3000 }
    );

    // Should be in error state (fail-fast)
    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.message).toContain("Failed to fetch related record counts");
    expect(result.current.relatedCounts).toEqual([]);
  });

  it("returns empty arrays when disabled", () => {
    // Use stable array reference
    const ids = [1];

    const { result } = renderHook(() =>
      useRelatedRecordCounts({
        resource: "organizations",
        ids,
        enabled: false, // Disabled
      })
    );

    expect(result.current.relatedCounts).toEqual([]);
    expect(result.current.hasPartialFailure).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(mockGetManyReference).not.toHaveBeenCalled();
  });

  it("returns empty arrays when no IDs provided", () => {
    // Use stable empty array reference
    const ids: number[] = [];

    const { result } = renderHook(() =>
      useRelatedRecordCounts({
        resource: "organizations",
        ids,
        enabled: true,
      })
    );

    expect(result.current.relatedCounts).toEqual([]);
    expect(result.current.hasPartialFailure).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(mockGetManyReference).not.toHaveBeenCalled();
  });

  it("returns empty arrays for resource with no relationships defined", () => {
    // Use stable array reference
    const ids = [1];

    const { result } = renderHook(() =>
      useRelatedRecordCounts({
        resource: "unknown_resource", // Not in RESOURCE_RELATIONSHIPS
        ids,
        enabled: true,
      })
    );

    expect(result.current.relatedCounts).toEqual([]);
    expect(result.current.hasPartialFailure).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(mockGetManyReference).not.toHaveBeenCalled();
  });
});
