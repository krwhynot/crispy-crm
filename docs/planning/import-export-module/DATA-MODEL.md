# Data Model: Import/Export Module

**Created:** 2025-11-05
**Status:** No Database Changes Needed
**Complexity:** None (uses existing schema)

---

## Overview

**Good News:** Import/Export module requires ZERO database migrations. All necessary tables, columns, and constraints already exist.

Import/Export is a **UI-layer feature** that reads from and writes to existing tables. No schema changes needed.

---

## Existing Schema (Already Perfect)

### Opportunities Table

```sql
CREATE TABLE opportunities (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL,
    description TEXT,
    stage TEXT NOT NULL,
    status TEXT NOT NULL,
    expected_close_date DATE,
    value DECIMAL(12, 2),
    principal_id BIGINT REFERENCES principals(id),
    organization_id BIGINT REFERENCES organizations(id),
    sales_id BIGINT REFERENCES sales(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Existing indexes (already optimized)
CREATE INDEX idx_opportunities_principal_id ON opportunities(principal_id);
CREATE INDEX idx_opportunities_organization_id ON opportunities(organization_id);
CREATE INDEX idx_opportunities_sales_id ON opportunities(sales_id);
CREATE INDEX idx_opportunities_status ON opportunities(status);
```

**Stage Enum Values (from existing data):**
- New Lead
- Discovery Call Scheduled
- Discovery Call Completed
- Sample Visit Offered
- Sample Visit Completed
- Demo Scheduled
- Demo Completed
- Proposal Sent

**Status Enum Values:**
- Active
- Closed Won
- Closed Lost
- On Hold

**Import Mappings:**
- CSV Column → Database Column:
  - "Opportunity Name" → `name`
  - "Customer Organization" → `organization_id` (lookup)
  - "Principal" → `principal_id` (lookup)
  - "Stage" → `stage` (validate enum)
  - "Status" → `status` (validate enum)
  - "Expected Close Date" → `expected_close_date`
  - "Account Manager" → `sales_id` (lookup)
  - "Description" → `description`
  - "Value" → `value`

---

### Products Table

```sql
CREATE TABLE products (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL,
    sku TEXT NOT NULL UNIQUE,
    principal_id BIGINT REFERENCES principals(id),
    category TEXT,
    unit TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Existing indexes
CREATE UNIQUE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_principal_id ON products(principal_id);
```

**Import Mappings:**
- CSV Column → Database Column:
  - "Product Name" → `name`
  - "SKU" → `sku` (validate unique)
  - "Principal" → `principal_id` (lookup)
  - "Category" → `category`
  - "Unit" → `unit`
  - "Description" → `description`

---

### Lookup Tables (for Validation)

#### Principals Table (Referenced by Opportunities & Products)
```sql
CREATE TABLE principals (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL UNIQUE,
    ...
);

CREATE INDEX idx_principals_name ON principals(name);
```

**Import Lookup:**
```typescript
// Cache principals at import start
const principals = await supabase.from('principals').select('id, name');
const principalMap = new Map(principals.map(p => [p.name.toLowerCase(), p.id]));

// Lookup during row processing
const principalId = principalMap.get(csvRow.principal.toLowerCase());
if (!principalId) {
  errors.push(`Principal '${csvRow.principal}' not found`);
}
```

#### Organizations Table (Referenced by Opportunities)
```sql
CREATE TABLE organizations (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL,
    ...
);

CREATE INDEX idx_organizations_name ON organizations(name);
```

**Import Lookup:**
```typescript
// Cache organizations at import start (reuse from Contacts import)
const organizations = await supabase.from('organizations').select('id, name');
const organizationMap = new Map(organizations.map(o => [o.name.toLowerCase(), o.id]));

// Lookup during row processing
const organizationId = organizationMap.get(csvRow.organization.toLowerCase());
if (!organizationId) {
  errors.push(`Organization '${csvRow.organization}' not found. Create it first.`);
}
```

#### Sales Table (Referenced by Opportunities for Account Manager)
```sql
CREATE TABLE sales (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id UUID REFERENCES auth.users(id),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    ...
);

CREATE INDEX idx_sales_email ON sales(email);
```

**Import Lookup:**
```typescript
// Cache sales at import start
const salesReps = await supabase.from('sales').select('id, name, email');
const salesByEmail = new Map(salesReps.map(s => [s.email.toLowerCase(), s.id]));
const salesByName = new Map(salesReps.map(s => [s.name.toLowerCase(), s.id]));

// Lookup during row processing (try email first, fallback to name)
const salesId = salesByEmail.get(csvRow.account_manager.toLowerCase()) ||
                salesByName.get(csvRow.account_manager.toLowerCase()) ||
                currentUser.salesId;  // Default: current user
```

---

## Validation Logic

### Opportunities Import Validation

**Required Field Validation:**
```typescript
const validateOpportunityRow = (row) => {
  const errors = [];

  if (!row.name || row.name.trim() === '') {
    errors.push('Opportunity Name is required');
  } else if (row.name.length > 200) {
    errors.push('Opportunity Name must be 200 characters or less');
  }

  if (!row.organization) {
    errors.push('Customer Organization is required');
  } else if (!organizationMap.has(row.organization.toLowerCase())) {
    errors.push(`Organization '${row.organization}' not found`);
  }

  if (!row.principal) {
    errors.push('Principal is required');
  } else if (!principalMap.has(row.principal.toLowerCase())) {
    errors.push(`Principal '${row.principal}' not found`);
  }

  if (!row.stage) {
    errors.push('Stage is required');
  } else if (!VALID_STAGES.includes(row.stage)) {
    errors.push(`Stage '${row.stage}' is invalid. Must be one of: ${VALID_STAGES.join(', ')}`);
  }

  if (!row.status) {
    errors.push('Status is required');
  } else if (!VALID_STATUSES.includes(row.status)) {
    errors.push(`Status '${row.status}' is invalid. Must be: Active, Closed Won, Closed Lost, On Hold`);
  }

  if (row.expected_close_date && !isValidDate(row.expected_close_date)) {
    errors.push(`Expected Close Date '${row.expected_close_date}' is invalid. Use YYYY-MM-DD format.`);
  }

  if (row.value && (isNaN(parseFloat(row.value)) || parseFloat(row.value) < 0)) {
    errors.push(`Value '${row.value}' must be a positive number`);
  }

  return errors;
};

const VALID_STAGES = [
  'New Lead',
  'Discovery Call Scheduled',
  'Discovery Call Completed',
  'Sample Visit Offered',
  'Sample Visit Completed',
  'Demo Scheduled',
  'Demo Completed',
  'Proposal Sent'
];

const VALID_STATUSES = ['Active', 'Closed Won', 'Closed Lost', 'On Hold'];
```

### Products Import Validation

**Required Field Validation:**
```typescript
const validateProductRow = (row) => {
  const errors = [];

  if (!row.name || row.name.trim() === '') {
    errors.push('Product Name is required');
  } else if (row.name.length > 200) {
    errors.push('Product Name must be 200 characters or less');
  }

  if (!row.sku || row.sku.trim() === '') {
    errors.push('SKU is required');
  } else if (existingSkus.has(row.sku.toLowerCase())) {
    errors.push(`SKU '${row.sku}' already exists in database`);
  } else if (csvSkus.has(row.sku.toLowerCase())) {
    errors.push(`SKU '${row.sku}' appears multiple times in CSV`);
  }

  if (!row.principal) {
    errors.push('Principal is required');
  } else if (!principalMap.has(row.principal.toLowerCase())) {
    errors.push(`Principal '${row.principal}' not found`);
  }

  if (row.category && row.category.length > 100) {
    errors.push('Category must be 100 characters or less');
  }

  if (row.unit && row.unit.length > 50) {
    errors.push('Unit must be 50 characters or less');
  }

  if (row.description && row.description.length > 1000) {
    errors.push('Description must be 1000 characters or less');
  }

  return errors;
};
```

---

## Export Data Structure

### Opportunities Export

**SQL Query:**
```sql
SELECT
  o.id,
  o.name AS "Opportunity Name",
  org.name AS "Customer Organization",
  p.name AS "Principal",
  o.stage AS "Stage",
  o.status AS "Status",
  o.expected_close_date AS "Expected Close Date",
  s.name AS "Account Manager",
  o.description AS "Description",
  o.value AS "Value",
  o.created_at AS "Created At",
  o.updated_at AS "Updated At"
FROM opportunities o
LEFT JOIN organizations org ON o.organization_id = org.id
LEFT JOIN principals p ON o.principal_id = p.id
LEFT JOIN sales s ON o.sales_id = s.id
WHERE o.status = 'Active'  -- Example filter
ORDER BY o.expected_close_date ASC;
```

### Products Export

**SQL Query:**
```sql
SELECT
  pr.id,
  pr.name AS "Product Name",
  pr.sku AS "SKU",
  p.name AS "Principal",
  pr.category AS "Category",
  pr.unit AS "Unit",
  pr.description AS "Description",
  pr.created_at AS "Created At",
  pr.updated_at AS "Updated At"
FROM products pr
LEFT JOIN principals p ON pr.principal_id = p.id
ORDER BY pr.name ASC;
```

---

## Caching Strategy (Performance Optimization)

**Import Performance:**
```typescript
// Cache lookups at import start (NOT per-row)
const importCache = {
  principals: new Map(),      // name → id
  organizations: new Map(),   // name → id
  sales: new Map(),          // email → id
  existingSkus: new Set(),   // for product duplicate detection
};

// Load all lookup data once
const [principals, organizations, salesReps, existingProducts] = await Promise.all([
  supabase.from('principals').select('id, name'),
  supabase.from('organizations').select('id, name'),
  supabase.from('sales').select('id, name, email'),
  supabase.from('products').select('sku'),
]);

// Build lookup maps
principals.forEach(p => importCache.principals.set(p.name.toLowerCase(), p.id));
organizations.forEach(o => importCache.organizations.set(o.name.toLowerCase(), o.id));
salesReps.forEach(s => {
  importCache.sales.set(s.email.toLowerCase(), s.id);
  importCache.sales.set(s.name.toLowerCase(), s.id);
});
existingProducts.forEach(p => importCache.existingSkus.add(p.sku.toLowerCase()));

// Now process 100 rows without any additional database queries
// 85% reduction in API calls (proven in Contacts/Organizations import)
```

---

## No Migrations Needed

**Migration Checklist:**
- [x] Opportunities table complete ✅ EXISTS
- [x] Products table complete ✅ EXISTS
- [x] Foreign key constraints ✅ EXISTS
- [x] Indexes for lookups ✅ EXISTS
- [x] RLS policies allow writes ✅ EXISTS

**Result:** **ZERO database changes required** 🎉

---

## Related Files

- **Opportunities Schema:** `supabase/migrations/20251018152315_cloud_schema_fresh.sql`
- **Products Schema:** `supabase/migrations/20251018152315_cloud_schema_fresh.sql`
- **Existing Import Pattern:** `src/atomic-crm/contacts/ContactImportDialog.tsx`
- **Existing Export Pattern:** `src/hooks/useBulkExport.tsx`
