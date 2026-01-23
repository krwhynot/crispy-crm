/**
 * useFavorites Hook Tests
 *
 * Tests the favorites management hook with focus on:
 * - Cache invalidation behavior (invalidateQueries vs refetch)
 * - Query key factory usage (userFavoriteKeys.all)
 * - Optimistic updates and rollback on error
 * - Maximum favorites limit enforcement
 *
 * Key verification: Cache invalidation uses invalidateQueries() with
 * the centralized userFavoriteKeys factory, NOT refetch().
 */

import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useFavorites } from "../useFavorites";
import { userFavoriteKeys } from "@/atomic-crm/queryKeys";
import type { Favorite, FavoriteEntityType } from "@/atomic-crm/validation/favorites";

// Mock react-admin hooks
vi.mock("react-admin", () => ({
  useGetIdentity: vi.fn(),
  useGetList: vi.fn(),
  useCreate: vi.fn(),
  useUpdate: vi.fn(),
  useNotify: vi.fn(),
}));

// Mock @tanstack/react-query
vi.mock("@tanstack/react-query", () => ({
  useQueryClient: vi.fn(),
}));

import { useGetIdentity, useGetList, useCreate, useUpdate, useNotify } from "react-admin";
import { useQueryClient } from "@tanstack/react-query";

const mockUseGetIdentity = vi.mocked(useGetIdentity);
const mockUseGetList = vi.mocked(useGetList);
const mockUseCreate = vi.mocked(useCreate);
const mockUseUpdate = vi.mocked(useUpdate);
const mockUseNotify = vi.mocked(useNotify);
const mockUseQueryClient = vi.mocked(useQueryClient);

// Test data
const TEST_USER_ID = "user-123";
const mockFavorite: Favorite = {
  id: 1,
  user_id: TEST_USER_ID,
  entity_type: "contact" as FavoriteEntityType,
  entity_id: 42,
  display_name: "Test Contact",
  created_at: new Date().toISOString(),
  deleted_at: null,
};

describe("useFavorites", () => {
  let mockInvalidateQueries: Mock;
  let mockCreate: Mock;
  let mockUpdate: Mock;
  let mockNotify: Mock;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup queryClient mock with invalidateQueries spy
    mockInvalidateQueries = vi.fn();
    mockUseQueryClient.mockReturnValue({
      invalidateQueries: mockInvalidateQueries,
    } as unknown as ReturnType<typeof useQueryClient>);

    // Setup identity mock
    mockUseGetIdentity.mockReturnValue({
      data: { user_id: TEST_USER_ID },
      isLoading: false,
    } as unknown as ReturnType<typeof useGetIdentity>);

    // Setup useGetList mock for favorites
    mockUseGetList.mockReturnValue({
      data: [],
      isLoading: false,
    } as unknown as ReturnType<typeof useGetList>);

    // Setup create mutation mock
    mockCreate = vi.fn();
    mockUseCreate.mockReturnValue([mockCreate, { isLoading: false }] as unknown as ReturnType<
      typeof useCreate
    >);

    // Setup update mutation mock
    mockUpdate = vi.fn();
    mockUseUpdate.mockReturnValue([mockUpdate, { isLoading: false }] as unknown as ReturnType<
      typeof useUpdate
    >);

    // Setup notify mock
    mockNotify = vi.fn();
    mockUseNotify.mockReturnValue(mockNotify);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("hook initialization", () => {
    it("should return initial state correctly", () => {
      const { result } = renderHook(() => useFavorites());

      expect(result.current.favorites).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.canAddMore).toBe(true);
      expect(result.current.favoritesCount).toBe(0);
      expect(typeof result.current.isFavorite).toBe("function");
      expect(typeof result.current.toggleFavorite).toBe("function");
    });

    it("should return existing favorites from useGetList", () => {
      mockUseGetList.mockReturnValue({
        data: [mockFavorite],
        isLoading: false,
      } as unknown as ReturnType<typeof useGetList>);

      const { result } = renderHook(() => useFavorites());

      expect(result.current.favorites).toHaveLength(1);
      expect(result.current.favoritesCount).toBe(1);
    });

    it("should disable fetching when user is not logged in", () => {
      mockUseGetIdentity.mockReturnValue({
        data: undefined,
        isLoading: false,
      } as unknown as ReturnType<typeof useGetIdentity>);

      renderHook(() => useFavorites());

      // Verify useGetList was called with enabled: false
      expect(mockUseGetList).toHaveBeenCalledWith(
        "user_favorites",
        expect.objectContaining({
          filter: {},
        }),
        expect.objectContaining({ enabled: false })
      );
    });
  });

  describe("isFavorite", () => {
    it("should return true for favorited entity", () => {
      mockUseGetList.mockReturnValue({
        data: [mockFavorite],
        isLoading: false,
      } as unknown as ReturnType<typeof useGetList>);

      const { result } = renderHook(() => useFavorites());

      expect(result.current.isFavorite("contact", 42)).toBe(true);
    });

    it("should return false for non-favorited entity", () => {
      mockUseGetList.mockReturnValue({
        data: [mockFavorite],
        isLoading: false,
      } as unknown as ReturnType<typeof useGetList>);

      const { result } = renderHook(() => useFavorites());

      expect(result.current.isFavorite("contact", 999)).toBe(false);
      expect(result.current.isFavorite("opportunity", 42)).toBe(false);
    });
  });

  describe("cache invalidation on add favorite", () => {
    it("should call invalidateQueries with userFavoriteKeys.all on successful create", async () => {
      // Setup create to call onSuccess callback
      mockCreate.mockImplementation((_resource, _params, options) => {
        options?.onSuccess?.();
        return Promise.resolve({ data: { id: 2 } });
      });

      const { result } = renderHook(() => useFavorites());

      await act(async () => {
        await result.current.toggleFavorite("contact", 100, "New Contact");
      });

      // Verify invalidateQueries was called with the correct query key
      expect(mockInvalidateQueries).toHaveBeenCalledTimes(1);
      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: userFavoriteKeys.all,
      });
    });

    it("should use userFavoriteKeys factory, not hardcoded string", async () => {
      mockCreate.mockImplementation((_resource, _params, options) => {
        options?.onSuccess?.();
        return Promise.resolve({ data: { id: 2 } });
      });

      const { result } = renderHook(() => useFavorites());

      await act(async () => {
        await result.current.toggleFavorite("contact", 100, "New Contact");
      });

      // Verify the exact query key structure from factory
      const callArg = mockInvalidateQueries.mock.calls[0][0];
      expect(callArg.queryKey).toEqual(["user_favorites"]);
      expect(callArg.queryKey).toBe(userFavoriteKeys.all);
    });

    it("should NOT call invalidateQueries on create error", async () => {
      mockCreate.mockImplementation((_resource, _params, options) => {
        options?.onError?.(new Error("Create failed"));
        return Promise.reject(new Error("Create failed"));
      });

      const { result } = renderHook(() => useFavorites());

      await act(async () => {
        try {
          await result.current.toggleFavorite("contact", 100, "New Contact");
        } catch {
          // Expected error
        }
      });

      // Verify invalidateQueries was NOT called on error
      expect(mockInvalidateQueries).not.toHaveBeenCalled();
    });
  });

  describe("cache invalidation on remove favorite", () => {
    beforeEach(() => {
      // Setup with existing favorite
      mockUseGetList.mockReturnValue({
        data: [mockFavorite],
        isLoading: false,
      } as unknown as ReturnType<typeof useGetList>);
    });

    it("should call invalidateQueries with userFavoriteKeys.all on successful update (soft delete)", async () => {
      mockUpdate.mockImplementation((_resource, _params, options) => {
        options?.onSuccess?.();
        return Promise.resolve({ data: { ...mockFavorite, deleted_at: new Date().toISOString() } });
      });

      const { result } = renderHook(() => useFavorites());

      await act(async () => {
        await result.current.toggleFavorite("contact", 42, "Test Contact");
      });

      // Verify invalidateQueries was called with the correct query key
      expect(mockInvalidateQueries).toHaveBeenCalledTimes(1);
      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: userFavoriteKeys.all,
      });
    });

    it("should NOT call invalidateQueries on update error", async () => {
      mockUpdate.mockImplementation((_resource, _params, options) => {
        options?.onError?.(new Error("Update failed"));
        return Promise.reject(new Error("Update failed"));
      });

      const { result } = renderHook(() => useFavorites());

      await act(async () => {
        try {
          await result.current.toggleFavorite("contact", 42, "Test Contact");
        } catch {
          // Expected error
        }
      });

      // Verify invalidateQueries was NOT called on error
      expect(mockInvalidateQueries).not.toHaveBeenCalled();
    });
  });

  describe("optimistic updates", () => {
    it("should optimistically update isFavorite before server response", async () => {
      // Create that doesn't immediately resolve
      let resolveCreate: () => void;
      const createPromise = new Promise<void>((resolve) => {
        resolveCreate = resolve;
      });

      mockCreate.mockImplementation(() => createPromise);

      const { result } = renderHook(() => useFavorites());

      // Initially not favorited
      expect(result.current.isFavorite("contact", 100)).toBe(false);

      // Start toggle (don't await)
      act(() => {
        result.current.toggleFavorite("contact", 100, "New Contact");
      });

      // Should optimistically show as favorited
      await waitFor(() => {
        expect(result.current.isFavorite("contact", 100)).toBe(true);
      });

      // Cleanup
      await act(async () => {
        resolveCreate!();
      });
    });

    it("should rollback optimistic update on error", async () => {
      mockCreate.mockImplementation((_resource, _params, options) => {
        options?.onError?.(new Error("Network error"));
        return Promise.reject(new Error("Network error"));
      });

      const { result } = renderHook(() => useFavorites());

      await act(async () => {
        try {
          await result.current.toggleFavorite("contact", 100, "New Contact");
        } catch {
          // Expected error
        }
      });

      // Should rollback to not favorited
      expect(result.current.isFavorite("contact", 100)).toBe(false);
    });
  });

  describe("maximum favorites limit", () => {
    it("should enforce MAX_FAVORITES limit of 10", () => {
      const tenFavorites = Array.from({ length: 10 }, (_, i) => ({
        ...mockFavorite,
        id: i + 1,
        entity_id: i + 1,
      }));

      mockUseGetList.mockReturnValue({
        data: tenFavorites,
        isLoading: false,
      } as unknown as ReturnType<typeof useGetList>);

      const { result } = renderHook(() => useFavorites());

      expect(result.current.favoritesCount).toBe(10);
      expect(result.current.canAddMore).toBe(false);
    });

    it("should show warning notification when trying to exceed limit", async () => {
      const tenFavorites = Array.from({ length: 10 }, (_, i) => ({
        ...mockFavorite,
        id: i + 1,
        entity_id: i + 1,
      }));

      mockUseGetList.mockReturnValue({
        data: tenFavorites,
        isLoading: false,
      } as unknown as ReturnType<typeof useGetList>);

      const { result } = renderHook(() => useFavorites());

      await act(async () => {
        await result.current.toggleFavorite("contact", 999, "New Contact");
      });

      // Verify warning notification was shown
      expect(mockNotify).toHaveBeenCalledWith(
        "Maximum 10 favorites reached. Remove one to add another.",
        { type: "warning" }
      );

      // Verify create was NOT called
      expect(mockCreate).not.toHaveBeenCalled();

      // Verify invalidateQueries was NOT called
      expect(mockInvalidateQueries).not.toHaveBeenCalled();
    });
  });

  describe("user authentication", () => {
    it("should show error notification when user is not logged in", async () => {
      mockUseGetIdentity.mockReturnValue({
        data: undefined,
        isLoading: false,
      } as unknown as ReturnType<typeof useGetIdentity>);

      const { result } = renderHook(() => useFavorites());

      await act(async () => {
        await result.current.toggleFavorite("contact", 100, "New Contact");
      });

      // Verify error notification
      expect(mockNotify).toHaveBeenCalledWith("You must be logged in to manage favorites", {
        type: "error",
      });

      // Verify no mutations or cache invalidation
      expect(mockCreate).not.toHaveBeenCalled();
      expect(mockUpdate).not.toHaveBeenCalled();
      expect(mockInvalidateQueries).not.toHaveBeenCalled();
    });
  });

  describe("query key factory integration", () => {
    it("should use userFavoriteKeys.all which equals ['user_favorites']", () => {
      // Verify the factory produces expected key structure
      expect(userFavoriteKeys.all).toEqual(["user_favorites"]);
    });

    it("should pass correct filter to useGetList based on userId", () => {
      renderHook(() => useFavorites());

      expect(mockUseGetList).toHaveBeenCalledWith(
        "user_favorites",
        expect.objectContaining({
          filter: { user_id: TEST_USER_ID, deleted_at: null },
        }),
        expect.objectContaining({ enabled: true })
      );
    });
  });
});
