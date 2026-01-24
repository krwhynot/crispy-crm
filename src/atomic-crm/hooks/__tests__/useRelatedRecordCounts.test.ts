/**
 * useRelatedRecordCounts Hook Test Suite
 *
 * Tests error aggregation from Promise.allSettled for cascade delete warnings.
 * Critical behaviors tested:
 * - All queries succeed → hasPartialFailure = false
 * - Some queries fail → hasPartialFailure = true, errors logged
 * - All queries fail → error state (not hasPartialFailure)
 * - Partial results show only successful counts
 * - Console.error called with structured details
 */

import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import type { ReactNode } from "react";
import type { GetManyReferenceParams } from "react-admin";
import { useRelatedRecordCounts } from "../useRelatedRecordCounts";
import { TestWrapper } from "@/tests/utils/TestWrapper";

// Mock dataProvider
const mockGetManyReference = vi.fn();

// Create mock dataProvider function that returns the mocked methods
const createMockDataProvider = () => ({
  getList: vi.fn(),
  getOne: vi.fn(),
  getMany: vi.fn(),
  getManyReference: mockGetManyReference,
  create: vi.fn(),
  update: vi.fn(),
  updateMany: vi.fn(),
  delete: vi.fn(),
  deleteMany: vi.fn(),
});

// Mock console.error to verify logging
const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

describe("useRelatedRecordCounts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns hasPartialFailure = false when all queries succeed", async () => {
    // Mock all queries to succeed
    mockGetManyReference.mockResolvedValue({
      data: [],
      total: 5,
    });

    const { result } = renderHook(
      () =>
        useRelatedRecordCounts({
          resource: "organizations",
          ids: [1],
          enabled: true,
        }),
      {
        wrapper: ({ children }: { children: ReactNode }) => (
          <TestWrapper dataProvider={createMockDataProvider()}>{children}</TestWrapper>
        ),
      }
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasPartialFailure).toBe(false);
    expect(result.current.error).toBeNull();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("returns hasPartialFailure = true and logs errors when some queries fail", async () => {
    let callCount = 0;

    // Mock: First 2 queries succeed, next 2 fail
    mockGetManyReference.mockImplementation(
      (_resource: string, _params: GetManyReferenceParams) => {
        callCount++;
        if (callCount <= 2) {
          return Promise.resolve({ data: [], total: 10 });
        }
        return Promise.reject(new Error(`Network timeout for query ${callCount}`));
      }
    );

    const { result } = renderHook(
      () =>
        useRelatedRecordCounts({
          resource: "organizations",
          ids: [1],
          enabled: true,
        }),
      {
        wrapper: ({ children }: { children: ReactNode }) => (
          <TestWrapper dataProvider={createMockDataProvider()}>{children}</TestWrapper>
        ),
      }
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should show partial results with warning
    expect(result.current.hasPartialFailure).toBe(true);
    expect(result.current.error).toBeNull(); // Not full error, just partial failure
    expect(result.current.relatedCounts.length).toBeGreaterThan(0); // Successful queries returned data

    // Verify console.error was called with structured details
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[useRelatedRecordCounts] Partial failures detected:",
      expect.objectContaining({
        resource: "organizations",
        succeeded: expect.any(Number),
        failed: expect.any(Number),
        errors: expect.arrayContaining([expect.stringContaining("Network timeout")]),
        note: "Showing partial results - some relationship counts may be missing",
      })
    );
  });

  it("returns error state (not hasPartialFailure) when ALL queries fail", async () => {
    // Mock all queries to fail
    mockGetManyReference.mockRejectedValue(new Error("Database connection lost"));

    const { result } = renderHook(
      () =>
        useRelatedRecordCounts({
          resource: "organizations",
          ids: [1],
          enabled: true,
        }),
      {
        wrapper: ({ children }: { children: ReactNode }) => (
          <TestWrapper dataProvider={createMockDataProvider()}>{children}</TestWrapper>
        ),
      }
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should be in error state (fail-fast)
    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.message).toContain("Failed to fetch related record counts");
    expect(result.current.relatedCounts).toEqual([]);

    // hasPartialFailure is NOT relevant when in error state
    // (error takes precedence over hasPartialFailure)
  });

  it("aggregates counts from multiple queries for same label", async () => {
    mockGetManyReference.mockResolvedValue({
      data: [],
      total: 3,
    });

    const { result } = renderHook(
      () =>
        useRelatedRecordCounts({
          resource: "organizations",
          ids: [1, 2], // Multiple IDs
          enabled: true,
        }),
      {
        wrapper: ({ children }: { children: ReactNode }) => (
          <TestWrapper dataProvider={createMockDataProvider()}>{children}</TestWrapper>
        ),
      }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Each relationship × 2 IDs = aggregated counts
    expect(result.current.relatedCounts.length).toBeGreaterThan(0);
    expect(result.current.hasPartialFailure).toBe(false);
  });

  it("returns empty arrays when disabled", async () => {
    const { result } = renderHook(
      () =>
        useRelatedRecordCounts({
          resource: "organizations",
          ids: [1],
          enabled: false, // Disabled
        }),
      {
        wrapper: ({ children }: { children: ReactNode }) => (
          <TestWrapper dataProvider={createMockDataProvider()}>{children}</TestWrapper>
        ),
      }
    );

    expect(result.current.relatedCounts).toEqual([]);
    expect(result.current.hasPartialFailure).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(mockGetManyReference).not.toHaveBeenCalled();
  });

  it("returns empty arrays when no IDs provided", async () => {
    const { result } = renderHook(
      () =>
        useRelatedRecordCounts({
          resource: "organizations",
          ids: [], // No IDs
          enabled: true,
        }),
      {
        wrapper: ({ children }: { children: ReactNode }) => (
          <TestWrapper dataProvider={createMockDataProvider()}>{children}</TestWrapper>
        ),
      }
    );

    expect(result.current.relatedCounts).toEqual([]);
    expect(result.current.hasPartialFailure).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(mockGetManyReference).not.toHaveBeenCalled();
  });

  it("returns empty arrays for resource with no relationships defined", async () => {
    const { result } = renderHook(
      () =>
        useRelatedRecordCounts({
          resource: "unknown_resource", // Not in RESOURCE_RELATIONSHIPS
          ids: [1],
          enabled: true,
        }),
      {
        wrapper: ({ children }: { children: ReactNode }) => (
          <TestWrapper dataProvider={createMockDataProvider()}>{children}</TestWrapper>
        ),
      }
    );

    expect(result.current.relatedCounts).toEqual([]);
    expect(result.current.hasPartialFailure).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(mockGetManyReference).not.toHaveBeenCalled();
  });

  it("filters out zero counts from results", async () => {
    let callCount = 0;

    mockGetManyReference.mockImplementation(() => {
      callCount++;
      // First query returns 0, second returns 5
      return Promise.resolve({
        data: [],
        total: callCount === 1 ? 0 : 5,
      });
    });

    const { result } = renderHook(
      () =>
        useRelatedRecordCounts({
          resource: "organizations",
          ids: [1],
          enabled: true,
        }),
      {
        wrapper: ({ children }: { children: ReactNode }) => (
          <TestWrapper dataProvider={createMockDataProvider()}>{children}</TestWrapper>
        ),
      }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should only show non-zero counts
    const zeroCounts = result.current.relatedCounts.filter((c) => c.count === 0);
    expect(zeroCounts).toHaveLength(0);
  });

  it("logs multiple error messages when multiple queries fail", async () => {
    let callCount = 0;

    mockGetManyReference.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({ data: [], total: 5 }); // One success
      }
      return Promise.reject(new Error(`Query ${callCount} failed`));
    });

    const { result } = renderHook(
      () =>
        useRelatedRecordCounts({
          resource: "organizations",
          ids: [1],
          enabled: true,
        }),
      {
        wrapper: ({ children }: { children: ReactNode }) => (
          <TestWrapper dataProvider={createMockDataProvider()}>{children}</TestWrapper>
        ),
      }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasPartialFailure).toBe(true);

    // Verify console.error includes multiple error messages
    expect(consoleErrorSpy).toHaveBeenCalled();
    const errorCall = consoleErrorSpy.mock.calls[0];
    expect(errorCall[1].errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Query 2 failed"),
        expect.stringContaining("Query 3 failed"),
      ])
    );
  });

  it("resets hasPartialFailure on subsequent successful fetch", async () => {
    // First render: partial failure
    mockGetManyReference.mockRejectedValueOnce(new Error("Temporary failure"));
    mockGetManyReference.mockResolvedValue({ data: [], total: 5 });

    const { result, rerender } = renderHook(
      ({ ids }: { ids: number[] }) =>
        useRelatedRecordCounts({
          resource: "organizations",
          ids,
          enabled: true,
        }),
      {
        wrapper: ({ children }: { children: ReactNode }) => (
          <TestWrapper dataProvider={createMockDataProvider()}>{children}</TestWrapper>
        ),
        initialProps: { ids: [1] },
      }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasPartialFailure).toBe(true);

    // Clear mocks and set up all success
    vi.clearAllMocks();
    consoleErrorSpy.mockClear();
    mockGetManyReference.mockResolvedValue({ data: [], total: 5 });

    // Trigger re-fetch with different IDs
    rerender({ ids: [2] });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should reset hasPartialFailure
    expect(result.current.hasPartialFailure).toBe(false);
  });
});
