# Zod Schema Audit Report

**Agent:** 2 - Zod Schema Auditor
**Date:** 2025-12-20
**Schemas Analyzed:** 18 files, 70+ individual schemas

---

## Executive Summary

The Crispy CRM validation layer demonstrates **strong security posture** with widespread use of `z.strictObject()` and comprehensive `.max()` constraints. However, there are **critical security gaps in CSV import schemas** that bypass protections, **missing `.uuid()` validation on ID fields**, and **naming inconsistencies** documented in a TODO. The architecture follows Engineering Constitution principles with single-point validation at API boundaries.

---

## Schema Inventory

| Schema File | Resource | Primary Schemas | strictObject? | Type Exported? |
|-------------|----------|-----------------|---------------|----------------|
| opportunities.ts | opportunities | 6 (base, main, create, update, quick, close) | Yes | Yes |
| contacts.ts | contacts | 6 (base, main, import, organization, create, update) | Partial (import=No) | Yes |
| organizations.ts | organizations | 3 (main, create, update) | Yes | Yes |
| activities.ts | activities | 6 (base, main, engagements, interactions, note, quickLog) | Partial (quickLog=No) | Yes |
| task.ts | tasks | 3 (main, create, update) | Yes | Yes |
| notes.ts | notes | 10 (base + contact/opportunity/organization variants) | Yes | Yes |
| tags.ts | tags | 5 (main, create, update, withCount, filter) | Yes | Yes |
| products.ts | products | 3 (main, update, opportunityProduct) | Yes | Yes |
| categories.ts | categories | 1 (main) | Yes | Yes |
| segments.ts | segments | 4 (main, playbook, create, update) | Yes | Yes |
| operatorSegments.ts | operator_segments | 3 (main, create, update) | Yes | Yes |
| organizationDistributors.ts | organization_distributors | 3 (main, create, update) | Yes | Yes |
| productDistributors.ts | product_distributors | 3 (main, create, update) | Yes | Yes |
| distributorAuthorizations.ts | distributor_authorizations | 6 (org-level + product-level) | Yes | Yes |
| rpc.ts | RPC functions | 10+ parameter schemas | Yes | Yes |
| quickAdd.ts | quick_add | 1 (booth visitor) | Yes | Yes |
| sales.ts | sales/users | 5 (main, create, update, invite, userUpdate) | Yes | Yes |
| constants.ts | (utilities) | 0 (exports VALIDATION_LIMITS) | N/A | Yes |

---

## Security Findings

### P0 - Critical: Mass Assignment Vulnerabilities (z.object instead of z.strictObject)

| Schema | File | Line | Current | Should Be | Risk |
|--------|------|------|---------|-----------|------|
| importContactSchema | contacts.ts | 230 | `z.object()` | `z.strictObject()` | HIGH - CSV imports bypass field whitelisting |
| quickLogFormSchema | activities.ts | 522 | `z.object()` | `z.strictObject()` | MEDIUM - Activity log could accept extra fields |
| specialPricingSchema | distributorAuthorizations.ts | 142 | `z.object().passthrough()` | Review necessity | LOW - Intentional for JSONB flexibility |
| checkAuthorizationResponseSchema | rpc.ts | 90 | `z.object()` | Acceptable | N/A - Response schema, not input |

**Remediation Priority:** P0 - Fix `importContactSchema` and `quickLogFormSchema` before launch.

### P1 - High: Unbounded Strings (missing .max())

| Schema | Field | File | Line | Recommendation |
|--------|-------|------|------|----------------|
| importContactSchema | title | contacts.ts | 319 | Add `.max(100)` |
| importContactSchema | notes | contacts.ts | 323 | Add `.max(5000)` |
| importContactSchema | tags | contacts.ts | 327 | Add `.max(1000)` |
| importContactSchema | first_seen | contacts.ts | 331 | Add `.max(50)` |
| importContactSchema | last_seen | contacts.ts | 335 | Add `.max(50)` |
| importContactSchema | gender | contacts.ts | 339 | Add `.max(50)` |
| importContactSchema | avatar | contacts.ts | 345 | Add `.max(500)` |
| baseActivitiesSchema | description | activities.ts | 76 | Add `.max(5000)` |
| baseActivitiesSchema | follow_up_notes | activities.ts | 93 | Add `.max(2000)` |
| baseActivitiesSchema | outcome | activities.ts | 99 | Add `.max(1000)` |

**Risk:** DoS via memory exhaustion with oversized payloads.

### P2 - Medium: Unvalidated IDs (missing .uuid())

Most ID fields use `z.union([z.string(), z.number()])` for React Admin compatibility. While functional, UUID fields should be validated:

| Schema | Field | File | Current | Should Be |
|--------|-------|------|---------|-----------|
| opportunityBaseSchema | id | opportunities.ts | `z.union([z.string(), z.number()])` | Keep for RA compat |
| organizationSchema | segment_id | organizations.ts | `z.string().uuid()` | Correct |
| segmentSchema | id, parent_id, created_by | segments.ts | `z.string().uuid()` | Correct |
| salesSchema | user_id | sales.ts | `z.string().uuid()` | Correct |

**Note:** BIGINT primary keys (id) correctly use number validation. Only true UUID fields (segment_id, user_id) should validate format.

---

## Consistency Findings

### Naming Convention Violations

The codebase has **three competing validation function naming patterns** (documented in index.ts TODO PAT-01):

| Pattern | Used By | Example |
|---------|---------|---------|
| `validate{Resource}Form` | products, organizations, contacts, opportunities, sales, activities | `validateOpportunityForm()` |
| `validateCreate{Resource}` | distributorAuthorizations, notes, tags, organizations, contacts | `validateCreateContact()` |
| `validate{Resource}ForSubmission` | organizations, segments, operatorSegments, notes, tags | `validateOrganizationForSubmission()` |

**Recommendation:** Standardize to:
- `validate{Resource}` - base/general validation
- `validateCreate{Resource}` - create-specific
- `validateUpdate{Resource}` - update-specific

### File Naming Issue

| Issue | Details |
|-------|---------|
| index.ts exports `./tasks` | File is named `task.ts` (singular) |
| Impact | Potential TypeScript import resolution issues |
| Fix | Rename `task.ts` to `tasks.ts` or update export |

### Snake_case vs camelCase Mismatches

| Schema | Field | Issue |
|--------|-------|-------|
| tagSchema | createdAt, updatedAt | camelCase - DB uses snake_case |
| quickLogFormSchema | activityType, contactId, organizationId, opportunityId, createFollowUp, followUpDate, sampleStatus | camelCase - need transformation |

**Note:** The `quickLogFormSchema` camelCase is intentional for React forms and includes transformation maps (`ACTIVITY_TYPE_TO_API`).

### Duplicated Field Definitions (Should Be Shared)

| Field Pattern | Found In | Recommendation |
|---------------|----------|----------------|
| `created_at`, `updated_at`, `deleted_at` | All entity schemas | Create `baseTimestampsSchema` |
| `created_by` | Most schemas | Include in base timestamps |
| ID validation pattern | All schemas | Create `idSchema` utility |
| Sanitization transform | opportunities, contacts, organizations, activities, notes | Already using `sanitizeHtml()` |

**Positive Finding:** The `VALIDATION_LIMITS` constants in `constants.ts` are well-used across schemas.

---

## Type Export Issues

### All Schemas Export Types Correctly

Every schema properly exports inferred types using:
```typescript
export type ResourceName = z.infer<typeof resourceNameSchema>;
```

No missing type exports found.

### Form Default Compatibility

| Schema | Can Generate Defaults? | Method |
|--------|------------------------|--------|
| taskSchema | Yes | `getTaskDefaultValues()` utility function |
| createTagSchema | Yes | `.default("warm")` on color field |
| productDistributorSchema | Yes | `productDistributorDefaults` exported |
| Most schemas | Yes | Use `.default()` on fields or `schema.partial().parse({})` |

---

## Coverage Gaps

| Resource | Schema Exists? | Used in Provider? | Notes |
|----------|----------------|-------------------|-------|
| opportunities | Yes | Yes | Full CRUD + close flow |
| contacts | Yes | Yes | + CSV import schema |
| organizations | Yes | Yes | Full CRUD |
| activities | Yes | Yes | + engagements/interactions variants |
| tasks | Yes | Yes | File named `task.ts` |
| notes | Yes | Yes | Contact/Opportunity/Organization variants |
| tags | Yes | Yes | + filter schema |
| products | Yes | Yes | + opportunity_products junction |
| sales | Yes | Yes | + invite flow |
| segments | Yes | Yes | Playbook + Operator types |
| distributor_authorizations | Yes | Yes | Org + Product level |
| organization_distributors | Yes | Yes | Junction table |
| product_distributors | Yes | Yes | Junction table with composite key |
| categories | Yes | Yes | Read-only from view |
| RPC functions | Yes | Yes | `RPC_SCHEMAS` registry |

**No coverage gaps identified** - all domain resources have validation schemas.

---

## Prioritized Findings

### P0 - Critical (Security - Fix Before Launch)

1. **Mass Assignment in CSV Import** (`importContactSchema`)
   - File: `contacts.ts:230`
   - Issue: Uses `z.object()` allowing unknown fields
   - Fix: Change to `z.strictObject()`
   - Impact: Attackers could inject arbitrary fields via CSV

2. **Mass Assignment in Quick Log** (`quickLogFormSchema`)
   - File: `activities.ts:522`
   - Issue: Uses `z.object()` allowing unknown fields
   - Fix: Change to `z.strictObject()`

### P1 - High (Fix This Sprint)

1. **Unbounded Strings in Import Schema** (10 fields)
   - File: `contacts.ts:319-345`
   - Issue: CSV import strings lack `.max()` constraints
   - Risk: DoS via oversized payloads

2. **Unbounded Strings in Activities** (3 fields)
   - File: `activities.ts:76,93,99`
   - Issue: description, follow_up_notes, outcome lack limits
   - Risk: Database bloat, memory issues

### P2 - Medium (Technical Debt)

1. **File Naming Mismatch**
   - Issue: `task.ts` vs `./tasks` export
   - Fix: Rename file to `tasks.ts`

2. **Validation Function Naming**
   - Issue: 3 competing patterns (documented TODO PAT-01)
   - Fix: Gradual migration per index.ts plan

3. **Timestamp Field Duplication**
   - Issue: Same fields defined in every schema
   - Fix: Create shared `baseTimestampsSchema`

### P3 - Low (Nice to Have)

1. **camelCase in Tags Schema**
   - Issue: `createdAt`, `updatedAt` vs DB snake_case
   - Impact: May require transformation

---

## Recommendations

### Immediate Actions (P0/P1)

1. **Fix `importContactSchema`** - Change to `z.strictObject()` and add `.max()` to all string fields
2. **Fix `quickLogFormSchema`** - Change to `z.strictObject()`
3. **Add bounds to activities fields** - description, follow_up_notes, outcome need `.max()`

### Short-term (P2)

4. **Rename `task.ts` to `tasks.ts`** - Align with index.ts export
5. **Create `baseTimestampsSchema`** - Reduce duplication across schemas:
   ```typescript
   export const baseTimestampsSchema = z.object({
     created_at: z.string().max(50).optional(),
     updated_at: z.string().max(50).optional(),
     deleted_at: z.string().max(50).optional().nullable(),
   });
   ```

### Long-term (P3)

6. **Standardize validation function naming** - Follow TODO PAT-01 migration plan
7. **Add JSDoc comments** - Document which validation function to use when

---

## Appendix: Schema Security Checklist

Use this checklist for future schema audits:

- [ ] Uses `z.strictObject()` (not `z.object()`)
- [ ] All string fields have `.max()` constraint
- [ ] UUID fields use `.uuid()` validation
- [ ] Type is exported via `z.infer<typeof schema>`
- [ ] Create/Update variants exist where needed
- [ ] Follows naming convention: `{resource}Schema`, `create{Resource}Schema`
- [ ] Registered in `unifiedDataProvider` if applicable
