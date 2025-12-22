// src/atomic-crm/reports/hooks/useReportData.test.tsx
import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useReportData } from "./useReportData";

// Create stable mock functions outside the factory
const mockGetList = vi.fn();

// Mock react-admin to avoid ES module resolution issues with ra-ui-materialui
vi.mock("react-admin", async () => {
  return {
    useDataProvider: () => ({
      getList: mockGetList,
      getOne: vi.fn(),
      getMany: vi.fn(),
      getManyReference: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    }),
  };
});

describe("useReportData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetList.mockResolvedValue({ data: [], total: 0 });
  });

  it("calls dataProvider.getList with correct resource", async () => {
    mockGetList.mockResolvedValue({
      data: [{ id: 1, name: "Test" }],
      total: 1,
    });

    renderHook(() => useReportData("opportunities"));

    await waitFor(() => {
      expect(mockGetList).toHaveBeenCalledWith(
        "opportunities",
        expect.any(Object)
      );
    });
  });

  it("passes pagination with perPage: 10000", async () => {
    renderHook(() => useReportData("opportunities"));

    await waitFor(() => {
      expect(mockGetList).toHaveBeenCalledWith(
        "opportunities",
        expect.objectContaining({
          pagination: { page: 1, perPage: 10000 },
        })
      );
    });
  });

  it("converts dateRange to ISO strings in filter", async () => {
    const startDate = new Date("2024-01-01T00:00:00Z");
    const endDate = new Date("2024-01-31T23:59:59Z");

    renderHook(() =>
      useReportData("opportunities", {
        dateRange: { start: startDate, end: endDate },
      })
    );

    await waitFor(() => {
      expect(mockGetList).toHaveBeenCalledWith(
        "opportunities",
        expect.objectContaining({
          filter: expect.objectContaining({
            "created_at@gte": startDate.toISOString(),
            "created_at@lte": endDate.toISOString(),
          }),
        })
      );
    });
  });

  it("uses custom dateField when provided", async () => {
    const startDate = new Date("2024-01-01T00:00:00Z");

    renderHook(() =>
      useReportData("activities", {
        dateRange: { start: startDate, end: null },
        dateField: "activity_date",
      })
    );

    await waitFor(() => {
      expect(mockGetList).toHaveBeenCalledWith(
        "activities",
        expect.objectContaining({
          filter: expect.objectContaining({
            "activity_date@gte": startDate.toISOString(),
          }),
        })
      );
    });
  });

  it("merges additionalFilters into filter object", async () => {
    renderHook(() =>
      useReportData("opportunities", {
        additionalFilters: { "deleted_at@is": null, status: "active" },
      })
    );

    await waitFor(() => {
      expect(mockGetList).toHaveBeenCalledWith(
        "opportunities",
        expect.objectContaining({
          filter: expect.objectContaining({
            "deleted_at@is": null,
            status: "active",
          }),
        })
      );
    });
  });

  it("returns data from successful response", async () => {
    const mockData = [
      { id: 1, name: "Opp 1" },
      { id: 2, name: "Opp 2" },
    ];
    mockGetList.mockResolvedValue({ data: mockData, total: 2 });

    const { result } = renderHook(() => useReportData("opportunities"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
  });

  it("returns error on failed request (fail-fast)", async () => {
    const mockError = new Error("Network error");
    mockGetList.mockRejectedValue(mockError);
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderHook(() => useReportData("opportunities"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe(mockError);
    expect(result.current.data).toEqual([]);

    consoleSpy.mockRestore();
  });

  it("refetch triggers new request", async () => {
    mockGetList.mockResolvedValue({ data: [], total: 0 });

    const { result } = renderHook(() => useReportData("opportunities"));

    // Wait for initial fetch to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Capture current call count (may vary due to Strict Mode)
    const initialCallCount = mockGetList.mock.calls.length;

    // Trigger refetch
    act(() => {
      result.current.refetch();
    });

    // Verify that at least one additional call was made after refetch
    await waitFor(() => {
      expect(mockGetList.mock.calls.length).toBeGreaterThan(initialCallCount);
    });
  });
});
