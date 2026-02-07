/**
 * FTS Operator Syntax Contract Tests
 *
 * These tests freeze the discovered PostgREST FTS syntax patterns.
 * DO NOT MODIFY without updating the FTS implementation.
 *
 * Discovery Date: 2026-02-06
 * Evidence: FTS syntax spike against local Supabase
 *
 * Winning Patterns:
 * - wfts(english).term - User-facing search (web semantics)
 * - fts(english).term:* - Autocomplete/typeahead (prefix search)
 */

import { describe, it, expect } from "vitest";

/**
 * Build FTS filter for user-facing search (global search, q parameter)
 *
 * Uses wfts (websearch_to_tsquery) which:
 * - Handles multi-word queries naturally (space-separated = AND)
 * - Supports OR operator: "smith OR dean"
 * - Supports negation: "-excluded"
 * - More forgiving with user input
 */
export function buildWebSearchFilter(query: string): Record<string, string> {
  // Sanitize query: remove characters that break PostgREST parsing
  const sanitized = query
    .replace(/['"()]/g, " ") // Remove quotes and parens
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();

  if (!sanitized) {
    return {};
  }

  // PostgREST wfts syntax: column.wfts(config).query
  // In filter object: { "search_tsv": "wfts(english).query" }
  return {
    search_tsv: `wfts(english).${sanitized}`,
  };
}

/**
 * Build FTS filter for autocomplete/typeahead (prefix search)
 *
 * Uses fts (to_tsquery) with :* suffix which:
 * - Matches words starting with the prefix
 * - Required for typeahead UX where user types partial words
 *
 * Note: wfts does NOT support prefix :* - must use fts
 */
export function buildPrefixSearchFilter(prefix: string): Record<string, string> {
  const sanitized = prefix
    .replace(/['"():*]/g, "") // Remove special chars including :*
    .replace(/\s+/g, " ")
    .trim();

  if (!sanitized) {
    return {};
  }

  // fts with :* for prefix matching
  return {
    search_tsv: `fts(english).${sanitized}:*`,
  };
}

describe("FTS Operator Syntax Contract", () => {
  describe("buildWebSearchFilter (wfts)", () => {
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

    it("should normalize multiple spaces", () => {
      const result = buildWebSearchFilter("john   doe");
      expect(result).toEqual({
        search_tsv: "wfts(english).john doe",
      });
    });
  });

  describe("buildPrefixSearchFilter (fts with :*)", () => {
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

  describe("PostgREST syntax contract", () => {
    it("should use wfts operator for web search semantics", () => {
      // Contract: wfts(config).query is the PostgREST format
      const filter = buildWebSearchFilter("test");
      expect(filter["search_tsv"]).toMatch(/^wfts\(english\)\./);
    });

    it("should use fts operator with :* for prefix search", () => {
      // Contract: fts(config).prefix:* is the PostgREST format
      const filter = buildPrefixSearchFilter("test");
      expect(filter["search_tsv"]).toMatch(/^fts\(english\)\..*:\*$/);
    });

    it("should always use english language config", () => {
      // Contract: english config matches tsvector generation in triggers
      const webFilter = buildWebSearchFilter("test");
      const prefixFilter = buildPrefixSearchFilter("test");

      expect(webFilter["search_tsv"]).toContain("english");
      expect(prefixFilter["search_tsv"]).toContain("english");
    });
  });
});

/**
 * Integration notes for dataProviderUtils.ts:
 *
 * To integrate FTS in applySearchParams():
 *
 * ```typescript
 * // Check if resource has FTS enabled
 * const useFTS = FTS_ENABLED_RESOURCES.includes(resource);
 *
 * if (useFTS && filter.q) {
 *   // Replace ILIKE with FTS
 *   const ftsFilter = buildWebSearchFilter(String(filter.q));
 *   return {
 *     ...params,
 *     filter: {
 *       ...filterWithoutQ,
 *       ...ftsFilter,
 *       ...softDeleteFilter,
 *     },
 *   };
 * }
 * ```
 */
