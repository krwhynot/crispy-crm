# RBAC Implementation Plan

> Generated: 2025-12-11
> Scope: Backlog items for future consideration (no P1 changes required)

---

## Overview

**Goal:** Document future RBAC enhancements for when Crispy CRM scales beyond the current 6-user MVP.

**Timeline:** Backlog - implement when business requirements change

**Risk Level:** Low - current implementation is production-ready

---

## Executive Summary

After comprehensive research comparing Crispy CRM's RBAC implementation against industry best practices from Supabase, PostgreSQL, React Admin, and Google Cloud IAM, **no critical changes are required**.

The current system implements:
- ✅ 5-layer defense in depth
- ✅ Principle of least privilege
- ✅ SECURITY DEFINER privilege isolation
- ✅ Complete audit trail
- ✅ Role enum validation
- ✅ Column-level restrictions
- ✅ Soft delete data integrity

---

## Backlog Items (P3)

### Item 1: JWT-Based Role Claims

**When to Implement:** If auth queries become a performance bottleneck

**Current State:**
```typescript
// Role fetched from sales table on each request
const sale = await getSaleFromCache(); // 15-min TTL cache
return { role: sale.role || "rep" };
```

**Future State:**
```sql
-- Supabase Auth Hook to inject role into JWT
CREATE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
  claims jsonb;
  user_role public.user_role;
BEGIN
  SELECT role INTO user_role FROM public.sales
  WHERE user_id = (event->>'user_id')::uuid;

  claims := event->'claims';
  claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));

  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;
```

**Benefits:**
- Eliminate DB query per request
- Role available immediately in JWT
- Consistent with Supabase best practices

**Effort:** Medium (2-3 hours)

---

### Item 2: Granular Permissions System

**When to Implement:** If role requirements become more complex (10+ users, territory restrictions, principal-specific access)

**Current State:**
```typescript
// 3 hardcoded roles with implicit permissions
export const canAccess = (role: string, params: CanAccessParams): boolean => {
  if (role === "admin") return true;
  if (resource === "sales") return false;
  if (action === "delete") return false;
  return true;
};
```

**Future State:**
```typescript
// Permission-based system (ra-rbac pattern)
const roleDefinitions = {
  admin: [{ action: '*', resource: '*' }],
  manager: [
    { action: ['list', 'show', 'create', 'edit'], resource: '*' },
    { type: 'deny', action: 'delete', resource: '*' },
    { action: '*', resource: 'sales', record: { team_id: '${user.team_id}' } },
  ],
  rep: [
    { action: ['list', 'show', 'create'], resource: '*' },
    { action: 'edit', resource: 'opportunities', record: { owner_id: '${user.id}' } },
    { type: 'deny', action: 'delete', resource: '*' },
  ],
};
```

**Benefits:**
- Add permissions without code changes
- Record-level access control
- Explicit deny rules for exceptions

**Effort:** High (1-2 days)

---

## Not Implementing

These patterns were evaluated and **intentionally not recommended** for Crispy CRM:

| Pattern | Reason |
|---------|--------|
| Role inheritance hierarchy | Over-engineering for 6 users |
| Separate permissions table | Adds DB complexity for 3 roles |
| Record-level permissions | No principal/territory restrictions needed |
| Custom permission admin UI | Admin handles 6 users manually |
| ABAC (Attribute-Based) | Enterprise pattern, massive overkill |
| External policy engine (OPA) | Adds infrastructure complexity |

---

## Trigger Conditions

Consider implementing backlog items when:

| Condition | Recommended Action |
|-----------|-------------------|
| User count > 20 | Evaluate granular permissions |
| Auth latency > 100ms | Implement JWT claims |
| Territory restrictions needed | Add record-level permissions |
| Compliance audit required | Add permission change logging |
| Multiple organizations | Implement multi-tenant isolation |

---

## Rollback Plan

Not applicable - no changes being made to production system.

---

## Validation Checklist

Current implementation already passes all checks:

- [x] Admin can edit any user's profile fields
- [x] Admin can change any user's role
- [x] Admin can disable/enable users
- [x] Manager can view all team data
- [x] Manager can edit all team records
- [x] Manager cannot delete records
- [x] Rep can only edit own opportunities/tasks
- [x] Rep cannot change own role
- [x] All changes logged to audit_trail
- [x] No RLS policy errors in logs

---

## Conclusion

**No implementation work required at this time.**

The current RBAC system is well-designed for Crispy CRM's 6-user MVP. This document serves as a reference for future enhancements when the business scales.

---

## References

- [Supabase Custom Claims & RBAC](https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac)
- [React Admin RBAC (ra-rbac)](https://github.com/marmelab/react-admin/blob/master/docs/AuthRBAC.md)
- [PostgreSQL Role Hierarchies](https://docs.yugabyte.com/preview/secure/authorization/create-roles/)
- [Google Cloud IAM Best Practices](https://cloud.google.com/secret-manager/docs/access-control)
