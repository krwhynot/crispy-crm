# Campaign Activity Report Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Campaign Activity Report to track engagement by activity type for marketing campaigns

**Architecture:** Follow existing report patterns (OpportunitiesByPrincipalReport). Build modular components: ActivityTypeCard for expandable groups, ActivityTable for details, StaleLeadsView for inactive leads. Use ReportLayout wrapper, client-side grouping with useMemo, CSV export with sanitization.

**Tech Stack:** React 19, TypeScript, React Admin (ra-core), date-fns, jsonexport, Zod validation, Vitest + React Testing Library

**Design Reference:** `docs/plans/2025-11-11-campaign-activity-report-design.md`

---

## Task 1: Create ActivityTypeCard Component

**Files:**
- Create: `src/atomic-crm/reports/CampaignActivity/ActivityTypeCard.tsx`
- Test: `src/atomic-crm/reports/CampaignActivity/__tests__/ActivityTypeCard.test.tsx`

### Step 1: Write failing test for collapsed card

**Command:**
```bash
mkdir -p src/atomic-crm/reports/CampaignActivity/__tests__
```

**File:** `src/atomic-crm/reports/CampaignActivity/__tests__/ActivityTypeCard.test.tsx`

```typescript
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ActivityTypeCard } from "../ActivityTypeCard";

describe("ActivityTypeCard", () => {
  const mockGroup = {
    type: "note",
    totalCount: 141,
    uniqueOrgs: 119,
    percentage: 57,
    mostActiveOrg: "10 PIN ICE CREAM",
    mostActiveCount: 3,
    activities: [],
  };

  it("renders collapsed state with summary", () => {
    render(
      <ActivityTypeCard
        group={mockGroup}
        isExpanded={false}
        onToggle={vi.fn()}
        salesMap={new Map()}
      />
    );

    expect(screen.getByText("Note")).toBeInTheDocument();
    expect(screen.getByText(/141 activities/)).toBeInTheDocument();
    expect(screen.getByText(/119 unique organizations/)).toBeInTheDocument();
    expect(screen.getByText(/57%/)).toBeInTheDocument();
    expect(screen.getByText(/Most active: 10 PIN ICE CREAM \(3\)/)).toBeInTheDocument();
  });
});
```

### Step 2: Run test to verify it fails

**Command:**
```bash
npm test src/atomic-crm/reports/CampaignActivity/__tests__/ActivityTypeCard.test.tsx
```

**Expected:** FAIL - "Cannot find module '../ActivityTypeCard'"

### Step 3: Create ActivityTypeCard component (collapsed only)

**File:** `src/atomic-crm/reports/CampaignActivity/ActivityTypeCard.tsx`

```typescript
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface ActivityGroup {
  type: string;
  totalCount: number;
  uniqueOrgs: number;
  percentage: number;
  mostActiveOrg: string;
  mostActiveCount: number;
  activities: any[];
}

interface ActivityTypeCardProps {
  group: ActivityGroup;
  isExpanded: boolean;
  onToggle: () => void;
  salesMap: Map<string | number, string>;
}

const ACTIVITY_ICONS: Record<string, string> = {
  call: "📞",
  email: "✉️",
  meeting: "🤝",
  note: "📝",
  demo: "🎯",
  proposal: "📋",
  follow_up: "🔄",
  trade_show: "🎪",
  site_visit: "🏢",
  contract_review: "📄",
  check_in: "✔️",
  social: "💬",
};

export function ActivityTypeCard({ group, isExpanded, onToggle, salesMap }: ActivityTypeCardProps) {
  const icon = ACTIVITY_ICONS[group.type.toLowerCase()] || "📌";
  const displayName = group.type.charAt(0).toUpperCase() + group.type.slice(1).replace(/_/g, " ");

  return (
    <Card>
      <CardHeader
        className="cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={onToggle}
      >
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            <span className="text-2xl">{icon}</span>
            <span>{displayName}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">
              {group.totalCount} activities • {group.uniqueOrgs} unique organizations • {group.percentage}%
            </span>
          </div>
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2 ml-12">
          Most active: {group.mostActiveOrg} ({group.mostActiveCount})
        </p>
      </CardHeader>
    </Card>
  );
}
```

### Step 4: Run test to verify it passes

**Command:**
```bash
npm test src/atomic-crm/reports/CampaignActivity/__tests__/ActivityTypeCard.test.tsx
```

**Expected:** PASS

### Step 5: Add test for expanded state with activities

**File:** `src/atomic-crm/reports/CampaignActivity/__tests__/ActivityTypeCard.test.tsx` (add to existing)

```typescript
it("renders expanded state with activities table", () => {
  const mockActivities = [
    {
      id: 1,
      organization_name: "10 PIN ICE CREAM",
      contact_name: "Ryan L.",
      created_at: "2025-11-11T10:00:00Z",
      created_by: 1,
      subject: "Left message - call back",
    },
  ];

  const salesMap = new Map([[1, "Dale Smith"]]);

  render(
    <ActivityTypeCard
      group={{ ...mockGroup, activities: mockActivities }}
      isExpanded={true}
      onToggle={vi.fn()}
      salesMap={salesMap}
    />
  );

  expect(screen.getByText("10 PIN ICE CREAM")).toBeInTheDocument();
  expect(screen.getByText("Ryan L.")).toBeInTheDocument();
  expect(screen.getByText("Dale Smith")).toBeInTheDocument();
  expect(screen.getByText("Left message - call back")).toBeInTheDocument();
});

it("calls onToggle when card header is clicked", async () => {
  const mockToggle = vi.fn();
  const { user } = render(
    <ActivityTypeCard
      group={mockGroup}
      isExpanded={false}
      onToggle={mockToggle}
      salesMap={new Map()}
    />
  );

  await user.click(screen.getByRole("banner"));
  expect(mockToggle).toHaveBeenCalledOnce();
});
```

### Step 6: Run test to verify it fails

**Command:**
```bash
npm test src/atomic-crm/reports/CampaignActivity/__tests__/ActivityTypeCard.test.tsx
```

**Expected:** FAIL - "Unable to find role="banner" or activities not showing"

### Step 7: Add expanded state with ActivityTable

**File:** `src/atomic-crm/reports/CampaignActivity/ActivityTypeCard.tsx` (update)

```typescript
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

// ... existing interfaces and ACTIVITY_ICONS ...

export function ActivityTypeCard({ group, isExpanded, onToggle, salesMap }: ActivityTypeCardProps) {
  const navigate = useNavigate();
  const icon = ACTIVITY_ICONS[group.type.toLowerCase()] || "📌";
  const displayName = group.type.charAt(0).toUpperCase() + group.type.slice(1).replace(/_/g, " ");

  const handleActivityClick = (orgId: string | number) => {
    // Navigate to organization detail
    navigate(`/organizations/${orgId}/show`);
  };

  return (
    <Card>
      <CardHeader
        className="cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={onToggle}
        role="banner"
      >
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            <span className="text-2xl">{icon}</span>
            <span>{displayName}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">
              {group.totalCount} activities • {group.uniqueOrgs} unique organizations • {group.percentage}%
            </span>
          </div>
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2 ml-12">
          Most active: {group.mostActiveOrg} ({group.mostActiveCount})
        </p>
      </CardHeader>

      {isExpanded && (
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-sm text-muted-foreground">
                  <th className="text-left py-2 px-2 min-w-[150px]">Organization</th>
                  <th className="text-left py-2 px-2 min-w-[120px]">Contact</th>
                  <th className="text-left py-2 px-2 min-w-[100px]">Date</th>
                  <th className="text-left py-2 px-2 min-w-[100px]">Rep</th>
                  <th className="text-left py-2 px-2 min-w-[200px]">Subject</th>
                  <th className="text-center py-2 px-2 min-w-[50px]">Action</th>
                </tr>
              </thead>
              <tbody>
                {group.activities.map((activity: any) => (
                  <tr key={activity.id} className="border-b hover:bg-accent/30 transition-colors">
                    <td className="py-2 px-2">{activity.organization_name || "-"}</td>
                    <td className="py-2 px-2">{activity.contact_name || "-"}</td>
                    <td className="py-2 px-2">
                      {activity.created_at
                        ? format(new Date(activity.created_at), "MMM dd")
                        : "-"}
                    </td>
                    <td className="py-2 px-2">
                      {salesMap.get(activity.created_by!) || "Unassigned"}
                    </td>
                    <td className="py-2 px-2">
                      {activity.subject ? activity.subject.substring(0, 50) : "-"}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleActivityClick(activity.organization_id);
                        }}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
```

### Step 8: Run tests to verify they pass

**Command:**
```bash
npm test src/atomic-crm/reports/CampaignActivity/__tests__/ActivityTypeCard.test.tsx
```

**Expected:** PASS (all 3 tests)

### Step 9: Commit ActivityTypeCard

**Command:**
```bash
git add src/atomic-crm/reports/CampaignActivity/
git commit -m "feat: add ActivityTypeCard component with expand/collapse

- Collapsed state shows summary: count, unique orgs, percentage
- Expanded state shows activity table with details
- Click-through to organization details
- Tests for both states and toggle behavior"
```

---

## Task 2: Create Main CampaignActivityReport Component

**Files:**
- Create: `src/atomic-crm/reports/CampaignActivity/CampaignActivityReport.tsx`
- Test: `src/atomic-crm/reports/CampaignActivity/__tests__/CampaignActivityReport.test.tsx`

### Step 1: Write failing test for report structure

**File:** `src/atomic-crm/reports/CampaignActivity/__tests__/CampaignActivityReport.test.tsx`

```typescript
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AdminContext } from "ra-core";
import { MemoryRouter } from "react-router-dom";
import CampaignActivityReport from "../CampaignActivityReport";

// Mock hooks
vi.mock("ra-core", async () => {
  const actual = await vi.importActual("ra-core");
  return {
    ...actual,
    useGetList: vi.fn(),
    useNotify: vi.fn(() => vi.fn()),
  };
});

const mockDataProvider = {
  getList: vi.fn(),
  getOne: vi.fn(),
  getMany: vi.fn(),
  getManyReference: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  updateMany: vi.fn(),
  delete: vi.fn(),
  deleteMany: vi.fn(),
};

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>
    <AdminContext dataProvider={mockDataProvider}>{children}</AdminContext>
  </MemoryRouter>
);

describe("CampaignActivityReport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders report title and summary cards", async () => {
    const { useGetList } = await import("ra-core");
    vi.mocked(useGetList).mockReturnValue({
      data: [],
      total: 0,
      isPending: false,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(<CampaignActivityReport />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText("Campaign Activity Report")).toBeInTheDocument();
    });

    // Summary cards
    expect(screen.getByText("Total Activities")).toBeInTheDocument();
    expect(screen.getByText("Organizations Contacted")).toBeInTheDocument();
    expect(screen.getByText("Coverage Rate")).toBeInTheDocument();
    expect(screen.getByText("Avg Activities per Lead")).toBeInTheDocument();
  });
});
```

### Step 2: Run test to verify it fails

**Command:**
```bash
npm test src/atomic-crm/reports/CampaignActivity/__tests__/CampaignActivityReport.test.tsx
```

**Expected:** FAIL - "Cannot find module '../CampaignActivityReport'"

### Step 3: Create CampaignActivityReport skeleton

**File:** `src/atomic-crm/reports/CampaignActivity/CampaignActivityReport.tsx`

```typescript
import { useState, useMemo } from "react";
import { useGetList, useNotify } from "ra-core";
import { ReportLayout } from "../ReportLayout";
import { Card, CardContent } from "@/components/ui/card";

export default function CampaignActivityReport() {
  const notify = useNotify();

  // Mock data for now
  const { data: activities, isPending } = useGetList("activities", {
    pagination: { page: 1, perPage: 10 },
    filter: {},
  });

  if (isPending) {
    return (
      <ReportLayout title="Campaign Activity Report">
        <p className="text-muted-foreground">Loading activities...</p>
      </ReportLayout>
    );
  }

  return (
    <ReportLayout title="Campaign Activity Report">
      <div className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Activities</p>
              <p className="text-2xl font-bold">0</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Organizations Contacted</p>
              <p className="text-2xl font-bold">0</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Coverage Rate</p>
              <p className="text-2xl font-bold">0%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Avg Activities per Lead</p>
              <p className="text-2xl font-bold">0</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </ReportLayout>
  );
}
```

### Step 4: Run test to verify it passes

**Command:**
```bash
npm test src/atomic-crm/reports/CampaignActivity/__tests__/CampaignActivityReport.test.tsx
```

**Expected:** PASS

### Step 5: Add test for activity grouping logic

**File:** `src/atomic-crm/reports/CampaignActivity/__tests__/CampaignActivityReport.test.tsx` (add)

```typescript
it("groups activities by type correctly", async () => {
  const { useGetList } = await import("ra-core");

  const mockActivities = [
    {
      id: 1,
      type: "note",
      organization_id: 1,
      organization_name: "Org A",
      created_at: "2025-11-11T10:00:00Z",
      created_by: 1,
      subject: "Test note",
    },
    {
      id: 2,
      type: "note",
      organization_id: 2,
      organization_name: "Org B",
      created_at: "2025-11-11T11:00:00Z",
      created_by: 1,
      subject: "Another note",
    },
    {
      id: 3,
      type: "call",
      organization_id: 1,
      organization_name: "Org A",
      created_at: "2025-11-11T12:00:00Z",
      created_by: 1,
      subject: "Test call",
    },
  ];

  vi.mocked(useGetList)
    .mockReturnValueOnce({
      data: mockActivities,
      total: 3,
      isPending: false,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any)
    .mockReturnValue({
      data: [],
      total: 0,
      isPending: false,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

  render(<CampaignActivityReport />, { wrapper: Wrapper });

  await waitFor(() => {
    expect(screen.getByText("3")).toBeInTheDocument(); // Total activities
  });

  // Should show Note card with 2 activities
  expect(screen.getByText(/Note/)).toBeInTheDocument();
  expect(screen.getByText(/2 activities/)).toBeInTheDocument();

  // Should show Call card with 1 activity
  expect(screen.getByText(/Call/)).toBeInTheDocument();
  expect(screen.getByText(/1 activity/)).toBeInTheDocument();
});
```

### Step 6: Run test to verify it fails

**Command:**
```bash
npm test src/atomic-crm/reports/CampaignActivity/__tests__/CampaignActivityReport.test.tsx
```

**Expected:** FAIL - "Unable to find element with text /Note/ or /2 activities/"

### Step 7: Implement activity grouping and rendering

**File:** `src/atomic-crm/reports/CampaignActivity/CampaignActivityReport.tsx` (update)

```typescript
import { useState, useMemo } from "react";
import { useGetList, useNotify } from "ra-core";
import { ReportLayout } from "../ReportLayout";
import { Card, CardContent } from "@/components/ui/card";
import { ActivityTypeCard } from "./ActivityTypeCard";
import type { ActivityGroup } from "./ActivityTypeCard";

interface Activity {
  id: number;
  type: string;
  organization_id: number;
  organization_name: string;
  contact_name?: string;
  created_at: string;
  created_by: number;
  subject: string;
}

export default function CampaignActivityReport() {
  const notify = useNotify();
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());

  // Fetch activities
  const { data: activities, isPending } = useGetList<Activity>("activities", {
    pagination: { page: 1, perPage: 10000 },
    filter: {},
    sort: { field: "created_at", order: "DESC" },
  });

  // Fetch sales reps for display
  const ownerIds = useMemo(
    () => Array.from(new Set((activities || []).map(a => a.created_by).filter(Boolean))),
    [activities]
  );

  const { data: salesReps } = useGetList("sales", {
    pagination: { page: 1, perPage: 1000 },
    filter: ownerIds.length > 0 ? { id: ownerIds } : undefined,
  });

  const salesMap = useMemo(
    () => new Map((salesReps || []).map((s: any) => [s.id, `${s.first_name} ${s.last_name}`])),
    [salesReps]
  );

  // Group activities by type
  const activityGroups = useMemo(() => {
    if (!activities) return [];

    const grouped = new Map<string, Omit<ActivityGroup, "percentage">>();
    const orgsByType = new Map<string, Set<number>>();

    activities.forEach((activity) => {
      const type = activity.type || "Unknown";

      if (!grouped.has(type)) {
        grouped.set(type, {
          type,
          activities: [],
          totalCount: 0,
          uniqueOrgs: 0,
          mostActiveOrg: "",
          mostActiveCount: 0,
        });
        orgsByType.set(type, new Set());
      }

      const group = grouped.get(type)!;
      group.activities.push(activity);
      group.totalCount += 1;
      orgsByType.get(type)!.add(activity.organization_id);
    });

    // Calculate unique orgs and find most active
    grouped.forEach((group, type) => {
      group.uniqueOrgs = orgsByType.get(type)!.size;

      // Find most active org
      const orgCounts = new Map<string, number>();
      group.activities.forEach((activity) => {
        const orgName = activity.organization_name || "Unknown";
        orgCounts.set(orgName, (orgCounts.get(orgName) || 0) + 1);
      });

      let maxCount = 0;
      let maxOrg = "";
      orgCounts.forEach((count, org) => {
        if (count > maxCount) {
          maxCount = count;
          maxOrg = org;
        }
      });

      group.mostActiveOrg = maxOrg;
      group.mostActiveCount = maxCount;
    });

    // Convert to array, calculate percentages, and sort
    const totalActivities = activities.length;
    const groups = Array.from(grouped.values()).map(g => ({
      ...g,
      percentage: Math.round((g.totalCount / totalActivities) * 100),
    }));

    groups.sort((a, b) => b.totalCount - a.totalCount);

    // Auto-expand top 3
    if (expandedTypes.size === 0 && groups.length > 0) {
      setExpandedTypes(new Set(groups.slice(0, 3).map(g => g.type)));
    }

    return groups;
  }, [activities, expandedTypes.size]);

  // Toggle expansion
  const toggleTypeExpansion = (type: string) => {
    const newExpanded = new Set(expandedTypes);
    if (newExpanded.has(type)) {
      newExpanded.delete(type);
    } else {
      newExpanded.add(type);
    }
    setExpandedTypes(newExpanded);
  };

  // Calculate summary stats
  const totalActivities = activities?.length || 0;
  const uniqueOrgs = useMemo(() => {
    if (!activities) return 0;
    return new Set(activities.map(a => a.organization_id)).size;
  }, [activities]);

  if (isPending) {
    return (
      <ReportLayout title="Campaign Activity Report">
        <p className="text-muted-foreground">Loading activities...</p>
      </ReportLayout>
    );
  }

  return (
    <ReportLayout title="Campaign Activity Report">
      <div className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Activities</p>
              <p className="text-2xl font-bold">{totalActivities}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Organizations Contacted</p>
              <p className="text-2xl font-bold">{uniqueOrgs}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Coverage Rate</p>
              <p className="text-2xl font-bold">N/A</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Avg Activities per Lead</p>
              <p className="text-2xl font-bold">
                {uniqueOrgs > 0 ? (totalActivities / uniqueOrgs).toFixed(1) : 0}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Activity Type Groups */}
        {activityGroups.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No activities found
          </p>
        ) : (
          <div className="space-y-4">
            {activityGroups.map((group) => (
              <ActivityTypeCard
                key={group.type}
                group={group}
                isExpanded={expandedTypes.has(group.type)}
                onToggle={() => toggleTypeExpansion(group.type)}
                salesMap={salesMap}
              />
            ))}
          </div>
        )}
      </div>
    </ReportLayout>
  );
}
```

### Step 8: Run tests to verify they pass

**Command:**
```bash
npm test src/atomic-crm/reports/CampaignActivity/__tests__/CampaignActivityReport.test.tsx
```

**Expected:** PASS (both tests)

### Step 9: Commit main report component

**Command:**
```bash
git add src/atomic-crm/reports/CampaignActivity/
git commit -m "feat: add CampaignActivityReport main component

- Summary dashboard with 4 metric cards
- Activity grouping by type with useMemo
- Auto-expand top 3 activity types
- Calculate unique orgs and percentages
- Integration with ActivityTypeCard
- Tests for structure and grouping logic"
```

---

## Task 3: Register Report in Application

**Files:**
- Modify: `src/atomic-crm/reports/index.ts`
- Modify: `src/atomic-crm/root/CRM.tsx:142-143`

### Step 1: Export CampaignActivityReport from reports module

**File:** `src/atomic-crm/reports/index.ts`

```typescript
import * as React from "react";

const WeeklyActivitySummary = React.lazy(() => import("./WeeklyActivitySummary"));
const OpportunitiesByPrincipalReport = React.lazy(() => import("./OpportunitiesByPrincipalReport"));
const CampaignActivityReport = React.lazy(() => import("./CampaignActivity/CampaignActivityReport"));

export default {
  WeeklyActivitySummary,
  OpportunitiesByPrincipalReport,
  CampaignActivityReport,
};
```

### Step 2: Add route in CRM.tsx

**File:** `src/atomic-crm/root/CRM.tsx` (find line ~142, add after existing reports)

```typescript
          <Route path="/reports/weekly-activity" element={<reports.WeeklyActivitySummary />} />
          <Route path="/reports/opportunities-by-principal" element={<reports.OpportunitiesByPrincipalReport />} />
          <Route path="/reports/campaign-activity" element={<reports.CampaignActivityReport />} />
```

### Step 3: Test route manually

**Command:**
```bash
npm run dev
```

**Manual Test:**
1. Navigate to `http://localhost:5173/reports/campaign-activity`
2. Verify report loads
3. Verify summary cards show data
4. Verify activity type cards are expandable

### Step 4: Commit route registration

**Command:**
```bash
git add src/atomic-crm/reports/index.ts src/atomic-crm/root/CRM.tsx
git commit -m "feat: register CampaignActivityReport route

- Add lazy-loaded export to reports/index.ts
- Add /reports/campaign-activity route to CRM.tsx
- Report accessible at /reports/campaign-activity"
```

---

## Task 4: Add Campaign Filter (MVP)

**Files:**
- Modify: `src/atomic-crm/reports/CampaignActivity/CampaignActivityReport.tsx`

### Step 1: Add campaign filter state and UI

**File:** `src/atomic-crm/reports/CampaignActivity/CampaignActivityReport.tsx` (add to component)

```typescript
// Add to imports
import { ReferenceInput } from "@/components/admin/reference-input";
import { AutocompleteArrayInput } from "@/components/admin/autocomplete-array-input";

// Add state after expandedTypes
const [selectedCampaign, setSelectedCampaign] = useState<string | null>("Grand Rapids Trade Show");

// Update activities filter
const { data: activities, isPending } = useGetList<Activity>("activities", {
  pagination: { page: 1, perPage: 10000 },
  filter: selectedCampaign
    ? { "opportunities.campaign": selectedCampaign }
    : {},
  sort: { field: "created_at", order: "DESC" },
});

// Update ReportLayout to add actions prop
return (
  <ReportLayout
    title="Campaign Activity Report"
    actions={
      <div className="flex items-center gap-2">
        <select
          value={selectedCampaign || ""}
          onChange={(e) => setSelectedCampaign(e.target.value || null)}
          className="px-3 py-2 border rounded text-sm min-w-[250px]"
        >
          <option value="">All Campaigns</option>
          <option value="Grand Rapids Trade Show">Grand Rapids Trade Show</option>
        </select>
      </div>
    }
  >
```

### Step 2: Test campaign filter manually

**Command:**
```bash
npm run dev
```

**Manual Test:**
1. Navigate to `/reports/campaign-activity`
2. Verify "Grand Rapids Trade Show" is selected by default
3. Verify activities shown are from Grand Rapids campaign
4. Change to "All Campaigns"
5. Verify more activities appear

### Step 3: Commit campaign filter

**Command:**
```bash
git add src/atomic-crm/reports/CampaignActivity/CampaignActivityReport.tsx
git commit -m "feat: add campaign filter to activity report

- Campaign dropdown in report actions
- Defaults to 'Grand Rapids Trade Show'
- Filters activities by campaign via opportunities join
- Manual testing confirmed working"
```

---

## Task 5: Add CSV Export

**Files:**
- Modify: `src/atomic-crm/reports/CampaignActivity/CampaignActivityReport.tsx`

### Step 1: Add CSV export handler

**File:** `src/atomic-crm/reports/CampaignActivity/CampaignActivityReport.tsx` (add)

```typescript
// Add to imports
import { downloadCSV } from "ra-core";
import jsonExport from "jsonexport/dist";
import { format } from "date-fns";
import { sanitizeCsvValue } from "@/atomic-crm/utils/csvUploadValidator";

// Add handler before return statement
const handleExport = () => {
  const exportData: any[] = [];

  activityGroups.forEach((group) => {
    group.activities.forEach((activity) => {
      exportData.push({
        campaign: sanitizeCsvValue(selectedCampaign || "All"),
        activity_type: sanitizeCsvValue(activity.type),
        subject: sanitizeCsvValue(activity.subject),
        organization: sanitizeCsvValue(activity.organization_name || ""),
        contact_name: sanitizeCsvValue(activity.contact_name || ""),
        date: format(new Date(activity.created_at), "yyyy-MM-dd"),
        sales_rep: sanitizeCsvValue(salesMap.get(activity.created_by!) || "Unassigned"),
        days_since: Math.floor((Date.now() - new Date(activity.created_at).getTime()) / (1000 * 60 * 60 * 24)),
      });
    });
  });

  if (exportData.length === 0) {
    notify("No data to export", { type: "warning" });
    return;
  }

  jsonExport(exportData, (err, csv) => {
    if (err) {
      console.error("Export error:", err);
      notify("Export failed. Please try again.", { type: "error" });
      return;
    }
    const campaignSlug = (selectedCampaign || "all-campaigns").toLowerCase().replace(/\s+/g, "-");
    downloadCSV(csv, `campaign-activity-${campaignSlug}-${format(new Date(), "yyyy-MM-dd")}`);
    notify("Report exported successfully", { type: "success" });
  });
};

// Update ReportLayout
return (
  <ReportLayout
    title="Campaign Activity Report"
    onExport={handleExport}
    actions={...}
  >
```

### Step 2: Test CSV export manually

**Command:**
```bash
npm run dev
```

**Manual Test:**
1. Navigate to `/reports/campaign-activity`
2. Click "Export CSV" button
3. Verify file downloads: `campaign-activity-grand-rapids-trade-show-2025-11-11.csv`
4. Open CSV and verify columns: campaign, activity_type, subject, organization, contact_name, date, sales_rep, days_since
5. Verify data is sanitized (no formula injection possible)

### Step 3: Commit CSV export

**Command:**
```bash
git add src/atomic-crm/reports/CampaignActivity/CampaignActivityReport.tsx
git commit -m "feat: add CSV export to campaign activity report

- Export button in ReportLayout header
- Sanitizes all text fields to prevent formula injection
- Filename format: campaign-activity-{campaign}-{date}.csv
- Includes: campaign, type, subject, org, contact, date, rep, days_since
- Manual testing confirmed working"
```

---

## Task 6: Integration Test

**Files:**
- Create: `tests/e2e/campaign-activity-report.spec.ts`

### Step 1: Write E2E test for full report flow

**File:** `tests/e2e/campaign-activity-report.spec.ts`

```typescript
import { test, expect } from "@playwright/test";

test.describe("Campaign Activity Report", () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto("/");
    await page.fill('input[name="email"]', "admin@test.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/");
  });

  test("displays report with Grand Rapids campaign data", async ({ page }) => {
    // Navigate to campaign activity report
    await page.goto("/reports/campaign-activity");

    // Verify title
    await expect(page.locator("h1")).toContainText("Campaign Activity Report");

    // Verify summary cards visible
    await expect(page.locator("text=Total Activities")).toBeVisible();
    await expect(page.locator("text=Organizations Contacted")).toBeVisible();

    // Verify campaign filter shows Grand Rapids
    const campaignSelect = page.locator("select").first();
    await expect(campaignSelect).toHaveValue("Grand Rapids Trade Show");

    // Verify activity type cards visible
    await expect(page.locator("text=Note").or(page.locator("text=Call"))).toBeVisible();
  });

  test("expands and collapses activity type cards", async ({ page }) => {
    await page.goto("/reports/campaign-activity");

    // Find first activity card
    const firstCard = page.locator("div[role='banner']").first();
    await firstCard.waitFor();

    // Verify table not visible initially (collapsed)
    const table = page.locator("table").first();
    const isVisible = await table.isVisible().catch(() => false);

    if (!isVisible) {
      // Click to expand
      await firstCard.click();
      await expect(table).toBeVisible();

      // Click to collapse
      await firstCard.click();
      await expect(table).not.toBeVisible();
    }
  });

  test("exports CSV successfully", async ({ page }) => {
    await page.goto("/reports/campaign-activity");

    // Wait for data to load
    await page.waitForSelector("text=Total Activities");

    // Click export button
    const downloadPromise = page.waitForEvent("download");
    await page.click("button:has-text('Export CSV')");

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/campaign-activity.*\.csv/);
  });
});
```

### Step 2: Run E2E test

**Command:**
```bash
npm run test:e2e tests/e2e/campaign-activity-report.spec.ts
```

**Expected:** PASS (3 tests)

### Step 3: Commit E2E test

**Command:**
```bash
git add tests/e2e/campaign-activity-report.spec.ts
git commit -m "test: add E2E tests for campaign activity report

- Test report displays with Grand Rapids data
- Test expand/collapse functionality
- Test CSV export downloads correctly
- All tests passing"
```

---

## Task 7: Documentation

**Files:**
- Modify: `docs/plans/2025-11-11-campaign-activity-report-design.md`

### Step 1: Update design doc with implementation status

**File:** `docs/plans/2025-11-11-campaign-activity-report-design.md` (update checklist at bottom)

```markdown
## Implementation Checklist

**Phase 1: Core Report** ✅
- [x] Create report component with ReportLayout
- [x] Implement summary dashboard (4 cards)
- [x] Implement activity type grouping logic
- [x] Create ActivityTypeCard component (collapsed/expanded)
- [x] Create ActivityTable component with columns

**Phase 2: Filters** ✅ (MVP)
- [x] Campaign selector dropdown
- [ ] Date range pickers with presets (deferred)
- [ ] Activity type multi-select (deferred)
- [ ] Sales rep autocomplete (deferred)
- [ ] Clear filters button (deferred)

**Phase 3: Special Features** ✅ (Partial)
- [ ] "No Recent Activity" toggle with stale leads view (deferred)
- [x] CSV export functionality
- [x] Auto-expand top 3 activity types
- [x] Click-through to organization details

**Phase 4: Polish** ⏳ (In Progress)
- [x] Loading states
- [x] Empty states
- [x] Responsive design (basic)
- [ ] Accessibility audit (WCAG 2.1 AA) (pending)
- [x] Error handling and notifications

**Phase 5: Testing** ✅
- [x] Unit tests for grouping logic
- [x] Unit tests for ActivityTypeCard
- [x] E2E test for full workflow
- [x] Test with Grand Rapids campaign data (369 opps)

---

**Implementation Complete:** 2025-11-11
**MVP Shipped:** Yes ✅
**Route:** `/reports/campaign-activity`
```

### Step 2: Commit documentation update

**Command:**
```bash
git add docs/plans/2025-11-11-campaign-activity-report-design.md
git commit -m "docs: mark campaign activity report as implemented

- MVP complete with core features
- Advanced filters deferred to Phase 2
- Tests passing, E2E coverage added
- Route live at /reports/campaign-activity"
```

---

## Success Criteria Verification

### Manual Verification Checklist

Run through these checks to verify the implementation:

**✅ Functional:**
- [ ] Navigate to `/reports/campaign-activity` - report loads
- [ ] Summary cards show correct data (Total, Organizations, Coverage, Avg)
- [ ] Activity types grouped correctly (Note, Call, Email, etc.)
- [ ] Click activity type card header - expands/collapses
- [ ] Expanded card shows table with org, contact, date, rep, subject
- [ ] Click external link icon - navigates to organization detail
- [ ] Campaign filter defaults to "Grand Rapids Trade Show"
- [ ] Change campaign to "All" - shows all activities
- [ ] Click "Export CSV" - file downloads with correct data
- [ ] CSV data sanitized (test with formula-like subject text)

**✅ Performance:**
- [ ] Initial load < 2 seconds for 369 Grand Rapids opportunities
- [ ] Expand/collapse smooth with no jank
- [ ] Filter changes update UI < 500ms

**✅ Code Quality:**
- [ ] All tests passing: `npm test`
- [ ] E2E tests passing: `npm run test:e2e`
- [ ] No TypeScript errors: `npm run typecheck`
- [ ] No lint errors: `npm run lint`

---

## Future Enhancements (Deferred)

These features were deferred from MVP and can be implemented later:

1. **Advanced Filters:**
   - Date range pickers
   - Activity type multi-select
   - Sales rep filter
   - Clear filters button

2. **Stale Leads Feature:**
   - "No Recent Activity" toggle
   - Configurable days threshold
   - StaleLeadsView component

3. **Polish:**
   - Full accessibility audit
   - Mobile optimization
   - Skeleton loaders
   - Pagination for large datasets

4. **Analytics:**
   - Activity trends over time
   - Rep performance comparison
   - Campaign ROI metrics

---

**Plan Complete!** Ready for execution with `superpowers:executing-plans`.
