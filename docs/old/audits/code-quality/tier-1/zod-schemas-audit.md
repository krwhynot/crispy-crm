# Zod Schema Audit Report

**Agent:** 2 - Zod Schema Auditor
**Date:** 2025-12-21 (Updated from 2025-12-20)
**Schemas Analyzed:** 17 files, 50+ schemas
**Status:** Re-verified with fresh analysis

---

## Executive Summary

The Crispy CRM validation layer demonstrates **strong security posture** with consistent use of `z.strictObject()` for mass assignment protection. **Previous P1 findings in `activities.ts` have been FIXED** - all string fields now have proper `.max()` constraints. However, **3 schemas still use `z.object()` instead of `z.strictObject()`**, and the `importContactSchema` string fields in union patterns still lack length limits. The naming convention inconsistency documented in `index.ts` is known technical debt with a migration plan in place.

### Changes Since Last Audit (2025-12-20)
- ✅ `baseActivitiesSchema.description` now has `.max(5000)`
- ✅ `baseActivitiesSchema.follow_up_notes` now has `.max(5000)`
- ✅ `baseActivitiesSchema.outcome` now has `.max(2000)`
- ⚠️ `importContactSchema` and `quickLogFormSchema` still use `z.object()`

---

## Schema Inventory

| Schema File | Resource | Primary Schemas | strictObject? | Type Exported? |
|-------------|----------|-----------------|---------------|----------------|
| opportunities.ts | opportunities | 8 (base, main, create, update, quick, close, stage, priority) | ✅ Yes | ✅ Yes |
| contacts.ts | contacts | 8 (base, main, import, organization, create, update, email, phone) | ⚠️ Partial (import=No) | ✅ Yes |
| organizations.ts | organizations | 4 (main, create, update + 4 enums) | ✅ Yes | ✅ Yes |
| activities.ts | activities | 12 (base, main, engagements, interactions, note, quickLog + transforms) | ⚠️ Partial (quickLog=No) | ✅ Yes |
| task.ts | tasks | 5 (main, create, update + enum + defaults helper) | ✅ Yes | ✅ Yes |
| notes.ts | notes | 10 (base, attachment + contact/opportunity/organization CRUD) | ✅ Yes | ✅ Yes |
| tags.ts | tags | 5 (main, create, update, withCount, filter) | ✅ Yes | ✅ Yes |
| products.ts | products | 3 (main, update, opportunityProduct) | ✅ Yes | ✅ Yes |
| segments.ts | segments | 4 (main, playbook, create, update) | ✅ Yes | ✅ Yes |
| operatorSegments.ts | operator_segments | 4 (main, create, update + enums) | ✅ Yes | ✅ Yes |
| organizationDistributors.ts | organization_distributors | 3 (main, create, update) | ✅ Yes | ✅ Yes |
| productDistributors.ts | product_distributors | 3 (main, create, update) | ✅ Yes | ✅ Yes |
| distributorAuthorizations.ts | distributor_authorizations | 6 (org-level + product-level + specialPricing) | ⚠️ Partial (specialPricing uses passthrough) | ✅ Yes |
| rpc.ts | RPC functions | 10 parameter schemas | ✅ Yes | ✅ Yes |
| quickAdd.ts | quick_add | 1 (booth visitor) | ✅ Yes | ✅ Yes |
| sales.ts | sales/users | 6 (main, create, update, invite, userUpdate + enum) | ✅ Yes | ✅ Yes |
| constants.ts | (utilities) | 0 (exports VALIDATION_LIMITS) | N/A | ✅ Yes |

---

## Security Findings

### P0 - Critical: Mass Assignment Vulnerabilities (z.object instead of z.strictObject)

| Schema | File | Line | Current | Risk | Status |
|--------|------|------|---------|------|--------|
| importContactSchema | contacts.ts | 230 | `z.object()` | HIGH - CSV imports bypass field whitelisting | ⚠️ OPEN |
| quickLogFormSchema | activities.ts | 526 | `z.object()` | MEDIUM - Activity log could accept extra fields | ⚠️ OPEN |
| specialPricingSchema | distributorAuthorizations.ts | 141 | `z.object().passthrough()` | LOW - Intentional for JSONB flexibility | ℹ️ Acceptable |

**Remediation Priority:** Fix `importContactSchema` and `quickLogFormSchema` before launch.

### P1 - High: Unbounded Strings (missing .max())

#### FIXED Since Last Audit ✅
| Schema | Field | File | Status |
|--------|-------|------|--------|
| baseActivitiesSchema | description | activities.ts:76 | ✅ FIXED - has `.max(5000)` |
| baseActivitiesSchema | follow_up_notes | activities.ts:93 | ✅ FIXED - has `.max(5000)` |
| baseActivitiesSchema | outcome | activities.ts:100 | ✅ FIXED - has `.max(2000)` |

#### Still Open ⚠️

| Schema | Field | File | Recommendation |
|--------|-------|------|----------------|
| importContactSchema | title | contacts.ts:319 | Add `.max(100)` to union |
| importContactSchema | notes | contacts.ts:323 | Add `.max(5000)` to union |
| importContactSchema | tags | contacts.ts:327 | Add `.max(1000)` to union |
| importContactSchema | first_seen | contacts.ts:331 | Add `.max(50)` to union |
| importContactSchema | last_seen | contacts.ts:335 | Add `.max(50)` to union |
| importContactSchema | gender | contacts.ts:339 | Add `.max(50)` to union |
| importContactSchema | avatar | contacts.ts:345 | Add `.max(500)` to union |
| contactBaseSchema | tags (array items) | contacts.ts:159 | Add `.max(100)` to array items |

**Risk:** DoS via memory exhaustion with oversized CSV payloads.

### P2 - Medium: ID Validation

All ID fields are properly validated:
- **Numeric IDs (BIGINT):** Use `z.coerce.number().int().positive()` ✅
- **UUID IDs:** Use `z.string().uuid()` where appropriate ✅
- **React Admin compatibility:** Use `z.union([z.string(), z.number()])` for flexibility ✅

| Schema | Field | Validation | Status |
|--------|-------|------------|--------|
| organizationSchema | segment_id | `z.string().uuid()` | ✅ Correct |
| segmentSchema | id, parent_id, created_by | `z.string().uuid()` | ✅ Correct |
| salesSchema | user_id | `z.string().uuid()` | ✅ Correct |
| All BIGINT PKs | id | `z.coerce.number()` | ✅ Correct |

---

## Consistency Findings

### Naming Convention Violations

The codebase has **three competing validation function naming patterns** (documented in index.ts TODO PAT-01):

| Pattern | Used By | Count |
|---------|---------|-------|
| `validate{Resource}Form` | products, organizations, contacts, opportunities, sales, activities | 6 |
| `validateCreate{Resource}` | distributorAuthorizations, notes, tags, organizations, contacts | 5 |
| `validate{Resource}ForSubmission` | organizations, segments, operatorSegments, notes, tags | 5 |

**Status:** Known technical debt with migration plan documented in `index.ts`:
> "Create new validators with standard names, deprecate old ones, migrate gradually."

**Recommended Standard:**
- `validate{Resource}` - base/general validation
- `validateCreate{Resource}` - create-specific
- `validateUpdate{Resource}` - update-specific

### File Naming Issue

| Issue | Details | Status |
|-------|---------|--------|
| index.ts exports `./tasks` | File is named `task.ts` (singular) | ⚠️ OPEN |
| Impact | May cause TypeScript import resolution issues | |
| Fix | Rename `task.ts` to `tasks.ts` or update export | |

### Snake_case vs camelCase Mismatches

| Schema | Field | Issue | Status |
|--------|-------|-------|--------|
| tagSchema | createdAt, updatedAt | camelCase - DB uses snake_case | ⚠️ OPEN |
| quickLogFormSchema | activityType, contactId, etc. | camelCase - intentional for React forms | ℹ️ By Design |

**Note:** The `quickLogFormSchema` camelCase is intentional for React forms and includes transformation maps (`ACTIVITY_TYPE_TO_API`, `ACTIVITY_TYPE_FROM_API`).

### Duplicated Field Definitions (Should Be Shared)

| Field Pattern | Found In | Recommendation |
|---------------|----------|----------------|
| `created_at`, `updated_at`, `deleted_at` | 12+ schemas | Create `auditTimestampsSchema` |
| `created_by` | 8+ schemas | Include in audit timestamps |
| `z.union([z.string(), z.number()])` for ID | 10+ schemas | Create `raIdSchema` utility |

**Positive Finding:** The `VALIDATION_LIMITS` constants in `constants.ts` are consistently used across schemas.

---

## Type Export Issues

### All Schemas Export Types Correctly ✅

Every schema properly exports inferred types using:
```typescript
export type ResourceName = z.infer<typeof resourceNameSchema>;
```

No missing type exports found.

### Form Default Compatibility

| Schema | Can Generate Defaults? | Method |
|--------|------------------------|--------|
| taskSchema | ✅ Yes | `getTaskDefaultValues()` utility function |
| createTagSchema | ✅ Yes | `.default("warm")` on color field |
| productDistributorSchema | ✅ Yes | `productDistributorDefaults` exported |
| opportunitySchema | ✅ Yes | Defaults for stage, priority, estimated_close_date |
| organizationSchema | ✅ Yes | Defaults for type, priority, status |
| activitiesSchema | ✅ Yes | Defaults for activity_type, type, date |
| All others | ✅ Yes | Support `schema.partial().parse({})` |

---

## Coverage Gaps

| Resource | Schema Exists? | Used in Provider? | Notes |
|----------|----------------|-------------------|-------|
| opportunities | ✅ Yes | ✅ Yes | Full CRUD + close flow |
| contacts | ✅ Yes | ✅ Yes | + CSV import schema |
| organizations | ✅ Yes | ✅ Yes | Full CRUD |
| activities | ✅ Yes | ✅ Yes | + engagements/interactions variants |
| tasks | ✅ Yes | ✅ Yes | File named `task.ts` |
| notes | ✅ Yes | ✅ Yes | Contact/Opportunity/Organization variants |
| tags | ✅ Yes | ✅ Yes | + filter schema |
| products | ✅ Yes | ✅ Yes | + opportunity_products junction |
| sales | ✅ Yes | ✅ Yes | + invite flow |
| segments | ✅ Yes | ✅ Yes | Playbook + Operator types |
| distributor_authorizations | ✅ Yes | ✅ Yes | Org + Product level |
| organization_distributors | ✅ Yes | ✅ Yes | Junction table |
| product_distributors | ✅ Yes | ✅ Yes | Junction table with composite key |
| RPC functions | ✅ Yes | ✅ Yes | `RPC_SCHEMAS` registry |

**No coverage gaps identified** - all domain resources have validation schemas.

---

## Prioritized Findings

### P0 - Critical (Security - Fix Before Launch)

1. **[SEC-001] Mass Assignment in CSV Import** (`importContactSchema`)
   - File: `contacts.ts:230`
   - Issue: Uses `z.object()` allowing unknown fields
   - Fix: Change to `z.strictObject()`
   - Impact: Attackers could inject arbitrary fields via CSV

2. **[SEC-002] Mass Assignment in Quick Log** (`quickLogFormSchema`)
   - File: `activities.ts:526`
   - Issue: Uses `z.object()` allowing unknown fields
   - Fix: Change to `z.strictObject()`

### P1 - High (Fix This Sprint)

1. **[SEC-003] Unbounded Strings in Import Schema** (7 fields)
   - File: `contacts.ts:319-345`
   - Issue: CSV import strings in unions lack `.max()` constraints
   - Risk: DoS via oversized payloads

2. **[SEC-004] Unbounded Tags Array Items**
   - File: `contacts.ts:159`
   - Issue: `tags: z.array(z.string()).default([])` - items lack `.max()`
   - Fix: Change to `z.array(z.string().max(100)).default([])`

### P2 - Medium (Technical Debt)

1. **[CON-001] File Naming Mismatch**
   - Issue: `task.ts` vs `./tasks` export in index.ts
   - Fix: Rename file to `tasks.ts`

2. **[CON-002] Validation Function Naming**
   - Issue: 3 competing patterns (documented TODO PAT-01)
   - Fix: Gradual migration per index.ts plan

3. **[CON-003] Timestamp Field Duplication**
   - Issue: Same fields defined in every schema
   - Fix: Create shared `auditTimestampsSchema`

4. **[CON-004] tagSchema camelCase timestamps**
   - Issue: `createdAt`, `updatedAt` vs DB snake_case
   - Fix: Change to `created_at`, `updated_at`

### P3 - Low (Nice to Have)

1. **[DOC-001] specialPricingSchema.passthrough() undocumented**
   - Issue: Intentional but lacks explanatory comment
   - Fix: Add comment explaining JSONB flexibility requirement

---

## Recommendations

### Immediate Actions (P0/P1)

1. **Fix `importContactSchema`** - Change to `z.strictObject()` and add `.max()` to all string fields in unions:
   ```typescript
   title: z.union([z.literal(""), z.literal(null), z.undefined(), z.string().max(100)]).optional().nullable(),
   ```

2. **Fix `quickLogFormSchema`** - Change to `z.strictObject()`

3. **Fix `contactBaseSchema.tags`** - Add length limit to array items:
   ```typescript
   tags: z.array(z.string().max(100)).default([]),
   ```

### Short-term (P2)

4. **Rename `task.ts` to `tasks.ts`** - Align with index.ts export

5. **Create `auditTimestampsSchema`** - Reduce duplication:
   ```typescript
   // src/atomic-crm/validation/shared.ts
   export const auditTimestampsSchema = z.object({
     created_at: z.string().max(VALIDATION_LIMITS.TIMESTAMP_MAX).optional(),
     updated_at: z.string().max(VALIDATION_LIMITS.TIMESTAMP_MAX).optional(),
     deleted_at: z.string().max(VALIDATION_LIMITS.TIMESTAMP_MAX).optional().nullable(),
     created_by: z.coerce.number().optional().nullable(),
   });
   ```

6. **Fix tagSchema timestamps** - Change to snake_case

### Long-term (P3)

7. **Standardize validation function naming** - Follow TODO PAT-01 migration plan
8. **Document passthrough usage** - Add comment to `specialPricingSchema`

---

## Metrics Summary

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Schemas using strictObject | 47/50 (94%) | 100% | ⚠️ |
| String fields with .max() | 95%+ | 100% | ⚠️ |
| Type exports present | 100% | 100% | ✅ |
| Resource coverage | 100% | 100% | ✅ |
| Form default support | 100% | 100% | ✅ |
| P1 issues fixed since last audit | 3/3 | - | ✅ |

---

## Appendix: Schema Security Checklist

Use this checklist for future schema audits:

- [ ] Uses `z.strictObject()` (not `z.object()`)
- [ ] All string fields have `.max()` constraint
- [ ] Array string items have `.max()` constraint
- [ ] UUID fields use `.uuid()` validation
- [ ] Type is exported via `z.infer<typeof schema>`
- [ ] Create/Update variants exist where needed
- [ ] Follows naming convention: `{resource}Schema`, `create{Resource}Schema`
- [ ] Registered in `unifiedDataProvider` if applicable
- [ ] Uses `VALIDATION_LIMITS` constants where applicable

---

## Appendix: Schema File Summary

| File | Schemas | Lines | Purpose |
|------|---------|-------|---------|
| opportunities.ts | 8 | 696 | Opportunity lifecycle validation |
| contacts.ts | 8 | 614 | Contact + CSV import validation |
| organizations.ts | 4 | 245 | Organization CRUD validation |
| activities.ts | 12 | 578 | Activity/Engagement/Interaction validation |
| task.ts | 5 | 148 | Task CRUD validation |
| notes.ts | 9 | 337 | Notes for contacts/opportunities/orgs |
| tags.ts | 5 | 198 | Tag CRUD validation |
| products.ts | 3 | 151 | Product + opportunity_products |
| sales.ts | 6 | 210 | User/Sales management |
| segments.ts | 4 | 198 | Playbook categories |
| operatorSegments.ts | 4 | 482 | Operator segment hierarchy |
| organizationDistributors.ts | 3 | 127 | Org-Distributor junction |
| productDistributors.ts | 3 | 130 | Product-Distributor junction |
| distributorAuthorizations.ts | 6 | 258 | Auth at org + product level |
| quickAdd.ts | 1 | 53 | Trade show quick-add |
| constants.ts | 0 | 60 | Validation limits |
| rpc.ts | 10 | 168 | RPC function params |

**Total: 87 exports across 17 files**
