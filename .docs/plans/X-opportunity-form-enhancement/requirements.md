# Opportunity Form Enhancement - Requirements

**Created**: 2025-10-01
**Status**: Ready for Implementation
**Scope**: Medium (3-7 days)
**Implementation Confidence**: 95% (Validated via industry research)

---

## 📚 Documentation Navigation

**Start Here** → You are here (Requirements overview)

### Planning & Research
- **[implementation-plan.md](./implementation-plan.md)** - Detailed task breakdown with 6 phases, parallel execution strategy
- **[pattern-research.md](./pattern-research.md)** - Existing codebase pattern analysis and recommendations
- **[parallel-plan.md](./parallel-plan.md)** - Parallel agent decomposition strategy
- **[layout-preview.html](./layout-preview.html)** - Interactive HTML preview of new layout (open in browser)

### Technical Documentation
- **[database.docs.md](./database.docs.md)** - Database schema, migrations, and RLS policies
- **[data-provider.docs.md](./data-provider.docs.md)** - Supabase data provider integration details
- **[validation-docs.md](./validation-docs.md)** - Zod validation schemas and rules
- **[form-patterns.docs.md](./form-patterns.docs.md)** - React Admin form patterns and components
- **[opportunities-architecture.docs.md](./opportunities-architecture.docs.md)** - Opportunity module architecture

### Testing & Quality
- **[TESTING-PLAN.md](./TESTING-PLAN.md)** - Comprehensive testing strategy
- **[STATUS-REPORT.md](./STATUS-REPORT.md)** - Current implementation status
- **[CORRECTIONS.md](./CORRECTIONS.md)** - Known issues and corrections
- **[SIMPLIFIED-PLAN-SUMMARY.md](./SIMPLIFIED-PLAN-SUMMARY.md)** - Quick reference summary

### Shared Resources
- **[shared.md](./shared.md)** - Shared constants, types, and utilities

---

## 1. Feature Summary

Redesign the opportunity form with **matching show/edit mode layouts** to eliminate visual confusion when switching modes. Implement industry-standard **tabbed navigation** (Details, Products, Notes & Activity) with **horizontal field grouping** for efficient desktop/iPad workflows. Add critical missing fields (**Account Manager**, **Lead Source**), and enhance product line items with **inline Excel-like editing**, **Unit of Measure**, and **Principal tracking** per line item. Support **multi-product opportunities** with auto-calculated totals and auto-generated opportunity names.

### Key Improvements
✅ **Visual Consistency** - Edit mode matches show mode layout exactly
✅ **Tabbed Organization** - Logical grouping reduces scrolling
✅ **Horizontal Fields** - Efficient use of screen space
✅ **Account Tracking** - Account Manager and Lead Source fields
✅ **Product Enhancement** - Inline editing, Unit of Measure, Principal per line
✅ **Auto-Naming** - Generate opportunity names from customer + context

---

## 2. User Stories

### Story 1: Layout Consistency
**As a** food service sales representative
**I want** the opportunity edit form to have the same layout as the show mode
**So that** I can quickly find and update fields without visual confusion or searching

### Story 2: Account Manager Tracking
**As a** sales manager
**I want** to see who owns each opportunity and how it originated
**So that** I can track team performance and lead source effectiveness

### Story 3: Multi-Principal Product Tracking
**As a** food service sales rep managing multi-principal deals
**I want** to specify the principal and unit of measure for each product line item
**So that** I can accurately track which brands are in each opportunity and ensure correct ordering

### Story 4: Efficient Field Access
**As a** sales rep on an iPad or desktop
**I want** horizontally grouped fields that utilize screen space efficiently
**So that** I can see more information at a glance without excessive scrolling

### Story 5: Multi-Product Opportunities
**As a** sales representative
**I want** to select multiple products from different principals when creating an opportunity
**So that** I can accurately represent multi-product deals and track product-level sales metrics

### Story 6: Auto-Generated Names
**As a** sales representative
**I want** the opportunity name to auto-generate from customer, principal, and context
**So that** I can quickly create descriptive opportunity names without manual typing and maintain naming consistency

### Story 7: Product Visibility
**As a** sales manager
**I want** to see which products are included in each opportunity
**So that** I can quickly understand deal composition without opening the full opportunity detail

---

## 3. Technical Approach

### 3.1 Frontend Components

#### New Components to Create
1. **`OpportunityHeader.tsx`** - Reusable header with organization avatar, opportunity name, and action buttons (Archive/Edit in show, Archive/Cancel/Save in edit)
2. **`OpportunityDetailsTab.tsx`** - Tab 1 content with horizontal field groups for core opportunity fields
3. **`OpportunityProductsTab.tsx`** - Tab 2 content with inline-editable product line items table
4. **`OpportunityNotesTab.tsx`** - Tab 3 content with notes list and activity log
5. **`AccountManagerInput.tsx`** - Dropdown referencing auth.users for account manager selection
6. **`LeadSourceInput.tsx`** - Dropdown with 8 standard lead source options
7. **`useAutoGenerateName.ts`** - Hook to auto-generate opportunity name from customer + context

#### Components to Modify
1. **`OpportunityShow.tsx`** - Add tabbed structure (Details, Products, Notes & Activity)
2. **`OpportunityEdit.tsx`** - Add matching tabbed structure with editable fields
3. **`OpportunityCreate.tsx`** - Add new fields with account manager defaulting to current user
4. **`OpportunityInputs.tsx`** - Restructure with horizontal field groups
5. **`OpportunityProductsInput.tsx`** - Replace with DatagridInput for Excel-like inline editing

#### Layout Structure

**Show Mode & Edit Mode (Matching Layouts)**:
```
┌─────────────────────────────────────────────────────────┐
│ [Avatar] Opportunity Name              [Archive] [Edit] │
├─────────────────────────────────────────────────────────┤
│ [Details] [Products] [Notes & Activity]                 │
├─────────────────────────────────────────────────────────┤
│ DETAILS TAB:                                            │
│                                                          │
│ OPPORTUNITY OVERVIEW                                    │
│ [Expected Close] [Budget] [Probability] [Stage] [Prior] │
│ [Acct Manager]   [Lead Source]   [Opp Context]         │
│                                                          │
│ KEY RELATIONSHIPS                                       │
│ [Customer]  [Principal]  [Distributor]                  │
│                                                          │
│ CONTACTS                                                │
│ [Contact Chips]                                         │
│                                                          │
│ DESCRIPTION                                             │
│ [Multiline Text]                                        │
└─────────────────────────────────────────────────────────┘
```

**Products Tab (Show Mode: Read-only, Edit Mode: Inline Editable)**:
```
┌─────────────────────────────────────────────────────────┐
│ PRODUCT LINE ITEMS                                      │
│ ┌──────┬──────────┬────┬────┬─────┬──────┬─────┬───┐  │
│ │Product│Principal│Qty │UOM │Price│Ext $ │Notes│ ✕ │  │
│ ├──────┼──────────┼────┼────┼─────┼──────┼─────┼───┤  │
│ │ [  ] │  [    ] │[ ] │[ ] │[ ]  │$1,499│[   ]│[✕]│  │
│ │ [  ] │  [    ] │[ ] │[ ] │[ ]  │$2,099│[   ]│[✕]│  │
│ └──────┴──────────┴────┴────┴─────┴──────┴─────┴───┘  │
│                              Total: $5,491.46           │
│ [+ Add Product Line Item]                               │
└─────────────────────────────────────────────────────────┘
```

### 3.2 Database Changes

**Migration**: `20251001120000_enhance_opportunity_fields.sql`

```sql
-- Add new fields to opportunities table
ALTER TABLE opportunities
  ADD COLUMN account_manager_id UUID REFERENCES auth.users(id),
  ADD COLUMN lead_source TEXT CHECK (lead_source IN (
    'referral', 'trade_show', 'website', 'cold_call',
    'email_campaign', 'social_media', 'partner', 'existing_customer'
  )),
  ADD COLUMN name TEXT;

-- Add indexes for performance
CREATE INDEX idx_opportunities_account_manager ON opportunities(account_manager_id);

-- Add new fields to opportunity_products (line items)
ALTER TABLE opportunity_products
  ADD COLUMN principal_id UUID REFERENCES organizations(id),
  ADD COLUMN unit_of_measure TEXT CHECK (unit_of_measure IN (
    'case', 'lb', 'kg', 'each', 'gallon', 'liter', 'dozen'
  )),
  ADD COLUMN extended_price DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED;

CREATE INDEX idx_opportunity_products_principal ON opportunity_products(principal_id);

-- Add helpful comments
COMMENT ON COLUMN opportunities.name IS 'Auto-generated from customer + context, but user-editable';
COMMENT ON COLUMN opportunity_products.extended_price IS 'Auto-calculated: quantity * unit_price';
```

**New Fields**:

**`opportunities` table**:
- `account_manager_id` (UUID) - References auth.users, tracks who owns the opportunity
- `lead_source` (TEXT) - Enum: how the opportunity originated
- `name` (TEXT) - Auto-generated but editable opportunity name

**`opportunity_products` table**:
- `principal_id` (UUID) - References organizations, tracks brand per line item
- `unit_of_measure` (TEXT) - Enum: case, lb, kg, each, gallon, liter, dozen
- `extended_price` (DECIMAL) - Auto-calculated (quantity × unit_price)

### 3.3 Zod Validation Schemas

**File**: `src/atomic-crm/validation/opportunities.ts`

```typescript
export const opportunitySchema = z.object({
  // Required fields
  organization_id: z.string().uuid(),
  account_manager_id: z.string().uuid(),
  stage: z.string(),

  // New optional fields
  name: z.string().optional(), // Auto-generated, editable
  lead_source: z.enum([
    'referral', 'trade_show', 'website', 'cold_call',
    'email_campaign', 'social_media', 'partner', 'existing_customer'
  ]).optional(),

  // Existing fields
  opportunity_context: z.enum([
    'new_customer', 'expansion', 'renewal', 'upsell',
    'cross_sell', 'competitive_replacement', 'referral'
  ]),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  amount: z.number().positive().optional(),
  probability: z.number().min(0).max(100).optional(),
  expected_closing_date: z.string().datetime().optional(),
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

### 3.4 Auto-Generated Opportunity Name

**Logic**: Generate name from customer organization + opportunity context, but allow manual editing

```typescript
// Hook: useAutoGenerateName.ts
export const useAutoGenerateName = () => {
  const organizationId = useWatch({ name: 'organization_id' });
  const opportunityContext = useWatch({ name: 'opportunity_context' });
  const currentName = useWatch({ name: 'name' });

  const { data: organization } = useGetOne('organizations', { id: organizationId });

  useEffect(() => {
    if (!organization || !opportunityContext) return;

    const contextLabels = {
      new_customer: 'New Customer',
      expansion: 'Expansion',
      renewal: 'Renewal',
      upsell: 'Upsell',
      cross_sell: 'Cross-Sell',
      competitive_replacement: 'Competitive Replacement',
      referral: 'Referral'
    };

    const autoGeneratedName = `${organization.name} - ${contextLabels[opportunityContext]}`;

    // Only update if name hasn't been manually edited
    if (!currentName || currentName === previousAutoName) {
      setValue('name', autoGeneratedName);
    }
  }, [organization, opportunityContext]);
};
```

**Example Names**:
- "CloudKitchen Collective - New Customer"
- "Acme Diner - Expansion"
- "Healthy Bites Cafe - Competitive Replacement"

### 3.5 Lead Source Options

Standard values based on food service industry:

| Value | Label | Description |
|-------|-------|-------------|
| `referral` | Referral | Referred by existing customer or partner |
| `trade_show` | Trade Show | NRA Show, regional food service events |
| `website` | Website | Inbound website inquiry |
| `cold_call` | Cold Call | Outbound prospecting |
| `email_campaign` | Email Campaign | Marketing email response |
| `social_media` | Social Media | Social media engagement |
| `partner` | Partner | Partner-sourced lead |
| `existing_customer` | Existing Customer | Expansion from current customer |

### 3.6 Unit of Measure Standards

Food service common units:

| Value | Label | Typical Use |
|-------|-------|-------------|
| `case` | Case | Standard case packaging |
| `lb` | Pound | Weight-based pricing (US) |
| `kg` | Kilogram | Weight-based pricing (metric) |
| `each` | Each | Individual units |
| `gallon` | Gallon | Liquid volume (US) |
| `liter` | Liter | Liquid volume (metric) |
| `dozen` | Dozen | 12-unit packages |

---

## 4. UI/UX Flow

### 4.1 Show Mode Flow

1. User navigates to Opportunity Show page
2. **Header displays**: Organization avatar, opportunity name, Archive/Edit buttons
3. **Tab navigation** appears: Details (default), Products, Notes & Activity
4. **Details tab** shows horizontal field groups:
   - Row 1: Expected closing date, Budget, Probability, Stage, Priority
   - Row 2: Account Manager, Lead Source, Opportunity Context
   - Row 3: Customer Organization, Principal, Distributor
   - Row 4: Contacts (chips)
   - Description (multiline)
5. **Products tab** shows read-only table with 7 columns + total
6. **Notes & Activity tab** shows notes list and activity log

### 4.2 Edit Mode Flow

1. User clicks "Edit" button in show mode
2. **Same layout** as show mode but fields become inputs
3. **Header updates**: Replace Edit with Save/Cancel, keep Archive
4. **Tabs maintain same structure**
5. **Details tab**: All fields editable with validation
6. **Products tab**: Inline editing (click cell to edit), add/delete rows
7. **User makes changes** across tabs
8. **Validation** on Save: Required fields, Zod schemas
9. **On Save**: Redirect to show mode with matching layout
10. **On Cancel**: Discard changes, return to show mode

### 4.3 Create Mode Flow

1. User clicks "Create Opportunity"
2. **Same layout** as edit mode (tabs, horizontal fields)
3. **Account Manager** defaults to current logged-in user
4. **Opportunity Name** auto-generates as user selects Customer + Context
5. User can override auto-generated name
6. **Products tab** starts empty with "Add Product" button
7. User completes required fields and clicks Save
8. Redirect to newly created opportunity show page

### 4.4 Responsive Behavior

- **Desktop (≥1024px)**: Horizontal field groups side-by-side
- **iPad (768px-1023px)**: Fields wrap to 3-4 per row
- **Mobile (<768px)**: Fields stack vertically, tabs horizontal
- **Product table**: Horizontal scroll on small screens

---

## 5. Success Metrics

### 5.1 User Experience
- ✅ **Layout consistency**: Edit mode matches show mode (100% visual parity)
- ✅ **Field findability**: Users locate fields in same position across modes
- ✅ **Task completion**: 30% reduction in time to update opportunity

### 5.2 Data Quality
- ✅ **Account Manager tracking**: 100% of opportunities have assigned account manager
- ✅ **Lead Source data**: 80%+ of opportunities have lead source recorded
- ✅ **Product accuracy**: Unit of Measure specified for 100% of line items
- ✅ **Principal tracking**: Principal identified at line-item level for all products

### 5.3 Technical
- ✅ **No regressions**: All existing opportunity tests pass
- ✅ **Inline editing**: Product line items editable like Excel
- ✅ **Validation**: Zod schemas enforce data integrity
- ✅ **Performance**: Page loads <2s, tab switching instantaneous

### 5.4 Adoption
- ✅ **Sales team approval**: 90%+ positive feedback on new layout
- ✅ **Data completeness**: Lead source completion increases to 80%+
- ✅ **Principal tracking**: 100% of product line items have principal assigned

---

## 6. Out of Scope

### Features NOT Included
❌ **Reason Won/Lost field** - Defer to post-close analysis feature
❌ **Competitors field** - Defer to competitive tracking feature
❌ **Next Steps field** - Already handled by tasks/activities
❌ **Contract Term/Duration** - Defer to contract management
❌ **Internal Notes section** - Use existing notes with visibility flag
❌ **Delivery/Logistics notes** - Handle at product line item or activities
❌ **Attachments inline** - Use existing attachment system

### Technical Limitations
❌ **No backward compatibility** - Breaking changes acceptable per constitution
❌ **No mobile optimization** - Focus on iPad/desktop, basic responsive only
❌ **No Excel formulas** - Simple calculations only
❌ **No bulk import** - Handled by separate import feature
❌ **No column reordering** - Fixed column order for consistency

---

## 7. Implementation Strategy

### 7.1 Parallel Agent Decomposition

This implementation uses **4 parallel agents** for maximum efficiency:

1. **Backend Agent** (4-6 hours)
   - Database migrations
   - Zod validation schemas
   - TypeScript types
   - *Can start immediately*

2. **Core Components Agent** (6-8 hours)
   - OpportunityHeader, AccountManagerInput, LeadSourceInput
   - useAutoGenerateName hook
   - OpportunityDetailsTab
   - *Can start immediately*

3. **Product Table Agent** (8-10 hours)
   - OpportunityProductsInput with inline editing
   - OpportunityProductsTab, OpportunityNotesTab
   - *Can start immediately*

4. **Integration Agent** (6-8 hours)
   - Update OpportunityShow/Edit/Create
   - Testing and polish
   - *Depends on agents 1-3*

### 7.2 Execution Timeline

**Total Estimated Time**: 29-39 hours (3.6-4.9 days)
**Calendar Time with Parallelization**: ~5 days

See **[implementation-plan.md](./implementation-plan.md)** for detailed task breakdown.

### 7.3 Risk Mitigation

**Risk 1**: React Admin DatagridInput limitations
→ **Mitigation**: Custom table implementation as fallback (+4 hours)

**Risk 2**: Auto-generate name conflicts with manual edits
→ **Mitigation**: Hidden field to track auto vs manual (+2 hours)

**Risk 3**: Tab state routing conflicts
→ **Mitigation**: Follow proven Organizations pattern (+2 hours)

**Risk 4**: Performance issues with product table
→ **Mitigation**: Pagination for 50+ products (+3 hours)

---

## 8. Testing Strategy

### 8.1 Unit Tests
- Zod schema validation for new fields
- Auto-generated name logic
- Extended price calculation
- Account manager defaulting

### 8.2 Integration Tests
- Create opportunity with all new fields
- Edit opportunity across tabs
- Inline edit product line items
- Tab navigation and URL persistence
- Save with validation errors
- Cancel without saving

### 8.3 E2E Tests (Playwright)
- Complete opportunity creation flow
- Visual comparison: show vs edit mode layouts
- Product table inline editing
- Tab state persistence after refresh
- Responsive behavior on iPad viewport

### 8.4 Manual Testing
See comprehensive checklist in **[TESTING-PLAN.md](./TESTING-PLAN.md)**

---

## 9. Dependencies

### 9.1 Existing Features
✅ OpportunityProductsInput.tsx (exists, needs enhancement)
✅ OpportunityContextInput.tsx (exists)
✅ FormToolbar.tsx (reusable)
✅ OrganizationAvatar.tsx (reusable)
✅ Tabs pattern from OrganizationShow.tsx

### 9.2 Database Tables
✅ `opportunities` table
✅ `opportunity_products` table
✅ `organizations` table
✅ `auth.users` table (Supabase Auth)
✅ `opportunity_notes` table
✅ `activities` table

### 9.3 Tech Stack Components
✅ React Admin DatagridInput (inline editing)
✅ shadcn/ui Tabs component
✅ Supabase RLS policies
✅ Zod validation library

---

## 10. Related Documentation

For detailed implementation guidance, see:

### Essential Reading
1. **[implementation-plan.md](./implementation-plan.md)** - Complete task breakdown, estimated times, acceptance criteria
2. **[layout-preview.html](./layout-preview.html)** - Interactive visual preview (open in browser)
3. **[pattern-research.md](./pattern-research.md)** - Existing codebase patterns to follow

### Technical Reference
4. **[database.docs.md](./database.docs.md)** - Database schema details, migration examples
5. **[validation-docs.md](./validation-docs.md)** - Zod schema patterns
6. **[form-patterns.docs.md](./form-patterns.docs.md)** - React Admin form components

### Testing & Quality
7. **[TESTING-PLAN.md](./TESTING-PLAN.md)** - Comprehensive testing checklist
8. **[STATUS-REPORT.md](./STATUS-REPORT.md)** - Current implementation status

---

## 11. Quick Start

Ready to implement? Follow these steps:

1. **Review the visual design**: Open [layout-preview.html](./layout-preview.html) in your browser
2. **Understand the plan**: Read [implementation-plan.md](./implementation-plan.md)
3. **Check existing patterns**: Review [pattern-research.md](./pattern-research.md)
4. **Start Phase 1**: Begin with database migration (can run in parallel with component work)
5. **Track progress**: Use TodoWrite tool to track task completion

### First Tasks
- [ ] Create database migration `20251001120000_enhance_opportunity_fields.sql`
- [ ] Update Zod schemas in `src/atomic-crm/validation/opportunities.ts`
- [ ] Create `OpportunityHeader.tsx` component
- [ ] Create `AccountManagerInput.tsx` and `LeadSourceInput.tsx`

See **[implementation-plan.md](./implementation-plan.md)** for complete task list with acceptance criteria.

---

**Status**: ✅ Requirements finalized, ready for implementation
**Next Step**: Begin Phase 1 implementation tasks
**Questions?**: Review related documentation or ask for clarification
