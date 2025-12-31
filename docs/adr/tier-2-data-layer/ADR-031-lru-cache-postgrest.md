# ADR-031: LRU Cache with TTL for PostgREST Escaping

## Status

**Accepted**

## Date

Original: 2024-12 | Documented: 2025-12-30

## Deciders

- krwhynot

---

## Context

PostgREST filter values require special character escaping to prevent injection and parsing errors. The `escapeForPostgREST()` utility function handles characters like `*`, `(`, `)`, `,`, `.`, and `"` that have special meaning in PostgREST filter syntax.

Performance analysis revealed:

1. **Repeated Escaping**: The same filter values (company names, search terms) are escaped repeatedly during list views, autocomplete, and reference fields.

2. **Regex Overhead**: Each escape operation involves multiple regex replacements, which adds up on hot paths like search-as-you-type.

3. **Session Locality**: Users tend to work with the same organizations and contacts within a session, creating temporal locality in escaped values.

4. **Memory Constraints**: Client-side caching must be bounded to avoid memory leaks in long-running sessions.

### Escape Function Example

```typescript
// Without caching, this runs 3x on every list request with filters
const escaped = escapeForPostgREST('O*Reilly & Sons (West)');
// → 'O\*Reilly & Sons \(West\)'

// Hot path: OrganizationInput autocomplete types "O'R" → "O'Re" → "O'Rei" → ...
// Each keystroke escapes the full value
```

### Alternatives Considered

| Alternative | Pros | Cons |
|------------|------|------|
| **No caching** | Simple, no memory overhead | Repeated work on hot paths |
| **Memoization (Map)** | Fast lookup | Unbounded growth, memory leak |
| **LRU cache** | Bounded memory, recent values fast | Complexity, eviction overhead |
| **LRU + TTL** | Bounded memory + time freshness | Slightly more complexity |
| **WeakMap** | Automatic GC | Only works with object keys |

---

## Decision

**Use an LRU cache with TTL** (via the `lru-cache` package) to cache escaped PostgREST filter values.

### Implementation

```typescript
// src/atomic-crm/providers/supabase/dataProviderCache.ts:1-59

import { LRUCache } from "lru-cache";

export interface CacheOptions {
  max?: number;
  ttl?: number; // Time to live in milliseconds
}

export class CacheManager {
  private cache: LRUCache<string, unknown>;

  constructor(options: CacheOptions = {}) {
    this.cache = new LRUCache({
      max: options.max || 500,      // Maximum 500 entries
      ttl: options.ttl || 60000,    // 1 minute TTL
      updateAgeOnGet: true,         // Refresh TTL on access
    });
  }

  get(key: string): unknown | undefined {
    return this.cache.get(key);
  }

  set(key: string, value: unknown, options?: { ttl?: number }): void {
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

  get size(): number {
    return this.cache.size;
  }
}
```

### Singleton Instance for PostgREST Escaping

```typescript
// src/atomic-crm/providers/supabase/dataProviderCache.ts:47-56

/**
 * Singleton instance for PostgREST escape value caching
 * Used by dataProviderUtils.escapeForPostgREST() to cache frequently escaped values
 *
 * Config: 1000 max entries, 5 minute TTL
 */
export const escapeCacheManager = new CacheManager({
  max: 1000,         // Higher limit for escape values (they're small strings)
  ttl: 300000,       // 5 minutes - balances memory with session length
});
```

### Cache Configuration Rationale

| Setting | Value | Rationale |
|---------|-------|-----------|
| `max` | 1000 | ~1000 unique filter values covers typical session diversity |
| `ttl` | 300000 (5 min) | Long enough for session locality, short enough to free memory |
| `updateAgeOnGet` | true | Frequently accessed values stay cached longer |

### updateAgeOnGet Behavior

```typescript
// Without updateAgeOnGet:
cache.set("key", "value");  // TTL starts at 60s
// After 30s...
cache.get("key");           // Returns value, but TTL still 30s remaining
// After 30s more...
cache.get("key");           // Returns undefined (expired)

// With updateAgeOnGet: true:
cache.set("key", "value");  // TTL starts at 60s
// After 30s...
cache.get("key");           // Returns value, TTL RESET to 60s
// After 30s more...
cache.get("key");           // Returns value (still valid, TTL reset again)
```

This is critical for PostgREST escaping because:
- Users repeatedly search for the same organizations
- Autocomplete fires on every keystroke
- Active values should never expire during use

---

## Consequences

### Positive

- **Reduced CPU on Hot Paths**: Autocomplete and search skip regex operations for cached values
- **Bounded Memory**: LRU eviction + TTL expiry prevent unbounded growth
- **Session-Optimized**: `updateAgeOnGet` keeps working set in cache
- **Simple Integration**: Single line change to `escapeForPostgREST()`

### Negative

- **Cache Invalidation**: If escape logic changes, cache serves stale values until TTL expires (unlikely scenario)
- **Memory Overhead**: Cache itself uses memory (minimal for string values)
- **Dependency**: Requires `lru-cache` package

### Neutral

- **Cache Miss Penalty**: First escape still has full cost
- **No Persistence**: Cache resets on page refresh (acceptable for filter values)

---

## Code Examples

### Correct Pattern - Using the Cache

```typescript
// src/atomic-crm/providers/supabase/dataProviderUtils.ts

import { escapeCacheManager } from "./dataProviderCache";

export function escapeForPostgREST(value: string): string {
  // Check cache first
  const cached = escapeCacheManager.get(value);
  if (cached !== undefined) {
    return cached as string;
  }

  // Expensive escape operation
  const escaped = value
    .replace(/\*/g, "\\*")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/,/g, "\\,")
    .replace(/\./g, "\\.")
    .replace(/"/g, '\\"');

  // Cache for next time
  escapeCacheManager.set(value, escaped);

  return escaped;
}
```

### Correct Pattern - Custom TTL for Specific Values

```typescript
// For values that should cache longer
escapeCacheManager.set(
  "frequently-used-company-name",
  escapedValue,
  { ttl: 600000 }  // 10 minutes for this specific entry
);
```

### Correct Pattern - Cache Metrics for Debugging

```typescript
// In development, monitor cache effectiveness
if (import.meta.env.DEV) {
  setInterval(() => {
    console.log(`[EscapeCache] Size: ${escapeCacheManager.size}/1000`);
  }, 30000);
}
```

### Anti-Pattern (NEVER DO THIS)

```typescript
// WRONG: Unbounded Map cache
const escapeCache = new Map<string, string>();

function escapeForPostgREST(value: string): string {
  if (escapeCache.has(value)) {
    return escapeCache.get(value)!;
  }
  const escaped = /* ... */;
  escapeCache.set(value, escaped);  // NEVER: Grows forever, memory leak
  return escaped;
}
```

```typescript
// WRONG: Caching at wrong granularity
const queryCache = new CacheManager({ max: 100 });

// NEVER: Cache entire query results, not just escape values
// React Admin/TanStack Query already handles query caching
queryCache.set(
  JSON.stringify(params),
  queryResult  // WRONG: Duplicates TanStack Query's job
);
```

```typescript
// WRONG: Not using updateAgeOnGet for active values
const cache = new LRUCache({
  max: 500,
  ttl: 60000,
  updateAgeOnGet: false,  // WRONG for filter values
});
// Active filters expire even while user is working
```

---

## Operations That Benefit

| Operation | Why Cache Helps |
|-----------|-----------------|
| **Search autocomplete** | Same prefix escaped on every keystroke |
| **Organization filters** | Users work with same orgs repeatedly |
| **Contact reference fields** | Same names appear in multiple opportunities |
| **getList with q filter** | Full-text search terms escaped on each request |

---

## Related ADRs

- **[ADR-001: Unified Data Provider Entry Point](./ADR-001-unified-data-provider.md)** - Where escape function is called
- **[ADR-009: Composed Data Provider Pattern](./ADR-009-composed-data-provider.md)** - Handler routing that uses filters

---

## References

- Cache Implementation: `src/atomic-crm/providers/supabase/dataProviderCache.ts`
- Escape Utility: `src/atomic-crm/providers/supabase/dataProviderUtils.ts`
- lru-cache Package: https://github.com/isaacs/node-lru-cache
- PostgREST Operators: https://postgrest.org/en/stable/references/api/tables_views.html#operators
