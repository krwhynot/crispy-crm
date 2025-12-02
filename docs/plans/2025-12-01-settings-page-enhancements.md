# Settings Page Enhancements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement industry-standard CRM settings page features, grouped by MVP (essential) and Good-to-Have (future enhancements).

**Architecture:** Extend existing SettingsPage.tsx with grouped sections (Personal, Notifications, Security). Add new columns to `sales` table for user preferences. Leverage existing `audit_trail` table for activity logging.

**Tech Stack:** React, React Admin, Supabase, shadcn/ui, Zod validation, Tailwind CSS v4

---

## Current State Analysis

### Already Implemented
- ✅ Personal Settings: Avatar, name, email, password reset
- ✅ User Management: List, create, edit, delete (soft-delete)
- ✅ Role System: 3-tier (admin, manager, rep) with badges
- ✅ Digest Preferences: Email opt-in/out
- ✅ Audit Trail: Full field-level change tracking in `audit_trail` table

### Database Schema (sales table)
```sql
-- Existing columns we'll use:
id, user_id, first_name, last_name, email, role, disabled,
avatar_url, digest_opt_in, deleted_at, created_at, updated_at
```

---

# PHASE 1: MVP Features (Industry Essential)

## Task 1: Time Zone Preference

**Priority:** MVP - Critical for distributed teams and accurate timestamps

**Files:**
- Create: `supabase/migrations/YYYYMMDDHHMMSS_add_timezone_to_sales.sql`
- Modify: `src/atomic-crm/settings/SettingsPage.tsx`
- Modify: `src/atomic-crm/types.ts` (Sale interface)
- Modify: `src/atomic-crm/validation/sales.ts`

### Step 1: Create database migration

```sql
-- Migration: add_timezone_to_sales
ALTER TABLE sales
ADD COLUMN timezone TEXT DEFAULT 'America/New_York'
  CHECK (timezone ~ '^[A-Za-z]+/[A-Za-z_]+$');

COMMENT ON COLUMN sales.timezone IS
  'User timezone for display. Uses IANA timezone format (e.g., America/New_York).';
```

### Step 2: Run migration

```bash
npx supabase migration new add_timezone_to_sales
# Paste SQL into the new file
npm run db:cloud:push:dry-run
npm run db:cloud:push
```

### Step 3: Update Sale interface in types.ts

```typescript
// Add to Sale interface at line ~49
timezone?: string; // IANA timezone (e.g., 'America/New_York')
```

### Step 4: Update Zod schema in validation/sales.ts

```typescript
// Add to salesSchema
timezone: z.string().regex(/^[A-Za-z]+\/[A-Za-z_]+$/).default('America/New_York'),
```

### Step 5: Create TimeZoneSelect component

```typescript
// src/atomic-crm/settings/TimeZoneSelect.tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const COMMON_TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Phoenix', label: 'Arizona (no DST)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)' },
  { value: 'UTC', label: 'UTC' },
];

interface TimeZoneSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function TimeZoneSelect({ value, onChange, disabled }: TimeZoneSelectProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="timezone">Time Zone</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id="timezone">
          <SelectValue placeholder="Select time zone" />
        </SelectTrigger>
        <SelectContent>
          {COMMON_TIMEZONES.map((tz) => (
            <SelectItem key={tz.value} value={tz.value}>
              {tz.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-sm text-muted-foreground">
        Times will be displayed in your selected timezone
      </p>
    </div>
  );
}
```

### Step 6: Add TimeZoneSelect to SettingsPage

Add after the email field in SettingsForm:
```typescript
<TimeZoneSelect
  value={record?.timezone || 'America/New_York'}
  onChange={(value) => mutateSale({ ...record, timezone: value })}
  disabled={!isEditMode}
/>
```

### Step 7: Commit

```bash
git add supabase/migrations/ src/atomic-crm/settings/ src/atomic-crm/types.ts src/atomic-crm/validation/sales.ts
git commit -m "feat: add timezone preference to user settings

- Add timezone column to sales table
- Create TimeZoneSelect component with US timezones
- Integrate into SettingsPage for user preference"
```

---

## Task 2: Grouped Settings Sections with Navigation

**Priority:** MVP - Industry standard UX pattern

**Files:**
- Modify: `src/atomic-crm/settings/SettingsPage.tsx`
- Create: `src/atomic-crm/settings/SettingsLayout.tsx`
- Create: `src/atomic-crm/settings/sections/PersonalSection.tsx`
- Create: `src/atomic-crm/settings/sections/NotificationsSection.tsx`
- Create: `src/atomic-crm/settings/sections/SecuritySection.tsx`

### Step 1: Create SettingsLayout component

```typescript
// src/atomic-crm/settings/SettingsLayout.tsx
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Bell, Shield, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  component: React.ReactNode;
}

interface SettingsLayoutProps {
  sections: SettingsSection[];
}

export function SettingsLayout({ sections }: SettingsLayoutProps) {
  const [activeSection, setActiveSection] = useState(sections[0]?.id);

  const currentSection = sections.find(s => s.id === activeSection);

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <Card className="md:col-span-1">
          <CardContent className="p-2">
            <nav className="space-y-1">
              {sections.map((section) => (
                <Button
                  key={section.id}
                  variant={activeSection === section.id ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3",
                    activeSection === section.id && "bg-muted"
                  )}
                  onClick={() => setActiveSection(section.id)}
                >
                  {section.icon}
                  {section.label}
                  {activeSection === section.id && (
                    <ChevronRight className="ml-auto h-4 w-4" />
                  )}
                </Button>
              ))}
            </nav>
          </CardContent>
        </Card>

        {/* Content Area */}
        <div className="md:col-span-3">
          {currentSection?.component}
        </div>
      </div>
    </div>
  );
}
```

### Step 2: Extract PersonalSection from SettingsPage

```typescript
// src/atomic-crm/settings/sections/PersonalSection.tsx
// Move existing SettingsForm content here with minor refactoring
```

### Step 3: Create NotificationsSection

```typescript
// src/atomic-crm/settings/sections/NotificationsSection.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useRecordContext } from "ra-core";
import type { Sale } from "../../types";

export function NotificationsSection() {
  const record = useRecordContext<Sale>();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Daily Digest - Already exists */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="digest">Daily Digest Email</Label>
            <p className="text-sm text-muted-foreground">
              Receive a daily summary of activities and tasks
            </p>
          </div>
          <Switch
            id="digest"
            checked={record?.digest_opt_in ?? true}
            // onCheckedChange handler
          />
        </div>

        <div className="border-t pt-4">
          <p className="text-sm text-muted-foreground">
            More notification options coming soon: task reminders,
            opportunity updates, and @mentions.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Step 4: Create SecuritySection

```typescript
// src/atomic-crm/settings/sections/SecuritySection.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Key, Shield } from "lucide-react";
import { useGetIdentity } from "ra-core";

export function SecuritySection({ onPasswordChange }: { onPasswordChange: () => void }) {
  const { data: identity } = useGetIdentity();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Security
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Password Section */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              <Label>Password</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Last changed: Unknown
            </p>
          </div>
          <Button variant="outline" onClick={onPasswordChange}>
            Change Password
          </Button>
        </div>

        {/* Role Display */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Account Role</Label>
              <p className="text-sm text-muted-foreground">
                Your access level in the system
              </p>
            </div>
            <Badge variant="outline" className="capitalize">
              {identity?.role || 'rep'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Step 5: Update SettingsPage to use new layout

```typescript
// src/atomic-crm/settings/SettingsPage.tsx
import { SettingsLayout } from "./SettingsLayout";
import { PersonalSection } from "./sections/PersonalSection";
import { NotificationsSection } from "./sections/NotificationsSection";
import { SecuritySection } from "./sections/SecuritySection";
import { User, Bell, Shield } from "lucide-react";

export const SettingsPage = () => {
  // ... existing data fetching

  const sections = [
    {
      id: 'personal',
      label: 'Personal',
      icon: <User className="h-4 w-4" />,
      component: <PersonalSection />,
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: <Bell className="h-4 w-4" />,
      component: <NotificationsSection />,
    },
    {
      id: 'security',
      label: 'Security',
      icon: <Shield className="h-4 w-4" />,
      component: <SecuritySection onPasswordChange={handleClickOpenPasswordChange} />,
    },
  ];

  return <SettingsLayout sections={sections} />;
};
```

### Step 6: Commit

```bash
git add src/atomic-crm/settings/
git commit -m "feat: reorganize settings into grouped sections

- Create SettingsLayout with sidebar navigation
- Split settings into Personal, Notifications, Security sections
- Industry-standard grouped settings UX pattern"
```

---

## Task 3: Role Permissions Matrix (Read-Only Display)

**Priority:** MVP - Users need to understand what their role allows

**Files:**
- Create: `src/atomic-crm/settings/RolePermissionsMatrix.tsx`
- Modify: `src/atomic-crm/settings/sections/SecuritySection.tsx`

### Step 1: Create RolePermissionsMatrix component

```typescript
// src/atomic-crm/settings/RolePermissionsMatrix.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";

const PERMISSIONS = [
  {
    category: 'Records',
    permissions: [
      { name: 'View all contacts', rep: true, manager: true, admin: true },
      { name: 'Edit own records', rep: true, manager: true, admin: true },
      { name: 'Edit team records', rep: false, manager: true, admin: true },
      { name: 'Delete records', rep: false, manager: false, admin: true },
    ]
  },
  {
    category: 'Opportunities',
    permissions: [
      { name: 'View all opportunities', rep: true, manager: true, admin: true },
      { name: 'Create opportunities', rep: true, manager: true, admin: true },
      { name: 'Edit any opportunity', rep: false, manager: true, admin: true },
      { name: 'Archive opportunities', rep: false, manager: true, admin: true },
    ]
  },
  {
    category: 'Administration',
    permissions: [
      { name: 'View user list', rep: false, manager: true, admin: true },
      { name: 'Create users', rep: false, manager: false, admin: true },
      { name: 'Modify user roles', rep: false, manager: false, admin: true },
      { name: 'Remove users', rep: false, manager: false, admin: true },
    ]
  },
];

interface RolePermissionsMatrixProps {
  currentRole: 'admin' | 'manager' | 'rep';
}

export function RolePermissionsMatrix({ currentRole }: RolePermissionsMatrixProps) {
  const PermissionIcon = ({ allowed }: { allowed: boolean }) => (
    allowed
      ? <Check className="h-4 w-4 text-success" />
      : <X className="h-4 w-4 text-muted-foreground" />
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Permissions for your role:
          <Badge variant="outline" className="ml-2 capitalize">{currentRole}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {PERMISSIONS.map((category) => (
            <div key={category.category}>
              <h4 className="font-medium text-sm text-muted-foreground mb-2">
                {category.category}
              </h4>
              <ul className="space-y-1">
                {category.permissions.map((perm) => (
                  <li key={perm.name} className="flex items-center gap-2 text-sm">
                    <PermissionIcon allowed={perm[currentRole]} />
                    <span className={perm[currentRole] ? '' : 'text-muted-foreground'}>
                      {perm.name}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

### Step 2: Add to SecuritySection

```typescript
// In SecuritySection.tsx, add after role badge:
<RolePermissionsMatrix currentRole={identity?.role || 'rep'} />
```

### Step 3: Commit

```bash
git add src/atomic-crm/settings/
git commit -m "feat: add role permissions matrix to security settings

- Visual display of what each role can do
- Helps users understand their access level
- Read-only, informational component"
```

---

# PHASE 2: Good-to-Have Features

## Task 4: Activity Audit Log (Using Existing audit_trail Table)

**Priority:** Good-to-Have - Admin feature for tracking changes

**Files:**
- Create: `src/atomic-crm/settings/AuditLogSection.tsx`
- Modify: `src/atomic-crm/settings/SettingsPage.tsx`

### Step 1: Create AuditLogSection component

```typescript
// src/atomic-crm/settings/AuditLogSection.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGetList, useGetIdentity } from "ra-core";
import { formatDistanceToNow } from "date-fns";
import { History, User } from "lucide-react";

export function AuditLogSection() {
  const { data: identity } = useGetIdentity();

  // Only show to admins
  if (identity?.role !== 'admin') {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Activity log is only available to administrators.
        </CardContent>
      </Card>
    );
  }

  const { data: auditEntries, isLoading } = useGetList('audit_trail', {
    pagination: { page: 1, perPage: 50 },
    sort: { field: 'changed_at', order: 'DESC' },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {auditEntries?.map((entry: any) => (
                <div key={entry.audit_id} className="border-b pb-3 last:border-0">
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline">{entry.table_name}</Badge>
                    <span className="font-medium">{entry.field_name}</span>
                    <span className="text-muted-foreground">
                      {formatDistanceToNow(new Date(entry.changed_at), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    <span className="line-through">{entry.old_value || '(empty)'}</span>
                    {' → '}
                    <span className="text-foreground">{entry.new_value || '(empty)'}</span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
```

### Step 2: Add to settings sections (admin only)

```typescript
// In SettingsPage.tsx, conditionally add:
...(identity?.role === 'admin' ? [{
  id: 'audit',
  label: 'Activity Log',
  icon: <History className="h-4 w-4" />,
  component: <AuditLogSection />,
}] : []),
```

### Step 3: Commit

```bash
git add src/atomic-crm/settings/
git commit -m "feat: add activity audit log to admin settings

- Shows recent field-level changes from audit_trail table
- Admin-only access
- Displays old/new values with timestamps"
```

---

## Task 5: Bulk User Import (CSV)

**Priority:** Good-to-Have - Useful for initial team setup

**Files:**
- Create: `src/atomic-crm/sales/BulkUserImport.tsx`
- Create: `src/atomic-crm/sales/userImport.types.ts`
- Modify: `src/atomic-crm/sales/SalesList.tsx`

### Step 1: Create user import types

```typescript
// src/atomic-crm/sales/userImport.types.ts
import { z } from "zod";

export const userImportSchema = z.object({
  first_name: z.string().min(1, "First name required"),
  last_name: z.string().min(1, "Last name required"),
  email: z.string().email("Valid email required"),
  role: z.enum(["admin", "manager", "rep"]).default("rep"),
});

export type UserImportRow = z.infer<typeof userImportSchema>;

export interface UserImportResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; email: string; error: string }>;
}
```

### Step 2: Create BulkUserImport component

```typescript
// src/atomic-crm/sales/BulkUserImport.tsx
// Similar to contact import but for users
// Uses salesService.salesCreate for each row
// Shows preview before import
```

### Step 3: Add import button to SalesList actions

```typescript
// In SalesListActions, add:
<BulkUserImportButton /> // Opens dialog with CSV upload
```

### Step 4: Commit

```bash
git add src/atomic-crm/sales/
git commit -m "feat: add bulk user import via CSV

- CSV upload with validation
- Preview before import
- Error reporting for failed rows
- Admin-only feature"
```

---

## Task 6: Notification Preferences Expansion

**Priority:** Good-to-Have - More granular control

**Files:**
- Create: `supabase/migrations/YYYYMMDDHHMMSS_add_notification_preferences.sql`
- Modify: `src/atomic-crm/settings/sections/NotificationsSection.tsx`

### Step 1: Database migration

```sql
-- Add JSONB column for granular notification preferences
ALTER TABLE sales
ADD COLUMN notification_preferences JSONB DEFAULT '{
  "task_reminders": true,
  "opportunity_updates": true,
  "mentions": true,
  "daily_digest": true,
  "weekly_report": false
}'::jsonb;
```

### Step 2: Update NotificationsSection with all toggles

```typescript
// Expand NotificationsSection with:
// - Task reminders (before due date)
// - Opportunity stage changes
// - @mentions
// - Weekly report email
```

### Step 3: Commit

```bash
git add supabase/migrations/ src/atomic-crm/settings/sections/
git commit -m "feat: expand notification preferences

- Add granular notification controls
- Task reminders, opportunity updates, mentions
- Weekly report option
- JSONB storage for flexibility"
```

---

# Summary: Feature Prioritization

## MVP (Implement First)
| Task | Effort | Impact | Dependencies |
|------|--------|--------|--------------|
| 1. Time Zone | 2h | High | None |
| 2. Grouped Sections | 3h | High | None |
| 3. Permissions Matrix | 1h | Medium | None |

## Good-to-Have (Implement Later)
| Task | Effort | Impact | Dependencies |
|------|--------|--------|--------------|
| 4. Audit Log | 2h | Medium | Admin role check |
| 5. Bulk User Import | 4h | Medium | Contact import patterns |
| 6. Notification Prefs | 3h | Medium | Email system |

---

## Testing Checklist

For each task, verify:
- [ ] Component renders without errors
- [ ] Form validation works correctly
- [ ] Database updates persist
- [ ] Changes reflect in UI after save
- [ ] Admin-only features hidden from other roles
- [ ] Mobile responsive (iPad minimum)

---

## Rollback Plan

Each feature is independent. If issues arise:
1. Revert the specific commit
2. Run migration rollback if DB changes involved:
   ```sql
   ALTER TABLE sales DROP COLUMN IF EXISTS <new_column>;
   ```
3. Deploy reverted code
