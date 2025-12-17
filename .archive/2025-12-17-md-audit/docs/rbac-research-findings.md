# RBAC Research Findings

> Generated: 2025-12-11
> Sources: Supabase Docs, PostgreSQL Docs, React Admin Docs, Google Cloud IAM

## Executive Summary

This research synthesizes RBAC patterns from Supabase RLS policies, PostgreSQL role hierarchies, React Admin's permission system, and industry best practices. Key findings: (1) JWT-based custom claims enable efficient RLS checks without database joins, (2) PostgreSQL role inheritance provides natural hierarchy modeling, (3) React Admin's `{ action, resource, record? }` permission model aligns with our 3-tier role system (admin, manager, rep), and (4) the Principle of Least Privilege requires explicit permission grants with deny-by-default behavior.

## Source 1: Supabase Custom Claims & RBAC

**URL:** https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac

### Key Takeaways

1. **Custom Access Token Auth Hook**: Inject user roles into JWT claims at authentication time, avoiding database joins in RLS policies
2. **Separate Permission Tables**: Use `user_roles` and `role_permissions` tables for flexible role-permission mapping
3. **Authorize Helper Function**: Create a stable, security definer function to check permissions from JWT claims
4. **Enum-Based Roles**: Define `app_role` and `app_permission` enums for type safety
5. **JWT Claim Reading**: Access role from JWT with `(auth.jwt()->>'user_role')::public.app_role`

### Relevant Code Examples

**Auth Hook to Inject Claims:**
```typescript
export const customAccessToken: CustomAccessTokenHook = async (event, context) => {
  const userId = event.user_id;
  const { data, error } = await context.supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single();

  if (error) throw error;

  return {
    claims: {
      user_role: data.role,
    },
  };
};
```

**Permission Tables:**
```sql
CREATE TYPE app_role AS ENUM ('admin', 'manager', 'rep');
CREATE TYPE app_permission AS ENUM (
  'opportunities.create',
  'opportunities.read',
  'opportunities.update',
  'opportunities.delete',
  'activities.create',
  'activities.read'
);

CREATE TABLE user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  role app_role NOT NULL
);

CREATE TABLE role_permissions (
  id SERIAL PRIMARY KEY,
  role app_role NOT NULL,
  permission app_permission NOT NULL,
  UNIQUE(role, permission)
);
```

**Authorize Helper Function:**
```sql
CREATE FUNCTION authorize(requested_permission app_permission)
RETURNS BOOLEAN AS $$
  SELECT count(*) > 0
  FROM role_permissions
  WHERE permission = requested_permission
    AND role = (auth.jwt()->>'user_role')::public.app_role;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
```

**RLS Policy Using Authorize:**
```sql
CREATE POLICY "Users can read opportunities if authorized"
ON opportunities FOR SELECT
USING (authorize('opportunities.read'));

CREATE POLICY "Reps can only read own opportunities"
ON opportunities FOR SELECT
USING (
  (auth.jwt()->>'user_role')::public.app_role = 'rep'
  AND user_id = auth.uid()
);
```

## Source 2: PostgreSQL Role Hierarchies

**URL:** https://docs.yugabyte.com/preview/secure/authorization/create-roles/#create-a-hierarchy-of-roles

### Key Takeaways

1. **Role Inheritance**: Roles can inherit from other roles via `GRANT role TO role`
2. **Privilege Flow**: Permissions flow downward in the hierarchy (child roles inherit parent permissions)
3. **Hierarchy Modeling**: Natural fit for organizational structures (admin → manager → rep)
4. **Multiple Inheritance**: Roles can inherit from multiple parent roles
5. **SET ROLE Command**: Users can switch between inherited roles at runtime

### Relevant Code Examples

**Creating Role Hierarchy:**
```sql
CREATE ROLE admin;
CREATE ROLE manager;
CREATE ROLE rep;

-- Manager inherits all admin permissions
GRANT admin TO manager;

-- Rep inherits manager permissions (and transitively, admin)
GRANT manager TO rep;
```

**Granting Privileges to Roles:**
```sql
-- Admin gets full access
GRANT ALL ON opportunities TO admin;

-- Manager gets read/write (inherits from admin)
GRANT SELECT, INSERT, UPDATE ON opportunities TO manager;

-- Rep gets read-only on own records
GRANT SELECT ON opportunities TO rep;
```

**Note for Crispy CRM Context:**
While PostgreSQL role hierarchies are powerful, Supabase multi-tenant RLS typically uses JWT claims instead of database roles for application-level RBAC. Database roles are reserved for infrastructure (anon, authenticated, service_role). Our implementation should use JWT claims with custom auth hooks.

## Source 3: React Admin RBAC (ra-rbac)

**URL:** https://github.com/marmelab/react-admin/blob/master/docs/AuthRBAC.md

### Key Takeaways

1. **Permission Model**: Permissions are `{ action, resource, record? }` objects
2. **Standard Actions**: `list`, `show`, `create`, `edit`, `delete`, `export`, `clone`, `read`, `write`
3. **Principle of Least Privilege**: Users with no permissions have access to nothing (deny by default)
4. **Pessimistic Strategy**: Hide UI elements while permissions are loading
5. **Explicit Deny**: `{ type: 'deny', action, resource }` rules take precedence over allow rules
6. **Record-Level Permissions**: Restrict access by specific record IDs or properties
7. **Wildcard Support**: Use `'*'` for all actions or all resources
8. **authProvider.canAccess()**: Return boolean based on permission checks

### Relevant Code Examples

**Permission Definitions:**
```javascript
const roles = {
  administrator: [
    { action: '*', resource: '*' }
  ],
  manager: [
    { action: ['list', 'show', 'create', 'edit'], resource: 'opportunities' },
    { action: ['list', 'show'], resource: 'principals' },
    { action: 'read', resource: 'opportunities.*' },
    { action: 'write', resource: 'opportunities.*' },
  ],
  rep: [
    { action: ['list', 'show', 'create', 'edit'], resource: 'opportunities' },
    { action: 'read', resource: 'opportunities.*' },
    { action: 'write', resource: ['opportunities.title', 'opportunities.stage'] },
    { type: 'deny', action: 'delete', resource: '*' },
  ],
};
```

**Record-Level Permissions:**
```javascript
const roles = {
  rep: [
    {
      action: ['list', 'show', 'edit'],
      resource: 'opportunities',
      record: { user_id: '{{ userId }}' } // Only own opportunities
    },
  ],
};
```

**authProvider.canAccess() Implementation:**
```javascript
import { canAccessWithPermissions } from 'ra-rbac';

const authProvider = {
  async canAccess({ action, resource, record }) {
    const role = await getRole(); // Fetch from JWT or API
    const permissions = roles[role];
    return canAccessWithPermissions({
      permissions,
      action,
      resource,
      record
    });
  },
};
```

**Component-Level Usage:**
```jsx
import { useCanAccess } from 'react-admin';

const OpportunityEditButton = ({ record }) => {
  const { isPending, canAccess } = useCanAccess({
    action: 'edit',
    resource: 'opportunities',
    record,
  });

  if (isPending) return null; // Pessimistic strategy
  if (!canAccess) return null;

  return <EditButton />;
};
```

## Source 4: Industry Best Practices (Google Cloud IAM)

**URL:** https://cloud.google.com/secret-manager/docs/access-control#principle-of-least-privilege

### Key Takeaways

1. **Principle of Least Privilege**: Grant only the minimum permissions needed for a task
2. **Regular Audits**: Review and revoke unnecessary permissions periodically
3. **Separation of Duties**: No single user should have all critical permissions
4. **Role-Based Over User-Based**: Assign permissions to roles, not individual users
5. **Time-Bound Access**: Use temporary permission grants where possible
6. **Audit Logging**: Log all permission checks and access attempts
7. **Defense in Depth**: Layer multiple permission checks (UI, API, database)

### Crispy CRM Application

For our 3-tier system:
- **Admin**: Full access but audit all destructive actions
- **Manager**: Read all, write own team's records, no delete
- **Rep**: Read/write only own records, no delete

Regular audit tasks:
- Review user role assignments monthly
- Log all permission escalations (rep → manager)
- Monitor failed authorization attempts

## Common Patterns Across Sources

| Pattern | Supabase RLS | PostgreSQL Roles | React Admin | Industry Practice |
|---------|--------------|------------------|-------------|-------------------|
| **Deny by Default** | ✅ No policy = no access | ✅ No GRANT = no access | ✅ No permission = no access | ✅ Principle of Least Privilege |
| **Hierarchical Roles** | ⚠️ Manual via authorize() | ✅ GRANT role TO role | ✅ Permission inheritance in roles object | ✅ Role-based access |
| **Record-Level Security** | ✅ RLS policies with user_id | ⚠️ Limited (requires RLS) | ✅ record property matching | ⚠️ Application-layer only |
| **Permission Auditing** | ✅ pg_audit extension | ✅ Built-in logging | ⚠️ Application layer | ✅ Required for compliance |
| **Explicit Deny** | ⚠️ Manual policy ordering | ⚠️ REVOKE command | ✅ type: 'deny' rules | ✅ Defense in depth |
| **Wildcard Support** | ❌ Not native | ✅ ALL privileges | ✅ action: '*', resource: '*' | ⚠️ Use sparingly |
| **JWT-Based Claims** | ✅ Custom auth hooks | ❌ N/A | ⚠️ Via authProvider | ✅ Stateless auth |

## Recommended Architecture for Crispy CRM

### Layer 1: Database (RLS Policies)
```sql
-- Use JWT claims from custom auth hook
CREATE POLICY "reps_own_opportunities"
ON opportunities FOR ALL
USING (
  (auth.jwt()->>'user_role')::public.app_role = 'rep'
  AND user_id = auth.uid()
);

CREATE POLICY "managers_team_opportunities"
ON opportunities FOR SELECT
USING (
  (auth.jwt()->>'user_role')::public.app_role = 'manager'
  AND organization_id = (auth.jwt()->>'organization_id')::uuid
);

CREATE POLICY "admins_all_opportunities"
ON opportunities FOR ALL
USING (
  (auth.jwt()->>'user_role')::public.app_role = 'admin'
);
```

### Layer 2: React Admin (UI Permissions)
```javascript
const permissions = {
  admin: [
    { action: '*', resource: '*' }
  ],
  manager: [
    { action: ['list', 'show', 'create', 'edit'], resource: 'opportunities' },
    { action: ['list', 'show'], resource: 'users' },
    { type: 'deny', action: 'delete', resource: '*' },
  ],
  rep: [
    {
      action: ['list', 'show', 'create', 'edit'],
      resource: 'opportunities',
      record: { user_id: '{{ userId }}' }
    },
    { type: 'deny', action: 'delete', resource: '*' },
  ],
};
```

### Layer 3: Data Provider (API Boundary)
```typescript
// unifiedDataProvider.ts - enforce permissions before Supabase calls
const checkPermission = (resource: string, action: string, role: AppRole) => {
  if (role === 'admin') return true;
  if (role === 'rep' && ['delete', 'deleteMany'].includes(action)) {
    throw new Error('Reps cannot delete records');
  }
  return true;
};
```

## Migration Path for Crispy CRM

### Phase 1: Database Setup (Sprint 1)
1. Create `app_role` enum with `('admin', 'manager', 'rep')`
2. Add `role` column to `profiles` table
3. Create custom auth hook to inject `user_role` claim
4. Deploy initial RLS policies for `opportunities` table

### Phase 2: React Admin Integration (Sprint 2)
1. Define permissions object in `src/atomic-crm/authProvider.ts`
2. Implement `canAccess()` using `canAccessWithPermissions()`
3. Add `<IfCanAccess>` guards to Create/Edit/Delete buttons
4. Test pessimistic loading states

### Phase 3: Audit & Refinement (Sprint 3)
1. Add `pg_audit` logging for permission violations
2. Create admin dashboard for role assignments
3. Document permission matrix in CLAUDE.md
4. Conduct security audit

## Open Questions

1. **Role Assignment**: Should role changes require email verification?
2. **Manager Scope**: Do managers see all org records or only assigned team members?
3. **Temporary Elevation**: Do we need "acting manager" temporary role grants?
4. **Audit Retention**: How long do we keep permission check logs?

## References

- [Supabase Custom Claims Guide](https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac)
- [PostgreSQL Role Hierarchies](https://docs.yugabyte.com/preview/secure/authorization/create-roles/#create-a-hierarchy-of-roles)
- [React Admin RBAC Documentation](https://github.com/marmelab/react-admin/blob/master/docs/AuthRBAC.md)
- [Google Cloud IAM Best Practices](https://cloud.google.com/secret-manager/docs/access-control#principle-of-least-privilege)
