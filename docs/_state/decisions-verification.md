# Decisions Verification Report

> Automated verification of Architecture Decision Records against actual implementation
> Generated: 2025-12-26

---

## Summary

| Metric | Count |
|--------|-------|
| **Total Decisions** | 10 |
| **Matches** | 7 |
| **Drifted (update doc)** | 2 |
| **Partial Match** | 1 |
| **Not Implemented** | 0 |

### Quick Status

| # | Decision | Status | Action |
|---|----------|--------|--------|
| 1 | Fail-Fast Philosophy | MATCHES | None |
| 2 | Unified Data Provider | MATCHES | None |
| 3 | Zod at API Boundary Only | MATCHES | None |
| 4 | Soft Deletes | MATCHES | None |
| 5 | Organization Type Unification | DRIFTED | Sync DB enum with TypeScript |
| 6 | Junction Tables with Metadata | MATCHES | None |
| 7 | Direct Contact-Org FK | MATCHES | None |
| 8 | RLS Team Collaboration | DRIFTED | Update ADR to reflect shared UPDATE |
| 9 | 44px Touch Targets | MATCHES | None |
| 10 | Semantic Colors Only | PARTIAL | Optional refactor inline styles |

---

## Decision Details

### Decision 1: Fail-Fast Philosophy (Pre-Launch)

**Documented:** NO retry logic, circuit breakers, or graceful fallbacks. Let errors throw immediately.

**Actual:** Strictly implemented with one documented exception (idempotent delete for React Admin undoable mode).

**Status:** MATCHES

**Evidence:**
- Zero retry/circuit breaker patterns found
- 77 files use `throw new Error()` correctly
- All service errors logged then re-thrown (never swallowed)
- Error boundaries provide manual "Try Again" (state reset only, not auto-retry)
- `handleServiceError()` utility enforces throwing via `never` return type
- One documented exception: idempotent delete in `unifiedDataProvider.ts:407-426` with explicit "INTENTIONAL EXCEPTION" comment

**Key Files:**
- `src/atomic-crm/providers/supabase/unifiedDataProvider.ts` - Central error handling
- `src/atomic-crm/services/utils/handleServiceError.ts` - Enforced throwing
- `src/components/ErrorBoundary.tsx` - Manual retry only (state reset)

**Action:** NONE

---

### Decision 2: Unified Data Provider (Single Entry Point)

**Documented:** All database access flows through `unifiedDataProvider.ts`. Never import Supabase directly in components.

**Actual:** Fully implemented. All 356+ component data operations flow through React Admin hooks → data provider.

**Status:** MATCHES

**Evidence:**
- `unifiedDataProvider.ts` exists (1,657 lines) - comprehensive centralized access
- Zero direct Supabase imports in components (excluding provider layer)
- 356 React Admin hook usages (`useGetList`, `useCreate`, `useUpdate`, etc.)
- One documented exception: `useCurrentSale.ts` uses `supabase.auth.getUser()` for auth state only (data still via provider)
- Centralized validation, transformation, error logging, and Sentry integration

**Key Files:**
- `src/atomic-crm/providers/supabase/unifiedDataProvider.ts` - Single entry point
- `src/atomic-crm/root/CRM.tsx:21` - Provider wiring to React Admin

**Action:** NONE

---

### Decision 3: Zod Validation at API Boundary Only

**Documented:** Validate ONLY in provider layer, never in form components. Form defaults from `zodSchema.partial().parse({})`.

**Actual:** Perfectly implemented across all 39 form components.

**Status:** MATCHES

**Evidence:**
- Zero `.parse()` or `.safeParse()` calls in form components
- All validation in `unifiedDataProvider.ts` and `customMethodsExtension.ts`
- 53 instances of `schema.partial().parse({})` for form defaults
- All forms use `onBlur` or `onSubmit` mode (zero `onChange` validation)
- `zodResolver` used only for client-side hints, not persistence validation

**Key Files:**
- `src/atomic-crm/providers/supabase/unifiedDataProvider.ts:295` - API boundary validation
- `src/atomic-crm/contacts/ContactCreate.tsx:39-42` - Schema-driven defaults
- `src/atomic-crm/opportunities/OpportunityCreate.tsx:35-41` - Schema-driven defaults

**Action:** NONE

---

### Decision 4: Soft Deletes via `deleted_at` Timestamp

**Documented:** Use `deleted_at TIMESTAMPTZ` on all tables. RLS policies filter `deleted_at IS NULL`. No `archived_at`.

**Actual:** Fully implemented across 18+ tables with RLS filtering and cascade functions.

**Status:** MATCHES

**Evidence:**
- 18 tables with `deleted_at` column (organizations, contacts, opportunities, activities, tasks, products, sales, junction tables, notes tables)
- 17 SELECT RLS policies with `deleted_at IS NULL` filter
- Zero `archived_at` usage (deprecated pattern eliminated)
- `archive_opportunity_with_relations()` cascade function for 7-table soft delete
- Partial indexes on `deleted_at WHERE deleted_at IS NULL` for performance
- Historical hard DELETEs only in pre-launch data cleanup migrations (documented)

**Key Files:**
- `supabase/migrations/20251129180728_add_soft_delete_rls_filtering.sql` - RLS filtering
- `supabase/migrations/20251221135232_complete_soft_delete_cascade.sql` - Cascade functions
- `supabase/migrations/20251108051154_fix_opportunity_products_soft_delete.sql` - Pattern conversion

**Action:** NONE

---

### Decision 5: Organization Type Unification

**Documented:** Single `organizations` table with `organization_type` enum (`principal`, `distributor`, `operator`, `unknown`). Deprecated `is_principal`/`is_distributor` booleans.

**Actual:** Implemented but enum values diverged between TypeScript and database.

**Status:** DRIFTED

**Evidence:**
- `organization_type` enum exists in database
- Deprecated booleans successfully removed from organizations table
- **DRIFT:** Database enum has 4 values: `customer`, `prospect`, `principal`, `distributor`
- **DRIFT:** TypeScript schema includes 5 values (adds `operator`)
- Decision doc mentions `unknown` but current DB has `customer`, `prospect` instead

**Documented vs Actual:**
| Layer | Values |
|-------|--------|
| **Decision Doc** | principal, distributor, operator, unknown |
| **Database** | customer, prospect, principal, distributor |
| **TypeScript** | customer, prospect, principal, distributor, operator |

**Key Files:**
- `supabase/migrations/20251208122758_remove_partner_unknown_org_types.sql` - Current enum
- `src/atomic-crm/validation/organizations.ts:11` - TypeScript schema
- `src/atomic-crm/organizations/constants.ts:14` - Type definition

**Action:** UPDATE REQUIRED
1. Update `docs/decisions.md` to reflect actual enum values: `customer`, `prospect`, `principal`, `distributor`
2. Either add `operator` to database OR remove from TypeScript schema
3. Remove mention of `unknown` from ADR (no longer exists)

---

### Decision 6: Junction Tables with Metadata

**Documented:** Use junction tables with metadata columns:
- `opportunity_contacts`: role, is_primary, notes
- `organization_distributors`: is_primary, notes
- `distributor_principal_authorizations`: is_authorized, expiration_date, territory_restrictions

**Actual:** All three junction tables exist with documented metadata columns plus additional audit fields.

**Status:** MATCHES

**Evidence:**
- `opportunity_contacts`: id, opportunity_id, contact_id, **role**, **is_primary**, **notes**, created_at, deleted_at
- `organization_distributors`: id, organization_id, distributor_id, **is_primary**, **notes**, created_at, updated_at, created_by, deleted_at
- `distributor_principal_authorizations`: id, distributor_id, principal_id, **is_authorized**, authorization_date, **expiration_date**, **territory_restrictions**, notes, created_at, updated_at, created_by, deleted_at
- All tables have RLS policies, soft-delete support, and Zod schemas

**Key Files:**
- `supabase/migrations/20251028213020_create_opportunity_contacts_junction_table.sql`
- `supabase/migrations/20251207211946_add_organization_distributors.sql`
- `supabase/migrations/20251129050428_add_distributor_principal_authorizations.sql`

**Action:** NONE

---

### Decision 7: Direct Contact-Organization FK (Not Junction)

**Documented:** Dropped `contact_organizations` junction table. Contacts have direct `organization_id` FK. One contact belongs to one organization.

**Actual:** Fully implemented. Junction table dropped, direct FK established with NOT NULL constraint.

**Status:** MATCHES

**Evidence:**
- `contact_organizations` table: DROPPED (migration 20251103220544)
- `contacts.organization_id` column: EXISTS, NOT NULL, indexed
- FK constraint: `contacts_organization_id_fkey → organizations(id) ON DELETE RESTRICT`
- Seed data confirms one-to-one relationship pattern
- No `contact_organizations` type in `database.types.ts`

**Key Files:**
- `supabase/migrations/20251103220544_remove_deprecated_contact_organizations.sql` - Junction dropped
- `supabase/migrations/20251129030358_contact_organization_id_not_null.sql` - NOT NULL + FK
- `src/types/database.types.ts:382-550` - contacts.organization_id type

**Action:** NONE

---

### Decision 8: RLS Security Model (Team Collaboration)

**Documented:**
- Team-based access: All authenticated users can SELECT/INSERT
- Admin-only: UPDATE/DELETE requires `is_admin` check
- RLS filters `deleted_at IS NULL` automatically

**Actual:** SELECT/INSERT match. DELETE partially matches. **UPDATE reverted to shared access.**

**Status:** DRIFTED

**Evidence:**
- SELECT policies: All authenticated users ✓ (with `deleted_at IS NULL`)
- INSERT policies: All authenticated users ✓
- **UPDATE policies:** REVERTED to shared team model (migration 20251129181451)
  - ADR says: admin-only UPDATE
  - Actual: `USING (deleted_at IS NULL) WITH CHECK (true)` - all authenticated can UPDATE
- DELETE policies: Mixed implementation
  - Core tables (contacts, organizations, opportunities): `is_admin()` check ✓
  - Notes tables: `is_manager_or_admin() OR sales_id = current_sales_id()` (creator OR admin)
  - Activities: Creator OR admin can delete

**Timeline of Drift:**
1. Nov 8, 2025: Admin-only UPDATE added (20251108213039)
2. Nov 29, 2025: UPDATE **reverted** to shared model (20251129181451) for team collaboration

**Key Files:**
- `supabase/migrations/20251129181451_add_missing_update_policies.sql` - Reversion
- `supabase/migrations/20251108213039_fix_rls_policies_role_based_access.sql` - Original intent
- `supabase/migrations/20251211180000_fix_is_admin_null_auth.sql` - is_admin() function

**Action:** UPDATE REQUIRED
- Update ADR Decision 8 to reflect actual implementation:
  - SELECT: All authenticated (with deleted_at filter) ✓
  - INSERT: All authenticated ✓
  - UPDATE: **All authenticated** (shared team model, not admin-only)
  - DELETE: Admin-only for core tables, creator-or-admin for notes/activities

---

### Decision 9: 44px Minimum Touch Targets

**Documented:** All interactive elements MUST be 44x44px minimum (`h-11 w-11`). Anti-patterns: `h-8`, `h-9`.

**Actual:** Strongly implemented via Button component system with architectural enforcement.

**Status:** MATCHES

**Evidence:**
- 259 occurrences of `h-11`/`w-11`/`size-11` across 139+ files
- Button component enforces 48px (size-12) for icon buttons - exceeds requirement
- h-8/w-8 usage (50 occurrences): ALL non-interactive (spinners, avatars, skeletons)
- h-9/w-9 usage (29 occurrences): ALL non-interactive (skeleton loaders)
- Zero violations on actual interactive elements
- FilterChip.tsx includes explicit comment: "// 44px button for iPad touch target"

**Key Files:**
- `src/components/ui/button.constants.ts` - `icon: "size-12"` (48px enforcement)
- `src/atomic-crm/filters/FilterChip.tsx` - Documented touch target compliance
- `src/components/NotificationDropdown.tsx` - Icon buttons use h-11 w-11

**Action:** NONE

---

### Decision 10: Semantic Colors Only (No Hardcoded Hex)

**Documented:** Use ONLY Tailwind v4 semantic color tokens. Never hardcode hex, rgb(), or oklch().

**Actual:** Implemented with minor pattern-based exceptions using CSS custom properties.

**Status:** PARTIAL MATCH

**Evidence:**
- Zero hardcoded hex colors in TSX files
- Zero raw Tailwind color classes (`text-gray-500`, `bg-red-500`, etc.)
- CSS custom properties properly defined using oklch() in `:root` (this is correct - token definitions)
- Strong semantic color usage (2600+ semantic class occurrences)
- **5 inline style instances** use dynamic colors, BUT return CSS variable strings:
  ```tsx
  style={{ backgroundColor: getOpportunityStageColor(stage) }}
  // Returns: "var(--info-subtle)", "var(--tag-teal-bg)", etc.
  ```

**Technically Compliant Because:**
- The inline styles return CSS custom property references, not hardcoded values
- Colors still flow through the design system's single source of truth
- This pattern is necessary for dynamic stage-based coloring

**Key Files:**
- `src/index.css` - Design system token definitions (oklch in :root is correct)
- `src/atomic-crm/opportunities/constants/stageConstants.ts` - Returns `var(--*)` strings
- `src/atomic-crm/opportunities/OpportunityRowListView.tsx:214` - Dynamic color application

**Action:** OPTIONAL (not blocking)
- Consider refactoring 5 inline style instances to Tailwind dynamic classes for consistency
- Current implementation is technically compliant (uses CSS variables)

---

## Action Items Summary

### Required Updates

| Priority | Decision | Action |
|----------|----------|--------|
| **HIGH** | Decision 5 | Sync organization_type enum between DB and TypeScript |
| **HIGH** | Decision 8 | Update ADR to document shared UPDATE policy (not admin-only) |
| **LOW** | Decision 10 | Optional: Refactor 5 inline style color applications |

### Files to Update

1. **docs/decisions.md** - Update Decision 5 enum values and Decision 8 UPDATE policy
2. **src/atomic-crm/validation/organizations.ts** OR database migration - Sync enum values
3. **supabase/migrations/** - Consider standardizing DELETE policies to use `is_admin()` consistently

---

## Verification Methodology

Each decision was verified using:
1. **Pattern Search:** `rg` searches for violations and compliance patterns
2. **File Analysis:** Reading actual implementation files
3. **Migration Audit:** Reviewing SQL migrations for database state
4. **Type Verification:** Checking TypeScript types against documented decisions

*This report was generated by parallel verification agents analyzing the Crispy CRM codebase.*
