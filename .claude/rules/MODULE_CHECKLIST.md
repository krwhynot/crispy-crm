Here is the **Module Standardization Checklist** for your Feature Layer (Tier 3). This checklist enforces the **Three-Tier Component** architecture and ensures your frontend code matches the new Data Provider standards.

You can save this as `MODULE_CHECKLIST.md` or paste it into a PR template.

---

# 🧹 Feature Module Standardization Checklist

> **Goal:** Ensure `contacts`, `opportunities`, and other feature modules follow the 3-Tier Architecture and Data Provider rules.

### 1. File Structure (Rule #6)

*Enforces consistent navigation for developers.*

* [ ] **Standard Filenames:** Does the folder match this exact structure?
* `index.tsx` (Exports the Resource definition)
* `[Entity]List.tsx`
* `[Entity]Create.tsx`
* `[Entity]Edit.tsx`
* `[Entity]Show.tsx`
* `[Entity]Inputs.tsx` (Shared form inputs)


* [ ] **No "Utils" Folder:** Are helper functions moved to `src/lib/` or `src/utils/`? (Keep features flat).
* [ ] **No "Components" Folder:** Are sub-components defined in the same file (if small) or moved to `src/components/` (if generic)?

### 2. Data Access (Rule #5)

*Enforces the "Single Source of Truth" bridge.*

* [ ] **No Direct Supabase:** Search for `import ... from '@supabase/...'`. **Delete it.**
* *Fix:* Use `useDataProvider()`, `useGetList()`, or `useGetOne()` from React Admin.


* [ ] **Read from Views:** Does the `List` component fetch from the `_summary` view (if applicable) to get computed stats?
* [ ] **Write to Base:** Do `Create`/`Edit` components target the base table resource? (Handled by the Data Provider Router automatically, but verify the resource name passes correctly).

### 3. Form Architecture

*Enforces the "Zod at Boundary" rule.*

* [ ] **Validation Mode:** Is the form set to `mode="onSubmit"` or `mode="onBlur"`?
* *Why:* Prevents aggressive validation errors while typing; lets Zod handle it at the end.


* [ ] **No Inline Validation:** Are extensive `validate={...}` functions removed from inputs?
* *Fix:* Rely on the `ValidationService` in the Data Provider layer.


* [ ] **Input Separation:** Are form inputs defined in `[Entity]Inputs.tsx`?
* *Why:* Allows reuse between `Create` and `Edit` forms without code duplication.



### 4. Component Tiers (Rule #4)

*Enforces the standard UI hierarchy.*

* [ ] **Tier 1 Check (Base):** Does this module import *raw* shadcn components (e.g., `Button`) and manually wire them?
* *Fix:* It should import Tier 2 Admin wrappers (e.g., `SaveButton`, `TextInput`) whenever possible.


* [ ] **Tier 2 Check (Admin):** Are we using standard React Admin inputs (`TextInput`, `DateInput`, `ReferenceInput`)?
* [ ] **Tier 3 Check (Logic):** Does the component contain business logic (e.g., "Calculate decay color")?
* *Fix:* Move logic to a custom hook (e.g., `useOpportunityDecay`) or a utility function.



### 5. Styling & UX (Rule #8)

*Enforces the "Semantic Colors" system.*

* [ ] **No Hex Codes:** Search for `#` color codes. **Delete them.**
* [ ] **No Hardcoded Colors:** Search for `red-500`, `blue-600`.
* *Fix:* Use `text-destructive`, `text-primary`, `bg-muted`.


* [ ] **Touch Targets:** Are buttons and inputs at least `h-11` (44px)?

### 6. Safety & Cleanup

*Enforces data integrity.*

* [ ] **Soft Deletes:** Ensure the `DeleteButton` is standard. (The Data Provider handles the conversion to `deleted_at`, so no custom "Archive" logic is needed in the UI unless it's a special action).
* [ ] **Unused Imports:** Run "Organize Imports" to remove clutter.

---

### Example: transforming a "Bad" Component

**Before (Violates Rules):**

```tsx
// ❌ BAD: Mixed concerns, direct Supabase, hex colors
import { supabase } from '@/lib/supabase'; // Rule #5 Violation
import { Button } from '@/components/ui/button'; // Tier 1 mixing

export const ContactList = () => {
  const deleteContact = async (id) => {
    await supabase.from('contacts').delete().eq('id', id); // Logic in View
  };

  return (
    <div className="bg-[#f0f0f0]"> {/* Rule #8 Violation */}
      <Button onClick={deleteContact} className="bg-red-500">Delete</Button>
    </div>
  );
};

```

**After (Standardized):**

```tsx
// ✅ GOOD: Standard imports, semantic colors, Tier 2 components
import { List, Datagrid, TextField, DeleteButton } from 'react-admin';

export const ContactList = () => (
  // Rule #4: Uses Tier 2 (React Admin) components
  <List>
    <Datagrid rowClick="show">
      <TextField source="first_name" />
      <TextField source="last_name" />
      {/* Rule #6: Standard Soft Delete handled by Provider */}
      <DeleteButton /> 
    </Datagrid>
  </List>
);

```