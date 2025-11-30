import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRecentSelections } from "../useRecentSelections";

describe("useRecentSelections", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("should initialize with empty array when no stored items", () => {
    const { result } = renderHook(() => useRecentSelections("organization"));
    expect(result.current.recentItems).toEqual([]);
  });

  it("should add item to recent selections", () => {
    const { result } = renderHook(() => useRecentSelections("organization"));

    act(() => {
      result.current.addRecent({ id: 1, label: "Acme Corp" });
    });

    expect(result.current.recentItems).toHaveLength(1);
    expect(result.current.recentItems[0]).toEqual({ id: 1, label: "Acme Corp" });
  });

  it("should store items in localStorage with correct prefix", () => {
    const { result } = renderHook(() => useRecentSelections("organization"));

    act(() => {
      result.current.addRecent({ id: 1, label: "Acme Corp" });
    });

    const stored = localStorage.getItem("crm_recent_organization");
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored!);
    expect(parsed).toEqual([{ id: 1, label: "Acme Corp" }]);
  });

  it("should limit to maximum 5 items", () => {
    const { result } = renderHook(() => useRecentSelections("organization"));

    act(() => {
      result.current.addRecent({ id: 1, label: "Item 1" });
      result.current.addRecent({ id: 2, label: "Item 2" });
      result.current.addRecent({ id: 3, label: "Item 3" });
      result.current.addRecent({ id: 4, label: "Item 4" });
      result.current.addRecent({ id: 5, label: "Item 5" });
      result.current.addRecent({ id: 6, label: "Item 6" });
    });

    expect(result.current.recentItems).toHaveLength(5);
    expect(result.current.recentItems[0]).toEqual({ id: 6, label: "Item 6" });
    expect(result.current.recentItems[4]).toEqual({ id: 2, label: "Item 2" });
  });

  it("should deduplicate items by ID and move to front", () => {
    const { result } = renderHook(() => useRecentSelections("organization"));

    act(() => {
      result.current.addRecent({ id: 1, label: "Item 1" });
      result.current.addRecent({ id: 2, label: "Item 2" });
      result.current.addRecent({ id: 3, label: "Item 3" });
    });

    expect(result.current.recentItems).toHaveLength(3);

    act(() => {
      result.current.addRecent({ id: 2, label: "Item 2 Updated" });
    });

    expect(result.current.recentItems).toHaveLength(3);
    expect(result.current.recentItems[0]).toEqual({ id: 2, label: "Item 2 Updated" });
    expect(result.current.recentItems[1]).toEqual({ id: 3, label: "Item 3" });
    expect(result.current.recentItems[2]).toEqual({ id: 1, label: "Item 1" });
  });

  it("should clear all recent items", () => {
    const { result } = renderHook(() => useRecentSelections("organization"));

    act(() => {
      result.current.addRecent({ id: 1, label: "Item 1" });
      result.current.addRecent({ id: 2, label: "Item 2" });
    });

    expect(result.current.recentItems).toHaveLength(2);

    act(() => {
      result.current.clearRecent();
    });

    expect(result.current.recentItems).toEqual([]);
    expect(localStorage.getItem("crm_recent_organization")).toBeNull();
  });

  it("should isolate items by field type", () => {
    const { result: orgResult } = renderHook(() => useRecentSelections("organization"));
    const { result: contactResult } = renderHook(() => useRecentSelections("contact"));

    act(() => {
      orgResult.current.addRecent({ id: 1, label: "Organization 1" });
      contactResult.current.addRecent({ id: 1, label: "Contact 1" });
    });

    expect(orgResult.current.recentItems).toHaveLength(1);
    expect(orgResult.current.recentItems[0]).toEqual({ id: 1, label: "Organization 1" });

    expect(contactResult.current.recentItems).toHaveLength(1);
    expect(contactResult.current.recentItems[0]).toEqual({ id: 1, label: "Contact 1" });

    expect(localStorage.getItem("crm_recent_organization")).toBeTruthy();
    expect(localStorage.getItem("crm_recent_contact")).toBeTruthy();
  });

  it("should persist items across hook instances", () => {
    const { result: firstInstance } = renderHook(() => useRecentSelections("organization"));

    act(() => {
      firstInstance.current.addRecent({ id: 1, label: "Acme Corp" });
    });

    const { result: secondInstance } = renderHook(() => useRecentSelections("organization"));

    expect(secondInstance.current.recentItems).toHaveLength(1);
    expect(secondInstance.current.recentItems[0]).toEqual({ id: 1, label: "Acme Corp" });
  });

  it("should handle string IDs", () => {
    const { result } = renderHook(() => useRecentSelections("opportunity"));

    act(() => {
      result.current.addRecent({ id: "abc-123", label: "Deal Alpha" });
      result.current.addRecent({ id: "def-456", label: "Deal Beta" });
    });

    expect(result.current.recentItems).toHaveLength(2);
    expect(result.current.recentItems[0]).toEqual({ id: "def-456", label: "Deal Beta" });
  });

  it("should handle corrupted localStorage data gracefully", () => {
    localStorage.setItem("crm_recent_organization", "invalid json");

    const { result } = renderHook(() => useRecentSelections("organization"));

    expect(result.current.recentItems).toEqual([]);

    act(() => {
      result.current.addRecent({ id: 1, label: "New Item" });
    });

    expect(result.current.recentItems).toHaveLength(1);
  });
});
