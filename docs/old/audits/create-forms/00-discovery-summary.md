# Create Forms Audit: Discovery Summary

**Audit Date:** 2025-12-15
**Audit Branch:** `feature/distributor-organization-modeling`
**Commit:** `e4b3db1d` (Merge branch 'feature/product-form-refactor')
**Auditor:** Claude Code (Prompt 1 of 4)

---

## 1. Git Repository Analysis

### Branch Selection Rationale

| Branch | Status | Form Changes |
|--------|--------|--------------|
| `main` | Base branch | Baseline |
| `feature/distributor-organization-modeling` | **SELECTED** | 15+ commits ahead, most recent form work |
| `feature/product-form-refactor` | Merged into selected | Product form improvements |
| `feature/organization-form-simplification` | Active | Org form simplification |

**Decision:** Audit conducted on `feature/distributor-organization-modeling` as it contains:
- Merged `feature/product-form-refactor` changes
- Multi-distributor support with DOT# inputs
- Simplified OrganizationCreate form
- Most complete/recent form implementations

### Recent Form-Related Commits

```
e4b3db1d Merge branch 'feature/product-form-refactor'
3e3dcb81 feat(products): add multi-distributor support with DOT# inputs
d2233770 feat(ui): simplify OrganizationCreate form for distributors
f0949021 feat(ui): add forms for distributor modeling
d35c6271 feat(provider): add BIGINT-aware handlers with Zod validation
```

---

## 2. Create Forms Inventory

### Primary Entity Create Forms (10 total)

| # | Entity | File | Form Type | Lines | Validation Schema |
|---|--------|------|-----------|-------|-------------------|
| 1 | **Activity** | `activities/ActivityCreate.tsx` | `CreateBase` + `Form` | 59 | `activities.ts` |
| 2 | **Contact** | `contacts/ContactCreate.tsx` | `CreateBase` + `Form` | 133 | `contacts.ts` |
| 3 | **Note** | `notes/NoteCreate.tsx` | `CreateBase` + `Form` | 120 | `notes.ts` |
| 4 | **Opportunity** | `opportunities/OpportunityCreate.tsx` | `CreateBase` + `Form` | 108 | `opportunities.ts` |
| 5 | **Organization** | `organizations/OrganizationCreate.tsx` | `CreateBase` + `Form` | 273 | `organizations.ts` |
| 6 | **Product** | `products/ProductCreate.tsx` | `CreateBase` + `Form` | 72 | `products.ts` |
| 7 | **ProductDistributor** | `productDistributors/ProductDistributorCreate.tsx` | `Create` + `SimpleForm` | 67 | `productDistributors.ts` |
| 8 | **Sales** | `sales/SalesCreate.tsx` | `SimpleForm` (custom submit) | 69 | `sales.ts` |
| 9 | **Tag** | `tags/TagCreateModal.tsx` | Modal (via `TagDialog`) | 30 | `tags.ts` |
| 10 | **Task** | `tasks/TaskCreate.tsx` | `CreateBase` + `Form` | 195 | `task.ts` |

### Supporting Create Components

| Component | Path | Purpose |
|-----------|------|---------|
| `FloatingCreateButton` | `src/components/admin/FloatingCreateButton.tsx` | FAB for quick creation |
| `OpportunityCreateSaveButton` | `opportunities/components/` | Custom save with duplicate check |
| `DuplicateCheckSaveButton` | In `OrganizationCreate.tsx` | Inline duplicate check |

---

## 3. Form Type Patterns Discovered

### Pattern A: Full CreateBase + Form (Most Common)
```
CreateBase (ra-core) → handles mutation/redirect
  └── Form (ra-core) → wraps react-hook-form
       └── FormContent → inputs + toolbar
```
**Used by:** Activity, Contact, Opportunity, Organization, Product, Task, Note

### Pattern B: SimpleForm (React Admin Standard)
```
Create (react-admin) → combines CreateBase + SimpleForm
  └── SimpleForm → form with built-in toolbar
       └── Inputs directly
```
**Used by:** ProductDistributor

### Pattern C: Custom Submission (Sales)
```
SimpleForm (custom) → with custom onSubmit handler
  └── SalesService mutation (bypasses ra-core)
```
**Used by:** Sales (user creation flow)

### Pattern D: Modal Dialog (Tags)
```
TagDialog → shadcn/ui Dialog
  └── useCreate hook → direct mutation
```
**Used by:** Tag

---

## 4. Default Values Strategies

### Constitution Rule #5 Compliance: "Form State from Schema Truth"

| Form | Schema `.partial().parse({})` | Smart Defaults | Identity Injection | Pre-fill |
|------|------------------------------|----------------|-------------------|----------|
| Activity | YES | NO | `created_by` | NO |
| Contact | YES | YES (`sales_id`) | NO | NO |
| Opportunity | YES | NO | `opportunity_owner_id`, `account_manager_id` | NO |
| Organization | YES | YES (`sales_id`) | NO | `parent_organization_id` from router |
| Product | YES | NO | `created_by` | NO |
| ProductDistributor | NO (inline defaults) | NO | NO | NO |
| Sales | YES | NO | NO | NO |
| Task | YES (via helper) | NO | `sales_id` | NO |
| Note | YES | NO | NO | `[reference]_id` from record |
| Tag | NO (simple form) | NO | NO | NO |

**Observations:**
- 8/10 forms use `schema.partial().parse({})` pattern
- 2 forms use inline/hardcoded defaults (ProductDistributor, Tag)
- `useSmartDefaults()` hook used by Contact and Organization

---

## 5. Special Features Matrix

| Form | Duplicate Check | Save & Add Another | Dirty Check | Tutorial | Transform |
|------|-----------------|-------------------|-------------|----------|-----------|
| Activity | NO | NO | NO | `data-tutorial` | NO |
| Contact | NO | YES | YES | `ContactFormTutorial` | YES (timestamps) |
| Opportunity | YES (fuzzy) | NO | NO | `OpportunityCreateFormTutorial` | NO |
| Organization | YES (exact) | NO | NO | `data-tutorial` | YES (URL prefix) |
| Product | NO | NO | NO | `ProductFormTutorial` | NO |
| ProductDistributor | NO | NO | NO | NO | NO |
| Sales | NO | NO | NO | NO | NO |
| Task | NO | YES | YES | `data-tutorial` | NO |
| Note | NO | NO (auto-resets) | NO | NO | YES (date, FK) |
| Tag | NO | NO | NO | NO | NO |

---

## 6. Validation Schema Inventory

### Files in `src/atomic-crm/validation/`

| Schema File | Size | Exports | Status |
|-------------|------|---------|--------|
| `activities.ts` | 19KB | `activitiesSchema` | Active |
| `contacts.ts` | 20KB | `contactBaseSchema` | Active |
| `notes.ts` | 10KB | `baseNoteSchema` | Active |
| `opportunities.ts` | 22KB | `opportunitySchema` | Active |
| `organizations.ts` | 9KB | `organizationSchema` | Active |
| `products.ts` | 5KB | `productSchema` | Active |
| `productDistributors.ts` | 4KB | (needs verification) | Active |
| `sales.ts` | 8KB | `createSalesSchema` | Active |
| `tags.ts` | 5KB | (needs verification) | Active |
| `task.ts` | 6KB | `getTaskDefaultValues` | Active |

---

## 7. Form Components Used

### React Admin Core
- `CreateBase` - Mutation context provider
- `Form` - RHF integration wrapper
- `Create` - Combined CreateBase + SimpleForm
- `SimpleForm` - Form with built-in save
- `useGetIdentity` - Current user identity
- `useNotify`, `useRedirect` - Notifications and navigation

### Custom Admin Components (`src/components/admin/`)
- `SaveButton` - Styled submit button
- `CancelButton` - Navigation back button
- `FormErrorSummary` - Collapsible error display
- `FormToolbar` - Footer layout component
- `FormLoadingSkeleton` - Loading state
- `TextInput`, `SelectInput`, `AutocompleteInput` - Form inputs
- `ReferenceInput` - Related record lookup

### UI Components (`src/components/ui/`)
- `Card`, `CardContent`, `CardHeader` - Layout containers
- `Button` - Base button component

---

## 8. Layout Patterns

### Pattern A: Full-Page Card (Standard)
```
┌─ bg-muted ─────────────────────────────────┐
│  ┌─ max-w-4xl mx-auto create-form-card ──┐ │
│  │  ┌─ Card ───────────────────────────┐ │ │
│  │  │  CardContent                     │ │ │
│  │  │    FormErrorSummary              │ │ │
│  │  │    *Inputs*                      │ │ │
│  │  │    FormToolbar                   │ │ │
│  │  └──────────────────────────────────┘ │ │
│  └────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```
**Used by:** Contact, Opportunity, Organization, Task

### Pattern B: Centered Card (Narrow)
```
┌─ max-w-lg mx-auto ─────────────────────────┐
│  ┌─ Card ────────────────────────────────┐ │
│  │  CardHeader (title)                   │ │
│  │  CardContent                          │ │
│  │    SimpleForm with inputs             │ │
│  └───────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```
**Used by:** Sales

### Pattern C: Simple Card (No muted bg)
```
┌─ mt-2 flex justify-center ─────────────────┐
│  ┌─ max-w-5xl ──────────────────────────┐  │
│  │  Card with CardContent               │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```
**Used by:** Activity

### Pattern D: Embedded (Note)
- No outer container, renders inline within parent context

### Pattern E: Modal (Tag)
- `TagDialog` component - shadcn Dialog pattern

---

## 9. Inconsistencies Identified

### High Priority (Constitution Violations)

| Issue | Affected Forms | Rule Violated |
|-------|---------------|---------------|
| Missing `z.partial().parse({})` | ProductDistributor, Tag | Constitution #5 |
| Inline defaults instead of schema | ProductDistributor | Constitution #5 |
| Direct `Create` instead of `CreateBase` | ProductDistributor | Pattern consistency |

### Medium Priority (Design System)

| Issue | Affected Forms | Expected |
|-------|---------------|----------|
| No `bg-muted` background | Activity, ProductDistributor, Sales | Full-page pattern |
| No `create-form-card` class | Activity, ProductDistributor, Sales, Note | Consistent styling |
| No FormErrorSummary | ProductDistributor, Tag | Error handling |

### Low Priority (Polish)

| Issue | Affected Forms | Notes |
|-------|---------------|-------|
| No tutorial integration | ProductDistributor, Sales, Note, Tag | Onboarding gaps |
| No dirty state check | Activity, Opportunity, Organization, Product, Note, Tag | Data loss risk |
| No loading skeleton | Activity, Opportunity, Product, ProductDistributor, Task, Note, Tag | UX polish |

---

## 10. Audit Scope for Remaining Prompts

### Prompt 2: Detailed Field Audits (5 forms)
1. OpportunityCreate - Most complex, duplicate detection
2. OrganizationCreate - Parent pre-fill, duplicate detection
3. ContactCreate - Save & Add Another pattern
4. ProductCreate - Simple reference pattern
5. TaskCreate - Multiple input types

### Prompt 3: Detailed Field Audits (5 forms)
1. ActivityCreate - Hidden field pattern
2. SalesCreate - Custom submission flow
3. NoteCreate - Embedded form pattern
4. ProductDistributorCreate - Constitution violations
5. TagCreateModal - Modal pattern

### Prompt 4: Summary & Recommendations
- Cross-form comparison matrix
- Standardization recommendations
- Priority fixes list
- Reference architecture proposal

---

## 11. File References

### Create Forms
```
src/atomic-crm/activities/ActivityCreate.tsx
src/atomic-crm/contacts/ContactCreate.tsx
src/atomic-crm/notes/NoteCreate.tsx
src/atomic-crm/opportunities/OpportunityCreate.tsx
src/atomic-crm/organizations/OrganizationCreate.tsx
src/atomic-crm/products/ProductCreate.tsx
src/atomic-crm/productDistributors/ProductDistributorCreate.tsx
src/atomic-crm/sales/SalesCreate.tsx
src/atomic-crm/tags/TagCreateModal.tsx
src/atomic-crm/tasks/TaskCreate.tsx
```

### Validation Schemas
```
src/atomic-crm/validation/activities.ts
src/atomic-crm/validation/contacts.ts
src/atomic-crm/validation/notes.ts
src/atomic-crm/validation/opportunities.ts
src/atomic-crm/validation/organizations.ts
src/atomic-crm/validation/products.ts
src/atomic-crm/validation/productDistributors.ts
src/atomic-crm/validation/sales.ts
src/atomic-crm/validation/tags.ts
src/atomic-crm/validation/task.ts
```

### Shared Components
```
src/components/admin/form.tsx (SaveButton, FormLoadingSkeleton)
src/components/admin/cancel-button.tsx
src/components/admin/FormErrorSummary.tsx
src/atomic-crm/layout/FormToolbar.tsx
src/components/admin/simple-form.tsx (FormToolbar export)
```

---

**Next Steps:** Proceed to Prompt 2 for detailed field audits of first 5 forms.
