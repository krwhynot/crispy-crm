# Edge Case Audit - Data Relationships

**Agent:** 22 - Edge Case Finder (Data Relationships)
**Date:** 2025-12-21
**Relationships Analyzed:** 45+
**Edge Cases Found:** 14

---

## Executive Summary

The Crispy CRM database has robust referential integrity with well-defined FK constraints and cascade behaviors. Recent migrations (Nov-Dec 2025) have significantly improved data integrity by adding RESTRICT constraints and soft-delete cascades. However, **3 critical edge cases** remain that could cause data integrity issues or orphaned records.

**Critical Relationship Issues:** 3
**Orphan Data Risks:** 2 (mitigated)
**Missing Optimistic Locking:** Yes (all entities)

---

## Relationship Map

```
                              ┌─────────────────────────────────────────┐
                              │            auth.users                    │
                              │         (Supabase Auth)                  │
                              └──────────────┬────────────────────────────┘
                                             │ CASCADE
                                             ▼
                              ┌─────────────────────────────────────────┐
                              │              sales                       │
                              │    (User Profiles / Account Managers)    │
                              └──────────────┬────────────────────────────┘
                                             │
            ┌────────────────────────────────┼────────────────────────────┐
            │ SET NULL                       │ SET NULL                   │ CASCADE
            ▼                                ▼                            ▼
    ┌───────────────┐               ┌───────────────┐            ┌───────────────┐
    │ organizations │◄──────────────│  contacts     │            │notifications  │
    │   (Accounts)  │    RESTRICT   │               │            └───────────────┘
    └───────┬───────┘               └───────┬───────┘
            │                               │
            │ self-ref                      │ CASCADE
            │ SET NULL                      ▼
            ▼                       ┌───────────────┐
    ┌───────────────┐               │contactNotes   │
    │  (children)   │               └───────────────┘
    └───────────────┘                       │
            │                               │ CASCADE
            ├───────────────────────────────┼───────────────────────────┐
            │ RESTRICT (customer)           │                           │
            │ RESTRICT (principal)          │                           │
            │ SET NULL (distributor)        │                           │
            ▼                               ▼                           ▼
    ┌───────────────┐               ┌───────────────┐           ┌───────────────┐
    │ opportunities │◄──────────────│opportunity_   │           │  activities   │
    │               │    CASCADE    │   contacts    │           │               │
    └───────┬───────┘               └───────────────┘           └───────────────┘
            │
            ├─── CASCADE ───► opportunityNotes
            ├─── CASCADE ───► opportunity_participants
            ├─── CASCADE ───► opportunity_products
            ├─── CASCADE ───► tasks
            └─── SET NULL ──► activities (preserves history)

    ┌───────────────┐       M:N via authorizations       ┌───────────────┐
    │   principals  │◄──────────────────────────────────►│ distributors  │
    │(org subtype)  │         CASCADE both sides          │ (org subtype) │
    └───────┬───────┘                                     └───────────────┘
            │
            │ CASCADE
            ▼
    ┌───────────────┐
    │   products    │
    │               │
    └───────┬───────┘
            │
            ├─── CASCADE ───► product_features
            ├─── CASCADE ───► product_pricing_models
            ├─── CASCADE ───► product_pricing_tiers
            └─── CASCADE ───► product_distributor_authorizations
```

---

## Delete Cascade Analysis

### Current Configuration

| Parent | Child | On Delete | Risk Level | Notes |
|--------|-------|-----------|------------|-------|
| auth.users | sales | CASCADE | ✅ Low | User deletion cascades profile |
| sales | opportunities.opportunity_owner_id | SET NULL | ⚠️ Med | May orphan owner assignment |
| sales | opportunities.account_manager_id | SET NULL | ⚠️ Med | May orphan AM assignment |
| sales | contacts.sales_id | SET NULL | ⚠️ Med | Contact loses assigned rep |
| sales | tasks.sales_id | NOT NULL | ✅ Low | Task requires owner |
| organizations | contacts | **RESTRICT** | ✅ Safe | Cannot delete org with contacts |
| organizations | opportunities (customer) | **RESTRICT** | ✅ Safe | Cannot delete customer org |
| organizations | opportunities (principal) | **RESTRICT** | ✅ Safe | Recently fixed (2025-12-21) |
| organizations | opportunities (distributor) | SET NULL | ✅ Safe | Optional field, can clear |
| organizations | organizations (parent) | SET NULL | ✅ Safe | Children become top-level |
| opportunities | activities | SET NULL | ✅ Safe | Preserves activity history |
| opportunities | opportunityNotes | CASCADE | ✅ Safe | Notes deleted with opp |
| opportunities | opportunity_contacts | CASCADE | ✅ Safe | Junction cleared |
| opportunities | opportunity_products | CASCADE | ✅ Safe | Junction cleared (fixed 2025-12-21) |
| opportunities | opportunity_participants | CASCADE | ✅ Safe | Junction cleared |
| opportunities | tasks | CASCADE | ✅ Safe | Via soft-delete cascade function |
| contacts | activities | CASCADE | ⚠️ Med | All contact activities deleted |
| contacts | contactNotes | CASCADE | ✅ Safe | Notes deleted with contact |
| contacts | contacts (manager_id) | SET NULL | ✅ Safe | Manager ref cleared |
| products | product_features | CASCADE | ✅ Safe | Features deleted |
| products | product_distributor_auth | CASCADE | ✅ Safe | Authorizations deleted |

### Missing Cascade Protection - NONE IDENTIFIED

All critical relationships have been properly constrained with RESTRICT where appropriate.

### Recent Fixes Applied

| Migration | Change | Risk Mitigated |
|-----------|--------|----------------|
| 20251221004511 | principal_org FK → RESTRICT | ⚠️→✅ Orphan opportunities |
| 20251221135232 | Soft-delete cascade function | ⚠️→✅ Orphan junction records |
| 20251117032253 | contacts org_id → RESTRICT | ⚠️→✅ Orphan contacts |

---

## Orphan Data Analysis

### Potential Orphan Scenarios

| Entity | Orphan Path | Current Protection | Status |
|--------|-------------|-------------------|--------|
| Contact | Org soft-deleted | RLS filters deleted_at | ✅ Protected |
| Activity | Contact deleted | CASCADE deletes activities | ⚠️ Data loss |
| Activity | Opportunity deleted | SET NULL (preserves) | ✅ Safe |
| Task | Opportunity deleted | Soft-delete cascade | ✅ Protected |
| opportunity_contacts | Opportunity deleted | CASCADE + soft-delete | ✅ Protected |
| opportunity_products | Opportunity deleted | CASCADE + soft-delete | ✅ Protected |

### Edge Case: Activities on Deleted Contacts

**Risk:** When a contact is hard-deleted, all associated activities are CASCADE deleted, potentially losing valuable interaction history.

**Recommendation:** Consider changing contacts.activities FK to SET NULL to preserve activity audit trail.

### Orphan Detection Queries

```sql
-- Find orphaned contacts (should return 0)
SELECT COUNT(*) as orphan_count FROM contacts c
LEFT JOIN organizations o ON c.organization_id = o.id
WHERE o.id IS NULL AND c.deleted_at IS NULL;

-- Find orphaned activities (opportunity deleted but activity kept)
SELECT COUNT(*) as orphan_count FROM activities a
WHERE a.opportunity_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM opportunities o WHERE o.id = a.opportunity_id);

-- Find soft-deleted parent with visible children
SELECT p.id, p.name, p.deleted_at, COUNT(c.id) as visible_contacts
FROM organizations p
JOIN contacts c ON c.organization_id = p.id
WHERE p.deleted_at IS NOT NULL AND c.deleted_at IS NULL
GROUP BY p.id, p.name, p.deleted_at;

-- Find orphaned opportunity_contacts (should return 0 after migration)
SELECT COUNT(*) FROM opportunity_contacts oc
WHERE NOT EXISTS (
  SELECT 1 FROM opportunities o
  WHERE o.id = oc.opportunity_id AND o.deleted_at IS NULL
);
```

---

## Soft Delete Edge Cases

### Soft Delete Implementation Status

| Table | Has deleted_at | RLS Filters | Cascade Function | Status |
|-------|----------------|-------------|------------------|--------|
| opportunities | ✅ | ✅ | ✅ archive_opportunity_with_relations | ✅ Complete |
| contacts | ✅ | ✅ | ❌ None needed | ✅ Complete |
| organizations | ✅ | ✅ | ❌ None (RESTRICT prevents delete) | ✅ Complete |
| activities | ✅ | ✅ | ❌ Cascaded via opportunity | ✅ Complete |
| tasks | ✅ | ✅ | ✅ Cascaded via opportunity | ✅ Complete |
| products | ✅ | ✅ | ❌ None needed | ✅ Complete |
| opportunityNotes | ✅ | ✅ | ✅ Cascaded via opportunity | ✅ Complete |
| contactNotes | ✅ | ✅ | ❌ CASCADE on contact delete | ⚠️ Hard delete on contact |
| organizationNotes | ✅ | ✅ | ❌ None (org RESTRICT) | ✅ Complete |
| opportunity_contacts | ✅ | ⚠️ Partial | ✅ Cascaded (new) | ✅ Complete |
| opportunity_products | ✅ | ⚠️ Partial | ✅ Cascaded (new) | ✅ Complete |
| opportunity_participants | ✅ | ✅ | ✅ Cascaded | ✅ Complete |
| product_distributor_auth | ✅ | ✅ | ❌ CASCADE on product | ✅ Complete |

### Soft Delete Cascade Function

The `archive_opportunity_with_relations()` function properly cascades soft deletes to:
- ✅ activities
- ✅ opportunityNotes
- ✅ opportunity_participants
- ✅ tasks
- ✅ opportunity_contacts (added 2025-12-21)
- ✅ opportunity_products (added 2025-12-21)

Corresponding `unarchive_opportunity_with_relations()` function properly restores all.

---

## Many-to-Many Edge Cases

### Junction Table Integrity

| Junction | Entities | Unique Constraint | On Delete | Soft Delete |
|----------|----------|-------------------|-----------|-------------|
| opportunity_contacts | Opportunity ↔ Contact | ✅ UNIQUE(opp_id, contact_id) | CASCADE both | ✅ Added |
| opportunity_products | Opportunity ↔ Product | ✅ UNIQUE(opp_id, product_id) | CASCADE both | ✅ Added |
| opportunity_participants | Opportunity ↔ Organization | ✅ | CASCADE opp | ✅ Yes |
| contact_organizations | Contact ↔ Organization | ✅ EXCLUDE clause | CASCADE contact | ✅ Yes |
| contact_preferred_principals | Contact ↔ Organization | ✅ UNIQUE | CASCADE contact | ✅ Yes |
| distributor_principal_auth | Distributor ↔ Principal | ✅ UNIQUE | CASCADE both | ✅ Yes |
| organization_distributors | Organization ↔ Distributor | ✅ UNIQUE | CASCADE both | ✅ Yes |
| product_distributor_auth | Product ↔ Distributor | ✅ UNIQUE | CASCADE product | ✅ Yes |

### Duplicate Prevention

| Junction | Duplicate Entry Prevented? | Mechanism |
|----------|---------------------------|-----------|
| opportunity_contacts | ✅ | UNIQUE constraint |
| distributor_principal_auth | ✅ | UNIQUE(distributor_id, principal_id) |
| product_distributor_auth | ✅ | UNIQUE(product_id, distributor_id) |

**No duplicate prevention gaps identified.**

---

## Self-Reference Edge Cases

### Self-Referencing Tables

| Table | Self-Ref Column | On Delete | Cycle Protection | Max Depth |
|-------|-----------------|-----------|------------------|-----------|
| organizations | parent_organization_id | SET NULL | ✅ Trigger | 10 levels |
| contacts | manager_id | SET NULL | ❌ None | N/A |
| segments | parent_id | (no FK) | ❌ None | N/A |

### Organization Hierarchy Protection

The `prevent_organization_cycle()` trigger:
- ✅ Prevents self-parenting (`parent_organization_id = id`)
- ✅ Detects circular references (A→B→C→A)
- ✅ Enforces max depth of 10 levels
- ✅ Raises clear exceptions on violations

```sql
-- Test: Self-parenting prevention
UPDATE organizations SET parent_organization_id = id WHERE id = 1;
-- ERROR: Organization cannot be its own parent (ID: 1)

-- Test: Circular reference prevention
-- If A→B→C exists, trying C→A will fail
UPDATE organizations SET parent_organization_id = [A] WHERE id = [C];
-- ERROR: Cycle detected: Organization [C] would create a circular parent relationship
```

### Edge Case: Contacts Manager Self-Reference

**Gap Identified:** `contacts.manager_id` references `contacts(id)` but has no cycle protection.

**Risk:** Low - Manager relationships are typically shallow (1 level), but a contact could theoretically be set as their own manager.

**Recommendation:** Add check constraint:
```sql
ALTER TABLE contacts ADD CONSTRAINT check_not_self_manager
CHECK (manager_id IS NULL OR manager_id != id);
```

---

## Concurrent Modification Risks

### ✅ Optimistic Locking Status (Updated 2025-12-22)

| Entity | Has updated_at | Version Column | Conflict Detection |
|--------|----------------|----------------|-------------------|
| opportunities | ✅ | ✅ **Added 2025-12-22** | ✅ **Implemented** |
| contacts | ✅ | ❌ | ❌ None |
| organizations | ✅ | ❌ | ❌ None |
| activities | ✅ | ❌ | ❌ None |
| tasks | ✅ | ❌ | ❌ None |
| products | ✅ | ❌ | ❌ None |

**Finding:** ~~No optimistic locking is implemented.~~ **UPDATE 2025-12-22:** Opportunities now have optimistic locking via `version` column with full conflict detection.

### Race Condition Scenarios

| Scenario | Risk | Current Handling | Impact |
|----------|------|------------------|--------|
| Two users edit same opportunity | ✅ **Resolved** | Version check + conflict error | **Protected** |
| Delete opportunity while edit in progress | ⚠️ Low | Error on save | UX issue |
| Create contact while org being deleted | ✅ Low | RESTRICT prevents | Protected |
| Two users assign same task | ⚠️ Medium | Last write wins | Confusion |
| Concurrent activity logging | ✅ Low | No conflict | Both saved |

### PostgreSQL Serialization Errors

The data provider test suite includes a test for handling concurrent update errors:
```typescript
// From unifiedDataProvider.errors.test.ts
message: "could not serialize access due to concurrent update"
```

**UPDATE 2025-12-22:** Proactive prevention is now implemented for opportunities.

### Implementation Applied (Migration 20251222034729)

```sql
-- Version column added
ALTER TABLE opportunities ADD COLUMN version INTEGER DEFAULT 1;

-- Trigger auto-increments on update
CREATE TRIGGER opportunities_version_increment
BEFORE UPDATE ON opportunities
FOR EACH ROW
EXECUTE FUNCTION increment_opportunity_version();

-- RPC checks version before update
sync_opportunity_with_products(..., expected_version INTEGER)
-- Raises CONFLICT exception (40001) on mismatch
```

**Remaining Work:** Consider extending to contacts, tasks, organizations.

---

## Empty State Edge Cases

### Dependent Entity Creation Issues

| Entity | Depends On | If Parent Empty | UI Handles? |
|--------|------------|-----------------|-------------|
| Contact | Organization | Can't select org | ❌ No guidance |
| Opportunity | Principal (optional) | Can proceed | ✅ Optional |
| Opportunity | Customer Org | Can't select customer | ❌ No guidance |
| Activity | Contact or Org | Can't select entity | ❌ No guidance |
| Task | Opportunity (optional) | Can proceed | ✅ Optional |

### Empty State UI Components

| List View | Empty Message | Create CTA | Guidance |
|-----------|---------------|------------|----------|
| Organizations | ✅ OrganizationEmpty | ✅ | ✅ |
| Contacts | ⚠️ Generic | ✅ | ❌ Needs org first |
| Opportunities | ⚠️ Generic | ✅ | ❌ Needs customer org |
| Activities | ⚠️ Generic | ✅ | ⚠️ Partial |
| Tasks | ✅ | ✅ | ✅ |
| Products | ✅ | ✅ | ⚠️ Needs principal |

### Edge Case: Bootstrap Problem

**Scenario:** New CRM instance with no data.

**User Journey:**
1. User tries to create Contact → Needs Organization first
2. User tries to create Opportunity → Needs Customer Organization first
3. User tries to create Activity → Needs Contact or Organization first

**Current State:** No guided onboarding for this bootstrap scenario.

**Recommendation:** Add "Getting Started" wizard or contextual help in empty states:
- "Before creating contacts, you'll need at least one organization"
- "Create your first organization to get started"

---

## Priority Fixes

### P0 - Critical (Data Integrity) - NONE OPEN

All P0 issues have been addressed:
- ✅ Principal organization FK RESTRICT (fixed 2025-12-21)
- ✅ Opportunity junction table soft-delete cascade (fixed 2025-12-21)

### P1 - High Priority (UX/Data Quality)

1. **Add contact manager self-reference check**
   - File: New migration
   - Impact: Prevents logical inconsistency
   - Effort: Low
   ```sql
   ALTER TABLE contacts ADD CONSTRAINT check_not_self_manager
   CHECK (manager_id IS NULL OR manager_id != id);
   ```

2. **Activities on contact deletion**
   - Current: CASCADE (deletes activities)
   - Consider: SET NULL (preserves history)
   - Trade-off: Orphan activities vs. audit trail

### P2 - Medium Priority (Robustness)

1. ✅ **~~Implement optimistic locking for opportunities~~** **COMPLETED 2025-12-22**
   - ✅ Added `version` column
   - ✅ Check version on update via RPC
   - ✅ Return conflict error on mismatch
   - ✅ UI handles conflict with user-friendly refresh

2. **Add empty state guidance**
   - Show "create organization first" for contacts
   - Show dependency chain in empty states

3. **Add segments.parent_id cycle protection**
   - Similar to organizations trigger
   - Prevent infinite category hierarchies

---

## SQL Verification Queries

```sql
-- ============================================
-- Run these queries to verify data integrity
-- ============================================

-- 1. Verify no orphaned contacts
SELECT 'Orphaned Contacts' as check_name, COUNT(*) as count
FROM contacts c
LEFT JOIN organizations o ON c.organization_id = o.id
WHERE o.id IS NULL AND c.deleted_at IS NULL;

-- 2. Verify no orphaned opportunity_contacts
SELECT 'Orphaned Opp-Contacts' as check_name, COUNT(*) as count
FROM opportunity_contacts oc
WHERE NOT EXISTS (
  SELECT 1 FROM opportunities o
  WHERE o.id = oc.opportunity_id
);

-- 3. Verify no orphaned opportunity_products
SELECT 'Orphaned Opp-Products' as check_name, COUNT(*) as count
FROM opportunity_products op
WHERE NOT EXISTS (
  SELECT 1 FROM opportunities o
  WHERE o.id = op.opportunity_id
);

-- 4. Verify soft-delete filtering in summaries
SELECT 'Visible Deleted Opps' as check_name, COUNT(*) as count
FROM opportunities
WHERE deleted_at IS NOT NULL;  -- Should be filtered in views

-- 5. Check for circular organization hierarchies
WITH RECURSIVE org_tree AS (
  SELECT id, parent_organization_id, 1 as depth, ARRAY[id] as path
  FROM organizations
  WHERE parent_organization_id IS NOT NULL

  UNION ALL

  SELECT o.id, o.parent_organization_id, t.depth + 1, t.path || o.id
  FROM organizations o
  JOIN org_tree t ON o.parent_organization_id = t.id
  WHERE t.depth < 15 AND NOT o.id = ANY(t.path)
)
SELECT 'Deep Org Hierarchies (>10)' as check_name, COUNT(*) as count
FROM org_tree WHERE depth > 10;

-- 6. Find contacts who are their own manager
SELECT 'Self-Manager Contacts' as check_name, COUNT(*) as count
FROM contacts WHERE manager_id = id;

-- 7. Verify no NULL opportunity owners (NOT NULL constraint)
SELECT 'NULL Opp Owners' as check_name, COUNT(*) as count
FROM opportunities
WHERE opportunity_owner_id IS NULL AND deleted_at IS NULL;

-- 8. Verify no NULL task owners (NOT NULL constraint)
SELECT 'NULL Task Owners' as check_name, COUNT(*) as count
FROM tasks
WHERE sales_id IS NULL AND deleted_at IS NULL;
```

---

## Recommendations Summary

### Immediate Actions (This Sprint)

1. ✅ **COMPLETED:** Principal organization FK RESTRICT
2. ✅ **COMPLETED:** Opportunity junction table soft-delete cascade
3. **ADD:** Contact self-manager check constraint

### Next Sprint

1. Consider changing activities.contact_id FK to SET NULL
2. Add optimistic locking to opportunities
3. Improve empty state UX with dependency guidance

### Future Improvements

1. Add version columns for conflict detection
2. Create nightly orphan detection job
3. Add segments hierarchy cycle protection
4. Create bootstrap onboarding wizard

---

## Appendix: Migration History (Data Integrity)

| Date | Migration | Change |
|------|-----------|--------|
| 2025-11-17 | 20251117032253 | Fix referential integrity (activities, contacts RESTRICT) |
| 2025-11-17 | 20251117105523 | Organization cycle protection trigger |
| 2025-11-29 | 20251129030358 | Contact organization_id NOT NULL |
| 2025-12-02 | 20251202045956 | Ownership NOT NULL constraints |
| 2025-12-12 | 20251212034456 | Product distributor auth soft-delete |
| 2025-12-21 | 20251221004511 | Principal organization FK RESTRICT |
| 2025-12-21 | 20251221135232 | Complete soft-delete cascade |

---

*Generated by Agent 22 - Edge Case Finder (Data Relationships)*
*Crispy CRM Codebase Audit Suite*
