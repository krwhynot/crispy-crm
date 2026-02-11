import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type * as ReactAdmin from "react-admin";
import { useSmartDefaults } from "../useSmartDefaults";
import { format } from "date-fns";

const mockUseGetIdentity = vi.fn();
vi.mock("react-admin", async (importOriginal) => {
  const actual = await importOriginal<typeof ReactAdmin>();
  return {
    ...actual,
    useGetIdentity: () => mockUseGetIdentity(),
  };
});

describe("useSmartDefaults", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("loading state", () => {
    it("should return isLoading: true when identity is loading", () => {
      mockUseGetIdentity.mockReturnValue({
        data: undefined,
        isLoading: true,
      });

      const { result } = renderHook(() => useSmartDefaults());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.defaults.sales_id).toBe(null);
    });

    it("should return isLoading: false when identity is loaded", () => {
      mockUseGetIdentity.mockReturnValue({
        data: { id: "123", fullName: "Test User", role: "rep" },
        isLoading: false,
      });

      const { result } = renderHook(() => useSmartDefaults());

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("defaults generation", () => {
    it("should return sales_id from identity when loaded", () => {
      const mockIdentity = {
        id: "user-456",
        fullName: "John Sales",
        role: "rep",
      };

      mockUseGetIdentity.mockReturnValue({
        data: mockIdentity,
        isLoading: false,
      });

      const { result } = renderHook(() => useSmartDefaults());

      expect(result.current.defaults.sales_id).toBe("user-456");
      expect(result.current.isLoading).toBe(false);
    });

    it("should return today's date in YYYY-MM-DD format for activity_date", () => {
      mockUseGetIdentity.mockReturnValue({
        data: { id: "123", fullName: "Test User", role: "rep" },
        isLoading: false,
      });

      const { result } = renderHook(() => useSmartDefaults());

      const today = format(new Date(), "yyyy-MM-dd");
      expect(result.current.defaults.activity_date).toBe(today);
    });

    it("should return sales_id: null when identity is undefined on first render", () => {
      mockUseGetIdentity.mockReturnValue({
        data: undefined,
        isLoading: true,
      });

      const { result } = renderHook(() => useSmartDefaults());

      expect(result.current.defaults.sales_id).toBe(null);
    });
  });

  describe("reset integration", () => {
    it("should call reset with keepDirtyValues when identity becomes available", async () => {
      const mockReset = vi.fn();

      mockUseGetIdentity.mockReturnValue({
        data: undefined,
        isLoading: true,
      });

      const { rerender } = renderHook(() => useSmartDefaults({ reset: mockReset }));

      expect(mockReset).not.toHaveBeenCalled();

      mockUseGetIdentity.mockReturnValue({
        data: { id: "user-789", fullName: "Jane Manager", role: "manager" },
        isLoading: false,
      });

      rerender();

      await waitFor(() => {
        expect(mockReset).toHaveBeenCalledWith(
          expect.objectContaining({
            sales_id: "user-789",
            activity_date: expect.any(String),
          }),
          { keepDirtyValues: true }
        );
      });
    });

    it("should not call reset on subsequent renders if identity hasn't changed", () => {
      const mockReset = vi.fn();

      mockUseGetIdentity.mockReturnValue({
        data: { id: "user-123", fullName: "Test User", role: "rep" },
        isLoading: false,
      });

      const { rerender } = renderHook(() => useSmartDefaults({ reset: mockReset }));

      expect(mockReset).toHaveBeenCalledTimes(1);

      mockReset.mockClear();
      rerender();

      expect(mockReset).not.toHaveBeenCalled();
    });

    it("should work without reset function provided", () => {
      mockUseGetIdentity.mockReturnValue({
        data: { id: "user-123", fullName: "Test User", role: "rep" },
        isLoading: false,
      });

      const { result } = renderHook(() => useSmartDefaults());

      expect(result.current.defaults.sales_id).toBe("user-123");
      expect(result.current.defaults.activity_date).toBe(format(new Date(), "yyyy-MM-dd"));
    });
  });

  describe("identity transitions", () => {
    it("should handle identity loading -> loaded transition", async () => {
      const mockReset = vi.fn();

      mockUseGetIdentity.mockReturnValue({
        data: undefined,
        isLoading: true,
      });

      const { result, rerender } = renderHook(() => useSmartDefaults({ reset: mockReset }));

      expect(result.current.isLoading).toBe(true);
      expect(result.current.defaults.sales_id).toBe(null);

      mockUseGetIdentity.mockReturnValue({
        data: { id: "user-final", fullName: "Final User", role: "admin" },
        isLoading: false,
      });

      rerender();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.defaults.sales_id).toBe("user-final");
      });
    });
  });
});
