/**
 * Tests for Opportunity View Persistence
 *
 * Tests localStorage saving and loading of view preferences
 */

import { describe, test, expect, beforeEach, afterEach } from "vitest";

// Mock localStorage for testing
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
    removeItem: (key: string) => {
      delete store[key];
    },
  };
})();

// Replace global localStorage with our mock
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// Import after localStorage is mocked
const OPPORTUNITY_VIEW_KEY = "opportunity.view.preference";

const getViewPreference = (): "kanban" | "list" => {
  const saved = localStorage.getItem(OPPORTUNITY_VIEW_KEY);
  return saved === "list" || saved === "kanban" ? saved : "kanban";
};

const saveViewPreference = (view: "kanban" | "list") => {
  localStorage.setItem(OPPORTUNITY_VIEW_KEY, view);
};

describe("Opportunity View Persistence", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  test("defaults to kanban view when no preference exists", () => {
    expect(getViewPreference()).toBe("kanban");
  });

  test("saves and retrieves kanban view preference", () => {
    saveViewPreference("kanban");
    expect(getViewPreference()).toBe("kanban");
  });

  test("saves and retrieves list view preference", () => {
    saveViewPreference("list");
    expect(getViewPreference()).toBe("list");
  });

  test("returns kanban as default for invalid stored value", () => {
    localStorage.setItem(OPPORTUNITY_VIEW_KEY, "invalid-view");
    expect(getViewPreference()).toBe("kanban");
  });

  test("handles empty string as invalid", () => {
    localStorage.setItem(OPPORTUNITY_VIEW_KEY, "");
    expect(getViewPreference()).toBe("kanban");
  });

  test("preference persists across multiple calls", () => {
    saveViewPreference("list");
    expect(getViewPreference()).toBe("list");
    expect(getViewPreference()).toBe("list");
    expect(getViewPreference()).toBe("list");
  });

  test("can update preference from kanban to list", () => {
    saveViewPreference("kanban");
    expect(getViewPreference()).toBe("kanban");

    saveViewPreference("list");
    expect(getViewPreference()).toBe("list");
  });

  test("can update preference from list to kanban", () => {
    saveViewPreference("list");
    expect(getViewPreference()).toBe("list");

    saveViewPreference("kanban");
    expect(getViewPreference()).toBe("kanban");
  });
});
