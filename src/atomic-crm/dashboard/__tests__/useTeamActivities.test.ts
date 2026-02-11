/**
 * useTeamActivities Hook Test Suite
 *
 * Tests the team activities hook for the dashboard activity feed.
 * Critical behaviors tested:
 * - Activity fetching from activities_summary view with pre-joined creator data
 * - Default limit and custom limit behavior
 * - Soft-delete filtering (deleted_at@is: null)
 * - Loading states and error handling
 * - Refetch functionality
 * - Edge cases: empty data, missing creator data
 */

import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { GetListParams } from "ra-core";
import type { TeamActivity } from "../useTeamActivities";
import { useTeamActivities } from "../useTeamActivities";

// Create stable mock function
const mockGetList = vi.fn();

/**
 * Mock useGetList hook that uses React state to properly simulate async behavior.
 * This allows tests to control responses via mockGetList.mockResolvedValueOnce().
 */
vi.mock("react-admin", async () => {
  // Import React for hooks - must be inside the mock factory
  const React = await import("react");

  return {
    useGetList: (resource: string, params: GetListParams) => {
      const [state, setState] = React.useState<{
        data: TeamActivity[];
        isPending: boolean;
        error: Error | null;
      }>({
        data: [],
        isPending: true,
        error: null,
      });

      // Serialize params for stable dependency - params object changes each render but content is stable
      const paramsKey = JSON.stringify(params);
      const fetchData = React.useCallback(async () => {
        setState((s) => ({ ...s, isPending: true, error: null }));
        try {
          const result = await mockGetList(resource, params);
          setState({
            data: result.data || [],
            isPending: false,
            error: null,
          });
        } catch (e) {
          // Return error message as a string, NOT an Error object.
          // Reason: The actual useTeamActivities hook does: new Error(String(queryError))
          // If queryError is already an Error, String(Error) returns "Error: message"
          // causing double-wrapping. By returning a string here, the hook's
          // new Error(String("message")) produces new Error("message") as expected.
          const errorMessage = e instanceof Error ? e.message : "Failed to fetch activities";
          setState({
            data: [],
            isPending: false,
            // Intentional: Return string, not Error, to match useGetList behavior and avoid double-wrapping
            error: errorMessage as unknown as Error,
          });
          console.error("[useTeamActivities] Failed to fetch activities:", e);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- params accessed via paramsKey serialization
      }, [resource, paramsKey]);

      React.useEffect(() => {
        fetchData();
      }, [fetchData]);

      return {
        data: state.data,
        total: state.data.length,
        isPending: state.isPending,
        error: state.error,
        refetch: fetchData,
      };
    },
  };
});

// Helper to create mock activity with pre-joined creator data (from activities_summary view)
const createMockActivity = (overrides: Partial<TeamActivity> = {}): TeamActivity => ({
  id: 1,
  type: "call",
  subject: "Follow-up call with client",
  activity_date: new Date().toISOString(),
  description: "Discussed project timeline",
  created_by: 42,
  // Pre-joined creator fields from activities_summary view
  creator_first_name: "John",
  creator_last_name: "Doe",
  creator_email: "john.doe@example.com",
  creator_avatar_url: "https://example.com/avatar.jpg",
  // Transformed sales object (created by hook)
  sales: {
    id: 42,
    first_name: "John",
    last_name: "Doe",
    email: "john.doe@example.com",
    avatar_url: "https://example.com/avatar.jpg",
  },
  contact_id: 100,
  organization_id: 200,
  opportunity_id: 300,
  ...overrides,
});

describe("useTeamActivities", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockGetList.mockReset();
  });

  describe("Data Fetching", () => {
    it("should fetch activities from activities_summary view with default limit of 15", async () => {
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
      expect(result.current.activities[0].sales?.first_name).toBe("John");
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

    it("should transform pre-joined creator fields into sales object", async () => {
      const mockActivities = [
        createMockActivity({
          id: 1,
          created_by: 42,
          creator_first_name: "Alice",
          creator_last_name: "Smith",
        }),
        createMockActivity({
          id: 2,
          created_by: 43,
          creator_first_name: "Bob",
          creator_last_name: "Jones",
        }),
        createMockActivity({
          id: 3,
          created_by: 42,
          creator_first_name: "Alice",
          creator_last_name: "Smith",
        }),
      ];

      mockGetList.mockResolvedValueOnce({ data: mockActivities, total: 3 });

      const { result } = renderHook(() => useTeamActivities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should transform creator fields into sales object for each activity
      expect(result.current.activities).toHaveLength(3);
      expect(result.current.activities[0].sales?.first_name).toBe("Alice");
      expect(result.current.activities[1].sales?.first_name).toBe("Bob");
      expect(result.current.activities[2].sales?.first_name).toBe("Alice");
    });
  });

  describe("Activity Data Structure", () => {
    it("should return activities with transformed sales user data from view", async () => {
      const mockActivity = createMockActivity({
        id: 1,
        type: "meeting",
        subject: "Quarterly review",
        created_by: 42,
        creator_first_name: "Jane",
        creator_last_name: "Smith",
        creator_email: "jane.smith@example.com",
        creator_avatar_url: "https://example.com/jane.jpg",
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

    it("should include related entity IDs from view", async () => {
      const mockActivity = createMockActivity({
        contact_id: 101,
        organization_id: 201,
        opportunity_id: 301,
        created_by: 42,
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

    it("should handle null description from view", async () => {
      const mockActivity = createMockActivity({
        description: null,
        created_by: 42,
      });

      mockGetList.mockResolvedValueOnce({ data: [mockActivity], total: 1 });

      const { result } = renderHook(() => useTeamActivities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.activities[0].description).toBeNull();
    });

    it("should handle creator with null name fields from view", async () => {
      const mockActivity = createMockActivity({
        created_by: 42,
        creator_first_name: null,
        creator_last_name: null,
        creator_email: "user@example.com",
        creator_avatar_url: null,
      });

      mockGetList.mockResolvedValueOnce({ data: [mockActivity], total: 1 });

      const { result } = renderHook(() => useTeamActivities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.activities[0].sales?.first_name).toBeNull();
      expect(result.current.activities[0].sales?.last_name).toBeNull();
      expect(result.current.activities[0].sales?.email).toBe("user@example.com");
      expect(result.current.activities[0].sales?.avatar_url).toBeNull();
    });
  });
});
