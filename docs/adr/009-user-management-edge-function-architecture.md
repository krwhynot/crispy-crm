# ADR-009: User Management Edge Function Architecture

**Status:** Accepted
**Date:** 2026-03-05
**Deciders:** Engineering team

## Context

The CRM manages users through the `sales` table — a sales rep record IS a user. Creating a new user requires coordinating two systems: Supabase Auth (`auth.users`) and the business profile (`public.sales`). This cannot be done through the standard React Admin composed data provider (ADR-001) because:

1. **Auth user creation requires a service-role key** that must never be exposed to the browser. The `supabaseAdmin.auth.admin.createUser()` call requires elevated privileges unavailable to the anon/user JWT.
2. **The operation is transactional across two systems** — creating an auth user without a corresponding `sales` record (or vice versa) leaves the system in an inconsistent state.
3. **Password management has four distinct flows** (self-service reset, admin reset, forgot-password, set-password) that each require different authorization levels and entry points.
4. **Orphan recovery** — when an auth user exists but their `sales` record was soft-deleted (ADR-002), the system must detect this and restore rather than fail with a duplicate key error.

The standard composed data provider handles CRUD via handler factories (`PRV-001`), but user lifecycle operations are multi-step orchestrations that don't fit the CRUD model.

## Decision

Route all user lifecycle operations through **two purpose-built Supabase Edge Functions** that run with a service-role key on the server, never exposing elevated credentials to the client.

### 1. `supabase/functions/users/index.ts` — User creation (POST) and update (PATCH)

**Creation flow:**

```
Client: SalesCreate.tsx → salesService.salesCreate()
  → dataProvider.invoke("users", { method: "POST", body })
  → edgeFunctionsExtension.invoke() → supabaseClient.functions.invoke("users")

Edge Function:
  1. Verify caller is admin (via JWT + sales table lookup)
  2. Validate payload with Zod (inviteUserSchema)
  3. auth.admin.createUser({ email, password, email_confirm: true })
  4. If email already exists → orphan recovery branch
  5. RPC admin_update_sale() to set role/disabled on sales record
  6. Generate recovery link via GoTrue REST API (for user to set password)
  7. Return { sale, recoveryUrl }
```

**Update flow:**

```
Client: SalesEdit.tsx → salesService.salesUpdate()
  → dataProvider.invoke("users", { method: "PATCH", body })

Edge Function:
  1. Verify caller is admin OR self (via sales_id lookup)
  2. auth.admin.updateUserById() if auth fields changed
  3. RPC admin_update_sale() for profile fields
  4. If soft-delete: ban user (ban_duration: "87600h")
```

### 2. `supabase/functions/updatepassword/index.ts` — Password reset

Two modes, each requiring different authorization:

- **Self-service:** Any authenticated user triggers `auth.resetPasswordForEmail(callerEmail)`
- **Admin reset:** Admin triggers `auth.resetPasswordForEmail(targetEmail)` for another user

### 3. Orphan Recovery Strategy

When `auth.admin.createUser()` returns an "already exists" error:

1. Search `auth.users` with `listUsers({ perPage: 1000 })` to locate the existing auth user by email
2. Check if an active (non-deleted) `sales` record exists for that `user_id`
3. If an active record exists → true duplicate, return HTTP 409
4. If no active record → orphan detected: update auth metadata, call `admin_restore_sale` RPC (UPSERT)
5. Generate a recovery link for the restored user

### 4. Recovery Link Generation

Uses a direct GoTrue REST API call (`POST /auth/v1/admin/generate_link` with `type: "recovery"`) instead of the Supabase SDK's `generateLink()` method. The SDK method does not support the `redirect_to` body parameter, which is required to route users to the custom `/set-password` page (`src/pages/set-password-page.tsx`) instead of Supabase's default redirect.

### 5. Database Enforcement

Two `SECURITY DEFINER` RPCs enforce authorization at the database layer:

- `admin_update_sale(target_sale_id, ...)` — verifies the caller has admin role before updating
- `admin_restore_sale(target_user_id, ...)` — UPSERT that restores soft-deleted or creates new `sales` records

RLS policies on the `sales` table (`CORE-011`):

- `INSERT`: `is_admin()` only
- `UPDATE`: `is_admin() OR user_id = auth.uid()`
- `DELETE`: `is_admin()` only
- `SELECT`: `authenticated AND deleted_at IS NULL`

### 6. Client-Side Wiring

Edge Function calls are composed through four layers:

- `salesExtension.ts` — maps `salesCreate`/`salesUpdate` to the extension interface
- `edgeFunctionsExtension.ts` — provides the `invoke()` method over `supabaseClient.functions.invoke()`
- `customMethodsExtension.ts` — composes extensions onto the data provider
- `sales.service.ts` — service layer that strips computed fields (`CORE-009`), handles HTTP error codes, and maps status codes to React Admin errors

## Consequences

### Positive

- Service-role key is never exposed to the browser — all privileged auth operations run server-side on Deno
- Transactional integrity: if the `sales` record creation fails, the auth user is rolled back via `auth.admin.deleteUser()`
- Orphan recovery handles the soft-delete → re-invite edge case without exposing it as an error to the admin
- Authorization is layered redundantly: frontend (`canAccess`), Edge Function (JWT check), database (RLS + `SECURITY DEFINER`)
- Recovery link flow means admins never know or set user passwords directly

### Negative

- **GoTrue REST API coupling:** The direct `fetch()` to `/auth/v1/admin/generate_link` bypasses the Supabase SDK and is tightly coupled to GoTrue's internal REST API shape. SDK version updates could silently break this call without compile-time warning.
- **Orphan recovery scalability:** `listUsers({ perPage: 1000 })` will silently miss users once `auth.users` exceeds 1,000 rows. The correct approach is to filter by email directly, but the current implementation scans all users.
- **No provider-layer schema enforcement for invocations:** `edgeFunctionSchemas` is currently empty, so the `invoke()` call has no `withValidation` coverage. Validation relies on the form resolver (client) and Edge Function Zod schema (server), with a gap in the provider middleware chain (`PRV-003`).
- **Soft-delete ban is non-blocking:** If `auth.admin.updateUserById(ban_duration)` fails after the `sales` soft-delete succeeds, the user's JWT remains valid until natural expiry. The error is logged but not surfaced to the caller.
- **COALESCE update pattern:** `admin_update_sale` uses `COALESCE(new_value, existing_value)`, meaning fields cannot be explicitly set to `NULL`. Clearing a phone number, for example, is not possible with the current RPC signature.

### Neutral

- The Edge Function pattern is specific to user management — all other resources continue using the standard composed data provider (ADR-001) without change
- Two Edge Functions (`users` and `updatepassword`) rather than one, split by concern: lifecycle vs. password
- `src/pages/set-password-page.tsx` imports Supabase directly (a `CORE-001` deviation), but this is a standalone page outside the feature module boundary and requires the anon key for the unauthenticated password-set flow

## Alternatives Considered

### Option A: Client-Side Auth with anon key

Use `supabase.auth.signUp()` from the browser. Rejected because: (1) `email_confirm: true` requires service-role privileges, (2) role assignment and `sales` record creation cannot be done atomically from the client, (3) exposes auth orchestration logic to the browser where it can be observed and replayed.

### Option B: Database Trigger on `sales` INSERT

Create the auth user via a Postgres trigger when a `sales` row is inserted. Rejected because: (1) Postgres cannot call Supabase Auth's HTTP API directly without `pg_net` or an equivalent extension, (2) error handling and rollback across the auth/DB boundary is impractical in trigger context, (3) recovery link generation requires outbound HTTP calls that belong in an application layer.

### Option C: Server-Side Node Endpoint Alongside the SPA

Add a custom Express/Node server route for user management. Rejected because: (1) the app is a static SPA deployed to Vercel with no server runtime, (2) this would require a separate deployment for user management only, (3) Supabase Edge Functions are already available, co-located with the database, and share the project's service-role credentials securely.

### Option D: Supabase SDK `generateLink()` for Recovery Links

Use the SDK method instead of a direct GoTrue REST API call. Not viable because the SDK's `auth.admin.generateLink()` does not expose the `redirect_to` body parameter, which is required to route users to `src/pages/set-password-page.tsx` instead of the Supabase project default.

## References

- [ADR-001: Supabase Provider Composition Pattern](001-supabase-provider-pattern.md)
- [ADR-002: Soft Delete Convention](002-soft-delete-convention.md)
- [ADR-004: Validation at Provider Boundary](004-validation-at-provider-boundary.md)
- [PRD: User Creation & Password Management](../prd/sales/PRD-user-creation-password-management.md)
- [BRD: Sales](../brd/sales.md)
- `supabase/functions/users/index.ts`
- `supabase/functions/updatepassword/index.ts`
- `src/atomic-crm/providers/supabase/extensions/salesExtension.ts`
- `src/atomic-crm/providers/supabase/extensions/edgeFunctionsExtension.ts`
- `src/atomic-crm/sales/sales.service.ts`
- `.claude/rules/PROVIDER_RULES.md` (PRV-001, PRV-003, PRV-006, PRV-009, PRV-011)
- `.claude/rules/CORE_CONSTRAINTS.md` (CORE-001, CORE-009, CORE-011)
- Supabase Auth Admin API: https://supabase.com/docs/reference/javascript/auth-admin-createuser
- GoTrue generate_link: https://supabase.com/docs/reference/javascript/auth-admin-generatelink
