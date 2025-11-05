# Complete Reports Module Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add 2 missing report pages (Weekly Activity Summary, Pipeline Status Report) to complete Reports module

**Architecture:** Reuse CSV export infrastructure (100% ready). Create List-based report pages with charts and filters.

**Tech Stack:** React Admin List, Recharts, existing CSV infrastructure
**Effort:** 3 days (1.5 days each) | **Priority:** HIGH
**Status:** Infrastructure 100%, Report pages 0 of 3 (1 completed in separate plan)

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

## Task 2: Pipeline Status Report (1.5 days)

### Step 5-7: Create Pipeline Report

**File:** `src/atomic-crm/reports/PipelineStatusReport.tsx`

```typescript
import { List, Datagrid, TextField, NumberField } from 'react-admin'
import { PieChart, Pie, Cell, Legend } from 'recharts'

const PipelineChart = () => {
  const { data } = useListContext()
  
  const stages = data?.reduce((acc: any, opp: any) => {
    acc[opp.stage] = (acc[opp.stage] || 0) + 1
    return acc
  }, {})

  const chartData = Object.entries(stages || {}).map(([name, value]) => ({
    name,
    value,
  }))

  return (
    <PieChart width={400} height={300}>
      <Pie data={chartData} dataKey="value" nameKey="name" label>
        {chartData.map((_, index) => (
          <Cell key={index} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
      <Legend />
    </PieChart>
  )
}

export function PipelineStatusReport() {
  return (
    <>
      <Typography variant="h4">Pipeline Status Report</Typography>
      <List
        resource="opportunities"
        filter={{ status: 'active' }}
        sort={{ field: 'stage', order: 'ASC' }}
        perPage={100}
      >
        <PipelineChart />
        <Datagrid>
          <TextField source="name" />
          <TextField source="stage" />
          <NumberField source="probability" options={{ style: 'percent' }} />
        </Datagrid>
      </List>
    </>
  )
}
```

### Step 8: Export Both

**File:** `src/atomic-crm/reports/index.ts`

```typescript
export { OpportunitiesByPrincipalReport } from './OpportunitiesByPrincipalReport'
export { WeeklyActivitySummaryReport } from './WeeklyActivitySummaryReport'
export { PipelineStatusReport } from './PipelineStatusReport'
```

### Step 9-10: Register Routes & Menu

```typescript
// In CRM.tsx
<Route path="reports/weekly-activity" element={<WeeklyActivitySummaryReport />} />
<Route path="reports/pipeline-status" element={<PipelineStatusReport />} />

// In Menu.tsx
<Menu.Item to="/reports/weekly-activity" primaryText="Weekly Activity" />
<Menu.Item to="/reports/pipeline-status" primaryText="Pipeline Status" />
```

### Step 11: Test & Commit

```bash
npm run dev
# Test all 3 report pages
# Verify charts render
# Test CSV export

git add src/atomic-crm/reports/
git commit -m "feat: complete Reports module with 2 new report pages

- Add Weekly Activity Summary report (activity breakdown chart)
- Add Pipeline Status Report (stage distribution pie chart)
- Register routes in CRM.tsx
- Add to reports menu

Reports module: 40% → 100% complete (3 of 3 pages)

🤖 Generated with Claude Code"
```

---

**Plan Status:** ✅ Ready | **Time:** 3 days | **Impact:** HIGH (Completes module)
