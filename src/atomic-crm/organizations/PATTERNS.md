# Organization Patterns

Standard patterns for organization management in Crispy CRM. This module handles the three-party business model: Principal → Distributor → Customer/Operator.

## Component Hierarchy

```
Organizations Module (index.tsx, resource.tsx)
├── List View (OrganizationList.tsx)
│   ├── OrganizationListFilter
│   ├── OrganizationDatagridHeader (filterable columns)
│   ├── PremiumDatagrid
│   │   └── OrganizationTypeBadge, PriorityBadge [Pattern E]
│   ├── OrganizationBulkActionsToolbar
│   │   └── BulkReassignButton [Pattern F]
│   └── OrganizationImportButton [Pattern C]
│
├── Create View (OrganizationCreate.tsx)
│   ├── OrganizationInputs
│   │   ├── OrganizationCompactForm
│   │   │   ├── OrganizationAddressSection [Pattern H]
│   │   │   ├── OrganizationStatusSection [Pattern H]
│   │   │   ├── OrganizationHierarchySection [Pattern A]
│   │   │   └── PrincipalAwareTypeInput [Pattern I]
│   │   └── useDuplicateOrgCheck [Pattern B]
│   └── DuplicateOrgWarningDialog [Pattern B]
│
├── Edit View (OrganizationEdit.tsx)
│   └── (same form structure as Create)
│
├── Slide-Over Detail (OrganizationSlideOver.tsx)
│   ├── OrganizationDetailsTab (editable)
│   ├── AuthorizationsTab [Pattern D] (distributor only)
│   ├── OrganizationContactsTab
│   ├── OrganizationOpportunitiesTab
│   └── OrganizationNotesTab
│
└── Inline Creation
    └── QuickCreatePopover [Pattern G]
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
              label="Scope"
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

Soft warning pattern that allows override instead of hard validation blocking.

```tsx
// src/atomic-crm/organizations/useDuplicateOrgCheck.ts
export function useDuplicateOrgCheck(): UseDuplicateOrgCheckResult {
  const dataProvider = useDataProvider();
  const [duplicateOrg, setDuplicateOrg] = useState<DuplicateOrgInfo | null>(null);

  // Track bypassed names (lowercase for case-insensitive comparison)
  const bypassedNamesRef = useRef<Set<string>>(new Set());

  const checkForDuplicate = useCallback(
    async (name: string, currentOrgId?: string | number) => {
      const normalizedName = name.trim().toLowerCase();

      // Check if this name was already bypassed
      if (bypassedNamesRef.current.has(normalizedName)) {
        return null;
      }

      // Search for organizations with same name (case-insensitive via ilike)
      const { data } = await dataProvider.getList<Company>("organizations", {
        filter: { "name@ilike": name.trim() },
        pagination: { page: 1, perPage: 10 },
      });

      // Filter out current record (for edit mode)
      const duplicates = data.filter((org) => String(org.id) !== String(currentOrgId));

      if (duplicates.length > 0) {
        const duplicate = { id: duplicates[0].id, name: duplicates[0].name };
        setDuplicateOrg(duplicate);
        return duplicate;
      }
      return null;
    },
    [dataProvider]
  );

  const bypassDuplicate = useCallback(() => {
    if (duplicateOrg) {
      bypassedNamesRef.current.add(duplicateOrg.name.toLowerCase());
    }
    setDuplicateOrg(null);
  }, [duplicateOrg]);

  return { checkForDuplicate, duplicateOrg, clearDuplicate, bypassDuplicate, isChecking };
}
```

### Workflow Diagram

```
User enters name → Save clicked → checkForDuplicate()
                                        ↓
                              [Duplicate found?]
                               ↓ Yes         ↓ No
                      Show warning dialog    Save record
                               ↓
              [User choice: Cancel | Proceed | View existing]
                  ↓              ↓                ↓
              Clear name   bypassDuplicate()   Navigate
                              ↓
                         Save record
```

### When to Use

- **Create forms** where duplicates are possible but shouldn't block
- **Import workflows** where users may intentionally create variants
- **Fast data entry** where validation friction hurts adoption

**Key design decision:** Soft warning allows user override. Once bypassed, same name won't trigger warning again in the session.

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
        <Button variant="outline" size="sm" onClick={() => setAddDialogOpen(true)} className="h-11">
          <Plus className="h-4 w-4 mr-1" />
          Add Principal
        </Button>
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
| operator | `tag-warm` | Clay Orange - end customer |

**Priority Variant Mapping:**

| Priority | Badge Variant | Meaning |
|----------|---------------|---------|
| A | `default` | Brand primary - high importance |
| B | `secondary` | Standard emphasis |
| C | `outline` | Routine |
| D | `outline` | Minimal (+ text-muted-foreground) |

### When to Use

- **List views** for quick visual scanning
- **Slide-over headers** for context
- **Filter chips** showing active filters

**Key design decision:** Uses `memo()` to prevent re-renders when parent changes.

---

## Pattern F: Bulk Reassign Workflow

Sequential updates with cancellation support.

```tsx
// src/atomic-crm/organizations/BulkReassignButton.tsx
export const BulkReassignButton = ({ onSuccess }: BulkReassignButtonProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { selectedIds, data: organizations, onUnselectItems } = useListContext();
  const dataProvider = useDataProvider();

  // Cleanup on unmount
  useEffect(() => {
    return () => abortControllerRef.current?.abort();
  }, []);

  const handleExecuteReassign = async () => {
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    setIsProcessing(true);
    let successCount = 0, failureCount = 0, wasCancelled = false;

    for (const id of selectedIds) {
      // Check if operation was cancelled before each update
      if (signal.aborted) {
        wasCancelled = true;
        break;
      }

      try {
        await dataProvider.update("organizations", {
          id,
          data: { sales_id: parseInt(selectedSalesId) },
          previousData: organizations?.find((org) => org.id === id),
        });
        successCount++;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          wasCancelled = true;
          break;
        }
        failureCount++;
      }
    }

    // Show results notification
    if (wasCancelled && successCount > 0) {
      notify(`Cancelled after reassigning ${successCount} organizations`, { type: "warning" });
    } else if (successCount > 0) {
      notify(`Successfully reassigned ${successCount} organizations`, { type: "success" });
    }

    refresh();
    onUnselectItems();
  };

  const handleCancelOperation = () => {
    abortControllerRef.current?.abort();
    notify("Operation cancelled", { type: "info" });
  };

  return (
    <>
      <Button onClick={handleOpenDialog} className="h-11">
        <UserPlus className="h-4 w-4" /> Reassign
      </Button>
      <Dialog>
        {/* Preview, selector, and action buttons */}
        {isProcessing && (
          <Button variant="destructive" onClick={handleCancelOperation}>
            Cancel Operation
          </Button>
        )}
      </Dialog>
    </>
  );
};
```

### When to Use

- **Reassigning owner** for multiple organizations
- **Bulk status changes** requiring user confirmation
- **Any multi-record update** where partial success is acceptable

**Key design decision:** AbortController enables mid-operation cancellation with partial success reporting.

---

## Pattern G: Quick Create Popover

Lightweight inline creation with two paths.

```tsx
// src/atomic-crm/organizations/QuickCreatePopover.tsx
const quickCreateSchema = z.object({
  name: z.string().trim().min(1).max(255),
  organization_type: z.enum(["customer", "prospect", "principal", "distributor"]),
  priority: z.enum(["A", "B", "C", "D"]).default("C"),
  city: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
});

export function QuickCreatePopover({ name, organizationType, onCreated, onCancel, children }) {
  const methods = useForm<QuickCreateInput>({
    resolver: zodResolver(quickCreateSchema),
    defaultValues: { name, organization_type: organizationType, priority: "C" },
  });

  // Full form submission
  const handleSubmit = methods.handleSubmit(async (data) => {
    const result = await dataProvider.create("organizations", {
      data: { ...data, segment_id: PLAYBOOK_CATEGORY_IDS.Unknown },
    });
    onCreated(result.data);
  });

  // Fast path - just the name
  const handleQuickCreate = async () => {
    const result = await dataProvider.create("organizations", {
      data: {
        name,
        organization_type: organizationType,
        priority: "C",
        segment_id: PLAYBOOK_CATEGORY_IDS.Unknown,
      },
    });
    onCreated(result.data);
  };

  return (
    <Popover open={open}>
      <PopoverContent className="w-80 p-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Name, Type, Priority, City, State fields */}
          <div className="flex justify-between pt-2">
            <Button type="button" variant="ghost" onClick={handleQuickCreate}>
              Just use name
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
              <Button type="submit">Create</Button>
            </div>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}
```

### Two Creation Paths

| Path | Button | Fields Used | Use Case |
|------|--------|-------------|----------|
| Fast | "Just use name" | name, type, priority (default C) | Quick data entry, will edit later |
| Full | "Create" | All form fields | Complete record with details |

### When to Use

- **Autocomplete "not found"** scenarios
- **Reference field quick-add** without leaving form
- **Data import follow-up** for missing references

**Key design decision:** Two buttons serve different user intents - speed vs completeness.

---

## Pattern H: Status & Address Sections

Reusable form sections with consistent layout. Each section is in its own well-named file for maintainability:
- `OrganizationStatusSection.tsx` - Status and payment fields
- `OrganizationAddressSection.tsx` - Shipping address fields

```tsx
// src/atomic-crm/organizations/OrganizationStatusSection.tsx
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
          <FormFieldWrapper name="shipping_postal_code">
            <TextInput source="shipping_postal_code" label="ZIP Code" helperText={false} />
          </FormFieldWrapper>
        </CompactFormRow>
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

## Pattern Comparison Tables

### Bulk Reassign vs Individual Edit

| Aspect | Bulk Reassign | Individual Edit |
|--------|---------------|-----------------|
| **Scope** | Multiple records | Single record |
| **Cancellation** | AbortController mid-operation | Browser back/cancel button |
| **Partial success** | Yes, with counts | N/A (all or nothing) |
| **Audit trail** | DB triggers (automatic) | DB triggers (automatic) |
| **Use case** | Territory reorganization | Normal editing |

### Quick Create vs Full Create Form

| Aspect | Quick Create Popover | Full Create Form |
|--------|---------------------|------------------|
| **Fields** | 5 essential fields | All organization fields |
| **Navigation** | Stays on current page | New page/route |
| **Duplicate check** | No | Yes (Pattern B) |
| **Use case** | Reference field quick-add | Primary data entry |

### Soft Warning vs Hard Validation

| Aspect | Soft Warning (Pattern B) | Hard Validation |
|--------|-------------------------|-----------------|
| **User experience** | Can override with confirmation | Must fix before save |
| **Implementation** | Dialog + bypass tracking | Zod schema rejection |
| **Use case** | Possible duplicates | Required fields, format errors |
| **Data quality** | Relies on user judgment | Enforced by system |

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

### 5. Batch API Without Cancellation

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

1. [ ] Add new scope choice to `ORG_SCOPE_CHOICES`
2. [ ] Update `OrganizationHierarchySection` UI if needed
3. [ ] Verify parent/child queries handle new scope
4. [ ] Update import logic (Pattern C) for new field
5. [ ] Document parent-child relationship rules

### Adding a New Bulk Action

1. [ ] Follow Pattern F structure (AbortController, partial success)
2. [ ] Add button to `OrganizationBulkActionsToolbar`
3. [ ] Include preview of affected records
4. [ ] Add confirmation dialog
5. [ ] Add cancellation support
6. [ ] Test partial failure scenarios
