# Complete Reports Module Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add 1 missing MVP report page (Weekly Activity Summary) to complete Reports module

**Architecture:** Reuse CSV export infrastructure (100% ready). Create List-based report pages with charts and filters.

**Tech Stack:** React Admin List, Recharts, existing CSV infrastructure
**Effort:** 3 days | **Priority:** HIGH
**Status:** Infrastructure 100%, Report pages 0 of 2 MVP reports (OpportunitiesByPrincipal ⭐ in separate plan)

**Note:** Pipeline Status Report deferred to Post-MVP per principal-centric redesign v2.0.

---

## Task 1: Weekly Activity Summary Report (1.5 days)

### Step 1-3: Create Report Component

**File:** `src/atomic-crm/reports/WeeklyActivitySummaryReport.tsx`

```typescript
import { List, Datagrid, TextField, DateField, useListContext } from 'react-admin'
import { Card, CardContent, Typography } from '@mui/material'
import { BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'

const ActivityChart = () => {
  const { data } = useListContext()
  
  // Group by activity type
  const chartData = data?.reduce((acc: any[], activity: any) => {
    const type = activity.type
    const existing = acc.find(item => item.type === type)
    if (existing) {
      existing.count++
    } else {
      acc.push({ type, count: 1 })
    }
    return acc
  }, []) || []

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6">Activity Breakdown</Typography>
        <BarChart width={600} height={300} data={chartData}>
          <XAxis dataKey="type" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="#8884d8" />
        </BarChart>
      </CardContent>
    </Card>
  )
}

export function WeeklyActivitySummaryReport() {
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  return (
    <>
      <Typography variant="h4" gutterBottom>Weekly Activity Summary</Typography>
      <List
        resource="activities"
        filter={{ created_at_gte: oneWeekAgo.toISOString() }}
        sort={{ field: 'created_at', order: 'DESC' }}
        perPage={50}
      >
        <ActivityChart />
        <Datagrid>
          <DateField source="created_at" label="Date" />
          <TextField source="type" />
          <TextField source="subject" />
          <TextField source="description" />
        </Datagrid>
      </List>
    </>
  )
}
```

### Step 4: Register Route

**File:** `src/atomic-crm/root/CRM.tsx`

```typescript
<Route path="reports/weekly-activity" element={<WeeklyActivitySummaryReport />} />
```

---

## Task 2: Finalize Module (Day 2 - Afternoon)

### Step 5: Export Report

**File:** `src/atomic-crm/reports/index.ts`

```typescript
export { OpportunitiesByPrincipalReport } from './OpportunitiesByPrincipalReport'
export { WeeklyActivitySummaryReport } from './WeeklyActivitySummaryReport'
```

### Step 6: Register Route & Menu

```typescript
// In CRM.tsx
<Route path="reports/weekly-activity" element={<WeeklyActivitySummaryReport />} />

// In Menu.tsx
<Menu.Item to="/reports/weekly-activity" primaryText="Weekly Activity" />
```

### Step 7: Test & Commit

```bash
npm run dev
# Test Weekly Activity Summary report
# Verify activity breakdown chart renders
# Test CSV export

git add src/atomic-crm/reports/
git commit -m "feat: complete Reports module MVP scope

- Add Weekly Activity Summary report (activity breakdown chart)
- Register route in CRM.tsx
- Add to reports menu

Reports module: 40% → 100% MVP complete (2 of 2 pages)
Note: Pipeline Status Report deferred to Post-MVP

🤖 Generated with Claude Code"
```

---

**Plan Status:** ✅ Ready | **Time:** 3 days | **Impact:** HIGH (Completes MVP module)

**Note:** Pipeline Status Report deferred to Post-MVP per principal-centric redesign v2.0
