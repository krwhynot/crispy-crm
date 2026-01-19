# Architecture Audit: Forms & Validation Health

We need to audit the application's forms to identify technical debt, security gaps, and UX inconsistencies. Do NOT assume `QuickLogForm` is the only correct model; instead, audit against the following "Gold Standard" criteria.

### 🏆 The Gold Standard (What we are looking for)
1.  **Security (RBAC):** Forms must use `usePermissions` or `CanAccess` to disable/hide fields for unauthorized roles (e.g., Reps shouldn't see "Assign Owner").
2.  **Validation (Layer 3):** Validation schemas must be defined in `src/atomic-crm/validation/` using Zod, not written inline inside the component.
3.  **Composition (Layer 1):** Complex forms (>200 lines) should be broken into sub-sections (e.g., `<ContactGeneralInfo>`, `<ContactAddress>`) rather than one massive file.
4.  **Data Logic (Layer 4):** Forms should use custom hooks (e.g., `useCreateOpportunity`) or React Admin providers, never raw `fetch` calls.
5.  **Accessibility:** Inputs must use standard heights (`h-11`/44px) and have proper `aria-label` or `Label` associations.

---

### 🔍 Execution Steps

Please perform the following 3 analysis steps:

## 1. The Inventory
**Action:** Scan `src` for files containing `SimpleForm`, `TabbedForm`, or `useForm`.
**Goal:** List the top 5 most critical forms (e.g., `OpportunityCreate`, `OrganizationEdit`, `ContactCreate`).
**Exclude:** `QuickLogForm` (we already know its state).

## 2. The Deep Dive (Select 2 Forms)
**Action:** Pick two complex forms from the inventory (e.g., `OpportunityCreateWizard` and `OrganizationEdit`) and analyze them against the Gold Standard.
**Checks:**
* **Security:** search for `usePermissions` or `role` checks. If missing = 🔴 VULNERABLE.
* **Validation:** Search for `z.object`. Is it imported? Or defined inline?
* **Performance:** Does it fetch related data (e.g., `owners`, `tags`) efficiently, or does it download 1000 records?

## 3. The Scorecard
**Action:** Generate a table summarizing the health of the audited forms.

| Form Name | Complexity | Validation Source | Security Check | Accessibility | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **ExampleForm** | 🔴 High (500 loc) | 🟡 Inline | 🔴 Missing | 🟡 Mixed | **Refactor** |
| **[Your Form 1]** | ? | ? | ? | ? | ? |
| **[Your Form 2]** | ? | ? | ? | ? | ? |

**Output Requirement:**
End with a specific recommendation on which form handles **Validation** the best (to use as a future template) and which handles it the worst (priority for refactor).