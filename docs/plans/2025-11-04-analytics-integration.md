# Analytics Platform Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrate Google Analytics 4 for historical metrics tracking

**Architecture:** Connect existing performance.ts framework (has GA code commented out) to GA4. Track custom events.

**Tech Stack:** Google Analytics 4, gtag.js
**Effort:** 3 days | **Priority:** MEDIUM | **Status:** GA integration commented out

---

## Implementation

### Step 1-2: Create GA4 Property (Day 1)

**Manual:**
1. Go to https://analytics.google.com/
2. Create new GA4 property "Atomic CRM"
3. Get Measurement ID (G-XXXXXXXXXX)

### Step 3-5: Install gtag Script

**File:** `index.html`

```html
<head>
  <!-- Google Analytics -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-XXXXXXXXXX');
  </script>
</head>
```

### Step 6-8: Uncomment GA Integration (Day 2)

**File:** `src/lib/monitoring/performance.ts`

**Lines 100-107, uncomment and update:**

```typescript
function sendToAnalytics(metric: PerformanceMetric) {
  // Send to Google Analytics
  if (typeof gtag !== 'undefined') {
    gtag('event', metric.name, {
      event_category: 'Web Vitals',
      value: Math.round(metric.value),
      metric_rating: metric.rating,
      non_interaction: true,
    })
  }
}
```

### Step 9-11: Add Custom Events (Day 3)

**File:** `src/lib/analytics/events.ts` (new)

```typescript
declare global {
  interface Window {
    gtag?: (...args: any[]) => void
  }
}

export function trackEvent(
  eventName: string,
  params?: Record<string, any>
) {
  if (window.gtag) {
    window.gtag('event', eventName, params)
  }
}

// Convenience functions
export const trackOpportunityCreated = () => trackEvent('opportunity_created')
export const trackContactCreated = () => trackEvent('contact_created')
export const trackExport = (type: string) => trackEvent('export', { export_type: type })
```

### Step 12-14: Use in Components

**Example:** `src/atomic-crm/opportunities/OpportunityCreate.tsx`

```typescript
import { trackOpportunityCreated } from '../../../lib/analytics/events'

// After successful create:
onSuccess: () => {
  trackOpportunityCreated()
  // ... rest of success handler
}
```

### Step 15: Test & Commit

```bash
npm run dev
# Perform actions (create opportunity, export, etc.)
# Check GA4 dashboard for events

git add index.html src/lib/monitoring/performance.ts src/lib/analytics/
git commit -m "feat: integrate Google Analytics 4 for metrics tracking

- Add GA4 gtag script to index.html
- Uncomment GA integration in performance.ts
- Create custom event tracking utilities
- Track opportunity/contact creation events
- Track export events

Historical metrics now captured for analysis

🤖 Generated with Claude Code"
```

---

**Plan Status:** ✅ Ready | **Time:** 3 days | **Impact:** MEDIUM (Historical metrics)
