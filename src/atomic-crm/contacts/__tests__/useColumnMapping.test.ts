/**
 * Unit tests for useColumnMapping hook
 *
 * Tests cover:
 * 1. Auto-mapping functionality - headers → field mappings via columnAliases
 * 2. User overrides - manual field assignments that override auto-detection
 * 3. Reset functionality - clearing state when dialog closes or new file selected
 * 4. Edge cases - empty headers, clearing overrides, header changes
 *
 * @see useColumnMapping.ts
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useColumnMapping } from "../useColumnMapping";
import type { ContactImportSchema } from "../contactImport.types";

// Mock the column alias utilities
vi.mock("../columnAliases", () => ({
  mapHeadersToFields: vi.fn((headers: string[]) => {
    // Simulate auto-detection: known headers map to fields, unknown return null
    const autoMappings: Record<string, string | null> = {};
    headers.forEach((header) => {
      const lowerHeader = header.toLowerCase();
      if (lowerHeader === "first name" || lowerHeader === "first_name") {
        autoMappings[header] = "first_name";
      } else if (lowerHeader === "last name" || lowerHeader === "last_name") {
        autoMappings[header] = "last_name";
      } else if (lowerHeader === "email" || lowerHeader === "email address") {
        autoMappings[header] = "email_work";
      } else if (lowerHeader === "company" || lowerHeader === "organization") {
        autoMappings[header] = "organization_name";
      } else if (lowerHeader === "phone") {
        autoMappings[header] = "phone_work";
      } else {
        autoMappings[header] = null; // Unknown header
      }
    });
    return autoMappings;
  }),
}));

// Type for dynamic property assignment in mock
type ContactRecord = Record<string, unknown>;

// Mock the CSV processor
vi.mock("../csvProcessor", () => ({
  processCsvDataWithMappings: vi.fn(
    (
      headers: string[],
      rawData: unknown[][],
      mappings: Record<string, string | null>
    ): ContactImportSchema[] => {
      // Simple mock: create contacts from raw data using mappings
      return rawData.map((row) => {
        const contact: ContactRecord = {};
        headers.forEach((header, index) => {
          const field = mappings[header];
          if (field && row[index] !== undefined) {
            contact[field] = row[index];
          }
        });
        return contact as ContactImportSchema;
      });
    }
  ),
}));

describe("useColumnMapping", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================
  // INITIALIZATION TESTS
  // ============================================================

  describe("initialization", () => {
    it("starts with empty state", () => {
      const { result } = renderHook(() => useColumnMapping());

      expect(result.current.mappings).toEqual({});
      expect(result.current.overrides.size).toBe(0);
      expect(result.current.contacts).toEqual([]);
      expect(result.current.headers).toEqual([]);
      expect(result.current.hasData).toBe(false);
    });

    it("exposes all required API methods", () => {
      const { result } = renderHook(() => useColumnMapping());

      expect(typeof result.current.setOverride).toBe("function");
      expect(typeof result.current.setRawData).toBe("function");
      expect(typeof result.current.reset).toBe("function");
    });
  });

  // ============================================================
  // AUTO-MAPPING TESTS
  // ============================================================

  describe("auto-mapping functionality", () => {
    it("auto-detects known column headers", () => {
      const { result } = renderHook(() => useColumnMapping());

      const headers = ["First Name", "Last Name", "Email", "Company"];
      const rawData = [
        ["John", "Doe", "john@example.com", "Acme Inc"],
        ["Jane", "Smith", "jane@example.com", "Tech Corp"],
      ];

      act(() => {
        result.current.setRawData(headers, rawData);
      });

      expect(result.current.hasData).toBe(true);
      expect(result.current.headers).toEqual(headers);

      // Verify auto-detected mappings
      expect(result.current.mappings["First Name"]).toBe("first_name");
      expect(result.current.mappings["Last Name"]).toBe("last_name");
      expect(result.current.mappings["Email"]).toBe("email_work");
      expect(result.current.mappings["Company"]).toBe("organization_name");
    });

    it("returns null for unknown headers", () => {
      const { result } = renderHook(() => useColumnMapping());

      const headers = ["First Name", "Unknown Column", "Random Field"];
      const rawData = [["John", "value1", "value2"]];

      act(() => {
        result.current.setRawData(headers, rawData);
      });

      expect(result.current.mappings["First Name"]).toBe("first_name");
      expect(result.current.mappings["Unknown Column"]).toBeNull();
      expect(result.current.mappings["Random Field"]).toBeNull();
    });

    it("processes contacts using auto-detected mappings", () => {
      const { result } = renderHook(() => useColumnMapping());

      const headers = ["First Name", "Last Name", "Email"];
      const rawData = [
        ["John", "Doe", "john@example.com"],
        ["Jane", "Smith", "jane@example.com"],
      ];

      act(() => {
        result.current.setRawData(headers, rawData);
      });

      expect(result.current.contacts).toHaveLength(2);
      expect(result.current.contacts[0]).toMatchObject({
        first_name: "John",
        last_name: "Doe",
        email_work: "john@example.com",
      });
      expect(result.current.contacts[1]).toMatchObject({
        first_name: "Jane",
        last_name: "Smith",
        email_work: "jane@example.com",
      });
    });
  });

  // ============================================================
  // USER OVERRIDE TESTS
  // ============================================================

  describe("user overrides", () => {
    it("allows overriding auto-detected mapping", () => {
      const { result } = renderHook(() => useColumnMapping());

      const headers = ["Email"];
      const rawData = [["john@example.com"]];

      act(() => {
        result.current.setRawData(headers, rawData);
      });

      // Email auto-detects to email_work
      expect(result.current.mappings["Email"]).toBe("email_work");

      // Override to email_home
      act(() => {
        result.current.setOverride("Email", "email_home");
      });

      expect(result.current.mappings["Email"]).toBe("email_home");
      expect(result.current.overrides.get("Email")).toBe("email_home");
    });

    it("allows mapping unknown columns to fields", () => {
      const { result } = renderHook(() => useColumnMapping());

      const headers = ["Custom Column"];
      const rawData = [["some value"]];

      act(() => {
        result.current.setRawData(headers, rawData);
      });

      // Unknown column has no auto-mapping
      expect(result.current.mappings["Custom Column"]).toBeNull();

      // User maps it to notes
      act(() => {
        result.current.setOverride("Custom Column", "notes");
      });

      expect(result.current.mappings["Custom Column"]).toBe("notes");
    });

    it("clears override when set to null", () => {
      const { result } = renderHook(() => useColumnMapping());

      const headers = ["Email"];
      const rawData = [["john@example.com"]];

      act(() => {
        result.current.setRawData(headers, rawData);
      });

      // Add override
      act(() => {
        result.current.setOverride("Email", "email_home");
      });

      expect(result.current.mappings["Email"]).toBe("email_home");
      expect(result.current.overrides.has("Email")).toBe(true);

      // Clear override by setting to null
      act(() => {
        result.current.setOverride("Email", null);
      });

      // Should revert to auto-detection
      expect(result.current.mappings["Email"]).toBe("email_work");
      expect(result.current.overrides.has("Email")).toBe(false);
    });

    it("clears override when set to empty string", () => {
      const { result } = renderHook(() => useColumnMapping());

      const headers = ["Email"];
      const rawData = [["john@example.com"]];

      act(() => {
        result.current.setRawData(headers, rawData);
      });

      act(() => {
        result.current.setOverride("Email", "email_home");
      });

      // Clear with empty string
      act(() => {
        result.current.setOverride("Email", "");
      });

      expect(result.current.mappings["Email"]).toBe("email_work");
      expect(result.current.overrides.has("Email")).toBe(false);
    });

    it("reprocesses contacts when overrides change", () => {
      const { result } = renderHook(() => useColumnMapping());

      const headers = ["Name Field"];
      const rawData = [["John Doe"]];

      act(() => {
        result.current.setRawData(headers, rawData);
      });

      // Initially unknown
      expect(result.current.contacts[0]).not.toHaveProperty("first_name");

      // Map to first_name
      act(() => {
        result.current.setOverride("Name Field", "first_name");
      });

      // Now contacts should have first_name
      expect(result.current.contacts[0]).toHaveProperty("first_name", "John Doe");
    });
  });

  // ============================================================
  // RESET TESTS
  // ============================================================

  describe("reset functionality", () => {
    it("clears all state on reset", () => {
      const { result } = renderHook(() => useColumnMapping());

      // Set up data
      const headers = ["First Name", "Email"];
      const rawData = [["John", "john@example.com"]];

      act(() => {
        result.current.setRawData(headers, rawData);
      });

      act(() => {
        result.current.setOverride("Email", "email_home");
      });

      // Verify data is set
      expect(result.current.hasData).toBe(true);
      expect(result.current.overrides.size).toBe(1);

      // Reset
      act(() => {
        result.current.reset();
      });

      // Verify all state cleared
      expect(result.current.hasData).toBe(false);
      expect(result.current.headers).toEqual([]);
      expect(result.current.mappings).toEqual({});
      expect(result.current.contacts).toEqual([]);
      expect(result.current.overrides.size).toBe(0);
    });

    it("resets overrides when headers change (new file)", async () => {
      const { result, rerender } = renderHook(() => useColumnMapping());

      // First file
      const headers1 = ["Email"];
      const rawData1 = [["john@example.com"]];

      act(() => {
        result.current.setRawData(headers1, rawData1);
      });

      act(() => {
        result.current.setOverride("Email", "email_home");
      });

      expect(result.current.overrides.size).toBe(1);

      // Second file with different headers - simulates new file selection
      const headers2 = ["First Name", "Last Name"];
      const rawData2 = [["Jane", "Doe"]];

      act(() => {
        result.current.setRawData(headers2, rawData2);
      });

      // Force re-render to trigger useEffect
      rerender();

      // Overrides should be cleared because headers changed
      expect(result.current.overrides.size).toBe(0);
      expect(result.current.headers).toEqual(headers2);
    });
  });

  // ============================================================
  // EDGE CASES
  // ============================================================

  describe("edge cases", () => {
    it("handles empty headers array", () => {
      const { result } = renderHook(() => useColumnMapping());

      act(() => {
        result.current.setRawData([], []);
      });

      expect(result.current.hasData).toBe(false);
      expect(result.current.mappings).toEqual({});
      expect(result.current.contacts).toEqual([]);
    });

    it("handles headers with empty raw data", () => {
      const { result } = renderHook(() => useColumnMapping());

      const headers = ["First Name", "Last Name"];

      act(() => {
        result.current.setRawData(headers, []);
      });

      // hasData is based on headers, not raw data
      expect(result.current.hasData).toBe(true);
      expect(result.current.headers).toEqual(headers);
      expect(result.current.contacts).toEqual([]);
    });

    it("handles multiple overrides on same session", () => {
      const { result } = renderHook(() => useColumnMapping());

      const headers = ["Col1", "Col2", "Col3"];
      const rawData = [["a", "b", "c"]];

      act(() => {
        result.current.setRawData(headers, rawData);
      });

      // Set multiple overrides
      act(() => {
        result.current.setOverride("Col1", "first_name");
        result.current.setOverride("Col2", "last_name");
        result.current.setOverride("Col3", "email_work");
      });

      expect(result.current.overrides.size).toBe(3);
      expect(result.current.mappings["Col1"]).toBe("first_name");
      expect(result.current.mappings["Col2"]).toBe("last_name");
      expect(result.current.mappings["Col3"]).toBe("email_work");
    });

    it("overrides expose as ReadonlyMap (prevents external mutation)", () => {
      const { result } = renderHook(() => useColumnMapping());

      // The overrides property should be a Map
      expect(result.current.overrides).toBeInstanceOf(Map);

      // TypeScript enforces ReadonlyMap at compile time,
      // but at runtime it's still a Map - we just don't expose setters
      // This test documents the expected behavior
    });

    it("handles setting same override value multiple times", () => {
      const { result } = renderHook(() => useColumnMapping());

      const headers = ["Email"];
      const rawData = [["test@example.com"]];

      act(() => {
        result.current.setRawData(headers, rawData);
      });

      // Set same override multiple times
      act(() => {
        result.current.setOverride("Email", "email_home");
      });

      act(() => {
        result.current.setOverride("Email", "email_home");
      });

      // Should still work correctly
      expect(result.current.overrides.size).toBe(1);
      expect(result.current.mappings["Email"]).toBe("email_home");
    });

    it("handles special characters in headers", () => {
      const { result } = renderHook(() => useColumnMapping());

      const headers = ["First Name (Required)", "Email/Work", "Phone #"];
      const rawData = [["John", "john@test.com", "555-1234"]];

      act(() => {
        result.current.setRawData(headers, rawData);
      });

      // Headers should be preserved exactly
      expect(result.current.headers).toEqual(headers);

      // Can still set overrides
      act(() => {
        result.current.setOverride("First Name (Required)", "first_name");
      });

      expect(result.current.mappings["First Name (Required)"]).toBe("first_name");
    });
  });

  // ============================================================
  // DERIVED STATE CONSISTENCY
  // ============================================================

  describe("derived state consistency", () => {
    it("mappings always includes all headers", () => {
      const { result } = renderHook(() => useColumnMapping());

      const headers = ["Known", "Unknown1", "Unknown2"];
      const rawData = [["v1", "v2", "v3"]];

      act(() => {
        result.current.setRawData(headers, rawData);
      });

      // All headers should have an entry in mappings (even if null)
      headers.forEach((header) => {
        expect(header in result.current.mappings).toBe(true);
      });
    });

    it("contacts update when raw data changes", () => {
      const { result } = renderHook(() => useColumnMapping());

      const headers = ["First Name"];

      act(() => {
        result.current.setRawData(headers, [["John"]]);
      });

      expect(result.current.contacts[0]).toHaveProperty("first_name", "John");

      // Update with new data
      act(() => {
        result.current.setRawData(headers, [["Jane"], ["Bob"]]);
      });

      expect(result.current.contacts).toHaveLength(2);
      expect(result.current.contacts[0]).toHaveProperty("first_name", "Jane");
      expect(result.current.contacts[1]).toHaveProperty("first_name", "Bob");
    });
  });
});
