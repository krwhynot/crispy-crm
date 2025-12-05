# Admin User Management Design

**Date:** 2025-12-04
**Status:** Validated

## Problem Statement

Admins need a way to manage team members (sales reps) directly within the CRM:
- Invite new users with email + temporary password
- Edit user details (name, email)
- Assign roles (admin/manager/rep)
- Disable/enable accounts (soft-disable)

Currently, the backend supports these operations via Edge Function (`supabase/functions/users/index.ts`), but there's no admin UI to expose these capabilities.

## Decision

**Approach: React Admin Resource Pattern**

Build user management as a first-class React Admin resource with admin-only access, following existing patterns (StandardListLayout, PremiumDatagrid, ResourceSlideOver).

**Rationale:**
- Maximum code reuse with existing patterns
- Built-in React Admin routing, breadcrumbs, notifications
- `canAccess` already wired for admin-only access
- Consistent UX with contacts/opportunities (Jakob's Law)

## Alternatives Considered

### Custom Page (Non-Resource)
- Pros: Simpler mental model, full control
- Cons: Duplicates solved patterns, manual state management, violates single source of truth
- **Rejected:** Too much custom code for solved problems

### Extend Existing Sales Resource
- Pros: Minimal new code
- Cons: Mixes "view colleagues" with "manage users", confusing UX
- **Rejected:** Violates Jakob's Law - admin ≠ colleague directory

## Design Details

### Architecture

```
src/atomic-crm/admin/
├── users/
│   ├── index.tsx           # Resource registration + exports
│   ├── UserList.tsx        # StandardListLayout + PremiumDatagrid
│   ├── UserSlideOver.tsx   # Edit user details (40vw panel)
│   ├── UserInviteForm.tsx  # Invite new user modal
│   └── schemas.ts          # Zod schemas for TypeScript types
│   └── __tests__/          # Unit tests
└── index.tsx               # Admin module barrel export
```

### Navigation

- "Team Management" link in profile dropdown (Header.tsx)
- Visible only for `role === 'admin'`
- Routes to `/admin/users`

### Data Model

Uses existing `sales` table - no schema changes required:

| Column | Type | Purpose |
|--------|------|---------|
| `id` | bigint | Primary key |
| `user_id` | uuid | Links to auth.users |
| `email` | text | User's email |
| `first_name` | text | Display name |
| `last_name` | text | Display name |
| `role` | user_role enum | admin/manager/rep |
| `disabled` | boolean | Soft-disable account |
| `avatar_url` | text | Profile picture |
| `created_at` | timestamp | Member since |

### Zod Schemas

```typescript
// src/atomic-crm/admin/users/schemas.ts
export const userInviteSchema = z.strictObject({
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  role: z.enum(['admin', 'manager', 'rep']).default('rep'),
});

export const userUpdateSchema = z.strictObject({
  sales_id: z.coerce.number().int().positive(),
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
  role: z.enum(['admin', 'manager', 'rep']).optional(),
  disabled: z.coerce.boolean().optional(),
});
```

### Component Structure

**UserList.tsx:**
- StandardListLayout shell with "Team Management" title
- PremiumDatagrid with columns: Avatar, Name, Email, Role (badge), Status, Joined
- InviteUserButton in toolbar
- Edit button per row → opens slide-over

**UserSlideOver.tsx (40vw):**
- SimpleForm with: first_name, last_name, email (disabled), role (select), disabled (toggle)
- Save/Cancel toolbar

**UserInviteForm.tsx (Modal):**
- Dialog triggered by InviteUserButton
- Fields: email, first_name, last_name, password, role
- Submits to Edge Function

**Custom Fields:**
- RoleBadgeField: admin=purple, manager=blue, rep=gray
- StatusField: Active (green) / Disabled (muted)

### Data Flow

**Read Operations:**
```
UserList → dataProvider.getList('sales') → unifiedDataProvider → Supabase
```

**Write Operations:**
```
UserInviteForm → dataProvider.inviteUser() → Edge Function → Supabase Admin API
UserSlideOver  → dataProvider.updateUser() → Edge Function → Supabase Admin API
```

**Data Provider Extension:**
```typescript
// Add to unifiedDataProvider.ts
inviteUser: async (data: UserInvite) => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/users`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Invite failed');
  return response.json();
},

updateUser: async (data: UserUpdate) => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/users`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Update failed');
  return response.json();
},
```

### Error Handling

**Fail-Fast (No Resilience):**
- No retry logic, circuit breakers, or graceful fallbacks
- Let errors throw, React Admin displays via toast notifications
- Edge Function returns structured errors: `{ status, message }`

### Testing

**Unit Tests (Vitest):**
- `UserList.test.tsx`: Renders datagrid, shows invite button for admins
- `UserInviteForm.test.tsx`: Form submission, validation error display
- `UserSlideOver.test.tsx`: Edit form, role change

**E2E Tests (Playwright):**
- Admin can invite new team member (full flow)
- Admin can change user role
- Admin can disable/enable user
- Non-admin cannot access team management

## Engineering Principles Applied

- [x] **Fail-fast** - No retry logic, let errors throw
- [x] **Single source of truth** - All data through unifiedDataProvider
- [x] **Zod at API boundary** - Validation in Edge Function, not forms
- [x] **interface for objects, type for unions** - TypeScript conventions
- [x] **Semantic colors** - Role badges use design system tokens
- [x] **Jakob's Law** - Consistent with existing list/slide-over patterns

## Open Questions

None - design validated through brainstorming session.

## Implementation Notes

### Edge Function Update Needed

The existing Edge Function uses `administrator` boolean instead of `role` enum. Options:
1. Update Edge Function to accept `role` field
2. Map `role` → `administrator` in frontend (admin role = administrator: true)

**Recommendation:** Update Edge Function to use `role` field for consistency with database schema.

### Profile Dropdown Integration

Add menu item to existing Header.tsx profile dropdown:
```tsx
{isAdmin && (
  <DropdownMenuItem asChild>
    <Link to="/admin/users">Team Management</Link>
  </DropdownMenuItem>
)}
```
