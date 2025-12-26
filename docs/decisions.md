# Architecture Decisions

> Consolidated from implementation plans, audits, and project history
> Last Updated: 2025-12

---

## Key Decisions

### 1. Fail-Fast Philosophy (Pre-Launch)

**Date:** 2024-10 (Project inception)
**Context:** Building an MVP CRM to replace Excel spreadsheets for MFB, a small food distribution broker. Need to move fast while catching issues early.

**Decision:** NO retry logic, circuit breakers, or graceful fallbacks. Let errors throw immediately and surface loudly.

**Rationale:**
- Velocity over resilience during pre-launch phase
- Silent failures are worse than crashes—they hide bugs
- Small user base (6 account managers) means quick communication of issues
- Easier debugging when errors surface at point of failure

**Consequences:**
- **Enables:** Fast development, immediate bug detection, simpler code
- **Prevents:** Masking underlying issues, stale data from failed retries
- **Trade-off:** Must revisit post-launch when user base grows

**Source:** Engineering Constitution, Test Architecture

---

### 2. Unified Data Provider (Single Entry Point)

**Date:** 2024-10
**Context:** React Admin requires a data provider. Need consistent validation, security, and data transformation across all DB operations.

**Decision:** All database access flows through ONE file: `src/atomic-crm/providers/supabase/unifiedDataProvider.ts`. Never import Supabase client directly in components.

**Rationale:**
- Single source of truth for data operations
- Centralized Zod validation at API boundary
- Consistent error handling and logging
- Easier to audit security and add cross-cutting concerns
- Prevents scattered Supabase imports across 400+ components

**Consequences:**
- **Enables:** Consistent validation, centralized security, easy mocking in tests
- **Prevents:** Direct DB manipulation in components, scattered validation logic
- **Trade-off:** All changes to data layer require modifying one critical file

**Source:** CLAUDE.md Engineering Principles

---

### 3. Zod Validation at API Boundary Only

**Date:** 2024-11
**Context:** Form validation was being duplicated—once in forms, once at API boundary. Type mismatches emerged (e.g., "operator" type in DB but not in Zod schema).

**Decision:**
- Validate ONLY in `unifiedDataProvider.ts`, never in form components
- Form defaults come from `zodSchema.partial().parse({})`
- Forms submit raw data; validation happens at provider layer

**Rationale:**
- Single source of truth for validation rules
- Eliminates duplication and type drift between form/API validation
- Form defaults automatically align with schema
- Security validation (`.max()`, `.strictObject()`) in one place

**Consequences:**
- **Enables:** Consistent validation, schema-driven form defaults, security guarantees
- **Prevents:** Form-level validation duplication, type mismatches
- **Trade-off:** Form errors surface on submit, not on field blur (acceptable for speed)

**Source:** Organizations Architecture Audit (P0 finding: "operator" type mismatch)

---

### 4. Soft Deletes via `deleted_at` Timestamp

**Date:** 2024-10
**Context:** Need ability to recover accidentally deleted records. Audit trail requirements.

**Decision:** Use `deleted_at TIMESTAMPTZ` column on all tables instead of hard deletes. RLS policies filter `WHERE deleted_at IS NULL`.

**Rationale:**
- Data recovery without backup restoration
- Audit trail preserved for deleted records
- Referential integrity maintained (FKs don't break)
- Consistent pattern across all entities

**Consequences:**
- **Enables:** Data recovery, audit history, cascade handling
- **Prevents:** Accidental permanent data loss
- **Trade-off:** Database size grows over time, must periodically purge old soft-deleted records

**Deprecated Pattern:** Never use `archived_at`—use `deleted_at` for consistency.

**Source:** Data Model documentation, Migration history

---

### 5. Organization Type Unification

**Date:** 2024-10
**Context:** MFB's business model has Principals (manufacturers), Distributors, and Operators (restaurants). Originally considered separate tables.

**Decision:** Single `organizations` table with `organization_type` enum (`principal`, `distributor`, `operator`, `unknown`). Different behaviors via type-specific logic, not separate tables.

**Rationale:**
- Reduces table proliferation (would have been 3+ tables)
- Enables flexible relationships (org can have multiple types in future)
- Same CRUD UI with type-specific conditional rendering
- Principal → Distributor authorizations use same table for both ends

**Consequences:**
- **Enables:** Unified search, simpler relationships, type conversion
- **Prevents:** Table sprawl, duplicate CRUD logic
- **Trade-off:** More complex queries when filtering by type

**Deprecated Pattern:** `is_principal`, `is_distributor` boolean columns are deprecated—use `organization_type` enum only.

**Source:** Organizations Architecture Audit, Data Model

---

### 6. Junction Tables with Metadata

**Date:** 2024-10
**Context:** Complex relationships between entities (Opportunity ↔ Contact, Organization ↔ Distributor, Distributor ↔ Principal).

**Decision:** Use explicit junction tables with additional metadata columns:
- `opportunity_contacts`: role, is_primary, notes
- `organization_distributors`: is_primary, notes
- `distributor_principal_authorizations`: is_authorized, expiration_date, territory_restrictions

**Rationale:**
- Relationships carry context (roles, primary flags, dates)
- Historical tracking (when was authorization granted?)
- Flexible cardinality changes without schema migration
- Can store relationship-specific notes

**Consequences:**
- **Enables:** Rich relationship metadata, audit trails, flexible queries
- **Prevents:** Losing context on who/why/when for relationships
- **Trade-off:** More tables, slightly more complex queries

**Source:** Data Model, Entity Relationship Diagram

---

### 7. Direct Contact-Organization FK (Not Junction)

**Date:** 2024-11
**Context:** Originally had `contact_organizations` junction table allowing M:N contact-org relationships.

**Decision:** Dropped junction table. Contacts now have direct `organization_id` FK. One contact belongs to one organization.

**Rationale:**
- MVP simplification—contacts at MFB typically work for one company
- Simpler queries and UI
- Junction table added complexity without clear use case
- Can re-add later if multi-org contacts needed

**Consequences:**
- **Enables:** Simpler queries, cleaner forms
- **Prevents:** Multi-organization contacts (acceptable for MVP)
- **Trade-off:** Migration needed if requirement changes

**Source:** Data Model "Dropped Tables" section (`contact_organizations` dropped in migration 20251103220544)

---

### 8. RLS Security Model (Team Collaboration)

**Date:** 2024-10
**Context:** Multi-user CRM with 6 account managers. Need data protection without row-level ownership complexity.

**Decision:**
- Team-based access: All authenticated users can SELECT/INSERT
- Admin-only: UPDATE/DELETE requires `is_admin` check
- RLS policies filter `deleted_at IS NULL` automatically
- No row-level ownership for core entities

**Rationale:**
- Small team, high trust environment
- Collaborative workflow—reps need to see each other's data
- Simpler than per-user row ownership
- Admin gate for destructive operations

**Consequences:**
- **Enables:** Team collaboration, shared pipeline visibility
- **Prevents:** Reps modifying/deleting each other's records
- **Trade-off:** No privacy between reps (acceptable for MFB workflow)

**Source:** Organizations Architecture Audit (RLS Security Assessment)

---

### 9. 44px Minimum Touch Targets

**Date:** 2024-12
**Context:** UI/UX audit found 42 touch target violations. iPad is primary device for field sales.

**Decision:** All interactive elements MUST be 44x44px minimum (`h-11 w-11`). Use Tailwind classes, not pixel values.

**Rationale:**
- WCAG 2.1 AA compliance
- iPad field sales critical use case
- Consistent touch experience
- Prevent frustration for users on tablets

**Consequences:**
- **Enables:** Accessible touch interface, iPad-friendly
- **Prevents:** Tiny buttons, frustrating mobile experience
- **Trade-off:** Larger UI elements, less information density

**Anti-patterns:** `h-8 w-8` (32px), `h-9 w-9` (36px) on interactive elements

**Source:** UI/UX Final Audit Report (93 violations found, 45% were touch targets)

---

### 10. Semantic Colors Only (No Hardcoded Hex)

**Date:** 2024-11
**Context:** Multiple developers using different color values. Theme support needed for light/dark mode.

**Decision:** Use ONLY Tailwind v4 semantic color tokens. Never hardcode hex, rgb(), or oklch() values.

| Correct | Incorrect |
|---------|-----------|
| `text-muted-foreground` | `text-gray-500` |
| `bg-primary` | `bg-green-600` |
| `text-destructive` | `text-red-500` |
| `bg-card` | `#ffffff` |

**Rationale:**
- Theme consistency across components
- Easy dark mode support
- Single source of truth for colors
- Prevents designer/developer drift

**Consequences:**
- **Enables:** Theming, dark mode, consistent branding
- **Prevents:** Color inconsistencies, hardcoded values
- **Trade-off:** Must know semantic token names

**Source:** CLAUDE.md Design System, UI/UX Audit

---

## Lessons Learned

### What Worked Well

#### Parallel Agent Audits
- 12-agent UI/UX audit found 93 violations (vs 47 in single pass)
- Cross-validation between agents caught false positives
- Specialized agents (forms, navigation, edge cases) found domain-specific issues
- **Pattern:** Use multiple focused auditors, then synthesize findings

#### Pre-Computed Discovery Files
- Component/hook/schema inventories saved exploration time
- `docs/_state/` files auto-generated and CI-enforced
- **Pattern:** Invest in codebase discovery tooling early

#### Junction Tables with Metadata
- Relationship context (roles, is_primary, notes) proved invaluable
- Authorization tracking with expiration dates caught business logic bugs
- **Pattern:** Always add metadata columns to junction tables

#### Single Data Provider Entry Point
- Centralized validation caught type mismatches immediately
- Easy to mock in tests (one interface to implement)
- Security review required only one file
- **Pattern:** Funnel all external access through one point

#### Fail-Fast Testing Philosophy
- Tests surface errors immediately, no silent failures
- 2,852 automated tests catch regressions quickly
- Constitution compliance tested automatically
- **Pattern:** Make failures loud and visible

---

### What to Avoid

#### Type Mismatches Between Layers
**Problem:** Database allowed 5 organization types, Zod schema only allowed 4. "operator" type passed UI but failed at API boundary.
**Lesson:** Sync enums across DB migrations, TypeScript types, and Zod schemas. Add automated tests comparing them.

#### Form-Level Validation Duplication
**Problem:** Validation in forms AND data provider led to drift and maintenance burden.
**Lesson:** Validate once, at API boundary. Use schema defaults for form initialization.

#### Deprecated Boolean Columns
**Problem:** `is_principal` and `is_distributor` booleans remained after `organization_type` enum added. Confusion about which to use.
**Lesson:** Remove deprecated columns in same migration that adds replacement. Don't leave both.

#### Direct Supabase Imports
**Problem:** Early code imported Supabase client directly in components, bypassing data provider.
**Lesson:** Lint rule to prevent direct imports. All DB access through provider.

#### Non-Standard Z-Index Values
**Problem:** Arbitrary `z-[9999]` and `z-[1]` values caused stacking context issues.
**Lesson:** Use design system scale (z-10, z-20, z-50, z-[100]) only. Add lint rule.

#### Mobile-First Breakpoints on Desktop-First Product
**Problem:** Shadcn components use `sm:` breakpoints (mobile-first), but product is desktop-first (1440px+).
**Lesson:** Customize component breakpoints for actual viewport priority. Test on primary device first.

#### Silent State Losses
**Problem:** `isPending && fetchError` condition caused error state to be silently dropped.
**Lesson:** Handle all state combinations explicitly. Never use `&&` that can lose secondary state.

---

## Implementation Plan Template

> Use this structure for detailed implementation plans. See `docs/archive/plans/` for examples.

```markdown
# Implementation Plan: [Feature Name]

**Created:** YYYY-MM-DD
**Type:** Feature | Bug Fix | Refactor | Performance
**Scope:** Frontend | Backend | Full Stack
**Execution:** Sequential | Parallel groups

---

## Summary

[1-2 paragraph overview of what this implements and why]

### User Requirements

| Requirement | Answer | Implementation |
|-------------|--------|----------------|
| [User need] | [Solution] | [Technical approach] |

### Industry Standard Reference

[Link to relevant industry pattern if applicable]

---

## Parallel Execution Groups

```
┌─────────────────────────────────────────────────────────┐
│ GROUP A (Independent)     GROUP B (Independent)         │
│ Task 1: [description]     Task 2: [description]         │
│                                                          │
│ ─────────────────── DEPENDENCY BARRIER ───────────────  │
│                                                          │
│ GROUP C (Depends on A and B)                            │
│ Task 3: [description]                                   │
└─────────────────────────────────────────────────────────┘
```

---

## TASK N: [Task Title]

**Parallel Group:** A/B/C
**Estimated Time:** X min/hours
**Dependencies:** None | Task X

### Context for Agent

[Background information needed to implement this task autonomously]

### Files to Modify

1. `path/to/file.tsx` - [what changes]
2. `path/to/file.ts` - [what changes]

### Implementation Steps

#### Step N.1: [Step Title]

**File:** `path/to/file.tsx`

```tsx
// BEFORE (around line X-Y)
[existing code]

// AFTER
[new code]
```

#### Step N.2: [Step Title]

[Continue with detailed steps...]

### Verification

```bash
# Commands to verify the task is complete
npm run dev
# Navigate to http://localhost:5173/#/[route]
# Verify [behavior]
```

### Constitution Checklist

- [ ] No direct Supabase imports (uses data provider)
- [ ] Semantic colors only (no hardcoded hex)
- [ ] Touch targets 44px minimum
- [ ] Accessibility: aria labels, focus management
- [ ] Fail-fast: no retry logic or silent fallbacks

---

## Test Plan

### Unit Tests

**File:** `path/to/__tests__/Component.test.tsx`

```tsx
describe("Component", () => {
  it("does expected behavior", () => {
    // Test implementation
  });
});
```

---

## Files Summary

### Modified Files
| File | Task |
|------|------|
| `path/to/file.tsx` | 1, 2 |

### New Files
| File | Task |
|------|------|
| `path/to/new-file.tsx` | 3 |

---

## Execution Order

```
PARALLEL GROUP A/B (can run simultaneously):
├── Agent 1: Task 1
└── Agent 2: Task 2

SEQUENTIAL GROUP C (after A/B complete):
└── Task 3

OPTIONAL (after user validation):
└── Task 4 (enhancement)
```
```

---

## Related Documentation

| Document | Purpose |
|----------|---------|
| `docs/architecture/data-model.md` | Complete entity reference |
| `docs/architecture/rls-policies.md` | Security policies |
| `docs/testing/test-architecture.md` | Testing patterns |
| `docs/archive/audits/ui-ux/FINAL-AUDIT-REPORT.md` | UI/UX standards |
| `CLAUDE.md` | Engineering constitution |

---

*This document consolidates decisions from 200+ migrations, 450+ components, and multiple architectural audits.*
