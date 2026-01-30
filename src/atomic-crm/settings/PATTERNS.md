# Settings Patterns

Standard patterns for user settings and preferences management in Crispy CRM.

## Component & Architecture Hierarchy

```
index.tsx (Entry Point)
└── ErrorBoundary (feature="settings")
    └── SettingsPage
        ├── useGetIdentity() (React Admin identity cache)
        ├── useGetOne("sales", identity.id) (user profile data)
        ├── useSalesUpdate (mutation hook)
        └── SettingsLayout
            ├── Navigation Card (left sidebar)
            │   └── Sections Array (role-based filtering)
            └── Content Panel (right, 3/4 width)
                ├── PersonalSection (Form wrapper)
                │   ├── ImageEditorField (avatar upload)
                │   ├── TextInput fields (edit mode toggle)
                │   ├── TimeZoneSelect (GenericSelectInput)
                │   └── Edit/Save buttons (form state tracking)
                ├── NotificationsSection
                │   ├── DigestPreferences (RPC-based)
                │   │   ├── useQuery (get_digest_preference)
                │   │   ├── useMutation (update_digest_preference)
                │   │   └── Switch (toggle with loading state)
                │   └── Coming Soon Card (placeholder)
                ├── SecuritySection
                │   ├── Password Change (mutation)
                │   ├── Role Badge (identity.role)
                │   └── RolePermissionsMatrix (static config)
                ├── UsersSection (admin-only)
                │   └── useRedirect("/sales") (consolidated)
                └── AuditLogSection (admin-only)
                    └── useGetList("audit_trail", enabled: role === admin)
```

---

## Pattern A: Settings Section Registry Pattern

Declarative section configuration with role-based filtering and icon-driven navigation.

```tsx
// SettingsPage.tsx:72-111
const sections = [
  {
    id: "personal",
    label: "Personal",
    icon: <User className="h-4 w-4" />,
    component: (
      <Form onSubmit={handleOnSubmit} record={data}>
        <PersonalSection />
      </Form>
    ),
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: <Bell className="h-4 w-4" />,
    component: <NotificationsSection />,
  },
  {
    id: "security",
    label: "Security",
    icon: <Shield className="h-4 w-4" />,
    component: <SecuritySection onPasswordChange={handleClickOpenPasswordChange} />,
  },
  ...(identity?.role === "admin"
    ? [
        {
          id: "users",
          label: "Team",
          icon: <Users className="h-4 w-4" />,
          component: <UsersSection />,
        },
        {
          id: "audit",
          label: "Activity Log",
          icon: <History className="h-4 w-4" />,
          component: <AuditLogSection />,
        },
      ]
    : []),
];
```

**When to use**: Multi-section settings pages where different user roles see different options. Keeps section config centralized and readable.

**Key points:**
- Spread operator for conditional sections (admin-only)
- Icon + label navigation for quick scanning
- Each section owns its component lifecycle
- Static config, no hooks in array definition
- Form wrapper at section level, not page level

**Example:** `src/atomic-crm/settings/SettingsPage.tsx`

---

## Pattern B: Tabbed Layout with Active State

Two-column responsive layout with active section highlighting.

```tsx
// SettingsLayout.tsx:18-56
export function SettingsLayout({ sections }: SettingsLayoutProps) {
  const [activeSection, setActiveSection] = useState(sections[0]?.id);

  const currentSection = sections.find((s) => s.id === activeSection);

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Navigation Sidebar - 1/4 width */}
        <Card className="md:col-span-1">
          <CardContent className="p-2">
            <nav className="space-y-1">
              {sections.map((section) => (
                <AdminButton
                  key={section.id}
                  variant={activeSection === section.id ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 min-h-[44px]",
                    activeSection === section.id && "bg-muted"
                  )}
                  onClick={() => setActiveSection(section.id)}
                >
                  {section.icon}
                  {section.label}
                  {activeSection === section.id && (
                    <ChevronRight className="ml-auto h-4 w-4" aria-hidden="true" />
                  )}
                </AdminButton>
              ))}
            </nav>
          </CardContent>
        </Card>

        {/* Content Panel - 3/4 width */}
        <div className="md:col-span-3">{currentSection?.component}</div>
      </div>
    </div>
  );
}
```

**When to use**: Settings pages with 3+ sections where users need quick navigation between categories. The sidebar provides persistent context of available options.

**Key points:**
- `max-w-4xl` constrains width for readability
- Grid layout: 1/4 sidebar, 3/4 content on desktop
- Stacked on mobile (`grid-cols-1` default)
- Active section visual indicator (secondary variant + ChevronRight icon)
- 44px minimum touch target per WCAG AA
- `aria-hidden` on decorative icon

**Example:** `src/atomic-crm/settings/SettingsLayout.tsx`

---

## Pattern C: Inline Edit with Dirty Tracking

Toggle between read and edit modes with form state awareness.

```tsx
// PersonalSection.tsx:14-85
export function PersonalSection() {
  const [isEditMode, setEditMode] = useState(false);
  const record = useRecordContext<Sale>();
  const { data: identity, refetch } = useGetIdentity();
  const { isDirty } = useFormState(); // React Hook Form state

  const { mutate: mutateSale, isPending } = useSalesUpdate({
    userId: record?.id,
    onSuccess: () => {
      refetch();
      setEditMode(false); // Exit edit mode on success
    },
  });

  const handleAvatarUpdate = async (values: SalesFormData) => {
    mutateSale(values);
  };

  return (
    <Card>
      <CardContent>
        <h2 className="text-xl font-semibold text-muted-foreground">My info</h2>

        <div className="space-y-4 mb-4">
          <ImageEditorField
            source="avatar"
            type="avatar"
            onSave={handleAvatarUpdate}
            linkPosition="right"
          />
          <TextRender source="first_name" isEditMode={isEditMode} />
          <TextRender source="last_name" isEditMode={isEditMode} />
          <TextRender source="email" isEditMode={isEditMode} />
          <TimeZoneSelect
            value={record?.timezone || "America/Chicago"}
            onChange={(value) => mutateSale({ ...record, timezone: value })}
            disabled={!isEditMode || isPending}
          />
        </div>

        <div className="flex flex-row justify-end gap-2">
          <AdminButton
            variant={isEditMode ? "ghost" : "outline"}
            onClick={() => setEditMode(!isEditMode)}
            disabled={isPending}
          >
            {isEditMode ? <CircleX /> : <Pencil />}
            {isEditMode ? "Cancel" : "Edit"}
          </AdminButton>

          {isEditMode && (
            <AdminButton
              type="submit"
              disabled={!isDirty || isPending}
              variant="outline"
            >
              {isPending ? <Loader2 className="animate-spin" /> : <Save />}
              {isPending ? "Saving..." : "Save"}
            </AdminButton>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Conditional field rendering
const TextRender = ({ source, isEditMode }: { source: string; isEditMode: boolean }) => {
  const autoCompleteMap: Record<string, string> = {
    first_name: "given-name",
    last_name: "family-name",
    email: "email",
  };

  if (isEditMode) {
    return <TextInput source={source} helperText={false} autoComplete={autoCompleteMap[source]} />;
  }
  return (
    <div className="m-2">
      <RecordField source={source} />
    </div>
  );
};
```

**When to use**: Forms where users rarely need to edit fields. Read-first mode reduces visual clutter and accidental edits.

**Key points:**
- `useFormState()` provides `isDirty` for conditional save button enable
- Edit mode toggle stored in local component state
- Save button only appears in edit mode
- Cancel button variant changes based on mode (ghost vs outline)
- Separate mutation for avatar (immediate save) vs form fields (bulk save)
- `isPending` disables buttons during save
- HTML5 autocomplete attributes for accessibility

**Example:** `src/atomic-crm/settings/PersonalSection.tsx`

---

## Pattern D: RPC-Based Preference Management

Secure preference updates using database RPC functions instead of direct table access.

```tsx
// DigestPreferences.tsx:42-187
export function DigestPreferences() {
  const { success, actionError } = useSafeNotify();
  const queryClient = useQueryClient();
  const dataProvider = useDataProvider() as ExtendedDataProvider;

  // Fetch current preference via RPC (auth.uid() enforced server-side)
  const {
    data: preference,
    isLoading,
    error: fetchError,
  } = useQuery<DigestPreferenceResponse>({
    queryKey: digestKeys.all,
    queryFn: async () => {
      return dataProvider.rpc<DigestPreferenceResponse>("get_digest_preference", {});
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update preference mutation
  const { mutate: updatePreference, isPending: isUpdating } = useMutation({
    mutationFn: async (optIn: boolean) => {
      const response = await dataProvider.rpc<UpdatePreferenceResponse>(
        "update_digest_preference",
        { p_opt_in: optIn }
      );

      if (!response.success) {
        throw new Error(response.error || "Failed to update preference");
      }

      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: digestKeys.all });
      success(data.message || notificationMessages.updated("Preference"));
    },
    onError: (error: Error) => {
      actionError(error, "update", "preference");
    },
  });

  const handleToggle = (checked: boolean) => {
    updatePreference(checked);
  };

  const isOptedIn = preference.digest_opt_in ?? true;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Notifications
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isOptedIn ? (
              <Bell className="h-4 w-4 text-primary" />
            ) : (
              <BellOff className="h-4 w-4 text-muted-foreground" />
            )}
            <div className="space-y-0.5">
              <Label htmlFor="digest-toggle">Daily Digest Emails</Label>
              <p className="text-xs text-muted-foreground">
                {isOptedIn
                  ? "You'll receive a morning summary of overdue tasks and stale deals"
                  : "Daily digest emails are disabled"}
              </p>
            </div>
          </div>
          <Switch
            id="digest-toggle"
            checked={isOptedIn}
            onCheckedChange={handleToggle}
            disabled={isUpdating}
            aria-label="Toggle daily digest emails"
          />
        </div>
      </CardContent>
    </Card>
  );
}
```

**When to use**: User preferences that require server-side authorization checks (ensure users can only modify their own settings). RPC functions enforce auth.uid() at the database layer.

**Key points:**
- RPC functions enforce row-level security via `auth.uid()`
- Generic RPC typing avoids `as unknown as` casts
- Query key from centralized `digestKeys` factory
- Optimistic UI disabled (switch stays in sync with server state)
- Success/error messages via `useSafeNotify` for consistent UX
- Response schema includes `success`, `error`, and optional `message`
- 5-minute staleTime prevents unnecessary refetches

**Database RPC pattern:**
```sql
-- get_digest_preference: Returns current user's preference
CREATE FUNCTION get_digest_preference() RETURNS JSON AS $$
  SELECT jsonb_build_object(
    'success', true,
    'digest_opt_in', digest_opt_in,
    'email', email
  ) FROM sales WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- update_digest_preference: Updates current user's preference
CREATE FUNCTION update_digest_preference(p_opt_in BOOLEAN) RETURNS JSON AS $$
  UPDATE sales SET digest_opt_in = p_opt_in WHERE id = auth.uid()
  RETURNING jsonb_build_object('success', true, 'digest_opt_in', digest_opt_in);
$$ LANGUAGE SQL SECURITY DEFINER;
```

**Example:** `src/atomic-crm/settings/DigestPreferences.tsx`

---

## Pattern E: Role-Based Permissions Matrix

Static configuration with visual permission indicators for user education.

```tsx
// RolePermissionsMatrix.tsx:17-92
const PERMISSIONS: PermissionCategory[] = [
  {
    category: "Records",
    permissions: [
      { name: "View all contacts", rep: true, manager: true, admin: true },
      { name: "Edit own records", rep: true, manager: true, admin: true },
      { name: "Edit team records", rep: false, manager: true, admin: true },
      { name: "Delete records", rep: false, manager: false, admin: true },
    ],
  },
  {
    category: "Opportunities",
    permissions: [
      { name: "View all opportunities", rep: true, manager: true, admin: true },
      { name: "Create opportunities", rep: true, manager: true, admin: true },
      { name: "Edit any opportunity", rep: false, manager: true, admin: true },
      { name: "Archive opportunities", rep: false, manager: true, admin: true },
    ],
  },
  {
    category: "Administration",
    permissions: [
      { name: "View user list", rep: false, manager: false, admin: true },
      { name: "Create users", rep: false, manager: false, admin: true },
      { name: "Modify user roles", rep: false, manager: false, admin: true },
      { name: "Remove users", rep: false, manager: false, admin: true },
    ],
  },
];

export function RolePermissionsMatrix({ currentRole }: RolePermissionsMatrixProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Your Role:</span>
        <Badge variant="outline" className="capitalize">
          {currentRole}
        </Badge>
      </div>

      {PERMISSIONS.map((category) => (
        <Card key={category.category}>
          <CardHeader>
            <CardTitle className="text-base">{category.category}</CardTitle>
          </CardHeader>
          <CardContent>
            {category.permissions.map((permission) => {
              const isAllowed = permission[currentRole];
              return (
                <div key={permission.name} className="flex items-center justify-between py-2">
                  <span className="text-sm">{permission.name}</span>
                  {isAllowed ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : (
                    <X className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

**When to use**: Settings pages where users need to understand their access level. Provides transparency and reduces support questions about "why can't I do X?"

**Key points:**
- Static config, no database calls (permissions enforced server-side)
- Visual indicators: Check (allowed) vs X (denied)
- Semantic colors: `text-success` for allowed, `text-muted-foreground` for denied
- Grouped by category for easier scanning
- Shows user's current role prominently
- Does NOT control actual access (RLS policies do that)

**Permission hierarchy:**
```
Admin → All permissions
Manager → Team-level operations (edit team records, archive deals)
Rep → Self-service operations (own records, create opportunities)
```

**Example:** `src/atomic-crm/settings/RolePermissionsMatrix.tsx`

---

## Pattern F: Centralized Mutation Hook

Shared mutation logic with query invalidation and success callbacks.

```tsx
// useSalesUpdate.ts:40-69
export function useSalesUpdate({ userId, onSuccess }: UseSalesUpdateOptions) {
  const notify = useNotify();
  const dataProvider = useDataProvider<CrmDataProvider>();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["updateProfile", userId],
    mutationFn: async (data: SalesFormData) => {
      if (!userId) {
        throw new Error("User ID is required for profile update");
      }
      return dataProvider.salesUpdate(userId, data);
    },
    onSuccess: () => {
      // Invalidate cache to ensure fresh data after profile update
      queryClient.invalidateQueries({ queryKey: saleKeys.all });
      if (userId) {
        queryClient.invalidateQueries({ queryKey: saleKeys.detail(userId) });
      }
      notify("Your profile has been updated");
      onSuccess?.();
    },
    onError: (error) => {
      logger.error("Profile update failed", error, { feature: "useSalesUpdate", userId });
      notify("An error occurred. Please try again.", {
        type: "error",
      });
    },
  });
}
```

**When to use**: When multiple components need the same mutation logic (PersonalSection, SettingsPage, avatar editor). Prevents code duplication and ensures consistent cache invalidation.

**Key points:**
- Optional `onSuccess` callback for component-specific actions
- Query invalidation uses centralized `saleKeys` factory
- Mutation key includes `userId` for multi-user tracking
- Fail-fast: Throws error if `userId` is missing
- Structured logging with `userId` for debugging
- Generic notification messages (component can customize via callback)

**Usage pattern:**
```tsx
// In PersonalSection
const { mutate, isPending } = useSalesUpdate({
  userId: record?.id,
  onSuccess: () => {
    refetch();       // Component-specific: refresh identity
    setEditMode(false); // Component-specific: exit edit mode
  },
});

// In SettingsPage
const { mutate } = useSalesUpdate({
  userId: identity?.id,
  onSuccess: () => {
    refetchIdentity();
    refetchUser();
  },
});
```

**Example:** `src/atomic-crm/settings/useSalesUpdate.ts`

---

## Pattern G: Admin-Only Section with Conditional Query

React Admin hooks called unconditionally, query enabled via options.

```tsx
// AuditLogSection.tsx:9-84
export function AuditLogSection() {
  const { data: identity } = useGetIdentity();

  // Always call hooks unconditionally (React hooks rules)
  const { data: auditEntries, isLoading } = useGetList(
    "audit_trail",
    {
      pagination: { page: 1, perPage: 50 },
      sort: { field: "changed_at", order: "DESC" },
    },
    {
      enabled: identity?.role === "admin", // Only fetch if admin
    }
  );

  if (identity?.role !== "admin") {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Activity log is only available to administrators.
        </CardContent>
      </Card>
    );
  }

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
          <div role="status" aria-live="polite" className="py-4">
            <span className="sr-only">Loading activity log...</span>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {auditEntries?.map((entry: AuditEntry) => (
                <div key={entry.audit_id} className="border-b pb-3 last:border-0">
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline">{entry.table_name}</Badge>
                    <span className="font-medium">{entry.field_name}</span>
                    <span className="text-muted-foreground">
                      {formatDistanceToNow(parseDateSafely(entry.changed_at) ?? new Date(), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    <span className="line-through">{entry.old_value || "(empty)"}</span>
                    {" → "}
                    <span className="text-foreground">{entry.new_value || "(empty)"}</span>
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

**When to use**: Admin-only features where non-admins should see a message instead of a loading spinner or error.

**Key points:**
- Hook called unconditionally (React rules compliance)
- Query disabled via `enabled: identity?.role === "admin"`
- Early return with user-friendly message for non-admins
- Fixed-height `ScrollArea` for long audit logs
- `formatDistanceToNow` for human-readable timestamps
- `parseDateSafely` fallback prevents crash on invalid dates
- `role="status"` and `aria-live="polite"` for a11y

**Audit entry format:**
```tsx
interface AuditEntry {
  audit_id: string | number;
  table_name: string;
  field_name: string;
  changed_at: string;
  old_value?: string;
  new_value?: string;
}
```

**Example:** `src/atomic-crm/settings/AuditLogSection.tsx`

---

## Pattern H: Section Redirect for Consolidated Features

Automatic redirect when features move to different parts of the app.

```tsx
// UsersSection.tsx:12-26
export const UsersSection = () => {
  const redirect = useRedirect();

  useEffect(() => {
    // Redirect to the consolidated /sales resource
    redirect("/sales");
  }, [redirect]);

  // Show brief loading state while redirecting
  return (
    <div className="flex items-center justify-center p-8">
      <p className="text-muted-foreground">Redirecting to Team Management...</p>
    </div>
  );
};
```

**When to use**: When a settings section moves to a dedicated resource page but you want to preserve the old navigation path for discoverability.

**Key points:**
- `useEffect` triggers redirect immediately on mount
- Brief loading message prevents blank screen flash
- `redirect` hook from React Admin handles navigation
- Preserves settings nav structure (users clicking "Team" still reach the right place)
- Dependency array includes `redirect` to satisfy linter

**Alternative approach (immediate redirect):**
```tsx
// No loading message, instant redirect
export const UsersSection = () => {
  const redirect = useRedirect();
  redirect("/sales");
  return null; // Never renders
};
```

**Example:** `src/atomic-crm/settings/UsersSection.tsx`

---

## Pattern Comparison Tables

### Section Type Decision Matrix

| Section Type | Data Fetching | Edit Pattern | Use Case |
|--------------|---------------|--------------|----------|
| **Personal** (Pattern C) | `useGetOne("sales")` | Inline edit with dirty tracking | User's own profile |
| **Notifications** (Pattern D) | RPC functions | Toggle switches | Preferences with auth checks |
| **Security** (Pattern E) | None (static config) | Button-triggered mutation | Password, role info |
| **Audit Log** (Pattern G) | `useGetList` (conditional) | Read-only | Admin-only activity history |
| **Team** (Pattern H) | None (redirects) | N/A | Redirect to dedicated page |

### Mutation Strategies

| Strategy | Pattern | When to Use |
|----------|---------|-------------|
| **Centralized Hook** | F (useSalesUpdate) | Same mutation needed by 3+ components |
| **RPC Function** | D (DigestPreferences) | Server-side auth/validation required |
| **Direct Mutation** | C (PersonalSection avatar) | One-off operations, no reuse |

### Form State Approaches

| Approach | Example | Pros | Cons |
|----------|---------|------|------|
| **Inline Edit Toggle** | PersonalSection | Less visual clutter, prevents accidental edits | Extra click to edit |
| **Always Editable** | Standard React Admin forms | Immediate editing | Higher cognitive load |
| **Separate Edit Page** | Not used in settings | Clear modal context | Navigation overhead |

---

## Anti-Patterns

### ❌ Direct Table Updates for User Preferences

```tsx
// WRONG: Bypasses RLS, no audit trail
const { mutate } = useMutation({
  mutationFn: async (optIn: boolean) => {
    await dataProvider.update("sales", {
      id: userId,
      data: { digest_opt_in: optIn },
    });
  },
});

// CORRECT: RPC enforces auth.uid() check
const { mutate } = useMutation({
  mutationFn: async (optIn: boolean) => {
    const response = await dataProvider.rpc<UpdatePreferenceResponse>(
      "update_digest_preference",
      { p_opt_in: optIn }
    );
    if (!response.success) throw new Error(response.error);
    return response;
  },
});
```

**Why it matters:** Direct table updates let users modify other users' preferences by changing the `id` parameter. RPC functions enforce `auth.uid()` at the database level.

### ❌ Multiple Forms in Single Section

```tsx
// WRONG: Multiple forms cause conflicting validation contexts
export function PersonalSection() {
  return (
    <Card>
      <Form onSubmit={handleProfileUpdate}>
        <TextInput source="first_name" />
      </Form>
      <Form onSubmit={handleAvatarUpdate}>
        <ImageEditorField source="avatar" />
      </Form>
    </Card>
  );
}

// CORRECT: Single form, multiple mutations
export function PersonalSection() {
  return (
    <Card>
      <Form onSubmit={handleProfileUpdate} record={data}>
        <ImageEditorField onSave={handleAvatarUpdate} /> {/* Separate mutation */}
        <TextInput source="first_name" />
      </Form>
    </Card>
  );
}
```

**Why it matters:** Multiple forms create nested React Hook Form contexts, breaking `useFormState()` and validation.

### ❌ Inline Permission Checks in Component

```tsx
// WRONG: Duplicates logic from RLS policies
export function AuditLogSection() {
  const { data: identity } = useGetIdentity();
  const { data: auditEntries } = useGetList("audit_trail", { /* ... */ });

  // ⚠️ Not secure - user can bypass in browser DevTools
  if (identity?.role !== "admin") {
    return null;
  }

  return <ScrollArea>{/* audit entries */}</ScrollArea>;
}

// CORRECT: Component check + database RLS policy
// RLS Policy (supabase/migrations/):
// CREATE POLICY "Admins only" ON audit_trail FOR SELECT
//   USING ((auth.jwt() ->> 'role') = 'admin');

export function AuditLogSection() {
  const { data: identity } = useGetIdentity();

  const { data: auditEntries } = useGetList(
    "audit_trail",
    { /* ... */ },
    { enabled: identity?.role === "admin" } // Prevents wasted query
  );

  if (identity?.role !== "admin") {
    return <Card>Activity log is only available to administrators.</Card>;
  }
  // Database policy enforces access even if component check bypassed
}
```

**Why it matters:** Component-level checks are for UX only. Database RLS policies enforce actual security.

### ❌ Hardcoded Section IDs in Navigation

```tsx
// WRONG: Breaks when section IDs change
function SettingsLayout({ sections }) {
  const [activeSection, setActiveSection] = useState("personal");

  return (
    <nav>
      <button onClick={() => setActiveSection("personal")}>Personal</button>
      <button onClick={() => setActiveSection("security")}>Security</button>
    </nav>
  );
}

// CORRECT: Derive from sections array
function SettingsLayout({ sections }) {
  const [activeSection, setActiveSection] = useState(sections[0]?.id);

  return (
    <nav>
      {sections.map((section) => (
        <button key={section.id} onClick={() => setActiveSection(section.id)}>
          {section.label}
        </button>
      ))}
    </nav>
  );
}
```

**Why it matters:** Hardcoded IDs break when sections are reordered, renamed, or conditionally included.

### ❌ Missing Disabled State During Mutation

```tsx
// WRONG: User can spam-click, send duplicate requests
export function DigestPreferences() {
  const { mutate } = useMutation({ /* ... */ });

  return (
    <Switch
      checked={isOptedIn}
      onCheckedChange={(checked) => mutate(checked)}
      // ❌ No disabled state!
    />
  );
}

// CORRECT: Disable during mutation
export function DigestPreferences() {
  const { mutate, isPending } = useMutation({ /* ... */ });

  return (
    <Switch
      checked={isOptedIn}
      onCheckedChange={(checked) => mutate(checked)}
      disabled={isPending} // ✅ Prevents duplicate requests
      aria-label="Toggle daily digest emails"
    />
  );
}
```

**Why it matters:** Without disabled state, users can trigger the same mutation multiple times before the first completes.

---

## Migration Checklist: Adding New Settings Section

When adding a new section to the settings page:

1. [ ] **Create section component** in `src/atomic-crm/settings/`
   ```tsx
   export function NewSection() {
     return (
       <Card>
         <CardHeader><CardTitle>Section Title</CardTitle></CardHeader>
         <CardContent>{/* content */}</CardContent>
       </Card>
     );
   }
   ```

2. [ ] **Add to sections array** in `SettingsPage.tsx`
   ```tsx
   {
     id: "new-section",
     label: "New Section",
     icon: <IconComponent className="h-4 w-4" />,
     component: <NewSection />,
   }
   ```

3. [ ] **Apply role filtering** if admin-only
   ```tsx
   ...(identity?.role === "admin" ? [newSectionConfig] : [])
   ```

4. [ ] **Create mutation hook** if section has save operations
   - Use `useMutation` from `@tanstack/react-query`
   - Return `mutate`, `isPending`, `error`
   - Invalidate relevant query keys on success

5. [ ] **Add RPC functions** if server-side validation needed
   - Define in `supabase/migrations/`
   - Type in `src/atomic-crm/validation/rpc.ts`
   - Call via `dataProvider.rpc<ResponseType>()`

6. [ ] **Implement loading states** for all async operations
   - Skeleton for initial load
   - Disabled state during mutations
   - `aria-busy="true"` for screen readers

7. [ ] **Add error boundaries** if section fetches external data
   - Use `useSafeNotify` for error messages
   - Graceful fallback UI on query failure

8. [ ] **Test responsive behavior**
   - Mobile: Full-width cards, touch-friendly buttons
   - Desktop: Constrained to `max-w-4xl`

9. [ ] **Verify accessibility**
   - All buttons ≥ 44px (`min-h-[44px]`)
   - Labels for all form inputs
   - ARIA attributes for dynamic content

10. [ ] **Update TypeScript types** if new data shapes introduced
    - Add to `src/atomic-crm/types.ts`
    - Define Zod schema for validation
