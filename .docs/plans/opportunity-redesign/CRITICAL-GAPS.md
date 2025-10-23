# 🚨 CRITICAL GAPS - Opportunity Redesign Plan Review

**Analysis Date:** 2025-10-23
**Reviewed By:** Zen (gemini-2.5-pro) via thinkdeep analysis
**Status:** 11 code-breaking gaps identified - **DO NOT START IMPLEMENTATION UNTIL TIER 1 GAPS RESOLVED**

---

## Executive Summary

Zen's deep analysis identified **11 critical gaps** that will block implementation and violate the Engineering Constitution. These gaps are organized into 3 tiers by severity:

- **Tier 1 (3 gaps):** Implementation blockers that cause immediate failures
- **Tier 2 (3 gaps):** Business logic violations that cause incorrect behavior
- **Tier 3 (5 gaps):** UX/implementation gaps that create poor user experience

**Engineering Constitution Violations:**
- SINGLE SOURCE OF TRUTH: Type system mismatch (Gap 1), priority inheritance unenforced (Gap 2)
- FAIL FAST: Incomplete CSV mapping will halt migration (Gap 5)
- NO OVER-ENGINEERING: Optimistic concurrency might be over-engineered for current scale (Gap 7)

---

## TIER 1: Implementation Blockers (Fix Before ANY Code)

### ❌ GAP 1: Type System Mismatch [SINGLE SOURCE OF TRUTH VIOLATION]

**Location:** `src/atomic-crm/types.ts` lines 125-157

**Problem:** TypeScript `ActivityRecord` type has only 8 interaction types, but:
- Database enum has 11 types (including trade_show, site_visit, contract_review, check_in, social)
- Validation schema (`src/atomic-crm/validation/activities.ts`) has all 11 types

**Impact:**
- TypeScript compilation errors when using the 5 missing types
- Runtime validation passes but TypeScript rejects valid data
- Forms can't display options for valid database values

**Current State:**
```typescript
// types.ts:128-136 - MISSING 5 TYPES
type:
  | "call"
  | "email"
  | "meeting"
  | "demo"
  | "follow_up"
  | "visit"
  | "proposal"
  | "negotiation";  // ❌ Missing: trade_show, site_visit, contract_review, check_in, social
```

**Fix Required:**
```typescript
// types.ts - ADD MISSING TYPES
type:
  | "call"
  | "email"
  | "meeting"
  | "demo"
  | "follow_up"
  | "visit"
  | "proposal"
  | "negotiation"
  | "trade_show"        // ADD
  | "site_visit"        // ADD
  | "contract_review"   // ADD
  | "check_in"          // ADD
  | "social";           // ADD
```

**Verification:** Ensure `ActivityRecord` type matches `interactionTypeSchema` in `validation/activities.ts` exactly.

---

### ❌ GAP 5: Incomplete CSV Stage Mapping [FAIL FAST VIOLATION]

**Location:** Requirements document section 8.1 "CSV Stage Mapping (Many-to-One)"

**Problem:** Requirements specify "FAIL FAST: Halt import and log error" for unmapped stages, but the CSV has ~10 unique stage names and only 8 examples are mapped:
- "SOLD-7", "SOLD-7d" → closed_won ✅
- "Lead-discovery-1" → new_lead ✅
- "Contacted-phone/email-2" → initial_outreach ✅
- "Sampled/Visited invite-3" → sample_visit_offered ✅ (533 opportunities!)
- "Follow-up-4" → awaiting_response ✅
- "Feedback- received-5" → feedback_logged ✅
- "demo-cookup-6" → demo_scheduled ✅
- "order support-8" → closed_won ❓ (assumption in comments)
- "VAF BLITZ" → initial_outreach ❓ (assumption in comments)
- **Other stages:** NOT MAPPED ❌

**Impact:**
- Migration script will fail on first unmapped stage
- No way to complete import without mapping ALL stages
- 1,062 opportunities cannot be migrated

**Fix Required:**
1. Analyze actual CSV file to extract ALL unique STAGE values
2. Map EVERY stage to one of the 8 semantic stages
3. Document rationale for each mapping
4. Add to requirements document as complete reference

**Bash command to get unique stages:**
```bash
awk -F',' 'NR>1 {print $6}' data/Opportunity.csv | sort -u
```

**Template for complete mapping:**
```typescript
const CSV_STAGE_MAP: Record<string, OpportunityStageValue> = {
  // Closed stages
  'SOLD-7': 'closed_won',
  'SOLD-7d': 'closed_won',

  // Active stages (ordered by progression)
  'Lead-discovery-1': 'new_lead',
  'Contacted-phone/email-2': 'initial_outreach',
  'Sampled/Visited invite-3': 'sample_visit_offered',
  'Follow-up-4': 'awaiting_response',
  'Feedback- received-5': 'feedback_logged',
  'demo-cookup-6': 'demo_scheduled',

  // Edge cases - REQUIRES BUSINESS DECISION
  'order support-8': 'closed_won',  // Post-sale support = won
  'VAF BLITZ': 'initial_outreach',  // Marketing campaign = outreach

  // ADD ALL OTHER STAGES HERE - DO NOT LEAVE ANY UNMAPPED
};
```

---

### ❌ GAP 9: React Query Cache Invalidation with Views [ARCHITECTURE CONFLICT]

**Location:** Requirements section 9.1 "Initial Data Fetch (Single RPC)" + Priority 4 recommendation

**Problem:** Plan proposes creating `opportunities_summary` view with calculated `nb_interactions` field, but doesn't specify:
- Is this a separate resource or replacement for `opportunities`?
- How do mutations on `opportunities` invalidate `opportunities_summary` cache?
- What happens to existing query keys `["opportunities", "getList", ...]`?

**Current State:**
- OpportunityList uses `"opportunities"` resource
- OpportunityCreate/Edit/Show use `"opportunities"` resource
- All mutations invalidate `["opportunities"]` query key

**If switching to `opportunities_summary` resource:**
- ❌ All existing mutations break (invalidate wrong key)
- ❌ Filter registry doesn't include `opportunities_summary`
- ❌ Data provider doesn't know about view vs table

**Fix Required - Option A (Transparent Replacement):**
```typescript
// dataProviderUtils.ts - Add view mapping
export function getDatabaseResource(resource: string, operation: "list" | "one") {
  if (operation === "list" && resource === "opportunities") {
    return "opportunities_summary";  // Use view for lists only
  }
  return resource;
}
```
- Mutations still target `opportunities` table
- Invalidation still uses `["opportunities"]` key
- No code changes needed in components

**Fix Required - Option B (Separate Resource):**
```typescript
// Use opportunities_summary only for cards with interaction counts
<List resource="opportunities_summary">
  <OpportunityListContent />
</List>

// Mutations still target opportunities, but invalidate BOTH keys
queryClient.invalidateQueries({ queryKey: ["opportunities"] });
queryClient.invalidateQueries({ queryKey: ["opportunities_summary"] });
```
- Requires updating OpportunityList component
- Requires updating all mutation handlers
- Requires adding `opportunities_summary` to filter registry

**Decision Required:** Document which approach to use before implementation.

---

## TIER 2: Business Logic Gaps (Fix Before Feature Complete)

### ⚠️ GAP 2: Priority Inheritance Unenforced [BUSINESS RULE VIOLATION]

**Location:** Requirements section 1.3 "Priority Logic"

**Business Rule:** "Opportunity priority ALWAYS matches customer organization priority. No exceptions."

**Problem:** No database trigger or application logic enforces this. Current schema allows:
```sql
-- User can manually set priority that differs from customer org
UPDATE opportunities SET priority = 'high' WHERE id = 123;
-- Even if customer org has priority = 'medium'
```

**Impact:**
- Priority can drift from customer organization
- Business rule violated silently
- Data integrity compromised

**Fix Required - Database Trigger:**
```sql
-- Migration: add_priority_inheritance_trigger.sql

-- Function to sync opportunity priority from customer org
CREATE OR REPLACE FUNCTION sync_opportunity_priority()
RETURNS TRIGGER AS $$
BEGIN
  -- On INSERT or UPDATE, force priority to match customer org
  SELECT priority INTO NEW.priority
  FROM organizations
  WHERE id = NEW.customer_organization_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on opportunities table
CREATE TRIGGER enforce_priority_inheritance
  BEFORE INSERT OR UPDATE ON opportunities
  FOR EACH ROW
  EXECUTE FUNCTION sync_opportunity_priority();

-- Trigger on organizations table (cascade updates)
CREATE OR REPLACE FUNCTION cascade_priority_to_opportunities()
RETURNS TRIGGER AS $$
BEGIN
  -- When org priority changes, update all opportunities
  IF OLD.priority IS DISTINCT FROM NEW.priority THEN
    UPDATE opportunities
    SET priority = NEW.priority
    WHERE customer_organization_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cascade_org_priority_updates
  AFTER UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION cascade_priority_to_opportunities();
```

---

### ⚠️ GAP 6: Contact Array Relationship During CSV Migration

**Location:** Requirements section 8.2 "Interaction Linking (UUID Resolution)"

**Problem:** CSV interactions link to contacts by name, but those contacts might not be in `opportunity.contact_ids` array. Validation requires `contact_ids.length >= 1`.

**Scenario:**
1. CSV Opportunity: "Acme Corp Deal" with contact_ids = [101, 102]
2. CSV Interaction: Links to contact_id = 103 (Gary Smith from Acme Corp)
3. Migration creates interaction with contact_id = 103
4. But 103 is NOT in opportunity.contact_ids array
5. Business logic assumes all interaction contacts are in contact_ids array

**Impact:**
- Interaction participants orphaned from opportunity
- Activity timeline might not show all participants
- Contact filtering on opportunity detail page misses interaction contacts

**Fix Required - Migration Script Logic:**
```typescript
function linkInteraction(csvRow: CSVInteractionRow, opportunity: Opportunity): ActivityRecord {
  const contact = findContactByName(csvRow.CONTACT);

  if (contact && !opportunity.contact_ids.includes(contact.id)) {
    // Add contact to opportunity if not already present
    await dataProvider.update("opportunities", {
      id: opportunity.id,
      data: {
        contact_ids: [...opportunity.contact_ids, contact.id],
      },
    });
  }

  return {
    activity_type: 'interaction',
    opportunity_id: opportunity.id,
    contact_id: contact?.id,
    // ... other fields
  };
}
```

---

### ⚠️ GAP 10: Product Multi-Select Auto-Name Generation

**Location:** `src/atomic-crm/opportunities/useAutoGenerateName.ts`

**Problem:** Hook only watches `customer_organization_id` and `principal_organization_id`. When user adds/removes products, name doesn't regenerate.

**Current Logic:**
```typescript
// useAutoGenerateName.ts:23-24
const customerOrgId = useWatch({ name: "customer_organization_id" });
const principalOrgId = useWatch({ name: "principal_organization_id" });
// ❌ Products NOT watched
```

**Requirements State:**
- 1 product: `{Customer} - {Principal} - {Product Name}`
- 2+ products: `{Customer} - {Principal} - {Count} products`
- 0 products: `{Customer} - {Principal} - [No Product]`

**Impact:**
- User adds 3rd product, name still shows "2 products"
- Inconsistent with create mode auto-generation
- Manual refresh required (but only available in edit mode)

**Fix Required - Option A (Watch Products Array):**
```typescript
const products = useWatch({ name: "products" });

const generateName = useCallback(() => {
  const parts = [customerOrg?.name, principalOrg?.name];

  if (products?.length === 1) {
    const product = products[0]; // Fetch product name
    parts.push(product.name);
  } else if (products?.length > 1) {
    parts.push(`${products.length} products`);
  } else {
    parts.push("[No Product]");
  }

  return parts.filter(Boolean).join(" - ");
}, [customerOrg, principalOrg, products]); // ⚠️ products causes re-render on every keystroke

// Need deep equality check
useEffect(() => {
  if (mode === "create" && !currentName && !isLoading) {
    const newName = generateName();
    if (newName && newName !== currentName) {
      setValue("name", newName, { shouldValidate: true, shouldDirty: true });
    }
  }
}, [mode, currentName, generateName, setValue, isLoading]);
```

**Fix Required - Option B (Manual Refresh Only):**
Remove auto-generation for products field entirely. Require manual refresh button in both create and edit modes.

**Decision Required:** Document which approach to use.

---

## TIER 3: UX/Implementation Gaps (Fix During Implementation)

### ⚠️ GAP 4: Index Management Race Conditions

**Location:** `src/atomic-crm/opportunities/OpportunityCreate.tsx:33-76`

**Problem:** Two users creating opportunities simultaneously in same stage both try to set `index=0` and shift existing opportunities `+1`.

**Scenario:**
1. User A creates opportunity → reads existing opportunities → calculates index=0
2. User B creates opportunity → reads existing opportunities → calculates index=0
3. User A updates all existing +1, creates new at index=0
4. User B updates all existing +1 (overwriting A's changes), creates new at index=0
5. Result: Two opportunities with index=0

**Impact:**
- Index collisions (two cards at same position)
- Undefined sort order within column
- Race condition worsens with more users

**Fix Required - Fractional Indexing:**
```typescript
// Use fractional indexing library or simple implementation
const newIndex = generateFractionalIndex(null, firstExistingOpportunity?.index);
// Inserts between 0 and first item without updating others

await dataProvider.create("opportunities", {
  data: { ...formData, index: newIndex },
});
```

**Alternative - Timestamp-Based Ordering:**
```typescript
// Remove index field entirely, sort by created_at DESC
sort={{ field: "created_at", order: "DESC" }}
```

---

### ⚠️ GAP 7: Optimistic Concurrency RPC Implementation

**Location:** Requirements section 6.2 "Conflict Prevention"

**Problem:** Requirements show SQL function but no React Admin integration:
```sql
CREATE OR REPLACE FUNCTION update_opportunity_safe(...) RETURNS SETOF opportunities
```

**Missing:**
- How to call RPC function from React Admin mutation
- How to check if update succeeded (0 rows returned = conflict)
- How to show conflict modal when update fails

**Fix Required - Custom Mutation Handler:**
```typescript
// OpportunityEdit.tsx
const [update] = useUpdate();

const handleSave = async (data: Opportunity) => {
  const result = await dataProvider.rpc("update_opportunity_safe", {
    opp_id: opportunity.id,
    last_updated_at: opportunity.updated_at,
    new_data: data,
  });

  if (!result.data || result.data.length === 0) {
    // Update failed - show conflict modal
    showModal({
      title: "Opportunity was updated by another user",
      message: "Please refresh to see the latest changes before editing.",
      actions: [
        { label: "Refresh", onClick: () => refetch() },
        { label: "Cancel", onClick: () => close() },
      ]
    });
  } else {
    notify("Opportunity updated successfully");
    redirect("show", "opportunities", opportunity.id);
  }
};
```

**Note:** This might be over-engineering for current scale (single office, <10 users). Consider deferring to Phase 3.

---

### ⚠️ GAP 8: Drag-and-Drop Greenfield Implementation

**Location:** `src/atomic-crm/opportunities/OpportunityColumn.tsx` and `OpportunityCard.tsx`

**Problem:** Requirements assume drag-and-drop is "wire up existing library" but:
- `@hello-pangea/dnd` is installed but has ZERO usage in codebase
- No `DragDropContext`, `Droppable`, or `Draggable` components exist
- This is a complete greenfield implementation, not a simple integration

**Missing Implementation:**
```typescript
// OpportunityListContent.tsx - COMPLETE REWRITE NEEDED
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const handleDragEnd = (result: DropResult) => {
  const { draggableId, source, destination } = result;

  if (!destination) return;

  // Calculate new index
  const sourceOpps = opportunitiesByStage[source.droppableId];
  const destOpps = opportunitiesByStage[destination.droppableId];

  // Update both stage AND index atomically
  await dataProvider.update("opportunities", {
    id: draggableId,
    data: {
      stage: destination.droppableId,
      index: calculateNewIndex(destOpps, destination.index),
    },
  });

  // Optimistic UI update
  queryClient.setQueryData(...);
};

return (
  <DragDropContext onDragEnd={handleDragEnd}>
    {visibleStages.map(stage => (
      <Droppable droppableId={stage.value} key={stage.value}>
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps}>
            {opportunitiesByStage[stage.value].map((opp, index) => (
              <Draggable draggableId={opp.id} index={index} key={opp.id}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                  >
                    <OpportunityCard opportunity={opp} />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    ))}
  </DragDropContext>
);
```

**Keyboard Accessibility (Engineering Constitution Requirement):**
- Must support Space to grab, Arrow keys to move, Space to drop, Escape to cancel
- `@hello-pangea/dnd` has built-in keyboard support, but needs testing
- Screen reader announcements required

**Recommendation:** Consider deferring to Phase 2. Implement manual "Move to Stage" buttons first (much simpler, no race conditions, works on mobile).

---

### ⚠️ GAP 11: Mobile Horizontal Scroll vs Drag-and-Drop

**Location:** Requirements section 2.5 "Mobile Responsiveness"

**Problem:** Requirements specify:
```tsx
<div className="flex overflow-x-auto md:grid md:grid-cols-8">
```

But `@hello-pangea/dnd` requires special handling for scrollable containers. User can't drag a card from column 1 to column 8 if column 8 is off-screen.

**Impact:**
- User must manually scroll to destination column
- Then drag card (loses scroll position)
- Terrible mobile UX

**Fix Required - Option A (Disable Drag on Mobile):**
```typescript
const isMobile = useMediaQuery('(max-width: 768px)');

return isMobile ? (
  <OpportunityListWithMoveButtons />  // Manual stage change
) : (
  <DragDropContext onDragEnd={handleDragEnd}>
    {/* Desktop drag-and-drop */}
  </DragDropContext>
);
```

**Fix Required - Option B (Custom Scroll Detection):**
Implement auto-scroll when dragging near viewport edges (complex, not recommended per NO OVER-ENGINEERING).

**Recommendation:** Use Option A - mobile users get manual move buttons, desktop users get drag-and-drop.

---

## Engineering Constitution Violations Summary

1. **SINGLE SOURCE OF TRUTH**
   - Gap 1: Type system mismatch (database enum ≠ TypeScript type)
   - Gap 2: Priority inheritance unenforced (business rule ≠ database constraint)

2. **FAIL FAST**
   - Gap 5: Incomplete CSV mapping means import fails on first unmapped stage (correct behavior, but mapping incomplete)

3. **NO OVER-ENGINEERING**
   - Gap 7: Optimistic concurrency might be over-engineered for current scale (<10 users)
   - Gap 11: Custom drag scroll detection would violate this principle

4. **BOY SCOUT RULE**
   - Gap 1: Must fix type mismatch when touching activities code

---

## Recommended Action Plan

### Phase 0: Pre-Implementation Fixes (MUST COMPLETE FIRST)

1. **Fix Gap 1 (2 hours):**
   - Add 5 missing interaction types to `ActivityRecord` type in `types.ts`
   - Verify type matches validation schema exactly
   - Run `npm run typecheck` to confirm no errors

2. **Fix Gap 5 (4 hours):**
   - Run bash command to extract ALL unique CSV stage values
   - Map every stage to semantic stage with business rationale
   - Update requirements document with complete mapping
   - Write migration script with fail-fast error handling

3. **Decide Gap 9 (1 hour):**
   - Choose Option A (transparent view replacement) or Option B (separate resource)
   - Document decision in shared.md
   - If Option B, add `opportunities_summary` to filter registry

### Phase 1: MVP Implementation (Without Drag-and-Drop)

1. **Fix Gap 2 (3 hours):**
   - Create database migration with priority inheritance triggers
   - Test on local database
   - Verify cascade updates work correctly

2. **Implement Gaps 6, 10 (during migration):**
   - Migration script adds interaction contacts to opportunity.contact_ids
   - Decide on auto-name generation strategy for products

3. **Defer Gaps 4, 7, 8, 11 to Phase 2:**
   - Use manual "Move to Stage" buttons instead of drag-and-drop
   - Skip optimistic concurrency (premature optimization)
   - No race condition risk with manual buttons

### Phase 2: Drag-and-Drop & Polish

1. Implement drag-and-drop with keyboard accessibility
2. Add optimistic concurrency if multi-user conflicts observed
3. Implement fractional indexing to eliminate race conditions

---

## Verification Checklist

Before starting implementation, confirm:

- [ ] Gap 1 fixed: `ActivityRecord` type has all 11 interaction types
- [ ] Gap 5 fixed: Complete CSV stage mapping documented
- [ ] Gap 9 decided: View strategy chosen and documented
- [ ] Gap 2 fix planned: Priority inheritance trigger migration created
- [ ] Scope reduced: Drag-and-drop deferred to Phase 2 (manual buttons for MVP)

**DO NOT START IMPLEMENTATION UNTIL ALL TIER 1 GAPS ARE RESOLVED.**

---

## Conclusion

The planning documentation is comprehensive but has 11 critical gaps that violate the Engineering Constitution and will block implementation. The most critical fixes (Gaps 1, 5, 9) must be completed before any code is written. By addressing Tier 1 gaps first and deferring drag-and-drop to Phase 2, the team can deliver a working MVP faster while maintaining code quality and adherence to the Engineering Constitution.
