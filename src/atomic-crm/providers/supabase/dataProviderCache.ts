import { LRUCache } from 'lru-cache';

export interface CacheOptions {
  max?: number;
  ttl?: number; // Time to live in milliseconds
}

export class CacheManager {
  private cache: LRUCache<string, any>;

  constructor(options: CacheOptions = {}) {
    this.cache = new LRUCache({
      max: options.max || 500,
      ttl: options.ttl || 60000, // Default 1 minute
      updateAgeOnGet: true,
    });
  }

  get(key: string): any | undefined {
    return this.cache.get(key);
  }

  set(key: string, value: any, options?: { ttl?: number }): void {
    this.cache.set(key, value, options);
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Get current size of the cache
   */
  get size(): number {
    return this.cache.size;
  }
}

/**
 * Singleton instance for data provider escape value caching
 * Replaces the Map-based cache with proper LRU eviction
 */
export const escapeCacheManager = new CacheManager({
  max: 1000,
  ttl: 300000, // 5 minutes TTL for escape values
});

/**
 * Singleton instance for general data provider caching
 */
export const dataProviderCache = new CacheManager({
  max: 500,
  ttl: 60000, // 1 minute default TTL
});
