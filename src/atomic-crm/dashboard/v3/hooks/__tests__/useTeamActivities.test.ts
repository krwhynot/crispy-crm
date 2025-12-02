/**
 * useTeamActivities Hook Test Suite
 *
 * Tests the team activities hook for the dashboard activity feed.
 * Critical behaviors tested:
 * - Activity fetching with joined sales user data
 * - Default limit and custom limit behavior
 * - Soft-delete filtering (deleted_at is null)
 * - Loading states and error handling
 * - Refetch functionality
 * - Edge cases: empty data, missing sales user
 *
 * NOTE: Tests mock the Supabase client directly since the hook uses
 * supabase.from().select() instead of the React Admin data provider.
 */

import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { TeamActivity } from "../useTeamActivities";

// Use vi.hoisted() to ensure mocks are available when vi.mock is hoisted
// This solves the "Cannot access 'mockFrom' before initialization" error
const { mockFrom, mockSelect, mockIs, mockOrder, mockLimit } = vi.hoisted(() => {
  const mockLimit = vi.fn();
  const mockOrder = vi.fn();
  const mockIs = vi.fn();
  const mockSelect = vi.fn();
  const mockFrom = vi.fn();
  return { mockFrom, mockSelect, mockIs, mockOrder, mockLimit };
});

// Mock the Supabase client - this gets hoisted but now can access the hoisted mocks
vi.mock("@/atomic-crm/providers/supabase/supabase", () => ({
  supabase: {
    from: mockFrom,
  },
}));

// Import after mock setup
import { useTeamActivities } from "../useTeamActivities";

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
    email: "john@example.com",
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
    // Reset chain
    mockFrom.mockReturnValue({ select: mockSelect });
    mockSelect.mockReturnValue({ is: mockIs });
    mockIs.mockReturnValue({ order: mockOrder });
    mockOrder.mockReturnValue({ limit: mockLimit });
  });

  describe("Data Fetching", () => {
    it("should fetch activities with default limit of 15", async () => {
      const mockActivities = [createMockActivity({ id: 1 }), createMockActivity({ id: 2 })];
      mockLimit.mockResolvedValueOnce({ data: mockActivities, error: null });

      const { result } = renderHook(() => useTeamActivities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockFrom).toHaveBeenCalledWith("activities");
      expect(mockLimit).toHaveBeenCalledWith(15);
      expect(result.current.activities).toHaveLength(2);
    });

    it("should respect custom limit parameter", async () => {
      mockLimit.mockResolvedValueOnce({ data: [], error: null });

      const { result } = renderHook(() => useTeamActivities(25));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockLimit).toHaveBeenCalledWith(25);
    });

    it("should request sales user join in select query", async () => {
      mockLimit.mockResolvedValueOnce({ data: [], error: null });

      const { result } = renderHook(() => useTeamActivities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Verify select was called with the join syntax
      expect(mockSelect).toHaveBeenCalledWith(
        expect.stringContaining("sales:created_by")
      );
    });

    it("should filter out soft-deleted activities", async () => {
      mockLimit.mockResolvedValueOnce({ data: [], error: null });

      const { result } = renderHook(() => useTeamActivities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockIs).toHaveBeenCalledWith("deleted_at", null);
    });

    it("should order by activity_date descending", async () => {
      mockLimit.mockResolvedValueOnce({ data: [], error: null });

      const { result } = renderHook(() => useTeamActivities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockOrder).toHaveBeenCalledWith("activity_date", { ascending: false });
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
          email: "jane@example.com",
          avatar_url: "https://example.com/jane.jpg",
        },
      });

      mockLimit.mockResolvedValueOnce({ data: [mockActivity], error: null });

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
        sales: null,
      });

      mockLimit.mockResolvedValueOnce({ data: [mockActivity], error: null });

      const { result } = renderHook(() => useTeamActivities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.activities[0].created_by).toBeNull();
      expect(result.current.activities[0].sales).toBeNull();
    });

    it("should include related entity IDs", async () => {
      const mockActivity = createMockActivity({
        contact_id: 101,
        organization_id: 201,
        opportunity_id: 301,
      });

      mockLimit.mockResolvedValueOnce({ data: [mockActivity], error: null });

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
      mockLimit.mockImplementation(() => new Promise(() => {})); // Never resolves

      const { result } = renderHook(() => useTeamActivities());

      expect(result.current.loading).toBe(true);
      expect(result.current.activities).toHaveLength(0);
    });

    it("should set loading to false after fetch completes", async () => {
      mockLimit.mockResolvedValueOnce({ data: [], error: null });

      const { result } = renderHook(() => useTeamActivities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle Supabase query errors gracefully", async () => {
      mockLimit.mockResolvedValueOnce({
        data: null,
        error: { message: "Network error" },
      });

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { result } = renderHook(() => useTeamActivities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe("Network error");

      consoleErrorSpy.mockRestore();
    });

    it("should handle thrown exceptions", async () => {
      mockLimit.mockRejectedValueOnce(new Error("Unexpected error"));

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { result } = renderHook(() => useTeamActivities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe("Unexpected error");

      consoleErrorSpy.mockRestore();
    });

    it("should convert non-Error exceptions to Error objects", async () => {
      mockLimit.mockRejectedValueOnce("String error");

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
      mockLimit.mockResolvedValue({ data: [], error: null });

      const { result } = renderHook(() => useTeamActivities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialCallCount = mockFrom.mock.calls.length;

      await act(async () => {
        await result.current.refetch();
      });

      expect(mockFrom.mock.calls.length).toBeGreaterThan(initialCallCount);
    });

    it("should clear error on successful refetch", async () => {
      // First call returns error
      mockLimit.mockResolvedValueOnce({
        data: null,
        error: { message: "First error" },
      });

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { result } = renderHook(() => useTeamActivities());

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      // Second call succeeds
      mockLimit.mockResolvedValueOnce({ data: [], error: null });

      await act(async () => {
        await result.current.refetch();
      });

      expect(result.current.error).toBeNull();

      consoleErrorSpy.mockRestore();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty activities array", async () => {
      mockLimit.mockResolvedValueOnce({ data: [], error: null });

      const { result } = renderHook(() => useTeamActivities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.activities).toHaveLength(0);
      expect(result.current.error).toBeNull();
    });

    it("should handle null data response", async () => {
      mockLimit.mockResolvedValueOnce({ data: null, error: null });

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

      mockLimit.mockResolvedValueOnce({ data: [mockActivity], error: null });

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
          email: null,
          avatar_url: null,
        },
      });

      mockLimit.mockResolvedValueOnce({ data: [mockActivity], error: null });

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
