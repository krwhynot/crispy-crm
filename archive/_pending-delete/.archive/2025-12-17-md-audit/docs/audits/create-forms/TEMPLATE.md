# [Entity]Create Form Audit

**Audit Date:** YYYY-MM-DD
**Git Branch:** `feature/distributor-organization-modeling`
**Git Commit:** `[commit-hash]`
**File Path:** `src/atomic-crm/[entity]/[Entity]Create.tsx`
**Zod Schema:** `src/atomic-crm/validation/[entity].ts`

---

## 1. Form Structure Overview

| Property | Value |
|----------|-------|
| Form Type | `SimpleForm` / `Form` / `CreateBase+Form` / Custom |
| Layout Style | Full-page Card / Centered Card / Modal |
| Number of Tabs | N/A or count |
| Tab Names | List or N/A |
| Collapsible Sections | YES/NO - list which |
| Total Fields | Count |
| Required Fields | Count |
| Optional Fields | Count |
| Loading State | YES/NO - describe |
| Error Summary | YES/NO - component used |
| Tutorial Integration | YES/NO - component name |

---

## 2. Default Values Strategy

| Strategy | Implementation |
|----------|---------------|
| Schema-derived defaults | `schema.partial().parse({})` - YES/NO |
| Identity injection | `identity?.id` for user fields - YES/NO |
| Smart defaults hook | `useSmartDefaults()` - YES/NO |
| Router state pre-fill | `location.state?.record` - YES/NO |
| Async segment lookup | `useGetList('segments')` - YES/NO |

**Code Example:**
```typescript
const formDefaults = {
  ...schema.partial().parse({}),
  // Additional runtime defaults...
};
```

---

## 3. Special Features

| Feature | Present | Implementation |
|---------|---------|----------------|
| Duplicate Detection | YES/NO | Hook name, threshold |
| Transform on Save | YES/NO | What transforms |
| Save & Add Another | YES/NO | Form reset behavior |
| Dirty State Check | YES/NO | Cancel confirmation |
| Hidden Fields | YES/NO | List fields |
| Custom Save Button | YES/NO | Component name |

---

## 4. ASCII Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│ [Page Title / Card Header]                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─ Error Summary (collapsible) ──────────────────────────┐ │
│  │  [FormErrorSummary component]                          │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  [Field Label____________] *required                        │
│  [Helper text below field]                                  │
│                                                             │
│  ┌─────────────────────┐  ┌─────────────────────┐          │
│  │ [Field 1__________] │  │ [Field 2__________] │          │
│  │ (grid-cols-2 layout)│  │                     │          │
│  └─────────────────────┘  └─────────────────────┘          │
│                                                             │
│  [ReferenceInput with Autocomplete______________▼]          │
│                                                             │
│  ┌─ Collapsible Section (if any) ─────────────────────────┐ │
│  │  [Nested fields...]                                    │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ [Cancel]                    [Save & Add Another] [Save]     │
│ (sticky bottom-12 footer)                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Field Inventory

| # | Field Name | Input Type | Required | Default | Validation | Notes |
|---|------------|------------|----------|---------|------------|-------|
| 1 | `name` | TextInput | YES | `''` | `.min(1).max(255)` | |
| 2 | `status` | SelectInput | NO | `'active'` | `.enum()` | |
| ... | ... | ... | ... | ... | ... | ... |

---

## 6. Form Components Used

| Component | Source | Purpose |
|-----------|--------|---------|
| `CreateBase` | `ra-core` | Provides mutation context |
| `Form` | `ra-core` | Form wrapper with RHF integration |
| `SaveButton` | `@/components/admin/form` | Submit button |
| `CancelButton` | `@/components/admin/cancel-button` | Navigation back |
| `FormErrorSummary` | `@/components/admin/FormErrorSummary` | Error display |
| `FormToolbar` | `@/atomic-crm/layout/FormToolbar` | Footer layout |
| ... | ... | ... |

---

## 7. Validation Schema Analysis

**Schema File:** `src/atomic-crm/validation/[entity].ts`

| Rule | Compliant | Notes |
|------|-----------|-------|
| Uses `z.strictObject()` | YES/NO | |
| All strings have `.max()` | YES/NO | Missing: [list] |
| Uses `z.coerce` for non-strings | YES/NO | |
| Uses `z.enum()` for constrained values | YES/NO | |
| API boundary validation only | YES/NO | No form-level |

---

## 8. Accessibility Audit

| Requirement | Compliant | Notes |
|-------------|-----------|-------|
| `aria-invalid` on error fields | YES/NO | |
| `aria-describedby` linking | YES/NO | |
| `role="alert"` on errors | YES/NO | |
| Touch targets 44x44px min | YES/NO | |
| Keyboard navigation | YES/NO | |
| Focus management | YES/NO | |

---

## 9. Design System Compliance

| Rule | Compliant | Issues |
|------|-----------|--------|
| Semantic colors only | YES/NO | [list violations] |
| No hardcoded hex/oklch | YES/NO | |
| `bg-muted` page background | YES/NO | |
| `create-form-card` class | YES/NO | |
| Touch targets h-11 w-11 | YES/NO | |

---

## 10. Identified Issues / Recommendations

### Critical Issues
- [ ] Issue 1 description

### Improvements
- [ ] Improvement 1 description

### Notes for Standardization
- Pattern observation for cross-form consistency

---

## 11. Cross-References

- **Edit Form:** `src/atomic-crm/[entity]/[Entity]Edit.tsx`
- **SlideOver:** `src/atomic-crm/[entity]/[Entity]SlideOver.tsx`
- **Inputs Component:** `src/atomic-crm/[entity]/[Entity]Inputs.tsx`
- **Related Tests:** `src/atomic-crm/[entity]/__tests__/`
