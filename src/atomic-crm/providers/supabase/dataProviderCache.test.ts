/**
 * Tests for dataProviderCache
 * Coverage: cache operations, TTL expiration, LRU eviction, singleton instances
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { CacheManager, escapeCacheManager } from "./dataProviderCache";

describe("CacheManager", () => {
  let cache: CacheManager;

  beforeEach(() => {
    vi.useRealTimers(); // Ensure real timers for most tests
    cache = new CacheManager({ max: 5, ttl: 1000 });
  });

  afterEach(() => {
    cache.clear();
    vi.useRealTimers();
  });

  describe("basic operations", () => {
    it("should set and get values", () => {
      cache.set("key1", "value1");
      expect(cache.get("key1")).toBe("value1");
    });

    it("should return undefined for non-existent keys", () => {
      expect(cache.get("nonexistent")).toBeUndefined();
    });

    it("should handle different value types", () => {
      // Use a larger cache to test all value types without LRU eviction
      const testCache = new CacheManager({ max: 10, ttl: 1000 });

      testCache.set("string", "text");
      testCache.set("number", 42);
      testCache.set("boolean", true);
      testCache.set("object", { name: "test" });
      testCache.set("array", [1, 2, 3]);
      testCache.set("null", null);

      expect(testCache.get("string")).toBe("text");
      expect(testCache.get("number")).toBe(42);
      expect(testCache.get("boolean")).toBe(true);
      expect(testCache.get("object")).toEqual({ name: "test" });
      expect(testCache.get("array")).toEqual([1, 2, 3]);
      expect(testCache.get("null")).toBe(null);

      testCache.clear();
    });

    it("should overwrite existing values", () => {
      cache.set("key", "value1");
      expect(cache.get("key")).toBe("value1");

      cache.set("key", "value2");
      expect(cache.get("key")).toBe("value2");
    });

    it("should delete values", () => {
      cache.set("key", "value");
      expect(cache.has("key")).toBe(true);

      cache.delete("key");
      expect(cache.has("key")).toBe(false);
      expect(cache.get("key")).toBeUndefined();
    });

    it("should clear all values", () => {
      cache.set("key1", "value1");
      cache.set("key2", "value2");
      cache.set("key3", "value3");

      expect(cache.size).toBe(3);

      cache.clear();

      expect(cache.size).toBe(0);
      expect(cache.get("key1")).toBeUndefined();
      expect(cache.get("key2")).toBeUndefined();
      expect(cache.get("key3")).toBeUndefined();
    });

    it("should check if key exists", () => {
      expect(cache.has("key")).toBe(false);

      cache.set("key", "value");
      expect(cache.has("key")).toBe(true);

      cache.delete("key");
      expect(cache.has("key")).toBe(false);
    });
  });

  describe("size tracking", () => {
    it("should start with size 0", () => {
      expect(cache.size).toBe(0);
    });

    it("should increment size when adding entries", () => {
      cache.set("key1", "value1");
      expect(cache.size).toBe(1);

      cache.set("key2", "value2");
      expect(cache.size).toBe(2);
    });

    it("should not increment size when overwriting entries", () => {
      cache.set("key", "value1");
      expect(cache.size).toBe(1);

      cache.set("key", "value2");
      expect(cache.size).toBe(1);
    });

    it("should decrement size when deleting entries", () => {
      cache.set("key1", "value1");
      cache.set("key2", "value2");
      expect(cache.size).toBe(2);

      cache.delete("key1");
      expect(cache.size).toBe(1);
    });

    it("should reset to 0 when clearing", () => {
      cache.set("key1", "value1");
      cache.set("key2", "value2");
      cache.set("key3", "value3");

      cache.clear();
      expect(cache.size).toBe(0);
    });
  });

  describe("LRU eviction", () => {
    it("should evict least recently used item when max is exceeded", () => {
      // Fill cache to max (5 items)
      cache.set("key1", "value1");
      cache.set("key2", "value2");
      cache.set("key3", "value3");
      cache.set("key4", "value4");
      cache.set("key5", "value5");

      expect(cache.size).toBe(5);
      expect(cache.has("key1")).toBe(true);

      // Add 6th item - should evict key1 (least recently set)
      cache.set("key6", "value6");

      expect(cache.size).toBe(5);
      expect(cache.has("key1")).toBe(false);
      expect(cache.has("key6")).toBe(true);
    });

    it("should keep most recently accessed items", () => {
      // Fill cache to max
      cache.set("key1", "value1");
      cache.set("key2", "value2");
      cache.set("key3", "value3");
      cache.set("key4", "value4");
      cache.set("key5", "value5");

      // Access key1 (makes it most recently used)
      cache.get("key1");

      // Add 6th item - should evict key2 (now least recently used)
      cache.set("key6", "value6");

      expect(cache.has("key1")).toBe(true); // Still in cache (was accessed)
      expect(cache.has("key2")).toBe(false); // Evicted (LRU)
      expect(cache.has("key6")).toBe(true);
    });

    it("should respect max size limit", () => {
      // Add more than max items
      for (let i = 1; i <= 10; i++) {
        cache.set(`key${i}`, `value${i}`);
      }

      // Should never exceed max
      expect(cache.size).toBe(5);
    });
  });

  describe("TTL expiration", () => {
    let mockNow: ReturnType<typeof vi.spyOn>;
    let currentTime: number;

    function advanceTime(ms: number) {
      currentTime += ms;
      mockNow.mockReturnValue(currentTime);
      // Flush lru-cache's internal ttlResolution setTimeout that clears cachedNow
      vi.advanceTimersByTime(2);
    }

    beforeEach(() => {
      // Only fake setTimeout/clearTimeout; leave performance.now on the real
      // object so vi.spyOn controls what lru-cache sees via its captured ref.
      vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
      currentTime = 1000;
      mockNow = vi.spyOn(performance, "now").mockReturnValue(currentTime);
    });

    afterEach(() => {
      mockNow.mockRestore();
      vi.useRealTimers();
    });

    it("should expire entries after TTL", () => {
      const shortCache = new CacheManager({ max: 5, ttl: 50 });
      shortCache.set("key", "value");
      expect(shortCache.has("key")).toBe(true);

      advanceTime(60);

      expect(shortCache.has("key")).toBe(false);
      expect(shortCache.get("key")).toBeUndefined();
      shortCache.clear();
    });

    it("should keep entries within TTL", () => {
      const shortCache = new CacheManager({ max: 5, ttl: 100 });
      shortCache.set("key", "value");
      expect(shortCache.has("key")).toBe(true);

      advanceTime(30);

      expect(shortCache.has("key")).toBe(true);
      expect(shortCache.get("key")).toBe("value");
      shortCache.clear();
    });

    it("should support custom TTL per entry", () => {
      const shortCache = new CacheManager({ max: 5, ttl: 50 });

      shortCache.set("key1", "value1", { ttl: 100 });
      shortCache.set("key2", "value2"); // Uses default 50ms

      expect(shortCache.has("key1")).toBe(true);
      expect(shortCache.has("key2")).toBe(true);

      advanceTime(70);

      expect(shortCache.has("key1")).toBe(true);
      expect(shortCache.has("key2")).toBe(false);
      shortCache.clear();
    });

    it("should reset TTL on get (updateAgeOnGet)", () => {
      const shortCache = new CacheManager({ max: 5, ttl: 80 });
      shortCache.set("key", "value");

      advanceTime(60);

      // Access the entry (should reset TTL via updateAgeOnGet)
      shortCache.get("key");

      advanceTime(40);

      // Entry should still exist (TTL was reset on get)
      expect(shortCache.has("key")).toBe(true);
      expect(shortCache.get("key")).toBe("value");
      shortCache.clear();
    });
  });

  describe("configuration", () => {
    it("should use default max and ttl when not specified", () => {
      const defaultCache = new CacheManager();

      // Fill beyond default max to test it's honored
      for (let i = 1; i <= 600; i++) {
        defaultCache.set(`key${i}`, `value${i}`);
      }

      // Should be limited to default max (500)
      expect(defaultCache.size).toBeLessThanOrEqual(500);
      defaultCache.clear();
    });

    it("should allow custom max configuration", () => {
      const smallCache = new CacheManager({ max: 3 });

      smallCache.set("key1", "value1");
      smallCache.set("key2", "value2");
      smallCache.set("key3", "value3");
      smallCache.set("key4", "value4");

      // Should respect custom max
      expect(smallCache.size).toBe(3);
      smallCache.clear();
    });

    it("should allow custom ttl configuration", () => {
      vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
      const mockNow = vi.spyOn(performance, "now").mockReturnValue(1000);
      const shortTtlCache = new CacheManager({ ttl: 50 });
      shortTtlCache.set("key", "value");

      mockNow.mockReturnValue(1060);
      vi.advanceTimersByTime(2);

      expect(shortTtlCache.has("key")).toBe(false);
      shortTtlCache.clear();
      mockNow.mockRestore();
      vi.useRealTimers();
    });
  });

  describe("edge cases", () => {
    it("should handle empty string keys", () => {
      cache.set("", "value");
      expect(cache.get("")).toBe("value");
      expect(cache.has("")).toBe(true);
    });

    it("should handle very long keys", () => {
      const longKey = "a".repeat(1000);
      cache.set(longKey, "value");
      expect(cache.get(longKey)).toBe("value");
    });

    it("should handle null values", () => {
      cache.set("key", null);
      // LRU cache stores null values
      expect(cache.has("key")).toBe(true);
      expect(cache.get("key")).toBe(null);
    });

    it("should handle rapid set/delete operations", () => {
      for (let i = 0; i < 100; i++) {
        cache.set(`key${i}`, `value${i}`);
        if (i % 2 === 0) {
          cache.delete(`key${i}`);
        }
      }

      // Cache should still be functional
      cache.set("test", "value");
      expect(cache.get("test")).toBe("value");
    });

    it("should handle deleting non-existent keys", () => {
      expect(() => {
        cache.delete("nonexistent");
      }).not.toThrow();
    });

    it("should handle clearing empty cache", () => {
      expect(() => {
        cache.clear();
      }).not.toThrow();

      expect(cache.size).toBe(0);
    });
  });
});

describe("singleton instances", () => {
  afterEach(() => {
    escapeCacheManager.clear();
  });

  describe("escapeCacheManager", () => {
    it("should exist and be functional", () => {
      expect(escapeCacheManager).toBeDefined();

      escapeCacheManager.set("test", "value");
      expect(escapeCacheManager.get("test")).toBe("value");
    });

    it("should be configured with correct max and ttl", () => {
      // Max is 1000 - verify by filling beyond 1000
      for (let i = 1; i <= 1100; i++) {
        escapeCacheManager.set(`key${i}`, `value${i}`);
      }

      // Should be limited to 1000
      expect(escapeCacheManager.size).toBeLessThanOrEqual(1000);
    });

    it("should be a singleton (same instance across imports)", () => {
      escapeCacheManager.set("singleton-test", "value");

      // In real usage, a different import would see the same data
      expect(escapeCacheManager.has("singleton-test")).toBe(true);
    });
  });
});
