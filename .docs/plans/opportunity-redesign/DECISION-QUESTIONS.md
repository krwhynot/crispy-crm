# 🎯 Business Decision Questions - Opportunity Redesign

**Decision Date Needed:** Before Phase 1 implementation begins
**Stakeholders:** Product Owner, Engineering Lead, Sales Operations
**Context:** Solutions analysis complete - 4 technical decisions require business input

---

## Executive Summary

Solutions research identified **4 decision points** where technical trade-offs require business context:

| Decision | Impact | Urgency |
|----------|--------|---------|
| **Q1: CSV Contact Backfill** | Data integrity during migration | **HIGH** - Blocks migration script |
| **Q2: Product Auto-Name Generation** | UX consistency in edit mode | **MEDIUM** - Affects Phase 1 UX |
| **Q3: View Cache Strategy** | Code complexity vs performance | **LOW** - Both options viable |
| **Q4: MVP Ordering Approach** | Manual buttons vs drag-and-drop | **HIGH** - Affects Phase 1 scope |

---

## QUESTION 1: CSV Contact Array Backfill Strategy

**Context:** When migrating 1,062 legacy opportunities, some interactions reference contacts that aren't in the opportunity's `contact_ids` array. We need to decide how to reconcile this data.

**Business Impact:** Affects data completeness and post-migration cleanup workload.

---

### Option A: Automatic Backfill During Migration ✅ RECOMMENDED

**What Happens:**
```
Migration script automatically adds interaction contacts to opportunity.contact_ids
if they're not already present. All data relationships become consistent.
```

**Pros:**
- ✅ Complete data integrity after migration (zero manual cleanup)
- ✅ No orphaned interaction contacts
- ✅ Sales team sees all relevant contacts immediately
- ✅ Simple post-migration validation (just verify counts)

**Cons:**
- ⚠️ May add contacts to opportunities that weren't originally "linked"
- ⚠️ No human review of which contacts get added
- ⚠️ Slightly longer migration runtime (~2-3 extra seconds)

**Implementation Effort:** 2 hours (simple array append in migration script)

**Engineering Constitution Compliance:**
- **SINGLE SOURCE OF TRUTH:** ✅ PASS - Database becomes canonical after migration
- **FAIL FAST:** ✅ PASS - Migration validates all contact IDs exist before adding

**Example Scenario:**
```
Opportunity #123: "ACME Corp - Widget Deal"
  contact_ids: [456]  (John Doe)

Interaction #789: "Demo call with Jane Smith"
  opportunity_id: 123
  contact_id: 457  (Jane Smith)

AUTOMATIC BACKFILL:
  Opportunity #123 contact_ids becomes: [456, 457]
  Result: Jane Smith now appears in opportunity's contact list
```

---

### Option B: Log Mismatches for Manual Review

**What Happens:**
```
Migration script logs all contact mismatches to a CSV file.
Sales operations team manually reviews and decides which contacts to add.
```

**Pros:**
- ✅ Business controls which contacts get added
- ✅ Human review catches potential data quality issues
- ✅ Opportunity to audit legacy data relationships

**Cons:**
- ❌ Requires post-migration cleanup work (estimated 4-6 hours)
- ❌ Incomplete data until manual review completed
- ❌ Risk of forgetting to complete cleanup
- ❌ Sales team may see interactions with "missing" contacts

**Implementation Effort:** 3 hours (logging + CSV export + manual review process)

**Engineering Constitution Compliance:**
- **SINGLE SOURCE OF TRUTH:** ⚠️ PARTIAL - Two sources of truth until cleanup complete
- **FAIL FAST:** ❌ FAIL - Defers data consistency enforcement

**Example Scenario:**
```
Same scenario as Option A, but migration produces:
  mismatch_report.csv:
    opportunity_id, interaction_id, contact_id, contact_name
    123, 789, 457, "Jane Smith"

Sales Operations reviews and manually runs:
  UPDATE opportunities SET contact_ids = array_append(contact_ids, 457) WHERE id = 123;
```

---

**RECOMMENDATION:** **Option A - Automatic Backfill**

**Rationale:**
1. Engineering Constitution favors SINGLE SOURCE OF TRUTH (Option A enforces consistency)
2. Pre-launch phase means no user data to "corrupt" - all legacy data
3. Post-migration validation can catch genuine errors
4. Sales team avoids 4-6 hours of manual cleanup work

**Question for Stakeholders:**
*Are there business reasons why an interaction contact should NOT be added to the opportunity's contact list? If not, automatic backfill is the clear winner.*

---

## QUESTION 2: Product Multi-Select Auto-Name Generation

**Context:** In create mode, opportunity name auto-generates from customer + products. In edit mode, this should refresh when products change, but watching arrays is complex.

**Business Impact:** Affects how "magical" the auto-name feature feels in edit mode.

---

### Option A: Watch Products Array (Full Auto-Generation) 🎩 MAGICAL

**What Happens:**
```
Editing products immediately regenerates the opportunity name.
User sees name update in real-time as they select/deselect products.
```

**Pros:**
- ✅ Consistent behavior between create and edit modes
- ✅ "Magical" UX - feels automatic and intelligent
- ✅ No manual button clicks needed
- ✅ Matches user expectations from create mode

**Cons:**
- ⚠️ Complex deep equality checking for product arrays
- ⚠️ Risk of unexpected name changes during edits
- ⚠️ May overwrite manual name customizations
- ⚠️ Performance concern with large product lists

**Implementation Effort:** 6 hours (array watch hook + deep equality + edge cases)

**Engineering Constitution Compliance:**
- **NO OVER-ENGINEERING:** ⚠️ BORDERLINE - Adds complexity for convenience feature
- **FAIL FAST:** ✅ PASS - Validation happens on every change

**Example Scenario:**
```
User editing "ACME Corp - Widget & Gadget Deal"
  1. Deselects "Gadget" product
  2. Name immediately updates to "ACME Corp - Widget Deal"
  3. User sees change in real-time
```

---

### Option B: Manual Refresh Button Only 🔄 SIMPLE ✅ RECOMMENDED

**What Happens:**
```
Products field shows a "🔄 Refresh Name" button (same as create mode).
Name only regenerates when user clicks the button.
```

**Pros:**
- ✅ Simple implementation (reuse existing create mode logic)
- ✅ User controls when name updates (no surprises)
- ✅ No performance concerns
- ✅ No accidental overwrites of manual customizations
- ✅ Follows Engineering Constitution (NO OVER-ENGINEERING)

**Cons:**
- ⚠️ Less automatic than create mode (requires manual click)
- ⚠️ User might forget to refresh after changing products
- ⚠️ Slightly less "magical" UX

**Implementation Effort:** 1 hour (just show existing refresh button in edit mode)

**Engineering Constitution Compliance:**
- **NO OVER-ENGINEERING:** ✅ PASS - Simplest solution that works
- **FAIL FAST:** ✅ PASS - Explicit user action, clear outcome

**Example Scenario:**
```
User editing "ACME Corp - Widget & Gadget Deal"
  1. Deselects "Gadget" product
  2. Clicks "🔄 Refresh Name" button
  3. Name updates to "ACME Corp - Widget Deal"
```

---

**RECOMMENDATION:** **Option B - Manual Refresh Button**

**Rationale:**
1. Engineering Constitution explicitly bans over-engineering (6 hours vs 1 hour)
2. Pre-launch phase - UX polish can come in Phase 2 if users request it
3. Manual control prevents accidental overwrites
4. Follows "Make it work, then make it better" philosophy

**Question for Stakeholders:**
*Is auto-regenerating names on product changes a "must-have" for MVP? If not, defer to Phase 2.*

---

## QUESTION 3: Database View Cache Strategy

**Context:** `opportunities_summary` view adds calculated fields (nb_interactions, last_interaction_date). React Query needs to know how to cache this data.

**Business Impact:** Code complexity vs fine-grained cache control.

---

### Option A: Transparent View Replacement ✅ RECOMMENDED

**What Happens:**
```
Data provider automatically uses opportunities_summary for list operations.
Component code unchanged - no migration needed.
Cache invalidation stays simple: invalidateQueries(["opportunities"])
```

**Pros:**
- ✅ Zero component code changes (follows existing contacts_summary pattern)
- ✅ Simple cache invalidation (single query key)
- ✅ Easier to maintain (one place to update mapping)
- ✅ Broader cache refresh acceptable for <10 users

**Cons:**
- ⚠️ Broader cache invalidation than strictly necessary
- ⚠️ Can't separately invalidate view vs base table

**Implementation Effort:** 30 minutes (add one mapping in getDatabaseResource)

**Engineering Constitution Compliance:**
- **NO OVER-ENGINEERING:** ✅ PASS - Simplest solution
- **SINGLE SOURCE OF TRUTH:** ✅ PASS - View definition in migration

**Code Example:**
```typescript
// dataProviderUtils.ts
export function getDatabaseResource(resource: string, operation: "list" | "one") {
  if (operation === "list") {
    const viewMap = {
      'contacts': 'contacts_summary',
      'opportunities': 'opportunities_summary',  // ADD THIS
    };
    return viewMap[resource] || resource;
  }
  return resource;
}

// OpportunityCreate.tsx - NO CHANGES NEEDED
queryClient.invalidateQueries({ queryKey: ["opportunities"] });
```

---

### Option B: View as Separate Resource

**What Happens:**
```
Treat opportunities_summary as a distinct resource.
Explicit cache invalidation: invalidateQueries(["opportunities_summary"])
Components must explicitly choose which resource to use.
```

**Pros:**
- ✅ Fine-grained cache control
- ✅ Can invalidate view separately from base table
- ✅ More explicit (less "magic")

**Cons:**
- ❌ Requires updating all mutation handlers
- ❌ Requires updating filter registry
- ❌ Requires updating all query keys in components
- ❌ More places to maintain

**Implementation Effort:** 4 hours (update 15+ files)

**Engineering Constitution Compliance:**
- **NO OVER-ENGINEERING:** ⚠️ BORDERLINE - Added complexity for <10 users
- **SINGLE SOURCE OF TRUTH:** ✅ PASS - View definition in migration

---

**RECOMMENDATION:** **Option A - Transparent View Replacement**

**Rationale:**
1. Follows existing pattern (contacts_summary already uses this approach)
2. <10 users means broader cache invalidation is acceptable
3. 30 minutes vs 4 hours implementation time
4. Easier to maintain (one place to update)

**Question for Stakeholders:**
*Do we expect cache invalidation to become a performance bottleneck? If not, transparent replacement is simpler.*

---

## QUESTION 4: MVP Kanban Ordering Approach

**Context:** Current implementation uses integer `index` field with race condition risks. Full drag-and-drop requires lexorank ordering + complex implementation.

**Business Impact:** MVP delivery timeline vs UX polish.

---

### Option A: Timestamp-Based + Manual Move Buttons ✅ RECOMMENDED FOR MVP

**What Happens:**
```
Opportunities sorted by created_at (newest first).
Cards show "Move to..." dropdown button for stage changes.
No drag-and-drop, no manual reordering.
```

**Pros:**
- ✅ Zero race conditions (timestamp is unique)
- ✅ Works perfectly on mobile
- ✅ Keyboard accessible out of the box
- ✅ Simple implementation (remove index management entirely)
- ✅ Can ship MVP this week

**Cons:**
- ⚠️ No manual reordering within stages
- ⚠️ Less visually polished than drag-and-drop
- ⚠️ "Move to..." button less intuitive than dragging

**Implementation Effort:** 2 hours (remove index logic, add dropdown button)

**Engineering Constitution Compliance:**
- **NO OVER-ENGINEERING:** ✅ PASS - Simplest solution
- **FAIL FAST:** ✅ PASS - No race conditions possible

**UI Example:**
```
┌─────────────────────────────┐
│ ACME Corp - Widget Deal     │
│ Customer: ACME Corp         │
│ Principal: ABC Manufacturing│
│ Priority: HIGH              │
│                             │
│ [Move to... ▼] [Edit]      │
└─────────────────────────────┘
```

---

### Option B: Full Drag-and-Drop with Lexorank (Phase 2)

**What Happens:**
```
Full @hello-pangea/dnd implementation.
Lexorank ordering allows arbitrary reordering within stages.
Desktop-optimized (mobile keeps manual buttons).
```

**Pros:**
- ✅ Premium UX for desktop users
- ✅ Intuitive drag-and-drop between stages
- ✅ Manual reordering within stages
- ✅ No race conditions (lexorank handles conflicts)

**Cons:**
- ❌ 10-15 hours greenfield implementation
- ❌ Keyboard accessibility testing required
- ❌ Mobile conflicts (horizontal scroll issues)
- ❌ Added dependency (lexorank library)
- ❌ Delays MVP delivery by 1-2 weeks

**Implementation Effort:** 15 hours (DragDropContext, Droppable, Draggable, lexorank, testing)

**Engineering Constitution Compliance:**
- **NO OVER-ENGINEERING:** ❌ FAIL FOR MVP - Over-engineered for pre-launch phase
- **FAIL FAST:** ✅ PASS - Lexorank prevents race conditions

---

**RECOMMENDATION:** **Option A for MVP, Option B for Phase 2**

**Rationale:**
1. Pre-launch phase - no users to disappoint with manual buttons
2. Can gather user feedback on whether drag-and-drop is needed
3. 2 hours vs 15 hours - allows faster iteration
4. Mobile-first approach (buttons work better than drag on mobile)

**Question for Stakeholders:**
*Is drag-and-drop a "must-have" for internal launch? If not, ship MVP with manual buttons and add drag-and-drop in Phase 2 based on user feedback.*

**Migration Path:**
```
MVP (This Week):     Manual "Move to..." buttons + timestamp sorting
Phase 2 (4 weeks):   Add drag-and-drop for desktop users (mobile keeps buttons)
```

---

## Summary of Approved Decisions ✅

| Question | **APPROVED OPTION** | Implementation | Defer to Phase |
|----------|---------------------|----------------|----------------|
| **Q1: CSV Backfill** | **✅ Option A - Automatic Backfill** | 2 hours | - |
| **Q2: Product Auto-Name** | **✅ Option A - Watch Products Array** | 1.5 hours | - |
| **Q3: View Cache** | **✅ Option A - Transparent View** | 30 min | - |
| **Q4: Ordering** | **✅ Option A - Timestamp + Manual Buttons** | 2 hours | Drag-and-drop (Phase 2) |

**Total MVP Implementation Time with Approved Options:** 11 hours

**Note:** Original Q2 estimate was 6 hours for complex implementation. Final IMPLEMENTATION-PLAN.md Task 1.7 shows 1.5 hours using standard React Hook Form patterns.

**Deferred to Phase 2 (Based on User Feedback):**
- Drag-and-drop Kanban (if manual buttons prove insufficient)

---

## Decision Sign-Off

**Instructions:** Review each question with stakeholders and check the selected option.

### Q1: CSV Contact Backfill
- [x] **Option A - Automatic Backfill** ✅ **APPROVED**
- [ ] Option B - Manual Review
- **Decision Date:** 2025-10-23
- **Approved By:** Project Owner

### Q2: Product Auto-Name
- [x] **Option A - Watch Products Array (Full Auto-Generation)** ✅ **APPROVED**
- [ ] Option B - Manual Refresh Button
- **Decision Date:** 2025-10-23
- **Approved By:** Project Owner

### Q3: View Cache Strategy
- [x] **Option A - Transparent View Replacement** ✅ **APPROVED**
- [ ] Option B - Separate Resource
- **Decision Date:** 2025-10-23
- **Approved By:** Project Owner

### Q4: MVP Ordering Approach
- [x] **Option A - Timestamp + Manual Buttons (MVP)** ✅ **APPROVED**
- [ ] Option B - Full Drag-and-Drop (Delays MVP)
- **Decision Date:** 2025-10-23
- **Approved By:** Project Owner

---

**Next Steps After Sign-Off:**
1. Update SOLUTIONS-ANALYSIS.md with final decisions
2. Create implementation task breakdown
3. Begin Phase 1 implementation with approved approach
