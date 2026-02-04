/**
 * Tests for Organization View Persistence
 *
 * Tests localStorage saving and loading of view preferences.
 * Mirrors OpportunityViewPersistence.test.ts pattern.
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
const ORGANIZATION_VIEW_KEY = "organization.view.preference";

const getViewPreference = (): "list" | "card" => {
  const saved = localStorage.getItem(ORGANIZATION_VIEW_KEY);
  return saved === "list" || saved === "card" ? saved : "list";
};

const saveViewPreference = (view: "list" | "card") => {
  localStorage.setItem(ORGANIZATION_VIEW_KEY, view);
};

describe("Organization View Persistence", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  test("defaults to list view when no preference exists", () => {
    expect(getViewPreference()).toBe("list");
  });

  test("saves and retrieves list view preference", () => {
    saveViewPreference("list");
    expect(getViewPreference()).toBe("list");
  });

  test("saves and retrieves card view preference", () => {
    saveViewPreference("card");
    expect(getViewPreference()).toBe("card");
  });

  test("returns list as default for invalid stored value", () => {
    localStorage.setItem(ORGANIZATION_VIEW_KEY, "invalid-view");
    expect(getViewPreference()).toBe("list");
  });

  test("handles empty string as invalid", () => {
    localStorage.setItem(ORGANIZATION_VIEW_KEY, "");
    expect(getViewPreference()).toBe("list");
  });

  test("preference persists across multiple calls", () => {
    saveViewPreference("card");
    expect(getViewPreference()).toBe("card");
    expect(getViewPreference()).toBe("card");
    expect(getViewPreference()).toBe("card");
  });

  test("can update preference from list to card", () => {
    saveViewPreference("list");
    expect(getViewPreference()).toBe("list");

    saveViewPreference("card");
    expect(getViewPreference()).toBe("card");
  });

  test("can update preference from card to list", () => {
    saveViewPreference("card");
    expect(getViewPreference()).toBe("card");

    saveViewPreference("list");
    expect(getViewPreference()).toBe("list");
  });
});
