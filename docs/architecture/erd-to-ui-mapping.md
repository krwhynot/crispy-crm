# ERD-to-UI Mapping Document

**Atomic CRM - Database to Interface Reference**

**Version:** 1.1
**Date:** 2025-01-16
**Status:** Living Document
**Last Schema Sync:** 2025-01-16 (Cloud Database: aaqnanddcqvfiwhshndl)

---

## Overview

This document provides a comprehensive mapping between the PostgreSQL database schema (Entity Relationship Diagram) and the React user interface screens in Atomic CRM. It serves as the definitive reference for understanding:

- Which database tables power each UI screen
- What CRUD operations each screen performs
- How tables are joined to provide enriched data
- Where specific database fields appear in the UI

**Architecture Stack:**
- **Database:** PostgreSQL via Supabase
- **ORM/Client:** Supabase JS Client
- **Data Layer:** React Admin with custom Unified Data Provider
- **UI Framework:** React 19 + shadcn/ui + Tailwind CSS v4

---

## 🔑 **Critical Architecture Pattern: View-Based Reads**

**ALL read operations (`getOne`, `getList`) automatically use `_summary` views, while writes target base tables.**

The Unified Data Provider (`src/atomic-crm/providers/supabase/dataProviderUtils.ts:173-195`) transparently substitutes:

| Base Table | Read Source (getOne/getList) | Write Target (create/update/delete) |
|------------|------------------------------|-------------------------------------|
| `contacts` | `contacts_summary` | `contacts` |
| `organizations` | `organizations_summary` | `organizations` |
| `opportunities` | `opportunities_summary` | `opportunities` |
| `products` | `products_summary` | `products` |

**Why This Matters:**
- **Views provide denormalized data** not available in base tables (e.g., `company_name`, `principal_name`, `products` JSONB array)
- **UI components receive enriched data** automatically without explicit joins
- **Forms submit to base tables** for normalized storage
- **Documentation must specify view-only fields** to avoid confusion about available data

**Example:** `OpportunityShow` receives `opportunities_summary` which includes:
- Base fields: `name`, `stage`, `priority`, etc.
- **View-only fields:** `customer_organization_name`, `principal_organization_name`, `distributor_organization_name`, `products` (JSONB array from `opportunity_products` join)

When reading this document, **"Primary View"** sections indicate what the UI actually receives, while **"Primary Table"** indicates the write target.

---

## Section 1: Screens to Entities Mapping

This section maps UI screens to their database dependencies.

---

### 1.1 Contacts Module

#### Screen: Contact List (`/contacts`)

**Component:** `src/atomic-crm/contacts/ContactList.tsx`

**Primary Table/View:** `contacts_summary` (view)

**Database Entities Used:**

| Entity | Purpose | Join Type | Fields Used |
|--------|---------|-----------|-------------|
| `contacts` | Base contact data | Primary | `id`, `first_name`, `last_name`, `name`, `avatar`, `email` (JSONB), `phone` (JSONB), `organization_id`, `sales_id`, `tags`, `last_seen`, `created_at`, `deleted_at` |
| `organizations` | Contact's company | LEFT JOIN | `name` (as `company_name`) |
| `contacts_summary` | Enriched view | Direct query | All `contacts` fields + `company_name` |
| `sales` | Account manager | Reference fetch | `id`, `name` (for display) |
| `tags` | Tag labels | Reference fetch | `id`, `name` |

**Fields Displayed:**

| UI Column | Source Field | Component Type | Transformations |
|-----------|--------------|----------------|-----------------|
| Avatar | `contacts.avatar` | Avatar image | URL → image |
| Name | `first_name + last_name` | TextField | Concatenated |
| Company | `contacts_summary.company_name` | ReferenceField | From view join |
| Email | `contacts.email[0].email` | Custom EmailField | JSONB array → first email |
| Phone | `contacts.phone[0].number` | Custom PhoneField | JSONB array → first phone |
| Tags | `contacts.tags` | ReferenceArrayField | Array of tag IDs → tag names |
| Last Activity | `contacts.last_seen` | DateField | ISO timestamp → relative date |

**Filters Available:**

| Filter | Target Field | Operator | Notes |
|--------|-------------|----------|-------|
| Search (q) | `first_name`, `last_name`, `name`, `company_name` | `@ilike` | Full-text search |
| Organization | `organization_id` | `=` | Single select |
| Tags | `tags` | `@cs` (contains) | JSONB array filter |
| Sales Rep | `sales_id` | `=` | Single select |

**CRUD Operations:**

| Operation | Method | Endpoint/Table | Notes |
|-----------|--------|----------------|-------|
| **List** | `getList` | `contacts_summary` | Uses view for denormalized data |
| **Create** | Navigate | `/contacts/create` | Opens create form |
| **Edit** | Navigate | `/contacts/:id/edit` | Opens edit form |
| **Delete** | `delete` | `contacts` | Soft delete: sets `deleted_at` |
| **Bulk Delete** | `deleteMany` | `contacts` | Multiple soft deletes |
| **Export** | `getList` + CSV | `contacts_summary` | Fetches all, exports to CSV |

**Data Flow:**
```
User → ContactList → React Admin List
  ↓
dataProvider.getList('contacts_summary', { filter, sort, pagination })
  ↓
Supabase Client → PostgreSQL
  ↓
SELECT * FROM contacts_summary WHERE deleted_at IS NULL
  ↓
React Admin → Datagrid → Render rows
```

---

#### Screen: Contact Detail (`/contacts/:id/show`)

**Component:** `src/atomic-crm/contacts/ContactShow.tsx`

**Primary View (Read):** `contacts_summary` - Provides denormalized organization name
**Write Target:** `contacts` (base table)

**Database Entities Used:**

| Entity | Purpose | Source Type | Fields Used |
|--------|---------|-------------|-------------|
| `contacts_summary` | Contact record with org name | View (getOne) | All `contacts` fields + **`company_name`** (view-only) |
| `contacts` | Base contact data | Table (updates) | All fields |
| `organizations` | Associated orgs | Reference | `id`, `name`, `organization_type` |
| `contactNotes` | Notes history | 1:N relationship | `id`, `text`, `created_at`, `created_by` |
| `activities` | Activity timeline | 1:N relationship | `id`, `type`, `subject`, `description`, `activity_date` |
| `sales` | Created by / assigned to | Reference | `id`, `name` |

**View-Only Fields** (available in UI but not in base `contacts` table):
- `company_name` - Denormalized organization name from LEFT JOIN

**Tab 1: Details**

| UI Element | Source | Component | Notes |
|------------|--------|-----------|-------|
| Avatar | `contacts.avatar` | ImageField | 120x120px |
| Full Name | `first_name + last_name` | TextField | Computed |
| Title | `contacts.title` | TextField | - |
| Department | `contacts.department` | TextField | - |
| Organization | `contacts.organization_id` | ReferenceField → `organizations` | Shows org name, links to org |
| Email Addresses | `contacts.email` | ArrayField | JSONB array, shows all emails with types |
| Phone Numbers | `contacts.phone` | ArrayField | JSONB array, shows all phones with types |
| LinkedIn | `contacts.linkedin_url` | UrlField | Clickable link |
| Tags | `contacts.tags` | ReferenceArrayField → `tags` | Chip badges |

**Tab 2: Notes**

| UI Element | Source | Component | Query |
|------------|--------|-----------|-------|
| Notes List | `contactNotes` | ReferenceManyField | `WHERE contact_id = :id ORDER BY created_at DESC` |
| Note Text | `contactNotes.text` | TextField | - |
| Created By | `contactNotes.created_by` | ReferenceField → `sales` | - |
| Created At | `contactNotes.created_at` | DateField | Relative time |
| Add Note | Form → `contactNotes` | NoteCreate | INSERT new note |

**Tab 3: Activities**

| UI Element | Source | Component | Query |
|------------|--------|-----------|-------|
| Activity Timeline | `activities` | ReferenceManyField | `WHERE contact_id = :id ORDER BY activity_date DESC` |
| Activity Type | `activities.type` | Badge | Call, Email, Meeting, etc. |
| Subject | `activities.subject` | TextField | - |
| Description | `activities.description` | TextField | - |
| Date | `activities.activity_date` | DateField | - |

**CRUD Operations:**

| Operation | Method | Source | Notes |
|-----------|--------|--------|-------|
| **Read** | `getOne` | `contacts_summary` (view) | Automatically substituted by data provider |
| **Update** | Navigate | `/contacts/:id/edit` | Opens edit form |
| **Delete** | `delete` | `contacts` (table) | Soft delete |
| **Create Note** | `create` | `contactNotes` (table) | Inline creation |

---

#### Screen: Contact Create/Edit (`/contacts/create`, `/contacts/:id/edit`)

**Component:** `src/atomic-crm/contacts/ContactCreate.tsx`, `ContactEdit.tsx`

**Primary Table:** `contacts`

**Form Structure:** 4 tabs via `TabbedFormInputs`

**Tab 1: Identity**

| Field Label | Source Field | Input Type | Validation | Default |
|-------------|-------------|------------|------------|---------|
| Avatar | `contacts.avatar` | ImageEditorField | Optional, 10MB max | null |
| First Name * | `contacts.first_name` | TextInput | Required, min 1 char | - |
| Last Name * | `contacts.last_name` | TextInput | Required, min 1 char | - |
| Gender | `contacts.gender` | SelectInput | Optional | null |

**Tab 2: Position**

| Field Label | Source Field | Input Type | References | Default |
|-------------|-------------|------------|------------|---------|
| Title | `contacts.title` | TextInput | - | null |
| Department | `contacts.department` | TextInput | - | null |
| Organization | `contacts.organization_id` | ReferenceInput | `organizations.id` | null |

**Tab 3: Contact Info**

| Field Label | Source Field | Input Type | Validation | Schema |
|-------------|-------------|------------|------------|--------|
| Email Addresses * | `contacts.email` | ArrayInput | Min 1 email, email format | `emailAndTypeSchema` |
| - Email | `email[].email` | TextInput | Email format | - |
| - Type | `email[].type` | SelectInput | Enum: Work, Home, Other | "Work" |
| Phone Numbers | `contacts.phone` | ArrayInput | Optional | `phoneNumberAndTypeSchema` |
| - Number | `phone[].number` | TextInput | String | - |
| - Type | `phone[].type` | SelectInput | Enum: Work, Home, Other | "Work" |
| LinkedIn URL | `contacts.linkedin_url` | TextInput | LinkedIn URL format | null |

**Tab 4: Account**

| Field Label | Source Field | Input Type | References | Default |
|-------------|-------------|------------|------------|---------|
| Account Manager * | `contacts.sales_id` | ReferenceInput | `sales.id` | Current user |
| Notes | `contacts.notes` | TextInput (multiline) | - | null |

**JSONB Array Pattern (Email/Phone):**

**Database Storage:**
```json
// contacts.email (JSONB)
[
  {"email": "john@example.com", "type": "Work"},
  {"email": "john@home.com", "type": "Home"}
]
```

**Zod Sub-Schema:**
```typescript
const emailAndTypeSchema = z.object({
  email: z.string().email(),
  type: z.enum(["Work", "Home", "Other"]).default("Work")
});
```

**CRUD Operations:**

| Operation | Method | Table | Transformations |
|-----------|--------|-------|-----------------|
| **Create** | `create` | `contacts` | JSONB arrays, avatar upload to storage |
| **Update** | `update` | `contacts` | Partial update, JSONB merge |
| **Read (for edit)** | `getOne` | `contacts` | - |

**Validation:** `src/atomic-crm/validation/contacts.ts`
- Create: Requires `first_name`, `last_name`, `email[]` (min 1), `sales_id`
- Update: Partial validation

---

### 1.2 Organizations Module

#### Screen: Organization List (`/organizations`)

**Component:** `src/atomic-crm/organizations/OrganizationList.tsx`

**Primary View:** `organizations_summary`

**Database Entities Used:**

| Entity | Purpose | Join Type | Fields Used |
|--------|---------|-----------|-------------|
| `organizations` | Base org data | Primary | `id`, `name`, `organization_type`, `logo_url`, `parent_organization_id`, `website`, `priority`, `deleted_at` |
| `organizations` (parent) | Parent org name | Self-join | `name` (as `parent_organization_name`) |
| `contacts` | Contact counts | COUNT JOIN | `id` (for `nb_contacts`) |
| `opportunities` | Opp counts | COUNT JOIN | `id` (for `nb_opportunities`) |
| `organizations_summary` | Enriched view | Direct query | All above + `child_branch_count`, `total_contacts_across_branches` |

**Fields Displayed:**

| UI Column | Source | Transform | Notes |
|-----------|--------|-----------|-------|
| Logo | `logo_url` | ImageField | Avatar display |
| Name | `name` | TextField with link | Main identifier |
| Type | `organization_type` | Badge | customer, principal, distributor, prospect, partner, unknown |
| Parent Org | `parent_organization_name` | ReferenceField | From view join |
| Branches | `child_branch_count` | NumberField | Computed in view |
| Contacts | `nb_contacts` | NumberField | Direct contacts only |
| Opportunities | `nb_opportunities` | NumberField | As customer |
| Priority | `priority` | Badge | A, B, C, D |

**Filters:**

| Filter | Target Field | Operator | Transform |
|--------|-------------|----------|-----------|
| Search (q) | `name`, `website`, `city`, `state`, `phone` | `@ilike` | OR across fields |
| Type | `organization_type` | `=` | Direct match |
| **Hierarchy Type** | Computed | Custom | See below |
| Parent Organization | `parent_organization_id` | `=` | Direct match |
| Has Branches | `child_branch_count` | `@gt` 0 | Boolean filter |

**Hierarchy Type Filter Transform:**

| Filter Value | PostgREST Filter | Logic |
|-------------|------------------|-------|
| "all" | (none) | No filter |
| "parent" | `child_branch_count@gt=0` | Has child branches |
| "branch" | `parent_organization_id@not.is=null` | Has parent |
| "standalone" | `parent_organization_id@is=null` AND `child_branch_count@eq=0` | Neither parent nor child |

**CRUD Operations:**

| Operation | Method | Table/View | Notes |
|-----------|--------|-----------|-------|
| **List** | `getList` | `organizations_summary` | Enriched with hierarchy data |
| **Create** | Navigate | `/organizations/create` | - |
| **Edit** | Navigate | `/organizations/:id/edit` | - |
| **Delete** | `delete` | `organizations` | Soft delete, blocked if has children |
| **Export** | `getList` + CSV | `organizations_summary` | - |

---

#### Screen: Organization Detail (`/organizations/:id/show`)

**Component:** `src/atomic-crm/organizations/OrganizationShow.tsx`

**Primary View (Read):** `organizations_summary` - Provides contact/opportunity counts
**Write Target:** `organizations` (base table)

**Database Entities Used:**

| Entity | Purpose | Source Type | Query Pattern |
|--------|---------|-------------|---------------|
| `organizations_summary` | Org record with counts | View (getOne) | `getOne` - includes **`nb_contacts`**, **`nb_opportunities`**, **`last_opportunity_activity`** (view-only fields) |
| `organizations` | Base org data | Table (updates) | All fields |
| `organizations` (parent) | Parent org | Reference | `parent_organization_id` |
| `organizations` (children) | Branch locations | Self-reference | `WHERE parent_organization_id = :id` |
| `contacts_summary` | Associated contacts | 1:N | `WHERE organization_id = :id` |
| `opportunities` | Related opportunities | 1:N | `WHERE customer_organization_id = :id OR principal_organization_id = :id` |
| `activities` | Activity history | 1:N | `WHERE organization_id = :id` |

**View-Only Fields** (available in UI but not in base `organizations` table):
- `nb_contacts` - COUNT of contacts associated with this organization
- `nb_opportunities` - COUNT of opportunities (as customer, principal, or distributor)
- `last_opportunity_activity` - MAX(updated_at) from opportunities

**Header Section:**

| UI Element | Source | Component | Notes |
|------------|--------|-----------|-------|
| Logo | `logo_url` | ImageField | 120x120px avatar |
| Name | `name` | TextField | Primary title |
| Type Badge | `organization_type` | Badge | Colored badge |
| Hierarchy Breadcrumb | `parent_organization_id` | HierarchyBreadcrumb | Organizations > Parent > Current |

**Tab 1: Activity**

| UI Element | Source | Query |
|------------|--------|-------|
| Activity Log | `activities` | `WHERE organization_id = :id ORDER BY activity_date DESC` |

**Tab 2: Contacts** (Count from `organizations_summary.nb_contacts`)

| UI Element | Source | Query | Display |
|------------|--------|-------|---------|
| Contacts Table | `contacts_summary` | `WHERE organization_id = :id AND deleted_at IS NULL` | Avatar, name, title, tags, last activity |
| Add Contact | Navigate | `/contacts/create?organization_id=:id` | Pre-filled form |

**Tab 3: Opportunities** (Count from `organizations_summary.nb_opportunities`)

| UI Element | Source | Query | Display |
|------------|--------|-------|---------|
| Opportunities Table | `opportunities` | `WHERE customer_organization_id = :id AND deleted_at IS NULL` | Name, stage, close date, last activity |
| Add Opportunity | Navigate | `/opportunities/create?customer_organization_id=:id` | Pre-filled form |

**Tab 4: Activities**

| UI Element | Source | Component |
|------------|--------|-----------|
| Activity Timeline | `activities` | ActivitiesTab with filters |

**Hierarchy Sections:**

| Section | Condition | Source | Display |
|---------|-----------|--------|---------|
| Parent Organization | `parent_organization_id IS NOT NULL` | `organizations` | Parent link + sister branches (shared parent) |
| Branch Locations | `child_branch_count > 0` | `organizations` | Table of child branches with add button |

**CRUD Operations:**

| Operation | Method | Source | Notes |
|-----------|--------|--------|-------|
| **Read** | `getOne` | `organizations_summary` (view) | Automatically substituted - includes count fields |
| **Read Children** | `getList` | `organizations` (table) | `filter: { parent_organization_id: id }` |
| **Create Branch** | `create` | `organizations` (table) | `data: { parent_organization_id: :id }` |

---

#### Screen: Organization Create/Edit

**Component:** `OrganizationCreate.tsx`, `OrganizationEdit.tsx`

**Primary Table:** `organizations`

**Form Structure:** 3 tabs

**Tab 1: General**

| Field | DB Column | Input Type | Validation | References |
|-------|-----------|------------|------------|------------|
| Logo | `logo_url` | ImageEditorField | Optional | Supabase storage |
| Name * | `name` | TextInput | Required, min 1 | - |
| Type * | `organization_type` | SelectInput | Required enum | customer, principal, distributor, prospect, partner, unknown |
| Parent Organization | `parent_organization_id` | ParentOrganizationInput | Optional | `organizations` (filtered by type) |
| Description | `description` | TextInput (multiline) | Optional | - |
| Account Manager | `sales_id` | ReferenceInput | Optional | `sales` |

**Parent Organization Validation:**
- Only `distributor`, `customer`, `principal` can be parents
- Max 2 levels (no grandchildren)
- Circular reference prevention

**Tab 2: Details**

| Field | DB Column | Input Type | Validation |
|-------|-----------|------------|------------|
| Segment | `segment_id` | SegmentComboboxInput | UUID or null |
| Priority | `priority` | SelectInput | Enum: A, B, C, D. Default: "C" |
| Phone | `phone` | TextInput | Optional |
| Address | `address` | TextInput | Optional |
| City | `city` | TextInput | Optional |
| Postal Code | `postal_code` | TextInput | Optional |
| State | `state` | TextInput | Optional |

**Tab 3: Other**

| Field | DB Column | Input Type | Validation |
|-------|-----------|------------|------------|
| Website | `website` | TextInput | URL format, http/https REQUIRED |
| LinkedIn | `linkedin_url` | TextInput | LinkedIn URL format |
| Context Links | `context_links` | ArrayInput | JSONB array of URLs |

**CRUD Operations:**

| Operation | Method | Table | Transformations |
|-----------|--------|-------|-----------------|
| **Create** | `create` | `organizations` | Logo upload to storage |
| **Update** | `update` | `organizations` | Partial update |
| **Validate Hierarchy** | Custom | - | Check parent eligibility, depth |

**Validation:** `src/atomic-crm/validation/organizations.ts`
- Only `name` required for create
- URL fields require protocol (http/https)
- Hierarchy rules enforced

---

### 1.3 Opportunities Module

#### Screen: Opportunity List (`/opportunities`)

**Component:** `src/atomic-crm/opportunities/OpportunityList.tsx`

**Primary Table:** `opportunities`

**View Modes:**
1. **Kanban Board** (default) - OpportunityListContent
2. **List View** - OpportunityRowListView
3. **Campaign View** - CampaignGroupedList

**Database Entities Used (Kanban):**

| Entity | Purpose | Join Type | When Fetched |
|--------|---------|-----------|--------------|
| `opportunities` | Base opp data | Primary | `getList` with pagination: null (all) |
| `organizations` (customer) | Customer name | Reference | Per-card reference fetch |
| `organizations` (principal) | Principal name | Reference | Per-card reference fetch |
| `contacts` | Primary contact | Reference | `contact_ids[0]` reference fetch |
| `sales` | Account manager | Reference | Per-card reference fetch |

**Kanban Card Display:**

| UI Element | Source | Component | Transform |
|------------|--------|-----------|-----------|
| Opportunity Name | `name` | TextField | Truncated at 60 chars |
| Customer | `customer_organization_id` | ReferenceField → `organizations.name` | - |
| Primary Contact | `contact_ids[0]` | ReferenceField → `contacts.name` | First contact in array |
| Estimated Close | `estimated_close_date` | DateField | Formatted date |
| Priority Badge | `priority` | Badge | low/medium/high/critical, semantic colors |
| Days in Stage | `stage_changed_at` | Computed | `now() - stage_changed_at` |
| Stuck Badge | `stage_changed_at` | Conditional Badge | Shows if >14 days in stage |

**Kanban Column Grouping:**

| Column | Filter | Opportunities |
|--------|--------|---------------|
| New Lead | `stage = 'new_lead'` | All opps in this stage |
| Initial Outreach | `stage = 'initial_outreach'` | ... |
| Sample Visit Offered | `stage = 'sample_visit_offered'` | ... |
| (etc. for all stages) | - | - |

**Column Header Metrics:**

| Metric | Calculation | Source |
|--------|-------------|--------|
| Count | `opportunities.length` | Client-side |
| Avg Days in Stage | `AVG(now() - stage_changed_at)` | Client-side from `stage_changed_at` |
| Stuck Count | `COUNT(WHERE days_in_stage > 14)` | Client-side |

**Filters:**

| Filter | Target Field | Operator | Notes |
|--------|-------------|----------|-------|
| Stage | `stage` | `@in` | Multi-select |
| Priority | `priority` | `@in` | Multi-select |
| Owner | `opportunity_owner_id` | `=` | Single select |
| Principal | `principal_organization_id` | `=` | Single select |
| Customer | `customer_organization_id` | `=` | Single select |
| Lead Source | `lead_source` | `=` | Single select |
| Campaign | `campaign` | `@ilike` | Text search |

**CRUD Operations:**

| Operation | Method | Table | Notes |
|-----------|--------|-------|-------|
| **List** | `getList` | `opportunities` | `pagination: null` for Kanban |
| **Update Stage** | `update` | `opportunities` | Drag-drop triggers stage update |
| **Quick Add** | `create` | `opportunities` | From column header, pre-fills stage |
| **Delete** | `delete` | `opportunities` | Soft delete |
| **Mark Won** | `update` | `opportunities` | Sets `stage = 'closed_won'` |

**Drag-Drop Flow:**
```
User drags card to new column
  ↓
onDragEnd event captures source/destination
  ↓
dataProvider.update('opportunities', {
  id: oppId,
  data: { stage: newStage },
  previousData: opportunity
})
  ↓
Trigger updates stage_changed_at automatically
  ↓
Optimistic UI update + refetch
```

**Preferences Persistence:**

| Preference | Storage Key | Data |
|------------|-------------|------|
| Collapsed Stages | `opportunity.kanban.collapsed_stages` | Array of stage names |
| Visible Stages | `opportunity.kanban.visible_stages` | Array of stage names |

---

#### Screen: Opportunity Detail (`/opportunities/:id/show`)

**Component:** `src/atomic-crm/opportunities/OpportunityShow.tsx`

**Primary View (Read):** `opportunities_summary` - Provides denormalized org names + products JSONB
**Write Target:** `opportunities` (base table)

**Database Entities Used:**

| Entity | Purpose | Source Type | Fields/Query |
|--------|---------|-------------|--------------|
| `opportunities_summary` | Opp record with enriched data | View (getOne) | All `opportunities` fields + **view-only**: `customer_organization_name`, `principal_organization_name`, `distributor_organization_name`, `products` (JSONB array) |
| `opportunities` | Base opportunity data | Table (updates) | All fields |
| `organizations` (customer) | Customer info | Reference | `customer_organization_id` |
| `organizations` (principal) | Principal info | Reference | `principal_organization_id` |
| `organizations` (distributor) | Distributor info | Reference | `distributor_organization_id` |
| `contacts` | Associated contacts | Array reference | `contact_ids[]` |
| `opportunity_products` | Products discussed (base table) | 1:N | Aggregated into `opportunities_summary.products` JSONB |
| `opportunityNotes` | Notes history | 1:N | `WHERE opportunity_id = :id` |
| `activities` | Activity timeline | 1:N | `WHERE opportunity_id = :id` |

**View-Only Fields** (available in UI but not in base `opportunities` table):
- `customer_organization_name` - Denormalized customer org name from JOIN
- `principal_organization_name` - Denormalized principal org name from JOIN
- `distributor_organization_name` - Denormalized distributor org name from JOIN
- `products` - JSONB array aggregated from `opportunity_products` table (see structure below)

**Tab 1: Details**

| Section | UI Elements | Source | Display |
|---------|------------|--------|---------|
| **Organization Info** | Customer, Principal, Distributor | `organizations` | Cards with logos, names, types |
| **Stage & Dates** | Stage, Priority, Estimated Close, Next Action Date | `opportunities` | Badges + dates |
| **Ownership** | Opportunity Owner, Account Manager | `sales` | ReferenceField |
| **Lead Info** | Lead Source, Campaign | `opportunities` | Text fields |
| **Contacts** | Associated contacts | `contacts` via `contact_ids` | Table with avatars |
| **Products** | Products discussed | `opportunities_summary.products` (JSONB) | Table with product names, categories, principals |
| **Workflow** | Related Opportunity | `opportunities` | Reference link |
| **Metadata** | Created At, Created By | `opportunities` | Timestamps |

**Products Data Structure (from `opportunities_summary.products`):**
```json
[
  {
    "id": 123,
    "product_id_reference": 456,
    "product_name": "Organic Olive Oil",
    "product_category": "Oils",
    "principal_name": "Mediterranean Foods Inc",
    "notes": "Customer prefers 500ml bottles"
  }
]
```

**Tab 2: Notes & Activity**

| Section | Source | Query | Component |
|---------|--------|-------|-----------|
| **Quick Add Activity** | Form → `activities` | INSERT | ActivityNoteForm |
| **Activity Timeline** | `activities` | `WHERE opportunity_id = :id ORDER BY activity_date DESC` | ActivitiesList with filters |
| **Notes** | `opportunityNotes` | `WHERE opportunity_id = :id ORDER BY created_at DESC` | NotesIterator |
| **Add Note** | Form → `opportunityNotes` | INSERT | NoteCreate |

**Activity Filters (Client-Side):**
- Type: Call, Email, Meeting, etc.
- Date Range: Last 7 days, 30 days, 90 days, All
- Created By: Filter by sales rep

**Tab 3: Change Log**

| UI Element | Source | Display |
|------------|--------|---------|
| Change History | Custom audit table/trigger | Field changes over time |

**CRUD Operations:**

| Operation | Method | Source | Notes |
|-----------|--------|--------|-------|
| **Read** | `getOne` | `opportunities_summary` (view) | Automatically substituted - includes org names + products JSONB |
| **Update** | Navigate | `/opportunities/:id/edit` | Opens edit form |
| **Delete** | `delete` | `opportunities` (table) | Soft delete |
| **Create Activity** | `create` | `activities` (table) | Inline creation |
| **Create Note** | `create` | `opportunityNotes` (table) | Inline creation |

---

#### Screen: Opportunity Create/Edit

**Component:** `OpportunityCreate.tsx`, `OpportunityEdit.tsx`

**Primary Table:** `opportunities`

**Related Tables:** `opportunity_products`, `opportunity_contacts`

**Form Structure:** 4 tabs

**Tab 1: General**

| Field | DB Column | Input Type | Validation | Default |
|-------|-----------|------------|------------|---------|
| Name * | `name` | TextInput | Required, min 1 | - |
| Description | `description` | TextInput (multiline) | Optional | - |
| Estimated Close * | `estimated_close_date` | DateInput | Required | +30 days |

**Tab 2: Classification**

| Field | DB Column | Input Type | Validation | Default |
|-------|-----------|------------|------------|---------|
| Stage * | `stage` | SelectInput | Required enum | "new_lead" |
| Priority * | `priority` | SelectInput | Required enum | "medium" |
| Lead Source | `lead_source` | LeadSourceInput | Optional enum | null |

**Tab 3: Relationships**

| Field | DB Column | Input Type | References | Validation |
|-------|-----------|------------|------------|------------|
| Customer Organization * | `customer_organization_id` | ReferenceInput | `organizations` (type: customer) | Required |
| Principal Organization * | `principal_organization_id` | ReferenceInput | `organizations` (type: principal) | Required |
| Distributor Organization | `distributor_organization_id` | ReferenceInput | `organizations` (type: distributor) | Optional |
| Account Manager | `account_manager_id` | ReferenceInput | `sales` | Optional |
| Contacts * | `contact_ids` | ReferenceArrayInput | `contacts` (filtered by customer org) | Min 1 |
| Products * | `products_to_sync` | ArrayInput | See below | Min 1 |

**Products ArrayInput Structure:**

| Subfield | DB Equivalent | Input Type | References | Validation |
|----------|---------------|------------|------------|------------|
| Product | `product_id_reference` | ReferenceInput | `products` (filtered by principal) | Required |
| Notes | `notes` | TextInput | - | Optional |

**Products Sync Flow:**

**Create:**
```typescript
// Form data: products_to_sync = [{ product_id_reference, notes }]
// Transformed to RPC call
await supabase.rpc('sync_opportunity_with_products', {
  opportunity_data: { name, stage, customer_organization_id, ... },
  products_to_create: formData.products_to_sync,
  products_to_update: [],
  product_ids_to_delete: []
})
// Creates opportunity + inserts into opportunity_products atomically
```

**Update:**
```typescript
// Diff algorithm compares previousData.products vs formData.products_to_sync
const { creates, updates, deletes } = diffProducts(originalProducts, formProducts);

await supabase.rpc('sync_opportunity_with_products', {
  opportunity_data: { id, ...changes },
  products_to_create: creates,
  products_to_update: updates,
  product_ids_to_delete: deletes
})
```

**Tab 4: Details**

| Field | DB Column | Input Type | Validation |
|-------|-----------|------------|------------|
| Campaign | `campaign` | TextInput | Max 100 chars |
| Related Opportunity | `related_opportunity_id` | ReferenceInput | `opportunities` |
| Notes | `notes` | TextInput (multiline) | Optional |
| Tags | `tags` | ArrayInput | JSONB array of strings |
| Next Action | `next_action` | TextInput | Optional |
| Next Action Date | `next_action_date` | DateInput | Optional |
| Decision Criteria | `decision_criteria` | TextInput (multiline) | Optional |

**CRUD Operations:**

| Operation | Method | Tables | RPC Function |
|-----------|--------|--------|--------------|
| **Create** | RPC | `opportunities` + `opportunity_products` + `opportunity_contacts` | `sync_opportunity_with_products` |
| **Update** | RPC | `opportunities` + diff products | `sync_opportunity_with_products` |
| **Read (for edit)** | `getOne` | `opportunities_summary` | Includes products JSONB |

**Validation:** `src/atomic-crm/validation/opportunities.ts`
- Required: `name`, `estimated_close_date`, `customer_organization_id`, `principal_organization_id`, `contact_ids` (min 1), `products_to_sync` (min 1)
- Contact filtering: Must belong to customer organization

**Data Transformations:**

| Transform | Input | Output | Purpose |
|-----------|-------|--------|---------|
| Contact IDs Sync | `contact_ids` array | `opportunity_contacts` rows | Junction table sync |
| Products Diff | `products_to_sync` vs `previousData.products` | Creates, updates, deletes arrays | Incremental product sync |
| File Upload | Product image file | Storage URL | Supabase storage |

---

### 1.4 Tasks Module

#### Screen: Task List (`/tasks`)

**Component:** `src/atomic-crm/tasks/TaskList.tsx`

**Primary Table:** `tasks`

**Database Entities Used:**

| Entity | Purpose | Relationship | Query |
|--------|---------|--------------|-------|
| `tasks` | Task records | Primary | `getList` |
| `opportunities` | Linked opportunity | Reference | Via `opportunity_id` |
| `organizations` | Principal org | Via opportunity | `opportunities.principal_organization_id` |
| `contacts` | Linked contact | Reference | Via `contact_id` |

**Grouping Strategy (Client-Side):**

```
1. Fetch tasks: getList('tasks')
2. For tasks with opportunity_id: fetch opportunities
3. For opportunities: fetch principal organizations
4. Group tasks by principal name
5. Display: Principal → Task list
```

**Fields Displayed (Per Task):**

| UI Element | Source | Component | Transform |
|------------|--------|-----------|-----------|
| Complete Checkbox | `completed` | BooleanInput | Toggle triggers UPDATE |
| Title | `title` | TextField with link | Links to task detail |
| Type Badge | `type` | Badge | Call, Email, Meeting, etc. |
| Priority Badge | `priority` | Badge | Semantic colors |
| Due Date | `due_date` | DateField | Relative date if near |
| Principal | Via `opportunities.principal_organization_id` | Computed | Grouping key |
| Opportunity | `opportunity_id` | ReferenceField | Links to opportunity |
| Contact | `contact_id` | ReferenceField | Links to contact |

**Filters:**

| Filter | Target | Operator | Notes |
|--------|--------|----------|-------|
| Principal Organization | Via `opportunity_id → opportunities.principal_organization_id` | Custom | Client-side filter after fetch |
| Due Date Range | `due_date` | `@gte`, `@lte` | Date range |
| Status | `completed` | `=` | Boolean |
| Priority | `priority` | `@in` | Multi-select |
| Type | `type` | `@in` | Multi-select |

**CRUD Operations:**

| Operation | Method | Table | Notes |
|-----------|--------|-------|-------|
| **List** | `getList` | `tasks` | Default sort: `due_date ASC` |
| **Toggle Complete** | `update` | `tasks` | Inline checkbox, sets `completed` + `completed_at` |
| **Create** | Navigate | `/tasks/create` | - |
| **Edit** | Navigate | `/tasks/:id/edit` | - |
| **Delete** | `delete` | `tasks` | Soft delete (admin only) |

**Export:**
```typescript
// Fetches opportunities, organizations for each task
// Groups by principal in CSV output
// Columns: Principal, Task Title, Due Date, Status, Priority, Type
```

---

#### Screen: Task Detail (`/tasks/:id/show`)

**Component:** `src/atomic-crm/tasks/TaskShow.tsx`

**Primary Table:** `tasks`

**Database Entities Used:**

| Entity | Purpose | Relationship |
|--------|---------|--------------|
| `tasks` | Task record | Primary |
| `opportunities` | Linked opportunity | Reference via `opportunity_id` |
| `contacts` | Linked contact | Reference via `contact_id` |
| `sales` | Assignee | Reference via `sales_id` |

**Fields Displayed:**

| UI Element | Source | Component |
|------------|--------|-----------|
| Title | `title` | TextField |
| Description | `description` | TextField |
| Type | `type` | Badge |
| Priority | `priority` | Badge |
| Due Date | `due_date` | DateField |
| Reminder Date | `reminder_date` | DateField |
| Completed | `completed` | BooleanField |
| Opportunity | `opportunity_id` | ReferenceField |
| Contact | `contact_id` | ReferenceField |
| Assigned To | `sales_id` | ReferenceField |

**CRUD Operations:**

| Operation | Method | Table |
|-----------|--------|-------|
| **Read** | `getOne` | `tasks` |
| **Update** | Navigate | `/tasks/:id/edit` |
| **Delete** | `delete` | `tasks` |

---

#### Screen: Task Create/Edit

**Component:** `TaskCreate.tsx`, `TaskEdit.tsx`

**Primary Table:** `tasks`

**Form Structure:** 2 tabs

**Tab 1: General**

| Field | DB Column | Input Type | Validation | Default |
|-------|-----------|------------|------------|---------|
| Title * | `title` | TextInput | Required, min 1, max 500 | - |
| Description | `description` | TextInput (multiline) | Max 2000 chars | - |
| Due Date * | `due_date` | DateInput | Required | Today |
| Reminder Date | `reminder_date` | DateInput | Optional | - |

**Tab 2: Details**

| Field | DB Column | Input Type | References | Default |
|-------|-----------|------------|------------|---------|
| Priority | `priority` | SelectInput | Enum: low, medium, high, critical | "medium" |
| Type | `type` | SelectInput | Enum from config | "None" |
| Opportunity | `opportunity_id` | ReferenceInput | `opportunities` | null |
| Contact | `contact_id` | ReferenceInput | `contacts_summary` | null |

**CRUD Operations:**

| Operation | Method | Table | Notes |
|-----------|--------|-------|-------|
| **Create** | `create` | `tasks` | `sales_id` auto-populated from current user |
| **Update** | `update` | `tasks` | Partial update |

**Validation:** `src/atomic-crm/validation/task.ts`
- Required: `title`, `due_date`
- Defaults: `completed: false`, `priority: "medium"`, `type: "None"`

---

### 1.5 Products Module

#### Screen: Product List (`/products`)

**Component:** `src/atomic-crm/products/ProductList.tsx`

**Primary View:** `products_summary`

**Database Entities Used:**

| Entity | Purpose | Join Type |
|--------|---------|-----------|
| `products` | Base product data | Primary |
| `organizations` (principal) | Principal name | LEFT JOIN |
| `products_summary` | Enriched view | Direct query |

**Fields Displayed:**

| UI Column | Source | Component |
|-----------|--------|-----------|
| Name | `name` | TextField with link |
| SKU | `sku` | TextField |
| Category | `category` | Badge |
| Principal | `principal_name` (from view) | ReferenceField |
| Status | `status` | Badge |

**Filters:**

| Filter | Target | Operator |
|--------|--------|----------|
| Search (q) | `name`, `sku`, `description` | `@ilike` |
| Category | `category` | `=` |
| Principal | `principal_id` | `=` |
| Status | `status` | `=` |

**CRUD Operations:**

| Operation | Method | Table/View |
|-----------|--------|-----------|
| **List** | `getList` | `products_summary` |
| **Create** | Navigate | `/products/create` |
| **Edit** | Navigate | `/products/:id/edit` |
| **Delete** | `delete` | `products` |

---

#### Screen: Product Detail (`/products/:id/show`)

**Component:** `src/atomic-crm/products/ProductShow.tsx`

**Primary View (Read):** `products_summary` - Provides denormalized principal name
**Write Target:** `products` (base table)

**Tab Structure:**

| Tab | Content | Source |
|-----|---------|--------|
| Overview | Key info, stats | `products_summary` (includes **`principal_name`** view-only field) |
| Details | Specifications, relationships | `products_summary` + `organizations` |
| Activity | Usage stats, opportunities | `opportunity_products` |

**View-Only Fields** (available in UI but not in base `products` table):
- `principal_name` - Denormalized principal organization name from LEFT JOIN

**CRUD Operations:**

| Operation | Method | Source |
|-----------|--------|--------|
| **Read** | `getOne` | `products_summary` (view) - automatically substituted |

---

#### Screen: Product Create/Edit

**Component:** `ProductCreate.tsx`, `ProductEdit.tsx`

**Primary Table:** `products`

**Form Structure:** 3 tabs

**Tab 1: General**

| Field | DB Column | Input Type | Validation |
|-------|-----------|------------|------------|
| Name * | `name` | TextInput | Required, min 1 |
| SKU * | `sku` | TextInput | Required, unique |
| Description | `description` | TextInput (multiline) | Optional |

**Tab 2: Relationships**

| Field | DB Column | Input Type | References | Validation |
|-------|-----------|------------|------------|------------|
| Principal * | `principal_id` | ReferenceInput | `organizations` (type: principal) | Required |
| Distributor | `distributor_id` | ReferenceInput | `organizations` (type: distributor) | Optional |

**Tab 3: Classification**

| Field | DB Column | Input Type | Validation | Default |
|-------|-----------|------------|------------|---------|
| Category * | `category` | AutocompleteInput | Required | "beverages" |
| Status * | `status` | SelectInput | Enum: active, discontinued, coming_soon | "active" |

**CRUD Operations:**

| Operation | Method | Table | Notes |
|-----------|--------|-------|-------|
| **Create** | `create` | `products` | - |
| **Update** | `update` | `products` | Partial update |

**Validation:** `src/atomic-crm/validation/products.ts`
- Required: `name`, `sku`, `principal_id`, `category`

---

### 1.6 Sales (Users) Module

#### Screen: Sales List (`/sales`)

**Component:** `src/atomic-crm/sales/SalesList.tsx`

**Primary Table:** `sales`

**Fields Displayed:**

| UI Column | Source | Component | Notes |
|-----------|--------|-----------|-------|
| Avatar | `avatar_url` | Avatar | - |
| Name | `first_name + last_name` | TextField | Computed |
| Email | `email` | EmailField | - |
| Role | `role` | Badge | admin, manager, rep |
| Status | `disabled` | Badge | Active/Disabled |

**Filters:**

| Filter | Target | Operator |
|--------|--------|----------|
| Role | `role` | `=` |
| Status | `disabled` | `=` |

**CRUD Operations:**

| Operation | Method | Table | Notes |
|-----------|--------|-------|-------|
| **List** | `getList` | `sales` | - |
| **Create** | Navigate | `/sales/create` | Admin only |
| **Edit** | Navigate | `/sales/:id/edit` | Admin only |
| **Delete** | Not available | - | Users are disabled, not deleted |

**Note:** No Show view for Sales resource (List/Edit/Create only)

---

#### Screen: Sales Edit/Create

**Component:** `SalesEdit.tsx`, `SalesCreate.tsx`

**Primary Table:** `sales`

**Form Structure:** 2 tabs

**Tab 1: General**

| Field | DB Column | Input Type | Validation |
|-------|-----------|------------|------------|
| First Name * | `first_name` | TextInput | Required, min 1 |
| Last Name * | `last_name` | TextInput | Required, min 1 |
| Email * | `email` | TextInput | Required, email format, unique |

**Tab 2: Permissions**

| Field | DB Column | Input Type | Validation | Notes |
|-------|-----------|------------|------------|-------|
| Role | `role` | SelectInput | Enum: admin, manager, rep | Default: "rep". Disabled if editing self |
| Disabled | `disabled` | BooleanInput | Boolean | Default: false. Disabled if editing self |

**CRUD Operations:**

| Operation | Method | Table | Notes |
|-----------|--------|-------|-------|
| **Create** | `create` | `sales` | Triggers auth user creation |
| **Update** | `update` | `sales` | Cannot change own role/status |

**Validation:** `src/atomic-crm/validation/sales.ts`
- Required: `first_name`, `last_name`, `email`
- Role system: `role` (admin/manager/rep) is primary field
  - `is_admin` deprecated (synced from role via trigger)
  - `administrator` computed column (read-only)

---

### 1.7 Dashboard V2

#### Screen: Principal Dashboard V2 (`/`)

**Component:** `src/atomic-crm/dashboard/v2/PrincipalDashboardV2.tsx`

**Layout:** 3-column resizable grid + collapsible filter sidebar

**Database Entities Used:**

| Entity/View | Purpose | Component | Query |
|-------------|---------|-----------|-------|
| `principal_opportunities` | Opportunities with health | OpportunitiesHierarchy | `getList` with client-side filtering |
| `priority_tasks` | High-priority tasks | TasksPanel | `getList` |
| `organizations` | Principal list | Filters | For principal selector |
| `sales` | Sales reps | Filters | For assignee filter |

**Column 1: Opportunities Hierarchy**

**Data Source:** `principal_opportunities` view

**View Definition:**
```sql
CREATE VIEW principal_opportunities AS
SELECT
  o.id as opportunity_id,
  o.name as opportunity_name,
  o.stage,
  o.estimated_close_date,
  o.customer_organization_id,
  org.name as customer_name,
  p.id as principal_id,
  p.name as principal_name,
  -- Health calculation
  CASE
    WHEN days_since_activity < 7 THEN 'active'
    WHEN days_since_activity < 14 THEN 'cooling'
    ELSE 'at_risk'
  END as health_status
FROM opportunities o
JOIN organizations org ON o.customer_organization_id = org.id
JOIN organizations p ON o.principal_organization_id = p.id
WHERE o.deleted_at IS NULL
  AND p.organization_type = 'principal'
```

**Fields Used:**

| Field | Display | Component |
|-------|---------|-----------|
| `principal_name` | Grouping level 1 | Tree node |
| `customer_name` | Grouping level 2 | Tree node |
| `opportunity_name` | Leaf node | Link to opportunity |
| `stage` | Badge | Stage badge |
| `estimated_close_date` | Date | Formatted date |
| `health_status` | Icon | Active (green), Cooling (yellow), At Risk (red) |

**Client-Side Filters Applied:**

| Filter | Field | Logic |
|--------|-------|-------|
| Health Status | `health_status` | `@in` (multi-select checkboxes) |
| Stages | `stage` | `@in` (multi-select checkboxes) |
| Assignee | `account_manager_id` | `=` (All Team / Assigned to Me / Specific rep) |
| Last Touch | `days_since_activity` | `@lte` (7d / 14d / any) |
| Show Closed | `stage` | Exclude `closed_won`, `closed_lost` if false |

**Column 2: Tasks Panel**

**Data Source:** `priority_tasks` view

**View Definition:**
```sql
CREATE VIEW priority_tasks AS
SELECT
  t.id as task_id,
  t.title as task_title,
  t.due_date,
  t.priority,
  t.type as task_type,
  t.completed,
  o.name as opportunity_name,
  org.name as customer_name,
  p.name as principal_name,
  c.name as contact_name
FROM tasks t
LEFT JOIN opportunities o ON t.opportunity_id = o.id
LEFT JOIN organizations org ON o.customer_organization_id = org.id
LEFT JOIN organizations p ON o.principal_organization_id = p.id
LEFT JOIN contacts c ON t.contact_id = c.id
WHERE t.completed = false
  AND (t.due_date <= CURRENT_DATE + INTERVAL '7 days' OR t.priority IN ('high', 'critical'))
```

**Grouping Modes (Client-Side):**

| Mode | Grouping Logic |
|------|----------------|
| By Due Date | Today, Tomorrow, This Week, Later |
| By Priority | Critical, High, Medium, Low |
| By Principal | `principal_name` |

**Column 3: Quick Logger**

**Data Sources:**

| Entity | Purpose | Operation |
|--------|---------|-----------|
| `opportunities` | Select opportunity | Reference input |
| `activities` | Log activity | `create` |
| `tasks` | Optional follow-up | `create` |

**Create Activity Flow:**
```
User fills form
  ↓
dataProvider.create('activities', {
  opportunity_id: selectedOppId,
  type: activityType,
  subject: subject,
  description: description,
  activity_date: now(),
  created_by: currentUserId
})
  ↓
If "Create follow-up task" checked:
  dataProvider.create('tasks', {
    opportunity_id: selectedOppId,
    title: followUpTitle,
    due_date: followUpDate
  })
```

**Right Slide-Over**

**Trigger:** Click opportunity in hierarchy

**Tabs:**

| Tab | Data Source | Query |
|-----|-------------|-------|
| Details | `opportunities` | `getOne` for selected opportunity |
| History | `activities` | `WHERE opportunity_id = :id` |
| Files | Attachments | Custom file query |

**Filter Sidebar**

**Filters:**

| Filter | UI Component | Target | Values |
|--------|-------------|--------|--------|
| Health Status | Checkboxes | `principal_opportunities.health_status` | active, cooling, at_risk |
| Stages | 2-column grid checkboxes | `principal_opportunities.stage` | All opportunity stages |
| Assignee | Dropdown | `principal_opportunities.account_manager_id` | All Team, Assigned to Me, Specific rep |
| Last Touch | Dropdown | `principal_opportunities.days_since_activity` | Any, 7 days, 14 days |
| Show Closed | Toggle | `principal_opportunities.stage` | Include/exclude closed_won, closed_lost |

**Persistence (localStorage):**

| Key | Data | Component |
|-----|------|-----------|
| `pd.filters` | FilterState object | usePrefs |
| `pd.sidebarOpen` | Boolean | usePrefs |
| `pd.columnWidths` | Array of percentages | useResizableColumns |

**CRUD Operations:**

| Operation | Method | Table/View | Notes |
|-----------|--------|-----------|-------|
| **Read Opportunities** | `getList` | `principal_opportunities` | Client-side filter on health, stage, assignee |
| **Read Tasks** | `getList` | `priority_tasks` | Pre-filtered for high-priority |
| **Create Activity** | `create` | `activities` | Quick logger |
| **Create Task** | `create` | `tasks` | Follow-up task |
| **Update Opportunity** | Navigate | `/opportunities/:id/edit` | From slide-over |

---

### 1.8 Reports Module

#### Screen: Opportunities by Principal Report

**Component:** `src/atomic-crm/reports/OpportunitiesByPrincipalReport.tsx`

**Primary View:** `dashboard_principal_summary`

**Database Entities Used:**

| Entity/View | Purpose |
|-------------|---------|
| `dashboard_principal_summary` | Aggregated principal metrics |

**Data Displayed:**

| Column | Source | Calculation |
|--------|--------|-------------|
| Principal | `principal_name` | From view |
| Active Opps | `active_opportunities` | COUNT WHERE stage NOT IN (closed_won, closed_lost) |
| Won Opps | `won_opportunities` | COUNT WHERE stage = closed_won |
| Total Opps | `opportunity_count` | COUNT all opportunities |
| Weekly Activities | `weekly_activity_count` | COUNT activities in last 7 days |
| Assigned Reps | `assigned_reps` | ARRAY_AGG distinct sales reps |

**CRUD Operations:**

| Operation | Method | View |
|-----------|--------|------|
| **Read** | `getList` | `dashboard_principal_summary` |
| **Export CSV** | `getList` + CSV | `dashboard_principal_summary` |

---

#### Screen: Weekly Activity Summary Report

**Component:** `src/atomic-crm/reports/WeeklyActivitySummary.tsx`

**Data Sources:**

| Entity | Purpose | Query |
|--------|---------|-------|
| `activities` | Activity records | `WHERE activity_date >= NOW() - INTERVAL '7 days'` |
| `tasks` | Task records | `WHERE created_at >= NOW() - INTERVAL '7 days'` |
| `opportunities` | Linked opportunities | Via `opportunity_id` |
| `organizations` | Principal orgs | Via `opportunities.principal_organization_id` |
| `sales` | Sales reps | Via `created_by` |

**Grouping (Client-Side):**

```
1. Fetch activities + tasks for last 7 days
2. Join to opportunities → organizations (principals)
3. Group by: Sales Rep → Principal → Activity Type
4. Calculate counts per principal
5. Flag low-activity principals (<3 activities/week)
```

**Data Displayed:**

| Column | Source | Calculation |
|--------|--------|-------------|
| Sales Rep | `activities.created_by` | Sales name |
| Principal | Via `opportunities.principal_organization_id` | Org name |
| Calls | `activities.type = 'call'` | COUNT |
| Emails | `activities.type = 'email'` | COUNT |
| Meetings | `activities.type = 'meeting'` | COUNT |
| Total Activities | All activities | COUNT |
| Warning Flag | Total < 3 | Boolean |

**CRUD Operations:**

| Operation | Method | Tables |
|-----------|--------|--------|
| **Read Activities** | `getList` | `activities` |
| **Read Tasks** | `getList` | `tasks` |
| **Export CSV** | Client-side CSV | Grouped data |

---

## Section 2: Entities to Screens Mapping

This section maps database tables to the UI screens that use them.

---

### 2.1 Core Tables

#### Table: `sales`

**Purpose:** Sales representatives (CRM users)

**Used By Screens:**

| Screen | Usage | Access Type | Fields Used |
|--------|-------|-------------|-------------|
| Sales List | Primary data | Read, Create, Edit | All fields |
| Sales Edit/Create | Form | Read, Write | `first_name`, `last_name`, `email`, `role`, `disabled` |
| Contact Create/Edit | Account manager selector | Reference | `id`, `name` |
| Organization Create/Edit | Account manager selector | Reference | `id`, `name` |
| Opportunity Create/Edit | Owner/manager selector | Reference | `id`, `name` |
| Task Create/Edit | Assignee (auto-populated) | Reference | `id`, `name` |
| Contact Show (Notes) | Created by | Reference | `id`, `name` |
| Organization Show (Activities) | Created by | Reference | `id`, `name` |
| Dashboard V2 Filters | Assignee filter | Reference | `id`, `name` |

**Key Fields:**

| Field | Screens | Display |
|-------|---------|---------|
| `id` | All | Primary key for references |
| `user_id` | Internal | UUID linking to auth.users (nullable for legacy records) |
| `first_name`, `last_name` | All | Combined as full name |
| `email` | Sales List, Edit | Email display/input |
| `role` | Sales List, Edit | Badge (admin/manager/rep) - **PRIMARY FIELD** |
| `is_admin` | Deprecated | Boolean - synced from role via trigger, kept for backward compatibility |
| `administrator` | Read-only | GENERATED ALWAYS column: `(role = 'admin')` |
| `disabled` | Sales List, Edit | Status badge |
| `avatar_url` | Sales List | Avatar image |

**CRUD Screens:**
- **Create:** Sales Create (`/sales/create`)
- **Read:** Sales List (`/sales`)
- **Update:** Sales Edit (`/sales/:id/edit`)
- **Delete:** Not available (users are disabled, not deleted)

---

#### Table: `organizations`

**Purpose:** Companies (customers, principals, distributors, prospects, partners)

**Used By Screens:**

| Screen | Usage | Access Type | Fields Used |
|--------|-------|-------------|-------------|
| Organization List | Primary data | Read, Create, Edit, Delete | All fields |
| Organization Show | Detail view | Read | All fields |
| Organization Create/Edit | Form | Read, Write | All fields |
| Contact Create/Edit | Organization selector | Reference | `id`, `name`, `organization_type` |
| Opportunity Create/Edit | Customer/principal/distributor selector | Reference | `id`, `name`, `organization_type` |
| Product Create/Edit | Principal/distributor selector | Reference | `id`, `name`, `organization_type` |
| Dashboard V2 | Principal selector, hierarchy | Reference | `id`, `name` |
| Reports | Principal grouping | Reference | `id`, `name` |

**Key Fields:**

| Field | Screens | Display/Usage |
|-------|---------|---------------|
| `id` | All | Primary key |
| `name` | All | Organization name |
| `organization_type` | All | Type badge, filter |
| `parent_organization_id` | Org List, Show | Hierarchy navigation |
| `segment_id` | Org Edit | UUID reference to segments table (market segment classification) |
| `logo_url` | Org List, Show | Avatar/logo display |
| `priority` | Org List | Badge (A/B/C/D) |
| `website` | Org Show | Clickable link |
| `phone` | Org Show | Contact info |
| `updated_by` | Internal | Sales rep who last updated this record |

**CRUD Screens:**
- **Create:** Organization Create (`/organizations/create`)
- **Read:** Organization List (`/organizations`), Organization Show (`/organizations/:id/show`)
- **Update:** Organization Edit (`/organizations/:id/edit`)
- **Delete:** Organization List (soft delete button)

---

#### Table: `contacts`

**Purpose:** Individual people associated with organizations

**Used By Screens:**

| Screen | Usage | Access Type | Fields Used |
|--------|-------|-------------|-------------|
| Contact List | Primary data | Read, Create, Edit, Delete | All fields |
| Contact Show | Detail view | Read | All fields |
| Contact Create/Edit | Form | Read, Write | All fields |
| Opportunity Create/Edit | Contact selector (multi) | Reference | `id`, `name`, `organization_id` |
| Task Create/Edit | Contact link | Reference | `id`, `name` |
| Organization Show (Contacts Tab) | Related contacts | ReferenceManyField | `id`, `name`, `title`, `avatar`, `tags`, `last_seen` |
| Activity forms | Contact association | Reference | `id`, `name` |

**Key Fields:**

| Field | Screens | Display/Usage |
|-------|---------|---------------|
| `id` | All | Primary key |
| `first_name`, `last_name`, `name` | All | Full name display |
| `email` | Contact List, Show, Edit | **JSONB array** `[{email, type}]` |
| `phone` | Contact List, Show, Edit | **JSONB array** `[{number, type}]` |
| `organization_id` | Contact List, Show, Edit | Primary organization |
| `avatar` | Contact List, Show | Avatar image |
| `title` | Contact List, Show | Job title |
| `tags` | Contact List, Show | Array of tag IDs |
| `sales_id` | Contact List, Edit | Account manager |

**JSONB Array Pattern:**

**Fields:** `email`, `phone`

**Structure:**
```json
// email field
[
  {"email": "john@example.com", "type": "Work"},
  {"email": "john@home.com", "type": "Home"}
]

// phone field
[
  {"number": "+1-555-1234", "type": "Work"},
  {"number": "+1-555-5678", "type": "Mobile"}
]
```

**UI Display:** ArrayInput with SimpleFormIterator

**CRUD Screens:**
- **Create:** Contact Create (`/contacts/create`)
- **Read:** Contact List (`/contacts`), Contact Show (`/contacts/:id/show`)
- **Update:** Contact Edit (`/contacts/:id/edit`)
- **Delete:** Contact List (soft delete button)

---

#### Table: `opportunities`

**Purpose:** Sales opportunities/deals in the pipeline

**Used By Screens:**

| Screen | Usage | Access Type | Fields Used |
|--------|-------|-------------|-------------|
| Opportunity List (Kanban) | Primary data | Read, Update (stage), Delete | All fields |
| Opportunity Show | Detail view | Read | All fields |
| Opportunity Create/Edit | Form | Read, Write | All fields |
| Organization Show (Opportunities Tab) | Related opportunities | ReferenceManyField | `id`, `name`, `stage`, `estimated_close_date` |
| Task Create/Edit | Opportunity link | Reference | `id`, `name` |
| Dashboard V2 (Opportunities) | Hierarchy display | Read (via view) | `id`, `name`, `stage`, `customer_organization_id`, `principal_organization_id` |

**Key Fields:**

| Field | Screens | Display/Usage |
|-------|---------|---------------|
| `id` | All | Primary key |
| `name` | All | Opportunity name |
| `stage` | Kanban, Dashboard | Stage badge, column grouping |
| `priority` | Kanban, Show | Priority badge (semantic colors) |
| `customer_organization_id` | All | **Required** customer reference |
| `principal_organization_id` | All | **Required** principal reference |
| `distributor_organization_id` | Show, Edit | Optional distributor |
| `estimated_close_date` | Kanban, Show, Edit | Date display |
| `contact_ids` | Show, Edit | Array of contact IDs |
| `account_manager_id` | Show, Edit | Sales rep reference |
| `stage_changed_at` | Kanban | Days in stage calculation |
| `campaign` | Edit, Reports | Text field for campaign/marketing source tracking |
| `lead_source` | Edit | Text field for lead origin tracking |
| `updated_by` | Internal | Sales rep who last updated this record |

**CRUD Screens:**
- **Create:** Opportunity Create (`/opportunities/create`)
- **Read:** Opportunity List (`/opportunities`), Opportunity Show (`/opportunities/:id/show`)
- **Update:** Opportunity Edit (`/opportunities/:id/edit`), Kanban drag-drop (stage only)
- **Delete:** Opportunity List, Kanban (soft delete button)

---

#### Table: `tasks`

**Purpose:** To-do items assigned to sales reps

**Used By Screens:**

| Screen | Usage | Access Type | Fields Used |
|--------|-------|-------------|-------------|
| Task List | Primary data | Read, Update (complete), Delete | All fields |
| Task Show | Detail view | Read | All fields |
| Task Create/Edit | Form | Read, Write | All fields |
| Dashboard V2 (Tasks Panel) | High-priority tasks | Read (via view) | `id`, `title`, `due_date`, `priority`, `type`, `completed` |
| Quick Logger | Follow-up task creation | Create | `title`, `due_date`, `opportunity_id` |

**Key Fields:**

| Field | Screens | Display/Usage |
|-------|---------|---------------|
| `id` | All | Primary key |
| `title` | All | Task title |
| `due_date` | All | Date display, sorting |
| `completed` | Task List, Dashboard | Checkbox, filter |
| `completed_at` | Task Show | Completion timestamp |
| `priority` | All | Badge (low/medium/high/critical) |
| `type` | All | Badge (Call, Email, Meeting, etc.) |
| `opportunity_id` | Task List, Show, Edit | Opportunity link |
| `contact_id` | Task Show, Edit | Contact link |
| `sales_id` | Task List (RLS) | Task ownership |
| `overdue_notified_at` | Internal | Timestamp when overdue notification was sent (prevents duplicate notifications) |

**CRUD Screens:**
- **Create:** Task Create (`/tasks/create`), Dashboard V2 Quick Logger
- **Read:** Task List (`/tasks`), Task Show (`/tasks/:id/show`), Dashboard V2
- **Update:** Task Edit (`/tasks/:id/edit`), Task List (inline complete toggle)
- **Delete:** Task List (soft delete, admin only)

---

#### Table: `products`

**Purpose:** Product catalog (no pricing)

**Used By Screens:**

| Screen | Usage | Access Type | Fields Used |
|--------|-------|-------------|-------------|
| Product List | Primary data | Read, Create, Edit, Delete | All fields |
| Product Show | Detail view | Read | All fields |
| Product Create/Edit | Form | Read, Write | All fields |
| Opportunity Create/Edit | Product selector (multi) | Reference | `id`, `name`, `category`, `principal_id` |
| Opportunity Show (Products Table) | Associated products | Via `opportunity_products` | `id`, `name`, `category` |

**Key Fields:**

| Field | Screens | Display/Usage |
|-------|---------|---------------|
| `id` | All | Primary key |
| `name` | All | Product name |
| `sku` | Product List, Show | SKU identifier |
| `category` | Product List, Show | Category badge |
| `principal_id` | Product List, Show, Edit | Principal organization reference |
| `distributor_id` | Product Show, Edit | Optional distributor |
| `status` | Product List, Show | Status badge (active/discontinued/coming_soon) |

**CRUD Screens:**
- **Create:** Product Create (`/products/create`)
- **Read:** Product List (`/products`), Product Show (`/products/:id/show`)
- **Update:** Product Edit (`/products/:id/edit`)
- **Delete:** Product List (soft delete button)

---

#### Table: `activities`

**Purpose:** Engagement log (calls, emails, meetings, etc.)

**Used By Screens:**

| Screen | Usage | Access Type | Fields Used |
|--------|-------|-------------|-------------|
| Contact Show (Activities Tab) | Activity timeline | Read | `id`, `type`, `subject`, `description`, `activity_date` |
| Organization Show (Activities Tab) | Activity timeline | Read | `id`, `type`, `subject`, `description`, `activity_date` |
| Opportunity Show (Notes & Activity Tab) | Activity timeline | Read, Create | All fields |
| Dashboard V2 (Quick Logger) | Activity creation | Create | All fields |
| Dashboard V2 (Slide-Over History) | Activity timeline | Read | `id`, `type`, `subject`, `activity_date` |
| Reports (Weekly Activity) | Activity counts | Read | `type`, `activity_date`, `opportunity_id`, `created_by` |

**Key Fields:**

| Field | Screens | Display/Usage |
|-------|---------|---------------|
| `id` | All | Primary key |
| `activity_type` | All | engagement vs interaction |
| `type` | All | Badge (Call, Email, Meeting, etc.) |
| `subject` | All | Activity title |
| `description` | Show views | Activity details |
| `activity_date` | All | Date/time display |
| `contact_id` | Timelines | Contact link (optional) |
| `organization_id` | Timelines | Organization link (optional) |
| `opportunity_id` | Timelines, Reports | Opportunity link (required for interactions) |
| `created_by` | All | Sales rep who logged it |

**CRUD Screens:**
- **Create:** Opportunity Show (inline form), Dashboard V2 Quick Logger
- **Read:** Contact/Organization/Opportunity Show (Activities Tab), Dashboard V2 Slide-Over
- **Update:** Not typically edited
- **Delete:** Admin only

---

### 2.2 Junction Tables

#### Table: `opportunity_contacts`

**Purpose:** Many-to-many relationship between opportunities and contacts

**Used By Screens:**

| Screen | Usage | Access Type |
|--------|-------|-------------|
| Opportunity Create/Edit | Contact association | Write (via RPC) |
| Opportunity Show (Details Tab) | Display associated contacts | Read |

**Key Fields:**

| Field | Usage |
|-------|-------|
| `opportunity_id` | FK to opportunities |
| `contact_id` | FK to contacts |
| `role` | Contact's role in opportunity |
| `is_primary` | Primary contact flag |
| `notes` | Contact-specific notes |

**Note:** Also maintained via `opportunities.contact_ids` array for backward compatibility

---

#### Table: `opportunity_products`

**Purpose:** Products discussed in opportunities (junction table)

**Used By Screens:**

| Screen | Usage | Access Type |
|--------|-------|-------------|
| Opportunity Create/Edit | Product association | Write (via RPC) |
| Opportunity Show (Details Tab) | Products table | Read (via `opportunities_summary.products` JSONB) |

**Key Fields:**

| Field | Usage |
|-------|-------|
| `opportunity_id` | FK to opportunities |
| `product_id_reference` | FK to products |
| `product_name` | Denormalized product name |
| `product_category` | Denormalized category |
| `notes` | Product-specific notes |

**Data Flow:**
```
Form: products_to_sync ArrayInput
  ↓
RPC: sync_opportunity_with_products
  ↓
Diff: Creates, updates, deletes
  ↓
opportunity_products table INSERT/UPDATE/DELETE
  ↓
View: opportunities_summary.products (JSONB aggregation)
  ↓
Display: Products table in OpportunityShow
```

---

#### Table: `opportunity_participants`

**Purpose:** Organizations participating in opportunities (customer, principal, distributor, competitor)

**Used By Screens:**

| Screen | Usage | Access Type |
|--------|-------|-------------|
| Opportunity Create/Edit | Organization roles | Write |
| Opportunity Show | Display organization participants | Read |

**Key Fields:**

| Field | Usage |
|-------|-------|
| `opportunity_id` | FK to opportunities |
| `organization_id` | FK to organizations |
| `role` | Enum: customer, principal, distributor, competitor |
| `is_primary` | Primary participant flag |
| `notes` | Role-specific notes |
| `created_by` | Sales rep who added this participant |
| `deleted_at` | Soft delete timestamp |

---

#### Table: `interaction_participants`

**Purpose:** Contacts/organizations involved in activity interactions

**Used By Screens:**

| Screen | Usage | Access Type |
|--------|-------|-------------|
| Activity Create/Edit | Multi-participant tracking | Write |
| Activity Show | Display all participants | Read |

**Key Fields:**

| Field | Usage |
|-------|-------|
| `activity_id` | FK to activities |
| `contact_id` | FK to contacts (nullable) |
| `organization_id` | FK to organizations (nullable) |
| `role` | Participant role (default: 'participant') |
| `notes` | Participant-specific notes |
| `deleted_at` | Soft delete timestamp |

**Constraint:** Must have either `contact_id` OR `organization_id` (not both null)

---

### 2.3 Lookup Tables

#### Table: `segments`

**Purpose:** Market segment classification for organizations

**Used By Screens:**

| Screen | Usage | Access Type |
|--------|-------|-------------|
| Organization Create/Edit | Segment selector | Read, Create (via autocomplete) |
| Organization filters | Segment filter dropdown | Read |

**Key Fields:**

| Field | Usage |
|-------|-------|
| `id` | UUID primary key |
| `name` | Segment name (unique, case-insensitive) |
| `created_at` | Timestamp |
| `created_by` | UUID linking to auth.users |
| `deleted_at` | Soft delete timestamp |

**RPC Function:** `get_or_create_segment(p_name TEXT)` - Returns segment by name or creates if doesn't exist

---

#### Table: `tags`

**Purpose:** Flexible tagging system for contacts

**Used By Screens:**

| Screen | Usage | Access Type |
|--------|-------|-------------|
| Contact List | Filter by tags | Read |
| Contact Show/Edit | Tag display and selection | Read, Write |

**Key Fields:**

| Field | Usage |
|-------|-------|
| `id` | BIGINT primary key |
| `name` | Tag name (unique) |
| `color` | Tag color (default: 'blue-500') |
| `description` | Optional tag description |
| `usage_count` | Auto-updated count of contacts using this tag |
| `created_at` | Timestamp |
| `updated_at` | Timestamp |
| `deleted_at` | Soft delete timestamp |

**Usage Pattern:** Contact tags stored as BIGINT array in `contacts.tags` field

---

### 2.5 Notes Tables

#### Table: `contactNotes`

**Purpose:** Notes specific to contacts

**Used By Screens:**

| Screen | Usage | Access Type |
|--------|-------|-------------|
| Contact Show (Notes Tab) | Notes list | Read, Create |

**Key Fields:**

| Field | Usage |
|-------|-------|
| `contact_id` | FK to contacts |
| `text` | Note content |
| `created_by` | Sales rep |
| `created_at` | Timestamp |

---

#### Table: `opportunityNotes`

**Purpose:** Notes specific to opportunities

**Used By Screens:**

| Screen | Usage | Access Type |
|--------|-------|-------------|
| Opportunity Show (Notes & Activity Tab) | Notes list | Read, Create |

**Key Fields:**

| Field | Usage |
|-------|-------|
| `opportunity_id` | FK to opportunities |
| `text` | Note content |
| `created_by` | Sales rep |
| `created_at` | Timestamp |

---

### 2.6 Database Views

#### View: `contacts_summary`

**Purpose:** Contacts with denormalized organization name

**SQL:**
```sql
SELECT c.*, o.name AS company_name
FROM contacts c
LEFT JOIN organizations o ON c.organization_id = o.id
WHERE c.deleted_at IS NULL
```

**Used By Screens:**

| Screen | Usage |
|--------|-------|
| Contact List | Primary data source |
| Contact export | CSV export |
| Opportunity Edit | Contact selector (filtered by customer org) |

**Added Fields:**
- `company_name` (from organizations.name)

---

#### View: `organizations_summary`

**Purpose:** Organizations with hierarchy rollups and counts

**SQL:**
```sql
SELECT
  o.*,
  parent.name AS parent_organization_name,
  COUNT(children) AS child_branch_count,
  COUNT(contacts) AS nb_contacts,
  COUNT(opportunities) AS nb_opportunities
FROM organizations o
LEFT JOIN organizations parent ON o.parent_organization_id = parent.id
LEFT JOIN organizations children ON children.parent_organization_id = o.id
LEFT JOIN contacts ON contacts.organization_id = o.id
LEFT JOIN opportunities ON opportunities.customer_organization_id = o.id
WHERE o.deleted_at IS NULL
GROUP BY o.id, parent.name
```

**Used By Screens:**

| Screen | Usage |
|--------|-------|
| Organization List | Primary data source |
| Organization Show | Counts for tabs |

**Added Fields:**
- `parent_organization_name`
- `child_branch_count`
- `total_contacts_across_branches`
- `total_opportunities_across_branches`
- `nb_contacts`
- `nb_opportunities`

---

#### View: `opportunities_summary`

**Purpose:** Opportunities with denormalized org names and products array

**SQL:**
```sql
SELECT
  o.*,
  cust.name AS customer_organization_name,
  prin.name AS principal_organization_name,
  dist.name AS distributor_organization_name,
  (SELECT jsonb_agg(...) FROM opportunity_products) AS products
FROM opportunities o
LEFT JOIN organizations cust ON o.customer_organization_id = cust.id
LEFT JOIN organizations prin ON o.principal_organization_id = prin.id
LEFT JOIN organizations dist ON o.distributor_organization_id = dist.id
```

**Used By Screens:**

| Screen | Usage |
|--------|-------|
| Opportunity Edit | Products data (via `meta.select`) |
| Opportunity Show | Products table display |

**Added Fields:**
- `customer_organization_name`
- `principal_organization_name`
- `distributor_organization_name`
- `products` (JSONB array with all product details)

---

#### View: `products_summary`

**Purpose:** Products with principal name

**SQL:**
```sql
SELECT p.*, po.name AS principal_name
FROM products p
LEFT JOIN organizations po ON p.principal_id = po.id
```

**Used By Screens:**

| Screen | Usage |
|--------|-------|
| Product List | Primary data source |
| Product selectors | Dropdowns with principal info |

**Added Fields:**
- `principal_name`

---

#### View: `principal_opportunities`

**Purpose:** Dashboard V2 - opportunities with health status

**SQL:**
```sql
SELECT
  o.id,
  o.name,
  o.stage,
  org.name AS customer_name,
  p.name AS principal_name,
  CASE
    WHEN days_since_activity < 7 THEN 'active'
    WHEN days_since_activity < 14 THEN 'cooling'
    ELSE 'at_risk'
  END AS health_status
FROM opportunities o
JOIN organizations org ON o.customer_organization_id = org.id
JOIN organizations p ON o.principal_organization_id = p.id
WHERE p.organization_type = 'principal'
```

**Used By Screens:**

| Screen | Usage |
|--------|-------|
| Dashboard V2 (Opportunities Hierarchy) | Primary data source |

**Added Fields:**
- `customer_name`
- `principal_name`
- `days_since_activity` (calculated)
- `health_status` ('active' | 'cooling' | 'at_risk')

---

#### View: `priority_tasks`

**Purpose:** Dashboard V2 - high-priority and near-due tasks

**SQL:**
```sql
SELECT
  t.*,
  o.name AS opportunity_name,
  org.name AS customer_name,
  p.name AS principal_name,
  c.name AS contact_name
FROM tasks t
LEFT JOIN opportunities o ON t.opportunity_id = o.id
LEFT JOIN organizations org ON o.customer_organization_id = org.id
LEFT JOIN organizations p ON o.principal_organization_id = p.id
LEFT JOIN contacts c ON t.contact_id = c.id
WHERE t.completed = false
  AND (t.due_date <= CURRENT_DATE + INTERVAL '7 days' OR t.priority IN ('high', 'critical'))
```

**Used By Screens:**

| Screen | Usage |
|--------|-------|
| Dashboard V2 (Tasks Panel) | Primary data source |

**Added Fields:**
- `opportunity_name`
- `customer_name`
- `principal_name`
- `contact_name`

---

#### View: `dashboard_principal_summary`

**Purpose:** Principal-centric dashboard metrics

**Used By Screens:**

| Screen | Usage |
|--------|-------|
| Opportunities by Principal Report | Primary data source |
| Dashboard widgets (legacy) | Metrics display |

**Added Fields:**
- `principal_name`
- `opportunity_count`
- `active_opportunities`
- `won_opportunities`
- `weekly_activity_count`
- `assigned_reps`

---

#### View: `campaign_choices`

**Purpose:** Distinct campaign values for filter dropdowns

**SQL:**
```sql
SELECT campaign AS id,
       campaign AS name,
       COUNT(*) AS opportunity_count
FROM opportunities
WHERE campaign IS NOT NULL
  AND campaign <> ''
  AND deleted_at IS NULL
GROUP BY campaign
ORDER BY campaign
```

**Used By Screens:**

| Screen | Usage |
|--------|-------|
| Opportunity filters | Campaign dropdown options |
| Reports | Campaign grouping |

**Added Fields:**
- `id` (campaign name)
- `name` (campaign name)
- `opportunity_count` (number of opportunities using this campaign)

**Note:** Returns campaign as both `id` and `name` for React Admin compatibility

---

#### View: `distinct_product_categories`

**Purpose:** Unique product categories with formatted display names

**SQL:**
```sql
SELECT DISTINCT category AS id,
       INITCAP(REPLACE(category, '_', ' ')) AS name
FROM products
WHERE category IS NOT NULL
  AND deleted_at IS NULL
ORDER BY INITCAP(REPLACE(category, '_', ' '))
```

**Used By Screens:**

| Screen | Usage |
|--------|-------|
| Product filters | Category dropdown |
| Product Create/Edit | Category autocomplete |

**Added Fields:**
- `id` (raw category value: e.g., "frozen_foods")
- `name` (formatted display: e.g., "Frozen Foods")

---

#### View: `contacts_with_account_manager`

**Purpose:** Contacts with denormalized sales rep information

**Used By Screens:**

| Screen | Usage |
|--------|-------|
| Contact filters | Account manager filter |
| Analytics | Contact-to-rep reporting |

**Added Fields:**
- All `contacts` fields
- `account_manager_name` (from sales table join)

---

#### View: `organizations_with_account_manager`

**Purpose:** Organizations with denormalized sales rep information

**Used By Screens:**

| Screen | Usage |
|--------|-------|
| Organization filters | Account manager filter |
| Analytics | Organization-to-rep reporting |

**Added Fields:**
- All `organizations` fields
- `account_manager_name` (from sales table join)

---

#### View: `dashboard_pipeline_summary`

**Purpose:** Pipeline stage metrics per account manager

**SQL:**
```sql
SELECT account_manager_id,
       stage,
       COUNT(*) AS count,
       COUNT(CASE WHEN days_in_stage >= 30 THEN 1 END) AS stuck_count,
       -- Additional aggregates for total active and stuck opportunities
FROM opportunities
WHERE status = 'active'
GROUP BY account_manager_id, stage
```

**Used By Screens:**

| Screen | Usage |
|--------|-------|
| Dashboard (legacy) | Pipeline velocity widgets |
| Reports | Stage duration analysis |

**Added Fields:**
- `account_manager_id`
- `stage`
- `count` (opportunities in this stage)
- `stuck_count` (opportunities in stage >30 days)
- `total_active` (all active opportunities for manager)
- `total_stuck` (all stuck opportunities for manager)

---

## Section 3: Data Transformations & Patterns

### 3.1 JSONB Array Pattern

**Tables Using JSONB Arrays:**
- `contacts.email` - Array of `{email, type}`
- `contacts.phone` - Array of `{number, type}`
- `organizations.context_links` - Array of URLs
- `opportunities.tags` - Array of strings

**Pattern:**

**Database:**
```sql
email JSONB DEFAULT '[]'::jsonb
```

**Zod Schema:**
```typescript
const emailAndTypeSchema = z.object({
  email: z.string().email(),
  type: z.enum(["Work", "Home", "Other"]).default("Work")
});

const contactSchema = z.object({
  email: z.array(emailAndTypeSchema).default([])
});
```

**UI Form:**
```tsx
<ArrayInput source="email">
  <SimpleFormIterator inline>
    <TextInput source="email" />
    <SelectInput source="type" choices={emailTypes} />
  </SimpleFormIterator>
</ArrayInput>
```

**CSV Export Flattening:**
```typescript
email_work: contact.email?.find(e => e.type === "Work")?.email,
email_home: contact.email?.find(e => e.type === "Home")?.email
```

---

### 3.2 Soft Delete Pattern

**Tables with Soft Delete:**
- All core tables (contacts, organizations, opportunities, tasks, products, sales)

**Pattern:**
```typescript
// Delete operation → Update with deleted_at
if (supportsSoftDelete(resource)) {
  return baseDataProvider.update(resource, {
    id: params.id,
    data: { deleted_at: new Date().toISOString() },
    previousData: params.previousData
  });
}

// Views filter soft-deleted records
WHERE deleted_at IS NULL
```

**Undelete:**
```typescript
data: { deleted_at: null }
```

---

### 3.3 File Upload Pattern

**Tables with File Uploads:**
- `contacts.avatar`
- `organizations.logo_url`
- `sales.avatar_url`

**Flow:**
```
1. User selects file
2. Validation (10MB limit, image types)
3. Upload to Supabase Storage (avatars bucket)
4. Generate public URL
5. Store URL in database field
```

**Service:**
```typescript
// Upload
StorageService.upload('avatars', `${resource}/${recordId}`, file)

// Get URL
StorageService.getPublicUrl('avatars', path)
```

---

### 3.4 RPC Functions (Atomic Transactions)

#### `sync_opportunity_with_products`

**Purpose:** Atomic opportunity + products creation/update

**Parameters:**
```sql
opportunity_data JSONB,
products_to_create JSONB[],
products_to_update JSONB[],
product_ids_to_delete BIGINT[]
```

**Used By:**
- Opportunity Create
- Opportunity Edit

**Ensures:**
- Opportunity and products created/updated together
- Rollback if any operation fails
- Referential integrity maintained

---

### 3.5 Filter Transformations

**PostgREST Operators:**

| UI Filter | PostgREST Operator | Example |
|-----------|-------------------|---------|
| Equals | `@eq` or `=` | `stage=new_lead` |
| In (multi-select) | `@in` | `stage@in=(new_lead,qualified)` |
| Contains (JSONB array) | `@cs` | `tags@cs={1,2,3}` |
| Like (search) | `@ilike` | `name@ilike.*acme*` |
| Greater than | `@gt` | `child_branch_count@gt=0` |
| Is null | `@is` | `parent_organization_id@is=null` |
| Not null | `@not.is` | `parent_organization_id@not.is=null` |

**Custom Filters:**

**Hierarchy Type Filter:**
```typescript
switch (hierarchyType) {
  case "parent":
    filter["child_branch_count@gt"] = 0;
    break;
  case "branch":
    filter["parent_organization_id@not.is"] = null;
    break;
  case "standalone":
    filter["parent_organization_id@is"] = null;
    filter["child_branch_count@eq"] = 0;
    break;
}
```

---

## Section 4: Security (RLS Policies)

### 4.1 Two-Layer Security Model

**Every table requires BOTH:**
1. **GRANT** (table-level permissions)
2. **RLS policies** (row-level filtering)

**Example:**
```sql
-- Enable RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- GRANT permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON contacts TO authenticated;
GRANT USAGE ON SEQUENCE contacts_id_seq TO authenticated;

-- RLS policies
CREATE POLICY select_contacts ON contacts FOR SELECT TO authenticated
  USING (true);

CREATE POLICY update_contacts ON contacts FOR UPDATE TO authenticated
  USING ((SELECT is_admin FROM sales WHERE user_id = auth.uid()) = true);
```

---

### 4.2 Policy Patterns by Resource

#### Shared Team Access (SELECT, INSERT)

**Resources:** contacts, organizations, opportunities, products

```sql
USING (true)  -- All authenticated users can read/create
```

#### Admin-Only Modifications (UPDATE, DELETE)

**Resources:** contacts, organizations, opportunities, products

```sql
USING ((SELECT is_admin FROM sales WHERE user_id = auth.uid()) = true)
```

#### Personal Data (Tasks)

```sql
-- User sees only their own tasks
USING (sales_id IN (SELECT id FROM sales WHERE user_id = auth.uid()))
```

---

## Appendix A: Common Queries

### A.1 Fetch Contact with Organization

```sql
SELECT c.*, o.name AS company_name
FROM contacts c
LEFT JOIN organizations o ON c.organization_id = o.id
WHERE c.id = :id AND c.deleted_at IS NULL
```

### A.2 Fetch Opportunity with All Organizations

```sql
SELECT
  o.*,
  cust.name AS customer_name,
  prin.name AS principal_name,
  dist.name AS distributor_name
FROM opportunities o
LEFT JOIN organizations cust ON o.customer_organization_id = cust.id
LEFT JOIN organizations prin ON o.principal_organization_id = prin.id
LEFT JOIN organizations dist ON o.distributor_organization_id = dist.id
WHERE o.id = :id AND o.deleted_at IS NULL
```

### A.3 Fetch Organization Hierarchy

```sql
-- Fetch organization with parent and children
SELECT
  o.*,
  parent.name AS parent_name,
  (SELECT COUNT(*) FROM organizations WHERE parent_organization_id = o.id) AS child_count
FROM organizations o
LEFT JOIN organizations parent ON o.parent_organization_id = parent.id
WHERE o.id = :id AND o.deleted_at IS NULL
```

### A.4 Fetch Tasks Grouped by Principal

```sql
SELECT
  t.*,
  o.name AS opportunity_name,
  p.name AS principal_name
FROM tasks t
LEFT JOIN opportunities o ON t.opportunity_id = o.id
LEFT JOIN organizations p ON o.principal_organization_id = p.id
WHERE t.sales_id = :currentUserId AND t.completed = false
ORDER BY p.name, t.due_date
```

---

## Appendix B: File Locations

### Database Schema
- Migrations: `/supabase/migrations/`
- Latest schema: `20251018152315_cloud_schema_fresh.sql`
- Views: `*_summary*.sql`, `principal_opportunities*.sql`, `priority_tasks*.sql`
- RLS: `*_rls_*.sql`

### UI Components
- Contacts: `/src/atomic-crm/contacts/`
- Organizations: `/src/atomic-crm/organizations/`
- Opportunities: `/src/atomic-crm/opportunities/`
- Tasks: `/src/atomic-crm/tasks/`
- Products: `/src/atomic-crm/products/`
- Sales: `/src/atomic-crm/sales/`
- Dashboard V2: `/src/atomic-crm/dashboard/v2/`
- Reports: `/src/atomic-crm/reports/`

### Data Layer
- Data Provider: `/src/atomic-crm/providers/supabase/unifiedDataProvider.ts`
- Resources Config: `/src/atomic-crm/providers/supabase/resources.ts`
- Utilities: `/src/atomic-crm/providers/supabase/dataProviderUtils.ts`

### Validation
- All schemas: `/src/atomic-crm/validation/` (e.g., `contacts.ts`, `opportunities.ts`)

---

## Appendix C: Key Insights

### Design Patterns

1. **🔑 View-Based Reads with Table Writes (CRITICAL):**
   - **ALL reads** (`getOne`, `getList`) automatically use `_summary` views via data provider substitution
   - **ALL writes** (`create`, `update`, `delete`) target base tables
   - Views provide denormalized data (org names, contact counts, products JSONB) not available in base tables
   - **Implementation:** `src/atomic-crm/providers/supabase/dataProviderUtils.ts:173-195`
   - **Example:** `OpportunityShow` receives `opportunities_summary` with `customer_organization_name`, `principal_organization_name`, `products` array - all view-only fields

2. **View-Based Denormalization:** Frequently accessed joins pre-computed in views (`contacts_summary`, `organizations_summary`, `opportunities_summary`, `products_summary`)

3. **JSONB for Flexible Arrays:** Multi-value fields (email, phone) stored as JSONB arrays with sub-schemas

4. **Soft Delete Everywhere:** All core tables use `deleted_at` for recoverability

5. **Two-Layer Security:** GRANT + RLS policies prevent "permission denied" errors

6. **Atomic Transactions:** RPC functions ensure data integrity for complex operations (opportunity + products)

7. **Client-Side Filtering for Dashboards:** Dashboard V2 uses pre-filtered views + client-side filtering for <500 records (acceptable performance)

8. **Lazy Loading:** All resource views lazy-loaded via `React.lazy()` for code splitting

9. **Tabbed Forms:** Consistent UX via `TabbedFormInputs` component across all resources

### Performance Optimizations

1. **Indexed Soft Deletes:** `deleted_at` columns indexed for fast filtering
2. **GIN Indexes:** Full-text search on `search_tsv` columns
3. **Foreign Key Indexes:** All FK columns auto-indexed
4. **View Caching:** React Query 5-minute stale time for list queries
5. **Pagination:** 25-100 items per page (Kanban loads all)
6. **Memoization:** Filter calculations and grouped data structures memoized

---

## Appendix D: Schema Drift Changelog

### Version 1.1 (2025-01-16)

**Schema Sync:** Cloud database `aaqnanddcqvfiwhshndl`

**Major Updates:**

1. **Sales Table - Role System Migration**
   - PRIMARY FIELD: `role` enum (admin, manager, rep)
   - ADDED: `administrator` - GENERATED ALWAYS column: `(role = 'admin')`
   - DEPRECATED: `is_admin` - Boolean kept for backward compatibility, synced from role via trigger
   - ADDED: `user_id` - UUID linking to auth.users (nullable for legacy records)

2. **New Tables Added**
   - **segments** - Market segment classification for organizations (UUID primary key)
     - Fields: id, name, created_at, created_by, deleted_at
     - RPC: `get_or_create_segment(p_name TEXT)`
   - **tags** (detailed structure)
     - Fields: id, name, color, description, usage_count, created_at, updated_at, deleted_at
     - Usage: Contact tags stored as BIGINT array in contacts.tags
   - **opportunity_participants** - Organization roles in opportunities
     - Fields: opportunity_id, organization_id, role (enum), is_primary, notes, created_by, deleted_at
   - **interaction_participants** - Multi-participant activity tracking
     - Fields: activity_id, contact_id, organization_id, role, notes, deleted_at
     - Constraint: Must have contact_id OR organization_id (not both null)

3. **Field Additions**
   - **organizations.segment_id** - UUID reference to segments table
   - **organizations.updated_by** - Sales rep who last updated record
   - **opportunities.campaign** - Text field for campaign/marketing source tracking
   - **opportunities.lead_source** - Text field for lead origin tracking
   - **opportunities.updated_by** - Sales rep who last updated record
   - **tasks.overdue_notified_at** - Timestamp when overdue notification sent (prevents duplicates)

4. **New Database Views**
   - **campaign_choices** - Distinct campaign values from opportunities for filter dropdowns
   - **distinct_product_categories** - Unique product categories with formatted display names
   - **contacts_with_account_manager** - Contacts with denormalized sales rep info
   - **organizations_with_account_manager** - Organizations with denormalized sales rep info
   - **dashboard_pipeline_summary** - Pipeline stage metrics per account manager

**Documentation Structure Changes:**
- **Added Critical Architecture Pattern** - Documented view-based read pattern at document start
  - All `getOne`/`getList` operations use `_summary` views (automatically substituted by data provider)
  - Writes still target base tables
  - Clarified "Primary View (Read)" vs "Write Target" in all detail screen sections
  - Added "View-Only Fields" sections listing fields not available in base tables
  - Reference: `src/atomic-crm/providers/supabase/dataProviderUtils.ts:173-195`
- Reorganized Section 2.2 to include all junction tables
- Added Section 2.3: Lookup Tables (segments, tags)
- Renumbered Sections 2.3-2.4 to 2.5-2.6 (Notes Tables, Database Views)

**Migration Reference:**
- Role system: `20251116210019_fix_sales_schema_consistency.sql`
- See `/supabase/migrations/` for complete migration history

**Key Architecture Clarifications:**
- **Contact Detail** - Reads from `contacts_summary` (adds `company_name`)
- **Organization Detail** - Reads from `organizations_summary` (adds `nb_contacts`, `nb_opportunities`, `last_opportunity_activity`)
- **Opportunity Detail** - Reads from `opportunities_summary` (adds `customer_organization_name`, `principal_organization_name`, `distributor_organization_name`, `products` JSONB array)
- **Product Detail** - Reads from `products_summary` (adds `principal_name`)

---

**End of Document**
