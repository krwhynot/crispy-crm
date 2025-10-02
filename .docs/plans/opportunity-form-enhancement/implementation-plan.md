# Opportunity Form Enhancement - Implementation Plan

**Created**: 2025-10-01
**Status**: Ready for Implementation
**Estimated Duration**: 3-7 days
**Complexity**: Medium

## Overview

This plan implements matching layouts for opportunity show/edit modes with tabbed navigation, horizontal field grouping, and enhanced product line item tracking. The work is organized into 5 phases with parallel-executable tasks where possible.

## Execution Strategy

### Parallel Agent Decomposition

This implementation uses **4 parallel agents** for maximum efficiency:

1. **Backend Agent** - Database migrations, Zod validation schemas
2. **Core Components Agent** - Reusable components (header, inputs, tabs)
3. **Product Table Agent** - Inline editing product table implementation
4. **Integration Agent** - Connect all pieces, testing, polish

Agents 1-3 can work **in parallel**. Agent 4 depends on completion of 1-3.

---

## Phase 1: Database & Backend Setup
**Parallel Agent**: Backend Agent
**Duration**: 4-6 hours
**Dependencies**: None (can start immediately)

### Task 1.1: Create Database Migration
**File**: `supabase/migrations/20251001120000_enhance_opportunity_fields.sql`
**Estimated Time**: 2 hours

**Description**:
Create migration to add new fields to `opportunities` and `opportunity_products` tables.

**Implementation**:
```sql
-- Add new fields to opportunities table
ALTER TABLE opportunities
  ADD COLUMN account_manager_id UUID REFERENCES auth.users(id),
  ADD COLUMN lead_source TEXT CHECK (lead_source IN (
    'referral',
    'trade_show',
    'website',
    'cold_call',
    'email_campaign',
    'social_media',
    'partner',
    'existing_customer'
  )),
  ADD COLUMN name TEXT;

-- Add indexes
CREATE INDEX idx_opportunities_account_manager ON opportunities(account_manager_id);

-- Add new fields to opportunity_products (line items)
ALTER TABLE opportunity_products
  ADD COLUMN principal_id UUID REFERENCES organizations(id),
  ADD COLUMN unit_of_measure TEXT CHECK (unit_of_measure IN (
    'case', 'lb', 'kg', 'each', 'gallon', 'liter', 'dozen'
  )),
  ADD COLUMN extended_price DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED;

CREATE INDEX idx_opportunity_products_principal ON opportunity_products(principal_id);

-- Add comment explaining opportunity name generation
COMMENT ON COLUMN opportunities.name IS 'Auto-generated from customer + context, but user-editable';
```

**Acceptance Criteria**:
- [ ] Migration file created with timestamp `20251001120000`
- [ ] All new columns added with correct types and constraints
- [ ] Indexes created for foreign keys
- [ ] `extended_price` is a generated column (auto-calculated)
- [ ] Check constraints enforce valid enum values
- [ ] Migration runs successfully with `npm run migrate:production`

**Rollback Plan**:
Create corresponding rollback migration that drops columns and indexes.

---

### Task 1.2: Create Rollback Migration
**File**: `supabase/migrations/20251001120001_enhance_opportunity_fields_rollback.sql`
**Estimated Time**: 30 minutes

**Implementation**:
```sql
-- Remove columns (no backward compatibility needed)
ALTER TABLE opportunities
  DROP COLUMN IF EXISTS account_manager_id,
  DROP COLUMN IF EXISTS lead_source,
  DROP COLUMN IF EXISTS name;

DROP INDEX IF EXISTS idx_opportunities_account_manager;

ALTER TABLE opportunity_products
  DROP COLUMN IF EXISTS principal_id,
  DROP COLUMN IF EXISTS unit_of_measure,
  DROP COLUMN IF EXISTS extended_price;

DROP INDEX IF EXISTS idx_opportunity_products_principal;
```

**Acceptance Criteria**:
- [ ] Rollback migration created
- [ ] Can successfully rollback and re-apply forward migration
- [ ] No orphaned indexes or constraints after rollback

---

### Task 1.3: Update Zod Validation Schemas
**File**: `src/atomic-crm/validation/opportunities.ts`
**Estimated Time**: 1.5 hours
**Dependencies**: None (can work in parallel with Task 1.1)

**Implementation**:
```typescript
import { z } from 'zod';

// Update existing opportunitySchema
export const opportunitySchema = z.object({
  // Existing fields
  organization_id: z.string().uuid(),
  stage: z.string(),
  amount: z.number().positive().optional(),
  probability: z.number().min(0).max(100).optional(),
  expected_closing_date: z.string().datetime().optional(),

  // NEW FIELDS
  name: z.string().optional(), // Auto-generated but editable
  account_manager_id: z.string().uuid(),
  lead_source: z.enum([
    'referral',
    'trade_show',
    'website',
    'cold_call',
    'email_campaign',
    'social_media',
    'partner',
    'existing_customer'
  ]).optional(),

  // Existing fields
  opportunity_context: z.enum([
    'new_customer',
    'expansion',
    'renewal',
    'upsell',
    'cross_sell',
    'competitive_replacement',
    'referral'
  ]),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  principal_id: z.string().uuid().optional(),
  distributor_id: z.string().uuid().optional(),
  contact_ids: z.array(z.string().uuid()).optional(),
  description: z.string().optional(),
});

export const opportunityProductSchema = z.object({
  product_id: z.string().uuid(),
  principal_id: z.string().uuid(), // NEW - required
  quantity: z.number().positive(),
  unit_of_measure: z.enum(['case', 'lb', 'kg', 'each', 'gallon', 'liter', 'dozen']), // NEW
  unit_price: z.number().positive(),
  notes: z.string().optional(),
  // extended_price is calculated, not validated
});
```

**Acceptance Criteria**:
- [ ] `opportunitySchema` includes all new fields
- [ ] `account_manager_id` is required (UUID validation)
- [ ] `lead_source` enum matches database check constraint
- [ ] `opportunityProductSchema` includes `principal_id` and `unit_of_measure`
- [ ] Unit of measure enum matches database check constraint
- [ ] All existing validations preserved

---

### Task 1.4: Update TypeScript Types
**File**: `src/atomic-crm/types.ts`
**Estimated Time**: 1 hour

**Implementation**:
```typescript
export interface Opportunity {
  // Existing fields
  id: string;
  organization_id: string;
  stage: string;
  amount?: number;
  probability?: number;
  expected_closing_date?: string;

  // NEW FIELDS
  name?: string; // Auto-generated, editable
  account_manager_id: string;
  lead_source?: 'referral' | 'trade_show' | 'website' | 'cold_call' |
                'email_campaign' | 'social_media' | 'partner' | 'existing_customer';

  // Existing fields
  opportunity_context?: 'new_customer' | 'expansion' | 'renewal' | 'upsell' |
                        'cross_sell' | 'competitive_replacement' | 'referral';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  principal_id?: string;
  distributor_id?: string;
  contact_ids?: string[];
  description?: string;

  // Metadata
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface OpportunityProduct {
  id: string;
  opportunity_id: string;
  product_id: string;
  principal_id: string; // NEW
  quantity: number;
  unit_of_measure: 'case' | 'lb' | 'kg' | 'each' | 'gallon' | 'liter' | 'dozen'; // NEW
  unit_price: number;
  extended_price: number; // NEW - calculated field
  notes?: string;
  created_at: string;
  updated_at: string;
}
```

**Acceptance Criteria**:
- [ ] `Opportunity` interface updated with new fields
- [ ] `OpportunityProduct` interface updated
- [ ] Enums match Zod schemas exactly
- [ ] No TypeScript errors in codebase

---

## Phase 2: Core Components Development
**Parallel Agent**: Core Components Agent
**Duration**: 6-8 hours
**Dependencies**: Can start in parallel with Phase 1

### Task 2.1: Create OpportunityHeader Component
**File**: `src/atomic-crm/opportunities/OpportunityHeader.tsx`
**Estimated Time**: 2 hours

**Description**:
Reusable header component showing organization avatar, opportunity name, and action buttons (Archive/Edit in show mode, Archive/Cancel/Save in edit mode).

**Implementation**:
```tsx
import { useRecordContext } from 'ra-core';
import { OrganizationAvatar } from '../organizations/OrganizationAvatar';
import { Button } from '@/components/ui/button';
import { TextInput } from '@/components/admin/text-input';
import type { Opportunity } from '../types';

interface OpportunityHeaderProps {
  mode: 'show' | 'edit';
  onEdit?: () => void;
  onArchive?: () => void;
  onCancel?: () => void;
  onSave?: () => void;
}

export const OpportunityHeader = ({ mode, onEdit, onArchive, onCancel, onSave }: OpportunityHeaderProps) => {
  const record = useRecordContext<Opportunity>();

  if (!record) return null;

  return (
    <div className="flex items-center gap-3 mb-6">
      <OrganizationAvatar />

      {mode === 'show' ? (
        <h5 className="text-xl flex-1">{record.name}</h5>
      ) : (
        <div className="flex-1">
          <TextInput
            source="name"
            label={false}
            className="text-xl font-medium"
          />
        </div>
      )}

      <div className="flex gap-2">
        {mode === 'show' ? (
          <>
            <Button variant="outline" onClick={onArchive}>Archive</Button>
            <Button onClick={onEdit}>Edit</Button>
          </>
        ) : (
          <>
            <Button variant="outline" className="text-destructive" onClick={onArchive}>Archive</Button>
            <Button variant="outline" onClick={onCancel}>Cancel</Button>
            <Button onClick={onSave}>Save</Button>
          </>
        )}
      </div>
    </div>
  );
};
```

**Acceptance Criteria**:
- [ ] Component renders organization avatar
- [ ] Shows opportunity name (static in show mode, input in edit mode)
- [ ] Displays correct buttons based on mode
- [ ] Buttons trigger provided callback functions
- [ ] Matches layout preview design

---

### Task 2.2: Create AccountManagerInput Component
**File**: `src/atomic-crm/opportunities/AccountManagerInput.tsx`
**Estimated Time**: 1.5 hours

**Description**:
Dropdown input for selecting account manager from auth.users table.

**Implementation**:
```tsx
import { ReferenceInput, SelectInput } from 'react-admin';

export const AccountManagerInput = () => {
  return (
    <ReferenceInput
      source="account_manager_id"
      reference="auth.users"
      label="Account Manager"
    >
      <SelectInput
        optionText={(record) => `${record.raw_user_meta_data?.first_name || ''} ${record.raw_user_meta_data?.last_name || ''}`.trim() || record.email}
        optionValue="id"
      />
    </ReferenceInput>
  );
};
```

**Acceptance Criteria**:
- [ ] Fetches users from Supabase auth.users
- [ ] Displays user's first_name + last_name from metadata
- [ ] Falls back to email if name not available
- [ ] Works with React Admin form validation
- [ ] Defaults to current user on create (handle in parent component)

---

### Task 2.3: Create LeadSourceInput Component
**File**: `src/atomic-crm/opportunities/LeadSourceInput.tsx`
**Estimated Time**: 1 hour

**Description**:
Dropdown for selecting how the opportunity originated.

**Implementation**:
```tsx
import { SelectInput } from 'react-admin';

const LEAD_SOURCE_CHOICES = [
  { id: 'referral', name: 'Referral' },
  { id: 'trade_show', name: 'Trade Show' },
  { id: 'website', name: 'Website' },
  { id: 'cold_call', name: 'Cold Call' },
  { id: 'email_campaign', name: 'Email Campaign' },
  { id: 'social_media', name: 'Social Media' },
  { id: 'partner', name: 'Partner' },
  { id: 'existing_customer', name: 'Existing Customer' },
];

export const LeadSourceInput = () => {
  return (
    <SelectInput
      source="lead_source"
      label="Lead Source"
      choices={LEAD_SOURCE_CHOICES}
    />
  );
};
```

**Acceptance Criteria**:
- [ ] Displays all 8 lead source options
- [ ] Options match database enum values
- [ ] Labels are user-friendly (title case with spaces)
- [ ] Optional field (no validation error if empty)

---

### Task 2.4: Create useAutoGenerateName Hook
**File**: `src/atomic-crm/opportunities/useAutoGenerateName.ts`
**Estimated Time**: 1.5 hours

**Description**:
Hook to auto-generate opportunity name from customer organization + context, but allow manual editing.

**Implementation**:
```typescript
import { useEffect } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { useGetOne } from 'react-admin';

const CONTEXT_LABELS = {
  new_customer: 'New Customer',
  expansion: 'Expansion',
  renewal: 'Renewal',
  upsell: 'Upsell',
  cross_sell: 'Cross-Sell',
  competitive_replacement: 'Competitive Replacement',
  referral: 'Referral',
};

export const useAutoGenerateName = () => {
  const { setValue, getValues } = useFormContext();
  const organizationId = useWatch({ name: 'organization_id' });
  const opportunityContext = useWatch({ name: 'opportunity_context' });
  const currentName = useWatch({ name: 'name' });

  const { data: organization } = useGetOne(
    'organizations',
    { id: organizationId },
    { enabled: !!organizationId }
  );

  useEffect(() => {
    // Only auto-generate if name is empty or matches previous auto-generation pattern
    if (!organization || !opportunityContext) return;

    const autoGeneratedName = `${organization.name} - ${CONTEXT_LABELS[opportunityContext]}`;

    // If name is empty or hasn't been manually edited, update it
    const previousAutoName = getValues('_previousAutoName');
    if (!currentName || currentName === previousAutoName) {
      setValue('name', autoGeneratedName);
      setValue('_previousAutoName', autoGeneratedName);
    }
  }, [organization, opportunityContext, currentName, setValue, getValues]);
};
```

**Acceptance Criteria**:
- [ ] Auto-generates name when organization or context changes
- [ ] Does not overwrite manually edited names
- [ ] Tracks previous auto-generated name to detect manual edits
- [ ] Format: "{Organization Name} - {Context Label}"
- [ ] Works in both create and edit modes

---

### Task 2.5: Create OpportunityDetailsTab Component
**File**: `src/atomic-crm/opportunities/OpportunityDetailsTab.tsx`
**Estimated Time**: 2 hours

**Description**:
Tab content for Details tab with horizontal field grouping.

**Implementation**:
```tsx
import { DateInput, NumberInput, SelectInput, ReferenceInput, ReferenceArrayInput } from 'react-admin';
import { Separator } from '@/components/ui/separator';
import { AccountManagerInput } from './AccountManagerInput';
import { LeadSourceInput } from './LeadSourceInput';
import { OpportunityContextInput } from './OpportunityContextInput';

interface OpportunityDetailsTabProps {
  mode: 'show' | 'edit';
}

export const OpportunityDetailsTab = ({ mode }: OpportunityDetailsTabProps) => {
  return (
    <div>
      <div className="text-xs font-semibold text-muted-foreground tracking-wide mb-3">
        OPPORTUNITY OVERVIEW
      </div>

      {/* Row 1: Key metrics */}
      <div className="flex gap-8 m-4 flex-wrap">
        <div className="flex flex-col" style={{ minWidth: '200px' }}>
          <DateInput source="expected_closing_date" label="Expected Closing Date" />
        </div>
        <div className="flex flex-col" style={{ minWidth: '150px' }}>
          <NumberInput source="amount" label="Budget" />
        </div>
        <div className="flex flex-col" style={{ minWidth: '150px' }}>
          <NumberInput source="probability" label="Probability %" min={0} max={100} />
        </div>
        <div className="flex flex-col" style={{ minWidth: '200px' }}>
          <SelectInput source="stage" label="Stage" choices={/* stage choices */} />
        </div>
        <div className="flex flex-col" style={{ minWidth: '150px' }}>
          <SelectInput source="priority" label="Priority" choices={[
            { id: 'low', name: 'Low' },
            { id: 'medium', name: 'Medium' },
            { id: 'high', name: 'High' },
            { id: 'critical', name: 'Critical' },
          ]} />
        </div>
      </div>

      {/* Row 2: Account tracking */}
      <div className="flex gap-8 m-4 flex-wrap">
        <div className="flex flex-col" style={{ minWidth: '200px' }}>
          <AccountManagerInput />
        </div>
        <div className="flex flex-col" style={{ minWidth: '200px' }}>
          <LeadSourceInput />
        </div>
        <div className="flex flex-col" style={{ minWidth: '200px' }}>
          <OpportunityContextInput />
        </div>
      </div>

      <Separator className="my-5" />

      <div className="text-xs font-semibold text-muted-foreground tracking-wide mb-3">
        KEY RELATIONSHIPS
      </div>

      {/* Row 3: Organizations */}
      <div className="flex gap-8 m-4 flex-wrap">
        <div className="flex flex-col" style={{ minWidth: '250px', flex: 1 }}>
          <ReferenceInput source="organization_id" reference="organizations" label="Customer Organization">
            <SelectInput optionText="name" />
          </ReferenceInput>
        </div>
        <div className="flex flex-col" style={{ minWidth: '250px', flex: 1 }}>
          <ReferenceInput source="principal_id" reference="organizations" label="Principal">
            <SelectInput optionText="name" />
          </ReferenceInput>
        </div>
        <div className="flex flex-col" style={{ minWidth: '250px', flex: 1 }}>
          <ReferenceInput source="distributor_id" reference="organizations" label="Distributor">
            <SelectInput optionText="name" />
          </ReferenceInput>
        </div>
      </div>

      <Separator className="my-5" />

      <div className="text-xs font-semibold text-muted-foreground tracking-wide mb-3">
        CONTACTS
      </div>

      <div className="flex gap-8 m-4 flex-wrap">
        <div className="flex flex-col flex-1">
          <ReferenceArrayInput source="contact_ids" reference="contacts">
            {/* Contact chips/multi-select */}
          </ReferenceArrayInput>
        </div>
      </div>

      <Separator className="my-5" />

      <div className="text-xs font-semibold text-muted-foreground tracking-wide mb-3">
        DESCRIPTION
      </div>

      <div className="flex gap-8 m-4">
        <TextInput source="description" multiline rows={3} fullWidth />
      </div>
    </div>
  );
};
```

**Acceptance Criteria**:
- [ ] All fields grouped horizontally with proper spacing
- [ ] Sections separated by visual separators
- [ ] Fields wrap responsively on smaller screens
- [ ] minWidth set on fields to prevent over-compression
- [ ] Matches layout preview design exactly

---

## Phase 3: Product Table Implementation
**Parallel Agent**: Product Table Agent
**Duration**: 8-10 hours
**Dependencies**: Phase 1 (database migration) must be completed

### Task 3.1: Update OpportunityProductsInput with Inline Editing
**File**: `src/atomic-crm/opportunities/OpportunityProductsInput.tsx`
**Estimated Time**: 4 hours

**Description**:
Replace existing product input with React Admin DatagridInput for Excel-like inline editing.

**Implementation**:
```tsx
import {
  ArrayInput,
  SimpleFormIterator,
  ReferenceInput,
  SelectInput,
  NumberInput,
  TextInput,
  useRecordContext,
} from 'react-admin';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

const UNIT_OF_MEASURE_CHOICES = [
  { id: 'case', name: 'Case' },
  { id: 'lb', name: 'Pound (lb)' },
  { id: 'kg', name: 'Kilogram (kg)' },
  { id: 'each', name: 'Each' },
  { id: 'gallon', name: 'Gallon' },
  { id: 'liter', name: 'Liter' },
  { id: 'dozen', name: 'Dozen' },
];

export const OpportunityProductsInput = () => {
  return (
    <div>
      <div className="text-xs font-semibold text-muted-foreground tracking-wide mb-3">
        PRODUCT LINE ITEMS
      </div>

      <ArrayInput source="products" label={false}>
        <SimpleFormIterator
          inline
          disableReordering
          getItemLabel={() => ''}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Principal</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit of Measure</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Extended Price</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <ProductLineRow />
            </TableBody>
          </Table>
        </SimpleFormIterator>
      </ArrayInput>

      <ProductTotal />
    </div>
  );
};

const ProductLineRow = () => {
  return (
    <TableRow>
      <TableCell>
        <ReferenceInput source="product_id" reference="products">
          <SelectInput optionText="name" label={false} />
        </ReferenceInput>
      </TableCell>
      <TableCell>
        <ReferenceInput source="principal_id" reference="organizations">
          <SelectInput optionText="name" label={false} />
        </ReferenceInput>
      </TableCell>
      <TableCell>
        <NumberInput source="quantity" label={false} min={1} />
      </TableCell>
      <TableCell>
        <SelectInput source="unit_of_measure" choices={UNIT_OF_MEASURE_CHOICES} label={false} />
      </TableCell>
      <TableCell>
        <NumberInput source="unit_price" label={false} min={0} step={0.01} />
      </TableCell>
      <TableCell>
        <ExtendedPriceField />
      </TableCell>
      <TableCell>
        <TextInput source="notes" label={false} />
      </TableCell>
      <TableCell>
        {/* Remove button handled by SimpleFormIterator */}
      </TableCell>
    </TableRow>
  );
};

const ExtendedPriceField = () => {
  const record = useRecordContext();
  const extendedPrice = (record?.quantity || 0) * (record?.unit_price || 0);

  return (
    <div className="text-sm text-muted-foreground">
      ${extendedPrice.toFixed(2)}
    </div>
  );
};

const ProductTotal = () => {
  const record = useRecordContext();
  const total = (record?.products || []).reduce(
    (sum, product) => sum + (product.quantity || 0) * (product.unit_price || 0),
    0
  );

  return (
    <div className="flex justify-end mt-4 text-sm font-semibold">
      <div className="mr-4">Total:</div>
      <div>${total.toFixed(2)}</div>
    </div>
  );
};
```

**Acceptance Criteria**:
- [ ] Table renders with 7 columns + delete button
- [ ] All cells are inline-editable (click to edit)
- [ ] Product and Principal use reference dropdowns
- [ ] Unit of Measure dropdown shows all 7 options
- [ ] Extended Price auto-calculates (quantity × unit_price)
- [ ] Total row displays sum of all extended prices
- [ ] Add row button at bottom
- [ ] Delete button per row
- [ ] Matches layout preview table design

**Notes**:
React Admin's `SimpleFormIterator` with `inline` prop provides Excel-like editing. Alternative: Use custom implementation with table rows as form fields.

---

### Task 3.2: Create OpportunityProductsTab Component
**File**: `src/atomic-crm/opportunities/OpportunityProductsTab.tsx`
**Estimated Time**: 2 hours

**Description**:
Wrapper component for Products tab content.

**Implementation**:
```tsx
import { useRecordContext } from 'react-admin';
import { OpportunityProductsInput } from './OpportunityProductsInput';
import type { Opportunity } from '../types';

interface OpportunityProductsTabProps {
  mode: 'show' | 'edit';
}

export const OpportunityProductsTab = ({ mode }: OpportunityProductsTabProps) => {
  const record = useRecordContext<Opportunity>();

  if (mode === 'show') {
    return <OpportunityProductsShow />;
  }

  return <OpportunityProductsInput />;
};

const OpportunityProductsShow = () => {
  const record = useRecordContext<Opportunity>();

  return (
    <div>
      <div className="text-xs font-semibold text-muted-foreground tracking-wide mb-3">
        PRODUCT LINE ITEMS
      </div>

      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-3 text-xs text-muted-foreground">Product</th>
            <th className="text-left p-3 text-xs text-muted-foreground">Principal</th>
            <th className="text-left p-3 text-xs text-muted-foreground">Quantity</th>
            <th className="text-left p-3 text-xs text-muted-foreground">Unit of Measure</th>
            <th className="text-left p-3 text-xs text-muted-foreground">Unit Price</th>
            <th className="text-left p-3 text-xs text-muted-foreground">Extended Price</th>
            <th className="text-left p-3 text-xs text-muted-foreground">Notes</th>
          </tr>
        </thead>
        <tbody>
          {(record?.products || []).map((product) => (
            <tr key={product.id} className="border-b hover:bg-muted">
              <td className="p-3 text-sm">{product.product_name}</td>
              <td className="p-3 text-sm">{product.principal_name}</td>
              <td className="p-3 text-sm">{product.quantity}</td>
              <td className="p-3 text-sm">{product.unit_of_measure}</td>
              <td className="p-3 text-sm">${product.unit_price.toFixed(2)}</td>
              <td className="p-3 text-sm">${product.extended_price.toFixed(2)}</td>
              <td className="p-3 text-sm">{product.notes}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="font-semibold">
            <td colSpan={5} className="p-3 text-right">Total:</td>
            <td className="p-3">${/* calculate total */}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};
```

**Acceptance Criteria**:
- [ ] Show mode displays read-only table
- [ ] Edit mode displays editable table with inline editing
- [ ] Both modes show same columns in same order
- [ ] Total row calculated correctly
- [ ] Matches layout preview design

---

### Task 3.3: Create OpportunityNotesTab Component
**File**: `src/atomic-crm/opportunities/OpportunityNotesTab.tsx`
**Estimated Time**: 2 hours

**Description**:
Tab content for Notes & Activity with notes list and activity log.

**Implementation**:
```tsx
import { ReferenceManyField, Datagrid, TextField, DateField, useRecordContext } from 'react-admin';
import { Separator } from '@/components/ui/separator';
import { ActivityLog } from '../activity/ActivityLog';
import type { Opportunity } from '../types';

interface OpportunityNotesTabProps {
  mode: 'show' | 'edit';
}

export const OpportunityNotesTab = ({ mode }: OpportunityNotesTabProps) => {
  const record = useRecordContext<Opportunity>();

  return (
    <div>
      <div className="text-xs font-semibold text-muted-foreground tracking-wide mb-3">
        NOTES
      </div>

      <ReferenceManyField
        reference="opportunity_notes"
        target="opportunity_id"
        sort={{ field: 'created_at', order: 'DESC' }}
      >
        <div className="flex flex-col gap-2">
          {/* Notes list - reuse existing notes component pattern */}
        </div>
      </ReferenceManyField>

      {mode === 'edit' && (
        <div className="flex gap-2 mt-4">
          <input
            type="text"
            placeholder="Add a note..."
            className="flex-1 px-3 py-2 border rounded"
          />
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded">
            Add Note
          </button>
        </div>
      )}

      <Separator className="my-6" />

      <div className="text-xs font-semibold text-muted-foreground tracking-wide mb-3">
        ACTIVITY LOG
      </div>

      <ActivityLog opportunityId={record?.id} context="opportunity" />
    </div>
  );
};
```

**Acceptance Criteria**:
- [ ] Notes displayed in reverse chronological order
- [ ] Add note input shown in edit mode
- [ ] Activity log shows opportunity-related activities
- [ ] Separator between notes and activity sections
- [ ] Matches layout preview design

---

## Phase 4: Integration & Show/Edit Updates
**Parallel Agent**: Integration Agent
**Duration**: 6-8 hours
**Dependencies**: Phases 1, 2, and 3 must be completed

### Task 4.1: Update OpportunityShow with Tabs
**File**: `src/atomic-crm/opportunities/OpportunityShow.tsx`
**Estimated Time**: 3 hours

**Description**:
Add tab structure to OpportunityShow matching OrganizationShow pattern.

**Implementation**:
```tsx
import { ShowBase, useShowContext } from 'ra-core';
import { useNavigate, useMatch } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { OpportunityHeader } from './OpportunityHeader';
import { OpportunityDetailsTab } from './OpportunityDetailsTab';
import { OpportunityProductsTab } from './OpportunityProductsTab';
import { OpportunityNotesTab } from './OpportunityNotesTab';
import type { Opportunity } from '../types';

const OpportunityShow = () => (
  <ShowBase>
    <OpportunityShowContent />
  </ShowBase>
);

const OpportunityShowContent = () => {
  const { record, isPending } = useShowContext<Opportunity>();
  const navigate = useNavigate();

  // Get tab from URL or default to "details"
  const tabMatch = useMatch('/opportunities/:id/show/:tab');
  const currentTab = tabMatch?.params?.tab || 'details';

  const handleTabChange = (value: string) => {
    if (value === currentTab) return;
    if (value === 'details') {
      navigate(`/opportunities/${record?.id}/show`);
      return;
    }
    navigate(`/opportunities/${record?.id}/show/${value}`);
  };

  const handleEdit = () => {
    navigate(`/opportunities/${record?.id}/edit`);
  };

  const handleArchive = () => {
    // Archive logic
  };

  if (isPending || !record) return null;

  return (
    <div className="mt-2 flex pb-2">
      <Card className="flex-1">
        <CardContent>
          <OpportunityHeader
            mode="show"
            onEdit={handleEdit}
            onArchive={handleArchive}
          />

          <Tabs defaultValue={currentTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="notes">Notes & Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="details">
              <OpportunityDetailsTab mode="show" />
            </TabsContent>

            <TabsContent value="products">
              <OpportunityProductsTab mode="show" />
            </TabsContent>

            <TabsContent value="notes">
              <OpportunityNotesTab mode="show" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export { OpportunityShow };
export default OpportunityShow;
```

**Acceptance Criteria**:
- [ ] Three tabs render: Details, Products, Notes & Activity
- [ ] Tab selection persisted in URL
- [ ] Default tab is "details"
- [ ] Header shows organization avatar, name, Archive/Edit buttons
- [ ] Edit button navigates to edit mode
- [ ] Layout matches show mode in preview

---

### Task 4.2: Update OpportunityEdit with Matching Layout
**File**: `src/atomic-crm/opportunities/OpportunityEdit.tsx`
**Estimated Time**: 3 hours

**Description**:
Update edit mode to match show mode layout with tabs.

**Implementation**:
```tsx
import { EditBase, Form, useEditContext } from 'ra-core';
import { useNavigate, useMatch } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FormToolbar } from '../layout/FormToolbar';
import { OpportunityHeader } from './OpportunityHeader';
import { OpportunityDetailsTab } from './OpportunityDetailsTab';
import { OpportunityProductsTab } from './OpportunityProductsTab';
import { OpportunityNotesTab } from './OpportunityNotesTab';
import { useAutoGenerateName } from './useAutoGenerateName';
import type { Opportunity } from '../types';

const OpportunityEdit = () => (
  <EditBase actions={false} redirect="show">
    <OpportunityEditContent />
  </EditBase>
);

const OpportunityEditContent = () => {
  const { record, isPending } = useEditContext<Opportunity>();
  const navigate = useNavigate();

  // Get tab from URL or default to "details"
  const tabMatch = useMatch('/opportunities/:id/edit/:tab');
  const currentTab = tabMatch?.params?.tab || 'details';

  const handleTabChange = (value: string) => {
    if (value === currentTab) return;
    if (value === 'details') {
      navigate(`/opportunities/${record?.id}/edit`);
      return;
    }
    navigate(`/opportunities/${record?.id}/edit/${value}`);
  };

  const handleCancel = () => {
    navigate(`/opportunities/${record?.id}/show`);
  };

  const handleArchive = () => {
    // Archive logic
  };

  if (isPending || !record) return null;

  return (
    <div className="mt-2 flex pb-2">
      <Form className="flex flex-1 flex-col gap-4">
        <Card>
          <CardContent>
            <AutoGenerateNameEffect />

            <OpportunityHeader
              mode="edit"
              onCancel={handleCancel}
              onArchive={handleArchive}
            />

            <Tabs defaultValue={currentTab} onValueChange={handleTabChange}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="products">Products</TabsTrigger>
                <TabsTrigger value="notes">Notes & Activity</TabsTrigger>
              </TabsList>

              <TabsContent value="details">
                <OpportunityDetailsTab mode="edit" />
              </TabsContent>

              <TabsContent value="products">
                <OpportunityProductsTab mode="edit" />
              </TabsContent>

              <TabsContent value="notes">
                <OpportunityNotesTab mode="edit" />
              </TabsContent>
            </Tabs>

            <FormToolbar />
          </CardContent>
        </Card>
      </Form>
    </div>
  );
};

const AutoGenerateNameEffect = () => {
  useAutoGenerateName();
  return null;
};

export { OpportunityEdit };
export default OpportunityEdit;
```

**Acceptance Criteria**:
- [ ] Three tabs render: Details, Products, Notes & Activity
- [ ] Tab selection persisted in URL
- [ ] Default tab is "details"
- [ ] Header shows editable name, Archive/Cancel/Save buttons
- [ ] Cancel button navigates back to show mode
- [ ] Auto-generate name hook runs on organization/context change
- [ ] Layout exactly matches show mode (inputs instead of text)
- [ ] Save redirects to show mode

---

### Task 4.3: Update OpportunityCreate with New Fields
**File**: `src/atomic-crm/opportunities/OpportunityCreate.tsx`
**Estimated Time**: 2 hours

**Description**:
Add new fields to create form and set defaults (account_manager_id to current user).

**Implementation**:
```tsx
import { CreateBase, Form, useCreateContext } from 'ra-core';
import { useAuthProvider } from 'react-admin';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FormToolbar } from '../layout/FormToolbar';
import { OpportunityDetailsTab } from './OpportunityDetailsTab';
import { OpportunityProductsTab } from './OpportunityProductsTab';
import { useAutoGenerateName } from './useAutoGenerateName';

const OpportunityCreate = () => {
  const authProvider = useAuthProvider();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    authProvider.getIdentity().then(identity => setCurrentUser(identity));
  }, [authProvider]);

  return (
    <CreateBase
      actions={false}
      redirect="show"
      transform={(values) => ({
        ...values,
        account_manager_id: values.account_manager_id || currentUser?.id,
      })}
    >
      <OpportunityCreateContent />
    </CreateBase>
  );
};

const OpportunityCreateContent = () => {
  return (
    <div className="mt-2 flex pb-2">
      <Form className="flex flex-1 flex-col gap-4">
        <Card>
          <CardContent>
            <AutoGenerateNameEffect />

            <h5 className="text-xl mb-6">Create New Opportunity</h5>

            <Tabs defaultValue="details">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="products">Products</TabsTrigger>
              </TabsList>

              <TabsContent value="details">
                <OpportunityDetailsTab mode="edit" />
              </TabsContent>

              <TabsContent value="products">
                <OpportunityProductsTab mode="edit" />
              </TabsContent>
            </Tabs>

            <FormToolbar />
          </CardContent>
        </Card>
      </Form>
    </div>
  );
};

const AutoGenerateNameEffect = () => {
  useAutoGenerateName();
  return null;
};

export { OpportunityCreate };
export default OpportunityCreate;
```

**Acceptance Criteria**:
- [ ] Account manager defaults to current logged-in user
- [ ] Auto-generate name hook works on create
- [ ] Two tabs: Details and Products (no Notes & Activity for new records)
- [ ] All new fields available
- [ ] Save creates opportunity and redirects to show mode

---

## Phase 5: Testing & Polish
**Duration**: 4-6 hours
**Dependencies**: Phase 4 completed

### Task 5.1: Update Unit Tests
**Files**:
- `src/atomic-crm/opportunities/OpportunityCreate.spec.ts`
- `src/atomic-crm/opportunities/OpportunityEdit.spec.tsx`
- `src/atomic-crm/opportunities/OpportunityShow.spec.tsx`
**Estimated Time**: 2 hours

**Description**:
Update existing tests to account for new fields and layout changes.

**Test Cases**:
```typescript
describe('OpportunityCreate', () => {
  it('should default account_manager_id to current user', () => {
    // Test implementation
  });

  it('should auto-generate opportunity name from org + context', () => {
    // Test implementation
  });

  it('should allow manual override of auto-generated name', () => {
    // Test implementation
  });

  it('should render Details and Products tabs', () => {
    // Test implementation
  });
});

describe('OpportunityEdit', () => {
  it('should render matching layout to show mode', () => {
    // Test implementation
  });

  it('should preserve tab selection in URL', () => {
    // Test implementation
  });

  it('should update auto-generated name when org changes', () => {
    // Test implementation
  });

  it('should not override manually edited name', () => {
    // Test implementation
  });
});

describe('OpportunityShow', () => {
  it('should render three tabs: Details, Products, Notes & Activity', () => {
    // Test implementation
  });

  it('should display product line items with all columns', () => {
    // Test implementation
  });

  it('should calculate total extended price', () => {
    // Test implementation
  });
});

describe('OpportunityProductsInput', () => {
  it('should auto-calculate extended price', () => {
    // Test implementation
  });

  it('should allow adding new product rows', () => {
    // Test implementation
  });

  it('should allow deleting product rows', () => {
    // Test implementation
  });

  it('should validate required fields (product, principal, quantity, unit)', () => {
    // Test implementation
  });
});
```

**Acceptance Criteria**:
- [ ] All existing tests updated and passing
- [ ] New tests added for new functionality
- [ ] Edge cases covered (empty products, missing org, etc.)
- [ ] Test coverage maintained at current level

---

### Task 5.2: Add E2E Tests (Playwright)
**File**: `e2e/opportunities.spec.ts`
**Estimated Time**: 2 hours

**Description**:
Add end-to-end tests for complete opportunity creation and editing flows.

**Test Cases**:
```typescript
test.describe('Opportunity Form Layout', () => {
  test('create opportunity with auto-generated name', async ({ page }) => {
    // Navigate to create
    // Select customer organization
    // Select opportunity context
    // Verify name auto-generates
    // Fill required fields
    // Add product line items
    // Save
    // Verify redirect to show mode
  });

  test('edit mode layout matches show mode', async ({ page }) => {
    // Navigate to opportunity show
    // Take screenshot of Details tab
    // Click Edit
    // Take screenshot of Details tab
    // Compare layouts visually
  });

  test('inline edit product line items', async ({ page }) => {
    // Navigate to opportunity edit
    // Click Products tab
    // Edit quantity in table cell
    // Verify extended price updates
    // Edit unit price
    // Verify extended price updates
    // Verify total updates
  });

  test('tab navigation persists in URL', async ({ page }) => {
    // Navigate to opportunity show
    // Click Products tab
    // Verify URL contains /products
    // Refresh page
    // Verify Products tab still active
  });

  test('account manager defaults to current user', async ({ page }) => {
    // Navigate to create
    // Verify account manager field pre-filled
    // Verify value is current user
  });
});
```

**Acceptance Criteria**:
- [ ] All E2E tests pass
- [ ] Tests cover critical user flows
- [ ] Visual regression tests for layout consistency
- [ ] Tests run in CI pipeline

---

### Task 5.3: Update Data Provider for New Fields
**File**: `src/atomic-crm/providers/supabase/unifiedDataProvider.ts`
**Estimated Time**: 1 hour

**Description**:
Ensure data provider handles new fields correctly, including fetching related data for display.

**Updates Needed**:
- Add `account_manager_id`, `lead_source`, `name` to opportunity transformations
- Ensure product line items include `principal_id`, `unit_of_measure`, `extended_price`
- Add joins to fetch account manager name for display
- Add joins to fetch principal names for product line items

**Acceptance Criteria**:
- [ ] New fields saved correctly to database
- [ ] Related data fetched for display (account manager name, principal names)
- [ ] Validation runs for new fields
- [ ] No data loss on save

---

### Task 5.4: Manual Testing & Bug Fixes
**Estimated Time**: 2 hours

**Manual Testing Checklist**:
- [ ] Create new opportunity
  - [ ] Account manager defaults to current user
  - [ ] Name auto-generates from org + context
  - [ ] Can manually edit name
  - [ ] Lead source dropdown works
  - [ ] All tabs accessible
  - [ ] Can add product line items
  - [ ] Principal per line item works
  - [ ] Unit of measure dropdown works
  - [ ] Extended price calculates correctly
  - [ ] Total calculates correctly
  - [ ] Save successful
- [ ] Edit existing opportunity
  - [ ] Layout matches show mode
  - [ ] All fields editable
  - [ ] Tab navigation works
  - [ ] Tab selection persists in URL
  - [ ] Product table inline editing works
  - [ ] Save preserves all changes
  - [ ] Cancel discards changes
- [ ] Show opportunity
  - [ ] Three tabs render
  - [ ] Details tab shows all fields
  - [ ] Products tab shows table with all columns
  - [ ] Notes & Activity tab shows notes and activities
  - [ ] Edit button navigates to edit mode
  - [ ] Archive button works
- [ ] Responsive behavior
  - [ ] Fields wrap on iPad (768px)
  - [ ] Fields stack on mobile (<768px)
  - [ ] Tabs remain horizontal
  - [ ] Product table scrolls horizontally on small screens
- [ ] Data validation
  - [ ] Required fields enforce validation
  - [ ] Probability must be 0-100
  - [ ] Amount must be positive
  - [ ] Unit of measure must be valid enum value
  - [ ] Lead source must be valid enum value

**Acceptance Criteria**:
- [ ] All manual tests pass
- [ ] No console errors
- [ ] No visual glitches
- [ ] Performance acceptable (<2s page load)
- [ ] All bugs found and fixed

---

## Phase 6: Documentation & Memory Storage

### Task 6.1: Update Memory with Implementation Details
**Estimated Time**: 30 minutes

**Description**:
Store key implementation decisions and patterns in Memory MCP for future reference.

**Entities to Create**:
```typescript
// Feature entity
{
  entityType: 'feature',
  name: 'opportunity-form-enhancement',
  observations: [
    '2025-10-01',
    'Implemented matching layouts for opportunity show/edit modes',
    'Added tabbed navigation: Details, Products, Notes & Activity',
    'Horizontal field grouping for desktop/iPad efficiency',
    'Excel-like inline editing for product line items',
    'New fields: account_manager_id, lead_source, name (auto-generated)',
    'Product line items enhanced with principal_id, unit_of_measure, extended_price',
    'Auto-generate name hook: organization + context',
    'Tab state persisted in URL',
    'Files: OpportunityShow.tsx, OpportunityEdit.tsx, OpportunityDetailsTab.tsx, OpportunityProductsTab.tsx, OpportunityNotesTab.tsx'
  ]
}

// Architectural decision
{
  entityType: 'architectural-decision',
  name: 'opportunity-tabs-pattern',
  observations: [
    '2025-10-01',
    'Decision: Use tabs to organize opportunity form sections',
    'Rationale: Reduces scrolling, logical grouping, matches Organizations pattern',
    'Tab structure: Details (core fields), Products (line items), Notes & Activity',
    'Tab state persisted in URL for bookmarking',
    'Pattern reusable for other entity forms',
    'Implementation: shadcn/ui Tabs component',
    'Alternatives considered: Single scrollable page (rejected - too long)'
  ]
}

// Database change
{
  entityType: 'database-change',
  name: 'opportunity-fields-enhancement-migration',
  observations: [
    '2025-10-01',
    'Migration: 20251001120000_enhance_opportunity_fields.sql',
    'Added to opportunities: account_manager_id (UUID), lead_source (enum), name (TEXT)',
    'Added to opportunity_products: principal_id (UUID), unit_of_measure (enum), extended_price (DECIMAL calculated)',
    'Indexes: idx_opportunities_account_manager, idx_opportunity_products_principal',
    'Breaking change: No backward compatibility (per constitution)',
    'Rollback: 20251001120001_enhance_opportunity_fields_rollback.sql'
  ]
}
```

**Acceptance Criteria**:
- [ ] Memory entities created for feature, architectural decision, database change
- [ ] Relations created between entities
- [ ] All file paths documented
- [ ] Future developers can search memory for this implementation

---

### Task 6.2: Update CLAUDE.md (if needed)
**Estimated Time**: 15 minutes

**Description**:
Document any new patterns or conventions established during this implementation.

**Potential Updates**:
- Tab pattern for complex forms
- Auto-generated field pattern (name generation)
- Inline table editing pattern
- URL-based tab state management

**Acceptance Criteria**:
- [ ] CLAUDE.md updated with new patterns (if applicable)
- [ ] Examples provided for future reference
- [ ] No contradictions with existing constitution

---

## Summary & Rollout Plan

### Total Estimated Time
- **Phase 1**: 4-6 hours (Backend)
- **Phase 2**: 6-8 hours (Core Components)
- **Phase 3**: 8-10 hours (Product Table)
- **Phase 4**: 6-8 hours (Integration)
- **Phase 5**: 4-6 hours (Testing & Polish)
- **Phase 6**: 1 hour (Documentation)

**Total**: 29-39 hours (3.6-4.9 days at 8 hours/day)

### Parallel Execution Timeline

**Day 1**:
- Backend Agent: Tasks 1.1, 1.2, 1.3, 1.4 (Parallel)
- Core Components Agent: Tasks 2.1, 2.2, 2.3 (Parallel)

**Day 2**:
- Core Components Agent: Tasks 2.4, 2.5
- Product Table Agent: Task 3.1 (Parallel with Core Components)

**Day 3**:
- Product Table Agent: Tasks 3.2, 3.3
- Integration Agent: Tasks 4.1, 4.2 (start after Phase 1 completes)

**Day 4**:
- Integration Agent: Task 4.3
- Testing: Tasks 5.1, 5.2, 5.3 (Parallel)

**Day 5**:
- Manual Testing: Task 5.4
- Polish and bug fixes
- Documentation: Tasks 6.1, 6.2

### Risk Mitigation

**Risk 1**: React Admin DatagridInput doesn't support full Excel-like editing
- **Mitigation**: Have custom table implementation ready as fallback
- **Estimated Additional Time**: +4 hours if needed

**Risk 2**: Auto-generate name logic interferes with manual editing
- **Mitigation**: Thoroughly test name generation hook, use hidden field to track auto vs manual
- **Estimated Additional Time**: +2 hours for debugging

**Risk 3**: Tab state management conflicts with React Admin routing
- **Mitigation**: Follow proven Organizations pattern, test thoroughly
- **Estimated Additional Time**: +2 hours for adjustments

**Risk 4**: Performance issues with inline editing product table
- **Mitigation**: Limit to reasonable number of products (e.g., 50 max), add pagination if needed
- **Estimated Additional Time**: +3 hours for optimization

### Rollout Strategy

1. **Feature Flag** (Optional): Wrap new layout in feature flag for gradual rollout
2. **Staging Testing**: Deploy to staging, test with real data
3. **User Training**: Brief sales team on new layout (5-10 minutes)
4. **Production Deploy**: Deploy during low-traffic period
5. **Monitor**: Watch for errors, user feedback in first 48 hours
6. **Iterate**: Address feedback in follow-up release

### Success Criteria Checklist

- [ ] All tasks completed and tests passing
- [ ] Show mode and edit mode layouts match exactly
- [ ] Three tabs functional in both modes
- [ ] Horizontal field grouping works, wraps responsively
- [ ] All new fields (account_manager, lead_source, name) working
- [ ] Product line items have inline editing
- [ ] Principal and unit of measure per line item
- [ ] Extended price auto-calculates
- [ ] Total price calculates correctly
- [ ] Auto-generated name works, respects manual edits
- [ ] Tab state persists in URL
- [ ] No regressions in existing functionality
- [ ] Performance acceptable (<2s page load)
- [ ] Sales team approves layout
- [ ] Memory updated with implementation details

---

## Appendix A: File Changes Summary

### New Files Created
1. `supabase/migrations/20251001120000_enhance_opportunity_fields.sql`
2. `supabase/migrations/20251001120001_enhance_opportunity_fields_rollback.sql`
3. `src/atomic-crm/opportunities/OpportunityHeader.tsx`
4. `src/atomic-crm/opportunities/AccountManagerInput.tsx`
5. `src/atomic-crm/opportunities/LeadSourceInput.tsx`
6. `src/atomic-crm/opportunities/useAutoGenerateName.ts`
7. `src/atomic-crm/opportunities/OpportunityDetailsTab.tsx`
8. `src/atomic-crm/opportunities/OpportunityProductsTab.tsx`
9. `src/atomic-crm/opportunities/OpportunityNotesTab.tsx`

### Files Modified
1. `src/atomic-crm/validation/opportunities.ts` - Add new field validations
2. `src/atomic-crm/types.ts` - Add new fields to interfaces
3. `src/atomic-crm/opportunities/OpportunityShow.tsx` - Add tabs
4. `src/atomic-crm/opportunities/OpportunityEdit.tsx` - Add tabs and matching layout
5. `src/atomic-crm/opportunities/OpportunityCreate.tsx` - Add new fields
6. `src/atomic-crm/opportunities/OpportunityProductsInput.tsx` - Replace with inline editing
7. `src/atomic-crm/providers/supabase/unifiedDataProvider.ts` - Handle new fields
8. `src/atomic-crm/opportunities/OpportunityCreate.spec.ts` - Update tests
9. `src/atomic-crm/opportunities/OpportunityEdit.spec.tsx` - Update tests
10. `src/atomic-crm/opportunities/OpportunityShow.spec.tsx` - Update tests

### Files Potentially Affected
1. Any components using Opportunity type
2. Any components displaying opportunity lists (may need new columns)
3. Reports/dashboards using opportunity data

---

## Appendix B: Quick Start Commands

### Run Migration
```bash
npm run migrate:production
```

### Validate Migration
```bash
npm run migrate:status
```

### Generate TypeScript Types
```bash
npm run types:generate
```

### Run Unit Tests
```bash
npm run test
```

### Run E2E Tests
```bash
npm run test:e2e
```

### Start Dev Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

---

**Implementation Ready**: This plan is ready for execution. Begin with Phase 1 tasks in parallel.
