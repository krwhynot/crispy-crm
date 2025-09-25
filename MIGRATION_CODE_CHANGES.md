# Migration Code Changes Guide

## 🔄 What Changes in Your Code

### Component Name Changes
```
OLD CODE                          NEW CODE
────────────────────────────────────────────────────
import DealList from              import OpportunityList from
  '../deals/DealList'               '../opportunities/OpportunityList'

<DealCard deal={deal} />          <OpportunityCard opportunity={opp} />

<DealShow id={dealId} />          <OpportunityShow id={opportunityId} />
```

### API Calls Change
```javascript
// ❌ OLD - This will fail after migration
const { data } = await dataProvider.getList('deals', {
  pagination: { page: 1, perPage: 10 }
});

// ✅ NEW - This is what you need
const { data } = await dataProvider.getList('opportunities', {
  pagination: { page: 1, perPage: 10 }
});
```

### Type Changes
```typescript
// ❌ OLD Types (will cause compilation errors)
interface Deal {
  id: number;
  name: string;
  company_id: number;
  amount: number;
  stage: string;
}

// ✅ NEW Types
interface Opportunity {
  id: number;
  name: string;
  customer_organization_id: number; // Note: different field name!
  amount: number;
  stage: string;
  priority: 'high' | 'medium' | 'low';
  probability: number;
  status: 'active' | 'won' | 'lost';
}
```

## 📁 File Structure Changes

```
src/atomic-crm/
│
├── deals/                    ❌ REMOVE ENTIRE DIRECTORY
│   ├── DealList.tsx
│   ├── DealShow.tsx
│   ├── DealEdit.tsx
│   └── ...
│
├── opportunities/            ✅ USE THIS INSTEAD
│   ├── OpportunityList.tsx
│   ├── OpportunityShow.tsx
│   ├── OpportunityEdit.tsx
│   └── ...
│
├── contacts/
│   ├── ContactEdit.tsx      ← Modified for multi-org
│   ├── ContactMultiOrg.tsx  ← NEW component
│   └── ...
│
└── companies/
    ├── CompanyEdit.tsx       ← Enhanced with types
    └── CompanyOrganizationType.tsx ← NEW component
```

## 🔍 Database Query Changes

### Simple Queries
```sql
-- ❌ OLD Query (will fail)
SELECT * FROM deals WHERE stage = 'qualified';

-- ✅ NEW Query
SELECT * FROM opportunities WHERE stage = 'qualified';
```

### Join Queries
```sql
-- ❌ OLD: Direct company relationship
SELECT d.*, c.name as company_name
FROM deals d
JOIN companies c ON d.company_id = c.id;

-- ✅ NEW: Through participants table
SELECT o.*, c.name as company_name
FROM opportunities o
JOIN opportunity_participants op ON o.id = op.opportunity_id
JOIN companies c ON op.organization_id = c.id
WHERE op.is_primary = true;
```

### Contact Queries
```sql
-- ❌ OLD: Single company per contact
SELECT * FROM contacts WHERE company_id = 123;

-- ✅ NEW: Multiple organizations per contact
SELECT c.*
FROM contacts c
JOIN contact_organizations co ON c.id = co.contact_id
WHERE co.organization_id = 123;
```

## 🎨 UI Component Updates

### Lists and Filters
```jsx
// ❌ OLD DealList Component
export const DealList = () => (
  <List
    resource="deals"
    filters={<DealFilters />}
  >
    <Datagrid>
      <TextField source="name" />
      <ReferenceField source="company_id" reference="companies">
        <TextField source="name" />
      </ReferenceField>
    </Datagrid>
  </List>
);

// ✅ NEW OpportunityList Component
export const OpportunityList = () => (
  <List
    resource="opportunities"  // Changed resource name
    filters={<OpportunityFilters />}
  >
    <Datagrid>
      <TextField source="name" />
      <ReferenceField
        source="customer_organization_id"  // Changed field name
        reference="companies"
      >
        <TextField source="name" />
      </ReferenceField>
      <ChipField source="priority" />  // New field
      <NumberField source="probability" />  // New field
    </Datagrid>
  </List>
);
```

### Edit Forms
```jsx
// ❌ OLD Contact Edit - Single Company
<ReferenceInput
  source="company_id"
  reference="companies"
>
  <SelectInput optionText="name" />
</ReferenceInput>

// ✅ NEW Contact Edit - Multiple Organizations
<ContactMultiOrg />  // New component handling multiple relationships
```

## 🔀 Data Provider Changes

### Without Backward Compatibility (Current State)
```javascript
// Data Provider
const dataProvider = withLifecycleCallbacks(
  withSupabaseFilterAdapter(dataProviderWithCustomMethod),
  [
    // NO "deals" ResourceCallbacks - removed
    {
      resource: "opportunities",
      // ... opportunity callbacks
    }
  ]
);

// Any code trying to access 'deals' will immediately fail
// This is intentional - forces you to update all references
```

## 🚫 What Will Break (And How to Fix)

### 1. Resource References
```javascript
// ❌ BREAKS
dataProvider.getList('deals', params)
// Error: Resource 'deals' not found

// ✅ FIX
dataProvider.getList('opportunities', params)
```

### 2. Field Names
```javascript
// ❌ BREAKS
const companyId = opportunity.company_id
// TypeError: Cannot read property 'company_id' of undefined

// ✅ FIX
const companyId = opportunity.customer_organization_id
```

### 3. Type Imports
```typescript
// ❌ BREAKS
import type { Deal, DealNote } from '../types'
// Error: Module has no exported member 'Deal'

// ✅ FIX
import type { Opportunity, OpportunityNote } from '../types'
```

### 4. Component Imports
```javascript
// ❌ BREAKS
import DealList from '../deals/DealList'
// Error: Cannot find module '../deals/DealList'

// ✅ FIX
import OpportunityList from '../opportunities/OpportunityList'
```

## 📊 Migration Impact Map

```
Component/File                    Impact Level    Action Required
─────────────────────────────────────────────────────────────────
src/App.tsx                       HIGH            Update routes
src/atomic-crm/root/CRM.tsx       HIGH            Remove deals resource
src/atomic-crm/dashboard/*        HIGH            Update all widgets
src/atomic-crm/deals/*            CRITICAL        Remove directory
src/atomic-crm/opportunities/*    LOW             Already migrated
src/atomic-crm/contacts/*         MEDIUM          Multi-org updates
src/atomic-crm/companies/*        MEDIUM          Type enhancements
src/atomic-crm/providers/*        CRITICAL        No backward compat
src/atomic-crm/types.ts          HIGH            Remove Deal types
```

## 🎯 Step-by-Step Fix Guide

### Step 1: Update Imports
```bash
# Find all Deal imports
grep -r "from.*deals" src/

# Replace with opportunities
# Manual replacement needed for each file
```

### Step 2: Update Type References
```bash
# Find all Deal type usage
grep -r ": Deal\|<Deal\|Deal>" src/

# Replace with Opportunity types
```

### Step 3: Update API Calls
```bash
# Find all 'deals' string literals
grep -r "'deals'\|\"deals\"" src/

# Replace with 'opportunities'
```

### Step 4: Update Field Names
```bash
# Find old field references
grep -r "company_id\|deal_id" src/

# Update to new field names:
# company_id -> customer_organization_id
# deal_id -> opportunity_id
```

### Step 5: Test Everything
```bash
# Run tests to find remaining issues
npm test

# Each failure shows exactly what needs fixing
# Fix one at a time until all pass
```

## 🔥 Common Errors and Solutions

### Error 1: Resource Not Found
```
Error: Resource 'deals' not found in data provider
```
**Solution:** Change 'deals' to 'opportunities' in the API call

### Error 2: Type Not Exported
```
Error: Module '../types' has no exported member 'Deal'
```
**Solution:** Change Deal to Opportunity in import statement

### Error 3: Property Doesn't Exist
```
TypeError: Cannot read property 'company_id' of undefined
```
**Solution:** Use 'customer_organization_id' instead

### Error 4: Component Not Found
```
Error: Cannot find module '../deals/DealList'
```
**Solution:** Import from '../opportunities/OpportunityList'

## 🎬 The Migration Process for Your Code

1. **Before Migration:** Your code uses 'deals' everywhere
2. **Migration Runs:** Database schema changes
3. **After Migration:** 'deals' no longer exists
4. **Your Code Breaks:** All deal references fail
5. **You Fix Each Error:** Update to use 'opportunities'
6. **Code Works Again:** Now using new schema

This "fail fast" approach ensures nothing is missed!