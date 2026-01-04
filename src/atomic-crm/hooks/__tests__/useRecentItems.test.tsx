import { vi, describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { RecentItem } from "../useRecentItems";

let mockStore: RecentItem[] = [];
const mockSetStore = vi.fn((updater: RecentItem[] | ((prev: RecentItem[]) => RecentItem[])) => {
  if (typeof updater === "function") {
    mockStore = updater(mockStore);
  } else {
    mockStore = updater;
  }
});

vi.mock("react-admin", () => ({
  useStore: vi.fn(() => [mockStore, mockSetStore]),
}));

import { useRecentItems } from "../useRecentItems";

describe("useRecentItems", () => {
  beforeEach(() => {
    mockStore = [];
    mockSetStore.mockClear();
  });

  it("should initialize with empty array", () => {
    const { result } = renderHook(() => useRecentItems());
    expect(result.current.recentItems).toEqual([]);
  });

  it("should add item to front of list", () => {
    const { result } = renderHook(() => useRecentItems());

    act(() => {
      result.current.addRecentItem({
        id: 1,
        resource: "contacts",
        title: "John Doe",
      });
    });

    expect(mockStore).toHaveLength(1);
    expect(mockStore[0]).toMatchObject({
      id: 1,
      resource: "contacts",
      title: "John Doe",
    });
    expect(mockStore[0].viewedAt).toBeDefined();
  });

  it("should prevent duplicates by id+resource, updating timestamp", () => {
    const { result } = renderHook(() => useRecentItems());

    act(() => {
      result.current.addRecentItem({
        id: 1,
        resource: "contacts",
        title: "John Doe",
      });
    });

    const firstTimestamp = mockStore[0].viewedAt;

    act(() => {
      result.current.addRecentItem({
        id: 2,
        resource: "contacts",
        title: "Jane Doe",
      });
    });

    vi.useFakeTimers();
    vi.advanceTimersByTime(1000);

    act(() => {
      result.current.addRecentItem({
        id: 1,
        resource: "contacts",
        title: "John Doe Updated",
      });
    });

    vi.useRealTimers();

    expect(mockStore).toHaveLength(2);
    expect(mockStore[0]).toMatchObject({
      id: 1,
      resource: "contacts",
      title: "John Doe Updated",
    });
    expect(mockStore[0].viewedAt).not.toEqual(firstTimestamp);
    expect(mockStore[1]).toMatchObject({
      id: 2,
      resource: "contacts",
      title: "Jane Doe",
    });
  });

  it("should limit to MAX_RECENT_ITEMS (10)", () => {
    const { result } = renderHook(() => useRecentItems());

    act(() => {
      for (let i = 1; i <= 12; i++) {
        result.current.addRecentItem({
          id: i,
          resource: "contacts",
          title: `Contact ${i}`,
        });
      }
    });

    expect(mockStore).toHaveLength(10);
    expect(mockStore[0]).toMatchObject({
      id: 12,
      resource: "contacts",
      title: "Contact 12",
    });
    expect(mockStore[9]).toMatchObject({
      id: 3,
      resource: "contacts",
      title: "Contact 3",
    });
    const hasItem1 = mockStore.some((item) => item.id === 1);
    const hasItem2 = mockStore.some((item) => item.id === 2);
    expect(hasItem1).toBe(false);
    expect(hasItem2).toBe(false);
  });

  it("should clear all items", () => {
    const { result } = renderHook(() => useRecentItems());

    act(() => {
      result.current.addRecentItem({
        id: 1,
        resource: "contacts",
        title: "John Doe",
      });
      result.current.addRecentItem({
        id: 2,
        resource: "organizations",
        title: "Acme Corp",
      });
    });

    expect(mockStore).toHaveLength(2);

    act(() => {
      result.current.clearRecentItems();
    });

    expect(mockStore).toEqual([]);
  });

  it("should handle string and number IDs", () => {
    const { result } = renderHook(() => useRecentItems());

    act(() => {
      result.current.addRecentItem({
        id: 123,
        resource: "contacts",
        title: "Numeric ID Contact",
      });
      result.current.addRecentItem({
        id: "uuid-abc-123",
        resource: "opportunities",
        title: "String ID Opportunity",
      });
    });

    expect(mockStore).toHaveLength(2);
    expect(mockStore[0]).toMatchObject({
      id: "uuid-abc-123",
      resource: "opportunities",
      title: "String ID Opportunity",
    });
    expect(mockStore[1]).toMatchObject({
      id: 123,
      resource: "contacts",
      title: "Numeric ID Contact",
    });
  });

  it("should differentiate same ID across different resources", () => {
    const { result } = renderHook(() => useRecentItems());

    act(() => {
      result.current.addRecentItem({
        id: 1,
        resource: "contacts",
        title: "Contact #1",
      });
      result.current.addRecentItem({
        id: 1,
        resource: "organizations",
        title: "Organization #1",
      });
      result.current.addRecentItem({
        id: 1,
        resource: "opportunities",
        title: "Opportunity #1",
      });
    });

    expect(mockStore).toHaveLength(3);
    expect(mockStore[0]).toMatchObject({
      id: 1,
      resource: "opportunities",
      title: "Opportunity #1",
    });
    expect(mockStore[1]).toMatchObject({
      id: 1,
      resource: "organizations",
      title: "Organization #1",
    });
    expect(mockStore[2]).toMatchObject({
      id: 1,
      resource: "contacts",
      title: "Contact #1",
    });
  });

  it("should add viewedAt timestamp as ISO string", () => {
    const { result } = renderHook(() => useRecentItems());
    const beforeAdd = new Date().toISOString();

    act(() => {
      result.current.addRecentItem({
        id: 1,
        resource: "contacts",
        title: "John Doe",
      });
    });

    const afterAdd = new Date().toISOString();
    const viewedAt = mockStore[0].viewedAt;

    expect(viewedAt >= beforeAdd).toBe(true);
    expect(viewedAt <= afterAdd).toBe(true);
    expect(() => new Date(viewedAt)).not.toThrow();
  });

  it("should move duplicate to front when re-added", () => {
    const { result } = renderHook(() => useRecentItems());

    act(() => {
      result.current.addRecentItem({
        id: 1,
        resource: "contacts",
        title: "Contact 1",
      });
      result.current.addRecentItem({
        id: 2,
        resource: "contacts",
        title: "Contact 2",
      });
      result.current.addRecentItem({
        id: 3,
        resource: "contacts",
        title: "Contact 3",
      });
    });

    expect(mockStore[0].id).toBe(3);
    expect(mockStore[2].id).toBe(1);

    act(() => {
      result.current.addRecentItem({
        id: 1,
        resource: "contacts",
        title: "Contact 1",
      });
    });

    expect(mockStore).toHaveLength(3);
    expect(mockStore[0].id).toBe(1);
    expect(mockStore[1].id).toBe(3);
    expect(mockStore[2].id).toBe(2);
  });
});
