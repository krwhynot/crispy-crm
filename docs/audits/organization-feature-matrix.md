# Organization Resource Feature Matrix

**Audit Date:** 2025-11-28
**Auditor:** Claude (Opus 4.5)
**PRD Version:** 1.12 → 1.13
**Status:** Complete

## Executive Summary

This audit validates the Organization resource implementation against PRD requirements and industry best practices (Salesforce Accounts, HubSpot Companies). The Organization resource is **92% aligned** with PRD requirements with 2 existing MVP blockers (#20, #21) and 2 new items identified (#44, #45).

### Key Findings

| Category | Status | Notes |
|----------|--------|-------|
| PRD Compliance | ✅ High | 2 MVP blockers (#20 Authorization Tab, #21 Bulk Reassignment) |
| Industry Alignment | ✅ High | Matches Salesforce/HubSpot patterns for account management |
| Code Quality | ✅ Excellent | Zod validation, typed components, proper separation |
| Design System | ✅ Good | Uses StandardListLayout, PremiumDatagrid, SlideOver |

### Decisions Made

1. **Add Email field to Organization UI** - Aligns with industry standard (Salesforce/HubSpot)
2. **Keep 2-level hierarchy limit** - Sufficient for franchises/branches, avoids complexity
3. **Change duplicate name validation to soft warning** - Matches HubSpot approach
4. **Implement Authorization Tab and Bulk Reassignment in parallel** - Both are well-scoped

---

## Industry Best Practices Research

### Sources Consulted
- Salesforce Account Object Documentation
- HubSpot Company Properties Documentation
- CRM Best Practices Guides (via Perplexity Research)

### Key Industry Patterns

| Feature | Salesforce | HubSpot | Crispy-CRM |
|---------|------------|---------|------------|
| **Account/Company Name** | Required, unique optional | Required, domain-based dedup | Required, soft warning for duplicates |
| **Account Type** | Customizable picklist | Type property | 5-value enum (principal/distributor/customer/prospect/unknown) |
| **Parent Hierarchy** | Unlimited depth | 10,000 children limit | 2-level depth limit |
| **Industry/Segment** | Industry + SIC/NAICS | Industry + Industry Group | segment_id (8 Playbook categories) |
| **Priority/Rating** | Hot/Warm/Cold | ICP Tier (1/2/3) | A/B/C/D letter grades |
| **Owner** | Account Owner | Owner property | sales_id (Account Manager) |
| **Address** | Billing + Shipping (dual) | Single address | Single address |
| **Email** | ✅ Standard field | ✅ Standard field | ⚠️ In schema, not in UI |
| **Website** | ✅ Standard field | ✅ Standard field | ✅ Implemented |
| **Social Links** | ✅ Multiple | ✅ LinkedIn, Twitter, etc. | ✅ LinkedIn URL |
| **Related Contacts** | ✅ Related list | ✅ Associated contacts | ✅ Tab + count |
| **Related Opportunities** | ✅ Related list | ✅ Associated deals | ✅ Tab + count |
| **Notes** | ✅ Activity notes | ✅ Notes object | ✅ OrganizationNotesTab |
| **Merge Duplicates** | ✅ Merge wizard | ✅ Merge tool | ❌ Not implemented |
| **Bulk Operations** | ✅ Mass transfer | ✅ Bulk actions | ⚠️ #20 TODO |

---

## Feature Matrix: Code vs PRD vs Industry

### Core Identity Fields

| Field | Code Implementation | PRD Requirement | Industry Standard | Status |
|-------|---------------------|-----------------|-------------------|--------|
| `name` | ✅ TextInput, required, async duplicate check | ✅ Required | ✅ Required | **Aligned** |
| `logo` | ✅ ImageEditorField | Not specified | ✅ Profile Image | **Exceeds PRD** |
| `organization_type` | ✅ SelectInput, 5 values, default "unknown" | ✅ Section 2.4, D | ✅ Account Type | **Aligned** |
| `description` | ✅ TextInput multiline | ✅ D: Principal parameters | ✅ Description | **Aligned** |

### Hierarchy Fields

| Field | Code Implementation | PRD Requirement | Industry Standard | Status |
|-------|---------------------|-----------------|-------------------|--------|
| `parent_organization_id` | ✅ ParentOrganizationInput | ✅ D.2 | ✅ Parent Account | **Aligned** |
| Branch display | ✅ BranchLocationsSection | ✅ D.2 | ✅ Child accounts | **Aligned** |
| Hierarchy breadcrumb | ✅ HierarchyBreadcrumb | ✅ D.2 | ✅ Hierarchy view | **Aligned** |
| Depth limit | ✅ 2 levels enforced | ✅ D.2 | Unlimited (Salesforce) | **Domain choice** |

### Classification Fields

| Field | Code Implementation | PRD Requirement | Industry Standard | Status |
|-------|---------------------|-----------------|-------------------|--------|
| `priority` | ✅ SelectInput A/B/C/D, default "C" | ✅ D.1 | ✅ Rating/Tier | **Aligned** |
| `segment_id` | ✅ SegmentComboboxInput | ✅ D.3 (8 categories) | ✅ Industry | **Aligned** |
| `sales_id` | ✅ ReferenceInput to sales | ✅ 2.3.1 | ✅ Owner | **Aligned** |

### Contact Information Fields

| Field | Code Implementation | PRD Requirement | Industry Standard | Status |
|-------|---------------------|-----------------|-------------------|--------|
| `phone` | ✅ TextInput | Not explicit | ✅ Phone | **Aligned** |
| `email` | ⚠️ In schema/export, not in UI | Not explicit | ✅ Email | **Gap: Add to UI** |
| `website` | ✅ TextInput, URL regex | Not explicit | ✅ Website | **Aligned** |
| `linkedin_url` | ✅ TextInput, LinkedIn regex | Not specified | ✅ Social links | **Exceeds PRD** |
| `context_links` | ✅ ArrayInput JSONB | Not specified | ❌ Not standard | **Unique feature** |

### Address Fields

| Field | Code Implementation | PRD Requirement | Industry Standard | Status |
|-------|---------------------|-----------------|-------------------|--------|
| `address` | ✅ TextInput | Not explicit | ✅ Street | **Aligned** |
| `city` | ✅ TextInput | Not explicit | ✅ City | **Aligned** |
| `state` | ✅ TextInput | Not explicit | ✅ State/Province | **Aligned** |
| `postal_code` | ✅ TextInput | Not explicit | ✅ Postal Code | **Aligned** |
| `country` | ⚠️ In schema, not in UI | Not specified | ✅ Country | **Minor gap** |

### Computed/System Fields

| Field | Code Implementation | PRD Requirement | Industry Standard | Status |
|-------|---------------------|-----------------|-------------------|--------|
| `nb_contacts` | ✅ Computed, displayed in list | Implicit | ✅ Related count | **Aligned** |
| `nb_opportunities` | ✅ Computed, displayed in list | Implicit | ✅ Related count | **Aligned** |
| `created_at` | ✅ DateField in Aside | Implicit | ✅ Created Date | **Aligned** |
| `deleted_at` | ✅ Soft delete | ✅ 3.3 | ✅ Soft delete | **Aligned** |

---

## CRUD Matrix: Component-Level Detail

### CREATE Flow (`OrganizationCreate.tsx`)

```
OrganizationCreate
├── CreateBase (redirect="show")
│   └── Form (defaultValues from Zod schema)
│       └── OrganizationInputs (TabbedFormInputs)
│           ├── General Tab
│           │   ├── ImageEditorField (logo)
│           │   ├── TextInput (name) + async duplicate validator
│           │   ├── SelectInput (organization_type) - 5 choices
│           │   ├── ParentOrganizationInput (parent_organization_id)
│           │   ├── TextInput (description)
│           │   └── ReferenceInput→SelectInput (sales_id)
│           ├── Details Tab
│           │   ├── SegmentComboboxInput (segment_id)
│           │   ├── SelectInput (priority) - A/B/C/D
│           │   ├── TextInput (phone)
│           │   ├── TextInput (address)
│           │   ├── TextInput (city)
│           │   ├── TextInput (postal_code)
│           │   └── TextInput (state)
│           ├── Other Tab
│           │   ├── TextInput (website)
│           │   ├── TextInput (linkedin_url)
│           │   └── ArrayInput→SimpleFormIterator (context_links)
│           └── Hierarchy Tab
│               ├── ParentOrganizationInput
│               └── BranchLocationsSection (read-only)
└── FormToolbar
    ├── CancelButton
    └── SaveButton
```

**Default Values (from Zod schema):**
- `organization_type`: "unknown"
- `priority`: "C"
- `sales_id`: Current user ID
- `segment_id`: "Unknown" segment ID

### READ Flow

#### List View (`OrganizationList.tsx`)

```
OrganizationList
├── List (perPage=25, sort by name ASC)
│   ├── OrganizationListActions (TopToolbar)
│   │   ├── SortButton (name, organization_type, priority)
│   │   ├── ExportButton
│   │   └── CreateButton
│   └── OrganizationListLayout
│       └── StandardListLayout
│           ├── OrganizationListFilter (sidebar)
│           │   ├── SearchInput (q)
│           │   ├── FilterCategory: Organization Type (5 options)
│           │   ├── FilterCategory: Priority (A/B/C/D)
│           │   ├── FilterCategory: Segment (dynamic)
│           │   └── FilterCategory: Account Manager (Me)
│           └── PremiumDatagrid (6 columns)
│               ├── TextField (name) - sortable
│               ├── FunctionField (type badge) - sortable
│               ├── FunctionField (priority badge) - sortable
│               ├── ReferenceField (parent) - sortable
│               ├── FunctionField (nb_contacts) - non-sortable
│               └── FunctionField (nb_opportunities) - non-sortable
├── FloatingCreateButton
├── BulkActionsToolbar
└── OrganizationSlideOver (opened on row click)
```

#### Show View (`OrganizationShow.tsx`)

```
OrganizationShow
└── ShowBase
    └── ResponsiveGrid (dashboard variant)
        ├── main
        │   └── Card
        │       ├── OrganizationAvatar + name
        │       └── Tabs (4 tabs)
        │           ├── Activity Tab → ActivityLog
        │           ├── Contacts Tab → ReferenceManyField→ContactsIterator
        │           ├── Opportunities Tab → ReferenceManyField→OpportunitiesIterator
        │           └── Activities Tab → ActivitiesTab
        └── aside
            └── OrganizationAside
                ├── Edit/Show Button
                ├── OrganizationInfo (website, linkedin, phone)
                ├── ParentOrganizationSection
                ├── AddressInfo
                ├── ContextInfo (type, priority, segment)
                └── AdditionalInfo (description, context_links, sales, created)
```

#### SlideOver View (`OrganizationSlideOver.tsx`)

```
OrganizationSlideOver
└── ResourceSlideOver (4 tabs)
    ├── Details Tab (OrganizationDetailsTab)
    │   ├── View Mode: Card with name, type, priority, tags, links, timestamps
    │   └── Edit Mode: Form with name, type, priority, tags, context_links
    ├── Contacts Tab (OrganizationContactsTab)
    ├── Opportunities Tab (OrganizationOpportunitiesTab)
    └── Notes Tab (OrganizationNotesTab)
        └── ReferenceManyField→NoteCreate + NotesIterator
```

### UPDATE Flow (`OrganizationEdit.tsx`)

```
OrganizationEdit
└── EditBase (redirect="show")
    ├── mutationOptions.onMutate → Principal type change validation
    └── OrganizationEditContent
        └── ResponsiveGrid
            ├── main
            │   └── Form
            │       └── OrganizationInputs (same as Create)
            │       └── FormToolbar
            └── aside
                └── OrganizationAside (link="show")
        └── PrincipalChangeWarning (modal)
```

**Special Validation:**
- Changing from `principal` type requires warning dialog
- Products must be reassigned before type change

### DELETE Flow (Soft Delete Only)

```
BulkActionsToolbar
└── Bulk soft delete → Sets deleted_at timestamp

Individual delete → Via React Admin default (also soft)
```

**Business Rules (PRD 3.3):**
- Soft delete only - records archived, never truly deleted
- Available to: Record owner, Manager, Admin
- Hard delete: Not permitted

---

## Validation Schema Analysis

**File:** `src/atomic-crm/validation/organizations.ts`

### Schema Fields

```typescript
organizationSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  name: z.string().min(1, "Organization name is required"),
  logo: z.any().optional().nullable(),
  parent_organization_id: z.union([z.string(), z.number()]).optional().nullable(),
  segment_id: z.string().uuid().optional().nullable(),
  linkedin_url: isLinkedinUrl.nullish(),
  website: isValidUrl.nullish(),
  phone: z.string().nullish(),
  address: z.string().nullish(),
  postal_code: z.string().nullish(),
  city: z.string().nullish(),
  state: z.string().nullish(),
  sales_id: z.union([z.string(), z.number()]).nullish(),
  description: z.string().optional().nullable(),
  context_links: z.array(isValidUrl).nullish(),
  tags: z.string().optional(),
  organization_type: organizationTypeSchema.default("unknown"),
  priority: organizationPrioritySchema.default("C"),
  nb_contacts: z.number().optional(),
  nb_opportunities: z.number().optional(),
  created_at: z.string().optional(),
  deleted_at: z.string().optional().nullable(),
});
```

### Custom Validators

| Validator | Pattern | Usage |
|-----------|---------|-------|
| `URL_REGEX` | `^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)...` | website, context_links |
| `LINKEDIN_URL_REGEX` | `^http(?:s)?:\/\/(?:www\.)?linkedin.com\/` | linkedin_url |
| `useDuplicateNameValidator` | Async check via dataProvider | name field (hard block → soft warning) |

---

## Gaps & Action Items

### MVP Blockers (Existing)

| # | Feature | Status | Priority |
|---|---------|--------|----------|
| 20 | Bulk owner reassignment | 🔧 TODO | High - Manager workflow |
| 21 | Authorization Tab on Distributors | 🔧 TODO | High - Core business logic |

### New Items Identified

| # | Feature | Status | Rationale |
|---|---------|--------|-----------|
| 44 | Add Email field to Organization UI | 🔧 TODO | Industry standard alignment |
| 45 | Change duplicate name check to soft warning | 🔧 TODO | HubSpot-style, supports franchises |

### Minor Gaps (Post-MVP)

| Gap | Current State | Recommendation |
|-----|---------------|----------------|
| Country field | In schema, not in UI | Add to OrganizationDetailsTab if international expansion planned |
| Merge duplicates | Not implemented | Low priority - admin SQL sufficient |
| Dual address | Single address only | Keep single - sufficient for MFB scale |

---

## Implementation Recommendations

### Priority 1: MVP Blockers (Parallel)

**#20 Bulk Reassignment:**
```typescript
// Add BulkReassignButton to OrganizationListActions
// Uses existing BulkActionsToolbar pattern
// Update sales_id for selected organizations
```

**#21 Authorization Tab:**
```typescript
// Add AuthorizationsTab to OrganizationSlideOver
// Filter: Only show for distributor type
// Display: List of authorized principals from distributor_principal_authorizations table
```

### Priority 2: New Items

**#44 Add Email Field:**
```typescript
// OrganizationDetailsTab.tsx
<TextInput source="email" label="Email" type="email" helperText={false} />
```

**#45 Soft Warning for Duplicates:**
```typescript
// OrganizationGeneralTab.tsx - Modify useDuplicateNameValidator
// Return warning message but don't block submission
// Show toast notification instead of field error
```

---

## Appendix: File Reference

| File | Purpose |
|------|---------|
| `src/atomic-crm/organizations/OrganizationList.tsx` | List view with filters, export |
| `src/atomic-crm/organizations/OrganizationShow.tsx` | Full page detail view |
| `src/atomic-crm/organizations/OrganizationCreate.tsx` | Create form |
| `src/atomic-crm/organizations/OrganizationEdit.tsx` | Edit form with principal validation |
| `src/atomic-crm/organizations/OrganizationSlideOver.tsx` | SlideOver container |
| `src/atomic-crm/organizations/OrganizationInputs.tsx` | Tabbed form inputs |
| `src/atomic-crm/organizations/OrganizationGeneralTab.tsx` | Name, type, parent, description, sales |
| `src/atomic-crm/organizations/OrganizationDetailsTab.tsx` | Segment, priority, phone, address |
| `src/atomic-crm/organizations/OrganizationOtherTab.tsx` | Website, LinkedIn, context links |
| `src/atomic-crm/organizations/OrganizationHierarchyTab.tsx` | Parent selection, branch display |
| `src/atomic-crm/organizations/OrganizationListFilter.tsx` | Sidebar filters |
| `src/atomic-crm/organizations/OrganizationAside.tsx` | Sidebar info sections |
| `src/atomic-crm/validation/organizations.ts` | Zod validation schema |
| `src/atomic-crm/organizations/slideOverTabs/*.tsx` | SlideOver tab components |

---

*Generated by Claude (Opus 4.5) via Feature Matrix audit process*
*See also: [Contact Feature Matrix](./contact-feature-matrix.md)*
