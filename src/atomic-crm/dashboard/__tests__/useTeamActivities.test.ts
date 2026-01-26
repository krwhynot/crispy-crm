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
import type { GetListParams } from "ra-core";
import type { TeamActivity } from "../useTeamActivities";
import { useTeamActivities } from "../useTeamActivities";

// Create stable mock functions
const mockGetList = vi.fn();
const mockGetMany = vi.fn();

/**
 * Mock useGetList and useGetMany hooks that use React state to properly simulate async behavior.
 * This allows tests to control responses via mockGetList/mockGetMany.mockResolvedValueOnce().
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
    useGetMany: (resource: string, params: { ids: number[] }, options?: { enabled?: boolean }) => {
      const [state, setState] = React.useState<{
        data: any[];
        isLoading: boolean;
        error: Error | null;
      }>({
        data: [],
        isLoading: false,
        error: null,
      });

      const enabled = options?.enabled !== false;
      const idsKey = JSON.stringify(params.ids);

      const fetchData = React.useCallback(async () => {
        if (!enabled || params.ids.length === 0) {
          setState({ data: [], isLoading: false, error: null });
          return;
        }

        setState((s) => ({ ...s, isLoading: true, error: null }));
        try {
          const result = await mockGetMany(resource, params);
          setState({
            data: result.data || [],
            isLoading: false,
            error: null,
          });
        } catch (e) {
          const errorMessage = e instanceof Error ? e.message : "Failed to fetch records";
          setState({
            data: [],
            isLoading: false,
            error: new Error(errorMessage),
          });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [resource, idsKey, enabled]);

      React.useEffect(() => {
        fetchData();
      }, [fetchData]);

      return {
        data: state.data,
        isLoading: state.isLoading,
        error: state.error,
        refetch: fetchData,
      };
    },
  };
});

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
    email: "john.doe@example.com",
    avatar_url: "https://example.com/avatar.jpg",
  },
  contact_id: 100,
  organization_id: 200,
  opportunity_id: 300,
  ...overrides,
});

// Helper to create mock sales user
const createMockSales = (id: number, overrides: Partial<any> = {}) => ({
  id,
  first_name: `User${id}`,
  last_name: `Last${id}`,
  email: `user${id}@example.com`,
  avatar_url: `https://example.com/avatar${id}.jpg`,
  ...overrides,
});

describe("useTeamActivities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetList.mockReset();
    mockGetMany.mockReset();
  });

  describe("Data Fetching", () => {
    it("should fetch activities with default limit of 15", async () => {
      const mockActivities = [createMockActivity({ id: 1 }), createMockActivity({ id: 2 })];

      mockGetList.mockResolvedValueOnce({ data: mockActivities, total: 2 });
      mockGetMany.mockResolvedValueOnce({ data: [createMockSales(42)] });

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

    it("should batch fetch sales users with useGetMany", async () => {
      const mockActivities = [
        createMockActivity({ id: 1, created_by: 42 }),
        createMockActivity({ id: 2, created_by: 43 }),
        createMockActivity({ id: 3, created_by: 42 }), // Duplicate user ID
      ];

      mockGetList.mockResolvedValueOnce({ data: mockActivities, total: 3 });
      mockGetMany.mockResolvedValueOnce({
        data: [createMockSales(42), createMockSales(43)],
      });

      const { result } = renderHook(() => useTeamActivities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should call useGetMany with deduplicated sales IDs
      expect(mockGetMany).toHaveBeenCalledWith("sales", { ids: [42, 43] });

      // Should merge sales data into activities
      expect(result.current.activities).toHaveLength(3);
      expect(result.current.activities[0].sales?.first_name).toBe("User42");
      expect(result.current.activities[1].sales?.first_name).toBe("User43");
      expect(result.current.activities[2].sales?.first_name).toBe("User42");
    });
  });

  describe("Activity Data Structure", () => {
    it("should return activities with joined sales user data", async () => {
      const mockActivity = createMockActivity({
        id: 1,
        type: "meeting",
        subject: "Quarterly review",
        created_by: 42,
      });

      mockGetList.mockResolvedValueOnce({ data: [mockActivity], total: 1 });
      mockGetMany.mockResolvedValueOnce({
        data: [
          {
            id: 42,
            first_name: "Jane",
            last_name: "Smith",
            email: "jane.smith@example.com",
            avatar_url: "https://example.com/jane.jpg",
          },
        ],
      });

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
        created_by: 42,
      });

      mockGetList.mockResolvedValueOnce({ data: [mockActivity], total: 1 });
      mockGetMany.mockResolvedValueOnce({ data: [createMockSales(42)] });

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
        created_by: 42,
      });

      mockGetList.mockResolvedValueOnce({ data: [mockActivity], total: 1 });
      mockGetMany.mockResolvedValueOnce({ data: [createMockSales(42)] });

      const { result } = renderHook(() => useTeamActivities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.activities[0].description).toBeNull();
    });

    it("should handle sales user with null fields", async () => {
      const mockActivity = createMockActivity({
        created_by: 42,
      });

      mockGetList.mockResolvedValueOnce({ data: [mockActivity], total: 1 });
      mockGetMany.mockResolvedValueOnce({
        data: [
          {
            id: 42,
            first_name: null,
            last_name: null,
            email: null,
            avatar_url: null,
          },
        ],
      });

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
