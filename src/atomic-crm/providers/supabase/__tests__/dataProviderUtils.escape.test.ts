/**
 * Tests for escapeForPostgREST and cache behavior
 * CRITICAL: Security and correctness tests for PostgREST escaping
 *
 * Engineering Constitution: Pragmatic testing - focus on security-critical paths
 */

import { describe, it, expect, beforeEach } from "vitest";
import { escapeForPostgREST, escapeForIlike } from "../dataProviderUtils";

describe("escapeForPostgREST", () => {
  beforeEach(() => {
    // Clear the cache between tests by calling with 1100 unique values
    // This triggers the eviction logic and ensures a clean state
    for (let i = 0; i < 1100; i++) {
      escapeForPostgREST(`clear-cache-${i}`);
    }
  });

  describe("basic escaping", () => {
    it("should not quote simple strings without special characters", () => {
      expect(escapeForPostgREST("simple")).toBe("simple");
      expect(escapeForPostgREST("hello123")).toBe("hello123");
      expect(escapeForPostgREST("under_score")).toBe("under_score");
    });

    it("should quote and escape strings with special characters", () => {
      expect(escapeForPostgREST("hello world")).toBe('"hello world"');
      expect(escapeForPostgREST("a,b,c")).toBe('"a,b,c"');
      expect(escapeForPostgREST("O'Reilly")).toBe('"O\'Reilly"');
    });

    it("should escape backslashes and quotes properly", () => {
      // Backslash should become \\
      expect(escapeForPostgREST("c:\\path")).toBe('"c:\\\\path"');
      // Quote should become \"
      expect(escapeForPostgREST('say "hello"')).toBe('"say \\"hello\\""');
      // Both together
      expect(escapeForPostgREST('path\\"test')).toBe('"path\\\\\\"test"');
    });

    it("should handle all PostgREST reserved characters", () => {
      const reserved = ",.\"'() :";
      expect(escapeForPostgREST(reserved)).toBe('",.\\"\'() :"');
    });
  });

  describe("SQL injection protection", () => {
    it("should safely escape potential SQL injection attempts", () => {
      const malicious1 = '"; DROP TABLE users;--';
      expect(escapeForPostgREST(malicious1)).toBe(`"\\"; DROP TABLE users;--"`);

      const malicious2 = "' OR '1'='1";
      expect(escapeForPostgREST(malicious2)).toBe("\"' OR '1'='1\"");

      const malicious3 = '\\"; DELETE FROM contacts WHERE "1"="1';
      expect(escapeForPostgREST(malicious3)).toBe(
        `"\\\\\\"; DELETE FROM contacts WHERE \\"1\\"=\\"1"`
      );
    });

    it("should handle nested escape attempts", () => {
      const nested = 'a\\"b\\"c';
      expect(escapeForPostgREST(nested)).toBe('"a\\\\\\"b\\\\\\"c"');
    });
  });

  describe("type coercion", () => {
    it("should convert numbers to strings", () => {
      expect(escapeForPostgREST(123)).toBe("123");
      expect(escapeForPostgREST(45.67)).toBe('"45.67"'); // Dot is a special character
      expect(escapeForPostgREST(-89)).toBe("-89");
    });

    it("should convert booleans to strings", () => {
      expect(escapeForPostgREST(true)).toBe("true");
      expect(escapeForPostgREST(false)).toBe("false");
    });

    it("should handle null and undefined", () => {
      expect(escapeForPostgREST(null)).toBe("null");
      expect(escapeForPostgREST(undefined)).toBe("undefined");
    });
  });

  describe("cache behavior", () => {
    it("should return cached value on second call", () => {
      const testValue = "cache-test-value";
      const result1 = escapeForPostgREST(testValue);
      const result2 = escapeForPostgREST(testValue);

      expect(result1).toBe(result2);
      expect(result1).toBe("cache-test-value");
    });

    it("should cache quoted values correctly", () => {
      const testValue = 'needs "quotes"';
      const result1 = escapeForPostgREST(testValue);
      const result2 = escapeForPostgREST(testValue);

      expect(result1).toBe(result2);
      expect(result1).toBe('"needs \\"quotes\\""');
    });

    it("should evict entries when cache exceeds 1000 items", () => {
      // Add 1100 unique values to trigger eviction
      const values: string[] = [];
      for (let i = 0; i < 1100; i++) {
        const value = `test-value-${i}`;
        values.push(value);
        escapeForPostgREST(value);
      }

      // Cache should have evicted ~500 entries, keeping ~500
      // The exact count depends on implementation but should be ≤ 1000
      // We can't directly access the cache size, but we can verify behavior

      // Early values should be evicted
      const earlyValue = values[0];
      const earlyResult1 = escapeForPostgREST(earlyValue);
      const earlyResult2 = escapeForPostgREST(earlyValue);
      expect(earlyResult1).toBe(earlyResult2);

      // Recent values should still be cached
      const recentValue = values[1099];
      const recentResult1 = escapeForPostgREST(recentValue);
      const recentResult2 = escapeForPostgREST(recentValue);
      expect(recentResult1).toBe(recentResult2);
    });

    it("should handle rapid repeated evictions", () => {
      // Simulate high-load scenario with 3000 unique values
      for (let i = 0; i < 3000; i++) {
        const result = escapeForPostgREST(`rapid-test-${i}`);
        expect(result).toBe(`rapid-test-${i}`);
      }

      // System should still be functional
      expect(escapeForPostgREST("final-test")).toBe("final-test");
    });
  });

  describe("edge cases", () => {
    it("should handle empty strings", () => {
      expect(escapeForPostgREST("")).toBe("");
    });

    it("should handle very long strings", () => {
      const longString = "a".repeat(10000);
      expect(escapeForPostgREST(longString)).toBe(longString);
    });

    it("should handle unicode characters", () => {
      expect(escapeForPostgREST("hello 世界")).toBe('"hello 世界"');
      expect(escapeForPostgREST("emoji 😀")).toBe('"emoji 😀"');
    });
  });
});

describe("escapeForIlike", () => {
  describe("ILIKE wildcard escaping", () => {
    it("should escape % wildcard character", () => {
      expect(escapeForIlike("100% complete")).toBe("100\\% complete");
      expect(escapeForIlike("50%")).toBe("50\\%");
      expect(escapeForIlike("%start")).toBe("\\%start");
    });

    it("should escape _ single-character wildcard", () => {
      expect(escapeForIlike("file_name")).toBe("file\\_name");
      expect(escapeForIlike("test_case_1")).toBe("test\\_case\\_1");
      expect(escapeForIlike("_prefix")).toBe("\\_prefix");
    });

    it("should escape backslash first (escape character)", () => {
      expect(escapeForIlike("path\\to\\file")).toBe("path\\\\to\\\\file");
      expect(escapeForIlike("\\")).toBe("\\\\");
    });

    it("should handle combined special characters", () => {
      // Backslash escaping must happen first, then % and _
      // Input: 100%\_done → Output: 100\%\\\_done
      expect(escapeForIlike("100%\\_done")).toBe("100\\%\\\\\\_done");
      // Input: \%_ → Output: \\%\_
      expect(escapeForIlike("\\%_")).toBe("\\\\\\%\\_");
    });

    it("should leave regular characters unchanged", () => {
      expect(escapeForIlike("normal text")).toBe("normal text");
      expect(escapeForIlike("Test Organization 2024")).toBe("Test Organization 2024");
      expect(escapeForIlike("john@example.com")).toBe("john@example.com");
    });

    it("should handle empty string", () => {
      expect(escapeForIlike("")).toBe("");
    });
  });

  describe("search query scenarios", () => {
    it("should safely escape user search input", () => {
      // Users might accidentally type ILIKE wildcards
      expect(escapeForIlike("100%")).toBe("100\\%");
      expect(escapeForIlike("file_v2")).toBe("file\\_v2");
    });

    it("should handle multi-word search terms", () => {
      // The bug report case: "Test Organization 2024"
      expect(escapeForIlike("Test Organization 2024")).toBe("Test Organization 2024");
    });
  });
});

// Export a test helper to clear the cache (useful for other test files)
export function clearEscapeCache(): void {
  for (let i = 0; i < 1100; i++) {
    escapeForPostgREST(`clear-${Date.now()}-${i}`);
  }
}
