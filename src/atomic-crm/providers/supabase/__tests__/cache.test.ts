import { describe, it, expect, beforeEach } from "vitest";
import { CacheManager } from "../dataProviderCache";

describe("CacheManager", () => {
  let cache: CacheManager;

  beforeEach(() => {
    cache = new CacheManager({ max: 100, ttl: 5000 });
  });

  it("should cache and retrieve values", () => {
    cache.set("key1", { data: "value1" });
    expect(cache.get("key1")).toEqual({ data: "value1" });
  });

  it("should return undefined for non-existent keys", () => {
    expect(cache.get("nonexistent")).toBeUndefined();
  });

  it("should return undefined for expired entries", async () => {
    cache.set("key2", { data: "value2" }, { ttl: 100 });

    // Wait for expiration
    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(cache.get("key2")).toBeUndefined();
  });

  it("should evict least recently used when max exceeded", () => {
    const smallCache = new CacheManager({ max: 2 });

    smallCache.set("a", 1);
    smallCache.set("b", 2);
    smallCache.set("c", 3); // Should evict 'a'

    expect(smallCache.get("a")).toBeUndefined();
    expect(smallCache.get("b")).toBe(2);
    expect(smallCache.get("c")).toBe(3);
  });

  it("should update age on get (LRU behavior)", () => {
    const smallCache = new CacheManager({ max: 2 });

    smallCache.set("a", 1);
    smallCache.set("b", 2);
    smallCache.get("a"); // Update 'a' age
    smallCache.set("c", 3); // Should evict 'b' (least recently used)

    expect(smallCache.get("a")).toBe(1);
    expect(smallCache.get("b")).toBeUndefined();
    expect(smallCache.get("c")).toBe(3);
  });

  it("should support has() method", () => {
    cache.set("key1", "value1");
    expect(cache.has("key1")).toBe(true);
    expect(cache.has("nonexistent")).toBe(false);
  });

  it("should support delete() method", () => {
    cache.set("key1", "value1");
    expect(cache.has("key1")).toBe(true);

    cache.delete("key1");
    expect(cache.has("key1")).toBe(false);
  });

  it("should support clear() method", () => {
    cache.set("key1", "value1");
    cache.set("key2", "value2");
    expect(cache.size).toBe(2);

    cache.clear();
    expect(cache.size).toBe(0);
    expect(cache.has("key1")).toBe(false);
    expect(cache.has("key2")).toBe(false);
  });

  it("should track cache size", () => {
    expect(cache.size).toBe(0);

    cache.set("key1", "value1");
    expect(cache.size).toBe(1);

    cache.set("key2", "value2");
    expect(cache.size).toBe(2);

    cache.delete("key1");
    expect(cache.size).toBe(1);
  });

  it("should handle custom TTL per entry", async () => {
    cache.set("short", "value1", { ttl: 100 });
    cache.set("long", "value2", { ttl: 5000 });

    // Wait for short TTL to expire
    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(cache.get("short")).toBeUndefined();
    expect(cache.get("long")).toBe("value2");
  });

  it("should use default TTL when not specified", async () => {
    const shortTTLCache = new CacheManager({ max: 100, ttl: 100 });
    shortTTLCache.set("key1", "value1"); // Uses default 100ms TTL

    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(shortTTLCache.get("key1")).toBeUndefined();
  });
});
