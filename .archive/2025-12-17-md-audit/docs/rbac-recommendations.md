# RBAC Implementation Recommendations

> Generated: 2025-12-11
> Priority: Changes ordered by business impact and implementation complexity
> Context: React Admin + Supabase CRM | 6 users | 3-tier role system (admin, manager, rep)

## Executive Summary

**Key Finding: Current RBAC implementation is solid for MVP.**

The existing system already follows industry best practices with defense-in-depth security across 5 layers:
- ✅ Row-Level Security (RLS) policies enforce data access boundaries
- ✅ SECURITY DEFINER functions prevent privilege escalation
- ✅ Audit trail captures all data changes automatically
- ✅ Role enum prevents invalid role assignments
- ✅ Column-level restrictions on sensitive fields (e.g., `sales.role`)
- ✅ Soft deletes preserve data integrity and audit history
- ✅ Principle of least privilege (default deny)

Most recommendations below are documentation tasks or backlog items for future scalability. No critical security gaps identified.

---

## Priority Matrix

| Recommendation | Business Impact | Effort | Priority |
|----------------|-----------------|--------|----------|
| 2.1: Add Role Change Audit Trail | Medium | Low | P2 |
| 2.2: Document Current RBAC System | High | Low | P2 |
| 3.1: JWT-Based Role Claims | Low | Medium | P3 |
| 3.2: Granular Permissions System | Low | High | P3 |

---

## P1: Critical (Implement Now)

**None identified** - Current implementation meets security requirements for MVP launch.

The existing RLS policies, SECURITY DEFINER functions, and audit trail provide comprehensive protection for a 6-user, pre-launch system.

---

## P2: High Priority (Implement Soon)

### Recommendation 2.1: Add Role Change Audit Trail

**Problem:**
Role changes (e.g., promoting a rep to manager) should be explicitly tracked for compliance and debugging.

**Solution:**
Add dedicated audit entries when `sales.role` changes.

**Status:**
✅ **Already implemented!** The existing `audit_trail` trigger on the `sales` table captures all column changes, including `role`. The `changed_fields` JSONB column stores the old and new values.

**Implementation:**
No action required. Verify existing trigger:

```sql
-- Existing trigger on sales table
CREATE TRIGGER audit_sales_changes
  AFTER INSERT OR UPDATE OR DELETE ON sales
  FOR EACH ROW
  EXECUTE FUNCTION audit_trail_trigger();
```

**Validation:**
- [ ] Query `audit_trail` table for `role` changes: `SELECT * FROM audit_trail WHERE table_name = 'sales' AND changed_fields ? 'role';`
- [ ] Verify `changed_fields` JSONB includes old/new role values
- [ ] Confirm timestamp and `changed_by` (user ID) are captured

---

### Recommendation 2.2: Document Current RBAC System

**Problem:**
No formal documentation of permission matrix, RLS policies, or role definitions. New developers and auditors lack visibility into access control rules.

**Solution:**
Create comprehensive RBAC documentation across 4 files:

1. **`docs/rbac-overview.md`** - High-level permission matrix, role definitions, security principles
2. **`docs/rbac-rls-policies.md`** - Technical deep-dive: RLS policies per table, SQL source, rationale
3. **`docs/rbac-testing.md`** - Test scenarios for each role, expected outcomes, automation scripts
4. **`docs/rbac-recommendations.md`** - This file (prioritized improvement roadmap)

**Implementation:**

**Step 1:** Create `docs/rbac-overview.md`
- Permission matrix: What each role can Create/Read/Update/Delete per resource
- Role definitions: Admin, Manager, Rep responsibilities
- Security architecture: 5-layer defense diagram

**Step 2:** Create `docs/rbac-rls-policies.md`
- Per-table policy breakdown (e.g., `opportunities`, `activities`, `sales`)
- SQL source code for each policy
- Design rationale (why reps can't see other reps' opportunities)

**Step 3:** Create `docs/rbac-testing.md`
- Test scenarios: "Rep attempts to view Manager's opportunity"
- Expected outcomes: Access denied, error message, audit log entry
- Automation: Playwright E2E tests for RBAC violations

**Validation:**
- [ ] All 4 documentation files created
- [ ] Permission matrix reviewed by engineering team
- [ ] RLS policies cross-referenced with actual database (`supabase/migrations/`)
- [ ] Test scenarios cover all CRUD operations per role
- [ ] New developer can understand RBAC system in <30 minutes

---

## P3: Medium Priority (Backlog)

### Recommendation 3.1: JWT-Based Role Claims (Performance)

**Problem:**
User role is fetched from the `sales` table on each request, requiring a database query. At scale, this adds latency and unnecessary load.

**Current Flow:**
```
Request → Supabase Auth → RLS policy → SELECT sales.role WHERE user_id = auth.uid()
```

**Solution:**
Embed `role` in JWT claims using Supabase Auth Hook. RLS policies read from `auth.jwt()` instead of querying `sales` table.

**Optimized Flow:**
```
Request → Supabase Auth → JWT contains role → RLS policy reads auth.jwt().role (no DB query)
```

**Implementation:**

**Step 1:** Create Supabase Auth Hook (Edge Function)
```typescript
// supabase/functions/auth-hook-custom-claims/index.ts
Deno.serve(async (req) => {
  const { user_id } = await req.json();

  // Fetch role from sales table
  const { data } = await supabase
    .from('sales')
    .select('role')
    .eq('user_id', user_id)
    .single();

  return new Response(
    JSON.stringify({ role: data?.role || 'rep' }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
```

**Step 2:** Update RLS policies to use JWT claims
```sql
-- Before: Query sales table
CREATE POLICY "Reps see own opportunities"
ON opportunities FOR SELECT
USING (
  sales_rep_id IN (
    SELECT id FROM sales WHERE user_id = auth.uid()
  )
);

-- After: Read from JWT
CREATE POLICY "Reps see own opportunities"
ON opportunities FOR SELECT
USING (
  sales_rep_id IN (
    SELECT id FROM sales WHERE user_id = auth.uid()
  )
  AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'rep'
);
```

**Benefits:**
- Eliminate 1 DB query per request
- Reduce latency by ~5-10ms
- Lower database load (matters at scale, not for 6 users)

**Effort:**
Medium (Edge Function + RLS policy migration)

**When to Implement:**
After MVP launch, if performance profiling shows auth queries are a bottleneck (unlikely for 6 users).

**Validation:**
- [ ] Auth hook deployed and configured in Supabase Dashboard
- [ ] JWT contains `role` claim (inspect token in browser DevTools)
- [ ] RLS policies updated to read from `auth.jwt()`
- [ ] Performance test: Measure request latency before/after
- [ ] Role changes still propagate (JWT refreshed on next login)

---

### Recommendation 3.2: Granular Permissions System (Scalability)

**Problem:**
Hardcoded 3-role system limits flexibility. Adding new permissions (e.g., "can export reports") requires code changes across RLS policies, frontend, and data provider.

**Current System:**
```typescript
// Hardcoded role checks
if (userRole === 'admin') { /* allow */ }
if (userRole === 'manager') { /* allow */ }
```

**Solution:**
Migrate to permission-based system like `ra-rbac` (React Admin RBAC module). Define permissions separately from roles.

**New System:**
```typescript
// Permission-based checks
if (hasPermission('opportunities.delete')) { /* allow */ }
if (hasPermission('reports.export')) { /* allow */ }
```

**Implementation:**

**Step 1:** Install `ra-rbac`
```bash
npm install @react-admin/ra-rbac
```

**Step 2:** Define permission schema
```typescript
// src/atomic-crm/rbac/permissions.ts
export const permissions = {
  admin: [
    'opportunities.*',
    'activities.*',
    'sales.manage',
    'reports.export',
  ],
  manager: [
    'opportunities.read',
    'opportunities.create',
    'opportunities.update',
    'activities.*',
    'reports.export',
  ],
  rep: [
    'opportunities.read.own',
    'opportunities.update.own',
    'activities.create.own',
  ],
};
```

**Step 3:** Wrap data provider with RBAC
```typescript
// src/atomic-crm/providers/supabase/unifiedDataProvider.ts
import { addRBACMiddleware } from '@react-admin/ra-rbac';

export const dataProvider = addRBACMiddleware(
  unifiedDataProvider,
  permissions
);
```

**Step 4:** Use permission checks in components
```typescript
// Before: Role check
{userRole === 'admin' && <DeleteButton />}

// After: Permission check
<DeleteButton permission="opportunities.delete" />
```

**Benefits:**
- Add new permissions without code changes (just update schema)
- Granular control (e.g., "export reports" independent of "delete opportunities")
- Easier to reason about ("can this user do X?" vs. "what can managers do?")

**Effort:**
High (requires refactoring RLS policies, frontend components, data provider)

**When to Implement:**
If Crispy CRM scales beyond 3 roles (e.g., adding "read-only analyst" or "principal-specific rep").

**Validation:**
- [ ] `ra-rbac` installed and configured
- [ ] Permission schema defined for all resources
- [ ] Data provider wrapped with RBAC middleware
- [ ] Frontend components use permission checks
- [ ] RLS policies updated to check permissions table
- [ ] All existing RBAC tests pass

---

## Not Recommended for Crispy CRM

| Pattern | Why Not | When to Reconsider |
|---------|---------|-------------------|
| **Role Inheritance Hierarchy** | Over-engineering for 6-user system. Adds complexity with no business benefit. | If roles exceed 5 tiers (e.g., regional managers, team leads) |
| **Permission Groups/Policies Table** | Database-driven permissions add latency and complexity. Not needed for 3 static roles. | If permission changes are frequent (weekly) |
| **Record-Level Permissions** | No business requirement for principal-specific or territory-based access restrictions. | If account managers specialize by principal |
| **Custom Permission UI** | Admin can manually manage 6 users. Building UI is wasted effort. | If user count exceeds 50 or self-service role changes needed |
| **Attribute-Based Access Control (ABAC)** | Overkill for simple 3-role system. Adds significant implementation complexity. | If access rules depend on attributes (time, location, device) |
| **Temporary Role Elevation** | No use case for "sudo" or time-limited admin access. | If compliance requires approvals for sensitive operations |

---

## Validation Checklist

Use this checklist to verify RBAC implementation after completing recommendations.

### P2 Recommendations
- [ ] **2.1:** Confirmed audit trail captures role changes (query `audit_trail` table)
- [ ] **2.2:** All 4 documentation files created and reviewed
- [ ] **2.2:** Permission matrix tested against actual RLS policies

### P3 Recommendations (Future)
- [ ] **3.1:** JWT contains `role` claim (inspect token in DevTools)
- [ ] **3.1:** RLS policies updated to read from `auth.jwt()`
- [ ] **3.1:** Performance test shows latency improvement
- [ ] **3.2:** `ra-rbac` installed and permission schema defined
- [ ] **3.2:** All RBAC tests pass with new permission system

### Security Audit
- [ ] Each role tested for unauthorized access attempts (E2E tests)
- [ ] SECURITY DEFINER functions reviewed for privilege escalation risks
- [ ] Soft deletes prevent permanent data loss
- [ ] Audit trail captures all CRUD operations
- [ ] Column-level restrictions prevent role tampering

---

## Appendix: Security Principles

The current RBAC implementation follows these industry-standard principles:

1. **Defense in Depth:** 5 security layers (RLS, SECURITY DEFINER, audit trail, role enum, soft deletes)
2. **Principle of Least Privilege:** Default deny. Users only access what they need.
3. **Fail Secure:** Access denied on error (no fallback to permissive mode)
4. **Audit Everything:** All data changes logged with timestamp, user, old/new values
5. **Immutable Roles:** Role enum prevents typos/invalid values
6. **No Privilege Escalation:** SECURITY DEFINER functions prevent users from bypassing RLS

These principles should guide all future RBAC changes.
