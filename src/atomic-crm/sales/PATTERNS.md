# Sales Module Patterns

Reusable patterns for CRUD resources, slide-overs, tabbed forms, and user management in Crispy CRM.

## Component Hierarchy

```
                    ┌─────────────────┐
                    │   resource.tsx  │  (Route config + lazy loading)
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
  │ SalesList   │    │ SalesCreate │    │ SalesEdit   │
  │ (List view) │    │ (Form)      │    │ (Form)      │
  └──────┬──────┘    └──────┬──────┘    └─────────────┘
         │                  │
         ▼                  ▼
  ┌─────────────┐    ┌─────────────┐
  │SalesSlideOver│   │ SalesInputs │  (Tab wrapper)
  │(40vw panel) │    └──────┬──────┘
  └──────┬──────┘           │
         │           ┌──────┴──────┐
         │           ▼             ▼
         │    ┌───────────┐ ┌─────────────────┐
         │    │GeneralTab │ │PermissionsInputs│
         │    └───────────┘ └─────────────────┘
         │
  ┌──────┴──────┐
  ▼             ▼
┌───────────┐ ┌─────────────────┐
│ProfileTab │ │PermissionsTab   │
│(view/edit)│ │(role, disabled) │
└───────────┘ └─────────────────┘
```

---

## Pattern A: CRUD Resource Configuration

**When to use:** Setting up a new React Admin resource with code splitting and error boundaries.

```tsx
// resource.tsx
import * as React from "react";
import type { Sale } from "../types";
import { formatName } from "../utils/formatName";
import { ResourceErrorBoundary } from "@/components/ResourceErrorBoundary";

// Lazy loading for code splitting
const SalesListLazy = React.lazy(() => import("./SalesList"));
const SalesEditLazy = React.lazy(() => import("./SalesEdit"));
const SalesCreateLazy = React.lazy(() => import("./SalesCreate"));
const SalesShowLazy = React.lazy(() => import("./SalesShow"));

// Each view wrapped in error boundary
const SalesListView = () => (
  <ResourceErrorBoundary resource="sales" page="list">
    <SalesListLazy />
  </ResourceErrorBoundary>
);

const SalesEditView = () => (
  <ResourceErrorBoundary resource="sales" page="edit">
    <SalesEditLazy />
  </ResourceErrorBoundary>
);

// ... similar for Create and Show

// Export resource configuration
export default {
  list: SalesListView,
  edit: SalesEditView,
  create: SalesCreateView,
  show: SalesShowView,
  recordRepresentation: (record: Sale) => formatName(record?.first_name, record?.last_name),
};
```

**Key points:**
- Use `React.lazy()` for code splitting (reduces initial bundle size)
- Wrap every view in `ResourceErrorBoundary` with resource and page props
- Define `recordRepresentation` for breadcrumbs and navigation
- Export default object matching React Admin resource shape

---

## Pattern B: Tabbed Form Pattern (Slide-Over Tabs)

**When to use:** Creating slide-over panels with multiple tabs and view/edit modes.

**Form State Architecture:**
- **State management:** Simple `useState` (NOT react-hook-form)
- **Schema usage:** Zod schemas for **defaults only** via `schema.parse({ ...record })`
- **Validation:** At API boundary (Edge Function or Service layer) - NOT in forms
- **Rationale:** Per Engineering Constitution "Zod at API boundary only" principle

```tsx
// SalesProfileTab.tsx
interface SalesProfileTabProps {
  record: Sale;
  mode: "view" | "edit";
  onModeToggle?: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
}

export function SalesProfileTab({ record, mode, onModeToggle, onDirtyChange }: SalesProfileTabProps) {
  const [update, { isLoading }] = useUpdate();
  const notify = useNotify();

  // Form state using useState (NOT react-hook-form)
  // Schema used for DEFAULTS ONLY - validation happens at API boundary
  const [formData, setFormData] = useState(() =>
    salesProfileSchema.parse({
      first_name: record.first_name,
      last_name: record.last_name,
      email: record.email,
      phone: record.phone,
    })
  );

  // Track errors returned from API (server-side validation)
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Manual dirty tracking (compare current formData with original record)
  useEffect(() => {
    if (mode !== "edit" || !onDirtyChange) return;
    const isDirty = formData.first_name !== record.first_name || /* ... */;
    onDirtyChange(isDirty);
  }, [formData, record, mode, onDirtyChange]);

  // Simple field update handler
  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => { const newErrors = { ...prev }; delete newErrors[field]; return newErrors; });
    }
  };

  const handleSave = async () => {
    // NO client-side validation - Edge Function/Service validates
    // CRITICAL: previousData required by ra-data-postgrest's getChanges()
    await update(
      "sales",
      { id: record.id, data: formData, previousData: record },
      {
        onSuccess: () => {
          notify("Profile updated successfully", { type: "success" });
          if (onModeToggle) onModeToggle(); // Switch back to view mode
        },
        onError: (error: Error) => {
          notify(error.message || "Failed to update profile", { type: "error" });
          // Display server-side validation errors if present
          const errorWithErrors = error as Error & { errors?: Record<string, string> };
          if (errorWithErrors.errors) setErrors(errorWithErrors.errors);
        },
      }
    );
  };

  // Form submit handler for footer button integration
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSave();
  };

  const content = (
    <div className="space-y-6">
      {/* View mode: read-only display */}
      {/* Edit mode: input fields with errors[field] display */}
    </div>
  );

  // In edit mode, wrap with form so footer "Save Changes" button works
  if (mode === "edit") {
    return (
      <form id="slide-over-edit-form" onSubmit={handleFormSubmit}>
        {content}
      </form>
    );
  }

  return content;
}
```

**Key points:**
- **State:** Use `useState` for form data (NOT react-hook-form in tabs)
- **Defaults:** Use `schema.parse({ ...record })` for initial values only
- **Validation:** NO client-side validation - API boundary validates
- **Errors:** Track server-returned errors in separate `useState<Record<string, string>>({})`
- **Dirty tracking:** Manual comparison with `onDirtyChange` callback
- Accept `mode` ("view" | "edit") and `onModeToggle` callback as props
- CRITICAL: Always pass `previousData` to `useUpdate()` for ra-data-postgrest
- Wrap edit content in `<form id="slide-over-edit-form">` for footer integration
- Call `onModeToggle()` after successful save to return to view mode

---

## Pattern C: Sidebar Filter Configuration

**When to use:** Defining filter metadata for `ListSearchBar` and `FilterChipBar` integration.

```tsx
// salesFilterConfig.ts
import { validateFilterConfig } from "../filters/filterConfigSchema";

const ROLE_CHOICES = [
  { id: "admin", name: "Admin" },
  { id: "manager", name: "Manager" },
  { id: "rep", name: "Rep" },
];

const STATUS_CHOICES = [
  { id: "active", name: "Active" },
  { id: "disabled", name: "Disabled" },
];

export const SALES_FILTER_CONFIG = validateFilterConfig([
  {
    key: "q",
    label: "Search",
    type: "search",
  },
  {
    key: "role",
    label: "Role",
    type: "multiselect",
    choices: ROLE_CHOICES,
  },
  {
    key: "disabled",
    label: "Status",
    type: "boolean",
    choices: STATUS_CHOICES,
  },
]);
```

**Filter UI component:**

```tsx
// SalesListFilter.tsx
export const SalesListFilter = () => {
  useListContext();

  return (
    <div className="flex flex-col gap-4" data-tutorial="sales-filters">
      <FilterCategory label="Role" icon={<Users className="h-4 w-4" />}>
        <ToggleFilterButton
          multiselect
          className="w-full justify-between"
          label="Admin"
          value={{ role: "admin" }}
        />
        <ToggleFilterButton
          multiselect
          className="w-full justify-between"
          label="Manager"
          value={{ role: "manager" }}
        />
        <ToggleFilterButton
          multiselect
          className="w-full justify-between"
          label="Rep"
          value={{ role: "rep" }}
        />
      </FilterCategory>

      <FilterCategory label="Status" icon={<Eye className="h-4 w-4" />}>
        <ToggleFilterButton
          className="w-full justify-between"
          label="Active Only"
          value={{ disabled: false }}
        />
      </FilterCategory>
    </div>
  );
};
```

**Key points:**
- Use `validateFilterConfig()` for type safety
- Filter types: `search`, `multiselect`, `boolean`
- Choice IDs must be strings (per `filterChoiceSchema`)
- Industry standard: default to Active users only (`filterDefaultValues={{ disabled: false }}`)
- Use `ToggleFilterButton` with `multiselect` prop for multi-select filters

---

## Pattern D: Slide-Over Integration

**When to use:** Adding a slide-over panel to a list view with keyboard navigation and URL sync.

```tsx
// SalesSlideOver.tsx
import { UserIcon, ShieldCheckIcon } from "lucide-react";
import type { TabConfig } from "@/components/layouts/ResourceSlideOver";
import { ResourceSlideOver } from "@/components/layouts/ResourceSlideOver";

interface SalesSlideOverProps {
  recordId: number | null;
  isOpen: boolean;
  onClose: () => void;
  mode: "view" | "edit";
  onModeToggle: () => void;
}

export function SalesSlideOver({
  recordId,
  isOpen,
  onClose,
  mode,
  onModeToggle,
}: SalesSlideOverProps) {
  // Tab configuration with icons
  const tabs: TabConfig[] = [
    {
      key: "profile",
      label: "Profile",
      component: SalesProfileTab,
      icon: UserIcon,
    },
    {
      key: "permissions",
      label: "Permissions",
      component: SalesPermissionsTab,
      icon: ShieldCheckIcon,
    },
  ];

  // Record representation for header (with null safety)
  const recordRepresentation = (record: Sale) => {
    return `${record?.first_name || ""} ${record?.last_name || ""}`.trim() || "User";
  };

  return (
    <ResourceSlideOver
      resource="sales"
      recordId={recordId}
      isOpen={isOpen}
      onClose={onClose}
      mode={mode}
      onModeToggle={onModeToggle}
      tabs={tabs}
      recordRepresentation={recordRepresentation}
    />
  );
}
```

**List view integration:**

```tsx
// In SalesList.tsx
export default function SalesList() {
  const { slideOverId, isOpen, mode, openSlideOver, closeSlideOver, toggleMode } =
    useSlideOverState();

  return (
    <>
      <List
        filterDefaultValues={{ disabled: false }}
        aside={<SalesListFilter />}
      >
        <SalesListLayout openSlideOver={openSlideOver} isSlideOverOpen={isOpen} />
        <FloatingCreateButton />
      </List>

      <SalesSlideOver
        recordId={slideOverId}
        isOpen={isOpen}
        onClose={closeSlideOver}
        mode={mode}
        onModeToggle={toggleMode}
      />
    </>
  );
}
```

**Key points:**
- Use `useSlideOverState()` hook for state management and URL sync
- Pass `openSlideOver`, `isSlideOverOpen` to list layout for keyboard nav integration
- `TabConfig` requires: `key`, `label`, `component`, and optional `icon`
- Tab components receive: `record`, `mode`, `onModeToggle` props automatically
- Design: 40vw width (480-720px), slide-in from right, ESC to close

---

## Pattern E: React Admin List with Identity-Aware Loading

**When to use:** Creating list views that need identity context before rendering.

```tsx
// SalesList.tsx
export default function SalesList() {
  const { data: identity, isPending: isIdentityPending } = useGetIdentity();
  const { slideOverId, isOpen, mode, openSlideOver, closeSlideOver, toggleMode } =
    useSlideOverState();

  useFilterCleanup("sales");

  // Identity-aware loading
  if (isIdentityPending) return <SalesListSkeleton />;
  if (!identity) return null;

  return (
    <>
      <div data-tutorial="sales-list">
        <List
          title={false}
          actions={<SalesListActions />}
          sort={{ field: "first_name", order: "ASC" }}
          filterDefaultValues={{ disabled: false }}
          aside={<SalesListFilter />}
        >
          <SalesListLayout openSlideOver={openSlideOver} isSlideOverOpen={isOpen} />
          <FloatingCreateButton />
        </List>
      </div>

      <SalesSlideOver
        recordId={slideOverId}
        isOpen={isOpen}
        onClose={closeSlideOver}
        mode={mode}
        onModeToggle={toggleMode}
      />
    </>
  );
}
```

**Custom field components with semantic colors:**

```tsx
// RoleBadgeField - Uses semantic colors (NEVER hardcoded hex)
const RoleBadgeField = ({ label: _label, ..._props }: { label: string }) => {
  const record = useRecordContext();
  if (!record) return null;

  let badge = null;
  switch (record.role) {
    case "admin":
      badge = (
        <Badge variant="outline" className="border-primary text-primary">
          Admin
        </Badge>
      );
      break;
    case "manager":
      badge = (
        <Badge variant="outline" className="border-success text-success">
          Manager
        </Badge>
      );
      break;
    case "rep":
      badge = (
        <Badge variant="outline" className="border-muted-foreground text-muted-foreground">
          Rep
        </Badge>
      );
      break;
  }

  return <div className="flex flex-row gap-1">{badge}</div>;
};
```

**Key points:**
- Check `isIdentityPending` before rendering - show skeleton during load
- Use `useFilterCleanup(resource)` to clear stale filters on navigation
- Use `COLUMN_VISIBILITY` presets for responsive column hiding
- Custom field components must use `useRecordContext()` to access row data
- ALWAYS use semantic colors: `text-primary`, `text-success`, `text-muted-foreground`
- NEVER use hardcoded colors: `text-blue-600`, `text-green-500`

---

## Pattern F: Role-Based Inputs with Self-Edit Prevention

**When to use:** Permission management UI with self-edit guards and danger zones.

```tsx
// SalesPermissionsTab.tsx
export function SalesPermissionsTab({ record, mode, onModeToggle }: SalesPermissionsTabProps) {
  const [update, { isLoading }] = useUpdate();
  const notify = useNotify();
  const redirect = useRedirect();
  const refresh = useRefresh();
  const { data: identity } = useGetIdentity();
  const [isDeleting, setIsDeleting] = useState(false);

  // Per Engineering Constitution #5: Form defaults from schema
  const [formData, setFormData] = useState(() =>
    salesPermissionsSchema.parse({
      role: record.role,
      disabled: record.disabled,
    })
  );

  // Prevent editing own account
  const isSelfEdit = record?.id === identity?.id;

  // Soft-delete user (sets deleted_at)
  const handleRemoveUser = async () => {
    if (isSelfEdit) {
      notify("You cannot remove your own account", { type: "warning" });
      return;
    }

    setIsDeleting(true);
    try {
      await update(
        "sales",
        { id: record.id, data: { deleted_at: new Date().toISOString() }, previousData: record },
        {
          onSuccess: () => {
            notify("User removed successfully", { type: "success" });
            refresh();
            redirect("/sales");
          },
        }
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // Identity cache invalidation on role change
  const handleSave = async () => {
    await update("sales", { id: record.id, data: formData, previousData: record }, {
      onSuccess: () => {
        if (formData.role !== record.role) {
          invalidateIdentityCache(); // Force re-fetch identity
        }
        notify("Permissions updated successfully", { type: "success" });
        if (onModeToggle) onModeToggle();
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Self-edit warning */}
      {isSelfEdit && mode === "edit" && (
        <div className="p-3 border border-warning bg-warning/10 rounded-md">
          <p className="text-sm text-warning-foreground">
            <strong>Note:</strong> You cannot modify your own permissions.
          </p>
        </div>
      )}

      {/* Role selector - disabled for self */}
      <Select
        value={formData.role}
        onValueChange={(value) => handleChange("role", value)}
        disabled={isLoading || isSelfEdit}
      >
        {/* ... */}
      </Select>

      {/* Danger Zone - Remove User (admin only, not self) */}
      {!isSelfEdit && identity?.role === "admin" && (
        <div className="mt-8 pt-6 border-t border-destructive/30">
          <div className="p-4 border border-destructive/30 rounded-lg bg-destructive/5">
            <h3 className="text-sm font-semibold text-destructive mb-2">Danger Zone</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Removing a user will prevent them from accessing the system.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <AdminButton variant="destructive" size="sm" disabled={isDeleting}>
                  <Trash2 className="h-4 w-4" />
                  {isDeleting ? "Removing..." : "Remove User"}
                </AdminButton>
              </AlertDialogTrigger>
              {/* Confirmation dialog content */}
            </AlertDialog>
          </div>
        </div>
      )}
    </div>
  );
}
```

**Key points:**
- Compare `record?.id === identity?.id` for self-edit detection
- Disable inputs with `disabled={isLoading || isSelfEdit}`
- Show warning banner when user tries to edit own permissions
- Use soft-delete: set `deleted_at` timestamp, don't hard delete
- Call `invalidateIdentityCache()` when role changes for immediate permission update
- Danger zones: semantic colors (`border-destructive`, `bg-destructive/5`)
- Admin-only features: check `identity?.role === "admin"`

---

## Pattern G: Avatar Rendering with Size Variants

**When to use:** Displaying user avatars with fallback initials and consistent sizing.

```tsx
// SaleAvatar.tsx
import { AvatarFallback, AvatarImage, Avatar as ShadcnAvatar } from "@/components/ui/avatar";
import { useRecordContext } from "ra-core";
import type { Sale } from "../types";

export const SaleAvatar = (props: {
  record?: Sale;
  size?: "sm" | "md" | "lg";
  title?: string;
}) => {
  // Context-aware: can use record from context OR passed via props
  const record = useRecordContext<Sale>(props);

  if (!record?.first_name && !record?.last_name) {
    return null;
  }

  // Size variants
  const sizeClass = props.size === "sm"
    ? "w-5 h-5"
    : props.size === "lg"
    ? "w-10 h-10"
    : "w-6 h-6"; // md default

  const textSizeClass = props.size === "sm"
    ? "text-[10px]"
    : props.size === "lg"
    ? "text-sm"
    : "text-xs";

  return (
    <ShadcnAvatar className={sizeClass} title={props.title}>
      <AvatarImage src={record.avatar?.src ?? undefined} />
      <AvatarFallback className={textSizeClass}>
        {record.first_name?.charAt(0).toUpperCase()}
        {record.last_name?.charAt(0).toUpperCase()}
      </AvatarFallback>
    </ShadcnAvatar>
  );
};
```

**Key points:**
- Use `useRecordContext<Sale>(props)` for flexibility (works in list columns AND standalone)
- Size variants: `sm` (w-5/h-5), `md` (w-6/h-6 default), `lg` (w-10/h-10)
- Fallback initials: First letter of first_name + first_name of last_name, uppercased
- Handle null gracefully: return null if no name data
- Use optional `title` prop for tooltips

**Avatar field types:**
- `Sale.avatar` - Object with `src` property (`RAFile` type) - used for display
- `SalesFormData.avatar_url` - Plain URL string - used for form submissions
- `SaleWithProfile.avatar_url` - Extended type in `SalesProfileTab` for form editing

**Note:** Validation removed from form components - all validation occurs at API boundary (Edge Function) per Engineering Constitution.

---

## Pattern H: Resource Configuration (Expanded)

**When to use:** Complete resource setup with sorting, representation, and view mapping.

```tsx
// resource.tsx - Complete pattern
import * as React from "react";
import type { Sale } from "../types";
import { formatName } from "../utils/formatName";
import { ResourceErrorBoundary } from "@/components/ResourceErrorBoundary";

// 1. Lazy-load all views for code splitting
const SalesListLazy = React.lazy(() => import("./SalesList"));
const SalesEditLazy = React.lazy(() => import("./SalesEdit"));
const SalesCreateLazy = React.lazy(() => import("./SalesCreate"));
const SalesShowLazy = React.lazy(() => import("./SalesShow"));

// 2. Wrap each view in error boundary
const SalesListView = () => (
  <ResourceErrorBoundary resource="sales" page="list">
    <SalesListLazy />
  </ResourceErrorBoundary>
);

const SalesEditView = () => (
  <ResourceErrorBoundary resource="sales" page="edit">
    <SalesEditLazy />
  </ResourceErrorBoundary>
);

const SalesCreateView = () => (
  <ResourceErrorBoundary resource="sales" page="create">
    <SalesCreateLazy />
  </ResourceErrorBoundary>
);

const SalesShowView = () => (
  <ResourceErrorBoundary resource="sales" page="show">
    <SalesShowLazy />
  </ResourceErrorBoundary>
);

// 3. Export individual views (for testing)
export { SalesListView, SalesEditView, SalesCreateView, SalesShowView };

// 4. Export resource configuration (for App.tsx)
export default {
  list: SalesListView,
  edit: SalesEditView,
  create: SalesCreateView,
  show: SalesShowView,
  recordRepresentation: (record: Sale) => formatName(record?.first_name, record?.last_name),
};
```

**index.tsx entry point:**

```tsx
// index.tsx
export { default } from "./resource";
export * from "./resource";
```

**Key points:**
- Always use `React.lazy()` for views (enables code splitting)
- Every view needs `ResourceErrorBoundary` wrapper with resource and page
- Export both individual views (for testing) and default resource config
- `recordRepresentation` used for breadcrumbs, select options, navigation
- Entry `index.tsx` re-exports resource for clean imports

---

## Module Comparison Table

| Aspect | Sales (Users) | Contacts | Organizations |
|--------|---------------|----------|---------------|
| **Purpose** | Team member management | Customer contacts | Company records |
| **Slide-Over Tabs** | 2 (Profile, Permissions) | 3 (Details, Notes, Tags) | 2 (Details, Contacts) |
| **RBAC** | Admin-only create | Rep+ access | Rep+ access |
| **Filter Default** | `disabled: false` | `deleted_at: null` | `deleted_at: null` |
| **Special Features** | Self-edit prevention, Danger Zone | Quick-create, Tag picker | Hierarchy display |
| **Identity Check** | Required (for self-edit) | Optional | Optional |
| **Soft Delete Field** | `deleted_at` | `deleted_at` | `deleted_at` |

---

## Anti-Patterns

### 1. Missing Resource Configuration

```tsx
// ❌ WRONG: Direct import without lazy loading
import SalesList from "./SalesList";

export default {
  list: SalesList, // No error boundary, no code splitting
};
```

```tsx
// ✅ CORRECT: Lazy loading with error boundaries
const SalesListLazy = React.lazy(() => import("./SalesList"));

const SalesListView = () => (
  <ResourceErrorBoundary resource="sales" page="list">
    <SalesListLazy />
  </ResourceErrorBoundary>
);

export default {
  list: SalesListView,
};
```

### 2. Direct API Calls

```tsx
// ❌ WRONG: Calling Supabase directly in component
import { supabase } from "@/lib/supabase";

const handleSave = async () => {
  await supabase.from("sales").update({ role: "admin" });
};
```

```tsx
// ✅ CORRECT: Use useUpdate or service layer
const [update] = useUpdate();

const handleSave = async () => {
  await update("sales", { id: record.id, data: formData, previousData: record });
};
```

### 3. Hooks After Early Returns

```tsx
// ❌ WRONG: useMutation called after early return (Rules of Hooks violation)
export function SalesCreate() {
  const { canAccess, isPending } = useCanAccess({ resource: "sales", action: "create" });

  if (isPending) return <Skeleton />;

  const { mutate } = useMutation({ ... }); // Error: hook after conditional return!
}
```

```tsx
// ✅ CORRECT: All hooks before conditional returns
export function SalesCreate() {
  const { canAccess, isPending } = useCanAccess({ resource: "sales", action: "create" });
  const { mutate } = useMutation({ ... }); // Hooks BEFORE returns

  if (isPending) return <Skeleton />;
  if (!canAccess) return null;

  // ... render form
}
```

### 4. Hardcoded Colors

```tsx
// ❌ WRONG: Hardcoded hex or Tailwind color values
<Badge className="border-blue-600 text-blue-600">Admin</Badge>
<Badge className="border-green-500 text-green-500">Active</Badge>
```

```tsx
// ✅ CORRECT: Semantic color tokens only
<Badge className="border-primary text-primary">Admin</Badge>
<Badge className="border-success text-success">Active</Badge>
<Badge className="border-warning text-warning">Disabled</Badge>
<Badge className="border-destructive text-destructive">Error</Badge>
```

### 5. Missing Identity Check

```tsx
// ❌ WRONG: Rendering without identity loading state
export function SalesList() {
  const { data: identity } = useGetIdentity();

  return <List>...</List>; // May flash incorrect content
}
```

```tsx
// ✅ CORRECT: Show skeleton during identity load
export function SalesList() {
  const { data: identity, isPending: isIdentityPending } = useGetIdentity();

  if (isIdentityPending) return <SalesListSkeleton />;
  if (!identity) return null;

  return <List>...</List>;
}
```

### 6. Missing previousData in Updates

```tsx
// ❌ WRONG: Update without previousData (breaks ra-data-postgrest)
await update("sales", { id: record.id, data: formData });
```

```tsx
// ✅ CORRECT: Always include previousData
await update("sales", { id: record.id, data: formData, previousData: record });
```

### 7. Form-Level Validation (Engineering Constitution Violation)

```tsx
// ❌ WRONG: Client-side Zod validation in form component
const handleSave = async () => {
  const result = salesSchema.safeParse(formData);
  if (!result.success) {
    setErrors(result.error.flatten().fieldErrors);
    return; // Duplicates API boundary validation
  }
  await update("sales", { id, data: formData, previousData: record });
};
```

```tsx
// ✅ CORRECT: Validation at API boundary only (Edge Function/Service)
const handleSave = async () => {
  // NO client-side validation - API boundary validates
  await update(
    "sales",
    { id: record.id, data: formData, previousData: record },
    {
      onError: (error: Error) => {
        // Display server-returned validation errors
        const errorWithErrors = error as Error & { errors?: Record<string, string> };
        if (errorWithErrors.errors) setErrors(errorWithErrors.errors);
      },
    }
  );
};
```

**Rationale:** Per Engineering Constitution "Zod at API boundary only" - single source of truth for validation. Duplicate validation causes drift and maintenance burden.

---

## Migration Checklist

When creating a new CRUD module based on the Sales pattern:

1. [ ] Create `resource.tsx` with lazy loading and `ResourceErrorBoundary` wrappers
2. [ ] Create `index.tsx` entry point that re-exports resource config
3. [ ] Implement List view with identity-aware skeleton loading
4. [ ] Add filter config in `{module}FilterConfig.ts` with `validateFilterConfig()`
5. [ ] Create sidebar filter component using `FilterCategory` and `ToggleFilterButton`
6. [ ] Create slide-over with `ResourceSlideOver` wrapper and `TabConfig[]`
7. [ ] Add tab components with View/Edit mode support and `id="slide-over-edit-form"`
8. [ ] Use Zod schema for form **defaults only**: `schema.partial().parse({})` - validation at API boundary
9. [ ] Always pass `previousData` to `useUpdate()` calls
10. [ ] Register resource in `App.tsx` or router configuration
11. [ ] Verify TypeScript compiles: `npx tsc --noEmit`
12. [ ] Test keyboard navigation with slide-over integration
13. [ ] Verify semantic colors only (no hardcoded hex values)
14. [ ] Test self-edit prevention if applicable

---

## File Reference

| File | Purpose | Key Patterns |
|------|---------|--------------|
| `resource.tsx` | Resource config, lazy loading | A, H |
| `index.tsx` | Entry point, re-exports | H |
| `SalesList.tsx` | List view, identity loading | E |
| `SalesCreate.tsx` | Create form with RBAC guard | A, E |
| `SalesEdit.tsx` | Edit form with useEditController | A |
| `SalesShow.tsx` | Show view with ShowBase | A |
| `SalesInputs.tsx` | Tabbed form wrapper (General + Permissions) | B |
| `SalesSlideOver.tsx` | Slide-over panel | D |
| `SalesProfileTab.tsx` | Profile editing tab | B |
| `SalesPermissionsTab.tsx` | Permissions management | B, F |
| `SalesGeneralTab.tsx` | General form inputs (name, email) | B |
| `SalesPermissionsInputs.tsx` | Permissions form inputs (role) | B |
| `SalesListFilter.tsx` | Sidebar filter UI | C |
| `salesFilterConfig.ts` | Filter metadata | C |
| `SaleAvatar.tsx` | Avatar with variants | G |
| `SaleName.tsx` | Name display ("You" for self) | G |
| `UserDisableReassignDialog.tsx` | Record reassignment wizard before user disable | F |
