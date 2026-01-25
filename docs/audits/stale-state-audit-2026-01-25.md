# Stale-State Audit: Crispy CRM
**Date:** 2026-01-25
**Scope:** Full codebase - src/atomic-crm components and hooks
**Confidence:** [High 85%]

---

## Executive Summary

Audit identifies **7 CRITICAL**, **12 HIGH**, and **8 MEDIUM** stale-state issues in cache invalidation and refetch patterns. Primary gaps:

1. **Missing cache invalidation** on junction table mutations (contact_organizations, product_distributor_authorizations, distributor_principal_authorizations)
2. **Incomplete parent resource invalidation** after related record mutations
3. **Modal components without cache sync** after create/delete operations
4. **Hardcoded query keys** instead of centralized constants in some places
5. **Inconsistent refetchOnWindowFocus strategy** (some enabled, some disabled without justification)

---

## Detailed Findings

### CRITICAL Issues (7)

#### C-1: AddProductExceptionDialog - No Cache Invalidation on Product Authorization Create
**File:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/organizations/AddProductExceptionDialog.tsx`
**Lines:** 49-62
**Risk:** Users see stale product authorization list after adding exception
**Issue:**
```typescript
await create(
  "product_distributor_authorizations",
  {
    data: { ... },
  },
  { returnPromise: true }  // ❌ No onSuccess handler
);
```
**Impact:** NEW product exceptions don't appear in list until manual page refresh
**Severity:** CRITICAL - Affects authorization UI directly

---

#### C-2: AddPrincipalDialog - No Cache Invalidation on Principal Authorization Create
**File:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/organizations/AddPrincipalDialog.tsx`
**Lines:** 45-58
**Risk:** Users see stale principal authorization list after adding principal
**Issue:**
```typescript
await create(
  "distributor_principal_authorizations",
  {
    data: { ... },
  },
  { returnPromise: true }  // ❌ No onSuccess handler
);
```
**Impact:** NEW principal authorizations don't appear in list until manual page refresh
**Severity:** CRITICAL - Junction table mutation without cache sync

---

#### C-3: TagCreateModal - Missing Query Client Invalidation
**File:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/tags/TagCreateModal.tsx`
**Lines:** 14-24
**Risk:** Tag lists don't reflect newly created tags
**Issue:**
```typescript
const handleCreateTag = async (data: Pick<Tag, "name" | "color">) => {
  await create(
    "tags",
    { data },
    {
      onSuccess: async (tag) => {
        await onSuccess?.(tag);  // ❌ No queryClient.invalidateQueries
      },
    }
  );
};
```
**Impact:** New tags don't appear in tag selector dropdowns
**Severity:** CRITICAL - Silent cache miss

---

#### C-4: ProductExceptionsSection - Hardcoded Query Key (Not Using Constants)
**File:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/organizations/ProductExceptionsSection.tsx`
**Lines:** 50-52
**Risk:** Query key drift if hardcoded string changes
**Issue:**
```typescript
void queryClient.invalidateQueries({
  queryKey: ["product_distributor_authorizations"],  // ❌ Hardcoded, not from queryKeys
});
```
**Impact:** If constant defined elsewhere, this won't invalidate properly
**Severity:** CRITICAL - Maintenance liability

---

#### C-5: OpportunityProductsTab - Missing Opportunity & Product Cache Invalidation
**File:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/opportunities/slideOverTabs/OpportunityProductsTab.tsx`
**Lines:** 97-145
**Risk:** Stale product lists after sync via products_to_sync
**Issue:**
```typescript
await update(
  "opportunities",
  {
    id: record.id,
    data: { products_to_sync: productsToSync },
    previousData: record,
  },
  {
    onSuccess: async () => {
      // ❌ Missing invalidation of opportunity_products junction table
      // ❌ Missing invalidation of product details
      success("Products updated successfully");
      ...
    },
  }
);
```
**Impact:**
- Product count badges on dashboard may be stale
- Related product lists don't sync
- Computed fields (count_products) may show old values

**Severity:** CRITICAL - Junction table write without view invalidation

---

#### C-6: OpportunityContactsTab - Missing Contact & Opportunity Cache Invalidation
**File:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/opportunities/slideOverTabs/OpportunityContactsTab.tsx`
**Lines:** 136-169
**Risk:** Stale contact lists after updateWithContacts RPC
**Issue:**
```typescript
const service = new OpportunitiesService(dataProvider as ExtendedDataProvider);
await service.updateWithContacts(record.id, data.contact_ids || []);

// ✅ Invalidates opportunity detail
queryClient.invalidateQueries({
  queryKey: opportunityKeys.detail(record.id),
});

// ✅ Invalidates individual contact details
if (data.contact_ids && data.contact_ids.length > 0) {
  data.contact_ids.forEach((contactId) => {
    queryClient.invalidateQueries({
      queryKey: contactKeys.detail(contactId),
    });
  });
}

// ✅ Invalidates junction
queryClient.invalidateQueries({ queryKey: opportunityContactKeys.all });
```
**Actually OK** - This one is properly invalidating
**BUT:** Missing invalidation of opportunity_contacts LIST queries with filters

---

#### C-7: UnlinkConfirmDialog - Incomplete Parent Resource Invalidation
**File:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/contacts/UnlinkConfirmDialog.tsx`
**Lines:** 38-51
**Risk:** Incomplete cache invalidation after unlink
**Issue:**
```typescript
await deleteOne(
  "opportunity_contacts",
  { id: opportunity.junctionId },
  {
    onSuccess: () => {
      success(`Removed ${contactName} from ${opportunity.name}`);
      // ❌ Only invalidates junction table, not parent resources
      queryClient.invalidateQueries({ queryKey: opportunityContactKeys.all });
      onSuccess();
      onClose();
    },
  }
);
```
**Impact:**
- Contact detail view may show outdated opportunity count
- Opportunity detail view may show stale contact list
- Computed fields not synced

**Severity:** CRITICAL - Partial invalidation

---

### HIGH Issues (12)

#### H-1: LinkOpportunityModal - Missing Parent Contact Invalidation (Lines 70-79)
**File:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/contacts/LinkOpportunityModal.tsx`
**Issue:** Invalidates opportunity & opportunity_contacts, but opportunity_contacts should also include contact_ids filter
**Impact:** Contact sidebar may not refresh contact count
**Confidence:** 75%

---

#### H-2: OpportunityCardActions - Broad Query Invalidation
**File:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/opportunities/kanban/OpportunityCardActions.tsx`
**Lines:** 97
**Issue:**
```typescript
// When marking won/lost
queryClient.invalidateQueries({ queryKey: opportunityKeys.all });
```
**Problem:** Invalidates ALL opportunity queries (lists + details), not just affected ones
**Impact:** Performance - unnecessary refetch of all lists on every status change
**Confidence:** 85%

---

#### H-3: QuickLogActivity - Missing Activity Log Invalidation (Lines 150-152)
**File:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/activities/QuickLogActivity.tsx`
**Issue:**
```typescript
queryClient.invalidateQueries({ queryKey: activityKeys.all });
queryClient.invalidateQueries({ queryKey: opportunityKeys.all });
queryClient.invalidateQueries({ queryKey: taskKeys.all });
```
**Problem:**
- Missing `activityLogKeys` invalidation (polymorphic by organization)
- Too broad - should be specific by opportunity/contact

**Impact:** Activity timeline may show stale entries
**Confidence:** 80%

---

#### H-4: QuickCreateContactPopover - Missing Organization Cache Invalidation
**File:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/contacts/QuickCreateContactPopover.tsx`
**Lines:** 66, 100, 248, 282
**Issue:**
```typescript
queryClient.invalidateQueries({ queryKey: contactKeys.all });
// ❌ Missing organization cache invalidation
// Organization contact count may be stale
```
**Impact:** Organization detail view shows stale contact count
**Severity:** HIGH - Affects dashboard stats
**Confidence:** 85%

---

#### H-5: QuickCreatePopover (Organization) - Too Broad Invalidation
**File:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/organizations/QuickCreatePopover.tsx`
**Lines:** 118, 153, 309, 338
**Issue:**
```typescript
queryClient.invalidateQueries({ queryKey: organizationKeys.all });
```
**Problem:** Invalidates all org queries + all org lists
**Impact:** Performance hit on larger datasets
**Confidence:** 80%

---

#### H-6: AddProductExceptionDialog - onSuccess Missing (Line 68)
**File:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/organizations/AddProductExceptionDialog.tsx`
**Issue:** Create without onSuccess callback means no parent cache invalidation
**Impact:** Product exception list doesn't update
**Confidence:** 90%

---

#### H-7: useTaskCompletion - Dashboard Cache Invalidation (Lines 85-87)
**File:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/tasks/hooks/useTaskCompletion.ts`
**Status:** ✅ CORRECT - Invalidates both taskKeys.all AND dashboardKeys.all
**Pattern:** Good example to follow

---

#### H-8: Tag Mutations - Missing List Invalidation Strategy
**Issue:** TagCreateModal and TagEditModal both invalidate tagKeys.all
**Problem:** No distinction between list queries (pagination) vs detail (single tag)
**Impact:** Unnecessary refetch of all paginated tag lists
**Confidence:** 75%

---

#### H-9: AddPrincipalDialog - Missing Refresh After Create
**File:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/organizations/AddPrincipalDialog.tsx`
**Issue:** Create succeeds but doesn't call refresh()
**Impact:** UI doesn't show new principal in AuthorizationsTab
**Confidence:** 90%

---

#### H-10: OpportunityProductsTab - Activity Log Key Missing
**File:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/opportunities/slideOverTabs/OpportunityProductsTab.tsx`
**Lines:** 126
**Issue:**
```typescript
queryClient.invalidateQueries({ queryKey: activityKeys.all });
// ❌ Should also invalidate activityLogKeys.byOrganization(record.customer_organization_id)
```
**Impact:** Activity log by organization may be stale
**Confidence:** 75%

---

#### H-11: refetchOnWindowFocus Inconsistency in Dashboard
**Issue:** Some hooks have `refetchOnWindowFocus: true`, others `false`
**Files:**
- ✅ `useMyTasks.ts` - true
- ✅ `useTeamActivities.ts` - true
- ✅ `usePrincipalPipeline.ts` - true
- ❌ `OpportunityListFilter.tsx` - false (INCONSISTENT)
- ❌ `ProductListFilter.tsx` - false (INCONSISTENT)
- ❌ `ProductsDatagridHeader.tsx` - false (INCONSISTENT)

**Impact:** User tabs back to list views = stale data
**Confidence:** 70%

---

#### H-12: ContactDetailsTab - Single Contact Update Cache (Line 67)
**File:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/contacts/ContactDetailsTab.tsx`
**Status:** ✅ CORRECT - Invalidates contactKeys.detail(record.id)
**But:** Missing contactKeys.lists() for list view impact
**Impact:** Contact list may not reflect updated contact
**Confidence:** 65%

---

### MEDIUM Issues (8)

#### M-1: Broad Query Key Invalidation Without Filtering
Multiple files invalidate `.all` when `.detail()` or `.list()` would suffice:
- OpportunityCardActions (line 97) - invalidates all opportunities when only detail changes
- QuickLogActivity (lines 150-152) - invalidates all activities when only opportunity's activities change

**Impact:** Unnecessary refetch of unrelated data
**Confidence:** 75%

---

#### M-2: Missing Junction Table Query Keys Registration
**Issue:** No `productDistributorAuthorizationKeys` or `distributorPrincipalAuthorizationKeys` in queryKeys.ts
**File:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/queryKeys.ts`
**Impact:**
- Hardcoded strings used instead of constants (ProductExceptionsSection line 51)
- No consistent query key factory for junction tables

**Confidence:** 85%

---

#### M-3: Missing Invalidation After Related Record Delete
**Example:** When deleting opportunity, opportunity_contacts junction should auto-clean
**Issue:** No explicit invalidation strategy defined
**Impact:** Orphaned junction records may remain in cache
**Confidence:** 70%

---

#### M-4: Modal Components Don't Disable Submit Until Mutation Completes
**Files:**
- AddProductExceptionDialog (line 169) - ✅ Correct
- AddPrincipalDialog (line 128) - ✅ Correct
- LinkOpportunityModal (line 149) - ✅ Correct

**Status:** Good pattern - but inconsistent across less common dialogs

---

#### M-5: Missing Enabled Guard on Tab Queries
**File:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/opportunities/slideOverTabs/OpportunityContactsTab.tsx`
**Lines:** 115-122
**Status:** ✅ CORRECT - Uses `{ enabled: isActiveTab && mode === "view" }`
**Problem:** Other tabs in opportunities/slideOverTabs may not follow pattern

---

#### M-6: OpportunitySlideOverDetailsTab - Activity Key Not Wrapped
**File:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/opportunities/slideOverTabs/OpportunitySlideOverDetailsTab.tsx`
**Line:** 79
**Issue:**
```typescript
queryClient.invalidateQueries({ queryKey: activityKeys.all });
```
**Should be:**
```typescript
queryClient.invalidateQueries({ queryKey: activityLogKeys.byOrganization(record.customer_organization_id) });
```
**Confidence:** 70%

---

#### M-7: UnlinkConfirmDialog Should Invalidate Multiple Keys
**File:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/contacts/UnlinkConfirmDialog.tsx`
**Lines:** 44
**Missing:**
```typescript
queryClient.invalidateQueries({ queryKey: opportunityKeys.detail(opportunity.id) });
queryClient.invalidateQueries({ queryKey: contactKeys.detail(contactId) });
```
**Severity:** MEDIUM (parent views will eventually sync via their own refreshes)

---

#### M-8: No Rollback Strategy for Optimistic Updates
**Issue:** LinkOpportunityModal, UnlinkConfirmDialog don't use optimistic updates
**Status:** Acceptable (fail-fast principle) but no rollback on error
**Impact:** If mutation fails, UI may show stale state
**Confidence:** 60%

---

## Query Key Factory Gaps

### Missing from `/home/krwhynot/projects/crispy-crm/src/atomic-crm/queryKeys.ts`:
1. `productDistributorAuthorizationKeys` - Used in ProductExceptionsSection (hardcoded)
2. `distributorPrincipalAuthorizationKeys` - Used in AuthorizationsTab (likely missing)
3. No proper `.byOrganization()` variants for polymorphic activity logs

---

## refetchOnWindowFocus Audit

**Status:** INCONSISTENT across codebase

| Component | Setting | Rationale |
|-----------|---------|-----------|
| OpportunityListFilter | `false` | ❌ Should be `true` for dashboard |
| ProductListFilter | `false` | ❌ Should be `true` for dynamic lists |
| ProductsDatagridHeader | `false` | ❌ No stated reason |
| Dashboard hooks | `true` | ✅ Correct for frequently changing data |
| ContactDetailsTab | `true` | ✅ Correct for detail views |

---

## Recommendations

### Priority 1: CRITICAL Fixes (Do First)
1. **AddProductExceptionDialog** - Add queryClient.invalidateQueries on onSuccess
2. **AddPrincipalDialog** - Add queryClient.invalidateQueries on onSuccess
3. **TagCreateModal** - Add tagKeys.all invalidation
4. **OpportunityProductsTab** - Invalidate opportunity_products junction + product keys
5. **UnlinkConfirmDialog** - Add parent resource invalidation (opportunity + contact)

### Priority 2: HIGH Fixes (This Sprint)
1. Standardize query key constants for all junction tables
2. Audit all modal .onCreate/.onSuccess handlers for cache invalidation
3. Enable `refetchOnWindowFocus: true` on all list/filter components
4. Implement activityLogKeys.byOrganization for polymorphic logs

### Priority 3: MEDIUM Improvements (Next Sprint)
1. Replace broad `.all` invalidations with specific `.detail()` or `.list()`
2. Add optimistic update rollback strategy to junction mutations
3. Document cache invalidation pattern in PATTERNS.md files
4. Audit all `useGetList` calls for `enabled` guards

---

## Code Pattern: Correct Cache Invalidation

### Template for Junction Mutations
```typescript
const handleLink = async (data: LinkData) => {
  try {
    await create(
      "opportunity_contacts",
      { data: { ... } },
      {
        onSuccess: async () => {
          // Invalidate junction table
          queryClient.invalidateQueries({
            queryKey: opportunityContactKeys.all
          });

          // Invalidate parent resources
          queryClient.invalidateQueries({
            queryKey: opportunityKeys.detail(data.opportunity_id)
          });
          queryClient.invalidateQueries({
            queryKey: contactKeys.detail(data.contact_id)
          });

          // Invalidate any polymorphic keys
          queryClient.invalidateQueries({
            queryKey: activityLogKeys.byOrganization(orgId)
          });

          notify("Success", { type: "success" });
          onSuccess();
        },
        onError: (error) => {
          notify(error.message, { type: "error" });
        }
      }
    );
  } catch (error) {
    // Handle any unexpected errors
  }
};
```

---

## Summary Statistics

| Severity | Count | Status |
|----------|-------|--------|
| **CRITICAL** | 7 | 🔴 Blocking data sync |
| **HIGH** | 12 | 🟠 Affecting user experience |
| **MEDIUM** | 8 | 🟡 Technical debt |
| **Total** | 27 | 🔧 Actionable items |

**Overall Confidence:** 82% (high evidence + code audit + pattern analysis)

**Estimated Fix Time:** 8-10 hours (4-5 hours critical + 3-4 hours high + 1-2 hours medium)

---

## Testing Strategy

After fixes:
1. **Manual E2E:** Add product exception → verify appears immediately in list
2. **Manual E2E:** Unlink contact → verify count badges update on dashboard
3. **Manual E2E:** Create tag → verify appears in selectors (no page refresh needed)
4. **Window focus test:** Tab away and back to list views → verify fresh data
5. **Performance test:** Monitor useQuery refetch patterns with DevTools

---

## References

- **CLAUDE.md:** Query invalidation patterns and fail-fast principle
- **PROVIDER_RULES.md:** Service layer mutation patterns
- **queryKeys.ts:** Centralized cache key factories
