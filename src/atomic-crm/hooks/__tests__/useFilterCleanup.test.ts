/**
 * useFilterCleanup Hook Tests
 *
 * Comprehensive unit tests for the filter cleanup hook that prevents
 * stale cached filters from causing 400 API errors.
 *
 * Test Scenarios:
 * 1. Valid filters preserved
 * 2. Invalid/stale filters removed
 * 3. localStorage updated correctly
 * 4. React Admin store updated correctly
 * 5. Corrupted JSON handled gracefully
 * 6. Edge cases (empty params, missing filters, unknown resources)
 */

import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useFilterCleanup } from "../useFilterCleanup";

// Mock ra-core's useStoreContext and useNotify hooks
const mockSetItem = vi.fn();
const mockNotify = vi.fn();
vi.mock("ra-core", () => ({
  useStoreContext: () => ({ setItem: mockSetItem }),
  useNotify: () => mockNotify,
}));

// Mock the filterRegistry validation function
vi.mock("../../providers/supabase/filterRegistry", () => ({
  isValidFilterField: vi.fn(),
}));

// Import the mocked function for manipulation in tests
import { isValidFilterField } from "../../providers/supabase/filterRegistry";

describe("useFilterCleanup", () => {
  // Spy on console methods
  const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  const consoleInfoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
  const _consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  beforeEach(() => {
    // Clear all mocks and localStorage before each test
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("when no stored params exist", () => {
    it("should do nothing and not call setItem", () => {
      // Arrange - localStorage is empty

      // Act
      renderHook(() => useFilterCleanup("contacts"));

      // Assert
      expect(mockSetItem).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleInfoSpy).not.toHaveBeenCalled();
    });
  });

  describe("when stored params have no filters", () => {
    it("should do nothing when params object exists but has no filter property", () => {
      // Arrange
      const params = { sort: { field: "name", order: "ASC" } };
      localStorage.setItem("RaStoreCRM.contacts.listParams", JSON.stringify(params));

      // Act
      renderHook(() => useFilterCleanup("contacts"));

      // Assert
      expect(mockSetItem).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it("should do nothing when filter property is null", () => {
      // Arrange
      const params = { filter: null };
      localStorage.setItem("RaStoreCRM.contacts.listParams", JSON.stringify(params));

      // Act
      renderHook(() => useFilterCleanup("contacts"));

      // Assert
      expect(mockSetItem).not.toHaveBeenCalled();
    });

    it("should do nothing when filter property is empty object", () => {
      // Arrange
      const params = { filter: {} };
      localStorage.setItem("RaStoreCRM.contacts.listParams", JSON.stringify(params));
      vi.mocked(isValidFilterField).mockReturnValue(true);

      // Act
      renderHook(() => useFilterCleanup("contacts"));

      // Assert
      expect(mockSetItem).not.toHaveBeenCalled();
    });
  });

  describe("when all filters are valid", () => {
    it("should preserve all valid filters and not modify storage", () => {
      // Arrange
      const params = {
        filter: {
          q: "search term",
          organization_type: "customer",
          priority: "A",
        },
      };
      localStorage.setItem("RaStoreCRM.organizations.listParams", JSON.stringify(params));

      // Mock all fields as valid
      vi.mocked(isValidFilterField).mockReturnValue(true);

      // Act
      renderHook(() => useFilterCleanup("organizations"));

      // Assert - should NOT update because nothing changed
      expect(mockSetItem).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleInfoSpy).not.toHaveBeenCalled();

      // Verify localStorage unchanged
      const stored = JSON.parse(localStorage.getItem("RaStoreCRM.organizations.listParams")!);
      expect(stored.filter).toEqual(params.filter);
    });
  });

  describe("when invalid/stale filters exist", () => {
    it("should remove invalid filters and keep valid ones", () => {
      // Arrange
      const params = {
        filter: {
          q: "search",
          valid_field: "value",
          stale_old_column: "should be removed",
          another_invalid: "also removed",
        },
        sort: { field: "name", order: "ASC" }, // Non-filter params preserved
      };
      localStorage.setItem("RaStoreCRM.contacts.listParams", JSON.stringify(params));

      // Mock: q, valid_field, and name are valid, others are invalid
      vi.mocked(isValidFilterField).mockImplementation((resource, key) => {
        return key === "q" || key === "valid_field" || key === "name";
      });

      // Act
      renderHook(() => useFilterCleanup("contacts"));

      // Assert - localStorage should be updated
      const stored = JSON.parse(localStorage.getItem("RaStoreCRM.contacts.listParams")!);
      expect(stored.filter).toEqual({
        q: "search",
        valid_field: "value",
      });
      expect(stored.filter).not.toHaveProperty("stale_old_column");
      expect(stored.filter).not.toHaveProperty("another_invalid");

      // Sort params should be preserved
      expect(stored.sort).toEqual({ field: "name", order: "ASC" });
    });

    it("should update both localStorage and React Admin store", () => {
      // Arrange
      const params = {
        filter: { valid: "keep", invalid: "remove" },
      };
      localStorage.setItem("RaStoreCRM.contacts.listParams", JSON.stringify(params));

      vi.mocked(isValidFilterField).mockImplementation((_, key) => key === "valid");

      // Act
      renderHook(() => useFilterCleanup("contacts"));

      // Assert - both storage mechanisms updated
      expect(mockSetItem).toHaveBeenCalledWith(
        "RaStoreCRM.contacts.listParams",
        expect.objectContaining({
          filter: { valid: "keep" },
        })
      );

      // localStorage also updated
      const stored = JSON.parse(localStorage.getItem("RaStoreCRM.contacts.listParams")!);
      expect(stored.filter).toEqual({ valid: "keep" });
    });

    it("should log warning for each removed filter", () => {
      // Arrange
      const params = {
        filter: { valid: "keep", stale1: "remove1", stale2: "remove2" },
      };
      localStorage.setItem("RaStoreCRM.contacts.listParams", JSON.stringify(params));

      vi.mocked(isValidFilterField).mockImplementation((_, key) => key === "valid");

      // Act
      renderHook(() => useFilterCleanup("contacts"));

      // Assert - warnings logged for each invalid filter
      expect(consoleWarnSpy).toHaveBeenCalledTimes(2);
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining("stale1"));
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining("stale2"));
    });

    it("should log info message after cleanup", () => {
      // Arrange
      const params = { filter: { valid: "keep", invalid: "remove" } };
      localStorage.setItem("RaStoreCRM.organizations.listParams", JSON.stringify(params));

      vi.mocked(isValidFilterField).mockImplementation((_, key) => key === "valid");

      // Act
      renderHook(() => useFilterCleanup("organizations"));

      // Assert
      expect(consoleInfoSpy).toHaveBeenCalledWith(expect.stringContaining("Cleaned stale filters"));
      expect(consoleInfoSpy).toHaveBeenCalledWith(expect.stringContaining("organizations"));
    });

    it("should handle removal of all filters", () => {
      // Arrange
      const params = {
        filter: { all_invalid: "value", also_invalid: "value2" },
        pagination: { page: 1, perPage: 25 },
      };
      localStorage.setItem("RaStoreCRM.contacts.listParams", JSON.stringify(params));

      // All filters invalid
      vi.mocked(isValidFilterField).mockReturnValue(false);

      // Act
      renderHook(() => useFilterCleanup("contacts"));

      // Assert - filter should be empty object, other params preserved
      const stored = JSON.parse(localStorage.getItem("RaStoreCRM.contacts.listParams")!);
      expect(stored.filter).toEqual({});
      expect(stored.pagination).toEqual({ page: 1, perPage: 25 });
    });
  });

  describe("when corrupted JSON in localStorage", () => {
    it("should handle corrupted JSON and log warning", () => {
      // Arrange - store invalid JSON
      localStorage.setItem("RaStoreCRM.contacts.listParams", "not valid json {{{");

      // Act
      renderHook(() => useFilterCleanup("contacts"));

      // Assert - should not throw, should log warning (safeJsonParse returns null, line 77 logs)
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("has corrupted localStorage")
      );
      expect(mockSetItem).not.toHaveBeenCalled();
    });

    it("should not crash the application on corrupted data", () => {
      // Arrange
      localStorage.setItem("RaStoreCRM.contacts.listParams", "undefined");

      // Act & Assert - should not throw
      expect(() => {
        renderHook(() => useFilterCleanup("contacts"));
      }).not.toThrow();
    });
  });

  describe("localStorage key format", () => {
    it("should use correct key format: RaStoreCRM.{resource}.listParams", () => {
      // Arrange
      const params = { filter: { valid: "test" } };

      // Test multiple resources
      const resources = ["contacts", "organizations", "opportunities", "products", "tasks"];

      resources.forEach((resource) => {
        localStorage.clear();
        const key = `RaStoreCRM.${resource}.listParams`;
        localStorage.setItem(key, JSON.stringify(params));

        vi.mocked(isValidFilterField).mockReturnValue(true);

        // Act
        renderHook(() => useFilterCleanup(resource));

        // Assert - should read from correct key
        expect(isValidFilterField).toHaveBeenCalledWith(resource, "valid");
      });
    });
  });

  describe("resource parameter changes", () => {
    it("should re-run cleanup when resource changes", () => {
      // Arrange
      const contactsParams = { filter: { contact_field: "value" } };
      const orgsParams = { filter: { org_field: "value" } };

      localStorage.setItem("RaStoreCRM.contacts.listParams", JSON.stringify(contactsParams));
      localStorage.setItem("RaStoreCRM.organizations.listParams", JSON.stringify(orgsParams));

      vi.mocked(isValidFilterField).mockReturnValue(true);

      // Act - render with contacts, then rerender with organizations
      const { rerender } = renderHook(({ resource }) => useFilterCleanup(resource), {
        initialProps: { resource: "contacts" },
      });

      // Verify called with contacts
      expect(isValidFilterField).toHaveBeenCalledWith("contacts", "contact_field");

      vi.clearAllMocks();

      // Rerender with different resource
      rerender({ resource: "organizations" });

      // Verify called with organizations
      expect(isValidFilterField).toHaveBeenCalledWith("organizations", "org_field");
    });
  });

  describe("filter validation integration", () => {
    it("should pass resource and filter key to isValidFilterField", () => {
      // Arrange
      const params = {
        filter: {
          first_name: "John",
          "last_seen@gte": "2024-01-01",
          "deleted_at@is": null,
        },
      };
      localStorage.setItem("RaStoreCRM.contacts.listParams", JSON.stringify(params));

      vi.mocked(isValidFilterField).mockReturnValue(true);

      // Act
      renderHook(() => useFilterCleanup("contacts"));

      // Assert - each filter key validated
      expect(isValidFilterField).toHaveBeenCalledWith("contacts", "first_name");
      expect(isValidFilterField).toHaveBeenCalledWith("contacts", "last_seen@gte");
      expect(isValidFilterField).toHaveBeenCalledWith("contacts", "deleted_at@is");
    });

    it("should correctly handle filter keys with PostgREST operators", () => {
      // Arrange - filters with various PostgREST operators
      const params = {
        filter: {
          "amount@gte": 1000,
          "status@neq": "closed",
          "name@ilike": "%test%",
          "priority@in": ["A", "B"],
        },
      };
      localStorage.setItem("RaStoreCRM.opportunities.listParams", JSON.stringify(params));

      // Mark all as valid
      vi.mocked(isValidFilterField).mockReturnValue(true);

      // Act
      renderHook(() => useFilterCleanup("opportunities"));

      // Assert - all operator-suffixed keys checked
      expect(isValidFilterField).toHaveBeenCalledWith("opportunities", "amount@gte");
      expect(isValidFilterField).toHaveBeenCalledWith("opportunities", "status@neq");
      expect(isValidFilterField).toHaveBeenCalledWith("opportunities", "name@ilike");
      expect(isValidFilterField).toHaveBeenCalledWith("opportunities", "priority@in");
    });
  });

  describe("edge cases", () => {
    it("should handle filters with null values", () => {
      // Arrange
      const params = {
        filter: { valid_field: null, "deleted_at@is": null },
      };
      localStorage.setItem("RaStoreCRM.contacts.listParams", JSON.stringify(params));

      vi.mocked(isValidFilterField).mockReturnValue(true);

      // Act
      renderHook(() => useFilterCleanup("contacts"));

      // Assert - null values should be preserved if filter is valid
      expect(mockSetItem).not.toHaveBeenCalled(); // No changes needed
    });

    it("should handle filters with array values", () => {
      // Arrange
      const params = {
        filter: {
          organization_type: ["customer", "prospect"],
          tags: [1, 2, 3],
        },
      };
      localStorage.setItem("RaStoreCRM.organizations.listParams", JSON.stringify(params));

      vi.mocked(isValidFilterField).mockReturnValue(true);

      // Act
      renderHook(() => useFilterCleanup("organizations"));

      // Assert - array values preserved
      const stored = JSON.parse(localStorage.getItem("RaStoreCRM.organizations.listParams")!);
      expect(stored.filter.organization_type).toEqual(["customer", "prospect"]);
      expect(stored.filter.tags).toEqual([1, 2, 3]);
    });

    it("should handle filters with object values", () => {
      // Arrange
      const params = {
        filter: {
          complex: { nested: "value" },
        },
      };
      localStorage.setItem("RaStoreCRM.contacts.listParams", JSON.stringify(params));

      vi.mocked(isValidFilterField).mockReturnValue(true);

      // Act
      renderHook(() => useFilterCleanup("contacts"));

      // Assert - object values preserved
      const stored = JSON.parse(localStorage.getItem("RaStoreCRM.contacts.listParams")!);
      expect(stored.filter.complex).toEqual({ nested: "value" });
    });

    it("should not process inherited properties on filter object", () => {
      // This tests the hasOwnProperty check
      // Arrange
      const params = {
        filter: Object.create({ inherited: "should-not-process" }),
      };
      params.filter.ownProperty = "should-process";
      localStorage.setItem("RaStoreCRM.contacts.listParams", JSON.stringify(params));

      vi.mocked(isValidFilterField).mockReturnValue(true);

      // Act
      renderHook(() => useFilterCleanup("contacts"));

      // Assert - only own properties checked
      expect(isValidFilterField).toHaveBeenCalledWith("contacts", "ownProperty");
      expect(isValidFilterField).not.toHaveBeenCalledWith("contacts", "inherited");
    });
  });
});
