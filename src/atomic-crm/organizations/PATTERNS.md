# Organization Patterns

Standard patterns for organization management in Crispy CRM. This module handles the three-party business model: Principal → Distributor → Customer/Operator.

## Component Hierarchy

```
Organizations Module (index.tsx, resource.tsx)
├── List View (OrganizationList.tsx)
│   ├── UnifiedListPageLayout
│   │   ├── OrganizationListFilter
│   │   ├── OrganizationViewSwitcher [Pattern J] (list/card toggle)
│   │   ├── OrganizationImportMenuItem [Pattern C] (overflow menu)
│   │   └── OrganizationBulkButtons [Pattern F] (bare buttons, no toolbar wrapper)
│   │       ├── BulkReassignButton (shared ra-wrapper)
│   │       ├── BulkExportButton (shared ra-wrapper)
│   │       └── OrganizationBulkDeleteButton
│   ├── OrganizationDatagridHeader (filterable columns)
│   ├── PremiumDatagrid (list view)
│   │   └── OrganizationTypeBadge, PriorityBadge, SegmentBadge [Pattern E]
│   └── OrganizationCardGrid (card view) [Pattern J]
│       └── OrganizationCard
│
├── Create View (OrganizationCreate.tsx)
│   ├── OrganizationInputs
│   │   ├── OrganizationCompactForm
│   │   │   ├── OrganizationHierarchySection [Pattern A]
│   │   │   └── PrincipalAwareTypeInput [Pattern I]
│   │   │   (OrganizationStatusSection exists but hidden per user feedback)
│   │   └── useDuplicateOrgCheck [Pattern B]
│   └── DuplicateOrgWarningDialog [Pattern B]
│
├── Edit View (OrganizationEdit.tsx)
│   └── (same form structure as Create)
│
├── Slide-Over Detail (OrganizationSlideOver.tsx)
│   └── ResourceSlideOver (two-column layout)
│       ├── Left Tabs:
│       │   ├── slideOverTabs/OrganizationActivitiesTab
│       │   ├── AuthorizationsTab [Pattern D] (distributor only)
│       │   ├── slideOverTabs/OrganizationContactsTab
│       │   └── slideOverTabs/OrganizationOpportunitiesTab
│       └── Right Panel (always visible):
│           └── slideOverTabs/OrganizationRightPanel
│               ├── Organization details (view/edit mode)
│               ├── Notes (ReferenceManyField)
│               └── BranchLocationsSection
│
└── Inline Creation
    ├── QuickCreatePopover [Pattern G]
    └── QuickCreateOrganizationRA [Pattern G] (React Admin autocomplete context)
```

---

## Pattern A: Organization Hierarchy (Parent/Branch)

Models parent-child relationships for multi-location enterprises.

```tsx
// src/atomic-crm/organizations/OrganizationHierarchySection.tsx
import { ParentOrganizationInput } from "./ParentOrganizationInput";
import { ORG_SCOPE_CHOICES } from "./constants";

export const OrganizationHierarchySection = () => {
  return (
    <CollapsibleSection title="Organization Hierarchy">
      <div className="space-y-4">
        <FormFieldWrapper name="parent_organization_id">
          <ParentOrganizationInput />
        </FormFieldWrapper>
        <CompactFormRow>
          <FormFieldWrapper name="org_scope">
            <SelectInput
              source="org_scope"
              label="Organization Level"
              choices={ORG_SCOPE_CHOICES}
              helperText="National = brand/HQ, Regional = operating company"
            />
          </FormFieldWrapper>
          <div className="space-y-1">
            <FormFieldWrapper name="is_operating_entity">
              <BooleanInput
                source="is_operating_entity"
                label="This location processes orders"
              />
            </FormFieldWrapper>
            <p className="text-sm text-muted-foreground ml-11">
              <strong>ON:</strong> Orders and invoices happen here (e.g., Sysco Chicago)
              <br />
              <strong>OFF:</strong> Corporate brand or holding company only (e.g., Sysco Corporation)
            </p>
          </div>
        </CompactFormRow>
      </div>
    </CollapsibleSection>
  );
};
```

### Hierarchy Data Model

| Field | Type | Description |
|-------|------|-------------|
| `parent_organization_id` | `number \| null` | Links to parent organization |
| `org_scope` | `national \| regional \| local` | Organizational level |
| `is_operating_entity` | `boolean` | Whether this location processes orders |

### When to Use

- **Distributors with multiple locations** (Sysco Corporation → Sysco Chicago)
- **Franchises or chains** (HQ tracks brand, branches handle operations)
- **Regional divisions** (National sales team + regional reps)

**Example:** Sysco Corporation (national, not operating) → Sysco Chicago (regional, operating)

---

## Pattern B: Duplicate Detection Workflow

Hard blocking duplicate check -- if a duplicate is detected, the user must change the name or view the existing organization. There is no bypass path.

```tsx
// src/atomic-crm/organizations/useDuplicateOrgCheck.ts
export function useDuplicateOrgCheck(): UseDuplicateOrgCheckResult {
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const [duplicateOrg, setDuplicateOrg] = useState<DuplicateOrgInfo | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkForDuplicate = useCallback(
    async (name: string, currentOrgId?: string | number): Promise<DuplicateOrgInfo | null> => {
      if (!name || name.trim().length === 0) return null;

      setIsChecking(true);
      try {
        // Case-insensitive search via ilike
        const { data } = await dataProvider.getList<Company>("organizations", {
          filter: { "name@ilike": name.trim() },
          pagination: { page: 1, perPage: 10 },
          sort: { field: "id", order: "ASC" },
        });

        // Filter out current record (for edit mode)
        const duplicates = data.filter((org) => String(org.id) !== String(currentOrgId));

        if (duplicates.length > 0) {
          const duplicate = { id: duplicates[0].id, name: duplicates[0].name };
          setDuplicateOrg(duplicate);
          return duplicate;
        }
        return null;
      } catch (error: unknown) {
        logger.error("Failed to check for duplicate organization", error, { ... });
        notify("Unable to check for duplicate organizations. Please try again.", { type: "warning" });
        return null;
      } finally {
        setIsChecking(false);
      }
    },
    [dataProvider, notify]
  );

  const clearDuplicate = useCallback(() => {
    setDuplicateOrg(null);
  }, []);

  return { checkForDuplicate, duplicateOrg, clearDuplicate, isChecking };
}
```

### Workflow Diagram

```
User enters name → Save clicked → checkForDuplicate()
                                        ↓
                              [Duplicate found?]
                               ↓ Yes         ↓ No
                      Show blocking dialog   Save record
                               ↓
              [User choice: Change name | View existing]
                  ↓                           ↓
           clearDuplicate()              Navigate to org
           (user edits name)
```

### When to Use

- **Create forms** where duplicates must be prevented
- **Quick-create popovers** (Pattern G integrates `useDuplicateOrgCheck`)
- **Import workflows** for pre-save validation

**Key design decision:** Hard blocking prevents accidental duplicates. The user must change the name or view the existing record -- there is no bypass/override path.

---

## Pattern C: Import/Export Logic

Pure business logic separated from React for testability.

```tsx
// src/atomic-crm/organizations/organizationImport.logic.ts
// Framework-agnostic - no React imports

/**
 * Detect duplicate organizations based on name
 * Strategy: Case-insensitive, trimmed comparison
 */
export function detectDuplicateOrganizations(
  orgs: OrganizationImportSchema[],
  strategy: "name" = "name"
): DuplicateReport {
  const nameMap = new Map<string, number[]>();

  orgs.forEach((org, index) => {
    if (!org.name) return;
    const normalizedName = org.name.toLowerCase().trim();
    if (!nameMap.has(normalizedName)) {
      nameMap.set(normalizedName, []);
    }
    nameMap.get(normalizedName)!.push(index);
  });

  // Filter to only groups with duplicates (2+ entries)
  const duplicates: DuplicateReport["duplicates"] = [];
  nameMap.forEach((indices, _normalizedName) => {
    if (indices.length > 1) {
      duplicates.push({
        indices,
        name: orgs[indices[0]].name,
        count: indices.length,
      });
    }
  });

  return { duplicates, totalDuplicates: duplicates.reduce((sum, g) => sum + (g.count - 1), 0) };
}

/**
 * Apply data quality transformations based on user decisions
 */
export function applyDataQualityTransformations(
  orgs: OrganizationImportSchema[],
  _decisions: DataQualityDecisions = {}
): TransformResult {
  const transformedSet = new Set<number>();
  const validPriorities = ["A", "B", "C", "D"];

  const transformedOrganizations = orgs.map((org, index) => {
    const transformed = { ...org };

    // Normalize invalid priority values to "C"
    if (transformed.priority && !validPriorities.includes(transformed.priority)) {
      transformed.priority = "C";
      transformedSet.add(index);
    }

    // Auto-correct LinkedIn URLs (add https://, validate domain)
    if (transformed.linkedin_url) {
      // ... URL validation and correction
    }

    return transformed;
  });

  return {
    transformedOrganizations,
    transformationCount: transformedSet.size,
    wasTransformed: (index: number) => transformedSet.has(index),
  };
}
```

### Import Pipeline Stages

```
CSV Upload → Parse → detectDuplicateOrganizations()
                              ↓
              applyDataQualityTransformations()
                              ↓
              validateTransformedOrganizations() (Zod)
                              ↓
              Preview UI (show transformations)
                              ↓
              Batch create via dataProvider
```

### When to Use

- **CSV/Excel imports** requiring data quality checks
- **Batch operations** needing validation before save
- **Testable business logic** independent of React components

**Key design decision:** Pure functions enable unit testing without mocking React Admin context.

---

## Pattern D: Authorization Management (Distributor-Only)

Conditional tab rendering for distributor-principal relationships.

```tsx
// src/atomic-crm/organizations/AuthorizationsTab.tsx
export function AuthorizationsTab({
  record,
  distributorId: propDistributorId,
  isActiveTab = true,
}: AuthorizationsTabProps) {
  const distributorId = record?.id ?? propDistributorId;
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [removeAuth, setRemoveAuth] = useState<AuthorizationWithPrincipal | null>(null);

  // Fetch authorizations for this distributor (only when tab is active)
  const { data: authorizations, isPending } = useGetList<AuthorizationWithPrincipal>(
    "distributor_principal_authorizations",
    {
      filter: { distributor_id: distributorId, deleted_at: null },
      sort: { field: "created_at", order: "DESC" },
      pagination: { page: 1, perPage: 100 },
    },
    { enabled: isActiveTab && !!distributorId }
  );

  // Fetch available principals (not already authorized)
  const { data: principals } = useGetList<PrincipalOrganization>(
    "organizations",
    {
      filter: { organization_type: "principal", deleted_at: null },
      pagination: { page: 1, perPage: 200 },
    },
    { enabled: isActiveTab && addDialogOpen }
  );

  const authorizedPrincipalIds = new Set(authorizations?.map((a) => a.principal_id));
  const availablePrincipals = principals?.filter((p) => !authorizedPrincipalIds.has(Number(p.id)));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {authorizations?.length || 0} authorized principals
        </p>
        <AdminButton variant="outline" size="sm" onClick={() => setAddDialogOpen(true)} className="h-11">
          <Plus className="h-4 w-4 mr-1" />
          Add Principal
        </AdminButton>
      </div>

      {authorizations?.map((auth) => (
        <AuthorizationCard
          key={auth.id}
          authorization={auth}
          distributorId={Number(distributorId)}
          onRemove={() => setRemoveAuth(auth)}
        />
      ))}

      <AddPrincipalDialog ... />
      <RemoveConfirmDialog ... />
    </div>
  );
}
```

### Authorization Data Model

| Table | Fields | Purpose |
|-------|--------|---------|
| `distributor_principal_authorizations` | `distributor_id`, `principal_id`, `territory`, `notes`, `expires_at` | Join table |
| `product_exceptions` | `authorization_id`, `product_id`, `is_authorized` | Product-level overrides |

### When to Use

- **Distributor organizations only** (conditionally render tab)
- **Managing product line permissions** per distributor
- **Territory and expiration tracking** for authorizations

**Key design decision:** `isActiveTab` prop prevents unnecessary data fetching when tab is hidden.

---

## Pattern E: Organization Badges

Semantic color badges for type and priority visualization.

```tsx
// src/atomic-crm/organizations/OrganizationBadges.tsx
import { ORG_TYPE_COLOR_MAP, PRIORITY_VARIANT_MAP } from "./constants";

/**
 * Organization type badge with MFB Garden to Table theme colors
 */
export const OrganizationTypeBadge = memo(function OrganizationTypeBadge({ type }) {
  const colorClass = ORG_TYPE_COLOR_MAP[type as OrganizationType] || "tag-gray";
  return (
    <Badge className={`text-xs px-2 py-1 ${colorClass}`}>
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </Badge>
  );
});

/**
 * Priority badge with semantic status colors
 */
export const PriorityBadge = memo(function PriorityBadge({ priority }) {
  const variant = PRIORITY_VARIANT_MAP[priority as PriorityLevel] || "default";
  const label = PRIORITY_CHOICES.find((p) => p.id === priority)?.name || priority;
  return (
    <Badge variant={variant} className="text-xs px-2 py-1">
      {label}
    </Badge>
  );
});
```

### Color Mapping Tables

**Organization Type Colors (MFB Garden to Table Theme):**

| Type | CSS Class | Meaning |
|------|-----------|---------|
| customer | `tag-warm` | Clay Orange - welcoming, active relationship |
| prospect | `tag-sage` | Olive Green - growth potential |
| principal | `tag-purple` | Eggplant - important/primary |
| distributor | `tag-teal` | Active/connected in supply chain |

**Priority Variant Mapping:**

| Priority | Badge Variant | Meaning |
|----------|---------------|---------|
| A | `destructive` | Red - urgent attention |
| B | `default` | Primary green |
| C | `secondary` | Muted |
| D | `outline` | Minimal emphasis |

### SegmentBadge

Displays segment name with color derived from `getSegmentColor()` in `constants.ts`.

```tsx
// src/atomic-crm/organizations/OrganizationBadges.tsx
export const SegmentBadge = memo(function SegmentBadge({ segmentId, segmentName }) {
  if (!segmentName) {
    return <span className="text-muted-foreground text-xs">—</span>;
  }
  const colorClass = getSegmentColor(segmentId);
  return (
    <Badge className={`text-xs px-2 py-1 max-w-[130px] truncate ${colorClass}`} title={segmentName}>
      {segmentName}
    </Badge>
  );
});
```

**Segment Color Strategy (`getSegmentColor` in `constants.ts`):**

| Category | Color | Notes |
|----------|-------|-------|
| Major Broadline | `tag-blue` | Playbook segment (by UUID lookup) |
| Specialty\Regional | `tag-green` | Playbook segment |
| Management Company | `tag-cocoa` | Playbook segment |
| GPO | `tag-amber` | Playbook segment |
| University | `tag-clay` | Playbook segment |
| Restaurant Group | `tag-pink` | Playbook segment |
| Chain Restaurant | `tag-yellow` | Playbook segment |
| Hotel & Aviation | `tag-gray` | Playbook segment |
| Unknown | `tag-gray` | Default fallback |
| (any operator segment) | `tag-gray` | 16+ operator segments default to gray |

### When to Use

- **List views** for quick visual scanning
- **Slide-over headers** for context
- **Card view** for organization summary cards
- **Filter chips** showing active filters (via `FilterableBadge` wrapper)

**Key design decision:** Uses `memo()` to prevent re-renders when parent changes. `SegmentBadge` is wrapped in `FilterableBadge` in the list view to provide 44px touch targets (WCAG AA).

---

## Pattern F: Bulk Action Buttons

Bare action buttons rendered inside `UnifiedListPageLayout`'s shared `BulkActionsToolbar`. The component renders only the buttons -- the toolbar wrapper is provided by the layout.

```tsx
// src/atomic-crm/organizations/OrganizationBulkActionsToolbar.tsx
// NOTE: File still named OrganizationBulkActionsToolbar.tsx but exports OrganizationBulkButtons
import { BulkExportButton } from "@/components/ra-wrappers/bulk-export-button";
import { BulkReassignButton } from "@/components/ra-wrappers/bulk-reassign-button";
import { OrganizationBulkDeleteButton } from "./OrganizationBulkDeleteButton";
import { organizationKeys } from "../queryKeys";
import type { Organization } from "../types";

/**
 * OrganizationBulkButtons - Bulk action buttons for the Organizations list
 *
 * Renders ONLY the action buttons (no toolbar wrapper).
 * UnifiedListPageLayout wraps these in the shared BulkActionsToolbar.
 */
export const OrganizationBulkButtons = () => (
  <>
    <BulkReassignButton<Organization>
      resource="organizations"
      queryKeys={organizationKeys}
      itemDisplayName={(org) => org.name}
      itemSubtitle={(org) => org.organization_type}
    />
    <BulkExportButton />
    <OrganizationBulkDeleteButton />
  </>
);

// Usage in OrganizationList.tsx:
// <UnifiedListPageLayout bulkActions={view === "list" ? <OrganizationBulkButtons /> : undefined}>
```

### Bulk Actions Available

| Action | Component | Description |
|--------|-----------|-------------|
| Reassign | `BulkReassignButton` (shared) | Sequential updates with AbortController cancellation |
| Export | `BulkExportButton` (shared) | Export selected records to CSV |
| Delete | `OrganizationBulkDeleteButton` | Soft delete (blocked if org has child branches) |

### Shared BulkReassignButton Pattern

The generic `BulkReassignButton` from `@/components/ra-wrappers/bulk-reassign-button` implements:

- **Sequential updates** with AbortController cancellation support
- **Preview dialog** showing all selected items before action
- **Sales rep selector** with disabled reps filtered out
- **Partial success reporting** (shows count of successful vs failed)
- **Query cache invalidation** via provided queryKeys

```tsx
// Usage pattern for BulkReassignButton
<BulkReassignButton<Organization>
  resource="organizations"           // Resource name for dataProvider
  queryKeys={organizationKeys}       // For cache invalidation
  itemDisplayName={(org) => org.name}  // Display in preview
  itemSubtitle={(org) => org.organization_type}  // Secondary info
  onSuccess={() => {}}               // Optional callback
/>
```

### When to Use

- **Reassigning owner** for multiple organizations
- **Bulk exports** for reporting or data migration
- **Bulk soft deletes** with validation (e.g., no child branches)

**Key design decision:** Uses shared wrapper components from `@/components/ra-wrappers/` for consistency across modules. Organization-specific logic (like child branch validation) lives in dedicated components.

---

## Pattern G: Quick Create Popover

Lightweight inline creation with two paths and two exported components. Uses `createFormResolver` (CORE-018 compliant), an extracted `useQuickCreateOrg` hook for shared logic, and `QuickCreateFormFields` for the form body. Integrates `useDuplicateOrgCheck` (Pattern B) to block duplicate creation.

### Architecture

```
QuickCreatePopover.tsx
├── useQuickCreateOrg (shared hook)
│   ├── useForm + createFormResolver(organizationQuickCreateSchema)
│   ├── useDuplicateOrgCheck (Pattern B)
│   ├── handleSubmit (full form)
│   └── handleQuickCreate (name-only fast path)
├── QuickCreateFormFields (shared sub-component)
│   ├── Name input (with aria-invalid, aria-describedby)
│   ├── OrganizationTypeSelect (useWatch isolate)
│   ├── PrioritySelect (useWatch isolate)
│   ├── City / State inputs
│   └── showDetails prop controls field visibility
├── QuickCreatePopover (standalone popover)
│   └── DuplicateOrgWarningDialog
└── QuickCreateOrganizationRA (React Admin autocomplete context)
    ├── useCreateSuggestionContext() for filter/onCreate/onCancel
    ├── minimalMode prop (name-only form, no details)
    └── DuplicateOrgWarningDialog
```

```tsx
// src/atomic-crm/organizations/QuickCreatePopover.tsx

// Shared hook -- form setup + creation logic + duplicate checking
function useQuickCreateOrg({ name, organizationType, onSuccess, logContext }) {
  const { checkForDuplicate, duplicateOrg, clearDuplicate } = useDuplicateOrgCheck();

  const methods = useForm<OrganizationQuickCreateInput>({
    resolver: createFormResolver(organizationQuickCreateSchema),  // CORE-018 compliant
    defaultValues: { name, organization_type: organizationType, priority: "C", segment_id: PLAYBOOK_CATEGORY_IDS.Unknown },
  });

  const createOrg = async (data: OrganizationQuickCreateInput) => {
    const duplicate = await checkForDuplicate(data.name);
    if (duplicate) return;  // Blocked -- DuplicateOrgWarningDialog shown
    // ... create via dataProvider, invalidate cache, notify
  };

  return { methods, isPending, handleSubmit, handleQuickCreate, duplicateOrg, clearDuplicate };
}

// Standalone popover (used from custom autocomplete inputs)
export function QuickCreatePopover({ name, organizationType, onCreated, onCancel, children }) {
  const { methods, isPending, handleSubmit, handleQuickCreate, duplicateOrg, clearDuplicate } =
    useQuickCreateOrg({ name, organizationType, onSuccess: onCreated });
  // ... Popover with QuickCreateFormFields + DuplicateOrgWarningDialog
}

// React Admin autocomplete integration (used with useCreateSuggestionContext)
export function QuickCreateOrganizationRA({ organizationType = "customer", minimalMode = false }) {
  const { filter, onCreate, onCancel } = useCreateSuggestionContext();
  // ... same useQuickCreateOrg hook, minimalMode hides detail fields
}
```

### Two Creation Paths

| Path | Button | Fields Used | Use Case |
|------|--------|-------------|----------|
| Fast | "Just use name" | name, type, priority (default C), segment (Unknown) | Quick data entry, will edit later |
| Full | "Create" | All form fields (name, type, priority, city, state, segment) | Complete record with details |

### Two Exported Components

| Component | Context | Use Case |
|-----------|---------|----------|
| `QuickCreatePopover` | Standalone with `PopoverTrigger` | Custom autocomplete, manual trigger |
| `QuickCreateOrganizationRA` | `useCreateSuggestionContext()` | React Admin `AutocompleteInput` create suggestion |

### When to Use

- **Autocomplete "not found"** scenarios (via `QuickCreateOrganizationRA`)
- **Reference field quick-add** without leaving form (via `QuickCreatePopover`)
- **Data import follow-up** for missing references

**Key design decision:** Two buttons serve different user intents -- speed vs completeness. Duplicate checking (Pattern B) blocks creation if a match is found. `useQuickCreateOrg` hook is shared between both exported components to avoid logic duplication.

---

## Pattern H: Status & Address Sections

Reusable form sections with consistent layout. Each section is in its own well-named file for maintainability:
- `OrganizationStatusSection.tsx` - Status and payment fields (**currently hidden** in `OrganizationCompactForm` per user feedback; defaults: `status='active'`)
- `OrganizationAddressSection.tsx` - Shipping address fields (uses `shipping_*` prefixed field names)

> **Note on field naming:** `OrganizationAddressSection` uses `shipping_street`, `shipping_city`, `shipping_state`, `shipping_postal_code` (prefixed). The main `OrganizationCompactForm` has its own inline Location section using non-prefixed fields: `address`, `city`, `state`, `postal_code`. These are distinct database columns serving different purposes.

```tsx
// src/atomic-crm/organizations/OrganizationStatusSection.tsx
// NOTE: This component exists but is NOT imported by OrganizationCompactForm.
// Hidden per user feedback. The compact form comments it out:
//   {/* Status & Payment fields hidden per user feedback - defaults: status='active' */}
export const OrganizationStatusSection = () => {
  return (
    <FormSection title="Status & Payment">
      <div className="space-y-4">
        <CompactFormRow>
          <FormFieldWrapper name="status">
            <SelectInput source="status" choices={STATUS_CHOICES} />
          </FormFieldWrapper>
          <FormFieldWrapper name="status_reason">
            <SelectInput source="status_reason" choices={STATUS_REASON_CHOICES} />
          </FormFieldWrapper>
        </CompactFormRow>
        <CompactFormRow>
          <FormFieldWrapper name="payment_terms">
            <SelectInput source="payment_terms" choices={PAYMENT_TERMS_CHOICES} />
          </FormFieldWrapper>
          <FormFieldWrapper name="credit_limit">
            <NumberInput source="credit_limit" label="Credit Limit" />
          </FormFieldWrapper>
        </CompactFormRow>
        <FormFieldWrapper name="territory">
          <TextInput source="territory" label="Territory" helperText="Geographic territory assignment" />
        </FormFieldWrapper>
      </div>
    </FormSection>
  );
};

// src/atomic-crm/organizations/OrganizationAddressSection.tsx
// Uses shipping_* prefixed fields (distinct from main form's non-prefixed address fields)
export const OrganizationAddressSection = () => {
  return (
    <CollapsibleSection title="Address">
      <div className="space-y-4">
        <FormFieldWrapper name="shipping_street">
          <TextInput source="shipping_street" label="Street" />
        </FormFieldWrapper>
        <CompactFormRow>
          <FormFieldWrapper name="shipping_city">
            <TextInput source="shipping_city" label="City" />
          </FormFieldWrapper>
          <FormFieldWrapper name="shipping_state">
            <StateComboboxInput source="shipping_state" label="State" />
          </FormFieldWrapper>
        </CompactFormRow>
        <FormFieldWrapper name="shipping_postal_code">
          <TextInput source="shipping_postal_code" label="ZIP Code" helperText={false} />
        </FormFieldWrapper>
      </div>
    </CollapsibleSection>
  );
};
```

### Section Types

| Component | Behavior | Use Case |
|-----------|----------|----------|
| `FormSection` | Always visible, titled | Required fields, important data |
| `CollapsibleSection` | Expandable, saves space | Optional fields, secondary info |
| `CompactFormRow` | Side-by-side fields | Related fields (city/state, name/type) |

### When to Use

- **Organizing form layouts** with logical groupings
- **Saving vertical space** with collapsible sections
- **Consistent field alignment** with CompactFormRow

---

## Pattern I: Organization Type Filtering

Field-level validation with product dependency check.

```tsx
// src/atomic-crm/organizations/PrincipalAwareTypeInput.tsx
export const PrincipalAwareTypeInput = () => {
  const record = useRecordContext<Organization>();
  const { setValue } = useFormContext();
  const currentType = useWatch({ name: "organization_type" });

  const [showWarning, setShowWarning] = useState(false);
  const [attemptedType, setAttemptedType] = useState("");

  const wasPrincipal = record?.organization_type === "principal";
  const previousTypeRef = useRef<string | undefined>(currentType);

  // Pre-fetch products for principals
  const { data: products, isLoading: productsLoading } = useGetList<Product>(
    "products",
    {
      filter: { principal_id: record?.id },
      pagination: { page: 1, perPage: 1 }, // Only need to know if ANY exist
    },
    { enabled: wasPrincipal && !!record?.id }
  );

  const hasProducts = (products?.length ?? 0) > 0;

  // Watch for type changes and validate
  useEffect(() => {
    if (previousTypeRef.current === currentType) return;

    // If changing FROM principal to something else
    if (wasPrincipal && previousTypeRef.current === "principal" &&
        currentType !== "principal" && !productsLoading) {
      if (hasProducts) {
        // Revert the change and show warning
        setAttemptedType(currentType);
        setShowWarning(true);
        setValue("organization_type", "principal", { shouldDirty: false });
        return;
      }
    }

    previousTypeRef.current = currentType;
  }, [currentType, wasPrincipal, hasProducts, productsLoading, setValue]);

  return (
    <>
      <SelectInput
        source="organization_type"
        choices={ORGANIZATION_TYPE_CHOICES}
        optionText={renderTypeWithDescription}
      />
      <PrincipalChangeWarning
        open={showWarning}
        onClose={handleWarningClose}
        onConfirm={handleWarningClose}
        newType={attemptedType}
      />
    </>
  );
};
```

### Validation Flow

```
User changes type from "principal" → "customer"
                     ↓
           [Has products assigned?]
             ↓ Yes           ↓ No
       Revert change      Allow change
       Show warning
```

### When to Use

- **Preventing data integrity violations** at the field level
- **Providing immediate feedback** instead of save-time errors
- **Protecting dependent relationships** (principal → products)

**Key design decision:** Field-level validation provides immediate feedback, better UX than save-time rejection.

---

## Pattern J: Card/List View Switching

Toggle between datagrid (list) and card grid views with localStorage persistence.

### Components

| Component | Purpose |
|-----------|---------|
| `OrganizationViewSwitcher` | `ToggleGroup` with list/card icons (44px touch targets) |
| `OrganizationCardGrid` | Responsive CSS grid consuming `useListContext<OrganizationRecord>()` |
| `OrganizationCard` | Individual card with avatar, badges, hierarchy chips, counts |

```tsx
// src/atomic-crm/organizations/OrganizationViewSwitcher.tsx
export type OrganizationView = "list" | "card";

export const OrganizationViewSwitcher = ({ view, onViewChange }) => {
  return (
    <ToggleGroup type="single" value={view} onValueChange={(v) => v && onViewChange(v)}>
      <ToggleGroupItem value="list" aria-label="List view" className="h-11 w-11">
        <List className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="card" aria-label="Card view" className="h-11 w-11">
        <LayoutGrid className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
};
```

### localStorage Persistence

```tsx
// In OrganizationList.tsx
const ORGANIZATION_VIEW_KEY = "organization.view.preference";

const getViewPreference = (): OrganizationView => {
  const saved = localStorage.getItem(ORGANIZATION_VIEW_KEY);
  return saved === "list" || saved === "card" ? saved : "list";
};

const [view, setView] = useState<OrganizationView>(getViewPreference);
const handleViewChange = (newView: OrganizationView) => {
  setView(newView);
  localStorage.setItem(ORGANIZATION_VIEW_KEY, newView);
};
```

### Layout Integration

The view switcher is passed to `UnifiedListPageLayout` via the `viewSwitcher` prop. The `OrganizationDatagrid` component conditionally renders either `PremiumDatagrid` (list) or `OrganizationCardGrid` (card) based on the current view. Bulk actions are disabled in card view (`bulkActions={view === "list" ? <OrganizationBulkButtons /> : undefined}`).

### Card Grid Layout

`OrganizationCardGrid` uses a responsive CSS grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`. Each `OrganizationCard` is keyboard-accessible (`role="button"`, `tabIndex={0}`, Enter/Space handlers) and displays: avatar, name, hierarchy chips, type badge, segment badge, priority badge, state, contact count, and opportunity count.

### When to Use

- **Organization list page** for user preference between dense table and visual cards
- **Extend to other resources** by creating resource-specific ViewSwitcher + CardGrid + Card

---

## Pattern Comparison Tables

### Bulk Reassign vs Individual Edit

| Aspect | Bulk Reassign | Individual Edit |
|--------|---------------|-----------------|
| **Organization Level** | Multiple records | Single record |
| **Cancellation** | AbortController mid-operation | Browser back/cancel button |
| **Partial success** | Yes, with counts | N/A (all or nothing) |
| **Audit trail** | DB triggers (automatic) | DB triggers (automatic) |
| **Use case** | Territory reorganization | Normal editing |

### Quick Create vs Full Create Form

| Aspect | Quick Create Popover | Full Create Form |
|--------|---------------------|------------------|
| **Fields** | 5 essential fields + segment | All organization fields |
| **Navigation** | Stays on current page | New page/route |
| **Duplicate check** | Yes (Pattern B via useQuickCreateOrg) | Yes (Pattern B) |
| **Resolver** | `createFormResolver` (CORE-018) | `createFormResolver` (CORE-018) |
| **Use case** | Reference field quick-add | Primary data entry |

### Hard Duplicate Check vs Zod Schema Validation

| Aspect | Hard Duplicate Check (Pattern B) | Zod Schema Validation |
|--------|----------------------------------|----------------------|
| **User experience** | Blocking dialog -- must change name or view existing | Inline field errors, must fix before save |
| **Implementation** | `useDuplicateOrgCheck` + `DuplicateOrgWarningDialog` | `createFormResolver(schema)` |
| **Bypass** | None -- no override path | None -- schema enforced |
| **Use case** | Preventing duplicate organizations | Required fields, format, type constraints |
| **Data quality** | Enforced by system | Enforced by system |

---

## Anti-Patterns

### 1. Creating Duplicates Without Checking

```tsx
// WRONG - No duplicate check
const handleSave = async (data) => {
  await dataProvider.create("organizations", { data });
};

// CORRECT - Check first with Pattern B
const { checkForDuplicate, duplicateOrg } = useDuplicateOrgCheck();
const handleSave = async (data) => {
  const duplicate = await checkForDuplicate(data.name);
  if (duplicate) {
    // Show confirmation dialog
    return;
  }
  await dataProvider.create("organizations", { data });
};
```

### 2. Breaking Hierarchy Relationships

```tsx
// WRONG - Deleting parent without handling children
await dataProvider.delete("organizations", { id: parentOrgId });

// CORRECT - Check for children first or use soft delete
const { data: children } = await dataProvider.getList("organizations", {
  filter: { parent_organization_id: parentOrgId },
});
if (children.length > 0) {
  notify("Cannot delete organization with branches", { type: "error" });
  return;
}
```

### 3. Changing Principal Type With Products

```tsx
// WRONG - Allow type change without checking products
<SelectInput source="organization_type" choices={ORGANIZATION_TYPE_CHOICES} />

// CORRECT - Use Pattern I with product check
<PrincipalAwareTypeInput />
```

### 4. Direct Supabase Imports

```tsx
// WRONG - Bypasses unified data provider
import { supabase } from "@/lib/supabase";
const { data } = await supabase.from("organizations").select("*");

// CORRECT - Use data provider
const dataProvider = useDataProvider();
const { data } = await dataProvider.getList("organizations", { ... });
```

### 5. Using zodResolver Directly (CORE-018 Violation)

```tsx
// WRONG - Direct zodResolver bypasses centralized error formatting
import { zodResolver } from "@hookform/resolvers/zod";
const methods = useForm({
  resolver: zodResolver(mySchema),
});

// CORRECT - Use createFormResolver for consistent error messages
import { createFormResolver } from "@/lib/zodErrorFormatting";
const methods = useForm({
  resolver: createFormResolver(mySchema),
});
```

### 6. Batch API Without Cancellation

```tsx
// WRONG - No way to cancel mid-operation
const handleBulkUpdate = async () => {
  await Promise.all(selectedIds.map(id => dataProvider.update(...)));
};

// CORRECT - Use AbortController (Pattern F)
const abortControllerRef = useRef<AbortController | null>(null);
// ... with signal.aborted check in loop
```

---

## Migration Checklist

### Adding a New Organization Field

1. [ ] Add column to database migration
2. [ ] Update Zod schema in `src/atomic-crm/validation/organizations.ts`
3. [ ] Add to `OrganizationImportSchema` if importable
4. [ ] Add input to appropriate section (Pattern H)
5. [ ] Update list/show views if visible
6. [ ] Add to CSV exporter if exportable

### Adding a New Organization Type

1. [ ] Add to `OrganizationType` union in `constants.ts`
2. [ ] Add to `ORGANIZATION_TYPE_CHOICES` array
3. [ ] Add to `ORGANIZATION_TYPE_DESCRIPTIONS` object
4. [ ] Add color mapping to `ORG_TYPE_COLOR_MAP`
5. [ ] Update `PrincipalAwareTypeInput` if special handling needed
6. [ ] Add to Zod schema enum

### Adding a New Badge Variant

1. [ ] Define color in `constants.ts` mapping
2. [ ] Create badge component following Pattern E
3. [ ] Use `memo()` for performance
4. [ ] Add to list view columns
5. [ ] Document in this file

### Extending the Hierarchy Model

1. [ ] Add new organization level choice to `ORG_SCOPE_CHOICES`
2. [ ] Update `OrganizationHierarchySection` UI if needed
3. [ ] Verify parent/child queries handle new scope
4. [ ] Update import logic (Pattern C) for new field
5. [ ] Document parent-child relationship rules

### Adding a New Bulk Action

1. [ ] Follow Pattern F structure (AbortController, partial success)
2. [ ] Add button to `OrganizationBulkButtons` (in `OrganizationBulkActionsToolbar.tsx`)
3. [ ] Include preview of affected records
4. [ ] Add confirmation dialog
5. [ ] Add cancellation support
6. [ ] Test partial failure scenarios

---

## File Reference

| File | Pattern | Purpose |
|------|---------|---------|
| `index.tsx` | -- | Resource registration and exports |
| `resource.tsx` | -- | React Admin resource definition |
| `constants.ts` | A, E, H | Type choices, color maps, segment colors, scope choices |
| `types.ts` | -- | TypeScript interfaces (OrganizationRecord, etc.) |
| **List** | | |
| `OrganizationList.tsx` | F, J | List page with view switching, exporter, bulk actions |
| `OrganizationListFilter.tsx` | -- | Filter sidebar/bar for list view |
| `OrganizationDatagridHeader.tsx` | -- | Filterable column headers |
| `OrganizationViewSwitcher.tsx` | J | List/card toggle with localStorage persistence |
| `OrganizationCardGrid.tsx` | J | Responsive card grid using `useListContext` |
| `OrganizationCard.tsx` | J | Individual organization card (avatar, badges, counts) |
| `OrganizationEmpty.tsx` | -- | Empty state for list with no data |
| `organizationColumnConfig.ts` | -- | Column configuration for datagrid |
| `organizationFilterConfig.ts` | -- | Filter configuration for UnifiedListPageLayout |
| `OrganizationBulkActionsToolbar.tsx` | F | Exports `OrganizationBulkButtons` (bare buttons) |
| `OrganizationBulkDeleteButton.tsx` | F | Soft delete with child-branch validation |
| **Create/Edit** | | |
| `OrganizationCreate.tsx` | B | Create form with duplicate check |
| `OrganizationEdit.tsx` | -- | Edit form (same structure as Create) |
| `OrganizationInputs.tsx` | -- | Shared form input wrappers |
| `OrganizationCompactForm.tsx` | A, H, I | Main form with sections |
| `OrganizationCreateFormFooter.tsx` | -- | Create form footer actions |
| **Form Sections** | | |
| `OrganizationHierarchySection.tsx` | A | Parent/branch hierarchy inputs |
| `OrganizationStatusSection.tsx` | H | Status & payment (currently hidden in compact form) |
| `OrganizationAddressSection.tsx` | H | Shipping address (`shipping_*` prefix fields) |
| `PrincipalAwareTypeInput.tsx` | I | Type select with product dependency check |
| `PrincipalChangeWarning.tsx` | I | Warning dialog for principal type change |
| `ParentOrganizationInput.tsx` | A | Self-referential parent org autocomplete |
| `ParentOrganizationSection.tsx` | A | Wrapper section for parent org input |
| `ProductExceptionsSection.tsx` | D | Product-level authorization overrides |
| **Badges** | | |
| `OrganizationBadges.tsx` | E | OrganizationTypeBadge, PriorityBadge, SegmentBadge |
| `OrganizationHierarchyChips.tsx` | A | HQ/Branch/Parent chips in list and card |
| `OrganizationHierarchyBreadcrumb.tsx` | A | Breadcrumb navigation for slide-over header |
| **Slide-Over** | | |
| `OrganizationSlideOver.tsx` | D | ResourceSlideOver with two-column layout |
| `slideOverTabs/index.ts` | -- | Barrel exports for slide-over tabs |
| `slideOverTabs/OrganizationRightPanel.tsx` | -- | Right panel: details (view/edit) + notes |
| `slideOverTabs/OrganizationActivitiesTab.tsx` | -- | Activities tab content |
| `slideOverTabs/OrganizationContactsTab.tsx` | -- | Contacts tab content |
| `slideOverTabs/OrganizationOpportunitiesTab.tsx` | -- | Opportunities tab content |
| `AuthorizationsTab.tsx` | D | Distributor-only authorizations tab |
| `AuthorizationCard.tsx` | D | Individual authorization display card |
| `AddPrincipalDialog.tsx` | D | Dialog to add principal authorization |
| `RemoveConfirmDialog.tsx` | D | Confirmation dialog for authorization removal |
| `AuthorizationsEmptyState.tsx` | D | Empty state for authorizations tab |
| **Inline Creation** | | |
| `QuickCreatePopover.tsx` | G | Standalone popover + RA autocomplete variants |
| `DuplicateOrgWarningDialog.tsx` | B | Blocking dialog for duplicate detection |
| `useDuplicateOrgCheck.ts` | B | Hook for hard duplicate checking |
| `AutocompleteOrganizationInput.tsx` | G | Organization autocomplete with quick-create |
| **Import/Export** | | |
| `OrganizationImportMenuItem.tsx` | C | Overflow menu item triggering import dialog |
| `OrganizationImportDialog.tsx` | C | Import wizard dialog |
| `OrganizationImportButton.tsx` | C | Legacy standalone import button |
| `OrganizationImportPreview.tsx` | C | Preview step in import pipeline |
| `OrganizationImportResult.tsx` | C | Result summary after import |
| `organizationImport.logic.ts` | C | Pure business logic (duplicate detect, transforms) |
| `useOrganizationImport.tsx` | C | Main import orchestration hook |
| `useOrganizationImportExecution.ts` | C | Batch creation execution |
| `useOrganizationImportMapper.ts` | C | Column mapping logic |
| `useOrganizationImportParser.ts` | C | CSV parsing logic |
| `useOrganizationImportPreview.ts` | C | Preview state management |
| `useOrganizationImportUpload.ts` | C | File upload handling |
| `csvConstants.ts` | C | CSV column definitions |
| `organizationColumnAliases.ts` | C | Column name aliases for import |
| **Supporting UI** | | |
| `OrganizationAside.tsx` | -- | Aside panel (used in Show view) |
| `OrganizationAvatar.tsx` | J | Avatar component for card view |
| `OrganizationTagsList.tsx` | -- | Read-only tags display |
| `OrganizationTagsListEdit.tsx` | -- | Editable tags display (slide-over edit mode) |
| `OrganizationShow.tsx` | -- | Show view |
| `OrganizationSavedQueries.tsx` | -- | Saved filter queries |
| `BranchLocationsSection.tsx` | A | Branch locations display in slide-over |
| `ContactListCells.tsx` | -- | Contact cell renderers |
| **Other** | | |
| `authorization-types.ts` | D | TypeScript types for authorizations |
| `hooks/` | -- | Organization-specific hooks directory |
