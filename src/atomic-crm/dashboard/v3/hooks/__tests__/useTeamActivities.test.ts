/**
 * useTeamActivities Hook Test Suite
 *
 * Tests the team activities hook for the dashboard activity feed.
 * Critical behaviors tested:
 * - Activity fetching with joined sales user data
 * - Default limit and custom limit behavior
 * - Soft-delete filtering (deleted_at@is: null)
 * - Loading states and error handling
 * - Refetch functionality
 * - Edge cases: empty data, missing sales user
 */

import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { TeamActivity } from "../useTeamActivities";
import { useTeamActivities } from "../useTeamActivities";

// Create stable mock functions
const mockGetList = vi.fn();

const stableDataProvider = {
  getList: mockGetList,
};

vi.mock("react-admin", () => ({
  useDataProvider: () => stableDataProvider,
}));

// Helper to create mock activity
const createMockActivity = (overrides: Partial<TeamActivity> = {}): TeamActivity => ({
  id: 1,
  type: "call",
  subject: "Follow-up call with client",
  activity_date: new Date().toISOString(),
  description: "Discussed project timeline",
  created_by: 42,
  sales: {
    id: 42,
    first_name: "John",
    last_name: "Doe",
    avatar_url: "https://example.com/avatar.jpg",
  },
  contact_id: 100,
  organization_id: 200,
  opportunity_id: 300,
  ...overrides,
});

describe("useTeamActivities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Data Fetching", () => {
    it("should fetch activities with default limit of 15", async () => {
      const mockActivities = [createMockActivity({ id: 1 }), createMockActivity({ id: 2 })];

      mockGetList.mockResolvedValueOnce({ data: mockActivities, total: 2 });

      const { result } = renderHook(() => useTeamActivities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockGetList).toHaveBeenCalledWith(
        "activities",
        expect.objectContaining({
          pagination: { page: 1, perPage: 15 },
          sort: { field: "activity_date", order: "DESC" },
          filter: { "deleted_at@is": null },
        })
      );
      expect(result.current.activities).toHaveLength(2);
    });

    it("should respect custom limit parameter", async () => {
      mockGetList.mockResolvedValueOnce({ data: [], total: 0 });

      const { result } = renderHook(() => useTeamActivities(25));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockGetList).toHaveBeenCalledWith(
        "activities",
        expect.objectContaining({
          pagination: { page: 1, perPage: 25 },
        })
      );
    });

    it("should include meta.select for sales user join", async () => {
      mockGetList.mockResolvedValueOnce({ data: [], total: 0 });

      const { result } = renderHook(() => useTeamActivities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockGetList).toHaveBeenCalledWith(
        "activities",
        expect.objectContaining({
          meta: expect.objectContaining({
            select: expect.stringContaining("sales:created_by"),
          }),
        })
      );
    });
  });

  describe("Activity Data Structure", () => {
    it("should return activities with joined sales user data", async () => {
      const mockActivity = createMockActivity({
        id: 1,
        type: "meeting",
        subject: "Quarterly review",
        sales: {
          id: 42,
          first_name: "Jane",
          last_name: "Smith",
          avatar_url: "https://example.com/jane.jpg",
        },
      });

      mockGetList.mockResolvedValueOnce({ data: [mockActivity], total: 1 });

      const { result } = renderHook(() => useTeamActivities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const activity = result.current.activities[0];
      expect(activity.type).toBe("meeting");
      expect(activity.subject).toBe("Quarterly review");
      expect(activity.sales?.first_name).toBe("Jane");
      expect(activity.sales?.last_name).toBe("Smith");
      expect(activity.sales?.avatar_url).toBe("https://example.com/jane.jpg");
    });

    it("should handle activity without sales user (created_by is null)", async () => {
      const mockActivity = createMockActivity({
        created_by: null,
        sales: undefined,
      });

      mockGetList.mockResolvedValueOnce({ data: [mockActivity], total: 1 });

      const { result } = renderHook(() => useTeamActivities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.activities[0].created_by).toBeNull();
      expect(result.current.activities[0].sales).toBeUndefined();
    });

    it("should include related entity IDs", async () => {
      const mockActivity = createMockActivity({
        contact_id: 101,
        organization_id: 201,
        opportunity_id: 301,
      });

      mockGetList.mockResolvedValueOnce({ data: [mockActivity], total: 1 });

      const { result } = renderHook(() => useTeamActivities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.activities[0].contact_id).toBe(101);
      expect(result.current.activities[0].organization_id).toBe(201);
      expect(result.current.activities[0].opportunity_id).toBe(301);
    });
  });

  describe("Loading States", () => {
    it("should show loading state initially", async () => {
      mockGetList.mockImplementation(() => new Promise(() => {})); // Never resolves

      const { result } = renderHook(() => useTeamActivities());

      expect(result.current.loading).toBe(true);
      expect(result.current.activities).toHaveLength(0);
    });

    it("should set loading to false after fetch completes", async () => {
      mockGetList.mockResolvedValueOnce({ data: [], total: 0 });

      const { result } = renderHook(() => useTeamActivities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle fetch errors gracefully", async () => {
      const mockError = new Error("Network error");
      mockGetList.mockRejectedValueOnce(mockError);

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { result } = renderHook(() => useTeamActivities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe("Network error");
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[useTeamActivities] Failed to fetch activities:",
        mockError
      );

      consoleErrorSpy.mockRestore();
    });

    it("should convert non-Error exceptions to Error objects", async () => {
      mockGetList.mockRejectedValueOnce("String error");

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { result } = renderHook(() => useTeamActivities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe("Failed to fetch activities");

      consoleErrorSpy.mockRestore();
    });
  });

  describe("Refetch Functionality", () => {
    it("should refetch activities when refetch is called", async () => {
      mockGetList.mockResolvedValue({ data: [], total: 0 });

      const { result } = renderHook(() => useTeamActivities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialCallCount = mockGetList.mock.calls.length;

      await act(async () => {
        await result.current.refetch();
      });

      expect(mockGetList.mock.calls.length).toBeGreaterThan(initialCallCount);
    });

    it("should clear error on successful refetch", async () => {
      // First call fails
      mockGetList.mockRejectedValueOnce(new Error("First error"));

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { result } = renderHook(() => useTeamActivities());

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      // Second call succeeds
      mockGetList.mockResolvedValueOnce({ data: [], total: 0 });

      await act(async () => {
        await result.current.refetch();
      });

      expect(result.current.error).toBeNull();

      consoleErrorSpy.mockRestore();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty activities array", async () => {
      mockGetList.mockResolvedValueOnce({ data: [], total: 0 });

      const { result } = renderHook(() => useTeamActivities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.activities).toHaveLength(0);
      expect(result.current.error).toBeNull();
    });

    it("should handle null description", async () => {
      const mockActivity = createMockActivity({
        description: null,
      });

      mockGetList.mockResolvedValueOnce({ data: [mockActivity], total: 1 });

      const { result } = renderHook(() => useTeamActivities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.activities[0].description).toBeNull();
    });

    it("should handle sales user with null fields", async () => {
      const mockActivity = createMockActivity({
        sales: {
          id: 42,
          first_name: null,
          last_name: null,
          avatar_url: null,
        },
      });

      mockGetList.mockResolvedValueOnce({ data: [mockActivity], total: 1 });

      const { result } = renderHook(() => useTeamActivities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.activities[0].sales?.first_name).toBeNull();
      expect(result.current.activities[0].sales?.last_name).toBeNull();
      expect(result.current.activities[0].sales?.avatar_url).toBeNull();
    });
  });
});
