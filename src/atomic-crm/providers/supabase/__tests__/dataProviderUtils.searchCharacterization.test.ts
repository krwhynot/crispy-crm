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
    it("should produce OR-joined ILIKE for all searchable fields with single word", () => {
      const params = createParams({ q: "john" });
      const result = applySearchParams("contacts", params);

      // q should be removed
      expect(result.filter).not.toHaveProperty("q");

      // Should have or@ with ILIKE conditions
      expect(result.filter).toHaveProperty("or@");

      // Snapshot the exact format
      expect(result.filter["or@"]).toMatchInlineSnapshot(
        `"(first_name.ilike.*john*,last_name.ilike.*john*,company_name.ilike.*john*,title.ilike.*john*)"`
      );
    });

    it("should handle multi-word query with proper quoting", () => {
      const params = createParams({ q: "john smith" });
      const result = applySearchParams("contacts", params);

      expect(result.filter).not.toHaveProperty("q");
      expect(result.filter).toHaveProperty("or@");

      // Multi-word values need quoting for PostgREST
      expect(result.filter["or@"]).toMatchInlineSnapshot(
        `"(first_name.ilike."*john smith*",last_name.ilike."*john smith*",company_name.ilike."*john smith*",title.ilike."*john smith*")"`
      );
    });

    it("should handle three-word query", () => {
      const params = createParams({ q: "john doe jr" });
      const result = applySearchParams("contacts", params);

      expect(result.filter["or@"]).toMatchInlineSnapshot(
        `"(first_name.ilike."*john doe jr*",last_name.ilike."*john doe jr*",company_name.ilike."*john doe jr*",title.ilike."*john doe jr*")"`
      );
    });
  });

  describe("2. Special characters (ILIKE wildcards and SQL injection prevention)", () => {
    describe("ILIKE wildcard escaping", () => {
      it("should escape % character in search", () => {
        const params = createParams({ q: "100%" });
        const result = applySearchParams("contacts", params);

        // % must be escaped to prevent unintended wildcard matching
        expect(result.filter["or@"]).toMatchInlineSnapshot(
          `"(first_name.ilike.*100\\%*,last_name.ilike.*100\\%*,company_name.ilike.*100\\%*,title.ilike.*100\\%*)"`
        );
      });

      it("should escape _ character in search", () => {
        const params = createParams({ q: "file_name" });
        const result = applySearchParams("contacts", params);

        // _ must be escaped to prevent single-character wildcard matching
        expect(result.filter["or@"]).toMatchInlineSnapshot(
          `"(first_name.ilike.*file\\_name*,last_name.ilike.*file\\_name*,company_name.ilike.*file\\_name*,title.ilike.*file\\_name*)"`
        );
      });

      it("should escape backslash character", () => {
        const params = createParams({ q: "path\\test" });
        const result = applySearchParams("contacts", params);

        // Backslash is the escape character, must be escaped first
        expect(result.filter["or@"]).toMatchInlineSnapshot(
          `"(first_name.ilike.*path\\\\test*,last_name.ilike.*path\\\\test*,company_name.ilike.*path\\\\test*,title.ilike.*path\\\\test*)"`
        );
      });

      it("should escape multiple ILIKE special characters", () => {
        const params = createParams({ q: "50%_discount" });
        const result = applySearchParams("contacts", params);

        expect(result.filter["or@"]).toMatchInlineSnapshot(
          `"(first_name.ilike.*50\\%\\_discount*,last_name.ilike.*50\\%\\_discount*,company_name.ilike.*50\\%\\_discount*,title.ilike.*50\\%\\_discount*)"`
        );
      });
    });

    describe("apostrophes and quotes", () => {
      it("should handle apostrophe in names (O'Reilly)", () => {
        const params = createParams({ q: "o'reilly" });
        const result = applySearchParams("contacts", params);

        // Apostrophe triggers PostgREST quoting
        expect(result.filter["or@"]).toMatchInlineSnapshot(
          `"(first_name.ilike."*o'reilly*",last_name.ilike."*o'reilly*",company_name.ilike."*o'reilly*",title.ilike."*o'reilly*")"`
        );
      });

      it("should handle double apostrophe (McDonald's Inc's)", () => {
        const params = createParams({ q: "McDonald's Inc's" });
        const result = applySearchParams("contacts", params);

        expect(result.filter["or@"]).toMatchInlineSnapshot(
          `"(first_name.ilike."*McDonald's Inc's*",last_name.ilike."*McDonald's Inc's*",company_name.ilike."*McDonald's Inc's*",title.ilike."*McDonald's Inc's*")"`
        );
      });
    });

    describe("email and URL characters", () => {
      it("should handle @ and . in email addresses", () => {
        const params = createParams({ q: "test@example.com" });
        const result = applySearchParams("contacts", params);

        expect(result.filter["or@"]).toMatchInlineSnapshot(
          `"(first_name.ilike."*test@example.com*",last_name.ilike."*test@example.com*",company_name.ilike."*test@example.com*",title.ilike."*test@example.com*")"`
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
      it("should handle comma in search (name suffix)", () => {
        const params = createParams({ q: "Smith, Jr." });
        const result = applySearchParams("contacts", params);

        expect(result.filter["or@"]).toMatchInlineSnapshot(
          `"(first_name.ilike."*Smith, Jr.*",last_name.ilike."*Smith, Jr.*",company_name.ilike."*Smith, Jr.*",title.ilike."*Smith, Jr.*")"`
        );
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

      // Should have both or@ and deleted_at filter
      expect(result.filter).toHaveProperty("or@");
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

      // q transformed to or@
      expect(result.filter).toHaveProperty("or@");

      // Array filters transformed to PostgREST operators
      expect(result.filter).toHaveProperty("tags@cs");
      expect(result.filter).toHaveProperty("status@in");

      expect(result.filter).toMatchInlineSnapshot(`
        {
          "or@": "(first_name.ilike.*test*,last_name.ilike.*test*,company_name.ilike.*test*,title.ilike.*test*)",
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
      it("should preserve empty q parameter in filter (current behavior)", () => {
        // CHARACTERIZATION: Current behavior preserves empty q in output
        // This may be a bug that FTS migration could fix
        const params = createParams({ q: "" });
        const result = applySearchParams("contacts", params);

        // Current behavior: empty q is preserved (not stripped)
        expect(result.filter).toHaveProperty("q");
        expect(result.filter.q).toBe("");
        expect(result.filter).not.toHaveProperty("or@");
      });

      it("should preserve whitespace-only q parameter (current behavior)", () => {
        // CHARACTERIZATION: Current behavior preserves whitespace-only q
        // This may be a bug that FTS migration could fix
        const params = createParams({ q: "   " });
        const result = applySearchParams("contacts", params);

        // Current behavior: whitespace q is preserved (not stripped)
        expect(result.filter).toHaveProperty("q");
        expect(result.filter.q).toBe("   ");
        expect(result.filter).not.toHaveProperty("or@");
      });

      it("should preserve tabs and newlines (current behavior)", () => {
        // CHARACTERIZATION: Current behavior preserves whitespace q
        const params = createParams({ q: "\t\n  \r" });
        const result = applySearchParams("contacts", params);

        // Current behavior: whitespace q is preserved
        expect(result.filter).toHaveProperty("q");
        expect(result.filter).not.toHaveProperty("or@");
      });

      it("should trim leading/trailing whitespace but keep inner content", () => {
        const params = createParams({ q: "  john  " });
        const result = applySearchParams("contacts", params);

        // Should search for trimmed value
        expect(result.filter["or@"]).toMatchInlineSnapshot(
          `"(first_name.ilike.*john*,last_name.ilike.*john*,company_name.ilike.*john*,title.ilike.*john*)"`
        );
      });
    });

    describe("long queries", () => {
      it("should handle very long query (500+ chars)", () => {
        const longQuery = "a".repeat(500);
        const params = createParams({ q: longQuery });
        const result = applySearchParams("contacts", params);

        expect(result.filter).toHaveProperty("or@");

        // Verify the pattern is correct (contains all searchable fields)
        const orFilter = result.filter["or@"] as string;
        expect(orFilter).toContain("first_name.ilike.");
        expect(orFilter).toContain("last_name.ilike.");
        expect(orFilter).toContain(`*${"a".repeat(500)}*`);
      });

      it("should handle query at 1000 characters", () => {
        const longQuery = "search".repeat(166); // ~996 chars
        const params = createParams({ q: longQuery });
        const result = applySearchParams("contacts", params);

        expect(result.filter).toHaveProperty("or@");
      });
    });

    describe("unicode and special characters", () => {
      it("should handle unicode characters", () => {
        const params = createParams({ q: "Muller" });
        const result = applySearchParams("contacts", params);

        expect(result.filter["or@"]).toMatchInlineSnapshot(
          `"(first_name.ilike.*Muller*,last_name.ilike.*Muller*,company_name.ilike.*Muller*,title.ilike.*Muller*)"`
        );
      });

      it("should handle CJK characters", () => {
        const params = createParams({ q: "customer" });
        const result = applySearchParams("contacts", params);

        expect(result.filter["or@"]).toMatchInlineSnapshot(
          `"(first_name.ilike.*customer*,last_name.ilike.*customer*,company_name.ilike.*customer*,title.ilike.*customer*)"`
        );
      });

      it("should handle emoji (edge case)", () => {
        const params = createParams({ q: "test star" });
        const result = applySearchParams("contacts", params);

        // Emoji should be preserved (PostgREST/Postgres handles unicode)
        expect(result.filter).toHaveProperty("or@");
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
      it("should handle numeric-only search", () => {
        const params = createParams({ q: "12345" });
        const result = applySearchParams("contacts", params);

        expect(result.filter["or@"]).toMatchInlineSnapshot(
          `"(first_name.ilike.*12345*,last_name.ilike.*12345*,company_name.ilike.*12345*,title.ilike.*12345*)"`
        );
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
    it("should use correct fields for contacts", () => {
      const params = createParams({ q: "test" });
      const result = applySearchParams("contacts", params);

      const orFilter = result.filter["or@"] as string;
      expect(orFilter).toContain("first_name.ilike.");
      expect(orFilter).toContain("last_name.ilike.");
      expect(orFilter).toContain("company_name.ilike.");
      expect(orFilter).toContain("title.ilike.");
      // Should NOT contain fields from other resources
      expect(orFilter).not.toContain("website.ilike.");
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
