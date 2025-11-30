# Schema Consolidation Opportunities Audit

**Date:** 2025-11-29
**PRD Version:** v1.18
**Auditor:** Claude (Opus 4.5)

## Executive Summary

Analysis of the codebase reveals **significant type duplication** between manual interfaces in `types.ts` and Zod schemas in `validation/*.ts`. The pattern debt is highest at API boundaries where `any` types are used in validation functions.

## Risk Classification

| Priority | Category | Count | Risk Level |
|----------|----------|-------|------------|
| P0 | API boundary `any` types | 39 | 🔴 Critical |
| P1 | Duplicate type definitions | 12 | 🟠 High |
| P2 | Manual types without schemas | 8 | 🟡 Medium |
| P3 | Test-only `any` types | 50+ | 🟢 Low |

---

## P0: API Boundary `any` Types (Critical)

These `any` types at validation function boundaries allow **invalid data to bypass validation**.

### validation/activities.ts (9 instances)
```typescript
// Lines 293, 319, 324, 329, 355, 360, 365, 391, 396
export async function validateActivitiesForm(data: any): Promise<void>
export async function validateCreateActivities(data: any): Promise<void>
// ... etc
```
**Impact:** Invalid activity data could be written to database
**Remediation:** Change `data: any` to `data: unknown` and use Zod parse

### validation/opportunities.ts (4 instances)
```typescript
// Lines 166, 350, 369, 392
export async function validateOpportunityForm(data: any): Promise<void>
```
**Impact:** Opportunity validation can be bypassed
**Remediation:** Use `data: unknown` with schema parse

### validation/contacts.ts (6 instances)
```typescript
// Lines 126, 165, 321, 326, 419, 449, 469
function transformContactData(data: any)
data.email.forEach((entry: any, index: number) => ...
```
**Impact:** Email array validation vulnerable to malformed data
**Remediation:** Type email entries with schema inference

### validation/organizations.ts (3 instances)
```typescript
// Lines 96, 142, 161
export async function validateOrganizationForSubmission(data: any): Promise<void>
```

### validation/sales.ts (3 instances)
```typescript
// Lines 42, 86, 105
export async function validateSalesForm(data: any): Promise<void>
```

### validation/products.ts (2 instances)
```typescript
// Lines 69, 106
export async function validateProductForm(data: any): Promise<void>
```

### services/*.ts (12 instances)
```typescript
// sales.service.ts: lines 14, 49, 104, 146
// digest.service.ts: lines 176, 212, 252, 297, 326
// opportunities.service.ts: lines 55, 76, 122, 181, 203, 226
```
**Impact:** Service layer accepts unvalidated data from API
**Remediation:** Add input schemas at service boundaries

---

## P1: Duplicate Type Definitions (High)

Manual interfaces in `types.ts` that duplicate Zod schema types:

| Manual Type | Zod Type | Location |
|-------------|----------|----------|
| `Contact` (interface) | `Contact` (z.infer) | types.ts:85 vs validation/contacts.ts:315 |
| `Opportunity` (interface) | `Opportunity` (z.infer) | types.ts:208 vs validation/opportunities.ts:162 |
| `Task` (interface) | `Task` (z.infer) | types.ts:289 vs validation/task.ts:77 |
| `Tag` (interface) | `Tag` (z.infer) | types.ts:284 vs validation/tags.ts:108 |
| `ContactNote` (interface) | `ContactNote` (z.infer) | types.ts:185 vs validation/notes.ts:111 |
| `OpportunityNote` (interface) | `OpportunityNote` (z.infer) | types.ts:259 vs validation/notes.ts:112 |
| `OrganizationNote` (interface) | `OrganizationNote` (z.infer) | types.ts:271 vs validation/notes.ts:113 |
| `ActivityRecord` | `Activities` | types.ts:147 vs validation/activities.ts:283 |

**Risk:** Type drift between manual interfaces and schemas
**Recommendation:**
1. Move to single source of truth (Zod schemas)
2. Re-export types from validation modules
3. Keep UI-specific extensions (e.g., computed fields) as interfaces extending base types

### Good Pattern (Already in place)
```typescript
// types.ts:60 - Organization properly imports from validation
export type { Organization } from "./validation/organizations";
```

---

## P2: Manual Types Without Schemas (Medium)

Types defined without corresponding Zod validation:

| Type | Location | Needs Schema? |
|------|----------|---------------|
| `SalesFormData` | types.ts:25 | Yes - form validation |
| `Sale` | types.ts:35 | Yes - API boundary |
| `EmailAndType` | types.ts:75 | Already in contacts schema |
| `PhoneNumberAndType` | types.ts:80 | Already in contacts schema |
| `OpportunityParticipant` | types.ts:116 | Yes - junction table |
| `OpportunityContact` | types.ts:134 | Yes - junction table |
| `InteractionParticipant` | types.ts:175 | Yes - junction table |
| `LeadSource` | types.ts:198 | Enum - add to opportunities schema |

---

## P3: Test-Only `any` Types (Low)

**50+ instances** in test files using `any` for mocking. These are lower priority but should be addressed for type safety:

### High-volume files
- `organizations/__tests__/AuthorizationsTab.test.tsx` (12 instances)
- `organizations/__tests__/OrganizationList.test.tsx` (10 instances)
- `organizations/OrganizationImportDialog.tsx` (8 instances)

**Recommendation:** Create test utility types like `MockRecord<T>` for consistent mocking.

---

## Modules with Good Schema Patterns ✅

These modules already follow best practices:

| Module | Schema File | Pattern |
|--------|-------------|---------|
| Tags | validation/tags.ts | Full Zod + inference |
| Segments | validation/segments.ts | Full Zod + inference |
| Notes | validation/notes.ts | Full Zod + inference |
| RPC | validation/rpc.ts | Full Zod + inference |
| Tasks | validation/task.ts | Full Zod + inference |
| Distributor Auth | validation/distributorAuthorizations.ts | Full Zod + inference |

---

## Recommended Remediation Order

### Phase 1: Critical API Boundaries (1-2 days)
1. Change all `data: any` to `data: unknown` in validation functions
2. Add explicit Zod parse at function entry
3. Return typed results

### Phase 2: Type Consolidation (2-3 days)
1. Remove duplicate type definitions from `types.ts`
2. Re-export from validation modules
3. Create extension interfaces for computed fields

### Phase 3: Service Layer (1-2 days)
1. Add input schemas to service functions
2. Use Zod inference for return types

### Phase 4: Test Types (ongoing)
1. Create `src/tests/types.ts` with mock utilities
2. Replace `any` with typed mocks

---

## Metrics

| Metric | Current | Target |
|--------|---------|--------|
| API boundary `any` types | 39 | 0 |
| Duplicate type definitions | 12 | 2 (UI extensions) |
| Manual types without schemas | 8 | 0 |
| Schema files with proper inference | 10/14 | 14/14 |

---

## Appendix: Files to Modify

### High Priority (P0)
- `src/atomic-crm/validation/activities.ts`
- `src/atomic-crm/validation/opportunities.ts`
- `src/atomic-crm/validation/contacts.ts`
- `src/atomic-crm/validation/organizations.ts`
- `src/atomic-crm/validation/sales.ts`
- `src/atomic-crm/validation/products.ts`
- `src/atomic-crm/services/sales.service.ts`
- `src/atomic-crm/services/opportunities.service.ts`

### Medium Priority (P1)
- `src/atomic-crm/types.ts` (consolidation)
- `src/atomic-crm/dashboard/v3/types.ts` ✅ (completed)

### Low Priority (P3)
- All `__tests__` directories (type safety improvement)

---

*This audit follows Engineering Constitution principles: Single Source of Truth, Fail Fast, Form State from Schema*
