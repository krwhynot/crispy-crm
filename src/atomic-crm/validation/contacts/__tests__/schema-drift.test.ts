/**
 * Schema Drift Tests for Contacts
 *
 * These tests verify that the contact schema correctly handles fields that come
 * from the base contacts table (via getOne) but are not user-editable.
 *
 * ROOT CAUSE CONTEXT:
 * - EditBase getOne fetches from BASE TABLE (not contacts_summary view)
 * - Base table includes `search_tsv` (PostgreSQL tsvector generated column)
 * - contactBaseSchema uses z.strictObject() which REJECTS unknown keys
 * - This causes form validation to fail silently (no PATCH request made)
 *
 * PATTERN REFERENCE:
 * - organizationsCallbacks.ts line 64: COMPUTED_FIELDS includes "search_tsv"
 * - opportunitiesCallbacks.ts line 101: VIEW_ONLY_FIELDS includes "search_tsv"
 * - contacts is MISSING this handling → these tests ensure parity
 *
 * @see https://github.com/crispy-crm/issues/XXX - Contact edit not saving
 */

import { describe, it, expect } from "vitest";
import { contactBaseSchema } from "../contacts-core";
import {
  COMPUTED_FIELDS,
  stripComputedFields,
} from "@/atomic-crm/providers/supabase/callbacks/contactsCallbacks";

describe("Contact Schema - search_tsv handling", () => {
  it("should accept records containing search_tsv from base table", () => {
    // Simulate record from getOne (base table includes search_tsv tsvector column)
    // This is the exact shape that EditBase receives from dataProvider.getOne()
    const recordFromDB = {
      id: 1800,
      first_name: "Dale",
      last_name: "Ramsy",
      email: [],
      phone: [],
      tags: [],
      // PostgreSQL tsvector generated column - present in base table, not user-editable
      search_tsv: "'dale':1 'ramsy':2",
    };

    // Should NOT throw - strictObject should accept search_tsv
    // If this fails, form validation rejects the entire record silently
    const result = contactBaseSchema.partial().safeParse(recordFromDB);
    expect(result.success).toBe(true);
    if (result.success) {
      // search_tsv should be preserved (or stripped by schema, but not cause rejection)
      expect(result.data).toBeDefined();
    }
  });

  it("should handle search_tsv as optional unknown type", () => {
    // Base table can return various tsvector representations
    const variants = [
      { search_tsv: "'dale':1" },
      { search_tsv: null },
      { search_tsv: undefined },
      {}, // No search_tsv at all
    ];

    for (const variant of variants) {
      const record = {
        id: 1,
        first_name: "Test",
        last_name: "User",
        email: [],
        phone: [],
        tags: [],
        ...variant,
      };

      const result = contactBaseSchema.partial().safeParse(record);
      expect(result.success).toBe(true);
    }
  });
});

describe("Contact Schema - tags type", () => {
  it("should accept tags as number array (tag IDs from database)", () => {
    // Database stores tags as BIGINT array (foreign keys to tags table)
    // TagsListEdit.tsx confirms: record.tags.includes(tag.id) where tag.id is number
    const recordFromDB = {
      id: 1,
      first_name: "Dale",
      last_name: "Ramsy",
      email: [],
      phone: [],
      tags: [1, 2, 3], // Tag IDs are NUMBERS, not strings
    };

    const result = contactBaseSchema.partial().safeParse(recordFromDB);
    expect(result.success).toBe(true);
    if (result.success) {
      // Tags should be preserved as numbers after coercion
      expect(result.data?.tags).toEqual([1, 2, 3]);
    }
  });

  it("should coerce string tag IDs to numbers", () => {
    // Form inputs might return string values that need coercion
    const recordFromForm = {
      id: 1,
      first_name: "Test",
      last_name: "User",
      email: [],
      phone: [],
      tags: ["1", "2", "3"], // Strings from form (should coerce to numbers)
    };

    const result = contactBaseSchema.partial().safeParse(recordFromForm);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data?.tags).toEqual([1, 2, 3]);
    }
  });

  it("should handle empty tags array", () => {
    const record = {
      id: 1,
      first_name: "Test",
      last_name: "User",
      email: [],
      phone: [],
      tags: [],
    };

    const result = contactBaseSchema.partial().safeParse(record);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data?.tags).toEqual([]);
    }
  });
});

describe("COMPUTED_FIELDS consistency", () => {
  it("should include search_tsv like organizations and opportunities", () => {
    // search_tsv is a PostgreSQL generated column that must be stripped before save
    // Pattern established in:
    // - organizationsCallbacks.ts line 64: "search_tsv" in COMPUTED_FIELDS
    // - opportunitiesCallbacks.ts line 101: "search_tsv" in VIEW_ONLY_FIELDS
    expect(COMPUTED_FIELDS).toContain("search_tsv");
  });

  it("should strip search_tsv before database write", () => {
    const dataWithSearchTsv = {
      id: 1,
      first_name: "Dale",
      last_name: "Ramsy",
      search_tsv: "'dale':1 'ramsy':2",
      full_name: "Dale Ramsy", // Also computed
    };

    const stripped = stripComputedFields(dataWithSearchTsv);

    // search_tsv should be removed
    expect(stripped).not.toHaveProperty("search_tsv");
    // full_name is already in COMPUTED_FIELDS
    expect(stripped).not.toHaveProperty("full_name");
    // Regular fields preserved
    expect(stripped).toHaveProperty("first_name", "Dale");
    expect(stripped).toHaveProperty("last_name", "Ramsy");
  });
});
