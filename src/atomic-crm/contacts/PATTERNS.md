# Contact Feature Patterns

Standard patterns for contact management in Crispy CRM, including CSV import/export, forms, badges, tags, and activity integration.

## Component Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CONTACTS FEATURE                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                      CSV IMPORT PIPELINE (A, D, H)                      ││
│  │  ┌──────────────┐   ┌─────────────┐   ┌──────────────┐   ┌───────────┐ ││
│  │  │ CSV Upload   │ → │ PapaParse   │ → │ Column       │ → │ Preview   │ ││
│  │  │ (validation) │   │ (parsing)   │   │ Mapping (D)  │   │ (data QA) │ ││
│  │  └──────────────┘   └─────────────┘   └──────────────┘   └───────────┘ ││
│  │          │                                   │                  │       ││
│  │          ▼                                   ▼                  ▼       ││
│  │  ┌──────────────┐   ┌─────────────────────────────────────────────────┐││
│  │  │ Import Logic │   │            Import Wizard State Machine (H)       │││
│  │  │ (A)          │   │  IDLE → FILE_SELECTED → PARSING → PREVIEW →     │││
│  │  │              │   │  IMPORTING → COMPLETE/ERROR                      │││
│  │  └──────────────┘   └─────────────────────────────────────────────────┘││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                    CONTACT FORMS & DISPLAY (B, C, E, F, G)             │ │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────────────────┐   │ │
│  │  │ CompactForm   │  │ LinkModal     │  │ SlideOver                 │   │ │
│  │  │ (B)           │  │ (C)           │  │                           │   │ │
│  │  │ - Sections    │  │ - Dialog      │  │ ┌───────────────────────┐ │   │ │
│  │  │ - ArrayInput  │  │ - useCreate   │  │ │ ContactBadges (G)     │ │   │ │
│  │  │ - Defaults    │  │ - Duplicate   │  │ │ TagsList/Edit (E)     │ │   │ │
│  │  └───────────────┘  └───────────────┘  │ │ ActivitiesTab (F)     │ │   │ │
│  │                                        │ └───────────────────────┘ │   │ │
│  │                                        └───────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Pattern A: Import/Export Pipeline

Pure business logic for CSV contact import with data quality validation and transformation.

**Key Files:**
- `contactImport.logic.ts` - Pure functions for validation/transformation
- `csvProcessor.ts` - CSV data processing and name splitting
- `ContactImportPreview.tsx` - Preview UI with column mappings
- `ContactImportResult.tsx` - Import result dialog with error export

### Data Quality Transformations

```tsx
// src/atomic-crm/contacts/contactImport.logic.ts

/**
 * Pure function to check if a contact is organization-only (no person name).
 * Used for data quality decisions during import.
 */
export function isOrganizationOnlyEntry(contact: Partial<ContactImportSchema>): boolean {
  const hasOrgName = contact.organization_name && String(contact.organization_name).trim();
  const hasFirstName = contact.first_name && String(contact.first_name).trim();
  const hasLastName = contact.last_name && String(contact.last_name).trim();

  return !!(hasOrgName && !hasFirstName && !hasLastName);
}

/**
 * Applies data quality transformations based on user decisions.
 * Pure function - no side effects.
 */
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

    // Auto-fill placeholder contact if user approved
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

### CSV Processing with Custom Mappings

```tsx
// src/atomic-crm/contacts/csvProcessor.ts

/**
 * Transform raw CSV data with custom mappings (for interactive column mapping).
 * This is the SOURCE OF TRUTH for import - uses user overrides.
 */
export function processCsvDataWithMappings(
  headers: string[],
  dataRows: Array<Array<unknown>>,
  customMappings: Record<string, string | null>
): ContactImportSchema[] {
  return dataRows.map((row) => {
    const contact: Record<string, string> = {};

    headers.forEach((originalHeader, index) => {
      const targetField = customMappings[originalHeader];
      const rawValue = row[index];

      // SECURITY: Sanitize all cell values
      const value = sanitizeCsvValue(rawValue);

      // Handle full name splitting
      if (targetField === FULL_NAME_SPLIT_MARKER) {
        const { first_name, last_name } = splitFullName(value || "");
        contact.first_name = sanitizeCsvValue(first_name);
        contact.last_name = sanitizeCsvValue(last_name);
      } else if (targetField) {
        contact[targetField] = value;
      }
      // If targetField is null/undefined, skip this column
    });

    return contact as ContactImportSchema;
  });
}

/**
 * Split a full name into first and last name components.
 * Single name → assigned to last_name (formal convention).
 */
export function splitFullName(fullName: string): { first_name: string; last_name: string } {
  const nameParts = fullName.trim().split(/\s+/);

  if (nameParts.length === 0 || fullName.trim() === "") {
    return { first_name: "", last_name: "" };
  } else if (nameParts.length === 1) {
    // Single name - treat as last name
    return { first_name: "", last_name: nameParts[0] };
  } else {
    // Multiple parts - first is first_name, rest is last_name
    return {
      first_name: nameParts[0],
      last_name: nameParts.slice(1).join(" "),
    };
  }
}
```

### Import Result with Error Export

```tsx
// src/atomic-crm/contacts/ContactImportResult.tsx

const handleDownloadErrors = () => {
  // Create CSV content with comprehensive error details
  const csvContent = [
    [
      "Row", "Error Reasons", "First Name", "Last Name", "Organization",
      "Title", "Email (Work)", "Email (Home)", "Email (Other)",
      "Phone (Work)", "Phone (Home)", "Phone (Other)", "LinkedIn URL", "Notes",
    ],
    ...result.errors.map((error) => [
      error.row.toString(),
      error.errors.map((e) => `${e.field}: ${e.message}`).join("; "),
      error.data.first_name || "",
      error.data.last_name || "",
      // ... remaining fields
    ]),
  ]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  // Create and trigger download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `import_errors_${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
```

**When to use:**
- Implementing bulk data import features
- Need data quality checks before import
- Want user decisions on edge cases (org-only entries, missing contact info)
- Need downloadable error reports for failed imports

---

## Pattern B: Contact Form Defaults

Smart form sections with email-to-name auto-fill and array inputs for multiple values.

**Key File:** `ContactCompactForm.tsx`

### Sectioned Form with Progress Indicators

```tsx
// src/atomic-crm/contacts/ContactCompactForm.tsx

export const ContactCompactForm = () => {
  const { setValue, getValues } = useFormContext();

  // Auto-fill name from email on paste/blur
  const handleEmailChange = (email: string) => {
    const { first_name, last_name } = getValues();
    if (first_name || last_name || !email) return;
    const [first, last] = email.split("@")[0].split(".");
    setValue("first_name", first.charAt(0).toUpperCase() + first.slice(1));
    setValue("last_name", last ? last.charAt(0).toUpperCase() + last.slice(1) : "");
  };

  return (
    <div className="space-y-6">
      {/* Name Section */}
      <FormSectionWithProgress
        id="name-section"
        title="Name"
        requiredFields={["first_name", "last_name"]}
      >
        <CompactFormRow columns="md:grid-cols-[1fr_1fr_auto]" alignItems="start">
          <FormFieldWrapper name="first_name" isRequired>
            <TextInput source="first_name" label="First Name *" autoComplete="given-name" />
          </FormFieldWrapper>
          <FormFieldWrapper name="last_name" isRequired>
            <TextInput source="last_name" label="Last Name *" autoComplete="family-name" />
          </FormFieldWrapper>
          <div className="pt-6">
            <Avatar />
          </div>
        </CompactFormRow>
      </FormSectionWithProgress>

      {/* Contact Info Section with Array Inputs */}
      <FormSectionWithProgress
        id="contact-info-section"
        title="Contact Info"
        requiredFields={["email"]}
      >
        <FormFieldWrapper name="email" isRequired>
          <ArrayInput source="email" label="Email addresses *">
            <SimpleFormIterator inline disableReordering disableClear>
              <TextInput
                source="value"
                placeholder="Email (valid email required)"
                onPaste={handleEmailPaste}
                onBlur={handleEmailBlur}
              />
              <SelectInput
                source="type"
                optionText="id"
                choices={personalInfoTypes}
                defaultValue="work"
              />
            </SimpleFormIterator>
          </ArrayInput>
        </FormFieldWrapper>
      </FormSectionWithProgress>
    </div>
  );
};
```

### Personal Info Type Choices

```tsx
// Lowercase type values to match Zod schema (personalInfoTypeSchema)
const personalInfoTypes = [{ id: "work" }, { id: "home" }, { id: "other" }];
```

**When to use:**
- Contact create/edit forms
- Forms with multiple values per field (emails, phones)
- Need visual progress indicators for form sections
- Smart defaults/auto-fill from related fields

---

## Pattern C: Contact Linking

Modal dialogs for creating junction table records between contacts and other entities.

**Key File:** `LinkOpportunityModal.tsx`

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

    // Duplicate check before creation
    if (linkedOpportunityIds.includes(data.opportunity_id)) {
      notify("This contact is already linked to that opportunity", { type: "warning" });
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
            const errorMessage = error instanceof Error ? error.message : "Failed to link";
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
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
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

**When to use:**
- Creating many-to-many relationships
- Need duplicate checking before creation
- Searchable selection with `AutocompleteInput`
- Modal workflow for linking entities

---

## Pattern D: Field Mapping Hook

Reusable hook for CSV column-to-field mapping with user overrides.

**Key Files:**
- `useColumnMapping.ts` - State management
- `columnAliases.ts` - 200+ aliases for common CSV headers

### Two-Layer Mapping Strategy

```tsx
// src/atomic-crm/contacts/useColumnMapping.ts

export function useColumnMapping(): UseColumnMappingReturn {
  // Core state
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawDataRows, setRawDataRows] = useState<unknown[][]>([]);
  const [userOverrides, setUserOverrides] = useState<Map<string, string | null>>(new Map());

  // Track previous headers to detect new file selection
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

  /**
   * Derive final mappings by merging auto-detection with user overrides.
   * Priority: User override > Auto-detection
   */
  const mappings = useMemo<Record<string, string | null>>(() => {
    if (rawHeaders.length === 0) return {};

    const autoMappings = mapHeadersToFields(rawHeaders);
    const finalMappings: Record<string, string | null> = {};

    rawHeaders.forEach((header) => {
      // User override takes precedence
      finalMappings[header] = userOverrides.get(header) ?? autoMappings[header];
    });

    return finalMappings;
  }, [rawHeaders, userOverrides]);

  /**
   * Derive processed contacts - THIS IS THE SOURCE OF TRUTH FOR IMPORT
   */
  const contacts = useMemo<ContactImportSchema[]>(() => {
    if (!rawHeaders.length || !rawDataRows.length) return [];
    return processCsvDataWithMappings(rawHeaders, rawDataRows, mappings);
  }, [rawHeaders, rawDataRows, mappings]);

  /**
   * Set or clear a single column override.
   */
  const setOverride = useCallback((csvHeader: string, targetField: string | null) => {
    setUserOverrides((prev) => {
      const next = new Map(prev);
      if (targetField === null || targetField === "") {
        next.delete(csvHeader);  // Revert to auto-detection
      } else {
        next.set(csvHeader, targetField);
      }
      return next;
    });
  }, []);

  return {
    mappings,
    overrides: userOverrides,
    contacts,
    headers: rawHeaders,
    setOverride,
    setRawData,
    reset,
    hasData: rawHeaders.length > 0,
  };
}
```

### Column Alias Registry

```tsx
// src/atomic-crm/contacts/columnAliases.ts

/**
 * Registry mapping ContactImportSchema fields to common CSV header variations.
 * All variations are normalized (lowercase, trimmed) for comparison.
 */
export const COLUMN_ALIASES: Record<string, string[]> = {
  first_name: [
    "first_name", "first name", "first", "firstname", "fname",
    "given name", "given_name", "givenname", "forename",
    "prenom", "vorname",  // Internationalization
  ],

  organization_name: [
    "organization_name", "organization name", "organization",
    "company", "company name", "company_name", "companyname",
    "business", "business name", "org", "org name",
    "employer", "enterprise", "firm", "client", "customer", "account",
  ],

  email_work: [
    "email_work", "email work", "work email", "work_email",
    "business email", "business_email", "professional email",
    "email", "e-mail", "email address",  // Default email maps to work
    "email_primary", "primary email",
  ],
  // ... 200+ total aliases
};

/**
 * Pre-computed reverse map for O(1) lookups.
 */
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

**When to use:**
- CSV import with flexible header matching
- Need user-overridable auto-detection
- Derived state from raw data + mappings
- Internationalized header support

---

## Pattern E: Contact Tags System

Read-only display and editable tag lists with dropdown menu for quick actions.

**Key Files:**
- `TagsList.tsx` - Read-only display in lists
- `TagsListEdit.tsx` - Editable in slide-over/detail views

### Read-Only Tag Display

```tsx
// src/atomic-crm/contacts/TagsList.tsx

const ColoredBadge = (props: ColoredBadgeProps) => {
  const record = useRecordContext();
  if (!record) return null;

  return (
    <Badge
      variant="outline"
      className={cn("font-normal border-0", getTagColorClass(record.color))}
    >
      {record.name}
    </Badge>
  );
};

export const TagsList = () => (
  <ReferenceArrayField className="inline-block" source="tags" reference="tags">
    <SingleFieldList>
      <ColoredBadge source="name" />
    </SingleFieldList>
  </ReferenceArrayField>
);
```

### Editable Tag List with Dropdown

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
    { enabled: record && record.tags && record.tags.length > 0 }
  );
  const [update] = useUpdate<Contact>();

  const unselectedTags = allTags?.filter((tag) => !record?.tags.includes(tag.id));

  const handleTagAdd = (id: Identifier) => {
    if (!record) throw new Error("No contact record found");
    const tags = [...record.tags, id];
    update("contacts", { id: record.id, data: { tags }, previousData: record });
  };

  const handleTagDelete = async (id: Identifier) => {
    if (!record) throw new Error("No contact record found");
    const tags = record.tags.filter((tagId) => tagId !== id);
    await update("contacts", { id: record.id, data: { tags }, previousData: record });
  };

  return (
    <div className="flex flex-wrap gap-2">
      {tags?.map((tag) => (
        <TagChip key={tag.id} tag={tag} onUnlink={() => handleTagDelete(tag.id)} />
      ))}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-11 px-3">
            <Plus className="h-4 w-4 mr-1" /> Add tag
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {unselectedTags?.map((tag) => (
            <DropdownMenuItem key={tag.id} onClick={() => handleTagAdd(tag.id)}>
              <Badge className={getTagColorClass(tag.color)}>{tag.name}</Badge>
            </DropdownMenuItem>
          ))}
          <DropdownMenuItem onClick={() => setOpen(true)}>
            <Edit className="h-3 w-3 mr-2" /> Create new tag
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <TagCreateModal open={open} onClose={() => setOpen(false)} onSuccess={handleTagCreated} />
    </div>
  );
};
```

**When to use:**
- Array field display with reference lookup
- Inline tag editing with optimistic updates
- Dropdown menu for quick add actions
- Modal for creating new tags

---

## Pattern F: Activity Tab Integration

Shared activity tab component with pre-filled dialog context.

**Key File:** `ActivitiesTab.tsx`

```tsx
// src/atomic-crm/contacts/ActivitiesTab.tsx

interface ActivitiesTabProps {
  contactId: string | number;
}

export const ActivitiesTab = ({ contactId }: ActivitiesTabProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data, isPending, error, refetch } = useGetList<ActivityRecord>("activities", {
    filter: { contact_id: contactId },
    sort: { field: "created_at", order: "DESC" },
    pagination: { page: 1, perPage: ACTIVITY_PAGE_SIZE },
  });

  // Convert contactId to number for dialog (handles both string and number)
  const numericContactId = typeof contactId === "string" ? parseInt(contactId, 10) : contactId;

  if (isPending) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 border border-border rounded-lg">
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-3 w-full mb-1" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-8 text-destructive">Failed to load activities</div>;
  }

  return (
    <div className="space-y-4">
      {/* Log Activity button */}
      <div className="flex justify-end">
        <Button variant="outline" className="h-11 gap-2" onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4" /> Log Activity
        </Button>
      </div>

      {data?.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No activities recorded yet</div>
      ) : (
        <div className="space-y-3">
          {data?.map((activity) => (
            <ActivityTimelineEntry key={activity.id} activity={activity} />
          ))}
        </div>
      )}

      {/* Activity logging dialog - pre-fills contact */}
      <QuickLogActivityDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        entityContext={{ contactId: numericContactId }}
        config={{
          enableDraftPersistence: false,  // No drafts for slide-over context
          showSaveAndNew: false,
        }}
        onSuccess={() => refetch()}  // Refresh activity list
      />
    </div>
  );
};
```

**When to use:**
- Entity-specific activity feeds
- Pre-filled activity dialogs with entity context
- Skeleton loading for better UX
- Refetch on successful creation

---

## Pattern G: Contact Badges

Memoized badge components with semantic colors for status, role, and influence.

**Key File:** `ContactBadges.tsx`

### Type-Safe Badge Variants

```tsx
// src/atomic-crm/contacts/ContactBadges.tsx

/** Valid contact status levels matching database/configuration values */
export type ContactStatus = "cold" | "warm" | "hot" | "in-contract";

/**
 * Contact role within an organization's buying process.
 * Based on BANT/MEDDIC sales methodology.
 */
export type ContactRole =
  | "decision_maker"
  | "influencer"
  | "buyer"
  | "end_user"
  | "gatekeeper"
  | "champion"
  | "technical"
  | "executive";

/** Influence level (maps from database smallint 1-5) */
export type InfluenceLevel = "critical" | "high" | "medium" | "low" | "minimal";
```

### Memoized Status Badge

```tsx
/**
 * Displays contact engagement status with semantic colors.
 *
 * Color mapping (MFB Garden to Table theme):
 * - cold: tag-blue (Cool/dormant)
 * - warm: tag-amber (Engaged)
 * - hot: tag-pink (Urgent/active)
 * - in-contract: tag-sage (Success)
 */
export const ContactStatusBadge = memo(function ContactStatusBadge({ status }: ContactStatusBadgeProps) {
  if (!status) {
    return <Badge className="text-xs px-2 py-1 tag-gray">--</Badge>;
  }

  const config: Record<string, { label: string; className: string }> = {
    cold: { label: "Cold", className: "tag-blue" },
    warm: { label: "Warm", className: "tag-amber" },
    hot: { label: "Hot", className: "tag-pink" },
    "in-contract": { label: "Contract", className: "tag-sage" },
  };

  const { label, className } = config[status] || {
    label: status.charAt(0).toUpperCase() + status.slice(1),
    className: "tag-gray",
  };

  return <Badge className={`text-xs px-2 py-1 ${className}`}>{label}</Badge>;
});
```

### Influence Badge with Numeric Conversion

```tsx
/**
 * Displays contact's influence level.
 * Accepts string level OR numeric score (1-5).
 */
export const InfluenceBadge = memo(function InfluenceBadge({ influence }: InfluenceBadgeProps) {
  // Convert numeric score (1-5) to semantic level
  const normalizedInfluence = typeof influence === "number" ? numericToLevel(influence) : influence;

  const config: Record<string, { label: string; variant: BadgeVariant }> = {
    critical: { label: "Critical", variant: "destructive" },
    high: { label: "High", variant: "default" },
    medium: { label: "Medium", variant: "secondary" },
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
/**
 * Renders multiple contact badges in a group.
 * Useful for slide-over detail views.
 */
export function ContactBadgeGroup({
  status,
  role,
  influence,
  direction = "horizontal",
}: ContactBadgeGroupProps) {
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

**When to use:**
- Status/role visualization in lists and details
- Type-safe badge configurations
- Semantic colors from theme (`tag-*` classes)
- Memoization for performance in large lists

---

## Pattern H: Import Wizard State Machine

Discriminated union state machine for multi-step import flow with cancellation support.

**Key Files:**
- `useImportWizard.ts` - Reducer + actions + hook
- `useImportWizard.types.ts` - Discriminated union types

### Discriminated Union State Types

```tsx
// src/atomic-crm/contacts/useImportWizard.types.ts

/**
 * All possible wizard steps as a literal union.
 */
export type WizardStep =
  | "idle"
  | "file_selected"
  | "parsing"
  | "preview"
  | "importing"
  | "complete"
  | "error";

/**
 * Discriminated union of all wizard states.
 * Makes illegal states UNREPRESENTABLE at the type level.
 */
export type WizardState =
  | WizardStateIdle
  | WizardStateFileSelected
  | WizardStateParsing
  | WizardStatePreview
  | WizardStateImporting
  | WizardStateComplete
  | WizardStateError;

/**
 * PREVIEW state carries preview data and data quality decisions.
 */
export interface WizardStatePreview {
  step: "preview";
  file: File;
  previewData: PreviewData;
  dataQualityDecisions: DataQualityDecisions;
}

/**
 * IMPORTING state tracks progress and accumulated results.
 */
export interface WizardStateImporting {
  step: "importing";
  file: File;
  progress: ImportProgress;
  accumulated: AccumulatedResult;
  rowOffset: number;
}
```

### Pure Reducer Function

```tsx
// src/atomic-crm/contacts/useImportWizard.ts

/**
 * Pure reducer function for the import wizard state machine.
 *
 * Design principles:
 * 1. No side effects - only returns new state
 * 2. Invalid transitions return unchanged state (same reference)
 * 3. Exhaustive handling of all action types per state
 * 4. Immutable updates - never mutates input state
 */
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
      return reduceCompleteState(state, action);
    case "error":
      return reduceErrorState(state, action);
    default:
      // TypeScript exhaustive check
      return assertNever(state);
  }
}

/**
 * Handles actions when in PREVIEW state.
 */
function reducePreviewState(state: WizardStatePreview, action: WizardAction): WizardState {
  switch (action.type) {
    case "START_IMPORT":
      return {
        step: "importing",
        file: state.file,
        progress: { count: 0, total: action.payload.totalContacts },
        accumulated: { ...INITIAL_ACCUMULATED_RESULT, startTime: new Date() },
        rowOffset: 0,
      };

    case "UPDATE_DATA_QUALITY_DECISIONS":
      return { ...state, dataQualityDecisions: action.payload.decisions };

    case "CANCEL":
      return createInitialState();

    default:
      return state;
  }
}
```

### Hook with AbortController Support

```tsx
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

  const isAborted = useCallback(() => {
    return abortControllerRef.current?.signal.aborted ?? false;
  }, []);

  // Override actions to manage abort lifecycle
  const actions = useMemo(() => {
    const baseActions = createWizardActions(dispatch);
    return {
      ...baseActions,
      startImport: (totalContacts: number) => {
        createAbortController();
        baseActions.startImport(totalContacts);
      },
      cancel: () => {
        abortControllerRef.current?.abort();
        baseActions.cancel();
      },
    };
  }, [createAbortController]);

  // Derive boolean flags from state
  const flags = useMemo(() => deriveWizardFlags(state), [state]);

  return { state, actions, flags, isAborted };
}
```

### Derived Flags for UI Conditions

```tsx
/**
 * Derive boolean flags from wizard state.
 * Replaces multiple useState booleans.
 */
export function deriveWizardFlags(state: WizardState) {
  return {
    showPreview: state.step === "preview",
    showResult: state.step === "complete",
    isImporting: state.step === "importing",
    isParsing: state.step === "parsing",
    hasError: state.step === "error",
    hasFile: hasFile(state),
    isTerminal: isTerminal(state),
    isProcessing: isProcessing(state),
  };
}
```

**When to use:**
- Multi-step workflows with complex state
- Need cancellation/abort support
- Type-safe state transitions
- Derived UI flags from state

---

## Pattern Comparison

### Tag Display vs Edit

| Aspect | TagsList (Read-Only) | TagsListEdit (Editable) |
|--------|---------------------|------------------------|
| **Hooks** | `ReferenceArrayField` | `useGetList`, `useGetMany`, `useUpdate` |
| **Actions** | Display only | Add, remove, create new |
| **UI** | Inline badges | Badges + dropdown menu |
| **Use case** | List cells | Slide-over/detail views |

### Badge Patterns

| Badge Type | Color System | Variants | Input Type |
|------------|-------------|----------|------------|
| **Status** | Semantic `tag-*` classes | N/A | String literal |
| **Role** | Semantic `tag-*` classes | N/A | String literal |
| **Influence** | Badge variants | destructive/default/secondary/outline | String OR number (1-5) |

### Import State Transitions

| Current State | Valid Actions | Next State |
|---------------|---------------|------------|
| `idle` | SELECT_FILE | `file_selected` |
| `file_selected` | START_PARSING, CLEAR_FILE | `parsing`, `idle` |
| `parsing` | PARSING_COMPLETE, PARSING_FAILED | `preview`, `error` |
| `preview` | START_IMPORT, CANCEL | `importing`, `idle` |
| `importing` | UPDATE_PROGRESS, IMPORT_COMPLETE, CANCEL | `importing`, `complete`, `idle` |
| `complete` | RESET | `idle` |
| `error` | RESET | `idle` |

---

## Anti-Patterns

### Direct CSV parsing in components

```tsx
// BAD: Parsing in component
function ImportButton() {
  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      Papa.parse(e.target?.result, {
        complete: (results) => { /* ... */ }
      });
    };
    reader.readAsText(file);
  };
}

// GOOD: Use usePapaParse hook
function ImportButton() {
  const { parseCsv } = usePapaParse({ onPreview });
  const handleFile = (file: File) => parseCsv(file);
}
```

### Mutable state in reducer

```tsx
// BAD: Mutating state
case "UPDATE_PROGRESS":
  state.progress.count = action.payload.count;  // MUTATION!
  return state;

// GOOD: Return new state object
case "UPDATE_PROGRESS":
  return {
    ...state,
    progress: { ...state.progress, count: action.payload.count },
  };
```

### Hardcoded column names

```tsx
// BAD: Hardcoded header detection
if (header === "first name" || header === "First Name") {
  mappings[header] = "first_name";
}

// GOOD: Use columnAliases registry
const canonicalField = findCanonicalField(header);
if (canonicalField) {
  mappings[header] = canonicalField;
}
```

### Inline badge colors

```tsx
// BAD: Hardcoded hex values
<Badge className="bg-[#ef4444] text-white">Hot</Badge>

// GOOD: Use semantic tag classes
<Badge className="tag-pink">Hot</Badge>
```

### useEffect for derived data

```tsx
// BAD: useEffect for derived state
const [contacts, setContacts] = useState([]);
useEffect(() => {
  setContacts(processCsvDataWithMappings(headers, rows, mappings));
}, [headers, rows, mappings]);

// GOOD: useMemo for derived data
const contacts = useMemo(
  () => processCsvDataWithMappings(headers, rows, mappings),
  [headers, rows, mappings]
);
```

### Missing exhaustive switch

```tsx
// BAD: No exhaustive check
switch (state.step) {
  case "idle": return <IdleView />;
  case "preview": return <PreviewView />;
  // Missing cases! No TypeScript error.
}

// GOOD: assertNever for exhaustive checking
switch (state.step) {
  case "idle": return <IdleView />;
  case "file_selected": return <FileView />;
  case "parsing": return <ParsingView />;
  case "preview": return <PreviewView />;
  case "importing": return <ImportingView />;
  case "complete": return <CompleteView />;
  case "error": return <ErrorView />;
  default: return assertNever(state);  // TypeScript error if case missing
}
```

### Skipping data quality checks

```tsx
// BAD: Direct import without validation
const handleImport = async (rows: ContactImportSchema[]) => {
  await createMany("contacts", rows);
};

// GOOD: Validate and apply transformations
const handleImport = async (rows: ContactImportSchema[], decisions: DataQualityDecisions) => {
  const { transformedContacts } = applyDataQualityTransformations(rows, decisions);
  const { successful, failed } = validateTransformedContacts(transformedContacts);
  await createMany("contacts", successful);
};
```

---

## Migration Checklist

When adding new contact features:

- [ ] **Identify patterns** - Review this document for applicable patterns
- [ ] **Check existing implementations** - Ensure consistency with existing code
- [ ] **Add Zod validation** - New fields need validation in `validation/contacts.ts`
- [ ] **Update column aliases** - If CSV-importable, add aliases in `columnAliases.ts`
- [ ] **Add badge types** - New status/role types need badge configs in `ContactBadges.tsx`
- [ ] **Update wizard states** - If affecting import flow, add new states/actions
- [ ] **Add skeleton loading** - Use skeleton patterns for async data
- [ ] **Use semantic colors** - Only `tag-*` classes, no hardcoded colors
- [ ] **Add touch targets** - 44x44px minimum (`h-11 w-11`)
- [ ] **Write tests** - Follow existing test patterns in `__tests__/`

---

## File Reference

| Pattern | Primary Files |
|---------|--------------|
| A: Import Pipeline | `contactImport.logic.ts`, `csvProcessor.ts`, `ContactImportPreview.tsx`, `ContactImportResult.tsx` |
| B: Form Defaults | `ContactCompactForm.tsx`, `ContactAdditionalDetails.tsx` |
| C: Contact Linking | `LinkOpportunityModal.tsx`, `UnlinkConfirmDialog.tsx` |
| D: Field Mapping | `useColumnMapping.ts`, `columnAliases.ts` |
| E: Tags System | `TagsList.tsx`, `TagsListEdit.tsx` |
| F: Activity Tab | `ActivitiesTab.tsx` |
| G: Contact Badges | `ContactBadges.tsx`, `StageBadgeWithHealth.tsx` |
| H: Wizard State | `useImportWizard.ts`, `useImportWizard.types.ts`, `ContactImportDialog.tsx` |
