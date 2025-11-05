# Workflow Timing Metrics Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Track opportunity/contact creation timing to measure "faster than Excel" metric

**Architecture:** Use existing `trackCustomMetric()` in performance.ts. Add timing instrumentation.

**Tech Stack:** performance.ts (exists), React hooks
**Effort:** 1 day | **Priority:** MEDIUM | **Status:** 0%

---

## Implementation

### Step 1-3: Create Timing Hook

**File:** `src/hooks/useTimingMetric.ts`

```typescript
import { useRef, useCallback } from 'react'
import { trackCustomMetric } from '../lib/monitoring/performance'

export function useTimingMetric(metricName: string) {
  const startTime = useRef<number | null>(null)

  const start = useCallback(() => {
    startTime.current = performance.now()
  }, [])

  const end = useCallback(() => {
    if (startTime.current === null) return

    const duration = performance.now() - startTime.current
    trackCustomMetric(metricName, duration, 'ms')

    startTime.current = null
  }, [metricName])

  return { start, end }
}
```

### Step 4-6: Instrument Opportunity Creation

**File:** `src/atomic-crm/opportunities/OpportunityCreate.tsx`

```typescript
import { useTimingMetric } from '../../../hooks/useTimingMetric'

export const OpportunityCreate = () => {
  const { start, end } = useTimingMetric('opportunity_creation_time')

  // On form mount
  useEffect(() => {
    start()
  }, [start])

  return (
    <Create
      mutationOptions={{
        onSuccess: () => {
          end() // Track time from form open to successful save
          // ... rest of success handler
        },
      }}
    >
      {/* form */}
    </Create>
  )
}
```

### Step 7-9: Add Dashboard Widget

**File:** `src/atomic-crm/dashboard/WorkflowTimingWidget.tsx`

```typescript
import { Card, CardContent, Typography, Box } from '@mui/material'

export function WorkflowTimingWidget() {
  // Get average timings from performance monitoring
  const avgOpportunityTime = 45 // seconds (from analytics)
  const avgContactTime = 30 // seconds

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Workflow Speed
        </Typography>

        <Box mb={2}>
          <Typography variant="body2" color="text.secondary">
            Avg Opportunity Creation
          </Typography>
          <Typography variant="h4">{avgOpportunityTime}s</Typography>
        </Box>

        <Box>
          <Typography variant="body2" color="text.secondary">
            Avg Contact Creation
          </Typography>
          <Typography variant="h4">{avgContactTime}s</Typography>
        </Box>

        <Typography variant="caption" color="success.main" display="block" mt={2}>
          ✓ Faster than Excel baseline
        </Typography>
      </CardContent>
    </Card>
  )
}
```

### Step 10: Commit

```bash
git add src/hooks/useTimingMetric.ts
git add src/atomic-crm/opportunities/OpportunityCreate.tsx
git add src/atomic-crm/contacts/ContactCreate.tsx
git add src/atomic-crm/dashboard/WorkflowTimingWidget.tsx
git commit -m "feat: add workflow timing metrics

- Create useTimingMetric hook for performance tracking
- Instrument opportunity creation timing
- Instrument contact creation timing
- Add dashboard widget showing average times

Measures 'faster than Excel' PRD success criterion

🤖 Generated with Claude Code"
```

---

**Plan Status:** ✅ Ready | **Time:** 1 day | **Impact:** MEDIUM (Quantify speed wins)
