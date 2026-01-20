# Contact Patterns

Standard patterns for contact management in Crispy CRM, including CSV import, form handling, entity linking, and visual indicators.

## Component Hierarchy

```
ContactImportDialog (orchestrates import flow)
    |
useImportWizard (state machine) <------ useColumnMapping (field mapping)
    |                                        |
contactImport.logic.ts (validation) <-- columnAliases.ts (600+ aliases)
    |
csvProcessor.ts (CSV parsing + sanitization)

ContactCreate / ContactEdit (form containers)
    |
ContactCompactForm (smart defaults + email parsing)
    |
contactBaseSchema (Zod validation)

ContactSlideOver (detail panel)
    |
+-- ContactDetailsTab (view/edit mode)
+-- ActivitiesTab (timeline + quick-log)
+-- OpportunitiesTab (junction table + suggestions)
+-- TagsListEdit (editable tags)

Badge System
+-- ContactStatusBadge (cold/warm/hot/in-contract)
+-- RoleBadge (BANT/MEDDIC roles)
+-- InfluenceBadge (numeric -> semantic)
```

---

## Pattern A: Import/Export Pipeline

Pure business logic for CSV contact import with data quality checks and security sanitization.

**When to use**: Bulk importing contacts from external sources (CSV files, spreadsheet exports).

### Data Flow

```
CSV File
    |
csvUploadValidator -> validationErrors, warnings
    |
PapaParse -> rawHeaders[], rawDataRows[][]
    |
useColumnMapping.setRawData()
    +-- mapHeadersToFields() -> auto-detected mappings
    +-- userOverrides Map -> manual overrides (precedence)
    +-- processCsvDataWithMappings() -> ContactImportSchema[]
    |
PREVIEW: Data Quality Checks
    +-- isOrganizationOnlyEntry() -> org without contact person
    +-- isContactWithoutContactInfo() -> contact without email/phone
    |
applyDataQualityTransformations() -> transformed contacts
    |
validateTransformedContacts() -> Zod validation
    +-- successful[] (ready for import)
    +-- failed[] (detailed errors with row/field)
    |
IMPORT: Batch processing with progress tracking
```

### Data Quality Predicates

```tsx
// src/atomic-crm/contacts/contactImport.logic.ts

export function isOrganizationOnlyEntry(contact: Partial<ContactImportSchema>): boolean {
  const hasOrgName = contact.organization_name && String(contact.organization_name).trim();
  const hasFirstName = contact.first_name && String(contact.first_name).trim();
  const hasLastName = contact.last_name && String(contact.last_name).trim();

  return !!(hasOrgName && !hasFirstName && !hasLastName);
}

export function isContactWithoutContactInfo(contact: Partial<ContactImportSchema>): boolean {
  const hasFirstName = contact.first_name && String(contact.first_name).trim();
  const hasLastName = contact.last_name && String(contact.last_name).trim();
  const hasName = hasFirstName || hasLastName;

  const hasEmail =
    (contact.email_work && String(contact.email_work).trim()) ||
    (contact.email_home && String(contact.email_home).trim()) ||
    (contact.email_other && String(contact.email_other).trim());

  const hasPhone =
    (contact.phone_work && String(contact.phone_work).trim()) ||
    (contact.phone_home && String(contact.phone_home).trim()) ||
    (contact.phone_other && String(contact.phone_other).trim());

  return !!(hasName && !hasEmail && !hasPhone);
}
```

### Data Quality Transformations

```tsx
// src/atomic-crm/contacts/contactImport.logic.ts

export function applyDataQualityTransformations(
  contacts: ContactImportSchema[],
  decisions: DataQualityDecisions = {
    importOrganizationsWithoutContacts: false,
    importContactsWithoutContactInfo: false,
  }
) {
  const autoFilledContacts = new Set<number>();

  const transformedContacts = contacts.map((contact, index) => {
    const transformed = { ...contact };

    // Auto-fill placeholder contact for organization-only entries
    if (isOrganizationOnlyEntry(transformed) && decisions.importOrganizationsWithoutContacts) {
      transformed.first_name = "General";
      transformed.last_name = "Contact";
      autoFilledContacts.add(index);
    }

    return transformed;
  });

  return {
    transformedContacts,
    autoFilledCount: autoFilledContacts.size,
    wasAutoFilled: (index: number) => autoFilledContacts.has(index),
  };
}
```

### Zod Validation with Error Collection

```tsx
// src/atomic-crm/contacts/contactImport.logic.ts

export function validateTransformedContacts(contacts: ContactImportSchema[]) {
  const validationResults = contacts.map((contact, index) => {
    const result = importContactSchema.safeParse(contact);
    return {
      index,
      contact,
      success: result.success,
      error: result.success ? null : result.error,
    };
  });

  const successful = validationResults
    .filter((r) => r.success)
    .map((r) => ({ ...r.contact, originalIndex: r.index }));

  const failed = validationResults
    .filter((r) => !r.success)
    .map((r) => ({
      originalIndex: r.index,
      data: r.contact,
      errors: r.error!.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    }));

  return { successful, failed };
}
```

**Key points:**
- Pure functions with no side effects - easy to test
- Data quality checks are separate from validation - user can decide what to import
- Errors include row numbers and field paths - actionable feedback

**Example:** `src/atomic-crm/contacts/contactImport.logic.ts`

---

## Pattern B: Contact Form Defaults

Smart defaults derived from Zod schema with sales context awareness.

**When to use**: Creating/editing contacts with sensible defaults and auto-population.

### Schema-Driven Defaults

```tsx
// src/atomic-crm/contacts/ContactCreate.tsx

import { contactBaseSchema } from "../validation/contacts";

// Generate defaults from schema truth
// Per Engineering Constitution #5: FORM STATE DERIVED FROM TRUTH
const formDefaults = {
  ...contactBaseSchema.partial().parse({}),
  sales_id: defaults.sales_id,  // Smart default: current user's sales_id
};

return (
  <CreateBase redirect="list">
    <Form defaultValues={formDefaults} mode="onBlur">
      <ContactInputs />
    </Form>
  </CreateBase>
);
```

### Smart Email-to-Name Parsing

```tsx
// src/atomic-crm/contacts/ContactCompactForm.tsx

const handleEmailChange = (email: string) => {
  const { first_name, last_name } = getValues();
  // Only auto-fill if name fields are empty
  if (first_name || last_name || !email) return;

  // Extract name from email: john.doe@company.com -> John Doe
  const [first, last] = email.split("@")[0].split(".");
  setValue("first_name", first.charAt(0).toUpperCase() + first.slice(1));
  setValue("last_name", last ? last.charAt(0).toUpperCase() + last.slice(1) : "");
};

const handleEmailPaste: React.ClipboardEventHandler<...> = (e) => {
  const email = e.clipboardData?.getData("text/plain");
  handleEmailChange(email);
};

const handleEmailBlur = (e: React.FocusEvent<...>) => {
  const email = e.target.value;
  handleEmailChange(email);
};
```

### Array Fields with Type Selection

```tsx
// src/atomic-crm/contacts/ContactCompactForm.tsx

<ArrayInput source="email" label="Email addresses *" helperText="At least one email required">
  <SimpleFormIterator inline disableReordering disableClear>
    <TextInput
      source="value"
      placeholder="name@company.com"
      onPaste={handleEmailPaste}
      onBlur={handleEmailBlur}
    />
    <SelectInput
      source="type"
      choices={[{ id: "work" }, { id: "home" }, { id: "other" }]}
      defaultValue="work"
    />
  </SimpleFormIterator>
</ArrayInput>
```

**Key points:**
- `contactBaseSchema.partial().parse({})` generates safe defaults from schema
- `mode="onBlur"` prevents re-render storms (never use `onChange`)
- Auto-population respects existing user input (only fills empty fields)
- JSONB arrays for email/phone with typed entries

**Example:** `src/atomic-crm/contacts/ContactCreate.tsx`, `ContactCompactForm.tsx`

---

## Pattern C: Contact Linking

Modal dialogs for creating junction table records between contacts and opportunities/organizations.

**When to use**: Associating contacts with opportunities or organizations via junction tables.

### Modal Props Interface

```tsx
// src/atomic-crm/contacts/LinkOpportunityModal.tsx

interface LinkOpportunityModalProps {
  open: boolean;
  contactName: string;
  contactId: number;
  linkedOpportunityIds: number[];  // For duplicate detection
  onClose: () => void;
  onSuccess: () => void;
}
```

### Junction Table Create with Duplicate Prevention

```tsx
// src/atomic-crm/contacts/LinkOpportunityModal.tsx

export function LinkOpportunityModal({
  open,
  contactName,
  contactId,
  linkedOpportunityIds,
  onClose,
  onSuccess,
}: LinkOpportunityModalProps) {
  const [create, { isLoading }] = useCreate();
  const notify = useNotify();

  const handleLink = async (data: LinkOpportunityFormData) => {
    if (!data.opportunity_id) return;

    // Prevent duplicates before API call
    if (linkedOpportunityIds.includes(data.opportunity_id)) {
      notify("This contact is already linked to that opportunity", {
        type: "warning",
      });
      return;
    }

    try {
      await create(
        "opportunity_contacts",  // Junction table
        {
          data: {
            opportunity_id: data.opportunity_id,
            contact_id: contactId,
          },
        },
        {
          onSuccess: () => {
            notify("Opportunity linked successfully", { type: "success" });
            onSuccess();
            onClose();
          },
          onError: (error: unknown) => {
            const errorMessage = error instanceof Error ? error.message : "Failed to link opportunity";
            notify(errorMessage, { type: "error" });
          },
        }
      );
    } catch {
      notify("Failed to link opportunity. Please try again.", { type: "error" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Link Opportunity to {contactName}</DialogTitle>
          <DialogDescription>
            Search for an opportunity to associate with this contact.
          </DialogDescription>
        </DialogHeader>

        <Form onSubmit={handleLink} className="space-y-4">
          <ReferenceInput source="opportunity_id" reference="opportunities">
            <AutocompleteInput
              filterToQuery={(searchText: string) => ({ name: searchText })}
              optionText={(opp: Opportunity) =>
                opp ? `${opp.name} - ${opp.customer_organization_name || ""} (${opp.stage})` : ""
              }
              label="Search opportunities"
            />
          </ReferenceInput>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Linking..." : "Link Opportunity"}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

### Three-Step Junction Fetch (OpportunitiesTab)

```tsx
// src/atomic-crm/contacts/OpportunitiesTab.tsx

// Step 1: Fetch junction records
const { data: junctionRecords } = useGetList(
  "opportunity_contacts",
  { filter: { contact_id: contact?.id }, pagination: { page: 1, perPage: 100 } }
);

// Step 2: Extract opportunity IDs
const opportunityIds = junctionRecords?.map((jr) => jr.opportunity_id) || [];

// Step 3: Fetch opportunity details by IDs
const { data: opportunities } = useGetMany(
  "opportunities",
  { ids: opportunityIds },
  { enabled: opportunityIds.length > 0 }
);
```

**Key points:**
- Pass `linkedOpportunityIds` to prevent duplicate links client-side
- Context-aware messaging shows contact name in title
- Three-step fetch pattern for junction tables: junctions -> IDs -> details
- `useGetMany` only fetches when IDs are available

**Example:** `src/atomic-crm/contacts/LinkOpportunityModal.tsx`, `OpportunitiesTab.tsx`

---

## Pattern D: Field Mapping Hook

Two-layer mapping strategy for CSV column-to-field alignment with user overrides.

**When to use**: Mapping arbitrary CSV headers to canonical CRM field names with user customization.

### Hook Interface

```tsx
// src/atomic-crm/contacts/useColumnMapping.ts

export interface UseColumnMappingReturn {
  /** Final mappings (auto-detected merged with user overrides) */
  mappings: Record<string, string | null>;

  /** User's manual overrides (exposed for UI "Custom" badge display) */
  overrides: ReadonlyMap<string, string | null>;

  /** Contacts with current mappings applied - SOURCE OF TRUTH for import */
  contacts: ContactImportSchema[];

  /** Raw headers from CSV (for preview UI) */
  headers: string[];

  /** Set or clear a single column override */
  setOverride: (csvHeader: string, targetField: string | null) => void;

  /** Initialize with parsed CSV data */
  setRawData: (headers: string[], rows: unknown[][]) => void;

  /** Reset all state */
  reset: () => void;

  /** True if data has been loaded */
  hasData: boolean;
}
```

### Two-Layer Mapping Strategy

```tsx
// src/atomic-crm/contacts/useColumnMapping.ts

export function useColumnMapping(): UseColumnMappingReturn {
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawDataRows, setRawDataRows] = useState<unknown[][]>([]);
  const [userOverrides, setUserOverrides] = useState<Map<string, string | null>>(new Map());
  const prevHeadersRef = useRef<string[]>([]);

  // Reset overrides when headers change (new file selected)
  useEffect(() => {
    const headersChanged =
      rawHeaders.length > 0 &&
      (prevHeadersRef.current.length !== rawHeaders.length ||
        !rawHeaders.every((h, i) => h === prevHeadersRef.current[i]));

    if (headersChanged) {
      setUserOverrides(new Map());
      prevHeadersRef.current = rawHeaders;
    }
  }, [rawHeaders]);

  // Derive final mappings: user overrides take precedence over auto-detection
  const mappings = useMemo<Record<string, string | null>>(() => {
    if (rawHeaders.length === 0) return {};

    const autoMappings = mapHeadersToFields(rawHeaders);
    const finalMappings: Record<string, string | null> = {};

    rawHeaders.forEach((header) => {
      // Priority: User override > Auto-detection
      finalMappings[header] = userOverrides.get(header) ?? autoMappings[header];
    });

    return finalMappings;
  }, [rawHeaders, userOverrides]);

  // SOURCE OF TRUTH: Process raw data with current mappings
  const contacts = useMemo<ContactImportSchema[]>(() => {
    if (!rawHeaders.length || !rawDataRows.length) return [];
    return processCsvDataWithMappings(rawHeaders, rawDataRows, mappings);
  }, [rawHeaders, rawDataRows, mappings]);

  // Set or clear single override
  const setOverride = useCallback((csvHeader: string, targetField: string | null) => {
    setUserOverrides((prev) => {
      const next = new Map(prev);
      if (targetField === null || targetField === "") {
        next.delete(csvHeader); // Revert to auto-detection
      } else {
        next.set(csvHeader, targetField);
      }
      return next;
    });
  }, []);

  return { mappings, overrides: userOverrides, contacts, headers: rawHeaders, setOverride, ... };
}
```

### Header Normalization (columnAliases.ts)

```tsx
// src/atomic-crm/contacts/columnAliases.ts

export function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s_-]/g, " ")  // Remove special chars
    .replace(/\s+/g, " ")             // Collapse spaces
    .trim();
}

// Pre-computed reverse map: normalized alias -> canonical field
const NORMALIZED_ALIAS_MAP: Map<string, string> = new Map();
for (const [fieldName, aliases] of Object.entries(COLUMN_ALIASES)) {
  for (const alias of aliases) {
    const normalized = normalizeHeader(alias);
    if (normalized && !NORMALIZED_ALIAS_MAP.has(normalized)) {
      NORMALIZED_ALIAS_MAP.set(normalized, fieldName);
    }
  }
}
```

**Key points:**
- `contacts` array is the source of truth - derived from mappings, not re-parsed
- User overrides stored in a Map, take precedence over auto-detection
- Clearing an override (setting to null) reverts to auto-detection
- 600+ aliases handle real-world CSV header variations

**Example:** `src/atomic-crm/contacts/useColumnMapping.ts`, `columnAliases.ts`

---

## Pattern E: Contact Tags System

Editable tag lists with inline creation and semantic color mapping.

**When to use**: Managing contact categorization with custom tags.

### TagsListEdit Component

```tsx
// src/atomic-crm/contacts/TagsListEdit.tsx

export const TagsListEdit = () => {
  const record = useRecordContext<Contact>();
  const [open, setOpen] = useState(false);

  const { data: allTags } = useGetList<Tag>("tags", {
    pagination: { page: 1, perPage: 10 },
    sort: { field: "name", order: "ASC" },
  });
  const { data: tags } = useGetMany<Tag>(
    "tags",
    { ids: record?.tags },
    { enabled: record?.tags?.length > 0 }
  );
  const [update] = useUpdate<Contact>();

  const unselectedTags = allTags?.filter((tag) => !record?.tags?.includes(tag.id));

  const handleTagAdd = (id: Identifier) => {
    if (!record) throw new Error("No contact record found");
    const tags = [...record.tags, id];
    update("contacts", {
      id: record.id,
      data: { tags },  // Only send tags field (partial update)
      previousData: record,
    });
  };

  const handleTagDelete = async (id: Identifier) => {
    if (!record) throw new Error("No contact record found");
    const tags = record.tags.filter((tagId) => tagId !== id);
    await update("contacts", {
      id: record.id,
      data: { tags },
      previousData: record,
    });
  };

  const handleTagCreated = React.useCallback(async (tag: Tag) => {
    if (!record) throw new Error("No contact record found");
    await update("contacts", {
      id: record.id,
      data: { tags: [...record.tags, tag.id] },
      previousData: record,
    });
  }, [update, record]);

  return (
    <div className="flex flex-wrap gap-2">
      {tags?.map((tag) => (
        <TagChip key={tag.id} tag={tag} onUnlink={() => handleTagDelete(tag.id)} />
      ))}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-11 px-3">
            <Plus className="h-4 w-4 mr-1" />
            Add tag
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {unselectedTags?.map((tag) => (
            <DropdownMenuItem key={tag.id} onClick={() => handleTagAdd(tag.id)}>
              <Badge className={cn("text-xs font-normal", getTagColorClass(tag.color))}>
                {tag.name}
              </Badge>
            </DropdownMenuItem>
          ))}
          <DropdownMenuItem onClick={() => setOpen(true)}>
            <Edit className="h-3 w-3 mr-2" />
            Create new tag
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <TagCreateModal open={open} onClose={() => setOpen(false)} onSuccess={handleTagCreated} />
    </div>
  );
};
```

### Semantic Color Mapping

```tsx
// src/atomic-crm/tags/tag-colors.ts

export function getTagColorClass(color: string): string {
  const semanticColor = SEMANTIC_COLORS[color as TagColorName];
  if (semanticColor) {
    return semanticColor.cssClass;
  }
  return SEMANTIC_COLORS.gray.cssClass;  // Fallback
}

export function normalizeColorToSemantic(color: string): TagColorName {
  if (VALID_TAG_COLORS.includes(color as TagColorName)) {
    return color as TagColorName;
  }
  return "gray";
}
```

**Key points:**
- Partial updates: only send `{ tags }` field, not entire record
- Dropdown shows unselected tags only (filtered from allTags)
- Create modal allows inline tag creation with auto-link
- 44px touch targets (`h-11`) for iPad accessibility

**Example:** `src/atomic-crm/contacts/TagsListEdit.tsx`, `src/atomic-crm/tags/tag-colors.ts`

---

## Pattern F: Activity Tab Integration

Activity timeline with quick-log dialog for contact slide-overs.

**When to use**: Displaying and logging activities for a specific contact.

### ActivitiesTab Component

```tsx
// src/atomic-crm/contacts/ActivitiesTab.tsx

interface ActivitiesTabProps {
  contactId: string | number;
}

export const ActivitiesTab = ({ contactId }: ActivitiesTabProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch activities for this contact
  const { data, isPending, error, refetch } = useGetList<ActivityRecord>("activities", {
    filter: { contact_id: contactId },
    sort: { field: "created_at", order: "DESC" },
    pagination: { page: 1, perPage: ACTIVITY_PAGE_SIZE },
  });

  const numericContactId = typeof contactId === "string" ? parseInt(contactId, 10) : contactId;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3>Activities</h3>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Log Activity
        </Button>
      </div>

      {isPending ? (
        <LoadingSkeleton />
      ) : activities.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No activities recorded yet
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <ActivityTimelineEntry key={activity.id} activity={activity} />
          ))}
        </div>
      )}

      <QuickLogActivityDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        entityContext={{ contactId: numericContactId }}
        config={{
          enableDraftPersistence: false,  // No drafts in slide-over
          showSaveAndNew: false,
        }}
        onSuccess={() => refetch()}  // Refresh timeline
      />
    </div>
  );
};
```

**Key points:**
- `useGetList` with contact filter retrieves only relevant activities
- `refetch()` on dialog success keeps timeline current
- `entityContext` pre-populates contact in the activity form
- Disable draft persistence in slide-over context (ephemeral UI)

**Example:** `src/atomic-crm/contacts/ActivitiesTab.tsx`

---

## Pattern G: Contact Badges

Visual indicators for status, role, and influence with semantic colors.

**When to use**: Displaying contact metadata in lists, detail views, and filters.

### ContactStatusBadge

```tsx
// src/atomic-crm/contacts/ContactBadges.tsx

export type ContactStatus = "cold" | "warm" | "hot" | "in-contract";

export const ContactStatusBadge = memo(function ContactStatusBadge({ status }: ContactStatusBadgeProps) {
  if (!status) {
    return <Badge className="text-xs px-2 py-1 tag-gray">--</Badge>;
  }

  const config: Record<string, { label: string; className: string }> = {
    cold: { label: "Cold", className: "tag-blue" },      // Dormant
    warm: { label: "Warm", className: "tag-amber" },     // Engaged
    hot: { label: "Hot", className: "tag-pink" },        // Ready to buy
    "in-contract": { label: "Contract", className: "tag-sage" },  // Closed
  };

  const { label, className } = config[status] || {
    label: status.charAt(0).toUpperCase() + status.slice(1),
    className: "tag-gray",
  };

  return <Badge className={`text-xs px-2 py-1 ${className}`}>{label}</Badge>;
});
```

### RoleBadge (BANT/MEDDIC Roles)

```tsx
// src/atomic-crm/contacts/ContactBadges.tsx

export type ContactRole =
  | "decision_maker"  // Has authority to approve
  | "influencer"      // Technical evaluator
  | "buyer"           // Procurement handler
  | "end_user"        // Day-to-day user
  | "gatekeeper"      // Controls access to decision makers
  | "champion"        // Internal advocate
  | "technical"       // Technical evaluator/implementer
  | "executive";      // C-level with budget authority

export const RoleBadge = memo(function RoleBadge({ role }: RoleBadgeProps) {
  const config: Record<string, { label: string; className: string }> = {
    executive: { label: "Executive", className: "tag-purple" },
    decision_maker: { label: "Decision Maker", className: "tag-purple" },
    champion: { label: "Champion", className: "tag-teal" },
    influencer: { label: "Influencer", className: "tag-warm" },
    technical: { label: "Technical", className: "tag-blue" },
    buyer: { label: "Buyer", className: "tag-sage" },
    gatekeeper: { label: "Gatekeeper", className: "tag-amber" },
    end_user: { label: "End User", className: "tag-gray" },
  };

  const { label, className } = config[role] || {
    label: role.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
    className: "tag-gray",
  };

  return <Badge className={`text-xs px-2 py-1 ${className}`}>{label}</Badge>;
});
```

### InfluenceBadge (Numeric to Semantic Conversion)

```tsx
// src/atomic-crm/contacts/ContactBadges.tsx

export type InfluenceLevel = "critical" | "high" | "medium" | "low" | "minimal";

export const InfluenceBadge = memo(function InfluenceBadge({ influence }: InfluenceBadgeProps) {
  // Convert numeric score (1-5) to semantic level
  const normalizedInfluence = typeof influence === "number" ? numericToLevel(influence) : influence;

  const config: Record<string, { label: string; variant: BadgeVariant }> = {
    critical: { label: "Critical", variant: "destructive" },  // Red
    high: { label: "High", variant: "default" },              // Green
    medium: { label: "Medium", variant: "secondary" },         // Muted
    low: { label: "Low", variant: "outline" },
    minimal: { label: "Minimal", variant: "outline" },
  };

  const { label, variant } = config[normalizedInfluence] || {
    label: typeof influence === "number" ? `Level ${influence}` : influence,
    variant: "outline",
  };

  return <Badge variant={variant} className="text-xs px-2 py-1">{label}</Badge>;
});

function numericToLevel(score: number): InfluenceLevel {
  if (score >= 5) return "critical";
  if (score >= 4) return "high";
  if (score >= 3) return "medium";
  if (score >= 2) return "low";
  return "minimal";
}
```

### Composite Badge Group

```tsx
// src/atomic-crm/contacts/ContactBadges.tsx

export function ContactBadgeGroup({ status, role, influence, direction = "horizontal" }: ContactBadgeGroupProps) {
  const gapClass = direction === "horizontal" ? "flex-row gap-2" : "flex-col gap-1";

  return (
    <div className={`flex flex-wrap ${gapClass}`}>
      {status && <ContactStatusBadge status={status} />}
      {role && <RoleBadge role={role} />}
      {influence !== undefined && <InfluenceBadge influence={influence} />}
    </div>
  );
}
```

**Key points:**
- `memo()` prevents unnecessary re-renders in list views
- Graceful fallbacks for unknown values (gray badge with formatted label)
- Numeric-to-semantic conversion for database smallint fields
- Semantic tag colors from MFB Garden to Table theme

**Example:** `src/atomic-crm/contacts/ContactBadges.tsx`

---

## Pattern H: Import Wizard State

Discriminated union state machine for multi-step CSV import flow.

**When to use**: Managing complex multi-step workflows with explicit state transitions.

### State Flow Diagram

```
IDLE -> FILE_SELECTED -> PARSING -> PREVIEW -> IMPORTING -> COMPLETE
                            |          |           |
                          ERROR      IDLE       ERROR
```

### Discriminated Union Types

```tsx
// src/atomic-crm/contacts/useImportWizard.types.ts

// Each state carries only its relevant data
export interface WizardStateIdle { step: "idle"; }
export interface WizardStateFileSelected {
  step: "file_selected";
  file: File;
  validationErrors: CsvValidationError[];
  validationWarnings: string[];
}
export interface WizardStateParsing { step: "parsing"; file: File; }
export interface WizardStatePreview {
  step: "preview";
  file: File;
  previewData: PreviewData;
  dataQualityDecisions: DataQualityDecisions;
}
export interface WizardStateImporting {
  step: "importing";
  file: File;
  progress: ImportProgress;
  accumulated: AccumulatedResult;
  rowOffset: number;
}
export interface WizardStateComplete { step: "complete"; result: ImportResult; }
export interface WizardStateError { step: "error"; error: Error; previousStep: string; }

export type WizardState =
  | WizardStateIdle
  | WizardStateFileSelected
  | WizardStateParsing
  | WizardStatePreview
  | WizardStateImporting
  | WizardStateComplete
  | WizardStateError;
```

### Pure Reducer with Exhaustive Handling

```tsx
// src/atomic-crm/contacts/useImportWizard.ts

export function importWizardReducer(state: WizardState, action: WizardAction): WizardState {
  // Handle RESET action from any state
  if (action.type === "RESET") {
    return createInitialState();
  }

  // Dispatch to state-specific handlers
  switch (state.step) {
    case "idle":
      return reduceIdleState(state, action);
    case "file_selected":
      return reduceFileSelectedState(state, action);
    case "parsing":
      return reduceParsingState(state, action);
    case "preview":
      return reducePreviewState(state, action);
    case "importing":
      return reduceImportingState(state, action);
    case "complete":
    case "error":
      return state; // Terminal states
    default:
      return assertNever(state); // TypeScript exhaustiveness check
  }
}
```

### State-Specific Reducer Example

```tsx
// src/atomic-crm/contacts/useImportWizard.ts

function reduceIdleState(state: WizardStateIdle, action: WizardAction): WizardState {
  switch (action.type) {
    case "SELECT_FILE":
      return {
        step: "file_selected",
        file: action.payload.file,
        validationErrors: action.payload.validationErrors,
        validationWarnings: action.payload.validationWarnings,
      };

    default:
      // Invalid action for this state - return unchanged
      return state;
  }
}
```

### Hook with AbortController

```tsx
// src/atomic-crm/contacts/useImportWizard.ts

export function useImportWizard() {
  const [state, dispatch] = useReducer(importWizardReducer, undefined, createInitialState);
  const abortControllerRef = useRef<AbortController | null>(null);

  const createAbortController = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    return abortControllerRef.current;
  }, []);

  const actions = useMemo(() => {
    const baseActions = createWizardActions(dispatch);
    return {
      ...baseActions,
      startParsing: () => {
        createAbortController();
        baseActions.startParsing();
      },
      startImport: (totalContacts: number) => {
        createAbortController();
        baseActions.startImport(totalContacts);
      },
      cancel: () => {
        abortCurrentOperation();
        baseActions.cancel();
      },
    };
  }, [createAbortController]);

  const flags = useMemo(() => deriveWizardFlags(state), [state]);

  return { state, actions, flags, abortSignal: getAbortSignal(), isAborted: () => ... };
}
```

**Key points:**
- Discriminated unions make illegal state combinations impossible at compile time
- Invalid transitions return unchanged state (same reference)
- `assertNever()` ensures TypeScript exhaustiveness checking
- AbortController enables safe cancellation of async operations

**Example:** `src/atomic-crm/contacts/useImportWizard.ts`, `useImportWizard.types.ts`

---

## Pattern Comparison Tables

### Form vs Import Validation

| Aspect | Form Validation | Import Validation |
|--------|-----------------|-------------------|
| **Schema** | `createContactSchema` (strict) | `importContactSchema` (flexible) |
| **Required Fields** | first_name, last_name, sales_id, org_id, email | Minimal (org_name) |
| **Mode** | `onBlur` | Batch (all at once) |
| **Error Display** | Inline field errors | Table with row numbers |
| **Data Source** | User input | CSV file |

### State Management Patterns

| Pattern | Hook | State Type | Use Case |
|---------|------|-----------|----------|
| **Import Wizard** | `useImportWizard` | Discriminated union | Multi-step flows |
| **Column Mapping** | `useColumnMapping` | Derived state | Header-to-field mapping |
| **Tag Management** | `useUpdate` | React Admin | CRUD on junction data |
| **Activity Logging** | `useGetList` + dialog | Fetch + modal | Timeline + quick-add |

### Badge Components

| Badge | Data Type | Color System | Fallback |
|-------|-----------|--------------|----------|
| **ContactStatusBadge** | string | tag-* classes | tag-gray |
| **RoleBadge** | string enum | tag-* classes | tag-gray + title case |
| **InfluenceBadge** | number (1-5) or string | Badge variants | outline + "Level N" |

---

## Anti-Patterns

### 1. Direct Supabase in Components

```tsx
// WRONG: Direct database access
import { supabase } from "@/lib/supabase";
const { data } = await supabase.from("contacts").select("*");

// CORRECT: Use data provider
import { useGetList } from "react-admin";
const { data } = useGetList("contacts", { ... });
```

### 2. Form-Level Validation

```tsx
// WRONG: Validate in form component
const validate = (values) => {
  const errors = {};
  if (!values.email) errors.email = "Required";
  return errors;
};

// CORRECT: Zod at API boundary only
// Validation happens in unifiedDataProvider.ts via contactBaseSchema
```

### 3. Watch Instead of UseWatch

```tsx
// WRONG: Re-renders entire form on every change
const values = watch();

// CORRECT: Isolated re-renders
const orgId = useWatch({ name: "organization_id" });
```

### 4. onChange Form Mode

```tsx
// WRONG: Re-render storm
<Form mode="onChange">

// CORRECT: Validate on blur or submit
<Form mode="onBlur">
```

### 5. Mutable State in Reducer

```tsx
// WRONG: Mutating state
function reducer(state, action) {
  state.step = "preview";  // Mutation!
  return state;
}

// CORRECT: Return new object
function reducer(state, action) {
  return { ...state, step: "preview" };
}
```

### 6. Missing Exhaustiveness Check

```tsx
// WRONG: Can miss new states
switch (state.step) {
  case "idle": ...
  case "preview": ...
  // What if "importing" is added later?
}

// CORRECT: TypeScript catches missing cases
default:
  return assertNever(state);
```

### 7. Hardcoded Colors

```tsx
// WRONG: Hardcoded hex values
<Badge className="bg-[#ef4444] text-white">Hot</Badge>

// CORRECT: Use semantic tag classes
<Badge className="tag-pink">Hot</Badge>
```

### 8. useEffect for Derived Data

```tsx
// WRONG: useEffect for derived state
const [contacts, setContacts] = useState([]);
useEffect(() => {
  setContacts(processCsvDataWithMappings(headers, rows, mappings));
}, [headers, rows, mappings]);

// CORRECT: useMemo for derived data
const contacts = useMemo(
  () => processCsvDataWithMappings(headers, rows, mappings),
  [headers, rows, mappings]
);
```

---

## Migration Checklist

When adding new contact features:

### Adding a New Contact Field

- [ ] Add field to `contactBaseSchema` in `src/atomic-crm/validation/contacts.ts`
- [ ] Add column alias mappings in `src/atomic-crm/contacts/columnAliases.ts`
- [ ] Add to `ContactImportSchema` type if importable
- [ ] Add database migration in `supabase/migrations/`
- [ ] Add form input in `ContactCompactForm.tsx`
- [ ] Add display in `ContactDetailsTab.tsx`
- [ ] Verify with `npx tsc --noEmit`
- [ ] Test import with CSV containing new field

### Adding a New Import Data Quality Check

- [ ] Add predicate function in `contactImport.logic.ts`
- [ ] Add decision flag to `DataQualityDecisions` type
- [ ] Add transformation logic if needed
- [ ] Add UI control in preview step
- [ ] Add test cases for predicate
- [ ] Document in this PATTERNS.md file

### Adding a New Badge Type

- [ ] Add type definition in `ContactBadges.tsx`
- [ ] Create memoized badge component with config object
- [ ] Add semantic color mapping (use existing tag-* classes)
- [ ] Handle unknown values gracefully (fallback + formatted label)
- [ ] Add to `ContactBadgeGroup` if composite display needed
- [ ] Add to discovery inventory

### Adding a New Wizard State

- [ ] Add state interface in `useImportWizard.types.ts`
- [ ] Add to `WizardState` union type
- [ ] Create state-specific reducer function
- [ ] Add case to main `importWizardReducer` switch
- [ ] Add action types for transitions
- [ ] Update `deriveWizardFlags()` if needed
- [ ] Update state flow diagram in this document

---

## File Reference

| Pattern | Primary Files |
|---------|--------------|
| A: Import Pipeline | `contactImport.logic.ts`, `csvProcessor.ts`, `columnAliases.ts` |
| B: Form Defaults | `ContactCompactForm.tsx`, `ContactCreate.tsx`, `ContactEdit.tsx` |
| C: Contact Linking | `LinkOpportunityModal.tsx`, `OpportunitiesTab.tsx` |
| D: Field Mapping | `useColumnMapping.ts`, `columnAliases.ts` |
| E: Tags System | `TagsListEdit.tsx`, `TagChip.tsx`, `tag-colors.ts` |
| F: Activity Tab | `ActivitiesTab.tsx` |
| G: Contact Badges | `ContactBadges.tsx` |
| H: Wizard State | `useImportWizard.ts`, `useImportWizard.types.ts` |
