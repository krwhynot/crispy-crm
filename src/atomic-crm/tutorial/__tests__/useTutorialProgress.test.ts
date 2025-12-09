import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTutorialProgress } from "../useTutorialProgress";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

describe("useTutorialProgress", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it("should return default progress when localStorage is empty", () => {
    const { result } = renderHook(() => useTutorialProgress());

    expect(result.current.progress).toEqual({
      currentChapter: null,
      currentStepIndex: 0,
      completedChapters: [],
      lastUpdated: expect.any(String),
    });
  });

  it("should load progress from localStorage on mount", () => {
    const savedProgress = {
      currentChapter: "contacts",
      currentStepIndex: 3,
      completedChapters: ["organizations"],
      lastUpdated: "2025-12-06T10:00:00.000Z",
    };
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(savedProgress));

    const { result } = renderHook(() => useTutorialProgress());

    expect(result.current.progress).toEqual(savedProgress);
  });

  it("should save progress to localStorage when updated", () => {
    const { result } = renderHook(() => useTutorialProgress());

    act(() => {
      result.current.setCurrentChapter("contacts");
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "tutorial-progress",
      expect.stringContaining('"currentChapter":"contacts"')
    );
  });

  it("should mark chapter as completed", () => {
    const { result } = renderHook(() => useTutorialProgress());

    act(() => {
      result.current.markChapterComplete("organizations");
    });

    expect(result.current.progress.completedChapters).toContain("organizations");
  });

  it("should not duplicate completed chapters", () => {
    const { result } = renderHook(() => useTutorialProgress());

    act(() => {
      result.current.markChapterComplete("organizations");
      result.current.markChapterComplete("organizations");
    });

    expect(
      result.current.progress.completedChapters.filter((c) => c === "organizations")
    ).toHaveLength(1);
  });

  it("should reset progress", () => {
    const savedProgress = {
      currentChapter: "contacts",
      currentStepIndex: 3,
      completedChapters: ["organizations"],
      lastUpdated: "2025-12-06T10:00:00.000Z",
    };
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(savedProgress));

    const { result } = renderHook(() => useTutorialProgress());

    act(() => {
      result.current.resetProgress();
    });

    expect(result.current.progress.currentChapter).toBeNull();
    expect(result.current.progress.completedChapters).toEqual([]);
  });
});
