import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useSlideOverState } from "./useSlideOverState";

describe("useSlideOverState", () => {
  let originalLocation: Location;
  let originalHistory: History;

  beforeEach(() => {
    // Save original location and history
    originalLocation = window.location;
    originalHistory = window.history;

    // Mock window.location and window.history
    // @ts-expect-error - intentionally deleting readonly property for test isolation
    delete window.location;
    // @ts-expect-error - intentionally deleting readonly property for test isolation
    delete window.history;

    // Hook uses hash-based routing, so we need to mock hash property
    window.location = {
      ...originalLocation,
      search: "",
      pathname: "/test",
      hash: "", // Default empty hash for hash-based routing
    } as Location;

    window.history = {
      ...originalHistory,
      pushState: vi.fn(),
      replaceState: vi.fn(),
    } as unknown as History;
  });

  afterEach(() => {
    // Restore original location and history
    window.location = originalLocation;
    window.history = originalHistory;
  });

  describe("Initial state", () => {
    it("should initialize with closed state when no URL params", () => {
      const { result } = renderHook(() => useSlideOverState());

      expect(result.current.slideOverId).toBeNull();
      expect(result.current.isOpen).toBe(false);
      expect(result.current.mode).toBe("view");
    });

    it("should initialize with view mode when ?view=123 in URL", () => {
      window.location.hash = "#/test?view=123";

      const { result } = renderHook(() => useSlideOverState());

      expect(result.current.slideOverId).toBe(123);
      expect(result.current.isOpen).toBe(true);
      expect(result.current.mode).toBe("view");
    });

    it("should initialize with edit mode when ?edit=456 in URL", () => {
      window.location.hash = "#/test?edit=456";

      const { result } = renderHook(() => useSlideOverState());

      expect(result.current.slideOverId).toBe(456);
      expect(result.current.isOpen).toBe(true);
      expect(result.current.mode).toBe("edit");
    });

    it("should prioritize view param when both view and edit params exist", () => {
      window.location.hash = "#/test?view=123&edit=456";

      const { result } = renderHook(() => useSlideOverState());

      expect(result.current.slideOverId).toBe(123);
      expect(result.current.mode).toBe("view");
    });
  });

  describe("openSlideOver function", () => {
    it("should open slide-over in view mode by default", () => {
      const { result } = renderHook(() => useSlideOverState());

      act(() => {
        result.current.openSlideOver(789);
      });

      expect(result.current.slideOverId).toBe(789);
      expect(result.current.isOpen).toBe(true);
      expect(result.current.mode).toBe("view");
      // Hash-based routing: hash is empty initially, so setHashParams returns "?view=789"
      expect(window.history.pushState).toHaveBeenCalledWith(null, "", "?view=789");
    });

    it("should open slide-over in edit mode when specified", () => {
      const { result } = renderHook(() => useSlideOverState());

      act(() => {
        result.current.openSlideOver(999, "edit");
      });

      expect(result.current.slideOverId).toBe(999);
      expect(result.current.isOpen).toBe(true);
      expect(result.current.mode).toBe("edit");
      // Hash-based routing: hash is empty initially, so setHashParams returns "?edit=999"
      expect(window.history.pushState).toHaveBeenCalledWith(null, "", "?edit=999");
    });

    it("should clear previous params when opening with new ID", () => {
      window.location.hash = "#/test?view=100&other=param";
      const { result } = renderHook(() => useSlideOverState());

      act(() => {
        result.current.openSlideOver(200, "edit");
      });

      // Hash-based routing preserves other params
      expect(window.history.pushState).toHaveBeenCalledWith(
        null,
        "",
        "#/test?other=param&edit=200"
      );
    });
  });

  describe("closeSlideOver function", () => {
    it("should close slide-over and clear state", () => {
      window.location.hash = "#/test?view=123";
      const { result } = renderHook(() => useSlideOverState());

      act(() => {
        result.current.closeSlideOver();
      });

      expect(result.current.slideOverId).toBeNull();
      expect(result.current.isOpen).toBe(false);
      // Hash-based routing: closeSlideOver removes view param, leaving just the base path
      expect(window.history.pushState).toHaveBeenCalledWith(null, "", "#/test");
    });

    it("should preserve other query params when closing", () => {
      window.location.hash = "#/test?view=123&filter=active&sort=name";
      const { result } = renderHook(() => useSlideOverState());

      // Update window.location.search to simulate the new URL state
      window.location.hash = "#/test?filter=active&sort=name";

      act(() => {
        result.current.closeSlideOver();
      });

      // Hash-based routing: preserves other params in hash format
      expect(window.history.pushState).toHaveBeenCalledWith(
        null,
        "",
        "#/test?filter=active&sort=name"
      );
    });
  });

  describe("toggleMode function", () => {
    it("should toggle from view to edit mode", () => {
      window.location.hash = "#/test?view=123";
      const { result } = renderHook(() => useSlideOverState());

      act(() => {
        result.current.toggleMode();
      });

      expect(result.current.mode).toBe("edit");
      expect(window.history.replaceState).toHaveBeenCalledWith(null, "", "#/test?edit=123");
    });

    it("should toggle from edit to view mode", () => {
      window.location.hash = "#/test?edit=456";
      const { result } = renderHook(() => useSlideOverState());

      act(() => {
        result.current.toggleMode();
      });

      expect(result.current.mode).toBe("view");
      expect(window.history.replaceState).toHaveBeenCalledWith(null, "", "#/test?view=456");
    });

    it("should not update URL if slideOverId is null", () => {
      const { result } = renderHook(() => useSlideOverState());

      act(() => {
        result.current.toggleMode();
      });

      expect(result.current.mode).toBe("edit");
      expect(window.history.replaceState).not.toHaveBeenCalled();
    });
  });

  describe("setMode function", () => {
    it("should set mode to view", () => {
      const { result } = renderHook(() => useSlideOverState());

      act(() => {
        result.current.setMode("view");
      });

      expect(result.current.mode).toBe("view");
    });

    it("should set mode to edit", () => {
      const { result } = renderHook(() => useSlideOverState());

      act(() => {
        result.current.setMode("edit");
      });

      expect(result.current.mode).toBe("edit");
    });
  });

  describe("Browser back/forward navigation (popstate)", () => {
    it("should open slide-over when navigating to ?view=123", () => {
      const { result } = renderHook(() => useSlideOverState());

      // Simulate browser back/forward navigation
      window.location.hash = "#/test?view=123";
      act(() => {
        window.dispatchEvent(new PopStateEvent("popstate"));
      });

      expect(result.current.slideOverId).toBe(123);
      expect(result.current.isOpen).toBe(true);
      expect(result.current.mode).toBe("view");
    });

    it("should open slide-over in edit mode when navigating to ?edit=456", () => {
      const { result } = renderHook(() => useSlideOverState());

      window.location.hash = "#/test?edit=456";
      act(() => {
        window.dispatchEvent(new PopStateEvent("popstate"));
      });

      expect(result.current.slideOverId).toBe(456);
      expect(result.current.isOpen).toBe(true);
      expect(result.current.mode).toBe("edit");
    });

    it("should close slide-over when navigating to URL without params", () => {
      window.location.hash = "#/test?view=123";
      const { result } = renderHook(() => useSlideOverState());

      // Navigate back to URL without params
      window.location.hash = "";
      act(() => {
        window.dispatchEvent(new PopStateEvent("popstate"));
      });

      expect(result.current.slideOverId).toBeNull();
      expect(result.current.isOpen).toBe(false);
    });

    it("should handle multiple popstate events correctly", () => {
      const { result } = renderHook(() => useSlideOverState());

      // Navigate to view
      window.location.hash = "#/test?view=100";
      act(() => {
        window.dispatchEvent(new PopStateEvent("popstate"));
      });
      expect(result.current.slideOverId).toBe(100);
      expect(result.current.mode).toBe("view");

      // Navigate to edit
      window.location.hash = "#/test?edit=200";
      act(() => {
        window.dispatchEvent(new PopStateEvent("popstate"));
      });
      expect(result.current.slideOverId).toBe(200);
      expect(result.current.mode).toBe("edit");

      // Navigate back to no params
      window.location.hash = "";
      act(() => {
        window.dispatchEvent(new PopStateEvent("popstate"));
      });
      expect(result.current.isOpen).toBe(false);
    });
  });

  describe("ESC key press", () => {
    it("should close slide-over when ESC is pressed while open", () => {
      window.location.hash = "#/test?view=123";
      const { result } = renderHook(() => useSlideOverState());

      act(() => {
        const event = new KeyboardEvent("keydown", { key: "Escape" });
        window.dispatchEvent(event);
      });

      expect(result.current.isOpen).toBe(false);
      expect(result.current.slideOverId).toBeNull();
    });

    it("should not trigger close when ESC is pressed while already closed", () => {
      const { result } = renderHook(() => useSlideOverState());
      const pushStateSpy = vi.spyOn(window.history, "pushState");

      expect(result.current.isOpen).toBe(false);

      act(() => {
        const event = new KeyboardEvent("keydown", { key: "Escape" });
        window.dispatchEvent(event);
      });

      // pushState should not be called if already closed
      expect(pushStateSpy).not.toHaveBeenCalled();
    });

    it("should not close on other key presses", () => {
      window.location.hash = "#/test?view=123";
      const { result } = renderHook(() => useSlideOverState());

      act(() => {
        const event = new KeyboardEvent("keydown", { key: "Enter" });
        window.dispatchEvent(event);
      });

      expect(result.current.isOpen).toBe(true);
      expect(result.current.slideOverId).toBe(123);
    });
  });

  describe("Event listener cleanup", () => {
    it("should remove popstate listener on unmount", () => {
      const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
      const { unmount } = renderHook(() => useSlideOverState());

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith("popstate", expect.any(Function));
    });

    it("should remove keydown listener on unmount", () => {
      const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
      const { unmount } = renderHook(() => useSlideOverState());

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
    });

    it("should clean up both listeners exactly once", () => {
      const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
      const { unmount } = renderHook(() => useSlideOverState());

      unmount();

      const popstateCalls = removeEventListenerSpy.mock.calls.filter(
        (call) => call[0] === "popstate"
      );
      const keydownCalls = removeEventListenerSpy.mock.calls.filter(
        (call) => call[0] === "keydown"
      );

      expect(popstateCalls).toHaveLength(1);
      expect(keydownCalls).toHaveLength(1);
    });
  });

  describe("State transitions", () => {
    it("should transition from closed → open → closed", () => {
      const { result } = renderHook(() => useSlideOverState());

      // Initially closed
      expect(result.current.isOpen).toBe(false);

      // Open
      act(() => {
        result.current.openSlideOver(100);
      });
      expect(result.current.isOpen).toBe(true);
      expect(result.current.slideOverId).toBe(100);

      // Close
      act(() => {
        result.current.closeSlideOver();
      });
      expect(result.current.isOpen).toBe(false);
      expect(result.current.slideOverId).toBeNull();
    });

    it("should transition from view → edit → view", () => {
      const { result } = renderHook(() => useSlideOverState());

      // Open in view mode
      act(() => {
        result.current.openSlideOver(200, "view");
      });
      expect(result.current.mode).toBe("view");

      // Toggle to edit
      act(() => {
        result.current.toggleMode();
      });
      expect(result.current.mode).toBe("edit");

      // Toggle back to view
      act(() => {
        result.current.toggleMode();
      });
      expect(result.current.mode).toBe("view");
    });

    it("should handle open → mode change → close → reopen sequence", () => {
      const { result } = renderHook(() => useSlideOverState());

      // Open in view
      act(() => {
        result.current.openSlideOver(300, "view");
      });
      expect(result.current.mode).toBe("view");
      expect(result.current.slideOverId).toBe(300);

      // Change to edit
      act(() => {
        result.current.toggleMode();
      });
      expect(result.current.mode).toBe("edit");

      // Close
      act(() => {
        result.current.closeSlideOver();
      });
      expect(result.current.isOpen).toBe(false);

      // Reopen with different ID in view mode
      act(() => {
        result.current.openSlideOver(400, "view");
      });
      expect(result.current.isOpen).toBe(true);
      expect(result.current.slideOverId).toBe(400);
      expect(result.current.mode).toBe("view");
    });
  });

  describe("Edge cases", () => {
    it("should handle rapid open/close calls", () => {
      const { result } = renderHook(() => useSlideOverState());

      act(() => {
        result.current.openSlideOver(1);
        result.current.closeSlideOver();
        result.current.openSlideOver(2);
        result.current.closeSlideOver();
        result.current.openSlideOver(3);
      });

      expect(result.current.isOpen).toBe(true);
      expect(result.current.slideOverId).toBe(3);
    });

    it("should handle rapid mode toggles", () => {
      const { result } = renderHook(() => useSlideOverState());

      act(() => {
        result.current.openSlideOver(100);
        result.current.toggleMode();
        result.current.toggleMode();
        result.current.toggleMode();
      });

      expect(result.current.mode).toBe("edit");
    });

    it("should handle opening with same ID multiple times", () => {
      const { result } = renderHook(() => useSlideOverState());

      act(() => {
        result.current.openSlideOver(500);
      });
      expect(result.current.slideOverId).toBe(500);

      act(() => {
        result.current.openSlideOver(500, "edit");
      });
      expect(result.current.slideOverId).toBe(500);
      expect(result.current.mode).toBe("edit");
    });

    it("should handle invalid ID values gracefully", () => {
      const { result } = renderHook(() => useSlideOverState());

      act(() => {
        result.current.openSlideOver(0);
      });

      expect(result.current.slideOverId).toBe(0);
      expect(result.current.isOpen).toBe(true);
    });

    it("should handle malformed URL params gracefully", () => {
      // Hook uses hash-based routing, not search params
      window.location.hash = "#/contacts?view=abc";

      const { result } = renderHook(() => useSlideOverState());

      // Number('abc') = NaN, hook sets slideOverId to the parsed Number which is NaN
      expect(result.current.slideOverId).toBeNaN();
      expect(result.current.isOpen).toBe(true);
    });
  });
});
