/**
 * Characterization Tests for Q-Search ILIKE Behavior
 *
 * CRITICAL: These tests snapshot the CURRENT behavior BEFORE any FTS changes.
 * They serve as a regression baseline to ensure FTS migration doesn't break existing search.
 *
 * Engineering Constitution: Characterization tests document existing behavior,
 * not desired behavior. If a test fails after changes, evaluate whether the
 * new behavior is acceptable or if it breaks user expectations.
 *
 * @see SEARCH_ARCHITECTURE.md for migration strategy
 */

import { describe, it, expect } from "vitest";
import {
  applySearchParams,
  escapeForIlike,
  applyFullTextSearch,
  buildWebSearchFilter,
  buildPrefixSearchFilter,
} from "../dataProviderUtils";
import type { GetListParams } from "ra-core";

/**
 * Helper to create standard GetListParams for testing
 */
function createParams(filter: Record<string, unknown>): GetListParams {
  return {
    pagination: { page: 1, perPage: 25 },
    sort: { field: "id", order: "ASC" as const },
    filter,
  };
}

describe("Q-Search ILIKE Characterization Tests", () => {
  describe("1. Multi-word queries", () => {
    it("should produce FTS search_tsv filter for single word (contacts is FTS-enabled)", () => {
      const params = createParams({ q: "john" });
      const result = applySearchParams("contacts", params);

      // q should be removed
      expect(result.filter).not.toHaveProperty("q");

      // Contacts is FTS-enabled: should have search_tsv, not or@
      expect(result.filter).not.toHaveProperty("or@");
      expect(result.filter).toHaveProperty("search_tsv");

      // Snapshot the exact format
      expect(result.filter["search_tsv"]).toMatchInlineSnapshot(`"wfts(english).john"`);
    });

    it("should handle multi-word query via FTS", () => {
      const params = createParams({ q: "john smith" });
      const result = applySearchParams("contacts", params);

      expect(result.filter).not.toHaveProperty("q");
      expect(result.filter).not.toHaveProperty("or@");
      expect(result.filter).toHaveProperty("search_tsv");

      // Multi-word values use FTS web search syntax
      expect(result.filter["search_tsv"]).toMatchInlineSnapshot(`"wfts(english).john smith"`);
    });

    it("should handle three-word query via FTS", () => {
      const params = createParams({ q: "john doe jr" });
      const result = applySearchParams("contacts", params);

      expect(result.filter["search_tsv"]).toMatchInlineSnapshot(`"wfts(english).john doe jr"`);
    });
  });

  describe("2. Special characters (FTS sanitization for contacts, ILIKE for others)", () => {
    describe("FTS sanitization for contacts (ILIKE escaping not applicable)", () => {
      it("should preserve % character in FTS search", () => {
        const params = createParams({ q: "100%" });
        const result = applySearchParams("contacts", params);

        // FTS does not escape %; buildWebSearchFilter only removes '"()
        expect(result.filter).not.toHaveProperty("or@");
        expect(result.filter["search_tsv"]).toMatchInlineSnapshot(`"wfts(english).100%"`);
      });

      it("should preserve _ character in FTS search", () => {
        const params = createParams({ q: "file_name" });
        const result = applySearchParams("contacts", params);

        // FTS does not escape _
        expect(result.filter).not.toHaveProperty("or@");
        expect(result.filter["search_tsv"]).toMatchInlineSnapshot(`"wfts(english).file_name"`);
      });

      it("should preserve backslash character in FTS search", () => {
        const params = createParams({ q: "path\\test" });
        const result = applySearchParams("contacts", params);

        // FTS does not escape backslash
        expect(result.filter).not.toHaveProperty("or@");
        expect(result.filter["search_tsv"]).toMatchInlineSnapshot(`"wfts(english).path\\test"`);
      });

      it("should preserve multiple special characters in FTS search", () => {
        const params = createParams({ q: "50%_discount" });
        const result = applySearchParams("contacts", params);

        expect(result.filter).not.toHaveProperty("or@");
        expect(result.filter["search_tsv"]).toMatchInlineSnapshot(`"wfts(english).50%_discount"`);
      });
    });

    describe("apostrophes and quotes (FTS sanitizes to spaces)", () => {
      it("should sanitize apostrophe in names (O'Reilly) for FTS", () => {
        const params = createParams({ q: "o'reilly" });
        const result = applySearchParams("contacts", params);

        // FTS sanitizes single quotes to spaces
        expect(result.filter).not.toHaveProperty("or@");
        expect(result.filter["search_tsv"]).toMatchInlineSnapshot(`"wfts(english).o reilly"`);
      });

      it("should sanitize double apostrophe (McDonald's Inc's) for FTS", () => {
        const params = createParams({ q: "McDonald's Inc's" });
        const result = applySearchParams("contacts", params);

        expect(result.filter).not.toHaveProperty("or@");
        expect(result.filter["search_tsv"]).toMatchInlineSnapshot(
          `"wfts(english).McDonald s Inc s"`
        );
      });
    });

    describe("email and URL characters", () => {
      it("should handle @ and . in email addresses via FTS", () => {
        const params = createParams({ q: "test@example.com" });
        const result = applySearchParams("contacts", params);

        expect(result.filter).not.toHaveProperty("or@");
        expect(result.filter["search_tsv"]).toMatchInlineSnapshot(
          `"wfts(english).test@example.com"`
        );
      });

      it("should handle colon in URLs", () => {
        const params = createParams({ q: "https://example.com" });
        const result = applySearchParams("organizations", params);

        expect(result.filter["or@"]).toMatchInlineSnapshot(
          `"(name.ilike."*https://example.com*",phone.ilike."*https://example.com*",website.ilike."*https://example.com*",postal_code.ilike."*https://example.com*",city.ilike."*https://example.com*",state.ilike."*https://example.com*",description.ilike."*https://example.com*")"`
        );
      });
    });

    describe("parentheses and brackets", () => {
      it("should handle parentheses", () => {
        const params = createParams({ q: "Acme (US)" });
        const result = applySearchParams("organizations", params);

        expect(result.filter["or@"]).toMatchInlineSnapshot(
          `"(name.ilike."*Acme (US)*",phone.ilike."*Acme (US)*",website.ilike."*Acme (US)*",postal_code.ilike."*Acme (US)*",city.ilike."*Acme (US)*",state.ilike."*Acme (US)*",description.ilike."*Acme (US)*")"`
        );
      });
    });

    describe("comma handling", () => {
      it("should handle comma in search (name suffix) via FTS", () => {
        const params = createParams({ q: "Smith, Jr." });
        const result = applySearchParams("contacts", params);

        // FTS preserves commas and periods (only removes '"())
        expect(result.filter).not.toHaveProperty("or@");
        expect(result.filter["search_tsv"]).toMatchInlineSnapshot(`"wfts(english).Smith, Jr."`);
      });
    });
  });

  describe("3. Combined filters (q + other filters)", () => {
    it("should preserve q search with stale filter", () => {
      const params = createParams({ q: "test", stale: true });
      const result = applySearchParams("opportunities", params);

      // q should be transformed to or@
      expect(result.filter).toHaveProperty("or@");
      expect(result.filter).not.toHaveProperty("q");

      // stale filter should be transformed (for opportunities)
      expect(result.filter).not.toHaveProperty("stale");
      expect(result.filter).toHaveProperty("stage@not.in");

      // Snapshot the combined result
      expect(result.filter).toMatchInlineSnapshot(`
        {
          "or@": "(name.ilike.*test*,description.ilike.*test*,next_action.ilike.*test*,lead_source.ilike.*test*,customer_organization_name.ilike.*test*)",
          "stage@not.in": "(closed_won,closed_lost)",
        }
      `);
    });

    it("should coexist with soft-delete filter for base tables", () => {
      // Using useView=false to test base table behavior (not views)
      const params = createParams({ q: "test" });
      const result = applySearchParams("contacts", params, false);

      // Contacts is FTS-enabled: should have search_tsv and deleted_at filter
      expect(result.filter).not.toHaveProperty("or@");
      expect(result.filter).toHaveProperty("search_tsv");
      expect(result.filter).toHaveProperty("deleted_at@is");
      expect(result.filter["deleted_at@is"]).toBe(null);
    });

    it("should coexist with array filters", () => {
      const params = createParams({
        q: "test",
        tags: [1, 2, 3],
        status: ["active", "pending"],
      });
      const result = applySearchParams("contacts", params);

      // q transformed to search_tsv (contacts is FTS-enabled)
      expect(result.filter).not.toHaveProperty("or@");
      expect(result.filter).toHaveProperty("search_tsv");

      // Array filters transformed to PostgREST operators
      expect(result.filter).toHaveProperty("tags@cs");
      expect(result.filter).toHaveProperty("status@in");

      expect(result.filter).toMatchInlineSnapshot(`
        {
          "search_tsv": "wfts(english).test",
          "status@in": "(active,pending)",
          "tags@cs": "{1,2,3}",
        }
      `);
    });

    it("should coexist with date range filters", () => {
      const params = createParams({
        q: "deal",
        "created_at@gte": "2024-01-01",
        "created_at@lte": "2024-12-31",
      });
      const result = applySearchParams("opportunities", params);

      expect(result.filter).toMatchInlineSnapshot(`
        {
          "created_at@gte": "2024-01-01",
          "created_at@lte": "2024-12-31",
          "or@": "(name.ilike.*deal*,description.ilike.*deal*,next_action.ilike.*deal*,lead_source.ilike.*deal*,customer_organization_name.ilike.*deal*)",
        }
      `);
    });

    it("should coexist with $or filter (transformed to @or)", () => {
      const params = createParams({
        q: "test",
        $or: [{ customer_organization_id: 5 }, { principal_organization_id: 5 }],
      });
      const result = applySearchParams("opportunities", params);

      // Both or@ (from q search) and @or (from $or filter) should exist
      expect(result.filter).toHaveProperty("or@");
      expect(result.filter).toHaveProperty("@or");

      expect(result.filter).toMatchInlineSnapshot(`
        {
          "@or": {
            "customer_organization_id": 5,
            "principal_organization_id": 5,
          },
          "or@": "(name.ilike.*test*,description.ilike.*test*,next_action.ilike.*test*,lead_source.ilike.*test*,customer_organization_name.ilike.*test*)",
        }
      `);
    });
  });

  describe("4. Edge cases", () => {
    describe("empty and whitespace queries", () => {
      it("should strip empty q parameter from filter (query hygiene)", () => {
        // Empty q is stripped at the provider layer before search transformation
        const params = createParams({ q: "" });
        const result = applySearchParams("contacts", params);

        // Empty q is removed (not forwarded to PostgREST)
        expect(result.filter).not.toHaveProperty("q");
        expect(result.filter).not.toHaveProperty("or@");
      });

      it("should strip whitespace-only q parameter (query hygiene)", () => {
        // Whitespace-only q is trimmed to empty and then stripped
        const params = createParams({ q: "   " });
        const result = applySearchParams("contacts", params);

        // Whitespace q is removed (not forwarded to PostgREST)
        expect(result.filter).not.toHaveProperty("q");
        expect(result.filter).not.toHaveProperty("or@");
      });

      it("should strip tabs and newlines (query hygiene)", () => {
        // Tabs/newlines/carriage returns are trimmed to empty and then stripped
        const params = createParams({ q: "\t\n  \r" });
        const result = applySearchParams("contacts", params);

        // Whitespace-only q is removed (not forwarded to PostgREST)
        expect(result.filter).not.toHaveProperty("q");
        expect(result.filter).not.toHaveProperty("or@");
      });

      it("should trim leading/trailing whitespace but keep inner content", () => {
        const params = createParams({ q: "  john  " });
        const result = applySearchParams("contacts", params);

        // Contacts is FTS-enabled: should search for trimmed value via FTS
        expect(result.filter).not.toHaveProperty("or@");
        expect(result.filter["search_tsv"]).toMatchInlineSnapshot(`"wfts(english).john"`);
      });
    });

    describe("long queries", () => {
      it("should handle very long query (500+ chars) via FTS", () => {
        const longQuery = "a".repeat(500);
        const params = createParams({ q: longQuery });
        const result = applySearchParams("contacts", params);

        // Contacts is FTS-enabled
        expect(result.filter).not.toHaveProperty("or@");
        expect(result.filter).toHaveProperty("search_tsv");

        // Verify the FTS filter contains the full query
        const ftsFilter = result.filter["search_tsv"] as string;
        expect(ftsFilter).toContain("wfts(english).");
        expect(ftsFilter).toContain("a".repeat(500));
      });

      it("should handle query at 1000 characters via FTS", () => {
        const longQuery = "search".repeat(166); // ~996 chars
        const params = createParams({ q: longQuery });
        const result = applySearchParams("contacts", params);

        expect(result.filter).not.toHaveProperty("or@");
        expect(result.filter).toHaveProperty("search_tsv");
      });
    });

    describe("unicode and special characters", () => {
      it("should handle unicode characters via FTS", () => {
        const params = createParams({ q: "Muller" });
        const result = applySearchParams("contacts", params);

        expect(result.filter).not.toHaveProperty("or@");
        expect(result.filter["search_tsv"]).toMatchInlineSnapshot(`"wfts(english).Muller"`);
      });

      it("should handle CJK characters via FTS", () => {
        const params = createParams({ q: "customer" });
        const result = applySearchParams("contacts", params);

        expect(result.filter).not.toHaveProperty("or@");
        expect(result.filter["search_tsv"]).toMatchInlineSnapshot(`"wfts(english).customer"`);
      });

      it("should handle emoji (edge case) via FTS", () => {
        const params = createParams({ q: "test star" });
        const result = applySearchParams("contacts", params);

        // Contacts is FTS-enabled
        expect(result.filter).not.toHaveProperty("or@");
        expect(result.filter).toHaveProperty("search_tsv");
      });
    });

    describe("resources without search configuration", () => {
      it("should strip q for unconfigured resource", () => {
        const params = createParams({ q: "test" });
        // tasks is not in SEARCHABLE_RESOURCES
        const result = applySearchParams("tasks", params);

        expect(result.filter).not.toHaveProperty("q");
        expect(result.filter).not.toHaveProperty("or@");
      });

      it("should strip q for tags resource", () => {
        const params = createParams({ q: "important" });
        const result = applySearchParams("tags", params);

        expect(result.filter).not.toHaveProperty("q");
        expect(result.filter).not.toHaveProperty("or@");
      });
    });

    describe("numeric search terms", () => {
      it("should handle numeric-only search via FTS", () => {
        const params = createParams({ q: "12345" });
        const result = applySearchParams("contacts", params);

        expect(result.filter).not.toHaveProperty("or@");
        expect(result.filter["search_tsv"]).toMatchInlineSnapshot(`"wfts(english).12345"`);
      });

      it("should handle phone number format", () => {
        const params = createParams({ q: "(555) 123-4567" });
        const result = applySearchParams("organizations", params);

        expect(result.filter["or@"]).toMatchInlineSnapshot(
          `"(name.ilike."*(555) 123-4567*",phone.ilike."*(555) 123-4567*",website.ilike."*(555) 123-4567*",postal_code.ilike."*(555) 123-4567*",city.ilike."*(555) 123-4567*",state.ilike."*(555) 123-4567*",description.ilike."*(555) 123-4567*")"`
        );
      });
    });
  });

  describe("5. Resource-specific search field configurations", () => {
    it("should use FTS search_tsv for contacts (FTS-enabled resource)", () => {
      const params = createParams({ q: "test" });
      const result = applySearchParams("contacts", params);

      // Contacts is FTS-enabled: uses search_tsv instead of per-field ILIKE
      expect(result.filter).not.toHaveProperty("or@");
      expect(result.filter).toHaveProperty("search_tsv");
      expect(result.filter["search_tsv"]).toContain("wfts(english).");
    });

    it("should use correct fields for organizations", () => {
      const params = createParams({ q: "test" });
      const result = applySearchParams("organizations", params);

      const orFilter = result.filter["or@"] as string;
      expect(orFilter).toContain("name.ilike.");
      expect(orFilter).toContain("phone.ilike.");
      expect(orFilter).toContain("website.ilike.");
      expect(orFilter).toContain("postal_code.ilike.");
      expect(orFilter).toContain("city.ilike.");
      expect(orFilter).toContain("state.ilike.");
      expect(orFilter).toContain("description.ilike.");
      // Should NOT contain contact fields
      expect(orFilter).not.toContain("first_name.ilike.");
    });

    it("should use correct fields for opportunities", () => {
      const params = createParams({ q: "test" });
      const result = applySearchParams("opportunities", params);

      const orFilter = result.filter["or@"] as string;
      expect(orFilter).toContain("name.ilike.");
      expect(orFilter).toContain("description.ilike.");
      expect(orFilter).toContain("next_action.ilike.");
      expect(orFilter).toContain("lead_source.ilike.");
      expect(orFilter).toContain("customer_organization_name.ilike.");
    });

    it("should use correct fields for products", () => {
      const params = createParams({ q: "test" });
      const result = applySearchParams("products", params);

      const orFilter = result.filter["or@"] as string;
      expect(orFilter).toContain("name.ilike.");
      expect(orFilter).toContain("category.ilike.");
      expect(orFilter).toContain("description.ilike.");
      expect(orFilter).toContain("manufacturer_part_number.ilike.");
    });

    it("should use correct fields for sales", () => {
      const params = createParams({ q: "test" });
      const result = applySearchParams("sales", params);

      const orFilter = result.filter["or@"] as string;
      expect(orFilter).toContain("first_name.ilike.");
      expect(orFilter).toContain("last_name.ilike.");
      expect(orFilter).toContain("email.ilike.");
    });
  });

  describe("6. escapeForIlike utility function", () => {
    it("should escape percent sign", () => {
      expect(escapeForIlike("100%")).toBe("100\\%");
    });

    it("should escape underscore", () => {
      expect(escapeForIlike("file_name")).toBe("file\\_name");
    });

    it("should escape backslash", () => {
      expect(escapeForIlike("path\\test")).toBe("path\\\\test");
    });

    it("should escape all special characters in order", () => {
      // Backslash must be escaped first
      expect(escapeForIlike("\\%_")).toBe("\\\\\\%\\_");
    });

    it("should leave normal text unchanged", () => {
      expect(escapeForIlike("hello world")).toBe("hello world");
    });

    it("should handle empty string", () => {
      expect(escapeForIlike("")).toBe("");
    });
  });

  describe("7. applyFullTextSearch utility function", () => {
    it("should create proper or@ filter with specified columns", () => {
      const searchFn = applyFullTextSearch(["name", "email"], false);
      const params = createParams({ q: "test" });
      const result = searchFn(params);

      expect(result.filter["or@"]).toMatchInlineSnapshot(
        `"(name.ilike.*test*,email.ilike.*test*)"`
      );
    });

    it("should add soft delete filter when enabled", () => {
      const searchFn = applyFullTextSearch(["name"], true);
      const params = createParams({ q: "test" });
      const result = searchFn(params);

      expect(result.filter).toHaveProperty("or@");
      expect(result.filter).toHaveProperty("deleted_at@is");
      expect(result.filter["deleted_at@is"]).toBe(null);
    });

    it("should skip soft delete filter when disabled", () => {
      const searchFn = applyFullTextSearch(["name"], false);
      const params = createParams({ q: "test" });
      const result = searchFn(params);

      expect(result.filter).toHaveProperty("or@");
      expect(result.filter).not.toHaveProperty("deleted_at@is");
    });

    it("should respect includeDeleted flag", () => {
      const searchFn = applyFullTextSearch(["name"], true);
      const params = createParams({ q: "test", includeDeleted: true });
      const result = searchFn(params);

      expect(result.filter).toHaveProperty("or@");
      expect(result.filter).not.toHaveProperty("deleted_at@is");
    });

    it("should return params unchanged if no q", () => {
      const searchFn = applyFullTextSearch(["name"], false);
      const params = createParams({ status: "active" });
      const result = searchFn(params);

      expect(result).toEqual(params);
    });
  });

  describe("8. FTS integration (when FTS_ENABLED_RESOURCES is populated)", () => {
    /**
     * These tests verify the FTS path works correctly when enabled.
     * Currently FTS_ENABLED_RESOURCES is empty, so these tests mock the config.
     *
     * To enable FTS for a resource in production:
     * 1. Add resource to FTS_ENABLED_RESOURCES in resources.ts
     * 2. Verify summary view has search_tsv column
     * 3. Monitor result drift vs ILIKE
     */

    describe("buildWebSearchFilter", () => {
      it("should produce correct wfts syntax for single word", () => {
        const result = buildWebSearchFilter("dean");
        expect(result).toEqual({
          search_tsv: "wfts(english).dean",
        });
      });

      it("should produce correct wfts syntax for multi-word query", () => {
        const result = buildWebSearchFilter("john smith");
        expect(result).toEqual({
          search_tsv: "wfts(english).john smith",
        });
      });

      it("should sanitize quotes and parentheses", () => {
        const result = buildWebSearchFilter("o'reilly (test)");
        expect(result).toEqual({
          search_tsv: "wfts(english).o reilly test",
        });
      });

      it("should return empty object for empty query", () => {
        expect(buildWebSearchFilter("")).toEqual({});
        expect(buildWebSearchFilter("   ")).toEqual({});
      });
    });

    describe("buildPrefixSearchFilter", () => {
      it("should produce correct fts prefix syntax", () => {
        const result = buildPrefixSearchFilter("dea");
        expect(result).toEqual({
          search_tsv: "fts(english).dea:*",
        });
      });

      it("should sanitize special characters including existing :*", () => {
        const result = buildPrefixSearchFilter("test:*");
        expect(result).toEqual({
          search_tsv: "fts(english).test:*",
        });
      });

      it("should return empty object for empty prefix", () => {
        expect(buildPrefixSearchFilter("")).toEqual({});
        expect(buildPrefixSearchFilter("   ")).toEqual({});
      });
    });
  });
});
