# Quick Add Booth Visitor - Design Document

**Date:** 2025-11-03
**Feature:** Trade Show Quick Add
**Target Speed:** 30-45 seconds per entry
**Status:** Approved, Ready for Implementation

---

## Problem Statement

Sales reps at trade shows must capture leads quickly. The current full opportunity form requires 2-3 minutes and forces entry of fields irrelevant to booth conversations. This slows data capture and risks losing prospects.

---

## Solution: Quick Add Dialog

A separate "Quick Add" button opens a streamlined modal that creates three records from one form: Customer Organization, Contact, and Opportunity.

### User Flow

1. Rep clicks "⚡ Quick Add" in opportunities list header
2. Modal opens with Campaign and Principal pre-filled
3. Rep enters contact details (first/last name, phone or email)
4. Rep enters organization details (name, city via autocomplete)
5. Rep optionally selects product and adds quick note
6. Rep clicks "Save & Add Another" or "Save & Close"
7. System creates organization, contact, and opportunity atomically
8. Success toast displays 2-second summary
9. Form clears, retains pre-fills, ready for next visitor

### Target: 30-45 seconds per entry

---

## Form Fields

### Pre-filled (editable, light green background)
- **Campaign** - Text input (e.g., "NRA Show 2025")
- **Principal** - Select input (e.g., "Sysco")

### Contact Information (required)
- **First Name*** - Text input
- **Last Name*** - Text input
- **Phone** - Text input, type="tel"
- **Email** - Text input, type="email"
- *Validation: At least one of Phone or Email required*

### Organization Information (required)
- **Organization Name*** - Text input
- **City*** - Autocomplete text input
- **State*** - Auto-filled from city selection

### Optional Details
- **Product** - Multi-select, filtered by Principal
- **Quick Note** - Text input (single line)

### Footer Actions
- **Cancel** (left) - Closes modal without saving
- **Save & Add Another** (center) - Primary button
- **Save & Close** (right) - Secondary button

---

## Data Creation Strategy

### Atomic Server-Side Transaction

The system creates all three records via a single PostgreSQL function. This ensures atomicity: all records exist, or none do.

**Why Not Client-Side Sequential Calls?**
- Client-side rollback (DELETE calls) is unreliable
- Browser crashes mid-operation leave orphaned records
- Network failures create inconsistent state
- Violates "fail fast" principle with complex error handling

**PostgreSQL Function: `create_booth_visitor_opportunity`**

```sql
CREATE OR REPLACE FUNCTION create_booth_visitor_opportunity(_data JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _org_id BIGINT;
  _contact_id BIGINT;
  _opp_id BIGINT;
  _sales_id BIGINT;
BEGIN
  _sales_id := (SELECT id FROM sales WHERE user_id = auth.uid());

  -- Create Organization
  INSERT INTO organizations (
    name, city, state, organization_type, sales_id, segment_id
  ) VALUES (
    _data->>'org_name',
    _data->>'city',
    _data->>'state',
    'customer',
    _sales_id,
    '562062be-c15b-417f-b2a1-d4a643d69d52'::uuid
  ) RETURNING id INTO _org_id;

  -- Create Contact
  INSERT INTO contacts (
    first_name, last_name, organization_id, sales_id,
    email, phone, first_seen, last_seen, tags
  ) VALUES (
    _data->>'first_name',
    _data->>'last_name',
    _org_id,
    _sales_id,
    CASE WHEN _data->>'email' IS NOT NULL
      THEN jsonb_build_array(jsonb_build_object('email', _data->>'email', 'type', 'Work'))
      ELSE '[]'::jsonb END,
    CASE WHEN _data->>'phone' IS NOT NULL
      THEN jsonb_build_array(jsonb_build_object('number', _data->>'phone', 'type', 'Work'))
      ELSE '[]'::jsonb END,
    NOW(), NOW(), '[]'::jsonb
  ) RETURNING id INTO _contact_id;

  -- Create Opportunity
  INSERT INTO opportunities (
    name, customer_organization_id, principal_organization_id,
    contact_ids, campaign, stage, priority, estimated_close_date,
    lead_source, description, sales_id
  ) VALUES (
    _data->>'campaign' || ' - ' || _data->>'org_name' || ' - ' ||
      (SELECT name FROM organizations WHERE id = (_data->>'principal_id')::BIGINT),
    _org_id,
    (_data->>'principal_id')::BIGINT,
    jsonb_build_array(_contact_id),
    _data->>'campaign',
    'new_lead',
    'medium',
    (CURRENT_DATE + INTERVAL '30 days')::date,
    'trade_show',
    _data->>'quick_note',
    _sales_id
  ) RETURNING id INTO _opp_id;

  -- Link products if provided
  IF _data->'product_ids' IS NOT NULL THEN
    INSERT INTO opportunity_products (opportunity_id, product_id)
    SELECT _opp_id, (jsonb_array_elements_text(_data->'product_ids'))::BIGINT;
  END IF;

  RETURN jsonb_build_object(
    'organization_id', _org_id,
    'contact_id', _contact_id,
    'opportunity_id', _opp_id,
    'success', true
  );

EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Failed to create booth visitor: %', SQLERRM;
END;
$$;

GRANT EXECUTE ON FUNCTION create_booth_visitor_opportunity(JSONB) TO authenticated;
```

---

## Technical Implementation

### Component Architecture

**New Files:**
1. `src/atomic-crm/opportunities/QuickAddButton.tsx` - Button in list header
2. `src/atomic-crm/opportunities/QuickAddDialog.tsx` - Modal wrapper
3. `src/atomic-crm/opportunities/QuickAddForm.tsx` - Form fields and layout
4. `src/atomic-crm/opportunities/hooks/useQuickAdd.ts` - Business logic hook
5. `src/atomic-crm/validation/quickAdd.ts` - Zod validation schema
6. `supabase/migrations/YYYYMMDD_create_booth_visitor_function.sql` - Database function

### Data Provider Extension

```typescript
// src/atomic-crm/providers/supabase/unifiedDataProvider.ts
const unifiedDataProvider = {
  // ... existing methods

  createBoothVisitor: async (data: any) => {
    const { data: result, error } = await supabase.rpc(
      'create_booth_visitor_opportunity',
      { _data: data }
    );

    if (error) throw new Error(error.message);
    return { data: result };
  },
};
```

### React Hook Pattern

```typescript
// useQuickAdd.ts
import { useMutation } from '@tanstack/react-query';
import { useDataProvider, useNotify } from 'react-admin';

export const useQuickAdd = () => {
  const dataProvider = useDataProvider();
  const notify = useNotify();

  const mutation = useMutation({
    mutationFn: (formData) => dataProvider.createBoothVisitor(formData),
    onSuccess: (result, formData) => {
      // Update localStorage for next entry
      localStorage.setItem('last_campaign', formData.campaign);
      localStorage.setItem('last_principal', formData.principal_id);

      // Show 2-second success toast
      notify(`✅ Created: ${formData.first_name} ${formData.last_name} - ${formData.org_name}`, {
        type: 'success',
        autoHideDuration: 2000
      });

      // Form clearing handled by component
    },
    onError: (error) => {
      notify(`Failed to create booth visitor: ${error.message}`, { type: 'error' });
      // PRESERVE form data - user reviews and manually re-submits
      // NO automatic retry button (violates "fail fast" principle)
    },
  });

  return mutation;
};
```

### Validation Schema

```typescript
// src/atomic-crm/validation/quickAdd.ts
import { z } from "zod";

export const quickAddSchema = z.object({
  first_name: z.string().min(1, "First name required"),
  last_name: z.string().min(1, "Last name required"),
  org_name: z.string().min(1, "Organization name required"),
  city: z.string().min(1, "City required"),
  state: z.string().min(1, "State required"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email address").optional(),
  campaign: z.string().min(1, "Campaign required"),
  principal_id: z.number({ required_error: "Principal required" }),
  product_ids: z.array(z.number()).optional().default([]),
  quick_note: z.string().optional(),
}).refine(
  (data) => !!data.phone || !!data.email,
  {
    message: "Phone or Email required (at least one)",
    path: ["phone"],
  }
);

export type QuickAddInput = z.infer<typeof quickAddSchema>;
```

---

## Smart Behaviors

### Pre-fill Memory
- **Campaign**: Reads from `localStorage.getItem('last_campaign')` on modal open
- **Principal**: Reads from `localStorage.getItem('last_principal')` on modal open
- Both persist across browser sessions
- Updated after each successful save

### City/State Autocomplete
- Uses local US cities JSON file (no API costs, offline-friendly)
- As user types "Chic" → dropdown shows:
  - Chicago, IL
  - Chico, CA
  - Chicopee, MA
- Selecting auto-fills both `city` and `state` fields
- User can type freeform for international cities

### Product Filtering
- Product dropdown filters by `principal_id = selected Principal`
- If Principal changes, product selection clears

### Auto-generated Opportunity Name
- Format: `[Campaign] - [Organization Name] - [Principal Name]`
- Example: "NRA Show 2025 - Luigi's Restaurant - Sysco"
- Hidden from form, generated server-side

### Form Reset on "Save & Add Another"
- **Clears**: First Name, Last Name, Phone, Email, Org Name, City, Product, Note
- **Keeps**: Campaign, Principal (pre-fills for next entry)
- **Focus**: Auto-jumps to First Name field
- **Toast**: 2-second display, then auto-hides

---

## Error Handling (Fail Fast Principle)

### On Database Function Failure
- ❌ **NO** automatic retry button
- ✅ Show clear error message: "Failed to create booth visitor: [error details]"
- ✅ Preserve all form data (user reviews inputs)
- ✅ User manually corrects and re-submits

**Why no retry?**
The "fail fast, no retry logic" principle (CLAUDE.md, Engineering Constitution) means the client does not attempt automatic retries. Database errors should be investigated and fixed at the source. The user can review, correct inputs, and submit again—this is a new attempt, not an automatic retry.

### Network Errors
- Display error message
- Preserve form data
- User manually re-submits when connection restored

---

## Default Values

### Auto-set on Creation
- `organization_type`: "customer"
- `segment_id`: "562062be-c15b-417f-b2a1-d4a643d69d52" (Unknown segment)
- `opportunity.stage`: "new_lead"
- `opportunity.priority`: "medium"
- `opportunity.estimated_close_date`: 30 days from today
- `opportunity.lead_source`: "trade_show"
- `contact.first_seen`: NOW()
- `contact.last_seen`: NOW()
- `contact.tags`: []
- `sales_id`: Current authenticated user's sales ID

---

## Success Metrics

### Speed
- **Target**: 30-45 seconds per entry
- **Measure**: Time from modal open to "Save & Add Another" click

### Data Quality
- **Required fields**: All marked fields completed
- **Contact info**: 100% of entries have phone or email
- **Location**: City/State accuracy via autocomplete

### Volume
- **Trade show scenario**: 50-100 entries per day per rep
- **Follow-up rate**: % of quick-add opportunities expanded with full details

---

## Future Enhancements (Out of Scope)

- Badge scanner integration (OCR contact info from business cards)
- Offline mode with sync when connection restored
- Bulk import from CSV after trade show
- Mobile-optimized layout for tablet data entry
- Voice input for hands-free entry

---

## Implementation Checklist

- [ ] Create PostgreSQL function migration
- [ ] Grant EXECUTE permission to authenticated role
- [ ] Test function with direct SQL calls
- [ ] Extend unifiedDataProvider with `createBoothVisitor` method
- [ ] Create `quickAdd.ts` validation schema
- [ ] Create `useQuickAdd.ts` hook
- [ ] Create `QuickAddButton.tsx` component
- [ ] Create `QuickAddDialog.tsx` modal wrapper
- [ ] Create `QuickAddForm.tsx` with all fields
- [ ] Implement city/state autocomplete (local JSON)
- [ ] Wire up localStorage for pre-fills
- [ ] Add success toast with 2-second auto-hide
- [ ] Test atomic creation (all 3 records or none)
- [ ] Test error handling (preserve form data)
- [ ] Test "Save & Add Another" flow
- [ ] Manual QA on iPad (primary target device)

---

## Alignment with Engineering Constitution

✅ **NO OVER-ENGINEERING**: Uses local JSON for cities (no API), localStorage for pre-fills (no database field)
✅ **FAIL FAST**: Single PostgreSQL function, no client-side retry logic
✅ **SINGLE SOURCE OF TRUTH**: Zod validation at API boundary, database function enforces integrity
✅ **BOY SCOUT RULE**: Will clean up any inline CSS variables found during implementation
✅ **FORM STATE FROM SCHEMA**: Uses Zod schema defaults for validation

---

**END OF DESIGN DOCUMENT**
