/**
 * Tests for useDuplicateOrgCheck hook
 *
 * Verifies the soft duplicate checking behavior:
 * - Returns null when no duplicate found
 * - Returns duplicate info when duplicate exists
 * - Excludes current org in edit mode
 * - Bypassed duplicates don't trigger again
 * - Handles API errors gracefully
 */
import { renderHook, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { useDuplicateOrgCheck } from "../useDuplicateOrgCheck";

type DuplicateResult = { id: string; name: string } | null;

// Mock ra-core's useDataProvider and useNotify
const mockGetList = vi.fn();
const mockNotify = vi.fn();
vi.mock("ra-core", () => ({
  useDataProvider: () => ({
    getList: mockGetList,
  }),
  useNotify: () => mockNotify,
}));

describe("useDuplicateOrgCheck", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns null when no duplicate is found", async () => {
    mockGetList.mockResolvedValueOnce({ data: [] });

    const { result } = renderHook(() => useDuplicateOrgCheck());

    let duplicate: DuplicateResult = null;
    await act(async () => {
      duplicate = await result.current.checkForDuplicate("New Company");
    });

    expect(duplicate).toBeNull();
    expect(result.current.duplicateOrg).toBeNull();
  });

  it("returns duplicate info when duplicate exists", async () => {
    mockGetList.mockResolvedValueOnce({
      data: [{ id: "123", name: "Existing Company" }],
    });

    const { result } = renderHook(() => useDuplicateOrgCheck());

    let duplicate: DuplicateResult = null;
    await act(async () => {
      duplicate = await result.current.checkForDuplicate("Existing Company");
    });

    expect(duplicate).toEqual({ id: "123", name: "Existing Company" });
    expect(result.current.duplicateOrg).toEqual({ id: "123", name: "Existing Company" });
  });

  it("excludes current org when checking in edit mode", async () => {
    mockGetList.mockResolvedValueOnce({
      data: [{ id: "456", name: "My Company" }],
    });

    const { result } = renderHook(() => useDuplicateOrgCheck());

    let duplicate: DuplicateResult = null;
    await act(async () => {
      // Check with currentOrgId matching the found record
      duplicate = await result.current.checkForDuplicate("My Company", "456");
    });

    // Should not flag as duplicate since it's the same org
    expect(duplicate).toBeNull();
  });

  it("clears duplicate when clearDuplicate is called", async () => {
    mockGetList.mockResolvedValueOnce({
      data: [{ id: "789", name: "Duplicate Corp" }],
    });

    const { result } = renderHook(() => useDuplicateOrgCheck());

    await act(async () => {
      await result.current.checkForDuplicate("Duplicate Corp");
    });

    expect(result.current.duplicateOrg).not.toBeNull();

    act(() => {
      result.current.clearDuplicate();
    });

    expect(result.current.duplicateOrg).toBeNull();
  });

  it("bypassed names do not trigger warning again", async () => {
    mockGetList.mockResolvedValue({
      data: [{ id: "111", name: "Bypassed Company" }],
    });

    const { result } = renderHook(() => useDuplicateOrgCheck());

    // First check - should find duplicate
    let duplicate: DuplicateResult = null;
    await act(async () => {
      duplicate = await result.current.checkForDuplicate("Bypassed Company");
    });
    expect(duplicate).not.toBeNull();

    // Bypass the duplicate
    act(() => {
      result.current.bypassDuplicate();
    });

    // Second check - should NOT find duplicate (bypassed)
    await act(async () => {
      duplicate = await result.current.checkForDuplicate("Bypassed Company");
    });
    expect(duplicate).toBeNull();
  });

  it("handles empty/whitespace names gracefully", async () => {
    const { result } = renderHook(() => useDuplicateOrgCheck());

    let duplicate: DuplicateResult = null;
    await act(async () => {
      duplicate = await result.current.checkForDuplicate("");
    });
    expect(duplicate).toBeNull();

    await act(async () => {
      duplicate = await result.current.checkForDuplicate("   ");
    });
    expect(duplicate).toBeNull();

    // Should not call the API for empty names
    expect(mockGetList).not.toHaveBeenCalled();
  });

  it("handles API errors gracefully without blocking", async () => {
    mockGetList.mockRejectedValueOnce(new Error("Network error"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderHook(() => useDuplicateOrgCheck());

    let duplicate: DuplicateResult = null;
    await act(async () => {
      duplicate = await result.current.checkForDuplicate("Some Company");
    });

    // Should not block on errors
    expect(duplicate).toBeNull();
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it("sets isChecking to false after completion", async () => {
    mockGetList.mockResolvedValueOnce({ data: [] });

    const { result } = renderHook(() => useDuplicateOrgCheck());

    expect(result.current.isChecking).toBe(false);

    await act(async () => {
      await result.current.checkForDuplicate("Test Company");
    });

    // isChecking should be false after completion
    expect(result.current.isChecking).toBe(false);
  });

  it("performs case-insensitive bypass matching", async () => {
    // First call returns a duplicate
    mockGetList.mockResolvedValueOnce({
      data: [{ id: "222", name: "Case Test Company" }],
    });

    const { result } = renderHook(() => useDuplicateOrgCheck());

    // First check with original case - should find duplicate
    let duplicate: DuplicateResult = null;
    await act(async () => {
      duplicate = await result.current.checkForDuplicate("Case Test Company");
    });
    expect(duplicate).not.toBeNull();

    // Bypass the duplicate
    act(() => {
      result.current.bypassDuplicate();
    });

    // Second call would normally return the same duplicate
    mockGetList.mockResolvedValueOnce({
      data: [{ id: "222", name: "Case Test Company" }],
    });

    // Check with different case - should be bypassed (not hit API due to bypass cache)
    await act(async () => {
      duplicate = await result.current.checkForDuplicate("CASE TEST COMPANY");
    });
    expect(duplicate).toBeNull();
  });
});
