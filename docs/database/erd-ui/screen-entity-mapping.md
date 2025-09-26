# Screen ↔ Entity Mapping Documentation
## Atomic CRM Frontend Architecture Analysis

This documentation maps each major UI screen in the Atomic CRM to their corresponding database entities, queries, operations, and component patterns. The system follows an **opportunities-first design** rather than traditional deal-based CRMs.

---

## 🏗️ Architecture Overview

### Resource Registration Pattern
All major entities are registered in `/home/krwhynot/Projects/atomic/src/atomic-crm/root/CRM.tsx`:

```tsx
<Resource name="opportunities" {...opportunities} />
<Resource name="contacts" {...contacts} />
<Resource name="organizations" {...organizations} />
<Resource name="contactNotes" />
<Resource name="opportunityNotes" />
<Resource name="tasks" />
<Resource name="sales" {...sales} />
<Resource name="tags" />
```

### Component Organization Pattern
Each feature follows consistent structure:
```
src/atomic-crm/[feature]/
├── index.ts           # Resource config with lazy loading
├── [Feature]List.tsx  # List view with filters
├── [Feature]Show.tsx  # Detail view
├── [Feature]Edit.tsx  # Edit form
├── [Feature]Create.tsx # Create form
└── [Feature]Inputs.tsx # Shared form inputs
```

### Three-Tier Component System
1. **Base Components** (`src/components/ui/`): shadcn/ui primitives
2. **Admin Components** (`src/components/admin/`): React Admin integrated components
3. **Feature Components** (`src/atomic-crm/`): Business logic components

---

## 📊 Dashboard Screen

**File:** `/home/krwhynot/Projects/atomic/src/atomic-crm/dashboard/Dashboard.tsx`

### Database Entities Queried
- **contacts** - Total count and data for onboarding flow
- **contactNotes** - Total count for progress tracking
- **opportunities** - Total count for conditional rendering

### Operations Performed
- `useGetList` with pagination `{page: 1, perPage: 1}` for count-only queries
- No filters applied (gets all accessible records)

### UI Components
- **DashboardStepper** - Progressive onboarding (contacts → notes → opportunities)
- **HotContacts** - Prioritized contact display
- **OpportunitiesChart** - Visual pipeline analytics
- **DashboardActivityLog** - Recent activity feed
- **TasksList** - Upcoming tasks

### Conditional Rendering Logic
```tsx
if (!totalContact) return <DashboardStepper step={1} />;
if (!totalContactNotes) return <DashboardStepper step={2} />;
return <MainDashboard />; // Full dashboard
```

---

## 🎯 Opportunities Screens

### Opportunities List Screen - Kanban Board

**File:** `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityList.tsx`

#### Database Entities Queried
- **opportunities** table with complex stage-based filtering
- **organizations** (via ReferenceInput for customer filtering)

#### Operations Performed
- **READ**: List with `sort: {field: "index", order: "DESC"}` for kanban ordering
- **UPDATE**: Complex drag-drop reordering via `index` field manipulation
- **FILTER**: `{"deleted_at@is": null}` for soft delete exclusion

#### Key Features
- **Kanban Drag-Drop**: Uses `@hello-pangea/dnd` for stage transitions
- **Index-Based Ordering**: Custom `index` field maintains card order within stages
- **Real-time Updates**: Optimistic UI updates followed by persistence

#### Filters Available
```tsx
const opportunityFilters = [
  <SearchInput source="q" alwaysOn />,
  <ReferenceInput source="customer_organization_id" reference="organizations" />,
  <SelectInput source="category" choices={opportunityCategories} />,
  <SelectInput source="priority" choices={priorityChoices} />,
  <SelectInput source="stage" choices={OPPORTUNITY_STAGE_CHOICES} />,
  <OnlyMineInput source="sales_id" alwaysOn />,
];
```

#### Special Implementation: Drag-Drop Reordering

**File:** `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityListContent.tsx`

Complex `index` field manipulation:
- **Same Stage Movement**: Adjusts indexes between source and destination
- **Cross-Stage Movement**: Updates stage + reorders both columns
- **Optimistic Updates**: Local state change before API persistence

### Opportunity Detail/Show Screen

**File:** `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityShow.tsx`

#### Database Entities Queried
- **opportunities** (main record)
- **contacts** (via opportunity.contact_ids array)
- **organizations** (customer, principal, distributor)
- **opportunityNotes** (communication history)
- **tasks** (related actions)
- **opportunityParticipants** (multi-stakeholder support)

#### Related Entity Loading Pattern
```tsx
// Loads opportunity with embedded contact and organization data
const opportunity = useGetOne('opportunities', opportunityId);
// Separate queries for notes and tasks
const notes = useGetList('opportunityNotes', {filter: {opportunity_id}});
const tasks = useGetList('tasks', {filter: {opportunity_id}});
```

### Opportunity Forms (Create/Edit)

**Files:**
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityCreate.tsx`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityEdit.tsx`

#### Database Operations
- **CREATE**: Validates via Zod schema, auto-assigns `sales_id` and `index`
- **UPDATE**: Partial updates with optimistic UI response
- **VALIDATION**: Uses `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/opportunities.ts`

#### Form Fields → Database Mapping
```tsx
// Core fields
name → opportunities.name
customer_organization_id → opportunities.customer_organization_id
contact_ids → opportunities.contact_ids (JSONB array)
stage → opportunities.stage
priority → opportunities.priority
amount → opportunities.amount
probability → opportunities.probability (0-100 validation)
expected_closing_date → opportunities.expected_closing_date

// Stage-specific fields (conditional rendering)
sampleType → opportunities.sampleType (stage: sample_visit_offered)
feedbackNotes → opportunities.feedbackNotes (stage: feedback_logged)
demoDate → opportunities.demoDate (stage: demo_scheduled)
lossReason → opportunities.lossReason (stage: closed_lost)
```

#### Stage-Specific Validation
Uses dynamic Zod schemas based on opportunity stage:
- **sample_visit_offered**: Requires sample type and visit date
- **feedback_logged**: Requires feedback notes and sentiment score
- **demo_scheduled**: Requires demo date and attendees
- **closed_won/closed_lost**: Requires outcome-specific fields

---

## 👥 Contacts Screens

### Contacts List Screen

**File:** `/home/krwhynot/Projects/atomic/src/atomic-crm/contacts/ContactList.tsx`

#### Database Entities Queried
- **contacts** (main list with pagination)
- **organizations** (via company_id for primary organization)
- **contact_organizations** (multi-organization relationships)
- **tags** (contact labeling)
- **sales** (contact owners)

#### Operations Performed
- **READ**: Paginated list with `sort: {field: "last_seen", order: "DESC"}`
- **EXPORT**: CSV export with flattened JSONB fields (email/phone)
- **BULK**: Multi-select operations via BulkActionsToolbar

#### Multi-Organization Support
Key enhancement - contacts can belong to multiple organizations:

```tsx
// Database structure
contact_organizations: {
  contact_id: uuid,
  organization_id: uuid,
  is_primary_organization: boolean,
  role: ContactRole,
  purchase_influence: 'High' | 'Medium' | 'Low',
  decision_authority: 'Decision Maker' | 'Influencer' | 'End User'
}
```

#### JSONB Field Handling
Email and phone stored as JSONB arrays:
```tsx
email: [
  {email: "john@company.com", type: "Work"},
  {email: "john@home.com", type: "Home"}
]
phone: [
  {number: "+1234567890", type: "Work"},
  {number: "+0987654321", type: "Home"}
]
```

#### Export Functionality
Complex CSV export flattens JSONB:
```tsx
email_work: contact.email?.find(e => e.type === "Work")?.email,
phone_home: contact.phone?.find(p => p.type === "Home")?.number,
organizations: JSON.stringify(contact.organizations),
total_organizations: contact.organizations?.length || 0
```

### Contact Detail/Show Screen

**File:** `/home/krwhynot/Projects/atomic/src/atomic-crm/contacts/ContactShow.tsx`

#### Database Entities Queried
- **contacts** (main record)
- **contact_organizations** (all organization relationships)
- **organizations** (organization details for each relationship)
- **contactNotes** (communication history)
- **opportunities** (where contact is involved)
- **tasks** (assigned to contact)

#### Multi-Organization Display
Shows all organization relationships with roles and influence levels:
```tsx
// Displays table of organization relationships
{contact.organizations?.map(org => (
  <OrganizationRelationshipRow
    organization={org}
    role={org.role}
    influence={org.purchase_influence}
    isPrimary={org.is_primary_organization}
  />
))}
```

### Contact Forms (Create/Edit)

**Files:**
- `/home/krwhynot/Projects/atomic/src/atomic-crm/contacts/ContactCreate.tsx`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/contacts/ContactEdit.tsx`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/contacts/ContactInputs.tsx`

#### Form Fields → Database Mapping
```tsx
// Basic fields
first_name → contacts.first_name
last_name → contacts.last_name
title → contacts.title
company_id → contacts.company_id (primary organization)

// JSONB array fields
email → contacts.email (EmailAndType[])
phone → contacts.phone (PhoneNumberAndType[])

// Multi-organization fields
organization_ids → contact_organizations (multiple records)
role → contact_organizations.role
purchase_influence → contact_organizations.purchase_influence
decision_authority → contact_organizations.decision_authority

// Metadata
tags → contacts.tags (array of tag IDs)
has_newsletter → contacts.has_newsletter
gender → contacts.gender
```

#### Contact Import Feature

**File:** `/home/krwhynot/Projects/atomic/src/atomic-crm/contacts/useContactImport.tsx`

Supports Excel/CSV import with:
- Email/phone JSONB field parsing
- Organization lookup and creation
- Tag assignment and creation
- Validation via Zod schemas
- Duplicate detection

---

## 🏢 Organizations Screens

### Organizations List Screen

**File:** `/home/krwhynot/Projects/atomic/src/atomic-crm/organizations/OrganizationList.tsx`

#### Database Entities Queried
- **organizations** (main list)
- **contacts** (count via nb_contacts calculated field)

#### Operations Performed
- **READ**: `sort: {field: "name", order: "ASC"}` alphabetical listing
- **FILTER**: Sector, size, type filtering
- **PAGINATION**: Configurable rows per page (10, 25, 50, 100)

#### Grid Display Pattern
Uses ImageList component for logo-centric grid layout:
- Organization logos as primary visual element
- Contact count badges
- Sector and type indicators
- Quick action buttons

#### Sort Options
```tsx
<SortButton fields={["name", "created_at", "nb_contacts"]} />
```

### Organization Detail/Show Screen

**File:** `/home/krwhynot/Projects/atomic/src/atomic-crm/organizations/OrganizationShow.tsx`

#### Database Entities Queried
- **organizations** (main record)
- **contact_organizations** (all contact relationships)
- **contacts** (contact details via relationships)
- **opportunities** (as customer, principal, or distributor)
- **organizationNotes** (if implemented)

#### Organization Types & Roles
Support for multiple organization roles in opportunities:
- **Customer**: Primary buyer organization
- **Principal**: Manufacturer/supplier
- **Distributor**: Channel partner
- **Partner**: Strategic alliance
- **Vendor**: Service provider

### Organization Forms (Create/Edit)

**Files:**
- `/home/krwhynot/Projects/atomic/src/atomic-crm/organizations/OrganizationCreate.tsx`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/organizations/OrganizationEdit.tsx`

#### Form Fields → Database Mapping
```tsx
// Core fields
name → organizations.name
sector → organizations.sector
size → organizations.size (employee count ranges)
website → organizations.website
linkedin_url → organizations.linkedin_url

// Classification
type → organizations.type ('customer'|'prospect'|'vendor'|'partner')
priority → organizations.priority ('A'|'B'|'C'|'D')

// Address (JSONB)
address → organizations.address {
  street, city, state, postal_code, country
}

// Metadata
logo → organizations.logo (file upload)
description → organizations.description
annual_revenue → organizations.annual_revenue
```

#### Validation Schema
Uses `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/organizations.ts`:
- Website URL validation
- LinkedIn URL format checking
- Revenue range validation
- Sector enum constraints

---

## 📋 Tasks & Activities Screens

### Tasks List

**File:** `/home/krwhynot/Projects/atomic/src/atomic-crm/dashboard/TasksList.tsx`

#### Database Entities Queried
- **tasks** table with due date filtering
- **contacts** (task assignees)

#### Operations Performed
- **READ**: Tasks filtered by due dates and completion status
- **UPDATE**: Mark tasks as complete (`done_date` field)
- **CREATE**: Quick task creation

#### Task Fields
```tsx
contact_id → tasks.contact_id
type → tasks.type (from configuration)
text → tasks.text
due_date → tasks.due_date
done_date → tasks.done_date (nullable)
sales_id → tasks.sales_id (owner)
```

### Activity Tracking

**Files:** Activity system distinguishes between:
- **Engagements**: Standalone contact activities
- **Interactions**: Opportunity-linked activities

#### ActivityRecord Type
```tsx
type ActivityRecord = {
  activity_type: 'engagement' | 'interaction',
  type: 'call' | 'email' | 'meeting' | 'demo' | 'visit',
  contact_id?: uuid,
  organization_id?: uuid,
  opportunity_id?: uuid, // NULL for engagements
  activity_date: timestamp,
  outcome?: string,
  sentiment?: 'positive' | 'neutral' | 'negative'
}
```

---

## 🔖 Tags & Notes Systems

### Tags Management

**Resource:** `<Resource name="tags" />` (registered but no full CRUD screens)

#### Tag Structure
```tsx
type Tag = {
  name: string,
  color: string (semantic CSS variables only)
}
```

#### Usage Patterns
- Contact tagging for segmentation
- Opportunity categorization
- Color-coded visual indicators
- Bulk tagging operations

### Notes Systems

#### Contact Notes
- **Table**: contactNotes
- **Purpose**: Communication history per contact
- **Features**: Attachments, status tracking, sales attribution

#### Opportunity Notes
- **Table**: opportunityNotes
- **Purpose**: Deal-specific communication log
- **Features**: Attachments, chronological timeline

#### Note Structure
```tsx
type Note = {
  text: string,
  date: timestamp,
  sales_id: uuid,
  status?: string (contacts only),
  attachments?: AttachmentNote[]
}
```

---

## 🔄 Data Provider Integration

### Unified Supabase Provider

**File:** `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/dataProvider.ts`

#### Key Features
- **RLS Integration**: Row-Level Security for multi-tenant access
- **Soft Deletes**: All queries filter `WHERE deleted_at IS NULL`
- **File Storage**: Avatar and attachment handling
- **Zod Validation**: API boundary validation for all mutations
- **Search Integration**: Full-text search via PostgreSQL vectors

#### Query Patterns
```tsx
// Standard list with soft delete filter
useGetList('opportunities', {
  filter: {"deleted_at@is": null},
  sort: {field: "index", order: "DESC"}
})

// Reference loading for relationships
useGetOne('organizations', organizationId)

// Bulk operations with optimistic updates
dataProvider.updateMany('opportunities', {
  ids: selectedIds,
  data: {stage: 'closed_won'}
})
```

#### Performance Optimizations
- **85+ Database Indexes**: Optimized for common query patterns
- **Calculated Fields**: `nb_contacts`, `nb_opportunities` for aggregates
- **Search Vectors**: Updated via database triggers
- **Pagination**: Efficient LIMIT/OFFSET with total counts

---

## 📱 Mobile & Responsive Patterns

### Responsive Design Strategy
- **Mobile-first**: Tailwind CSS breakpoints
- **Column Hiding**: DataTable responsive column management
- **Touch Interactions**: Drag-drop works on mobile
- **Progressive Disclosure**: Expandable sections on small screens

### iPad Optimization
Specific focus on iPad usage in business contexts:
- Kanban board touch interactions
- Form input optimization
- Split-screen compatibility
- Landscape/portrait layout adaptation

---

## 🚀 Performance Considerations

### Bundle Optimization
- **Lazy Loading**: All major components via `React.lazy()`
- **Code Splitting**: Feature-based chunk boundaries
- **Dynamic Imports**: Heavy components loaded on demand

### Query Optimization
- **Pagination**: Configurable page sizes
- **Index Usage**: All major queries use database indexes
- **Relationship Loading**: Efficient join patterns
- **Caching**: React Admin store for client-side caching

### Real-time Updates
- **Optimistic UI**: Immediate feedback on mutations
- **Conflict Resolution**: Last-write-wins with user notification
- **Refresh Patterns**: Smart data refetching

---

## 🧩 Validation & Error Handling

### Zod Schema Validation

**Directory:** `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/`

Each entity has dedicated validation:
- **opportunities.ts**: Stage-specific validation rules
- **contacts.ts**: JSONB field validation (email/phone arrays)
- **organizations.ts**: URL and format validation
- **tasks.ts**: Date and reminder validation
- **notes.ts**: Attachment validation
- **tags.ts**: Color constraint validation

### Error Handling Patterns
- **Form Validation**: Client-side Zod validation
- **API Errors**: Standardized error response format
- **Toast Notifications**: User feedback for async operations
- **Loading States**: Skeleton screens and spinners

---

## 📊 Key UI Components & Patterns

### EntityManagementTemplate
Standard template for CRUD pages (not yet fully implemented):
- Consistent header layouts
- Standard action patterns
- Responsive grid systems

### DataTable Component
Unified table component with:
- **TypeScript Generics**: Type-safe row definitions
- **Expandable Rows**: Inline detail expansion
- **Column Management**: Show/hide responsive columns
- **Bulk Selection**: Multi-row operations

### Form Components
Located in `/home/krwhynot/Projects/atomic/src/components/admin/`:
- **file-input.tsx**: File upload handling
- **number-input.tsx**: Numeric validation
- **select-input.tsx**: Dropdown selections
- **text-input.tsx**: Text field validation

### Reusable Patterns
- **TopToolbar**: Standard action bar component
- **BulkActionsToolbar**: Multi-select operations
- **ReferenceInput**: Entity relationship selection
- **SearchInput**: Full-text search integration

---

## 🎨 Design System Integration

### shadcn/ui Components
Base component library with "new-york" style and "slate" base color:
- Consistent button styles and interactions
- Form field styling and validation states
- Modal and dialog patterns
- Card and layout components

### Color Management
- **Semantic Variables**: `--primary`, `--destructive`, etc.
- **No Hardcoded Hex**: All colors via CSS variables
- **Dark Mode Support**: Automatic theme switching
- **Tag Colors**: Restricted to semantic palette

### Typography & Spacing
- **Tailwind CSS**: Utility-first styling approach
- **Design Tokens**: Consistent spacing scale
- **Responsive Typography**: Breakpoint-aware text sizes
- **Grid Systems**: Flexible layout patterns

---

This mapping provides a comprehensive understanding of how UI screens connect to database entities, enabling developers to:
- **Add New Fields**: Understand form → database mappings
- **Optimize Queries**: See which entities are loaded together
- **Maintain Consistency**: Follow established component patterns
- **Debug Issues**: Trace data flow from UI to database
- **Extend Features**: Build on existing architecture patterns

The opportunities-first design differentiates this CRM from traditional deal-based systems, providing more flexibility for multi-stakeholder sales processes and complex organizational relationships.