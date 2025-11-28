# MVP Blocker Implementation Tasks

**Created:** 2025-11-27
**Status:** Planning
**Priority:** P0 - Must complete before launch

---

## Overview

Four features identified during codebase audit that need implementation before MVP launch:

| # | Feature | Complexity | Estimated Effort |
|---|---------|------------|------------------|
| 1 | Sample Activity Type | Medium | 2-3 hours |
| 2 | Win/Loss Reasons UI | Medium | 3-4 hours |
| 3 | Duplicate Prevention | Medium | 2-3 hours |
| 4 | Authorization Tracking | High | 6-8 hours |

**Total Estimated Effort:** 13-18 hours

---

## 1. Sample Activity Type

### Goal
Add `sample` to the interaction_type enum with status tracking workflow.

### Current State
- 12 activity types exist: call, email, meeting, demo, proposal, follow_up, trade_show, site_visit, contract_review, check_in, social, note
- No `sample` type
- Pipeline stage `sample_visit_offered` exists but doesn't track sample status

### Tasks

#### 1.1 Database Migration
**File:** `supabase/migrations/YYYYMMDDHHMMSS_add_sample_interaction_type.sql`

```sql
-- Add 'sample' to interaction_type enum
ALTER TYPE interaction_type ADD VALUE IF NOT EXISTS 'sample';

-- Add sample_status enum for tracking workflow
CREATE TYPE sample_feedback_status AS ENUM ('sent', 'received', 'positive', 'negative', 'pending', 'no_response');

-- Add sample tracking fields to activities table
ALTER TABLE activities
ADD COLUMN IF NOT EXISTS sample_feedback_status sample_feedback_status DEFAULT NULL,
ADD COLUMN IF NOT EXISTS sample_product_id BIGINT REFERENCES products(id) DEFAULT NULL;

-- Index for sample queries
CREATE INDEX IF NOT EXISTS idx_activities_sample_status
ON activities(sample_feedback_status)
WHERE type = 'sample';
```

#### 1.2 Update Generated Types
**Action:** Run `npx supabase gen types typescript`

#### 1.3 Update Validation Schema
**File:** `src/atomic-crm/validation/activities.ts`

```typescript
// Add sample_feedback_status to ActivityRecord validation
sample_feedback_status: z.enum(['sent', 'received', 'positive', 'negative', 'pending', 'no_response']).optional().nullable(),
sample_product_id: z.number().int().positive().optional().nullable(),
```

#### 1.4 Update QuickLogForm
**File:** `src/atomic-crm/dashboard/v3/components/QuickLogForm.tsx`

- Add `sample` to activity type dropdown
- Show conditional fields when `sample` selected:
  - Product selector (filtered by principal)
  - Sample feedback status selector
  - Follow-up date field

#### 1.5 Update Activity Display
**Files:**
- `src/atomic-crm/utils/getActivityIcon.tsx` - Add sample icon
- `src/atomic-crm/activity-log/ActivityLog.tsx` - Display sample status badge

### Acceptance Criteria
- [ ] Can log `sample` activity type via QuickLogForm
- [ ] Sample activities show feedback status in activity timeline
- [ ] Can update sample feedback status after initial logging
- [ ] Sample icon displays correctly in activity lists

---

## 2. Win/Loss Reasons UI

### Goal
Require win/loss reason selection when closing an opportunity.

### Current State
- `loss_reason` field exists in database (comment in validation says "NOT validated")
- No UI for win/loss reason selection
- No validation requiring reason on close

### Tasks

#### 2.1 Database Migration
**File:** `supabase/migrations/YYYYMMDDHHMMSS_add_win_loss_reason_fields.sql`

```sql
-- Create win/loss reason enums
CREATE TYPE win_reason AS ENUM (
  'relationship',
  'product_quality',
  'price_competitive',
  'distributor_preference',
  'other'
);

CREATE TYPE loss_reason AS ENUM (
  'price_too_high',
  'no_authorization',
  'competitor_relationship',
  'product_not_fit',
  'timing_budget',
  'other'
);

-- Add fields to opportunities table
ALTER TABLE opportunities
ADD COLUMN IF NOT EXISTS win_reason win_reason DEFAULT NULL,
ADD COLUMN IF NOT EXISTS loss_reason loss_reason DEFAULT NULL,
ADD COLUMN IF NOT EXISTS close_reason_notes TEXT DEFAULT NULL;

-- Add constraint: win_reason required when closed_won
-- Add constraint: loss_reason required when closed_lost
-- (Enforce in application layer, not database)
```

#### 2.2 Update Validation Schema
**File:** `src/atomic-crm/validation/opportunities.ts`

```typescript
// Add win/loss reason schemas
export const winReasonSchema = z.enum([
  'relationship',
  'product_quality',
  'price_competitive',
  'distributor_preference',
  'other'
]);

export const lossReasonSchema = z.enum([
  'price_too_high',
  'no_authorization',
  'competitor_relationship',
  'product_not_fit',
  'timing_budget',
  'other'
]);

// Update opportunity schema
win_reason: winReasonSchema.optional().nullable(),
loss_reason: lossReasonSchema.optional().nullable(),
close_reason_notes: z.string().optional().nullable(),
```

#### 2.3 Create Close Opportunity Dialog
**File:** `src/atomic-crm/opportunities/CloseOpportunityDialog.tsx`

```typescript
// Dialog that appears when stage changed to closed_won or closed_lost
// - Shows appropriate reason dropdown (win or loss)
// - Optional notes field
// - Requires selection before saving
```

#### 2.4 Update Opportunity Edit Flow
**File:** `src/atomic-crm/opportunities/OpportunityInputs.tsx`

- Intercept stage change to closed_won/closed_lost
- Open CloseOpportunityDialog before saving
- Block save if reason not provided

#### 2.5 Display Close Reason
**Files:**
- `src/atomic-crm/opportunities/OpportunityShow.tsx` - Show reason in header
- `src/atomic-crm/opportunities/OpportunityList.tsx` - Add reason column (optional)

### Acceptance Criteria
- [ ] Dialog appears when changing stage to closed_won
- [ ] Dialog appears when changing stage to closed_lost
- [ ] Cannot save without selecting reason
- [ ] "Other" option shows notes field
- [ ] Close reason visible on opportunity detail page
- [ ] Reports include win/loss reason breakdown

---

## 3. Duplicate Prevention

### Goal
Block creation of duplicate opportunities (same Principal + Distributor + Customer + Product).

### Current State
- CSV import has duplicate detection
- No duplicate check on normal opportunity create/edit
- No unique constraint in database

### Tasks

#### 3.1 Create Duplicate Check RPC
**File:** `supabase/migrations/YYYYMMDDHHMMSS_add_duplicate_opportunity_check.sql`

```sql
-- RPC to check for duplicate opportunity
CREATE OR REPLACE FUNCTION check_duplicate_opportunity(
  p_principal_id BIGINT,
  p_customer_id BIGINT,
  p_distributor_id BIGINT DEFAULT NULL,
  p_product_ids BIGINT[] DEFAULT NULL,
  p_exclude_id BIGINT DEFAULT NULL -- For edit: exclude current opportunity
)
RETURNS TABLE (
  duplicate_found BOOLEAN,
  duplicate_id BIGINT,
  duplicate_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    TRUE as duplicate_found,
    o.id as duplicate_id,
    o.name as duplicate_name
  FROM opportunities o
  LEFT JOIN opportunity_products op ON o.id = op.opportunity_id
  WHERE o.principal_organization_id = p_principal_id
    AND o.customer_organization_id = p_customer_id
    AND (p_distributor_id IS NULL OR o.distributor_organization_id = p_distributor_id)
    AND (p_product_ids IS NULL OR op.product_id_reference = ANY(p_product_ids))
    AND o.deleted_at IS NULL
    AND (p_exclude_id IS NULL OR o.id != p_exclude_id)
  LIMIT 1;

  -- If no rows returned, return false
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::BIGINT, NULL::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 3.2 Add Duplicate Check Hook
**File:** `src/atomic-crm/opportunities/hooks/useDuplicateCheck.ts`

```typescript
// Custom hook to check for duplicates before save
export function useDuplicateCheck() {
  const dataProvider = useDataProvider();

  const checkDuplicate = async (data: OpportunityInput, excludeId?: number) => {
    // Call RPC
    // Return { isDuplicate, duplicateId, duplicateName }
  };

  return { checkDuplicate };
}
```

#### 3.3 Create Duplicate Warning Dialog
**File:** `src/atomic-crm/opportunities/DuplicateWarningDialog.tsx`

```typescript
// Shows when duplicate detected
// - Message: "A similar opportunity already exists"
// - Link to existing opportunity
// - Block creation (no override option per PRD)
```

#### 3.4 Integrate into Create/Edit Flow
**Files:**
- `src/atomic-crm/opportunities/OpportunityCreate.tsx`
- `src/atomic-crm/opportunities/OpportunityEdit.tsx`

- Add duplicate check before save
- Show DuplicateWarningDialog if match found
- Block save if duplicate exists

### Acceptance Criteria
- [ ] Creating opportunity with same Principal+Customer+Distributor+Product shows warning
- [ ] Cannot proceed with creation when duplicate exists
- [ ] Warning shows link to existing opportunity
- [ ] Edit mode excludes current opportunity from check
- [ ] Check runs on client before server save

---

## 4. Authorization Tracking

### Goal
Track which distributors are authorized to carry which principals' products.

### Current State
- No authorization table
- No UI for managing authorizations
- No warning when creating opportunities for non-authorized combos

### Tasks

#### 4.1 Database Migration
**File:** `supabase/migrations/YYYYMMDDHHMMSS_create_authorizations_table.sql`

```sql
-- Authorization status enum
CREATE TYPE authorization_status AS ENUM ('authorized', 'not_authorized', 'pending');

-- Authorizations table
CREATE TABLE authorizations (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  distributor_id BIGINT NOT NULL REFERENCES organizations(id),
  principal_id BIGINT NOT NULL REFERENCES organizations(id),
  status authorization_status NOT NULL DEFAULT 'pending',
  authorized_date DATE,
  expiry_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by BIGINT REFERENCES sales(id),
  deleted_at TIMESTAMPTZ,

  -- Unique constraint: one record per distributor-principal pair
  CONSTRAINT unique_distributor_principal UNIQUE (distributor_id, principal_id)
);

-- Enable RLS
ALTER TABLE authorizations ENABLE ROW LEVEL SECURITY;

-- Policies (team-wide visibility)
CREATE POLICY select_authorizations ON authorizations
  FOR SELECT TO authenticated USING (deleted_at IS NULL);

CREATE POLICY insert_authorizations ON authorizations
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY update_authorizations ON authorizations
  FOR UPDATE TO authenticated USING (true);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON authorizations TO authenticated;
GRANT USAGE ON SEQUENCE authorizations_id_seq TO authenticated;

-- Index for common queries
CREATE INDEX idx_authorizations_distributor ON authorizations(distributor_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_authorizations_principal ON authorizations(principal_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_authorizations_status ON authorizations(status) WHERE deleted_at IS NULL;
```

#### 4.2 Create Authorization Types
**File:** `src/atomic-crm/types.ts`

```typescript
export interface Authorization {
  id: Identifier;
  distributor_id: Identifier;
  principal_id: Identifier;
  status: 'authorized' | 'not_authorized' | 'pending';
  authorized_date?: string;
  expiry_date?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  created_by?: Identifier;
  deleted_at?: string;

  // Computed fields from view
  distributor_name?: string;
  principal_name?: string;
}
```

#### 4.3 Create Authorization Validation
**File:** `src/atomic-crm/validation/authorizations.ts`

```typescript
export const authorizationSchema = z.object({
  distributor_id: z.number().int().positive(),
  principal_id: z.number().int().positive(),
  status: z.enum(['authorized', 'not_authorized', 'pending']),
  authorized_date: z.string().optional().nullable(),
  expiry_date: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});
```

#### 4.4 Add to Data Provider
**File:** `src/atomic-crm/providers/supabase/resources.ts`

```typescript
// Add 'authorizations' to resource list
```

#### 4.5 Create Authorization Management UI
**Files:**
- `src/atomic-crm/authorizations/AuthorizationList.tsx`
- `src/atomic-crm/authorizations/AuthorizationEdit.tsx`
- `src/atomic-crm/authorizations/AuthorizationCreate.tsx`
- `src/atomic-crm/authorizations/index.ts`

#### 4.6 Add Authorization Tab to Distributor Page
**File:** `src/atomic-crm/organizations/OrganizationShow.tsx`

- Add "Authorizations" tab for distributor type organizations
- Show list of principals with authorization status
- Quick add/edit authorization inline

#### 4.7 Add Authorization Warning to Opportunity Create
**Files:**
- `src/atomic-crm/opportunities/hooks/useAuthorizationCheck.ts`
- `src/atomic-crm/opportunities/AuthorizationWarningBanner.tsx`

```typescript
// When distributor selected, check authorization status
// Show warning banner if not authorized (but allow creation)
```

#### 4.8 Register Resource
**File:** `src/atomic-crm/root/CRM.tsx`

```typescript
<Resource
  name="authorizations"
  list={AuthorizationList}
  edit={AuthorizationEdit}
  create={AuthorizationCreate}
/>
```

### Acceptance Criteria
- [ ] Can create/edit/view authorizations
- [ ] Authorizations appear on Distributor detail page
- [ ] Warning shows when creating opportunity with non-authorized combo
- [ ] Can filter opportunities by authorization status
- [ ] Authorization status visible in opportunity list (optional column)

---

## Implementation Order

**Recommended sequence:**

1. **Sample Activity Type** (2-3h) - Unblocks accurate activity tracking
2. **Win/Loss Reasons** (3-4h) - Required for accurate reporting
3. **Duplicate Prevention** (2-3h) - Data quality protection
4. **Authorization Tracking** (6-8h) - Largest feature, do last

**Alternative parallel approach:**

- Developer A: Sample Type + Win/Loss (5-7h)
- Developer B: Duplicates + Authorizations (8-11h)

---

## Testing Checklist

### Sample Activity Type
- [ ] Unit: Sample validation schema
- [ ] Integration: QuickLogForm with sample type
- [ ] E2E: Full sample logging workflow

### Win/Loss Reasons
- [ ] Unit: Win/loss validation schema
- [ ] Integration: Close opportunity dialog
- [ ] E2E: Close won/lost opportunity flow

### Duplicate Prevention
- [ ] Unit: Duplicate check RPC
- [ ] Integration: Create opportunity with duplicate
- [ ] E2E: Full duplicate detection flow

### Authorization Tracking
- [ ] Unit: Authorization validation schema
- [ ] Integration: Authorization CRUD
- [ ] Integration: Authorization warning in opportunity
- [ ] E2E: Full authorization management flow

---

## Dependencies

| Feature | Database | Types | Validation | UI | Tests |
|---------|----------|-------|------------|-----|-------|
| Sample Type | Migration | Update | Update | QuickLogForm | All |
| Win/Loss | Migration | Update | Update | Dialog + Display | All |
| Duplicates | RPC | - | - | Hook + Dialog | All |
| Authorizations | Migration | New | New | Full Resource | All |

---

*Created from codebase audit on 2025-11-27*
