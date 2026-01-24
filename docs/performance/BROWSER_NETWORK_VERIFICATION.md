# Browser Network Verification Guide

Quick reference for verifying network optimizations in Chrome/Firefox DevTools.

## Quick Start

```bash
# Start dev server (already running at http://localhost:5173)
just dev
```

**Open DevTools:** `F12` or `Ctrl+Shift+I`

## Opportunities Filter Verification (P0-PERF-2)

**Goal:** Verify 2 parallel requests instead of 3 sequential

### Steps

1. **Navigate to Network Tab**
   - Click "Network" tab in DevTools
   - Check "Fetch/XHR" filter
   - Click 🚫 (Clear) to reset

2. **Trigger Filter Load**
   - Click "Opportunities" in sidebar
   - Filter panel loads on left side

3. **Inspect Waterfall**
   - Look at the "Waterfall" column (timing bars)
   - Check request order and timing

### Expected Results

✅ **PASS - Optimized Pattern:**

```
organizations           ━━━━━━ (200ms, starts immediately)
distinct_opportunities  ━━━━━━ (200ms, starts immediately)
                        └─ Both bars start at same time (parallel)
```

**Request Details (click to expand):**

**organizations:**
- URL: `/rest/v1/organizations?organization_type=in.(principal,prospect,customer)&deleted_at=is.null`
- Size: ~20KB
- Status: 200

**distinct_opportunities_campaigns:**
- URL: `/rest/v1/distinct_opportunities_campaigns`
- Size: ~5KB
- Status: 200 (from cache after first visit)

---

❌ **FAIL - N+1 Pattern:**

```
organizations (principals)  ━━━━━━ (200ms)
  organizations (customers)       ━━━━━━ (200ms, waits for first)
    opportunities (campaigns)           ━━━━━━ (200ms, waits for second)
                                        └─ Staircase pattern (sequential)
```

**Total time:** 600ms vs 200ms

### Cache Verification

**Test caching:**
1. Load Opportunities page → Note network requests
2. Navigate away (click "Contacts")
3. Return to Opportunities (click "Opportunities")
4. Check Network tab

**Expected:** `distinct_opportunities_campaigns` shows **(from cache)** or **304 Not Modified**

## Common Issues

### Issue: Seeing 3+ requests

**Symptom:**
```
organizations (principals)
organizations (customers)
opportunities_summary
```

**Diagnosis:** Code regressed to old pattern

**Fix:** Check `OpportunityListFilter.tsx` lines 34-58

---

### Issue: Large payload (>100KB)

**Symptom:** `opportunities` or `opportunities_summary` request is huge

**Diagnosis:** Fetching full opportunity list instead of distinct view

**Fix:** Verify `distinct_opportunities_campaigns` view is being used (line 115)

---

### Issue: Sequential waterfall

**Symptom:** Requests happen one after another (staircase)

**Diagnosis:** React Query dependencies or conditional hooks

**Fix:** Ensure both `useGetList` calls are unconditional and not dependent

## Performance Metrics

### Acceptable Thresholds

| Metric | Target | Red Flag |
|--------|--------|----------|
| **Request Count** | ≤ 3 | > 3 |
| **Total Time** | ≤ 300ms | > 500ms |
| **Total Size** | ≤ 50KB | > 100KB |
| **Parallelization** | All simultaneous | Any sequential |

### How to Measure

**Total Time:**
- Right-click on last request → "Copy as HAR"
- Or: Look at "DOMContentLoaded" event in timeline

**Total Size:**
- Bottom of Network tab shows total transferred
- Filter by "Fetch/XHR" for API-only total

**Parallelization:**
- Look at Waterfall column
- All bars should start at roughly the same X position

## DevTools Tips

### Filter Shortcuts

```
# Show only API calls
domain:localhost/rest

# Show only large requests
larger-than:50kb

# Show only slow requests
latency:>500
```

### Network Throttling

**Test on slow connections:**
1. Click "No throttling" dropdown
2. Select "Fast 3G" or "Slow 3G"
3. Reload page

**Expected:** Optimization benefits more visible on slow connections

### Timeline View

**Enable:**
1. Network tab → Click ⚙️ (settings gear)
2. Check "Show overview"

**Use:**
- Blue line = DOMContentLoaded
- Red line = Load event
- Hover over requests to see blocking relationships

## Verification Checklist

Use this when verifying any network optimization:

- [ ] DevTools Network tab open
- [ ] Fetch/XHR filter enabled
- [ ] Network cleared before navigation
- [ ] Noted initial request count
- [ ] Checked for parallel vs sequential
- [ ] Verified payload sizes
- [ ] Tested cache behavior (second visit)
- [ ] No console errors during load

## Screenshots

**Good Optimization:**

```
|organizations               |━━━━━━|
|distinct_opportunities_camps|━━━━━━|
    ↑ Both start at ~0ms (parallel)
```

**Bad N+1 Pattern:**

```
|orgs (principals)|━━━━━━|
                        |orgs (customers)|━━━━━━|
                                             |opportunities|━━━━━━|
    ↑ Each waits for previous (waterfall)
```

## Related Files

- **Implementation:** `src/atomic-crm/opportunities/OpportunityListFilter.tsx`
- **Documentation:** `docs/performance/NETWORK_OPTIMIZATION_VERIFICATION.md`
- **Provider Rules:** `.claude/rules/PROVIDER_RULES.md`
