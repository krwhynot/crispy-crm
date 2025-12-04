# ADR: Utility Libraries - Industry Standards & Best Practices

**Status:** Accepted
**Date:** 2025-12-03
**Category:** Technical Standards
**Last Updated:** 2025-12-03 (Enhanced with Ref MCP research)

## Context

This document captures industry standards, best practices, and must-follow guidelines for the utility libraries used in Crispy CRM. These standards ensure consistent, performant, and accessible implementations across the codebase.

## Utilities Stack Overview

| Technology | Version | Purpose             | Bundle Size (minzipped) |
|------------|---------|---------------------|-------------------------|
| date-fns   | 4.1.0   | Date manipulation   | Tree-shakeable          |
| lodash     | 4.17.21 | General utilities   | ~70KB (full) / tree-shakeable |
| LRU Cache  | 11.2.2  | In-memory caching   | ~8KB                    |
| cmdk       | 1.1.1   | Command palette     | ~5KB                    |
| sonner     | 2.0.7   | Toast notifications | ~4KB                    |
| vaul       | 1.1.2   | Drawer component    | ~5KB                    |

---

## 1. date-fns (v4.1.0)

### Overview
Modern JavaScript date utility library emphasizing modularity, immutability, and internationalization. Version 4.0 (released September 2024) introduced **first-class time zone support** via `@date-fns/tz` and `@date-fns/utc` packages.

### Industry Standards & Best Practices

#### MUST-FOLLOW

1. **Use ESM imports** - v4 is ESM-first; import individual functions for tree-shaking
   ```typescript
   // ✅ CORRECT
   import { format, addDays } from 'date-fns';

   // ❌ WRONG - imports entire library
   import * as dateFns from 'date-fns';
   ```

2. **Use `TZDate` or `UTCDate` for timezone-aware operations**
   ```typescript
   import { TZDate } from '@date-fns/tz';
   import { addHours } from 'date-fns';

   // System timezone may cause DST issues:
   const date = new Date(2022, 2, 13);
   addHours(date, 2).toString();
   //=> 'Sun Mar 13 2022 03:00:00 GMT-0700' (DST skip!)

   // TZDate provides correct calculation:
   const tzDate = new TZDate(2022, 2, 13, 'Asia/Singapore');
   addHours(tzDate, 2).toString();
   //=> 'Sun Mar 13 2022 02:00:00 GMT+0800' (correct!)
   ```

3. **Understand timezone mixing behavior** - date-fns normalizes to the first object argument's timezone
   ```typescript
   import { TZDate } from '@date-fns/tz';
   import { differenceInBusinessDays } from 'date-fns';

   const singapore = new TZDate(2025, 0, 1, 'Asia/Singapore');
   const newYork = new TZDate(2024, 0, 1, 'America/New_York');

   // Calculates in Asia/Singapore context
   differenceInBusinessDays(singapore, newYork); //=> 262

   // Calculates in America/New_York context (1 day difference!)
   differenceInBusinessDays(newYork, singapore); //=> -261
   ```

4. **Use the `in` option for explicit timezone control**
   ```typescript
   import { tz } from '@date-fns/tz';
   import { differenceInBusinessDays } from 'date-fns';

   // Force calculation in specific timezone regardless of input types
   differenceInBusinessDays(laterDate, earlierDate, {
     in: tz('America/Los_Angeles'),
   });
   ```

5. **Immutability** - All functions return new Date objects; never mutate input

#### Bundle Size Reference

| Package | Size (minzipped) |
|---------|------------------|
| `TZDateMini` | 761 bytes |
| `UTCDateMini` | 239 bytes |
| Individual functions | ~200-500 bytes each |

#### SHOULD-FOLLOW
- Prefer `parseISO()` over `new Date()` for ISO string parsing
- Use `isValid()` to check date validity before operations
- Leverage locale support for internationalized formatting
- Use `formatDistanceToNow()` for human-readable relative times
- Use `withTimeZone()` method to convert between timezones

#### Anti-Patterns to Avoid
- ❌ Mixing `moment.js` and `date-fns` in the same codebase
- ❌ Using JavaScript's native `Date` constructor for parsing strings
- ❌ Ignoring timezone context when dealing with user-facing dates
- ❌ Using deprecated `date-fns-tz` package (use `@date-fns/tz` instead)
- ❌ Assuming timezone consistency when mixing Date types

### References
- [date-fns v4.0 Changelog](https://date-fns.org/v4.1.0/docs/Change-Log#v4.0.0-2024-09-16)
- [date-fns Time Zones Documentation](https://date-fns.org/v4.1.0/docs/Time-Zones)
- [date-fns Official Documentation](https://date-fns.org/)
- [@date-fns/tz GitHub](https://github.com/date-fns/tz)
- [@date-fns/utc GitHub](https://github.com/date-fns/utc)

---

## 2. lodash (v4.17.21) & es-toolkit Migration

### Overview
General-purpose utility library. While widely used, **es-toolkit** offers a modern alternative with 97% smaller bundle sizes and 2-3x faster performance while maintaining API compatibility.

### Industry Standards & Best Practices

#### MUST-FOLLOW

1. **Use `lodash-es` for tree-shaking** (or individual imports)
   ```typescript
   // ✅ CORRECT - allows tree-shaking
   import { debounce, throttle } from 'lodash-es';

   // ✅ ALSO CORRECT - direct imports
   import debounce from 'lodash/debounce';

   // ❌ WRONG - imports entire 70KB library
   import _ from 'lodash';
   ```

2. **Prefer native JavaScript methods when available**
   ```typescript
   // ✅ Native (ES2019+)
   array.flat();
   array.flatMap(fn);
   Object.fromEntries();
   array.find(predicate);
   array.findIndex(predicate);
   array.includes(item);
   structuredClone(obj);        // Deep clone (ES2022)

   // ❌ Unnecessary lodash
   _.flatten(array);
   _.flatMap(array, fn);
   _.fromPairs(entries);
   _.find(array, predicate);
   _.findIndex(array, predicate);
   _.includes(array, item);
   _.cloneDeep(obj);            // Use structuredClone instead
   ```

3. **Reserve lodash for genuinely complex utilities**
   - `debounce` / `throttle` (with options like `leading`, `trailing`, `maxWait`)
   - `cloneDeep` (only for objects with circular refs or special types)
   - `merge` / `mergeWith` (deep object merging with customization)
   - `get` / `set` (safe nested property access with defaults)
   - `groupBy` / `keyBy` (until native `Object.groupBy` has wider support)

#### es-toolkit Migration Guide

**es-toolkit provides 100% lodash compatibility** via `es-toolkit/compat`:

```typescript
// Drop-in replacement for lodash
import { chunk } from 'es-toolkit/compat';

chunk([1, 2, 3, 4], 0);
// Returns [], identical to lodash behavior
```

**Migration Strategy:**
1. **Phase 1**: Replace `lodash` with `es-toolkit/compat` (identical API)
2. **Phase 2**: Migrate to `es-toolkit` core for optimal performance
3. **Phase 3**: Replace remaining utilities with native methods

**Compatibility Guarantees:**
- ✅ 100% feature parity with lodash test cases
- ✅ Type-compatible with `@types/lodash`
- ⚠️ Slight performance overhead vs core `es-toolkit`
- ❌ No support for: implicit type coercion, `_.chain()`, modified prototypes

#### Performance Comparison: es-toolkit vs lodash

| Function   | es-toolkit | lodash-es  | Reduction |
|------------|------------|------------|-----------|
| `debounce` | 531 bytes  | 2,873 bytes | **-81.5%** |
| `throttle` | 764 bytes  | 3,111 bytes | **-75.4%** |
| `pick`     | 132 bytes  | 9,520 bytes | **-98.6%** |
| `difference` | 90 bytes | 7,985 bytes | **-98.8%** |
| `merge`    | 425 bytes  | 6,523 bytes | **-93.5%** |
| `chunk`    | 238 bytes  | 4,156 bytes | **-94.3%** |
| `isPlainObject` | 78 bytes | 3,201 bytes | **-97.6%** |

#### SHOULD-FOLLOW
- Consider migrating to `es-toolkit` for **97% smaller bundle size** and **2-3x faster performance**
- Use TypeScript-aware alternatives when types matter
- Document lodash usage with comments explaining why native isn't suitable
- Prefer `es-toolkit/compat` for seamless migration

#### Anti-Patterns to Avoid
- ❌ Using lodash for simple operations available natively
- ❌ Importing the entire lodash library
- ❌ Using `_.chain()` (breaks tree-shaking, not supported in es-toolkit)
- ❌ Relying on implicit type coercion behavior
- ❌ Using sorted-specific methods (`sortedUniq`, etc.) without sorted data

### References
- [Lodash Documentation](https://lodash.com/docs/4.17.15)
- [es-toolkit - Modern Alternative](https://github.com/toss/es-toolkit)
- [es-toolkit Compatibility Guide](https://es-toolkit.slash.page/reference/compat.html)
- [es-toolkit Bundle Size Comparison](https://github.com/toss/es-toolkit/blob/main/docs/bundle-size.md)

---

## 3. LRU Cache (v11.2.2)

### Overview
High-performance Least Recently Used cache by Isaac Z. Schlueter. Automatically evicts least-recently-used items when capacity is reached. Optimized for recency-based caching, not time-based expiration.

### Industry Standards & Best Practices

#### MUST-FOLLOW

1. **Always set `max` size** - Required to prevent memory leaks
   ```typescript
   import { LRUCache } from 'lru-cache';

   const cache = new LRUCache<string, CacheEntry>({
     max: 1000,  // Required for bounded memory
   });
   ```

2. **Use `maxSize` + `sizeCalculation` for memory-based limits**
   ```typescript
   const cache = new LRUCache({
     maxSize: 50 * 1024 * 1024, // 50MB
     sizeCalculation: (value) => JSON.stringify(value).length,
   });
   ```

3. **Minimize feature usage for performance** - Per Isaac Z. Schlueter:
   > "Do not use a dispose function, size tracking, or especially ttl behavior, unless absolutely needed."

4. **Use `@isaacs/ttlcache` for TTL-primary caching**
   - LRU Cache is optimized for recency, not expiration
   - No preemptive pruning of expired items by default
   - TTL adds significant overhead

5. **Implement Stale-While-Revalidate pattern correctly**
   ```typescript
   const cache = new LRUCache({
     max: 1000,
     ttl: 1000 * 60 * 5, // 5 minutes
     allowStale: true,   // Return stale while refreshing

     // Async fetch for cache misses
     fetchMethod: async (key, staleValue, { signal }) => {
       const response = await fetch(`/api/data/${key}`, { signal });
       return response.json();
     },
   });

   // Usage: returns cached value, refreshes in background if stale
   const data = await cache.fetch('my-key');
   ```

#### SHOULD-FOLLOW
- Use `fetchMethod` for transparent cache-through pattern
- Implement `dispose` callback for cleanup of evicted values (connections, handles)
- Call `clear()` when cache is no longer needed (GC assistance)
- Use `noDisposeOnSet: true` if replacing values shouldn't trigger dispose
- Consider `updateAgeOnHas: false` to not refresh TTL on `has()` checks

#### Configuration Options Reference

| Option | Purpose | Default | Performance Impact |
|--------|---------|---------|-------------------|
| `max` | Maximum number of items | Required | Low |
| `maxSize` | Maximum total size (with sizeCalculation) | Infinity | Medium |
| `ttl` | Time-to-live in milliseconds | 0 (disabled) | **High** |
| `allowStale` | Return stale items while revalidating | false | Low |
| `updateAgeOnGet` | Reset TTL on access | false | Medium |
| `updateAgeOnHas` | Reset TTL on has() check | false | Medium |
| `dispose` | Callback when items are evicted | undefined | Low |
| `fetchMethod` | Async function for cache misses | undefined | Low |
| `noDisposeOnSet` | Don't call dispose when overwriting | false | Low |

#### Cache Pattern Decision Tree

```
Need caching?
├── Primary concern is TTL/expiration?
│   └── Use @isaacs/ttlcache
├── Primary concern is memory/recency?
│   └── Use lru-cache
│       ├── Need async loading?
│       │   └── Use fetchMethod
│       ├── Need stale-while-revalidate?
│       │   └── Use allowStale + fetchMethod
│       └── Need size-based eviction?
│           └── Use maxSize + sizeCalculation
└── Need distributed caching?
    └── Use Redis/Memcached
```

#### Anti-Patterns to Avoid
- ❌ Using LRU Cache as a pure TTL cache (use `@isaacs/ttlcache` instead)
- ❌ Forgetting to set `max` (unbounded memory growth)
- ❌ Using `setTimeout` per-item for expiration (performance killer)
- ❌ Storing circular references without custom serialization
- ❌ Using TTL without understanding the performance cost
- ❌ Calling `get()` in a loop without caching the result

### References
- [lru-cache npm](https://www.npmjs.com/package/lru-cache)
- [isaacs/node-lru-cache GitHub](https://github.com/isaacs/node-lru-cache)
- [@isaacs/ttlcache](https://www.npmjs.com/package/@isaacs/ttlcache)
- [Cachified Integration Example](https://github.com/epicweb-dev/cachified)
- [Supabase Cache Helpers SWR Pattern](https://github.com/psteinroe/supabase-cache-helpers)

---

## 4. cmdk (v1.1.1)

### Overview
Command menu React component that functions as an accessible combobox. Provides automatic filtering, sorting, and keyboard navigation. Built by Paco Coursey and used in Vercel's products. Composes Radix UI Dialog for modal behavior.

### Industry Standards & Best Practices

#### MUST-FOLLOW

1. **Always provide accessible labels**
   ```tsx
   <Command label="Command Menu">
     <Command.Input placeholder="Type a command..." />
     <Command.List>
       <Command.Empty>No results found.</Command.Empty>
       {/* items */}
     </Command.List>
   </Command>
   ```

2. **Use unique `value` props for items** - Values are automatically trimmed
   ```tsx
   <Command.Item value="unique-id" key="unique-id">
     Display Text
   </Command.Item>
   ```

3. **Implement keyboard shortcut with proper platform detection**
   ```tsx
   React.useEffect(() => {
     const down = (e: KeyboardEvent) => {
       if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
         e.preventDefault();
         setOpen((open) => !open);
       }
     };
     document.addEventListener('keydown', down);
     return () => document.removeEventListener('keydown', down);
   }, []);
   ```

4. **Use `Command.Dialog` for modal palettes** (built on Radix UI Dialog)
   ```tsx
   <Command.Dialog open={open} onOpenChange={setOpen} label="Global Command Menu">
     {/* ... */}
   </Command.Dialog>
   ```

5. **Prevent hydration mismatch** - Always start with `open={false}` on server

#### Advanced Patterns

**Nested Pages Navigation:**
```tsx
const [pages, setPages] = React.useState<string[]>([]);
const page = pages[pages.length - 1];

<Command
  onKeyDown={(e) => {
    // Escape or Backspace (when empty) goes back
    if (e.key === 'Escape' || (e.key === 'Backspace' && !search)) {
      e.preventDefault();
      setPages((pages) => pages.slice(0, -1));
    }
  }}
>
  {!page && (
    <Command.Item onSelect={() => setPages([...pages, 'settings'])}>
      Settings...
    </Command.Item>
  )}
  {page === 'settings' && (
    <>
      <Command.Item>Theme</Command.Item>
      <Command.Item>Account</Command.Item>
    </>
  )}
</Command>
```

**Enhanced Search with Keywords:**
```tsx
<Command.Item value="settings" keywords={['preferences', 'options', 'config']}>
  Settings
</Command.Item>
```

**Custom Filtering:**
```tsx
<Command
  filter={(value, search, keywords) => {
    const extendValue = value + ' ' + keywords.join(' ');
    if (extendValue.includes(search)) return 1;
    return 0;
  }}
/>
```

**Conditional Sub-Items:**
```tsx
const SubItem = (props) => {
  const search = useCommandState((state) => state.search);
  if (!search) return null; // Only show when searching
  return <Command.Item {...props} />;
};
```

#### SHOULD-FOLLOW
- Use `loop` prop for circular navigation at list boundaries
- Implement loading states with `Command.Loading`
- Use `Command.Group` with `heading` for organized sections
- Animate list height using `--cmdk-list-height` CSS variable
- Use `scroll-padding` for better edge scrolling behavior

#### CSS Customization

```css
[cmdk-list] {
  min-height: 300px;
  height: var(--cmdk-list-height);
  max-height: 500px;
  transition: height 100ms ease;
  scroll-padding-block: 8px; /* Scroll padding for edges */
}

[cmdk-item][data-selected="true"] {
  background: var(--accent);
}

[cmdk-group-heading] {
  font-size: 0.75rem;
  color: var(--muted-foreground);
}
```

#### Accessibility Requirements
- ✅ ARIA attributes automatically managed
- ✅ Screen reader tested (Voice Over, NVDA)
- ✅ Full keyboard navigation
- ✅ Focus trapped when used in Dialog
- ⚠️ Provide visible trigger button (not just keyboard shortcut)
- ⚠️ `Command.Dialog` required for proper focus management

#### Performance Considerations
- Good performance up to 2,000-3,000 items
- Use `shouldFilter={false}` + custom virtualization for larger lists
- Bring your own filtering with `filter` prop for complex matching
- Groups are hidden via `[hidden]` attribute, not unmounted (CSS consideration)

#### Anti-Patterns to Avoid
- ❌ Opening dialog on server render (hydration mismatch)
- ❌ Missing `key` props on items
- ❌ Overloading common shortcuts (Ctrl+S, Ctrl+C, Ctrl+V)
- ❌ Using without visible trigger (accessibility issue)
- ❌ Forgetting to handle Escape for nested pages
- ❌ Using `_.chain()` patterns (incompatible with tree-shaking)

### References
- [cmdk GitHub](https://github.com/pacocoursey/cmdk)
- [cmdk Architecture](https://github.com/pacocoursey/cmdk/blob/main/ARCHITECTURE.md)
- [Radix UI Dialog](https://www.radix-ui.com/docs/primitives/components/dialog)
- [Command Palette UX Patterns](https://uxpatterns.dev/patterns/advanced/command-palette)

---

## 5. sonner (v2.0.7)

### Overview
Toast notification library by Emil Kowalski. Provides a simple API for rendering non-intrusive status messages with accessibility built-in. Uses `aria-live` regions for screen reader announcements.

### Industry Standards & Best Practices

#### MUST-FOLLOW (Accessibility - WCAG Compliance)

1. **Understand ARIA live region behavior**
   - Sonner uses `role="status"` with `aria-live="polite"` by default
   - Screen readers announce after current speech completes
   - For urgent notifications, consider `aria-live="assertive"` (interrupts)

2. **Provide sufficient display duration** (WCAG 2.2.1 - Timing Adjustable)
   ```tsx
   // ✅ CORRECT - 5 seconds minimum for actionable toasts
   toast('Message saved', { duration: 5000 });

   // ✅ Persist toasts with actions
   toast('Confirm deletion?', {
     duration: Infinity,
     action: { label: 'Undo', onClick: handleUndo },
   });

   // ❌ WRONG - too short for users to read
   toast('Important message', { duration: 2000 });
   ```

3. **Customize ARIA labels for internationalization**
   ```tsx
   <Toaster
     containerAriaLabel="Notifications"  // Container label
     toastOptions={{
       closeButtonAriaLabel: 'Close'     // Close button label
     }}
   />

   // Example in Finnish
   <Toaster
     containerAriaLabel="Ilmoitukset"
     toastOptions={{ closeButtonAriaLabel: 'Sulje' }}
   />
   ```

4. **Use semantic toast types appropriately**
   ```tsx
   toast.success('Saved!');       // Checkmark icon, positive
   toast.error('Failed!');        // Error icon, negative
   toast.warning('Careful!');     // Warning icon, caution
   toast.info('Note:');           // Info icon, neutral
   toast.loading('Saving...');    // Spinner, in-progress
   toast.promise(asyncFn, {...}); // Auto-transitions through states
   ```

#### WCAG Requirements for Toasts

| Requirement | WCAG Standard | Implementation |
|-------------|---------------|----------------|
| Screen reader announcement | 4.1.3 Status Messages | `role="status"` + `aria-live="polite"` |
| Timing adjustable | 2.2.1 Timing Adjustable | Min 5s duration, pause on hover |
| Color contrast | 1.4.3 Contrast (Minimum) | 4.5:1 ratio for text |
| Non-blocking | 2.2.4 Interruptions | Don't block user actions |
| Keyboard dismissible | 2.1.1 Keyboard | Escape key support |

#### ARIA Live Region Reference

| Type | `aria-live` | Use Case |
|------|-------------|----------|
| Polite | `polite` | Success messages, non-urgent updates |
| Assertive | `assertive` | Errors requiring immediate attention |
| Off | `off` | Silenced (avoid) |

#### SHOULD-FOLLOW
- Use `toast.promise()` for async operations with loading states
  ```tsx
  toast.promise(saveData(), {
    loading: 'Saving...',
    success: 'Saved successfully!',
    error: 'Failed to save',
  });
  ```
- Implement `onDismiss` / `onAutoClose` callbacks for analytics
- Keep messages under 3 lines (concise, at-a-glance)
- Position consistently (default: `bottom-right`)
- Use `toast.dismiss(id)` for programmatic dismissal
- Add close button for toasts with actions (`closeButton: true`)

#### Toast Content Guidelines

| ✅ DO | ❌ DON'T |
|-------|---------|
| "Contact saved" | "The contact has been successfully saved to the database" |
| "Upload failed" | "Error: UPLOAD_FAILED_NETWORK_TIMEOUT_EXCEPTION" |
| Short, scannable | Long paragraphs |
| Action-oriented | Technical jargon |

#### Anti-Patterns to Avoid
- ❌ Using toasts for critical information requiring acknowledgment (use dialogs)
- ❌ Displaying multiple simultaneous toasts (overwhelming)
- ❌ Auto-dismissing toasts with required actions
- ❌ Duration under 4 seconds (users can't read)
- ❌ Using toasts for errors that need resolution steps
- ❌ Toasts that block UI interaction
- ❌ Missing close button on persistent toasts

### References
- [Sonner GitHub](https://github.com/emilkowalski/sonner)
- [Sonner Documentation](https://sonner.emilkowal.ski/)
- [WCAG 4.1.3 Status Messages](https://www.w3.org/WAI/WCAG21/Understanding/status-messages.html)
- [A Toast to Accessible Toasts - Scott O'Hara](https://www.scottohara.me/blog/2019/07/08/a-toast-to-a11y-toasts.html)
- [Toast Notifications UX Best Practices - LogRocket](https://blog.logrocket.com/ux-design/toast-notifications/)

---

## 6. vaul (v1.1.2)

### Overview
Drawer component for React by Emil Kowalski. Rebuilt from scratch in 2024 (v1.0) with improved accessibility and touch gesture support. Built on Radix UI primitives for proper focus management.

### Industry Standards & Best Practices

#### MUST-FOLLOW

1. **Always include Title and Description for accessibility**
   ```tsx
   <Drawer.Root>
     <Drawer.Trigger>Open</Drawer.Trigger>
     <Drawer.Portal>
       <Drawer.Overlay />
       <Drawer.Content>
         <Drawer.Title>Settings</Drawer.Title>
         <Drawer.Description>Adjust your preferences</Drawer.Description>
         {/* Content */}
       </Drawer.Content>
     </Drawer.Portal>
   </Drawer.Root>
   ```

2. **Include Overlay for proper focus management**
   - Overlay provides backdrop and click-outside-to-close
   - Required for modal behavior and focus trapping
   - Focus is automatically trapped within the drawer

3. **Understand Radix UI focus management integration**
   - Focus moves into drawer when opened
   - Focus returns to trigger when closed
   - Tab key cycles through focusable elements within drawer
   - Escape key closes drawer

4. **Use controlled state for complex interactions**
   ```tsx
   const [open, setOpen] = useState(false);

   <Drawer.Root open={open} onOpenChange={setOpen}>
     {/* ... */}
   </Drawer.Root>
   ```

#### Advanced Patterns

**Multi-Stop Snap Points:**
```tsx
<Drawer.Root snapPoints={[0.25, 0.5, 1]}>
  <Drawer.Content>
    {/* Drawer stops at 25%, 50%, and 100% of viewport */}
  </Drawer.Content>
</Drawer.Root>
```

**Directional Drawers:**
```tsx
// Bottom (default), top, left, or right
<Drawer.Root direction="right">
  <Drawer.Content className="fixed right-0 h-full w-80">
    {/* Side drawer content */}
  </Drawer.Content>
</Drawer.Root>
```

**Nested Drawers:**
```tsx
<Drawer.Root>
  <Drawer.Content>
    <Drawer.NestedRoot>
      <Drawer.Trigger>Open Nested</Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay />
        <Drawer.Content>
          {/* Nested content */}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.NestedRoot>
  </Drawer.Content>
</Drawer.Root>
```

#### Configuration Options

| Prop | Purpose | Default |
|------|---------|---------|
| `snapPoints` | Array of stop positions (0-1) | undefined |
| `direction` | Opening direction (`bottom`, `top`, `left`, `right`) | `bottom` |
| `modal` | Enable modal behavior (focus trap, overlay) | true |
| `shouldScaleBackground` | Scale background when open (app-like feel) | true |
| `noBodyStyles` | Disable body style injection | false |
| `dismissible` | Allow swipe/click to close | true |
| `handleOnly` | Only allow drag from handle | false |
| `activeSnapPoint` | Controlled snap point | undefined |

#### Accessibility Checklist

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| Labeled region | `Drawer.Title` sets `aria-labelledby` | ✅ Auto |
| Described region | `Drawer.Description` sets `aria-describedby` | ✅ Auto |
| Focus trap | Modal mode traps focus | ✅ Auto |
| Escape to close | Keyboard dismiss | ✅ Auto |
| Focus restoration | Returns to trigger on close | ✅ Auto |
| Screen reader | Announces drawer open/close | ✅ Auto |

#### Mobile/Touch Considerations
- Drawer responds to touch gestures (swipe to close)
- Snap points create natural stopping positions
- Consider thumb-reachable close button placement (bottom of drawer)
- Test on actual devices for gesture responsiveness
- Use `handleOnly` for content with scrollable areas
- 44×44px minimum touch target for close button (`h-11 w-11`)

#### Anti-Patterns to Avoid
- ❌ Missing `Drawer.Title` (accessibility violation, screen readers)
- ❌ Using without `Drawer.Overlay` (no focus trap)
- ❌ Putting critical content below fold without snap points
- ❌ Ignoring `shouldScaleBackground` on mobile apps
- ❌ Nested scrollable content without `handleOnly`
- ❌ Small close/action buttons (< 44px touch target)

### References
- [Vaul GitHub](https://github.com/emilkowalski/vaul)
- [Vaul Documentation](https://vaul.emilkowal.ski/)
- [Radix UI Accessibility - Focus Management](https://www.radix-ui.com/primitives/docs/overview/accessibility)
- [Emil Kowalski's Vaul 1.0 Announcement](https://x.com/emilkowalski_/status/1839340372327305536)

---

## Summary: Quick Reference Card

### Bundle Size Priority
1. **Smallest**: Individual function imports (date-fns, lodash-es)
2. **Consider**: es-toolkit as lodash replacement (97% smaller)
3. **Watch**: LRU Cache TTL features add overhead
4. **Minimal**: TZDateMini (761B) for timezone operations

### Accessibility Checklist
- [ ] cmdk: Visible trigger + keyboard shortcut + `label` prop
- [ ] sonner: 5+ second duration for actionable toasts + ARIA labels
- [ ] vaul: Title + Description always present + Overlay for focus trap
- [ ] All: Escape key support for dismissal
- [ ] All: 44×44px minimum touch targets

### Performance Guidelines

| Library | Performance Limit | Recommendation |
|---------|-------------------|----------------|
| cmdk | 2,000-3,000 items | Virtualize beyond |
| LRU Cache | Memory-bounded | Always set `max`, avoid TTL if possible |
| lodash | Bundle size | Use lodash-es → migrate to es-toolkit |
| date-fns | Tree-shaking | Import individual functions only |

### Migration Priorities

| From | To | Effort | Impact |
|------|-----|--------|--------|
| `lodash` | `es-toolkit/compat` | Low | High (97% bundle reduction) |
| `date-fns-tz` | `@date-fns/tz` | Medium | Required for v4 |
| LRU TTL patterns | `@isaacs/ttlcache` | Low | Better TTL performance |

### Integration with Crispy CRM Design System

All UI utilities (cmdk, sonner, vaul) should use semantic Tailwind colors:
- `bg-primary` / `text-primary-foreground` for actions
- `bg-destructive` for error toasts
- `bg-muted` for neutral states
- `text-muted-foreground` for secondary text
- 44×44px minimum touch targets (`h-11 w-11`)

---

## Decision

Adopt these standards for all utility library usage in Crispy CRM. Code reviews should verify compliance with MUST-FOLLOW items. Consider migration to es-toolkit as a high-priority improvement.

## Consequences

**Positive:**
- Consistent, accessible implementations
- Optimal bundle sizes (potential 97% reduction with es-toolkit)
- Better performance through proper configuration
- WCAG 2.1 AA compliance for notifications and modals
- Proper timezone handling preventing DST bugs

**Negative:**
- Requires developer awareness of standards
- May require refactoring existing code
- es-toolkit migration requires testing

**Neutral:**
- Migration from lodash to es-toolkit can be gradual via compat layer
- date-fns v4 timezone changes require code review
