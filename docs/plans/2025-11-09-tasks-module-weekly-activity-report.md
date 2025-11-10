# Tasks Module + Weekly Activity Report Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a full Tasks resource with principal-grouped list view and Weekly Activity Report to help reps answer "What's my ONE thing to do this week for each principal?"

**Architecture:** Tasks module follows React Admin patterns with lazy-loaded components, Zod validation at API boundary, and principal grouping via opportunity→organization lookups. Weekly Activity Report aggregates activities by rep and principal with CSV export.

**Tech Stack:** React 19, TypeScript, React Admin, Zod, Tailwind CSS 4, Supabase, date-fns

---

## Prerequisites Completed

The following files have been created:
- ✅ `src/atomic-crm/tasks/index.ts` - Module exports
- ✅ `src/atomic-crm/validation/task.ts` - Zod schemas
- ✅ `src/atomic-crm/tasks/TaskList.tsx` - Principal-grouped list view

**Remaining work:** Filter, Show, Edit, Create pages, CRM registration, Reports module, tests

---

## Task 1: Create TaskListFilter Component

**Files:**
- Create: `src/atomic-crm/tasks/TaskListFilter.tsx`

**Step 1: Write the filter component**

```tsx
import { Filter } from "@/components/admin/filter";
import { ReferenceInput } from "@/components/admin/reference-input";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { SelectInput } from "@/components/admin/select-input";
import { TextInput } from "@/components/admin/text-input";
import { useConfigurationContext } from "../root/ConfigurationContext";

/**
 * TaskListFilter Component
 *
 * Filters for tasks list:
 * - Principal (organization via opportunity)
 * - Due Date (before/after)
 * - Status (completed/incomplete)
 * - Priority (low/medium/high/critical)
 * - Assigned To (sales rep)
 */
export const TaskListFilter = () => {
  const { taskTypes } = useConfigurationContext();

  return (
    <Filter>
      <ReferenceInput
        source="opportunity_id"
        reference="opportunities"
        alwaysOn
      >
        <AutocompleteInput
          label="Opportunity"
          optionText="title"
          helperText="Filter by opportunity"
        />
      </ReferenceInput>

      <TextInput
        source="due_date@gte"
        label="Due After"
        type="date"
        helperText="Tasks due on or after this date"
      />

      <TextInput
        source="due_date@lte"
        label="Due Before"
        type="date"
        helperText="Tasks due on or before this date"
      />

      <SelectInput
        source="completed"
        label="Status"
        choices={[
          { id: "false", name: "Incomplete" },
          { id: "true", name: "Completed" },
        ]}
        helperText="Filter by completion status"
      />

      <SelectInput
        source="priority"
        label="Priority"
        choices={[
          { id: "low", name: "Low" },
          { id: "medium", name: "Medium" },
          { id: "high", name: "High" },
          { id: "critical", name: "Critical" },
        ]}
        helperText="Filter by priority level"
      />

      <SelectInput
        source="type"
        label="Type"
        choices={taskTypes.map((type) => ({ id: type, name: type }))}
        helperText="Filter by task type"
      />

      <ReferenceInput
        source="sales_id"
        reference="sales"
      >
        <AutocompleteInput
          label="Assigned To"
          optionText={(record) =>
            record ? `${record.first_name} ${record.last_name}` : ""
          }
          helperText="Filter by assigned sales rep"
        />
      </ReferenceInput>
    </Filter>
  );
};
```

**Step 2: Verify imports work**

Run: `npm run dev`
Expected: No compilation errors, dev server runs

**Step 3: Commit**

```bash
git add src/atomic-crm/tasks/TaskListFilter.tsx
git commit -m "feat(tasks): add filter component with principal/date/status filters"
```

---

## Task 2: Create TaskShow Component

**Files:**
- Create: `src/atomic-crm/tasks/TaskShow.tsx`

**Step 1: Write the show page component**

```tsx
import { useShowContext, ReferenceField, RecordRepresentation } from "ra-core";
import { DateField } from "@/components/admin/date-field";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Task as TTask } from "../types";

/**
 * TaskShow Component
 *
 * Displays full task details in a modal or page.
 * Shows: title, description, dates, priority, type, linked opportunity/contact
 */
export default function TaskShow() {
  const { record, isPending } = useShowContext<TTask>();

  if (isPending || !record) {
    return (
      <Card>
        <CardContent className="p-8">
          <p className="text-muted-foreground">Loading task...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {record.title}
          {record.completed_at && (
            <Badge variant="success">Completed</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {record.description && (
          <div>
            <h4 className="text-sm font-semibold mb-1">Description</h4>
            <p className="text-sm text-muted-foreground">{record.description}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-semibold mb-1">Due Date</h4>
            <DateField source="due_date" record={record} />
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-1">Priority</h4>
            <Badge variant={getPriorityVariant(record.priority)}>
              {record.priority}
            </Badge>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-1">Type</h4>
            <p className="text-sm">{record.type}</p>
          </div>

          {record.completed_at && (
            <div>
              <h4 className="text-sm font-semibold mb-1">Completed</h4>
              <DateField source="completed_at" record={record} showTime />
            </div>
          )}
        </div>

        {record.opportunity_id && (
          <div>
            <h4 className="text-sm font-semibold mb-1">Opportunity</h4>
            <ReferenceField
              source="opportunity_id"
              reference="opportunities"
              record={record}
              link="show"
            >
              <RecordRepresentation />
            </ReferenceField>
          </div>
        )}

        {record.contact_id && (
          <div>
            <h4 className="text-sm font-semibold mb-1">Contact</h4>
            <ReferenceField
              source="contact_id"
              reference="contacts"
              record={record}
              link="show"
            >
              <RecordRepresentation />
            </ReferenceField>
          </div>
        )}

        <div className="text-xs text-muted-foreground pt-4 border-t">
          Created: <DateField source="created_at" record={record} showTime />
        </div>
      </CardContent>
    </Card>
  );
}

function getPriorityVariant(priority?: string): "default" | "secondary" | "destructive" | "outline" {
  switch (priority) {
    case "critical":
      return "destructive";
    case "high":
      return "destructive";
    case "medium":
      return "default";
    case "low":
      return "secondary";
    default:
      return "outline";
  }
}
```

**Step 2: Verify component renders**

Run: `npm run dev`
Expected: No compilation errors

**Step 3: Commit**

```bash
git add src/atomic-crm/tasks/TaskShow.tsx
git commit -m "feat(tasks): add show page with task details and links"
```

---

## Task 3: Update TaskEdit Component

**Files:**
- Modify: `src/atomic-crm/tasks/TaskEdit.tsx`

**Step 1: Read existing TaskEdit.tsx**

Current file has a Dialog-based edit component. We need to verify it works standalone.

**Step 2: Create standalone TaskEdit page**

Replace content with:

```tsx
import { Edit } from "@/components/admin/edit";
import { SimpleForm } from "@/components/admin/simple-form";
import { TextInput } from "@/components/admin/text-input";
import { SelectInput } from "@/components/admin/select-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { useConfigurationContext } from "../root/ConfigurationContext";
import { contactOptionText } from "../misc/ContactOption";

/**
 * TaskEdit Component
 *
 * Edit form for tasks - standalone page version
 * For inline dialog version, see Task.tsx
 */
export default function TaskEdit() {
  const { taskTypes } = useConfigurationContext();

  return (
    <Edit>
      <SimpleForm>
        <TextInput
          source="title"
          label="Task Title"
          isRequired
          helperText="Brief description of the task"
        />

        <TextInput
          source="description"
          label="Description"
          multiline
          rows={3}
          helperText="Optional detailed description"
        />

        <div className="grid grid-cols-2 gap-4">
          <TextInput
            source="due_date"
            label="Due Date"
            type="date"
            isRequired
            helperText="When is this due?"
          />

          <TextInput
            source="reminder_date"
            label="Reminder Date"
            type="date"
            helperText="Optional reminder"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <SelectInput
            source="priority"
            label="Priority"
            choices={[
              { id: "low", name: "Low" },
              { id: "medium", name: "Medium" },
              { id: "high", name: "High" },
              { id: "critical", name: "Critical" },
            ]}
            defaultValue="medium"
            helperText="Task priority level"
          />

          <SelectInput
            source="type"
            label="Type"
            choices={taskTypes.map((type) => ({ id: type, name: type }))}
            defaultValue="None"
            helperText="Category of task"
          />
        </div>

        <ReferenceInput
          source="opportunity_id"
          reference="opportunities"
        >
          <AutocompleteInput
            label="Opportunity"
            optionText="title"
            helperText="Link to opportunity"
          />
        </ReferenceInput>

        <ReferenceInput
          source="contact_id"
          reference="contacts_summary"
        >
          <AutocompleteInput
            label="Contact"
            optionText={contactOptionText}
            helperText="Link to contact"
          />
        </ReferenceInput>
      </SimpleForm>
    </Edit>
  );
}
```

**Step 3: Verify edit form works**

Run: `npm run dev`
Navigate to: `/tasks/1/edit` (if task exists)
Expected: Edit form renders with all fields

**Step 4: Commit**

```bash
git add src/atomic-crm/tasks/TaskEdit.tsx
git commit -m "feat(tasks): add standalone edit page with full form"
```

---

## Task 4: Create TaskCreate Component

**Files:**
- Create: `src/atomic-crm/tasks/TaskCreate.tsx`

**Step 1: Write create page component**

```tsx
import { Create } from "@/components/admin/create";
import { SimpleForm } from "@/components/admin/simple-form";
import { TextInput } from "@/components/admin/text-input";
import { SelectInput } from "@/components/admin/select-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { useGetIdentity } from "ra-core";
import { useConfigurationContext } from "../root/ConfigurationContext";
import { contactOptionText } from "../misc/ContactOption";
import { getTaskDefaultValues } from "../validation/task";

/**
 * TaskCreate Component
 *
 * Quick-add task form - minimal fields to get started
 * Pre-fills: today's due date, current user, medium priority
 */
export default function TaskCreate() {
  const { identity } = useGetIdentity();
  const { taskTypes } = useConfigurationContext();

  const defaultValues = {
    ...getTaskDefaultValues(),
    sales_id: identity?.id,
  };

  return (
    <Create
      redirect="list"
      record={defaultValues}
    >
      <SimpleForm>
        <TextInput
          source="title"
          label="Task Title"
          isRequired
          helperText="What needs to be done?"
          autoFocus
        />

        <TextInput
          source="description"
          label="Description"
          multiline
          rows={2}
          helperText="Optional details"
        />

        <div className="grid grid-cols-2 gap-4">
          <TextInput
            source="due_date"
            label="Due Date"
            type="date"
            isRequired
            helperText="When is this due?"
          />

          <SelectInput
            source="type"
            label="Type"
            choices={taskTypes.map((type) => ({ id: type, name: type }))}
            helperText="Category of task"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <SelectInput
            source="priority"
            label="Priority"
            choices={[
              { id: "low", name: "Low" },
              { id: "medium", name: "Medium" },
              { id: "high", name: "High" },
              { id: "critical", name: "Critical" },
            ]}
            helperText="How urgent?"
          />

          <ReferenceInput
            source="opportunity_id"
            reference="opportunities"
          >
            <AutocompleteInput
              label="Opportunity"
              optionText="title"
              helperText="Link to opportunity (optional)"
            />
          </ReferenceInput>
        </div>

        <ReferenceInput
          source="contact_id"
          reference="contacts_summary"
        >
          <AutocompleteInput
            label="Contact"
            optionText={contactOptionText}
            helperText="Link to contact (optional)"
          />
        </ReferenceInput>
      </SimpleForm>
    </Create>
  );
}
```

**Step 2: Verify create form works**

Run: `npm run dev`
Navigate to: `/tasks/create`
Expected: Create form renders with default values

**Step 3: Commit**

```bash
git add src/atomic-crm/tasks/TaskCreate.tsx
git commit -m "feat(tasks): add create page with quick-add form"
```

---

## Task 5: Register Tasks Resource in CRM

**Files:**
- Modify: `src/atomic-crm/root/CRM.tsx`

**Step 1: Add tasks import**

Find the imports section (around line 20-40) and add:

```tsx
import tasks from "../tasks";
```

**Step 2: Add Resource registration**

Find the `<Resource>` components (around line 200-250) and add after opportunities:

```tsx
<Resource
  name="tasks"
  {...tasks}
  icon={CheckSquare}
  options={{ label: "Tasks" }}
/>
```

**Step 3: Add icon import**

Add to lucide-react imports at top:

```tsx
import { CheckSquare } from "lucide-react";
```

**Step 4: Verify tasks appear in menu**

Run: `npm run dev`
Navigate to: `/`
Expected: "Tasks" menu item appears, clicking shows task list

**Step 5: Commit**

```bash
git add src/atomic-crm/root/CRM.tsx
git commit -m "feat(tasks): register tasks resource in CRM navigation"
```

---

## Task 6: Update Dashboard Widget Link

**Files:**
- Modify: `src/atomic-crm/dashboard/MyTasksThisWeek.tsx`

**Step 1: Verify "View All Tasks" link**

Check line 174 - should link to `/tasks`:

```tsx
<Link
  to="/tasks"
  className="text-sm text-primary hover:underline"
>
  View All Tasks →
</Link>
```

**Step 2: Test link navigation**

Run: `npm run dev`
Navigate to: `/`
Click: "View All Tasks" in My Tasks This Week widget
Expected: Navigates to `/tasks` list page

**Step 3: Commit (if changed)**

```bash
git add src/atomic-crm/dashboard/MyTasksThisWeek.tsx
git commit -m "fix(dashboard): ensure tasks widget links to /tasks list"
```

---

## Task 7: Create Reports Directory Structure

**Files:**
- Create: `src/atomic-crm/reports/index.ts`
- Create: `src/atomic-crm/reports/ReportLayout.tsx`

**Step 1: Create reports index**

```tsx
import * as React from "react";

const WeeklyActivitySummary = React.lazy(
  () => import("./WeeklyActivitySummary")
);

export default {
  WeeklyActivitySummary,
};
```

**Step 2: Create report layout wrapper**

```tsx
import { ReactNode } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface ReportLayoutProps {
  title: string;
  children: ReactNode;
  onExport?: () => void;
  actions?: ReactNode;
}

/**
 * ReportLayout Component
 *
 * Consistent layout wrapper for all reports:
 * - Title with export button
 * - Custom actions slot
 * - Semantic spacing
 */
export function ReportLayout({
  title,
  children,
  onExport,
  actions,
}: ReportLayoutProps) {
  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{title}</h1>
        <div className="flex items-center gap-2">
          {actions}
          {onExport && (
            <Button onClick={onExport} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          )}
        </div>
      </div>
      <Card>
        <CardContent className="p-6">{children}</CardContent>
      </Card>
    </div>
  );
}
```

**Step 3: Verify imports**

Run: `npm run dev`
Expected: No compilation errors

**Step 4: Commit**

```bash
git add src/atomic-crm/reports/index.ts src/atomic-crm/reports/ReportLayout.tsx
git commit -m "feat(reports): add reports directory structure and layout"
```

---

## Task 8: Create Weekly Activity Summary Report

**Files:**
- Create: `src/atomic-crm/reports/WeeklyActivitySummary.tsx`

**Step 1: Write report component**

```tsx
import { useState, useMemo } from "react";
import { useGetList, useGetIdentity, downloadCSV } from "ra-core";
import { startOfWeek, endOfWeek, format } from "date-fns";
import jsonExport from "jsonexport/dist";
import { ReportLayout } from "./ReportLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Activity, Organization, Sale } from "../types";

/**
 * Weekly Activity Summary Report
 *
 * Shows activity counts by rep and principal for manager visibility.
 * Groups: Sales Rep → Principal → Activity Type Counts
 *
 * Flags low-activity principals (< 3 activities/week) with warning.
 *
 * CSV Export: rep_name, principal_name, calls, emails, meetings, notes, total
 */
export default function WeeklyActivitySummary() {
  const { identity } = useGetIdentity();
  const [dateRange, setDateRange] = useState(() => ({
    start: format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd"),
    end: format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd"),
  }));

  // Fetch activities for date range
  const { data: activities, isPending: activitiesPending } = useGetList<Activity>(
    "activities",
    {
      pagination: { page: 1, perPage: 10000 },
      filter: {
        "activity_date@gte": dateRange.start,
        "activity_date@lte": dateRange.end,
      },
      sort: { field: "activity_date", order: "DESC" },
    }
  );

  // Fetch sales reps
  const createdByIds = useMemo(
    () => Array.from(new Set((activities || []).map((a) => a.created_by).filter(Boolean))),
    [activities]
  );

  const { data: sales } = useGetList<Sale>("sales", {
    pagination: { page: 1, perPage: 1000 },
    filter: { id: createdByIds },
  });

  // Fetch organizations (principals)
  const orgIds = useMemo(
    () => Array.from(new Set((activities || []).map((a) => a.organization_id).filter(Boolean))),
    [activities]
  );

  const { data: organizations } = useGetList<Organization>("organizations", {
    pagination: { page: 1, perPage: 1000 },
    filter: { id: orgIds },
  });

  // Build lookup maps
  const salesMap = useMemo(
    () => new Map((sales || []).map((s) => [s.id, s])),
    [sales]
  );

  const orgMap = useMemo(
    () => new Map((organizations || []).map((o) => [o.id, o])),
    [organizations]
  );

  // Group activities by rep → principal → type
  const reportData = useMemo(() => {
    if (!activities) return [];

    const groups = new Map<
      number,
      {
        rep: Sale;
        principals: Map<
          number,
          {
            org: Organization;
            calls: number;
            emails: number;
            meetings: number;
            notes: number;
            total: number;
          }
        >;
      }
    >();

    activities.forEach((activity) => {
      if (!activity.created_by) return;

      const rep = salesMap.get(activity.created_by);
      if (!rep) return;

      if (!groups.has(activity.created_by)) {
        groups.set(activity.created_by, { rep, principals: new Map() });
      }

      const repGroup = groups.get(activity.created_by)!;

      const orgId = activity.organization_id || 0;
      if (!repGroup.principals.has(orgId)) {
        const org = orgId ? orgMap.get(orgId) : null;
        repGroup.principals.set(orgId, {
          org: org || ({ id: 0, name: "No Principal" } as Organization),
          calls: 0,
          emails: 0,
          meetings: 0,
          notes: 0,
          total: 0,
        });
      }

      const principalStats = repGroup.principals.get(orgId)!;

      // Count by type
      if (activity.type === "call") principalStats.calls++;
      else if (activity.type === "email") principalStats.emails++;
      else if (activity.type === "meeting") principalStats.meetings++;
      else principalStats.notes++;

      principalStats.total++;
    });

    return Array.from(groups.values());
  }, [activities, salesMap, orgMap]);

  const handleExport = () => {
    const exportData: any[] = [];

    reportData.forEach((repGroup) => {
      repGroup.principals.forEach((stats) => {
        exportData.push({
          rep_name: `${repGroup.rep.first_name} ${repGroup.rep.last_name}`,
          principal_name: stats.org.name,
          calls: stats.calls,
          emails: stats.emails,
          meetings: stats.meetings,
          notes: stats.notes,
          total: stats.total,
        });
      });
    });

    jsonExport(exportData, (err, csv) => {
      if (err) {
        console.error("Export error:", err);
        return;
      }
      downloadCSV(csv, `weekly-activity-${dateRange.start}-to-${dateRange.end}`);
    });
  };

  if (activitiesPending || !identity) {
    return (
      <ReportLayout title="Weekly Activity Summary">
        <p className="text-muted-foreground">Loading activities...</p>
      </ReportLayout>
    );
  }

  const totalActivities = activities?.length || 0;

  return (
    <ReportLayout
      title="Weekly Activity Summary"
      onExport={handleExport}
      actions={
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="px-3 py-2 border rounded text-sm"
          />
          <span className="text-muted-foreground">to</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="px-3 py-2 border rounded text-sm"
          />
        </div>
      }
    >
      <div className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Activities</p>
              <p className="text-2xl font-bold">{totalActivities}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Active Reps</p>
              <p className="text-2xl font-bold">{reportData.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Avg per Rep</p>
              <p className="text-2xl font-bold">
                {reportData.length > 0 ? Math.round(totalActivities / reportData.length) : 0}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Rep Activity Breakdown */}
        {reportData.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No activities found for this date range
          </p>
        ) : (
          <div className="space-y-6">
            {reportData.map((repGroup) => (
              <RepActivityCard key={repGroup.rep.id} repGroup={repGroup} />
            ))}
          </div>
        )}
      </div>
    </ReportLayout>
  );
}

interface RepActivityCardProps {
  repGroup: {
    rep: Sale;
    principals: Map<
      number,
      {
        org: Organization;
        calls: number;
        emails: number;
        meetings: number;
        notes: number;
        total: number;
      }
    >;
  };
}

function RepActivityCard({ repGroup }: RepActivityCardProps) {
  const totalActivities = Array.from(repGroup.principals.values()).reduce(
    (sum, p) => sum + p.total,
    0
  );

  const principalStats = Array.from(repGroup.principals.values()).sort(
    (a, b) => b.total - a.total
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>
            {repGroup.rep.first_name} {repGroup.rep.last_name}
          </span>
          <Badge>{totalActivities} activities</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <table className="w-full">
          <thead>
            <tr className="border-b text-sm text-muted-foreground">
              <th className="text-left py-2">Principal</th>
              <th className="text-right py-2">Calls</th>
              <th className="text-right py-2">Emails</th>
              <th className="text-right py-2">Meetings</th>
              <th className="text-right py-2">Notes</th>
              <th className="text-right py-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {principalStats.map((stats, idx) => (
              <tr
                key={stats.org.id || idx}
                className={`border-b ${stats.total < 3 ? "bg-yellow-50" : ""}`}
              >
                <td className="py-2 flex items-center gap-2">
                  {stats.org.name}
                  {stats.total < 3 && (
                    <Badge variant="outline" className="text-xs">
                      ⚠️ Low Activity
                    </Badge>
                  )}
                </td>
                <td className="text-right">{stats.calls}</td>
                <td className="text-right">{stats.emails}</td>
                <td className="text-right">{stats.meetings}</td>
                <td className="text-right">{stats.notes}</td>
                <td className="text-right font-semibold">{stats.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
```

**Step 2: Test report with sample data**

Run: `npm run dev`
Navigate to: Create route `/reports/weekly-activity` manually in browser
Expected: Report loads, shows activity breakdown

**Step 3: Commit**

```bash
git add src/atomic-crm/reports/WeeklyActivitySummary.tsx
git commit -m "feat(reports): add weekly activity summary with rep/principal breakdown"
```

---

## Task 9: Add Reports Menu to CRM

**Files:**
- Modify: `src/atomic-crm/root/CRM.tsx`

**Step 1: Add custom route for report**

After the `<Resource>` components, add custom routes:

```tsx
<CustomRoutes>
  <Route
    path="/reports/weekly-activity"
    element={<WeeklyActivitySummary />}
  />
</CustomRoutes>
```

**Step 2: Add reports import**

```tsx
import { Route } from "react-router-dom";
import { CustomRoutes } from "react-admin";
import { WeeklyActivitySummary } from "../reports/WeeklyActivitySummary";
```

**Step 3: Add menu item**

Find menu configuration and add Reports section:

```tsx
<Menu.Item
  to="/reports/weekly-activity"
  primaryText="Weekly Activity"
  leftIcon={<BarChart3 />}
/>
```

**Step 4: Add icon import**

```tsx
import { BarChart3 } from "lucide-react";
```

**Step 5: Test navigation**

Run: `npm run dev`
Navigate to menu
Expected: "Weekly Activity" menu item appears

**Step 6: Commit**

```bash
git add src/atomic-crm/root/CRM.tsx
git commit -m "feat(reports): add weekly activity report to navigation"
```

---

## Task 10: Write Unit Tests for Task Validation

**Files:**
- Create: `src/atomic-crm/validation/__tests__/task.test.ts`

**Step 1: Write validation tests**

```typescript
import { describe, it, expect } from "vitest";
import {
  taskSchema,
  taskUpdateSchema,
  taskCreateSchema,
  getTaskDefaultValues,
} from "../task";

describe("Task Validation", () => {
  describe("taskSchema", () => {
    it("validates a complete task", () => {
      const validTask = {
        id: 1,
        title: "Call distributor",
        description: "Discuss pricing",
        due_date: "2025-11-15",
        priority: "high" as const,
        type: "Call" as const,
        completed: false,
      };

      const result = taskSchema.safeParse(validTask);
      expect(result.success).toBe(true);
    });

    it("requires title", () => {
      const invalidTask = {
        due_date: "2025-11-15",
      };

      const result = taskSchema.safeParse(invalidTask);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("title");
      }
    });

    it("requires due_date", () => {
      const invalidTask = {
        title: "Test",
      };

      const result = taskSchema.safeParse(invalidTask);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("due_date");
      }
    });

    it("validates priority enum", () => {
      const invalidTask = {
        title: "Test",
        due_date: "2025-11-15",
        priority: "super-urgent",
      };

      const result = taskSchema.safeParse(invalidTask);
      expect(result.success).toBe(false);
    });

    it("validates type enum", () => {
      const invalidTask = {
        title: "Test",
        due_date: "2025-11-15",
        type: "InvalidType",
      };

      const result = taskSchema.safeParse(invalidTask);
      expect(result.success).toBe(false);
    });
  });

  describe("taskUpdateSchema", () => {
    it("requires id for updates", () => {
      const update = {
        title: "Updated title",
      };

      const result = taskUpdateSchema.safeParse(update);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("id");
      }
    });

    it("allows partial updates with id", () => {
      const update = {
        id: 1,
        completed: true,
      };

      const result = taskUpdateSchema.safeParse(update);
      expect(result.success).toBe(true);
    });
  });

  describe("getTaskDefaultValues", () => {
    it("returns default values with today's date", () => {
      const defaults = getTaskDefaultValues();

      expect(defaults.completed).toBe(false);
      expect(defaults.priority).toBe("medium");
      expect(defaults.type).toBe("None");
      expect(defaults.due_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
});
```

**Step 2: Run tests**

Run: `npm test src/atomic-crm/validation/__tests__/task.test.ts`
Expected: All tests pass

**Step 3: Commit**

```bash
git add src/atomic-crm/validation/__tests__/task.test.ts
git commit -m "test(tasks): add unit tests for task validation schema"
```

---

## Task 11: Add E2E Test for Task Creation

**Files:**
- Create: `tests/e2e/tasks/task-creation.spec.ts`

**Step 1: Write E2E test**

```typescript
import { test, expect } from "@playwright/test";

test.describe("Task Creation", () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto("/login");
    await page.fill('input[name="email"]', "admin@test.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/");
  });

  test("should create a new task from /tasks/create", async ({ page }) => {
    // Navigate to tasks create page
    await page.goto("/tasks/create");

    // Fill in task form
    await page.fill('input[name="title"]', "Test Task - E2E");
    await page.fill('textarea[name="description"]', "This is a test task created via E2E");

    // Set due date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];
    await page.fill('input[name="due_date"]', tomorrowStr);

    // Select priority
    await page.selectOption('select[name="priority"]', "high");

    // Select type
    await page.selectOption('select[name="type"]', "Call");

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to tasks list
    await page.waitForURL("/tasks");

    // Verify task appears in list
    await expect(page.locator("text=Test Task - E2E")).toBeVisible();
  });

  test("should validate required fields", async ({ page }) => {
    await page.goto("/tasks/create");

    // Try to submit without title
    await page.click('button[type="submit"]');

    // Should show validation error
    await expect(page.locator("text=Title is required")).toBeVisible();
  });

  test("should show task in principal-grouped list", async ({ page }) => {
    await page.goto("/tasks");

    // Should show principal groups
    await expect(page.locator("text=No Principal")).toBeVisible();

    // Should show task count per group
    await expect(page.locator("text=tasks")).toBeVisible();
  });
});
```

**Step 2: Run E2E test**

Run: `npm run test:e2e tests/e2e/tasks/`
Expected: Tests pass

**Step 3: Commit**

```bash
git add tests/e2e/tasks/task-creation.spec.ts
git commit -m "test(tasks): add E2E test for task creation flow"
```

---

## Task 12: Update filterRegistry for Tasks

**Files:**
- Modify: `providers/supabase/filterRegistry.ts`

**Step 1: Add tasks to filter registry**

Find the registry object and add:

```typescript
tasks: {
  allowedFilters: [
    "opportunity_id",
    "contact_id",
    "sales_id",
    "due_date@gte",
    "due_date@lte",
    "completed",
    "priority",
    "type",
  ],
  defaultFilter: { completed: false },
},
```

**Step 2: Verify filter cleanup works**

Run: `npm run dev`
Open dev console
Navigate to `/tasks`
Expected: No 400 errors from invalid filters

**Step 3: Commit**

```bash
git add providers/supabase/filterRegistry.ts
git commit -m "feat(tasks): add filter registry to prevent stale filter errors"
```

---

## Task 13: Update Documentation

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Add Tasks Module section**

Add after "Adding Resources" section:

```markdown
## Tasks Module

**Resource:** `/tasks` - Full CRUD task management with principal grouping

**Features:**
- Tasks grouped by principal (organization via opportunity)
- Filter by principal, due date, status, priority, type
- Inline task completion
- CSV export

**Database Schema:**
```sql
CREATE TABLE tasks (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  reminder_date DATE,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  priority priority_level DEFAULT 'medium', -- low, medium, high, critical
  type task_type DEFAULT 'None', -- Call, Email, Meeting, Follow-up, etc.
  contact_id BIGINT,
  opportunity_id BIGINT,
  sales_id BIGINT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Validation:** `src/atomic-crm/validation/task.ts`

**Components:**
- List: Principal-grouped view (default)
- Show: Task detail with links
- Edit: Full form
- Create: Quick-add form
- Filter: Multi-field filtering

**Reports:**
- Weekly Activity Summary: `/reports/weekly-activity`
  - Groups: Sales Rep → Principal → Activity Type Counts
  - Flags low-activity principals (< 3/week)
  - CSV export

**Ref:** [Implementation Plan](docs/plans/2025-11-09-tasks-module-weekly-activity-report.md)
```

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add tasks module and weekly activity report documentation"
```

---

## Verification Checklist

After completing all tasks, verify:

- [ ] Navigate to `/tasks` - list shows tasks grouped by principal
- [ ] Create new task via `/tasks/create` - form works, redirects to list
- [ ] Edit task via `/tasks/:id/edit` - form loads, saves work
- [ ] View task via `/tasks/:id/show` - shows full details
- [ ] Filter tasks by principal, date, status - filters apply correctly
- [ ] Mark task complete from list - checkbox updates status
- [ ] Export tasks to CSV - file downloads with correct data
- [ ] Navigate to `/reports/weekly-activity` - report loads
- [ ] Change date range on report - data updates
- [ ] Export report to CSV - file downloads with rep/principal breakdown
- [ ] Dashboard "View All Tasks" link - navigates to `/tasks`
- [ ] Run `npm test` - all unit tests pass
- [ ] Run `npm run test:e2e` - all E2E tests pass
- [ ] Run `npm run lint:apply` - no linting errors

---

## Success Metrics

After implementation, verify a sales rep can:

1. **Answer "What's my ONE thing for Brand A this week?"** in < 5 seconds
   - Navigate to `/tasks`
   - See "Brand A" group with task count
   - First task in group = ONE thing

2. **Create a task in < 10 seconds**
   - Click "Create Task"
   - Enter title + due date
   - Submit

3. **Mark task complete in < 3 seconds**
   - Check checkbox on task row
   - Task marked complete with timestamp

4. **Manager sees activity in < 5 seconds**
   - Navigate to `/reports/weekly-activity`
   - See rep activity breakdown
   - Identify low-activity principals

---

## References

- **Engineering Constitution:** `docs/claude/engineering-constitution.md`
- **UI Design Consistency:** Use `ui-design-consistency` skill
- **Test-Driven Development:** Use `superpowers:test-driven-development` skill
- **Color System:** `docs/internal-docs/color-theming-architecture.docs.md`
- **Spacing System:** `docs/plans/2025-11-08-spacing-layout-system-design.md`
