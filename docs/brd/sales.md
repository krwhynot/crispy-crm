# BRD: Sales

**Status:** Reverse-Engineered | **Last Updated:** 2026-03-03 | **Source:** Zod schemas, handler logic, service layer, UI components

---

## 1. Domain Overview

The Sales domain manages internal CRM users — the account managers and representatives who operate the system. A "sales" record is a CRM user profile that maps 1:1 to a Supabase Auth account. Every contact, opportunity, and activity in the system is owned by a sales user via foreign key relationships.

**Business role:** Control who has access to the CRM, what role they hold (Admin / Manager / Rep), and maintain a stable roster of account managers for attribution and reporting. Disabling a user preserves all historical data they created. [INFERRED]

---

## 2. Schema Fields

### Core Identity

| Field | Type | Constraints | Required (Create) |
|-------|------|-------------|-------------------|
| `id` | number or string | max 50 chars if string | No (auto) |
| `first_name` | string | trim, min 1, max 100 | Yes |
| `last_name` | string | trim, min 1, max 100 | Yes |
| `email` | string | trim, valid email, max 254 | Yes |
| `phone` | string | trim, max 50 | No |
| `avatar_url` | string | valid URL, max 2048 | No |
| `user_id` | UUID | FK to Supabase Auth | No (set by Edge Function) |

Source: `src/atomic-crm/validation/sales.ts` — `salesSchema`

### Role and Permissions

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `role` | enum | `admin`, `manager`, `rep` | Default: `rep` |
| `is_admin` | boolean | coerce | Deprecated — synced from role via DB trigger |
| `administrator` | boolean | computed | Read-only computed column; stripped before writes |
| `disabled` | boolean | coerce | Default: `false`; soft-disable instead of delete |

Source: `src/atomic-crm/validation/sales.ts` — `UserRoleEnum`, `salesSchema`

### Preferences and Notifications

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `digest_opt_in` | boolean | coerce | Default: `true`; controls email digest from Edge Function |
| `timezone` | string | regex `/^[A-Za-z]+\/[A-Za-z_]+$/`, max 50 | Default: `America/Chicago` |
| `password` | string | min 8, max 72 | Create-only; not stored in `sales` table |

Source: `src/atomic-crm/validation/sales.ts` — `salesSchema`

### System Fields

| Field | Type | Notes |
|-------|------|-------|
| `created_at` / `updated_at` | string | DB-managed timestamps |
| `deleted_at` | string (nullable) | Soft delete marker |

### Computed (View-Only, Stripped Before Write)

`administrator` — derived from `role` via database trigger.

Source: `src/atomic-crm/providers/supabase/callbacks/salesCallbacks.ts` — `COMPUTED_FIELDS`

---

## 3. Business Rules

1. **Name required on create** — `first_name` and `last_name` are required fields on the create form. Source: `src/atomic-crm/validation/sales.ts` — `createSalesSchema`.
2. **Email required and unique** — `email` must be a valid email address; duplicate emails are rejected by the Edge Function (HTTP 409). Source: `src/atomic-crm/services/sales.service.ts`.
3. **Role defaults to Rep** — New users are created with `role: "rep"` unless explicitly overridden. Source: `src/atomic-crm/validation/sales.ts` — `UserRoleEnum.default("rep")`.
4. **Password minimum 8 characters** — Applies at creation time only; the password is not stored in the `sales` table. Source: `src/atomic-crm/validation/sales.ts` — `salesSchema.password`.
5. **Soft disable, no hard delete** — Deleting a sales record sets `disabled: true` (and optionally `deleted_at`) rather than physically removing the row. Historical attribution data is preserved. Source: `src/atomic-crm/providers/supabase/callbacks/salesCallbacks.ts` — `supportsSoftDelete: true`.
6. **Writes are admin-only (RLS)** — Read operations are available to all authenticated users. Create and update operations are restricted to Admin-role users and are routed through an Edge Function to bypass RLS restrictions. Source: `src/atomic-crm/providers/supabase/handlers/salesHandler.ts`, `src/atomic-crm/services/sales.service.ts`.
7. **Updates go through Edge Function** — `salesUpdate()` calls the `users` Edge Function via `PATCH`. Direct table writes are not used for updates. Source: `src/atomic-crm/services/sales.service.ts` — `salesUpdate()`.
8. **User creation uses recovery link flow** — Admin provides name, email, and role. The Edge Function creates the Supabase Auth user with a random password and returns a recovery URL for the admin to share. Source: `src/atomic-crm/services/sales.service.ts` — `salesCreate()`, code comment on `createSalesSchema`.
9. **Computed fields stripped before write** — `administrator` is removed before any save operation. Source: `src/atomic-crm/providers/supabase/callbacks/salesCallbacks.ts` — `COMPUTED_FIELDS`.
10. **Timezone defaults to America/Chicago** — Reflects the business's primary operating timezone. [INFERRED] Source: `src/atomic-crm/validation/sales.ts` — `salesSchema.timezone.default`.
11. **Digest opt-in defaults to true** — New users are automatically enrolled in email digests generated by the Supabase Edge Function. Source: `src/atomic-crm/validation/sales.ts` — `salesSchema.digest_opt_in.default`.

---

## 4. Enums

- **`UserRole`**: `"admin"` | `"manager"` | `"rep"`
  - `admin` — Full access; can manage users and all data.
  - `manager` — Access to all data; cannot manage users. [INFERRED]
  - `rep` — Access to own data only. [INFERRED]

Source: `src/atomic-crm/validation/sales.ts` — `UserRoleEnum`

---

## 5. CRUD Operations

| Operation | Handler Pattern | Notes |
|-----------|----------------|-------|
| List | `sales` base table | Read available to all authenticated users |
| GetOne | `sales` base table | Read available to all authenticated users |
| Create | Edge Function (`users` POST) | Returns sale record + recovery URL |
| Update | Edge Function (`users` PATCH) | Routed via `SalesService.salesUpdate()` |
| Delete | Soft disable | Sets `disabled: true`; row is preserved |

**Wrapper chain:** `customHandler → withValidation → withSkipDelete → withLifecycleCallbacks → withErrorLogging`

Source: `src/atomic-crm/providers/supabase/handlers/salesHandler.ts`

### Password Operations

| Operation | Edge Function | Notes |
|-----------|--------------|-------|
| Self-service reset | `updatepassword` PATCH with `sales_id` | Sends reset email to the authenticated caller |
| Admin reset | `updatepassword` PATCH with `target_email` | Admin-only; Supabase sends recovery email to target |

Source: `src/atomic-crm/services/sales.service.ts`

---

## 6. UI Views

- **SalesList** — Datagrid showing name, email, role badge, and disabled status.
- **SalesCreate** — Form collecting first name, last name, email, and role. Returns recovery link on success.
- **SalesEdit** — Tabbed form: General Info tab, Profile tab, Permissions tab.
- **SalesShow** — Read-only view of a sales user record.
- **SalesSlideOver** — 40vw slide-over panel for quick viewing from list context.
- **SalesGeneralTab** — Profile fields (name, email, phone, avatar).
- **SalesPermissionsTab** — Role selection and disabled toggle.

Source: `docs/audit/baseline/feature-inventory.json` — `feat-sal-001.entry_points`

---

## 7. Related Entities

| Relationship | Type | Entity | Notes |
|-------------|------|--------|-------|
| `sales_id` FK on contacts | 1:N | contacts | Primary account manager |
| `secondary_sales_id` FK on contacts | 1:N | contacts | Secondary account manager |
| `sales_id` FK on opportunities | 1:N | opportunities | Opportunity owner |
| `sales_id` FK on activities | 1:N | activities | Activity logger |
| `sales_id` FK on tasks | 1:N | tasks | Task assignee |
| Supabase Auth | 1:1 | auth.users | Linked via `user_id` UUID |

---

## 8. Integration Dependencies

| Integration | Protocol | Notes |
|-------------|----------|-------|
| Supabase Auth | Edge Function (`users`) | User creation and role management bypass RLS via service role |
| `updatepassword` Edge Function | Edge Function (PATCH) | Self-service and admin-initiated password reset |
| Digest Edge Function | Scheduled/Triggered | Reads `digest_opt_in` and `timezone` to control email notification delivery |

Source: `src/atomic-crm/services/sales.service.ts`

---

## 9. Open Questions

- Should Managers be able to invite new Reps, or is user creation restricted to Admins only?
- Is there a maximum number of active sales users enforced (licensing or seat limit)?
- Should a disabled user's data be reassigned to another rep automatically, or left as orphaned attribution?
- Is the `timezone` field used only for digest scheduling, or does it also affect date display in the UI?
- Should the recovery link flow display the link inline in the UI, or send it via email?
