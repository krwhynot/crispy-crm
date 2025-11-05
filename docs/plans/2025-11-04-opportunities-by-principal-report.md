# OpportunitiesByPrincipal Report Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create dedicated report page for tracking opportunities grouped by principal organization (manufacturer/brand) with advanced filtering and CSV export

**Architecture:** Reuse 80% of existing dashboard widget logic (`OpportunitiesByPrincipal.tsx`) but add full report page with React Admin List component, advanced filtering, sorting, and CSV export capabilities.

**Tech Stack:**
- React Admin: List, Datagrid, Filter components
- Existing widget: `src/atomic-crm/dashboard/OpportunitiesByPrincipal.tsx` (logic reuse)
- CSV export: Existing infrastructure in dataProvider
- Route: `/reports/opportunities-by-principal`

**Effort:** 2 days
**Priority:** HIGH (⭐ HIGHEST PRIORITY REPORT in PRD)
**Current Status:** Dashboard widget exists (100%), Report page missing (0%)

---

## Task 1: Create Report Page Component

**Files:**
- Create: `src/atomic-crm/reports/OpportunitiesByPrincipalReport.tsx`
- Create: `src/atomic-crm/reports/index.ts`
- Reference: `src/atomic-crm/dashboard/OpportunitiesByPrincipal.tsx` (reuse logic)

---

### Step 1: Create reports directory structure

```bash
mkdir -p src/atomic-crm/reports
```

---

### Step 2: Create OpportunitiesByPrincipalReport component

**File:** `src/atomic-crm/reports/OpportunitiesByPrincipalReport.tsx`

```typescript
import { useState } from 'react'
import {
  List,
  Datagrid,
  TextField,
  NumberField,
  ReferenceField,
  FunctionField,
  useListContext,
  TopToolbar,
  ExportButton,
  FilterButton,
  SelectInput,
  TextInput,
  downloadCSV,
} from 'react-admin'
import { Card, CardContent, Typography, Box } from '@mui/material'
import { BarChart } from '@mui/x-charts/BarChart'

/**
 * OpportunitiesByPrincipal Report Page
 *
 * Shows all active opportunities grouped by principal organization
 * with advanced filtering, sorting, and CSV export.
 *
 * Reuses logic from dashboard widget but with full List capabilities.
 */

const reportFilters = [
  <TextInput label="Search Principal" source="q" alwaysOn />,
  <SelectInput
    label="Status"
    source="status"
    choices={[
      { id: 'active', name: 'Active' },
      { id: 'closed_won', name: 'Closed Won' },
      { id: 'closed_lost', name: 'Closed Lost' },
    ]}
    alwaysOn
  />,
]

const ReportActions = () => (
  <TopToolbar>
    <FilterButton />
    <ExportButton />
  </TopToolbar>
)

// Summary Chart Component
const SummaryChart = () => {
  const { data, isLoading } = useListContext()

  if (isLoading || !data) return null

  // Group opportunities by principal
  const groupedData = data.reduce((acc: any, opp: any) => {
    const principalName = opp.principal_organization?.name || 'Unassigned'
    if (!acc[principalName]) {
      acc[principalName] = { count: 0, principals: new Set() }
    }
    acc[principalName].count++
    return acc
  }, {})

  const chartData = Object.entries(groupedData)
    .map(([name, data]: [string, any]) => ({
      principal: name,
      count: data.count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10) // Top 10

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Top 10 Principals by Opportunity Count
        </Typography>
        <Box sx={{ height: 300 }}>
          <BarChart
            dataset={chartData}
            xAxis={[{ scaleType: 'band', dataKey: 'principal' }]}
            series={[{ dataKey: 'count', label: 'Opportunities' }]}
            height={280}
          />
        </Box>
      </CardContent>
    </Card>
  )
}

export const OpportunitiesByPrincipalReport = () => {
  return (
    <>
      <Typography variant="h4" gutterBottom>
        Opportunities by Principal Report
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Track opportunities grouped by manufacturer/brand (principal organization).
        Filter, sort, and export data for analysis.
      </Typography>

      <List
        resource="opportunities"
        filter={{ status: 'active' }}
        sort={{ field: 'created_at', order: 'DESC' }}
        perPage={50}
        filters={reportFilters}
        actions={<ReportActions />}
      >
        <SummaryChart />
        <Datagrid
          bulkActionButtons={false}
          sx={{
            '& .RaDatagrid-headerCell': {
              fontWeight: 'bold',
              backgroundColor: 'action.hover',
            },
          }}
        >
          <TextField source="name" label="Opportunity Name" />

          <ReferenceField
            source="principal_organization_id"
            reference="organizations"
            label="Principal"
            link="show"
          >
            <TextField source="name" />
          </ReferenceField>

          <ReferenceField
            source="customer_organization_id"
            reference="organizations"
            label="Customer"
            link="show"
          >
            <TextField source="name" />
          </ReferenceField>

          <TextField source="stage" label="Stage" />
          <TextField source="status" label="Status" />

          <FunctionField
            label="Estimated Close"
            render={(record: any) =>
              record.estimated_close_date
                ? new Date(record.estimated_close_date).toLocaleDateString()
                : 'N/A'
            }
          />

          <NumberField
            source="probability"
            label="Probability"
            options={{ style: 'percent', minimumFractionDigits: 0 }}
          />
        </Datagrid>
      </List>
    </>
  )
}

// Custom exporter for CSV
export const exportOpportunitiesByPrincipal = (
  opportunities: any[],
  fetchRelatedRecords: any,
) => {
  // Fetch related organizations for export
  const organizationIds = opportunities.map(
    (opp) => opp.principal_organization_id,
  )

  return fetchRelatedRecords(
    opportunities,
    'principal_organization_id',
    'organizations',
  ).then((organizations: any) => {
    const data = opportunities.map((opp) => ({
      'Opportunity Name': opp.name,
      'Principal': organizations[opp.principal_organization_id]?.name || 'N/A',
      'Customer': opp.customer_organization?.name || 'N/A',
      'Stage': opp.stage,
      'Status': opp.status,
      'Estimated Close Date': opp.estimated_close_date || 'N/A',
      'Probability': `${(opp.probability * 100).toFixed(0)}%`,
      'Created': new Date(opp.created_at).toLocaleDateString(),
    }))

    const csv = convertToCSV(data)
    downloadCSV(csv, 'opportunities-by-principal')
  })
}

function convertToCSV(data: any[]): string {
  if (data.length === 0) return ''

  const headers = Object.keys(data[0])
  const csvRows = [
    headers.join(','),
    ...data.map((row) =>
      headers.map((header) => JSON.stringify(row[header])).join(','),
    ),
  ]

  return csvRows.join('\n')
}
```

---

### Step 3: Create reports module index

**File:** `src/atomic-crm/reports/index.ts`

```typescript
export { OpportunitiesByPrincipalReport } from './OpportunitiesByPrincipalReport'
```

---

### Step 4: Register report route in CRM.tsx

**File:** `src/atomic-crm/root/CRM.tsx`

**Find imports section, add:**

```typescript
import { OpportunitiesByPrincipalReport } from '../reports'
```

**Find <Admin> routes section, add after other Resource declarations:**

```typescript
<Resource
  name="reports"
  options={{ label: 'Reports' }}
>
  <Route path="opportunities-by-principal" element={<OpportunitiesByPrincipalReport />} />
</Resource>
```

---

### Step 5: Add report to navigation menu

**File:** `src/atomic-crm/root/Menu.tsx` (or wherever main menu is defined)

**Add reports menu item:**

```typescript
<Menu.Item
  to="/reports/opportunities-by-principal"
  primaryText="Opportunities by Principal"
  leftIcon={<BarChartIcon />}
/>
```

---

### Step 6: Test TypeScript compilation

```bash
npx tsc --noEmit
```

**Expected:** No errors

---

### Step 7: Start dev server and verify report page

```bash
npm run dev
```

**Navigate to:** http://localhost:5173/reports/opportunities-by-principal

**Verify:**
- ✅ Report page renders
- ✅ Summary chart shows top 10 principals
- ✅ Datagrid shows opportunities
- ✅ Filters work (search, status)
- ✅ Export button appears

---

### Step 8: Commit report page

```bash
git add src/atomic-crm/reports/
git add src/atomic-crm/root/CRM.tsx
git add src/atomic-crm/root/Menu.tsx

git commit -m "feat: add OpportunitiesByPrincipal report page ⭐

- Create dedicated report page with full List capabilities
- Add summary chart showing top 10 principals
- Implement advanced filtering (search, status)
- Add CSV export with custom formatter
- Register route in CRM.tsx
- Add to navigation menu

Priority: HIGHEST (marked ⭐ in PRD 09-reports.md)
Reuses: Dashboard widget logic (80% code reuse)

🤖 Generated with Claude Code"
```

---

## Task 2: Write Tests

**Files:**
- Create: `src/atomic-crm/reports/OpportunitiesByPrincipalReport.test.tsx`

---

### Step 9: Write unit test for report component

**File:** `src/atomic-crm/reports/OpportunitiesByPrincipalReport.test.tsx`

```typescript
import { render, screen } from '@testing-library/react'
import { AdminContext } from 'react-admin'
import { OpportunitiesByPrincipalReport } from './OpportunitiesByPrincipalReport'

describe('OpportunitiesByPrincipalReport', () => {
  const mockDataProvider = {
    getList: vi.fn(() =>
      Promise.resolve({
        data: [
          {
            id: '1',
            name: 'Test Opportunity',
            principal_organization_id: 'principal-1',
            customer_organization_id: 'customer-1',
            stage: 'qualified',
            status: 'active',
            probability: 0.75,
            created_at: '2025-01-01',
          },
        ],
        total: 1,
      }),
    ),
  } as any

  it('renders report title', () => {
    render(
      <AdminContext dataProvider={mockDataProvider}>
        <OpportunitiesByPrincipalReport />
      </AdminContext>,
    )

    expect(
      screen.getByText('Opportunities by Principal Report'),
    ).toBeInTheDocument()
  })

  it('renders summary chart', async () => {
    render(
      <AdminContext dataProvider={mockDataProvider}>
        <OpportunitiesByPrincipalReport />
      </AdminContext>,
    )

    expect(
      await screen.findByText('Top 10 Principals by Opportunity Count'),
    ).toBeInTheDocument()
  })

  it('renders datagrid with opportunities', async () => {
    render(
      <AdminContext dataProvider={mockDataProvider}>
        <OpportunitiesByPrincipalReport />
      </AdminContext>,
    )

    expect(await screen.findByText('Test Opportunity')).toBeInTheDocument()
  })
})
```

---

### Step 10: Run tests

```bash
npm test -- OpportunitiesByPrincipalReport.test.tsx
```

**Expected:** All tests pass

---

### Step 11: Commit tests

```bash
git add src/atomic-crm/reports/OpportunitiesByPrincipalReport.test.tsx

git commit -m "test: add tests for OpportunitiesByPrincipal report

- Test report title rendering
- Test summary chart rendering
- Test datagrid rendering with opportunities

Coverage: Unit tests for component structure

🤖 Generated with Claude Code"
```

---

## Verification Checklist

- ✅ Report page created with full List capabilities
- ✅ Summary chart shows top 10 principals
- ✅ Datagrid displays opportunities with all required fields
- ✅ Filters work (search by principal, filter by status)
- ✅ CSV export button functional
- ✅ Route registered in CRM.tsx
- ✅ Menu item added to navigation
- ✅ TypeScript compiles without errors
- ✅ Tests written and passing
- ✅ Git commits created

---

## Testing Checklist

**Manual Testing:**

1. **Navigation:**
   - Click "Opportunities by Principal" in menu
   - Verify URL: `/reports/opportunities-by-principal`

2. **Chart:**
   - Verify bar chart displays
   - Shows top 10 principals by count
   - Bars sorted descending

3. **Filters:**
   - Type in "Search Principal" field
   - Select status filter (Active/Closed)
   - Verify datagrid updates

4. **Export:**
   - Click "Export" button
   - Verify CSV downloads
   - Open CSV, check columns match spec

5. **Data Accuracy:**
   - Compare counts with dashboard widget
   - Verify opportunities match database

---

## References

- **Dashboard Widget:** `src/atomic-crm/dashboard/OpportunitiesByPrincipal.tsx`
- **PRD:** docs/prd/09-reports.md (OpportunitiesByPrincipal marked ⭐)
- **React Admin List:** https://marmelab.com/react-admin/List.html

---

**Plan Status:** ✅ Ready for execution
**Estimated Time:** 2 days
**Risk:** Low (reuses existing widget logic)
**Impact:** HIGH (completes highest priority report)
