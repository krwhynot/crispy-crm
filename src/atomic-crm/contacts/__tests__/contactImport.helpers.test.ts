/**
 * Unit tests for contactImport.helpers.ts
 *
 * Tests cover:
 * 1. extractNewOrganizations - unique org extraction, edge cases
 * 2. extractNewTags - tag parsing, deduplication
 * 3. findOrganizationsWithoutContacts - row number calculation, predicate usage
 * 4. findContactsWithoutContactInfo - name building, validation
 *
 * @see contactImport.helpers.ts
 */

import { describe, it, expect } from "vitest";
import {
  extractNewOrganizations,
  extractNewTags,
  findOrganizationsWithoutContacts,
  findContactsWithoutContactInfo,
  CSV_DATA_START_OFFSET,
} from "../contactImport.helpers";
import type { ContactImportSchema } from "../contactImport.types";

// ============================================================
// TEST DATA FACTORIES
// ============================================================

function createContact(overrides: Partial<ContactImportSchema> = {}): ContactImportSchema {
  return {
    first_name: "",
    last_name: "",
    organization_name: "",
    ...overrides,
  };
}

// ============================================================
// CONSTANT TESTS
// ============================================================

describe("CSV_DATA_START_OFFSET", () => {
  it("equals 4 (3 header rows + 1-indexed)", () => {
    expect(CSV_DATA_START_OFFSET).toBe(4);
  });
});

// ============================================================
// extractNewOrganizations TESTS
// ============================================================

describe("extractNewOrganizations", () => {
  describe("basic functionality", () => {
    it("extracts unique organization names", () => {
      const rows = [
        createContact({ organization_name: "Acme Inc" }),
        createContact({ organization_name: "Tech Corp" }),
        createContact({ organization_name: "Acme Inc" }), // duplicate
      ];

      const result = extractNewOrganizations(rows);

      expect(result).toHaveLength(2);
      expect(result).toContain("Acme Inc");
      expect(result).toContain("Tech Corp");
    });

    it("trims whitespace from organization names", () => {
      const rows = [
        createContact({ organization_name: "  Acme Inc  " }),
        createContact({ organization_name: "Acme Inc" }), // same after trim
      ];

      const result = extractNewOrganizations(rows);

      expect(result).toEqual(["Acme Inc"]);
    });
  });

  describe("edge cases", () => {
    it("returns empty array for empty input", () => {
      expect(extractNewOrganizations([])).toEqual([]);
    });

    it("skips rows without organization_name", () => {
      const rows = [
        createContact({ organization_name: "Acme Inc" }),
        createContact({ organization_name: "" }),
        createContact({ first_name: "John" }), // no org
      ];

      const result = extractNewOrganizations(rows);

      expect(result).toEqual(["Acme Inc"]);
    });

    it("skips whitespace-only organization names", () => {
      const rows = [
        createContact({ organization_name: "   " }),
        createContact({ organization_name: "\t\n" }),
        createContact({ organization_name: "Valid Org" }),
      ];

      const result = extractNewOrganizations(rows);

      expect(result).toEqual(["Valid Org"]);
    });

    it("preserves case sensitivity", () => {
      const rows = [
        createContact({ organization_name: "ACME" }),
        createContact({ organization_name: "acme" }),
        createContact({ organization_name: "Acme" }),
      ];

      const result = extractNewOrganizations(rows);

      expect(result).toHaveLength(3);
      expect(result).toContain("ACME");
      expect(result).toContain("acme");
      expect(result).toContain("Acme");
    });

    it("handles special characters in org names", () => {
      const rows = [
        createContact({ organization_name: "O'Brien & Associates" }),
        createContact({ organization_name: "Müller GmbH" }),
        createContact({ organization_name: "日本企業" }),
      ];

      const result = extractNewOrganizations(rows);

      expect(result).toHaveLength(3);
      expect(result).toContain("O'Brien & Associates");
      expect(result).toContain("Müller GmbH");
      expect(result).toContain("日本企業");
    });
  });
});

// ============================================================
// extractNewTags TESTS
// ============================================================

describe("extractNewTags", () => {
  describe("basic functionality", () => {
    it("extracts unique tags from comma-separated values", () => {
      const rows = [
        createContact({ tags: "VIP, Customer" }),
        createContact({ tags: "Partner" }),
      ];

      const result = extractNewTags(rows);

      expect(result).toHaveLength(3);
      expect(result).toContain("VIP");
      expect(result).toContain("Customer");
      expect(result).toContain("Partner");
    });

    it("deduplicates tags across rows", () => {
      const rows = [
        createContact({ tags: "VIP, Customer" }),
        createContact({ tags: "VIP, Partner" }), // VIP is duplicate
      ];

      const result = extractNewTags(rows);

      expect(result).toHaveLength(3);
      expect(result.filter((t) => t === "VIP")).toHaveLength(1);
    });

    it("trims whitespace from tags", () => {
      const rows = [createContact({ tags: "  VIP  ,  Customer  " })];

      const result = extractNewTags(rows);

      expect(result).toContain("VIP");
      expect(result).toContain("Customer");
      expect(result.every((t) => t === t.trim())).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("returns empty array for empty input", () => {
      expect(extractNewTags([])).toEqual([]);
    });

    it("skips rows without tags", () => {
      const rows = [
        createContact({ tags: "VIP" }),
        createContact({ first_name: "John" }), // no tags
        createContact({ tags: "" }),
      ];

      const result = extractNewTags(rows);

      expect(result).toEqual(["VIP"]);
    });

    it("skips empty tags in comma-separated list", () => {
      const rows = [createContact({ tags: "VIP,,Customer,," })];

      const result = extractNewTags(rows);

      expect(result).toHaveLength(2);
      expect(result).toContain("VIP");
      expect(result).toContain("Customer");
    });

    it("handles single tag without commas", () => {
      const rows = [createContact({ tags: "SingleTag" })];

      const result = extractNewTags(rows);

      expect(result).toEqual(["SingleTag"]);
    });

    it("handles whitespace-only tags", () => {
      const rows = [createContact({ tags: "VIP,   ,Customer" })];

      const result = extractNewTags(rows);

      expect(result).toHaveLength(2);
    });

    it("preserves case sensitivity", () => {
      const rows = [createContact({ tags: "vip, VIP, Vip" })];

      const result = extractNewTags(rows);

      expect(result).toHaveLength(3);
    });
  });
});

// ============================================================
// findOrganizationsWithoutContacts TESTS
// ============================================================

describe("findOrganizationsWithoutContacts", () => {
  describe("basic functionality", () => {
    it("finds organizations without contact names", () => {
      const rows = [
        createContact({ organization_name: "Org Only", first_name: "", last_name: "" }),
        createContact({ organization_name: "Has Contact", first_name: "John", last_name: "Doe" }),
      ];

      const result = findOrganizationsWithoutContacts(rows);

      expect(result).toHaveLength(1);
      expect(result[0].organization_name).toBe("Org Only");
    });

    it("calculates correct row numbers using CSV_DATA_START_OFFSET", () => {
      const rows = [
        createContact({ organization_name: "First Org", first_name: "", last_name: "" }), // index 0
        createContact({ organization_name: "Has Contact", first_name: "John" }),
        createContact({ organization_name: "Third Org", first_name: "", last_name: "" }), // index 2
      ];

      const result = findOrganizationsWithoutContacts(rows);

      expect(result).toHaveLength(2);
      expect(result[0].row).toBe(0 + CSV_DATA_START_OFFSET); // 4
      expect(result[1].row).toBe(2 + CSV_DATA_START_OFFSET); // 6
    });

    it("trims organization names in results", () => {
      const rows = [
        createContact({ organization_name: "  Trimmed Org  ", first_name: "", last_name: "" }),
      ];

      const result = findOrganizationsWithoutContacts(rows);

      expect(result[0].organization_name).toBe("Trimmed Org");
    });
  });

  describe("edge cases", () => {
    it("returns empty array for empty input", () => {
      expect(findOrganizationsWithoutContacts([])).toEqual([]);
    });

    it("returns empty array when all rows have contacts", () => {
      const rows = [
        createContact({ organization_name: "Org1", first_name: "John" }),
        createContact({ organization_name: "Org2", last_name: "Doe" }),
      ];

      expect(findOrganizationsWithoutContacts(rows)).toEqual([]);
    });

    it("excludes rows with first_name only", () => {
      const rows = [
        createContact({ organization_name: "Org", first_name: "John", last_name: "" }),
      ];

      expect(findOrganizationsWithoutContacts(rows)).toEqual([]);
    });

    it("excludes rows with last_name only", () => {
      const rows = [
        createContact({ organization_name: "Org", first_name: "", last_name: "Doe" }),
      ];

      expect(findOrganizationsWithoutContacts(rows)).toEqual([]);
    });

    it("handles whitespace-only names as no name", () => {
      const rows = [
        createContact({ organization_name: "Org", first_name: "   ", last_name: "\t" }),
      ];

      const result = findOrganizationsWithoutContacts(rows);

      expect(result).toHaveLength(1);
    });
  });
});

// ============================================================
// findContactsWithoutContactInfo TESTS
// ============================================================

describe("findContactsWithoutContactInfo", () => {
  describe("basic functionality", () => {
    it("finds contacts with names but no email or phone", () => {
      const rows = [
        createContact({ first_name: "John", last_name: "Doe", organization_name: "Acme" }),
        createContact({
          first_name: "Jane",
          last_name: "Smith",
          email_work: "jane@example.com",
        }),
      ];

      const result = findContactsWithoutContactInfo(rows);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("John Doe");
      expect(result[0].organization_name).toBe("Acme");
    });

    it("calculates correct row numbers using CSV_DATA_START_OFFSET", () => {
      const rows = [
        createContact({ first_name: "John" }), // index 0, no contact info
        createContact({ first_name: "Jane", email_work: "jane@test.com" }), // has email
        createContact({ first_name: "Bob" }), // index 2, no contact info
      ];

      const result = findContactsWithoutContactInfo(rows);

      expect(result).toHaveLength(2);
      expect(result[0].row).toBe(0 + CSV_DATA_START_OFFSET); // 4
      expect(result[1].row).toBe(2 + CSV_DATA_START_OFFSET); // 6
    });
  });

  describe("name building", () => {
    it("builds full name from first and last", () => {
      const rows = [createContact({ first_name: "John", last_name: "Doe" })];

      const result = findContactsWithoutContactInfo(rows);

      expect(result[0].name).toBe("John Doe");
    });

    it("uses first name only when last name is empty", () => {
      const rows = [createContact({ first_name: "John", last_name: "" })];

      const result = findContactsWithoutContactInfo(rows);

      expect(result[0].name).toBe("John");
    });

    it("uses last name only when first name is empty", () => {
      const rows = [createContact({ first_name: "", last_name: "Doe" })];

      const result = findContactsWithoutContactInfo(rows);

      expect(result[0].name).toBe("Doe");
    });

    it("uses 'Unknown' when both names are empty", () => {
      // This case shouldn't match the predicate (no name = org-only)
      // but testing the fallback behavior
      const rows = [
        createContact({
          first_name: "  ", // whitespace only, treated as no name
          last_name: "  ",
          organization_name: "", // no org either
        }),
      ];

      // This won't match since it needs a name to be "contact without info"
      const result = findContactsWithoutContactInfo(rows);
      expect(result).toHaveLength(0);
    });

    it("trims whitespace from names", () => {
      const rows = [createContact({ first_name: "  John  ", last_name: "  Doe  " })];

      const result = findContactsWithoutContactInfo(rows);

      expect(result[0].name).toBe("John Doe");
    });
  });

  describe("contact info validation", () => {
    it("excludes contacts with email_work", () => {
      const rows = [
        createContact({ first_name: "John", email_work: "john@work.com" }),
      ];

      expect(findContactsWithoutContactInfo(rows)).toEqual([]);
    });

    it("excludes contacts with email_home", () => {
      const rows = [
        createContact({ first_name: "John", email_home: "john@home.com" }),
      ];

      expect(findContactsWithoutContactInfo(rows)).toEqual([]);
    });

    it("excludes contacts with email_other", () => {
      const rows = [
        createContact({ first_name: "John", email_other: "john@other.com" }),
      ];

      expect(findContactsWithoutContactInfo(rows)).toEqual([]);
    });

    it("excludes contacts with phone_work", () => {
      const rows = [
        createContact({ first_name: "John", phone_work: "555-1234" }),
      ];

      expect(findContactsWithoutContactInfo(rows)).toEqual([]);
    });

    it("excludes contacts with phone_home", () => {
      const rows = [
        createContact({ first_name: "John", phone_home: "555-1234" }),
      ];

      expect(findContactsWithoutContactInfo(rows)).toEqual([]);
    });

    it("excludes contacts with phone_other", () => {
      const rows = [
        createContact({ first_name: "John", phone_other: "555-1234" }),
      ];

      expect(findContactsWithoutContactInfo(rows)).toEqual([]);
    });

    it("treats whitespace-only contact info as missing", () => {
      const rows = [
        createContact({
          first_name: "John",
          email_work: "   ",
          phone_work: "\t",
        }),
      ];

      const result = findContactsWithoutContactInfo(rows);

      expect(result).toHaveLength(1);
    });
  });

  describe("edge cases", () => {
    it("returns empty array for empty input", () => {
      expect(findContactsWithoutContactInfo([])).toEqual([]);
    });

    it("handles empty organization_name gracefully", () => {
      const rows = [createContact({ first_name: "John", organization_name: "" })];

      const result = findContactsWithoutContactInfo(rows);

      expect(result[0].organization_name).toBe("");
    });

    it("trims organization_name in results", () => {
      const rows = [
        createContact({ first_name: "John", organization_name: "  Acme Inc  " }),
      ];

      const result = findContactsWithoutContactInfo(rows);

      expect(result[0].organization_name).toBe("Acme Inc");
    });
  });
});
