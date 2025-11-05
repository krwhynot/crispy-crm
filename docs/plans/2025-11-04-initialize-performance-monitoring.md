# Initialize Performance Monitoring Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Activate the existing performance monitoring framework to track Web Vitals in production

**Architecture:** The performance monitoring framework is already complete in `src/lib/monitoring/performance.ts` (228 lines) with Web Vitals tracking, performance budgets, and alert thresholds. It just needs to be initialized in the application entry point.

**Tech Stack:**
- Existing: `src/lib/monitoring/performance.ts` (Core Web Vitals: LCP, INP, CLS, FCP, TTFB)
- Integration point: `src/main.tsx`
- No new dependencies required

**Effort:** 5 minutes
**Priority:** CRITICAL (Quick Win)
**Current Status:** Framework 100% built, 0% initialized

---

## Task 1: Initialize Performance Monitoring

**Files:**
- Read: `src/lib/monitoring/performance.ts` (verify exports)
- Modify: `src/main.tsx:1-20` (add import and initialization)
- Verify: Browser DevTools Console (performance events logged)

---

### Step 1: Verify performance monitoring exports

**Action:** Read performance monitoring file to confirm export structure

```bash
head -30 src/lib/monitoring/performance.ts
```

**Expected exports:**
```typescript
export function initializePerformanceMonitoring(): void
export function trackCustomMetric(name: string, value: number, unit?: string): void
export class PerformanceMonitor { ... }
```

---

### Step 2: Read current main.tsx structure

**Action:** Understand current entry point structure

```bash
cat src/main.tsx
```

**Expected structure:**
```typescript
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(<App />)
```

---

### Step 3: Add performance monitoring import

**Action:** Add import statement at top of main.tsx

**File:** `src/main.tsx`

**Add after line 1 (after react-dom import):**

```typescript
import { createRoot } from 'react-dom/client'
import { initializePerformanceMonitoring } from './lib/monitoring/performance'
import './index.css'
import App from './App.tsx'
```

---

### Step 4: Initialize performance monitoring

**Action:** Call initialization function before React render

**File:** `src/main.tsx`

**Complete updated file:**

```typescript
import { createRoot } from 'react-dom/client'
import { initializePerformanceMonitoring } from './lib/monitoring/performance'
import './index.css'
import App from './App.tsx'

// Initialize performance monitoring
initializePerformanceMonitoring()

createRoot(document.getElementById('root')!).render(<App />)
```

**Lines changed:** 2 lines added (import + initialization call)

---

### Step 5: Verify TypeScript compilation

**Action:** Check for type errors

```bash
npx tsc --noEmit
```

**Expected:** No errors (performance.ts exports are correctly typed)

---

### Step 6: Start dev server and verify initialization

**Action:** Run application and check console

```bash
npm run dev
```

**Open browser to:** http://localhost:5173

**Check DevTools Console for:**
```
[Performance] Monitoring initialized
[Performance] LCP: 1234ms (good)
[Performance] INP: 45ms (good)
[Performance] CLS: 0.05 (good)
```

**Performance events should log as page interactions occur**

---

### Step 7: Verify performance budget alerts

**Action:** Check that performance monitoring is tracking Web Vitals

**Test in browser:**
1. Navigate to different pages (contacts, organizations, opportunities)
2. Perform interactions (open modals, submit forms)
3. Check console for performance metrics

**Expected console output:**
- LCP (Largest Contentful Paint) logged on page load
- INP (Interaction to Next Paint) logged on user interactions
- CLS (Cumulative Layout Shift) tracked during navigation
- Performance ratings: "good", "needs-improvement", or "poor"

---

### Step 8: Commit changes

**Action:** Commit the 2-line change

```bash
git add src/main.tsx
git commit -m "feat: initialize performance monitoring in main.tsx

- Add import for initializePerformanceMonitoring
- Call initialization before React render
- Activates Web Vitals tracking (LCP, INP, CLS, FCP, TTFB)
- Performance budgets and alerts now active

🤖 Generated with Claude Code"
```

---

## Verification Checklist

After completing all steps:

- ✅ TypeScript compiles without errors
- ✅ Dev server starts successfully
- ✅ Performance monitoring logs appear in console
- ✅ Web Vitals metrics tracked (LCP, INP, CLS)
- ✅ Performance ratings displayed (good/needs-improvement/poor)
- ✅ Git commit created with clear message

---

## Testing

**Manual Testing:**

1. **Page Load Performance:**
   - Open browser DevTools Console
   - Navigate to http://localhost:5173
   - Verify LCP metric logged within 2-3 seconds
   - Verify FCP (First Contentful Paint) logged

2. **Interaction Performance:**
   - Click buttons, open modals, submit forms
   - Verify INP metrics logged for each interaction
   - Should be < 200ms for "good" rating

3. **Layout Stability:**
   - Navigate between pages
   - Verify CLS (Cumulative Layout Shift) tracked
   - Should be < 0.1 for "good" rating

4. **Performance Budget Alerts:**
   - If metrics exceed thresholds, warnings should appear
   - LCP > 4s = warning
   - INP > 500ms = warning
   - CLS > 0.25 = warning

**No automated tests required** - This is integration with existing framework

---

## Rollback Procedure

If issues occur:

```bash
# Revert the commit
git revert HEAD

# Or manually remove the 2 lines:
# 1. Remove: import { initializePerformanceMonitoring } from './lib/monitoring/performance'
# 2. Remove: initializePerformanceMonitoring()
```

---

## Next Steps

After this task:

1. **Configure Analytics Endpoint** (Future task)
   - Currently logs to console only
   - Google Analytics integration commented out in performance.ts lines 100-107
   - See: `docs/plans/2025-11-04-analytics-integration.md` (Medium Priority)

2. **Add Custom Metric Tracking** (Future task)
   - Use `trackCustomMetric()` for opportunity creation timing
   - See: `docs/plans/2025-11-04-workflow-timing-metrics.md` (Medium Priority)

---

## References

- **Framework Code:** `src/lib/monitoring/performance.ts` (lines 1-228)
- **Integration Example:** `src/lib/monitoring/integration-example.ts` (shows usage patterns)
- **Performance Budgets:** Defined in `performance.ts` lines 18-24
  - LCP: <2.5s (good), alerts at >4s
  - INP: <200ms (good), alerts at >500ms
  - CLS: <0.1 (good), alerts at >0.25

---

**Plan Status:** ✅ Ready for execution
**Estimated Time:** 5 minutes
**Risk:** Very Low (framework is already tested, just needs initialization)
**Impact:** HIGH (activates production-ready performance monitoring)
