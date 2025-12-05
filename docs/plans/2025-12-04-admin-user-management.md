# Implementation Plan: Admin User Management

**Date:** 2025-12-04
**Design Reference:** `docs/designs/2025-12-04-admin-user-management-design.md`
**Granularity:** Atomic (2-5 min tasks)
**Execution:** Hybrid (parallel groups + sequential dependencies)
**Testing:** TDD Strict (failing tests BEFORE implementation)

---

## Overview

Build admin user management feature allowing admins to invite, edit, and manage team members through a dedicated `/admin/users` page accessible from the profile dropdown.

### Prerequisites Verified

- [x] **Database schema** - `role` column exists (`20251111121526_add_role_based_permissions.sql`)
- [x] **TypeScript types** - `user_role` enum in `database.generated.ts`
- [x] **canAccess** - `sales` resource already admin-only (no regression)
- [x] **Edge Function** - `/functions/v1/users` exists with invite/patch

### Resource Strategy

**Important:** This feature uses the existing `sales` resource for data operations, NOT a new `admin/users` resource. The `/admin/users` route is just a URL path - React Admin resource remains `sales`.

---

## Dependency Graph

```
[Phase 1: Foundation] ─────────────────────────────────────────────
     │
     ├── Task 1.1: Zod schemas + types ◄── (no dependencies)
     │
     └── Task 1.2: Edge Function update ◄── (no dependencies)
           │
           └── (can run in parallel with 1.1)

[Phase 2: Data Layer] ─────────────────────────────────────────────
     │
     ├── Task 2.1: Data provider types ◄── depends on 1.1
     │
     └── Task 2.2: Data provider methods ◄── depends on 1.2, 2.1
           │
           └── Task 2.3: Data provider tests ◄── depends on 2.2

[Phase 3: UI Components - PARALLEL GROUP] ─────────────────────────
     │
     ├── Task 3.1: RoleBadgeField ◄── (independent)
     ├── Task 3.2: StatusField ◄── (independent)
     ├── Task 3.3: UserList tests ◄── depends on 2.2
     ├── Task 3.4: UserSlideOver tests ◄── depends on 2.2
     └── Task 3.5: UserInviteForm tests ◄── depends on 2.2
           │
           └── (3.1, 3.2 can run parallel; 3.3-3.5 can run parallel)

[Phase 4: UI Implementation] ──────────────────────────────────────
     │
     ├── Task 4.1: UserList component ◄── depends on 3.1, 3.2, 3.3
     ├── Task 4.2: UserSlideOver component ◄── depends on 3.4
     └── Task 4.3: UserInviteForm component ◄── depends on 3.5
           │
           └── (can run in parallel after tests pass)

[Phase 5: Integration] ────────────────────────────────────────────
     │
     ├── Task 5.0: canAccess update ◄── (CRITICAL, independent)
     ├── Task 5.1: Barrel exports ◄── depends on 4.1, 4.2, 4.3
     ├── Task 5.2: Header navigation ◄── (independent)
     └── Task 5.3: Route setup ◄── depends on 5.0, 5.1
           │
           └── (5.0, 5.1, 5.2 can run parallel)

[Phase 6: E2E Tests] ──────────────────────────────────────────────
     │
     └── Task 6.1: E2E test suite ◄── depends on 5.3
```

---

## Phase 1: Foundation (Parallel)

### Task 1.1: Create Zod Schemas and TypeScript Types

**File:** `src/atomic-crm/admin/users/schemas.ts`

**Prerequisites:** None

**Steps:**
1. Create directory:
   ```bash
   mkdir -p src/atomic-crm/admin/users
   ```

2. Create `src/atomic-crm/admin/users/schemas.ts`:
   ```typescript
   import { z } from 'zod';

   /**
    * User role enum - matches database user_role type
    */
   export const UserRoleEnum = z.enum(['admin', 'manager', 'rep']);
   export type UserRole = z.infer<typeof UserRoleEnum>;

   /**
    * Schema for inviting a new user
    * Validation happens at Edge Function (API boundary), NOT in form
    * This schema is for TypeScript types only
    */
   export const userInviteSchema = z.strictObject({
     email: z.string().email().max(254),
     password: z.string().min(8).max(128),
     first_name: z.string().min(1).max(100),
     last_name: z.string().min(1).max(100),
     role: UserRoleEnum.default('rep'),
   });

   export type UserInvite = z.infer<typeof userInviteSchema>;

   /**
    * Schema for updating an existing user
    */
   export const userUpdateSchema = z.strictObject({
     sales_id: z.coerce.number().int().positive(),
     first_name: z.string().min(1).max(100).optional(),
     last_name: z.string().min(1).max(100).optional(),
     role: UserRoleEnum.optional(),
     disabled: z.coerce.boolean().optional(),
   });

   export type UserUpdate = z.infer<typeof userUpdateSchema>;

   /**
    * Role display configuration for UI
    */
   export const ROLE_CHOICES = [
     { id: 'admin', name: 'Admin' },
     { id: 'manager', name: 'Manager' },
     { id: 'rep', name: 'Rep' },
   ] as const;

   /**
    * Role badge color mapping (semantic tokens)
    */
   export const ROLE_COLORS: Record<UserRole, string> = {
     admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
     manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
     rep: 'bg-muted text-muted-foreground',
   };
   ```

**Verification:**
```bash
npx tsc --noEmit src/atomic-crm/admin/users/schemas.ts
```

**Constitution Checklist:**
- [x] `z.strictObject()` at API boundary
- [x] `.max()` on all strings
- [x] `z.coerce` for non-string inputs
- [x] `z.enum()` for constrained values
- [x] Semantic color tokens (not hardcoded hex)

---

### Task 1.2: Update Edge Function to Support Role Field (Backward Compatible)

**File:** `supabase/functions/users/index.ts`

**Prerequisites:** None

**IMPORTANT:** This change must be backward compatible. Existing clients may still send `administrator` boolean.

**Steps:**
1. Read current Edge Function:
   ```bash
   cat supabase/functions/users/index.ts
   ```

2. Update `inviteUserSchema` to support BOTH `role` AND `administrator` (backward compat):
   ```typescript
   // BEFORE (line ~19-26)
   const inviteUserSchema = z.strictObject({
     email: z.string().email("Invalid email format").max(254, "Email too long"),
     password: z.string().min(8, "Password must be at least 8 characters").max(128, "Password too long"),
     first_name: z.string().min(1, "First name required").max(100, "First name too long"),
     last_name: z.string().min(1, "Last name required").max(100, "Last name too long"),
     disabled: z.coerce.boolean().optional().default(false),
     administrator: z.coerce.boolean().optional().default(false),
   });

   // AFTER - Backward compatible (accepts both role and administrator)
   const inviteUserSchema = z.strictObject({
     email: z.string().email("Invalid email format").max(254, "Email too long"),
     password: z.string().min(8, "Password must be at least 8 characters").max(128, "Password too long"),
     first_name: z.string().min(1, "First name required").max(100, "First name too long"),
     last_name: z.string().min(1, "Last name required").max(100, "Last name too long"),
     disabled: z.coerce.boolean().optional().default(false),
     // NEW: role field (preferred)
     role: z.enum(['admin', 'manager', 'rep']).optional(),
     // DEPRECATED: Keep for backward compatibility
     administrator: z.coerce.boolean().optional(),
   }).transform((data) => {
     // Derive role from administrator if role not provided
     const role = data.role ?? (data.administrator ? 'admin' : 'rep');
     // Strip deprecated administrator field to avoid dual truth sources
     const { administrator: _deprecated, ...rest } = data;
     return { ...rest, role };
   });
   ```

3. Update `patchUserSchema` similarly (backward compatible):
   ```typescript
   // BEFORE (line ~28-36)
   const patchUserSchema = z.strictObject({
     sales_id: z.coerce.number().int().positive("Invalid sales ID"),
     email: z.string().email("Invalid email format").max(254).optional(),
     first_name: z.string().min(1).max(100).optional(),
     last_name: z.string().min(1).max(100).optional(),
     avatar: z.string().url("Invalid avatar URL").max(500).optional(),
     administrator: z.coerce.boolean().optional(),
     disabled: z.coerce.boolean().optional(),
   });

   // AFTER - Backward compatible
   const patchUserSchema = z.strictObject({
     sales_id: z.coerce.number().int().positive("Invalid sales ID"),
     email: z.string().email("Invalid email format").max(254).optional(),
     first_name: z.string().min(1).max(100).optional(),
     last_name: z.string().min(1).max(100).optional(),
     avatar: z.string().url("Invalid avatar URL").max(500).optional(),
     // NEW: role field (preferred)
     role: z.enum(['admin', 'manager', 'rep']).optional(),
     // DEPRECATED: Keep for backward compatibility
     administrator: z.coerce.boolean().optional(),
     disabled: z.coerce.boolean().optional(),
   }).transform((data) => {
     // Derive role from administrator if role not provided but administrator is
     let derivedRole = data.role;
     if (data.role === undefined && data.administrator !== undefined) {
       derivedRole = data.administrator ? 'admin' : 'rep';
     }
     // Strip deprecated administrator field to avoid dual truth sources
     const { administrator: _deprecated, ...rest } = data;
     return { ...rest, role: derivedRole };
   });
   ```

4. Update `updateSaleAdministrator` function to `updateSaleRole`:
   ```typescript
   // BEFORE (line ~76-88)
   async function updateSaleAdministrator(user_id: string, administrator: boolean) {
     const { data: sales, error: salesError } = await supabaseAdmin
       .from("sales")
       .update({ administrator })
       .eq("user_id", user_id)
       .select("*");
     // ...
   }

   // AFTER
   async function updateSaleRole(user_id: string, role: 'admin' | 'manager' | 'rep') {
     const { data: sales, error: salesError } = await supabaseAdmin
       .from("sales")
       .update({ role })
       .eq("user_id", user_id)
       .select("*");

     if (!sales?.length || salesError) {
       console.error("Error updating user role:", salesError);
       throw salesError ?? new Error("Failed to update sale role");
     }
     return sales.at(0);
   }
   ```

5. Update `inviteUser` function call (line ~139-141):
   ```typescript
   // BEFORE
   const { email, password, first_name, last_name, disabled, administrator } = validatedData;
   // ... later ...
   const sale = await updateSaleAdministrator(data.user.id, administrator);

   // AFTER
   const { email, password, first_name, last_name, disabled, role } = validatedData;
   // ... later ...
   const sale = await updateSaleRole(data.user.id, role);
   ```

6. Update `patchUser` function similarly (line ~167, ~215-217):
   ```typescript
   // BEFORE
   const { sales_id, email, first_name, last_name, avatar, administrator, disabled } = validatedData;
   // ... later ...
   const sale = await updateSaleAdministrator(data.user.id, administrator);

   // AFTER
   const { sales_id, email, first_name, last_name, avatar, role, disabled } = validatedData;
   // ... later ...
   if (role) {
     await updateSaleRole(data.user.id, role);
   }
   ```

**Verification:**
```bash
# Deploy to local Supabase
npx supabase functions serve users --env-file supabase/.env.local
# Test with curl (in another terminal)
curl -X POST http://localhost:54321/functions/v1/users \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test1234!","first_name":"Test","last_name":"User","role":"rep"}'
```

**Constitution Checklist:**
- [x] `z.strictObject()` maintained
- [x] `z.enum()` for role (allowlist pattern)
- [x] No retry logic added
- [x] Fail-fast on errors

---

## Phase 2: Data Layer (Sequential)

### Task 2.1: Add Data Provider Types

**File:** `src/atomic-crm/providers/types.ts`

**Prerequisites:** Task 1.1

**Steps:**
1. Read current types file:
   ```bash
   cat src/atomic-crm/providers/types.ts
   ```

2. Add new method types to `CrmDataProvider` interface:
   ```typescript
   import type { UserInvite, UserUpdate } from '../admin/users/schemas';

   export interface CrmDataProvider extends DataProvider {
     // ... existing methods ...
     updatePassword: (userId: Identifier) => Promise<void>;

     // NEW: User management methods
     inviteUser: (data: UserInvite) => Promise<{ data: Sales }>;
     updateUser: (data: UserUpdate) => Promise<{ data: Sales }>;
   }
   ```

**Verification:**
```bash
npx tsc --noEmit src/atomic-crm/providers/types.ts
```

---

### Task 2.2: Implement Data Provider Methods

**File:** `src/atomic-crm/providers/supabase/unifiedDataProvider.ts`

**Prerequisites:** Task 1.2, Task 2.1

**Steps:**
1. Add imports at top of file:
   ```typescript
   import type { UserInvite, UserUpdate } from '../../admin/users/schemas';
   ```

2. Add helper to get auth token:
   ```typescript
   const getAuthToken = async (): Promise<string> => {
     const { data: { session } } = await supabase.auth.getSession();
     if (!session?.access_token) {
       throw new Error('Not authenticated');
     }
     return session.access_token;
   };
   ```

3. Add `inviteUser` method to dataProvider object:
   ```typescript
   inviteUser: async (data: UserInvite) => {
     const token = await getAuthToken();
     const response = await fetch(
       `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/users`,
       {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${token}`,
         },
         body: JSON.stringify(data),
       }
     );

     if (!response.ok) {
       // Handle multiple error formats: { message }, { error: { message } }, or text
       const errorData = await response.json().catch(() => null);
       const message =
         errorData?.message ||
         errorData?.error?.message ||
         `Invite failed (${response.status})`;
       throw new Error(message);
     }

     return response.json();
   },
   ```

4. Add `updateUser` method:
   ```typescript
   updateUser: async (data: UserUpdate) => {
     const token = await getAuthToken();
     const response = await fetch(
       `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/users`,
       {
         method: 'PATCH',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${token}`,
         },
         body: JSON.stringify(data),
       }
     );

     if (!response.ok) {
       // Handle multiple error formats: { message }, { error: { message } }, or text
       const errorData = await response.json().catch(() => null);
       const message =
         errorData?.message ||
         errorData?.error?.message ||
         `Update failed (${response.status})`;
       throw new Error(message);
     }

     return response.json();
   },
   ```

**Verification:**
```bash
npx tsc --noEmit src/atomic-crm/providers/supabase/unifiedDataProvider.ts
```

**Constitution Checklist:**
- [x] Single source of truth (all through dataProvider)
- [x] Fail-fast (throw on error, no retry)
- [x] No direct Supabase imports in components

---

### Task 2.3: Write Data Provider Unit Tests (TDD)

**File:** `src/atomic-crm/providers/supabase/__tests__/userManagement.test.ts`

**Prerequisites:** Task 2.2

**Steps:**
1. Create test file:
   ```typescript
   import { describe, it, expect, vi, beforeEach } from 'vitest';
   import { dataProvider } from '../unifiedDataProvider';

   // Mock fetch
   const mockFetch = vi.fn();
   global.fetch = mockFetch;

   // Mock supabase auth - use correct import path
   vi.mock('@/atomic-crm/providers/supabase/supabase', () => ({
     supabase: {
       auth: {
         getSession: vi.fn().mockResolvedValue({
           data: { session: { access_token: 'test-token' } },
         }),
       },
     },
   }));

   describe('User Management Data Provider', () => {
     beforeEach(() => {
       mockFetch.mockReset();
     });

     describe('inviteUser', () => {
       it('sends POST request to Edge Function with correct payload', async () => {
         mockFetch.mockResolvedValueOnce({
           ok: true,
           json: () => Promise.resolve({ data: { id: 1, email: 'new@test.com' } }),
         });

         const result = await dataProvider.inviteUser({
           email: 'new@test.com',
           password: 'SecurePass123!',
           first_name: 'New',
           last_name: 'User',
           role: 'rep',
         });

         expect(mockFetch).toHaveBeenCalledWith(
           expect.stringContaining('/functions/v1/users'),
           expect.objectContaining({
             method: 'POST',
             headers: expect.objectContaining({
               'Authorization': 'Bearer test-token',
             }),
           })
         );
         expect(result.data.email).toBe('new@test.com');
       });

       it('throws error on failed invite (fail-fast)', async () => {
         mockFetch.mockResolvedValueOnce({
           ok: false,
           json: () => Promise.resolve({ message: 'Email already exists' }),
         });

         await expect(
           dataProvider.inviteUser({
             email: 'existing@test.com',
             password: 'SecurePass123!',
             first_name: 'Test',
             last_name: 'User',
             role: 'rep',
           })
         ).rejects.toThrow('Email already exists');
       });
     });

     describe('updateUser', () => {
       it('sends PATCH request to Edge Function', async () => {
         mockFetch.mockResolvedValueOnce({
           ok: true,
           json: () => Promise.resolve({ data: { id: 1, role: 'manager' } }),
         });

         const result = await dataProvider.updateUser({
           sales_id: 1,
           role: 'manager',
         });

         expect(mockFetch).toHaveBeenCalledWith(
           expect.stringContaining('/functions/v1/users'),
           expect.objectContaining({ method: 'PATCH' })
         );
         expect(result.data.role).toBe('manager');
       });

       it('throws error on failed update (fail-fast)', async () => {
         mockFetch.mockResolvedValueOnce({
           ok: false,
           json: () => Promise.resolve({ message: 'Not authorized' }),
         });

         await expect(
           dataProvider.updateUser({ sales_id: 1, role: 'admin' })
         ).rejects.toThrow('Not authorized');
       });
     });
   });
   ```

**Verification:**
```bash
npm test -- src/atomic-crm/providers/supabase/__tests__/userManagement.test.ts
```

---

## Phase 3: UI Components - Tests First (Parallel Group)

### Task 3.1: Create RoleBadgeField Component

**File:** `src/atomic-crm/admin/users/components/RoleBadgeField.tsx`

**Prerequisites:** Task 1.1

**Steps:**
1. Create components directory:
   ```bash
   mkdir -p src/atomic-crm/admin/users/components
   ```

2. Create `RoleBadgeField.tsx`:
   ```typescript
   import { useRecordContext } from 'react-admin';
   import { Badge } from '@/components/ui/badge';
   import { ROLE_COLORS, type UserRole } from '../schemas';

   interface RoleBadgeFieldProps {
     source?: string;
   }

   export const RoleBadgeField = ({ source = 'role' }: RoleBadgeFieldProps) => {
     const record = useRecordContext();
     if (!record) return null;

     const role = record[source] as UserRole;
     const colorClass = ROLE_COLORS[role] || ROLE_COLORS.rep;

     return (
       <Badge className={colorClass} variant="outline">
         {role.charAt(0).toUpperCase() + role.slice(1)}
       </Badge>
     );
   };

   RoleBadgeField.defaultProps = {
     label: 'Role',
   };
   ```

**Constitution Checklist:**
- [x] Semantic color tokens from ROLE_COLORS
- [x] No hardcoded hex values

---

### Task 3.2: Create StatusField Component

**File:** `src/atomic-crm/admin/users/components/StatusField.tsx`

**Prerequisites:** None

**Steps:**
1. Create `StatusField.tsx`:
   ```typescript
   import { useRecordContext } from 'react-admin';
   import { Badge } from '@/components/ui/badge';

   interface StatusFieldProps {
     source?: string;
   }

   export const StatusField = ({ source = 'disabled' }: StatusFieldProps) => {
     const record = useRecordContext();
     if (!record) return null;

     const isDisabled = record[source];

     return (
       <Badge
         variant={isDisabled ? 'secondary' : 'default'}
         className={
           isDisabled
             ? 'bg-muted text-muted-foreground'
             : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
         }
       >
         {isDisabled ? 'Disabled' : 'Active'}
       </Badge>
     );
   };

   StatusField.defaultProps = {
     label: 'Status',
   };
   ```

---

### Task 3.3: Write UserList Tests (TDD)

**File:** `src/atomic-crm/admin/users/__tests__/UserList.test.tsx`

**Prerequisites:** Task 2.2

**Steps:**
1. Create test directory:
   ```bash
   mkdir -p src/atomic-crm/admin/users/__tests__
   ```

2. Create `UserList.test.tsx`:
   ```typescript
   import { describe, it, expect, vi } from 'vitest';
   import { screen, waitFor } from '@testing-library/react';
   import { renderWithAdminContext } from '@/tests/utils/render-admin';
   import { UserList } from '../UserList';

   const mockUsers = [
     {
       id: 1,
       first_name: 'John',
       last_name: 'Doe',
       email: 'john@mfb.com',
       role: 'admin',
       disabled: false,
       created_at: '2024-01-01',
     },
     {
       id: 2,
       first_name: 'Jane',
       last_name: 'Smith',
       email: 'jane@mfb.com',
       role: 'rep',
       disabled: false,
       created_at: '2024-02-01',
     },
   ];

   describe('UserList', () => {
     it('renders team management heading', async () => {
       renderWithAdminContext(<UserList />, {
         dataProvider: {
           getList: vi.fn().mockResolvedValue({ data: mockUsers, total: 2 }),
         },
       });

       expect(
         await screen.findByRole('heading', { name: /team management/i })
       ).toBeInTheDocument();
     });

     it('displays users in datagrid', async () => {
       renderWithAdminContext(<UserList />, {
         dataProvider: {
           getList: vi.fn().mockResolvedValue({ data: mockUsers, total: 2 }),
         },
       });

       await waitFor(() => {
         expect(screen.getByText('john@mfb.com')).toBeInTheDocument();
         expect(screen.getByText('jane@mfb.com')).toBeInTheDocument();
       });
     });

     it('shows invite button', async () => {
       renderWithAdminContext(<UserList />, {
         dataProvider: {
           getList: vi.fn().mockResolvedValue({ data: mockUsers, total: 2 }),
         },
       });

       expect(
         await screen.findByRole('button', { name: /invite/i })
       ).toBeInTheDocument();
     });

     it('displays role badges with correct styling', async () => {
       renderWithAdminContext(<UserList />, {
         dataProvider: {
           getList: vi.fn().mockResolvedValue({ data: mockUsers, total: 2 }),
         },
       });

       await waitFor(() => {
         expect(screen.getByText('Admin')).toBeInTheDocument();
         expect(screen.getByText('Rep')).toBeInTheDocument();
       });
     });
   });
   ```

**Verification:**
```bash
npm test -- src/atomic-crm/admin/users/__tests__/UserList.test.tsx
# Expected: FAIL (component not implemented yet - TDD)
```

---

### Task 3.4: Write UserSlideOver Tests (TDD)

**File:** `src/atomic-crm/admin/users/__tests__/UserSlideOver.test.tsx`

**Prerequisites:** Task 2.2

**Steps:**
1. Create `UserSlideOver.test.tsx`:
   ```typescript
   import { describe, it, expect, vi } from 'vitest';
   import { screen, waitFor } from '@testing-library/react';
   import userEvent from '@testing-library/user-event';
   import { renderWithAdminContext } from '@/tests/utils/render-admin';
   import { UserSlideOver } from '../UserSlideOver';

   const mockUser = {
     id: 1,
     first_name: 'John',
     last_name: 'Doe',
     email: 'john@mfb.com',
     role: 'rep',
     disabled: false,
   };

   describe('UserSlideOver', () => {
     it('renders edit form with user data', async () => {
       renderWithAdminContext(<UserSlideOver />, {
         dataProvider: {
           getOne: vi.fn().mockResolvedValue({ data: mockUser }),
         },
         route: '/admin/users/1',
       });

       await waitFor(() => {
         expect(screen.getByLabelText(/first name/i)).toHaveValue('John');
         expect(screen.getByLabelText(/last name/i)).toHaveValue('Doe');
       });
     });

     it('displays email as read-only', async () => {
       renderWithAdminContext(<UserSlideOver />, {
         dataProvider: {
           getOne: vi.fn().mockResolvedValue({ data: mockUser }),
         },
       });

       await waitFor(() => {
         const emailInput = screen.getByLabelText(/email/i);
         expect(emailInput).toBeDisabled();
       });
     });

     it('allows role selection', async () => {
       const user = userEvent.setup();
       renderWithAdminContext(<UserSlideOver />, {
         dataProvider: {
           getOne: vi.fn().mockResolvedValue({ data: mockUser }),
         },
       });

       await waitFor(() => {
         expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
       });

       // Verify role options exist
       const roleSelect = screen.getByLabelText(/role/i);
       await user.click(roleSelect);

       expect(screen.getByText('Admin')).toBeInTheDocument();
       expect(screen.getByText('Manager')).toBeInTheDocument();
       expect(screen.getByText('Rep')).toBeInTheDocument();
     });

     it('has disable account toggle', async () => {
       renderWithAdminContext(<UserSlideOver />, {
         dataProvider: {
           getOne: vi.fn().mockResolvedValue({ data: mockUser }),
         },
       });

       await waitFor(() => {
         expect(screen.getByLabelText(/disabled/i)).toBeInTheDocument();
       });
     });
   });
   ```

**Verification:**
```bash
npm test -- src/atomic-crm/admin/users/__tests__/UserSlideOver.test.tsx
# Expected: FAIL (component not implemented yet - TDD)
```

---

### Task 3.5: Write UserInviteForm Tests (TDD)

**File:** `src/atomic-crm/admin/users/__tests__/UserInviteForm.test.tsx`

**Prerequisites:** Task 2.2

**Steps:**
1. Create `UserInviteForm.test.tsx`:
   ```typescript
   import { describe, it, expect, vi } from 'vitest';
   import { screen, waitFor } from '@testing-library/react';
   import userEvent from '@testing-library/user-event';
   import { renderWithAdminContext } from '@/tests/utils/render-admin';
   import { UserInviteForm } from '../UserInviteForm';

   describe('UserInviteForm', () => {
     it('renders all required fields', () => {
       renderWithAdminContext(<UserInviteForm open onClose={vi.fn()} />);

       expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
       expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
       expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
       expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
       expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
     });

     it('defaults role to rep', () => {
       renderWithAdminContext(<UserInviteForm open onClose={vi.fn()} />);

       const roleSelect = screen.getByLabelText(/role/i);
       expect(roleSelect).toHaveValue('rep');
     });

     it('submits form data to inviteUser', async () => {
       const user = userEvent.setup();
       const mockInviteUser = vi.fn().mockResolvedValue({ data: { id: 1 } });
       const mockOnClose = vi.fn();

       renderWithAdminContext(
         <UserInviteForm open onClose={mockOnClose} />,
         {
           dataProvider: {
             inviteUser: mockInviteUser,
           },
         }
       );

       await user.type(screen.getByLabelText(/email/i), 'new@mfb.com');
       await user.type(screen.getByLabelText(/first name/i), 'New');
       await user.type(screen.getByLabelText(/last name/i), 'User');
       await user.type(screen.getByLabelText(/password/i), 'SecurePass123!');

       await user.click(screen.getByRole('button', { name: /invite/i }));

       await waitFor(() => {
         expect(mockInviteUser).toHaveBeenCalledWith(
           expect.objectContaining({
             email: 'new@mfb.com',
             first_name: 'New',
             last_name: 'User',
             role: 'rep',
           })
         );
       });
     });

     it('displays error message on invite failure', async () => {
       const user = userEvent.setup();
       const mockInviteUser = vi.fn().mockRejectedValue(
         new Error('Email already exists')
       );

       renderWithAdminContext(
         <UserInviteForm open onClose={vi.fn()} />,
         {
           dataProvider: {
             inviteUser: mockInviteUser,
           },
         }
       );

       await user.type(screen.getByLabelText(/email/i), 'existing@mfb.com');
       await user.type(screen.getByLabelText(/first name/i), 'Test');
       await user.type(screen.getByLabelText(/last name/i), 'User');
       await user.type(screen.getByLabelText(/password/i), 'SecurePass123!');

       await user.click(screen.getByRole('button', { name: /invite/i }));

       await waitFor(() => {
         expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
       });
     });

     it('closes dialog on cancel', async () => {
       const user = userEvent.setup();
       const mockOnClose = vi.fn();

       renderWithAdminContext(<UserInviteForm open onClose={mockOnClose} />);

       await user.click(screen.getByRole('button', { name: /cancel/i }));

       expect(mockOnClose).toHaveBeenCalled();
     });
   });
   ```

**Verification:**
```bash
npm test -- src/atomic-crm/admin/users/__tests__/UserInviteForm.test.tsx
# Expected: FAIL (component not implemented yet - TDD)
```

---

## Phase 4: UI Implementation (Parallel After Tests)

### Task 4.1: Implement UserList Component

**File:** `src/atomic-crm/admin/users/UserList.tsx`

**Prerequisites:** Task 3.1, 3.2, 3.3

**Steps:**
1. Create `UserList.tsx`:
   ```typescript
   import { useState } from 'react';
   import {
     List,
     Datagrid,
     TextField,
     EmailField,
     DateField,
     useRefresh,
   } from 'react-admin';
   import { UserPlus } from 'lucide-react';
   import { Button } from '@/components/ui/button';
   import { RoleBadgeField } from './components/RoleBadgeField';
   import { StatusField } from './components/StatusField';
   import { UserInviteForm } from './UserInviteForm';

   export const UserList = () => {
     const [inviteOpen, setInviteOpen] = useState(false);
     const refresh = useRefresh();

     const handleInviteSuccess = () => {
       setInviteOpen(false);
       refresh();
     };

     return (
       <>
         <List
           title="Team Management"
           resource="sales"
           actions={
             <Button
               onClick={() => setInviteOpen(true)}
               className="h-11 px-4"
               aria-label="Invite team member"
             >
               <UserPlus className="h-4 w-4 mr-2" />
               Invite
             </Button>
           }
           sort={{ field: 'created_at', order: 'DESC' }}
           perPage={25}
         >
           <Datagrid
             rowClick="edit"
             bulkActionButtons={false}
           >
             <TextField source="first_name" label="First Name" />
             <TextField source="last_name" label="Last Name" />
             <EmailField source="email" />
             <RoleBadgeField source="role" />
             <StatusField source="disabled" />
             <DateField source="created_at" label="Joined" />
           </Datagrid>
         </List>

         <UserInviteForm
           open={inviteOpen}
           onClose={() => setInviteOpen(false)}
           onSuccess={handleInviteSuccess}
         />
       </>
     );
   };
   ```

**Verification:**
```bash
npm test -- src/atomic-crm/admin/users/__tests__/UserList.test.tsx
# Expected: PASS
```

**Constitution Checklist:**
- [x] Touch target 44px (`h-11`)
- [x] Semantic colors (via Badge components)
- [x] No direct Supabase imports

---

### Task 4.2: Implement UserSlideOver Component

**File:** `src/atomic-crm/admin/users/UserSlideOver.tsx`

**Prerequisites:** Task 3.4

**Steps:**
1. Create `UserSlideOver.tsx`:
   ```typescript
   import {
     Edit,
     SimpleForm,
     TextInput,
     SelectInput,
     BooleanInput,
     useNotify,
     useRedirect,
     useDataProvider,
   } from 'react-admin';
   import { useMutation } from '@tanstack/react-query';
   import { ROLE_CHOICES } from './schemas';
   import type { CrmDataProvider } from '../../providers/types';

   export const UserSlideOver = () => {
     const notify = useNotify();
     const redirect = useRedirect();
     const dataProvider = useDataProvider<CrmDataProvider>();

     const { mutate: updateUser } = useMutation({
       mutationFn: async (data: any) => {
         return dataProvider.updateUser({
           sales_id: data.id,
           first_name: data.first_name,
           last_name: data.last_name,
           role: data.role,
           disabled: data.disabled,
         });
       },
       onSuccess: () => {
         notify('User updated successfully');
         redirect('/admin/users');
       },
       onError: (error: Error) => {
         notify(error.message || 'Failed to update user', { type: 'error' });
       },
     });

     const handleSubmit = (data: any) => {
       updateUser(data);
     };

     return (
       <Edit
         title="Edit Team Member"
         resource="sales"
         redirect="/admin/users"
         mutationMode="pessimistic"
       >
         <SimpleForm onSubmit={handleSubmit}>
           <TextInput
             source="first_name"
             label="First Name"
             fullWidth
             required
           />
           <TextInput
             source="last_name"
             label="Last Name"
             fullWidth
             required
           />
           <TextInput
             source="email"
             label="Email"
             fullWidth
             disabled
             helperText="Email cannot be changed"
           />
           <SelectInput
             source="role"
             label="Role"
             choices={ROLE_CHOICES}
             fullWidth
             required
           />
           <BooleanInput
             source="disabled"
             label="Account Disabled"
             helperText="Disabled accounts cannot log in"
           />
         </SimpleForm>
       </Edit>
     );
   };
   ```

**Verification:**
```bash
npm test -- src/atomic-crm/admin/users/__tests__/UserSlideOver.test.tsx
# Expected: PASS
```

---

### Task 4.3: Implement UserInviteForm Component

**File:** `src/atomic-crm/admin/users/UserInviteForm.tsx`

**Prerequisites:** Task 3.5

**Steps:**
1. Create `UserInviteForm.tsx`:
   ```typescript
   import { useState } from 'react';
   import { useDataProvider, useNotify, useRefresh } from 'react-admin';
   import { useMutation } from '@tanstack/react-query';
   import {
     Dialog,
     DialogContent,
     DialogHeader,
     DialogTitle,
     DialogFooter,
   } from '@/components/ui/dialog';
   import { Button } from '@/components/ui/button';
   import { Input } from '@/components/ui/input';
   import { Label } from '@/components/ui/label';
   import {
     Select,
     SelectContent,
     SelectItem,
     SelectTrigger,
     SelectValue,
   } from '@/components/ui/select';
   import { ROLE_CHOICES, type UserInvite, type UserRole } from './schemas';
   import type { CrmDataProvider } from '../../providers/types';

   interface UserInviteFormProps {
     open: boolean;
     onClose: () => void;
     onSuccess?: () => void;
   }

   export const UserInviteForm = ({
     open,
     onClose,
     onSuccess,
   }: UserInviteFormProps) => {
     const dataProvider = useDataProvider<CrmDataProvider>();
     const notify = useNotify();
     const refresh = useRefresh();

     const [formData, setFormData] = useState<Partial<UserInvite>>({
       email: '',
       first_name: '',
       last_name: '',
       password: '',
       role: 'rep',
     });
     const [error, setError] = useState<string | null>(null);

     const { mutate: inviteUser, isPending } = useMutation({
       mutationFn: async (data: UserInvite) => {
         return dataProvider.inviteUser(data);
       },
       onSuccess: () => {
         notify('User invited successfully');
         refresh();
         resetForm();
         onSuccess?.();
         onClose();
       },
       onError: (err: Error) => {
         setError(err.message || 'Failed to invite user');
       },
     });

     const resetForm = () => {
       setFormData({
         email: '',
         first_name: '',
         last_name: '',
         password: '',
         role: 'rep',
       });
       setError(null);
     };

     const handleSubmit = (e: React.FormEvent) => {
       e.preventDefault();
       setError(null);
       inviteUser(formData as UserInvite);
     };

     const handleClose = () => {
       resetForm();
       onClose();
     };

     return (
       <Dialog open={open} onOpenChange={handleClose}>
         <DialogContent className="sm:max-w-[425px]">
           <DialogHeader>
             <DialogTitle>Invite Team Member</DialogTitle>
           </DialogHeader>

           <form onSubmit={handleSubmit} className="space-y-4">
             {error && (
               <div
                 role="alert"
                 className="p-3 text-sm text-destructive bg-destructive/10 rounded-md"
               >
                 {error}
               </div>
             )}

             <div className="space-y-2">
               <Label htmlFor="email">Email</Label>
               <Input
                 id="email"
                 type="email"
                 value={formData.email}
                 onChange={(e) =>
                   setFormData({ ...formData, email: e.target.value })
                 }
                 required
                 aria-invalid={!!error}
               />
             </div>

             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label htmlFor="first_name">First Name</Label>
                 <Input
                   id="first_name"
                   value={formData.first_name}
                   onChange={(e) =>
                     setFormData({ ...formData, first_name: e.target.value })
                   }
                   required
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="last_name">Last Name</Label>
                 <Input
                   id="last_name"
                   value={formData.last_name}
                   onChange={(e) =>
                     setFormData({ ...formData, last_name: e.target.value })
                   }
                   required
                 />
               </div>
             </div>

             <div className="space-y-2">
               <Label htmlFor="password">Temporary Password</Label>
               <Input
                 id="password"
                 type="password"
                 value={formData.password}
                 onChange={(e) =>
                   setFormData({ ...formData, password: e.target.value })
                 }
                 required
                 minLength={8}
               />
             </div>

             <div className="space-y-2">
               <Label htmlFor="role">Role</Label>
               <Select
                 value={formData.role}
                 onValueChange={(value: UserRole) =>
                   setFormData({ ...formData, role: value })
                 }
               >
                 <SelectTrigger id="role">
                   <SelectValue placeholder="Select role" />
                 </SelectTrigger>
                 <SelectContent>
                   {ROLE_CHOICES.map((choice) => (
                     <SelectItem key={choice.id} value={choice.id}>
                       {choice.name}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>

             <DialogFooter>
               <Button
                 type="button"
                 variant="outline"
                 onClick={handleClose}
                 className="h-11"
               >
                 Cancel
               </Button>
               <Button
                 type="submit"
                 disabled={isPending}
                 className="h-11"
               >
                 {isPending ? 'Inviting...' : 'Send Invite'}
               </Button>
             </DialogFooter>
           </form>
         </DialogContent>
       </Dialog>
     );
   };
   ```

**Verification:**
```bash
npm test -- src/atomic-crm/admin/users/__tests__/UserInviteForm.test.tsx
# Expected: PASS
```

**Constitution Checklist:**
- [x] Touch targets 44px (`h-11`)
- [x] `role="alert"` on error message
- [x] `aria-invalid` on input with error
- [x] Semantic color for destructive (`text-destructive`)
- [x] Form mode is onSubmit (not onChange)

---

## Phase 5: Integration (Mixed Parallel/Sequential)

### Task 5.0: Verify canAccess Configuration (No Code Change Needed)

**File:** `src/atomic-crm/providers/commons/canAccess.ts`

**Prerequisites:** None

**Note:** The existing `canAccess` already blocks non-admins from `sales` resource (line 54-57). Since our UserList uses `resource="sales"`, **no code change is required**.

**Steps:**
1. Verify existing behavior by reading `canAccess.ts`:
   ```bash
   grep -A 5 "Sales resource is admin-only" src/atomic-crm/providers/commons/canAccess.ts
   ```
   Expected output shows `sales` is already blocked for non-admins.

2. **No code change needed** - the existing logic handles this.

**Verification:**
- Log in as `manager` → Navigate to `/admin/users` → Should redirect to Access Denied (because UserList uses `resource="sales"`)
- Log in as `rep` → Navigate to `/admin/users` → Should redirect to Access Denied
- Log in as `admin` → Navigate to `/admin/users` → Should show Team Management

**Why No Change:**
The UserList component uses `resource="sales"` which is already admin-only. The `/admin/users` URL path is just routing - React Admin's access control checks the resource name, not the URL.

---

### Task 5.1: Create Module Barrel Export

**File:** `src/atomic-crm/admin/users/index.tsx`

**Prerequisites:** Task 4.1, 4.2, 4.3

**Steps:**
1. Create `index.tsx`:
   ```typescript
   export { UserList } from './UserList';
   export { UserSlideOver } from './UserSlideOver';
   export { UserInviteForm } from './UserInviteForm';
   export { RoleBadgeField } from './components/RoleBadgeField';
   export { StatusField } from './components/StatusField';
   export * from './schemas';
   ```

2. Create admin module barrel `src/atomic-crm/admin/index.tsx`:
   ```typescript
   export * from './users';
   ```

---

### Task 5.2: Add Header Navigation (Parallel with 5.1)

**File:** `src/atomic-crm/layout/Header.tsx`

**Prerequisites:** None (can run parallel)

**Steps:**
1. Read current Header:
   ```bash
   cat src/atomic-crm/layout/Header.tsx
   ```

2. Find the profile dropdown section and add Team Management link:
   ```typescript
   import { Link } from 'react-router-dom';
   import { Users } from 'lucide-react';
   import { useUserRole } from '@/hooks/useUserRole';

   // Inside the Header component, in the profile dropdown:
   const { isAdmin } = useUserRole();

   // Add this menu item (before logout):
   {isAdmin && (
     <DropdownMenuItem asChild>
       <Link to="/admin/users" className="flex items-center gap-2">
         <Users className="h-4 w-4" />
         Team Management
       </Link>
     </DropdownMenuItem>
   )}
   ```

**Verification:**
- Log in as admin user
- Click profile dropdown
- Verify "Team Management" link appears
- Click link → navigates to `/admin/users`

---

### Task 5.3: Register Admin Routes (CustomRoutes, NOT Resource)

**File:** `src/App.tsx` (or main router file)

**Prerequisites:** Task 5.0, Task 5.1

**IMPORTANT:** Use `<CustomRoutes>` NOT `<Resource>`. The UserList/UserSlideOver components internally use `resource="sales"` for data operations. Adding a separate `admin/users` Resource would create confusion and require duplicate data provider handlers.

**Steps:**
1. Import admin components and routing:
   ```typescript
   import { CustomRoutes } from 'react-admin';
   import { Route } from 'react-router-dom';
   import { UserList, UserSlideOver } from './atomic-crm/admin';
   ```

2. Add custom routes (within `<Admin>` component, AFTER Resources):
   ```typescript
   {/* Admin routes - use CustomRoutes, NOT Resource */}
   {/* These components use resource="sales" internally */}
   <CustomRoutes>
     <Route path="/admin/users" element={<UserList />} />
     <Route path="/admin/users/:id" element={<UserSlideOver />} />
   </CustomRoutes>
   ```

3. **Why CustomRoutes instead of Resource:**
   - UserList uses `resource="sales"` → canAccess checks `sales` → admin-only ✅
   - No need for separate `admin/users` data provider handlers
   - No resource naming conflicts
   - URL path `/admin/users` is independent of React Admin resource

**Verification:**
```bash
npm run dev
# Navigate to /admin/users as admin → Should see Team Management page
# Navigate as non-admin → Should redirect to Access Denied (canAccess blocks sales resource)
```

**❌ DO NOT use this pattern:**
```typescript
// WRONG - creates resource naming confusion
<Resource name="admin/users" list={UserList} />
```

---

## Phase 6: E2E Tests (Sequential, Final)

### Task 6.0: Ensure E2E Auth Fixtures Exist

**File:** `tests/e2e/auth.setup.ts`

**Prerequisites:** Task 5.3

**Steps:**
1. Check if rep user fixture exists:
   ```bash
   ls -la tests/e2e/.auth/
   ```

2. If `rep-user.json` doesn't exist, update `tests/e2e/auth.setup.ts` to create it:
   ```typescript
   // Add after admin user setup
   test('authenticate as rep user', async ({ page }) => {
     await page.goto('/login');
     await page.getByLabel('Email').fill(process.env.E2E_REP_EMAIL!);
     await page.getByLabel('Password').fill(process.env.E2E_REP_PASSWORD!);
     await page.getByRole('button', { name: /sign in/i }).click();
     await page.waitForURL('/');

     // Save auth state
     await page.context().storageState({ path: 'tests/e2e/.auth/rep-user.json' });
   });
   ```

3. Add rep credentials to `.env.test`:
   ```env
   E2E_REP_EMAIL=rep@mfb.com
   E2E_REP_PASSWORD=<rep_password>
   ```

4. Run auth setup:
   ```bash
   npx playwright test --project=setup
   ```

**Verification:**
```bash
ls tests/e2e/.auth/rep-user.json  # Should exist
```

---

### Task 6.1: Create E2E Test Suite

**File:** `tests/e2e/specs/admin/user-management.spec.ts`

**Prerequisites:** Task 5.3, Task 6.0

**Steps:**
1. Create test directory:
   ```bash
   mkdir -p tests/e2e/specs/admin
   ```

2. Create `user-management.spec.ts`:
   ```typescript
   import { test, expect } from '@playwright/test';

   test.describe('Admin User Management', () => {
     test.beforeEach(async ({ page }) => {
       // Login as admin (uses auth fixture)
       await page.goto('/');
     });

     test('admin can access team management via profile dropdown', async ({
       page,
     }) => {
       // Open profile dropdown
       await page.getByRole('button', { name: /profile|avatar/i }).click();

       // Click Team Management link
       await page.getByRole('link', { name: /team management/i }).click();

       // Verify navigation
       await expect(page).toHaveURL('/admin/users');
       await expect(
         page.getByRole('heading', { name: /team management/i })
       ).toBeVisible();
     });

     test('admin can view list of team members', async ({ page }) => {
       await page.goto('/admin/users');

       // Verify datagrid is visible
       await expect(page.getByRole('grid')).toBeVisible();

       // Verify columns exist
       await expect(page.getByText('First Name')).toBeVisible();
       await expect(page.getByText('Email')).toBeVisible();
       await expect(page.getByText('Role')).toBeVisible();
     });

     test('admin can invite new team member', async ({ page }) => {
       await page.goto('/admin/users');

       // Click invite button
       await page.getByRole('button', { name: /invite/i }).click();

       // Fill form
       await page.getByLabel('Email').fill('newuser@mfb.com');
       await page.getByLabel('First Name').fill('New');
       await page.getByLabel('Last Name').fill('User');
       await page.getByLabel('Temporary Password').fill('SecurePass123!');

       // Select role
       await page.getByLabel('Role').click();
       await page.getByRole('option', { name: 'Rep' }).click();

       // Submit
       await page.getByRole('button', { name: /send invite/i }).click();

       // Verify success
       await expect(page.getByText(/invited successfully/i)).toBeVisible();
     });

     test('admin can change user role', async ({ page }) => {
       await page.goto('/admin/users');

       // Click on a user row to edit
       await page.getByRole('row').nth(1).click();

       // Wait for slide-over
       await expect(page.getByText('Edit Team Member')).toBeVisible();

       // Change role
       await page.getByLabel('Role').click();
       await page.getByRole('option', { name: 'Manager' }).click();

       // Save
       await page.getByRole('button', { name: /save/i }).click();

       // Verify success
       await expect(page.getByText(/updated successfully/i)).toBeVisible();
     });

     test('admin can disable user account', async ({ page }) => {
       await page.goto('/admin/users');

       // Click on a user row
       await page.getByRole('row').nth(1).click();

       // Toggle disabled
       await page.getByLabel(/disabled/i).click();

       // Save
       await page.getByRole('button', { name: /save/i }).click();

       // Verify status changed
       await expect(page.getByText('Disabled')).toBeVisible();
     });

   });

  // Separate describe block for non-admin tests with different auth
  test.describe('Non-admin access control', () => {
    // Use rep auth fixture instead of admin
    test.use({ storageState: 'tests/e2e/.auth/rep-user.json' });

    test('non-admin cannot access team management', async ({ page }) => {
      await page.goto('/admin/users');

      // Should redirect to access denied page
      await expect(page).toHaveURL(/access-denied|\/$/);
      await expect(
        page.getByRole('heading', { name: /team management/i })
      ).not.toBeVisible();
    });

    test('non-admin does not see Team Management in profile dropdown', async ({
      page,
    }) => {
      await page.goto('/');

      // Open profile dropdown
      await page.getByRole('button', { name: /profile|avatar/i }).click();

      // Team Management link should NOT be visible
      await expect(
        page.getByRole('link', { name: /team management/i })
      ).not.toBeVisible();
    });
   });
   ```

**Verification:**
```bash
npx playwright test tests/e2e/specs/admin/user-management.spec.ts
```

---

## Execution Summary

### Parallel Group 1 (Foundation)
- Task 1.1: Zod schemas ⟷ Task 1.2: Edge Function update

### Sequential Chain 2 (Data Layer)
- Task 2.1 → Task 2.2 → Task 2.3

### Parallel Group 3 (Component Tests - TDD)
- Task 3.1 ⟷ Task 3.2 (independent)
- Task 3.3 ⟷ Task 3.4 ⟷ Task 3.5 (independent, after 2.2)

### Parallel Group 4 (Implementation)
- Task 4.1 ⟷ Task 4.2 ⟷ Task 4.3 (after respective tests pass)

### Mixed Group 5 (Integration)
- Task 5.0 ⟷ Task 5.1 ⟷ Task 5.2 (parallel)
- Task 5.3 (sequential, after 5.0 + 5.1)

### Sequential Final
- Task 6.0: Auth fixtures → Task 6.1: E2E Tests

---

## Total Task Count

| Phase | Tasks | Parallelizable |
|-------|-------|----------------|
| 1. Foundation | 2 | Yes |
| 2. Data Layer | 3 | No (sequential) |
| 3. UI Tests (TDD) | 5 | Yes (3.1-3.2, 3.3-3.5) |
| 4. UI Implementation | 3 | Yes |
| 5. Integration | 4 | Partial (5.0 ⟷ 5.1 ⟷ 5.2) |
| 6. E2E Tests | 2 | No (sequential) |
| **Total** | **19** | |

---

## Estimated Time

With atomic tasks (2-5 min each) and parallel execution:
- **Sequential minimum:** ~45-60 minutes
- **With parallelization:** ~25-35 minutes

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Edge Function breaking change | Backward compatible schema with `.transform()`, strips deprecated `administrator` field |
| Non-admin access to admin routes | Uses `sales` resource which is already admin-only in `canAccess` |
| E2E auth fixture missing | Task 6.0 creates `rep-user.json` fixture |
| Error format inconsistency | Data provider handles `{ message }`, `{ error: { message } }`, and status codes |
| Mock path mismatch | Tests use `@/atomic-crm/providers/supabase/supabase` path |

---

## Open Questions Resolved

| Question | Answer |
|----------|--------|
| Should managers retain access to sales? | No - `sales` is already admin-only per existing `canAccess` |
| Where is role persisted? | `sales.role` column (exists since migration `20251111121526`) |
| Which resource name? | `sales` - the `/admin/users` path is just routing |
