/**
 * Unit tests for organization column alias mapping
 */

import { describe, it, expect } from "vitest";
import {
  normalizeHeader,
  findCanonicalField,
  mapHeadersToFields,
  getAvailableFields,
  getAvailableFieldsWithLabels,
} from "./organizationColumnAliases";

describe("normalizeHeader", () => {
  it("should convert to lowercase", () => {
    expect(normalizeHeader("ORGANIZATIONS")).toBe("organizations");
    expect(normalizeHeader("Company Name")).toBe("company name");
  });

  it("should trim whitespace", () => {
    expect(normalizeHeader("  Company  ")).toBe("company");
    expect(normalizeHeader("\tOrganization\n")).toBe("organization");
  });

  it("should remove special characters and parentheses with their contents", () => {
    expect(normalizeHeader("Company@Name!")).toBe("company name");
    expect(normalizeHeader("Priority (A-D)")).toBe("priority"); // Parentheses and contents removed
  });

  it("should collapse multiple spaces", () => {
    expect(normalizeHeader("Company    Name")).toBe("company name");
  });

  it("should handle empty strings", () => {
    expect(normalizeHeader("")).toBe("");
  });

  it("should handle null/undefined gracefully", () => {
    expect(normalizeHeader(null as unknown as string)).toBe("");
    expect(normalizeHeader(undefined as unknown as string)).toBe("");
  });
});

describe("findCanonicalField", () => {
  it("should find canonical field for exact match", () => {
    expect(findCanonicalField("name")).toBe("name");
    expect(findCanonicalField("priority")).toBe("priority");
    expect(findCanonicalField("phone")).toBe("phone");
  });

  it("should find canonical field for case-insensitive match", () => {
    expect(findCanonicalField("ORGANIZATIONS")).toBe("name");
    expect(findCanonicalField("Company Name")).toBe("name");
  });

  it("should find canonical field for variations", () => {
    expect(findCanonicalField("organization")).toBe("name");
    expect(findCanonicalField("company")).toBe("name");
    expect(findCanonicalField("business")).toBe("name");
  });

  it("should handle special CSV headers", () => {
    expect(findCanonicalField("PRIORITY-FOCUS (A-D)")).toBe("priority");
    expect(findCanonicalField("PRIORITY-FOCUS (A-D) A-HIGHEST")).toBe("priority");
  });

  it("should return null for unrecognized headers", () => {
    expect(findCanonicalField("unknown_header")).toBe(null);
    expect(findCanonicalField("random_field")).toBe(null);
  });

  it("should handle empty strings", () => {
    expect(findCanonicalField("")).toBe(null);
  });

  it("should handle null/undefined gracefully", () => {
    expect(findCanonicalField(null as unknown as string)).toBe(null);
    expect(findCanonicalField(undefined as unknown as string)).toBe(null);
  });
});

describe("mapHeadersToFields", () => {
  it("should map recognized headers to canonical field names", () => {
    const headers = ["Organizations", "PHONE", "CITY"];
    const mappings = mapHeadersToFields(headers);

    expect(mappings["Organizations"]).toBe("name");
    expect(mappings["PHONE"]).toBe("phone");
    expect(mappings["CITY"]).toBe("city");
  });

  it("should map unrecognized headers to null", () => {
    const headers = ["Organizations", "Unknown Field"];
    const mappings = mapHeadersToFields(headers);

    expect(mappings["Organizations"]).toBe("name");
    expect(mappings["Unknown Field"]).toBe(null);
  });

  it("should handle empty array", () => {
    expect(mapHeadersToFields([])).toEqual({});
  });

  it("should skip empty/null headers", () => {
    const headers = ["Organizations", "", null as unknown as string, "PHONE"];
    const mappings = mapHeadersToFields(headers);

    expect(mappings["Organizations"]).toBe("name");
    expect(mappings["PHONE"]).toBe("phone");
    expect(mappings[""]).toBeUndefined();
  });

  it("should handle non-array input gracefully", () => {
    expect(mapHeadersToFields(null as unknown as string[])).toEqual({});
    expect(mapHeadersToFields(undefined as unknown as string[])).toEqual({});
  });
});

describe("getAvailableFields", () => {
  it("should return all available field names", () => {
    const fields = getAvailableFields();

    expect(fields).toContain("name");
    expect(fields).toContain("priority");
    expect(fields).toContain("phone");
    expect(fields).toContain("address");
    expect(fields).toContain("city");
    expect(fields).toContain("state");
    expect(fields).toContain("postal_code");
    expect(fields).toContain("linkedin_url");
  });

  it("should return sorted array", () => {
    const fields = getAvailableFields();
    const sorted = [...fields].sort();

    expect(fields).toEqual(sorted);
  });

  it("should return unique field names", () => {
    const fields = getAvailableFields();
    const unique = [...new Set(fields)];

    expect(fields.length).toBe(unique.length);
  });
});

describe("getAvailableFieldsWithLabels", () => {
  it("should return array of {value, label} objects", () => {
    const fieldsWithLabels = getAvailableFieldsWithLabels();

    expect(fieldsWithLabels.length).toBeGreaterThan(0);
    expect(fieldsWithLabels[0]).toHaveProperty("value");
    expect(fieldsWithLabels[0]).toHaveProperty("label");
  });

  it("should convert underscores to spaces in labels", () => {
    const fieldsWithLabels = getAvailableFieldsWithLabels();

    const postalCodeField = fieldsWithLabels.find((f) => f.value === "postal_code");
    expect(postalCodeField?.label).toBe("Postal Code");
  });

  it("should capitalize labels", () => {
    const fieldsWithLabels = getAvailableFieldsWithLabels();

    const nameField = fieldsWithLabels.find((f) => f.value === "name");
    expect(nameField?.label).toBe("Name");
  });

  it("should include all available fields", () => {
    const fieldsWithLabels = getAvailableFieldsWithLabels();
    const availableFields = getAvailableFields();

    const values = fieldsWithLabels.map((f) => f.value);
    availableFields.forEach((field) => {
      expect(values).toContain(field);
    });
  });
});

describe("Column Alias Integration", () => {
  it("should handle real CSV headers from organizations.csv", () => {
    const headers = [
      "PRIORITY-FOCUS (A-D) A-highest",
      "Organizations",
      "SEGMENT",
      "DISTRIBUTOR",
      "PHONE",
      "STREET ADDRESS",
      "CITY",
      "STATE",
      "Zip Code",
      "NOTES",
      "LINKEDIN",
    ];

    const mappings = mapHeadersToFields(headers);

    expect(mappings["PRIORITY-FOCUS (A-D) A-highest"]).toBe("priority");
    expect(mappings["Organizations"]).toBe("name");
    expect(mappings["SEGMENT"]).toBe("segment_id");
    expect(mappings["PHONE"]).toBe("phone");
    expect(mappings["STREET ADDRESS"]).toBe("address");
    expect(mappings["CITY"]).toBe("city");
    expect(mappings["STATE"]).toBe("state");
    expect(mappings["Zip Code"]).toBe("postal_code");
    expect(mappings["NOTES"]).toBe("description");
    expect(mappings["LINKEDIN"]).toBe("linkedin_url");
  });
});
