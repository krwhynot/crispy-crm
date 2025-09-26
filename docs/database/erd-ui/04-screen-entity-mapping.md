# Screen ↔ Entity Mapping

## Overview
This document maps each major UI screen in the Atomic CRM to the database entities it interacts with, including queries performed, operations available, and data flow patterns.

## Screen Mappings

### 1. Dashboard (`/`)
**Component**: `src/atomic-crm/dashboard/Dashboard.tsx`

#### Entities Accessed
- `contacts` - Recent contacts for onboarding
- `contactNotes` - Latest activity feed
- `opportunities` - Pipeline metrics

#### Database Queries
```sql
-- Onboarding check
SELECT COUNT(*) FROM contacts WHERE deleted_at IS NULL;

-- Recent activity
SELECT cn.*, c.name as contact_name
FROM contactNotes cn
JOIN contacts c ON cn.contact_id = c.id
WHERE cn.deleted_at IS NULL
ORDER BY cn.created_at DESC
LIMIT 10;

-- Pipeline metrics
SELECT stage, COUNT(*), SUM(amount)
FROM opportunities
WHERE deleted_at IS NULL
  AND status = 'active'
GROUP BY stage;
```

#### Operations
- Create first contact (onboarding flow)
- View recent activities
- Navigate to detailed screens

---

### 2. Opportunities List (`/opportunities`)
**Component**: `src/atomic-crm/opportunities/OpportunityList.tsx`

#### Entities Accessed
- `opportunities_summary` - Main list data
- `organizations` - Customer/principal/distributor names
- `contacts` - Associated contacts
- `opportunity_participants` - Multi-stakeholder details

#### Database Queries
```sql
-- Main list query
SELECT
  o.*,
  c.name as customer_name,
  p.name as principal_name,
  d.name as distributor_name
FROM opportunities_summary o
LEFT JOIN organizations c ON o.customer_organization_id = c.id
LEFT JOIN organizations p ON o.principal_organization_id = p.id
LEFT JOIN organizations d ON o.distributor_organization_id = d.id
WHERE o.deleted_at IS NULL
ORDER BY o.index ASC;

-- Kanban board grouping
SELECT * FROM opportunities
WHERE deleted_at IS NULL
ORDER BY stage, index ASC;
```

#### Operations
- **Create**: New opportunity
- **Read**: List with filters
- **Update**: Edit, stage change, drag-drop reorder
- **Delete**: Soft delete (archive)

#### Special Features
- **Kanban Board**: Drag-drop between stages
- **Index Management**: Reorder within columns
- **Stage Transitions**: Automatic probability updates
- **Bulk Actions**: Multi-select toolbar

#### Form Fields → Database Columns
```typescript
// Create/Edit Form
name → opportunities.name
stage → opportunities.stage (enum)
amount → opportunities.amount
estimated_close_date → opportunities.estimated_close_date
customer_organization_id → opportunities.customer_organization_id
principal_organization_id → opportunities.principal_organization_id
distributor_organization_id → opportunities.distributor_organization_id
contact_ids → opportunities.contact_ids[]
```

---

### 3. Opportunity Detail (`/opportunities/:id`)
**Component**: `src/atomic-crm/opportunities/OpportunityShow.tsx`

#### Entities Accessed
- `opportunities` - Main record
- `opportunityNotes` - Communication history
- `opportunity_participants` - All stakeholders
- `opportunity_contacts` - Involved contacts
- `activities` - Related interactions
- `tasks` - Related tasks

#### Database Queries
```sql
-- Main opportunity
SELECT * FROM opportunities WHERE id = :id;

-- Notes history
SELECT on.*, s.full_name as author
FROM opportunityNotes on
LEFT JOIN sales s ON on.created_by = s.id
WHERE on.opportunity_id = :id
ORDER BY on.created_at DESC;

-- Participants
SELECT op.*, o.name, o.logo_url
FROM opportunity_participants op
JOIN organizations o ON op.organization_id = o.id
WHERE op.opportunity_id = :id;

-- Related activities
SELECT * FROM activities
WHERE opportunity_id = :id
  AND activity_type = 'interaction'
ORDER BY activity_date DESC;
```

#### Operations
- View complete opportunity details
- Add/edit notes
- Manage participants
- Log interactions
- Create follow-up tasks
- Change stage/status

---

### 4. Contacts List (`/contacts`)
**Component**: `src/atomic-crm/contacts/ContactList.tsx`

#### Entities Accessed
- `contacts_summary` - Enhanced contact view
- `contact_organizations` - Organization relationships
- `tags` - Contact tags

#### Database Queries
```sql
-- Main list with organizations
SELECT
  c.*,
  array_agg(
    json_build_object(
      'id', o.id,
      'name', o.name,
      'is_primary', co.is_primary
    )
  ) as organizations
FROM contacts_summary c
LEFT JOIN contact_organizations co ON c.id = co.contact_id
LEFT JOIN organizations o ON co.organization_id = o.id
WHERE c.deleted_at IS NULL
GROUP BY c.id
ORDER BY c.name;
```

#### Operations
- **Create**: New contact with organization assignment
- **Update**: Edit contact, manage organizations
- **Delete**: Soft delete
- **Import**: CSV import with field mapping

#### JSONB Field Handling
```typescript
// Email field structure
email: [
  { type: "work", value: "john@company.com", primary: true },
  { type: "personal", value: "john@gmail.com" }
]

// Phone field structure
phone: [
  { type: "mobile", value: "+1-415-555-0101", primary: true },
  { type: "office", value: "+1-415-555-0100 x123" }
]
```

---

### 5. Contact Detail (`/contacts/:id`)
**Component**: `src/atomic-crm/contacts/ContactShow.tsx`

#### Entities Accessed
- `contacts` - Main record
- `contact_organizations` - All organizations
- `contactNotes` - Communication history
- `opportunities` - Related opportunities
- `activities` - Engagement history
- `tasks` - Assigned tasks

#### Database Queries
```sql
-- Contact with all organizations
SELECT c.*,
  get_contact_organizations(c.id) as organizations
FROM contacts c
WHERE c.id = :id;

-- Related opportunities
SELECT o.* FROM opportunities o
WHERE :id = ANY(o.contact_ids)
  OR o.id IN (
    SELECT opportunity_id
    FROM opportunity_contacts
    WHERE contact_id = :id
  );

-- Activity timeline
SELECT * FROM activities
WHERE contact_id = :id
ORDER BY activity_date DESC;
```

#### Multi-Organization Management
- Add to organization with role/influence
- Set primary organization
- Track relationship timeline
- Manage per-organization authority

---

### 6. Organizations List (`/organizations`)
**Component**: `src/atomic-crm/organizations/OrganizationList.tsx`

#### Entities Accessed
- `organizations_summary` - Enhanced org view
- `contacts` - Employee count
- `opportunities` - Deal count/value

#### Database Queries
```sql
-- Organizations with metrics
SELECT
  o.*,
  COUNT(DISTINCT co.contact_id) as contact_count,
  COUNT(DISTINCT op.id) as opportunity_count,
  SUM(op.amount) as total_pipeline
FROM organizations_summary o
LEFT JOIN contact_organizations co ON o.id = co.organization_id
LEFT JOIN opportunities op ON o.id IN (
  op.customer_organization_id,
  op.principal_organization_id,
  op.distributor_organization_id
)
WHERE o.deleted_at IS NULL
GROUP BY o.id;
```

#### Special Features
- **Logo Display**: Visual grid layout
- **Type Filtering**: Customer/Principal/Distributor
- **Hierarchy**: Parent company relationships
- **Segment/Priority**: Business categorization

---

### 7. Organization Detail (`/organizations/:id`)
**Component**: `src/atomic-crm/organizations/OrganizationShow.tsx`

#### Entities Accessed
- `organizations` - Main record
- `contact_organizations` - All employees
- `opportunities` - All related deals
- `products` - If principal
- `activities` - Company activities

#### Operations
- View company profile
- Manage contacts
- Track opportunities
- View product catalog (principals)
- Log activities

---

### 8. Products Catalog (`/products`)
**Component**: `src/atomic-crm/products/ProductList.tsx`

#### Entities Accessed
- `products` - Product catalog
- `product_pricing_tiers` - Volume pricing
- `product_inventory` - Stock levels
- `organizations` - Principals

#### Database Queries
```sql
-- Products with inventory
SELECT
  p.*,
  pi.quantity_available,
  pi.reorder_point,
  o.name as principal_name
FROM products p
LEFT JOIN product_inventory pi ON p.id = pi.product_id
LEFT JOIN organizations o ON p.principal_id = o.id
WHERE p.deleted_at IS NULL
  AND p.status = 'active';

-- Pricing tiers
SELECT * FROM product_pricing_tiers
WHERE product_id = :id
  AND effective_date <= CURRENT_DATE
  AND (expiration_date IS NULL OR expiration_date >= CURRENT_DATE)
ORDER BY min_quantity;
```

#### Special Features
- **Inventory Tracking**: Real-time stock levels
- **Pricing Tiers**: Volume discount display
- **Distribution Rights**: Authorized distributors
- **Seasonal Products**: Filtered views

---

### 9. Activities Timeline (`/activities`)
**Component**: `src/atomic-crm/activities/ActivityList.tsx`

#### Entities Accessed
- `activities` - All activities
- `contacts` - Related people
- `organizations` - Related companies
- `opportunities` - Linked deals

#### Database Queries
```sql
-- Activities with context
SELECT
  a.*,
  c.name as contact_name,
  o.name as organization_name,
  op.name as opportunity_name,
  CASE
    WHEN a.opportunity_id IS NOT NULL THEN 'interaction'
    ELSE 'engagement'
  END as activity_category
FROM activities a
LEFT JOIN contacts c ON a.contact_id = c.id
LEFT JOIN organizations o ON a.organization_id = o.id
LEFT JOIN opportunities op ON a.opportunity_id = op.id
WHERE a.deleted_at IS NULL
ORDER BY a.activity_date DESC;
```

#### Activity Types
- **Engagements**: General networking (no opportunity)
- **Interactions**: Deal-specific activities

---

### 10. Tasks Management (`/tasks`)
**Component**: `src/atomic-crm/tasks/TaskList.tsx`

#### Entities Accessed
- `tasks` - Task records
- `sales` - Assigned users
- Polymorphic `related_to` - Any entity

#### Database Queries
```sql
-- Tasks with related entities
SELECT
  t.*,
  s.full_name as assigned_to_name,
  CASE t.related_to
    WHEN 'opportunities' THEN o.name
    WHEN 'contacts' THEN c.name
    WHEN 'organizations' THEN org.name
  END as related_name
FROM tasks t
LEFT JOIN sales s ON t.assigned_to = s.id
LEFT JOIN opportunities o ON t.related_to = 'opportunities' AND t.related_to_id = o.id
LEFT JOIN contacts c ON t.related_to = 'contacts' AND t.related_to_id = c.id
LEFT JOIN organizations org ON t.related_to = 'organizations' AND t.related_to_id = org.id
WHERE t.deleted_at IS NULL
  AND t.completed = false
ORDER BY t.due_date ASC;
```

---

## Component Patterns

### Resource Registration
```typescript
// src/atomic-crm/root/CRM.tsx
<Resource
  name="opportunities"
  list={lazy(() => import('../opportunities/OpportunityList'))}
  show={lazy(() => import('../opportunities/OpportunityShow'))}
  edit={lazy(() => import('../opportunities/OpportunityEdit'))}
  create={lazy(() => import('../opportunities/OpportunityCreate'))}
  icon={DollarSign}
  recordRepresentation="name"
/>
```

### Form Components Structure
```typescript
// Standard file organization
opportunities/
  ├── index.ts              // Resource configuration
  ├── OpportunityList.tsx   // List with filters
  ├── OpportunityShow.tsx   // Detail view
  ├── OpportunityEdit.tsx   // Edit form
  ├── OpportunityCreate.tsx // Create form
  └── OpportunityInputs.tsx // Shared form inputs
```

### Data Provider Integration
```typescript
// Using React Admin hooks
const { data, isLoading } = useGetList('opportunities', {
  pagination: { page: 1, perPage: 25 },
  sort: { field: 'created_at', order: 'DESC' },
  filter: { stage: 'active' }
});

// Create with validation
const [create] = useCreate('opportunities', {
  data: formData // Validated by Zod at data provider
});
```

### Three-Tier Component System
1. **Base Components** (`src/components/ui/`)
   - shadcn/ui primitives
   - Generic, reusable

2. **Admin Components** (`src/components/admin/`)
   - React Admin integrated
   - Form validation included
   - Consistent styling

3. **Feature Components** (`src/atomic-crm/`)
   - Business logic
   - Entity-specific behavior
   - Complex interactions

## Query Patterns

### List Queries
- Always filter `deleted_at IS NULL`
- Use summary views for performance
- Include related entity names
- Support pagination/sorting

### Detail Queries
- Load main entity
- Fetch related records separately
- Include audit information
- Support real-time updates

### Search Queries
- Use `search_tsv` columns
- GIN indexes for performance
- Multi-field search support
- Weighted results

### Aggregation Queries
- Dashboard metrics
- Pipeline analysis
- Performance KPIs
- Trend analysis

This mapping document provides developers with a clear understanding of how UI screens connect to database entities, enabling efficient development and debugging of data flow issues.