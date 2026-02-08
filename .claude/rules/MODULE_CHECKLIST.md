# Feature Module Standards

Ensures `contacts`, `opportunities`, and feature modules follow 3-Tier Architecture and Data Provider rules.

## File Structure (Rule #6)

DO:
- `index.tsx` - exports Resource definition
- `[Entity]List.tsx`, `[Entity]Create.tsx`, `[Entity]Edit.tsx`, `[Entity]Show.tsx`
- `[Entity]Inputs.tsx` - shared form inputs
- Move helpers to `src/lib/` or `src/utils/` (keep features flat)
- Small sub-components in same file, generic ones in `src/components/`

DON'T:
- Create `utils/` or `components/` folders inside feature modules

## Data Access (Rule #5)

DO:
- `useDataProvider()`, `useGetList()`, `useGetOne()` - React Admin hooks only
- Read list/getMany data from `_summary` views for computed stats
- Follow provider resource mapping for `getOne` detail reads
- Write to base tables (resource name routes correctly)

DON'T:
- `import ... from '@supabase/...'` - DELETE IT
- Direct Supabase calls

## Forms

DO:
- `mode="onSubmit"` or `mode="onBlur"` - prevent aggressive errors
- Rely on `ValidationService` in provider layer
- Separate inputs into `[Entity]Inputs.tsx` for reuse

DON'T:
- Extensive `validate={...}` functions inline

## Component Tiers (Rule #4)

DO:
- Import Tier 2 Admin wrappers (`SaveButton`, `TextInput`)
- Use `PremiumDatagrid` from `@/components/ra-wrappers/PremiumDatagrid` for list tables
- Use standard React Admin inputs (`DateInput`, `ReferenceInput`)
- Move business logic to custom hooks (e.g., `useOpportunityDecay`)

DON'T:
- Import raw shadcn components and wire manually
- Put logic in components

## Styling (Rule #8)

DO:
- `text-destructive`, `text-primary`, `bg-muted` - semantic classes
- `h-11` minimum (44px touch targets)

DON'T:
- Hex codes (`#...`)
- Hardcoded colors (`red-500`, `blue-600`)

## Safety

DO:
- Standard `DeleteButton` (provider handles soft delete)
- Organize imports to remove clutter

DON'T:
- Custom archive logic in UI (unless special action)

## Transformation Example

WRONG:
```tsx
import { supabase } from '@/lib/supabase';        // Rule #5 violation
import { Button } from '@/components/ui/button';  // Tier 1 mixing

export const ContactList = () => {
  const deleteContact = async (id) => {
    await supabase.from('contacts').delete().eq('id', id);  // Logic in view
  };

  return (
    <div className="bg-[#f0f0f0]">              {/* Rule #8 violation */}
      <Button onClick={deleteContact} className="bg-red-500">Delete</Button>
    </div>
  );
};
```

RIGHT:
```tsx
import { List, TextField, DeleteButton } from 'react-admin';
import { PremiumDatagrid } from "@/components/ra-wrappers/PremiumDatagrid";

export const ContactList = () => (
  <List>
    <PremiumDatagrid rowClick="show">
      <TextField source="first_name" />
      <TextField source="last_name" />
      <DeleteButton />  {/* Soft delete handled by provider */}
    </PremiumDatagrid>
  </List>
);
```

## Checklist

- [ ] Standard file structure (`index.tsx`, `[Entity]List.tsx`, etc.)
- [ ] No direct Supabase imports
- [ ] List/getMany reads follow `_summary` view mapping
- [ ] Form `mode="onSubmit"` or `onBlur`
- [ ] No inline `validate` functions
- [ ] Inputs in `[Entity]Inputs.tsx`
- [ ] Using Tier 2 Admin components
- [ ] Business logic in hooks/utils
- [ ] Semantic colors (no hex codes)
- [ ] Touch targets >= `h-11`
- [ ] Standard `DeleteButton`
- [ ] Unused imports removed

