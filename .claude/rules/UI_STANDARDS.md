# UI Component Standards: Three-Tier Architecture

Prevents "Spaghetti UI" where features rebuild the wheel instead of using standard blocks.

**Scope:** `src/components/ui/` (Tier 1) and `src/components/ra-wrappers/` (Tier 2)

## Tier 1: Atoms (`src/components/ui/`)

Dumb, presentational components (shadcn/ui).

DO:
- Pure presentation - no business logic
- Forward refs with `React.forwardRef`
- Semantic Tailwind classes (`bg-primary`, `w-80`)
- `focus-visible` states on interactive elements

DON'T:
- `import ... from 'react-admin'` - FORBIDDEN in Tier 1
- `import ... from '@supabase'` - FORBIDDEN in Tier 1
- Logic checks like `if (user.role === 'admin')`
- Hex codes (`#123456`) or hardcoded pixels (`350px`)

## Tier 2: Molecules (`src/components/ra-wrappers/`)

Connect dumb UI to smart Admin framework.

DO:
- Wrap shadcn components with React Admin integration
- Accept standard React Admin props (e.g., `actions={<EditButton />}`)
- Custom inputs wrap `useInput` from React Admin
- Handle `onChange` and `onBlur` for React Hook Form

DON'T:
- Skip creating wrappers - force features to use raw Tier 1

## Global Styling (`src/index.css`)

DO:
- Define colors as CSS variables (`--primary`, `--destructive`)
- Use standard Tailwind spacing scales
- Define font family globally

DON'T:
- Magic numbers in `tailwind.config.js`
- Repeat `font-sans` in every component

## Violation Fixes

### Raw Card (Tier 1 Leak)

WRONG:
```tsx
import { Card, CardContent } from '@/components/ui/card';

export const OpportunityEdit = () => (
  <Card className="mt-4">
    <CardContent><SimpleForm>...</SimpleForm></CardContent>
  </Card>
);
```

RIGHT:
```tsx
// 1. Create wrapper: src/components/ra-wrappers/SectionCard.tsx
export const SectionCard = ({ children, title }) => (
  <Card className="mt-4 border-muted">
    {title && <CardHeader><CardTitle>{title}</CardTitle></CardHeader>}
    <CardContent>{children}</CardContent>
  </Card>
);

// 2. Use in feature
import { SectionCard } from '@/components/ra-wrappers/SectionCard';
export const OpportunityEdit = () => (
  <SectionCard title="Opportunity Details">
    <SimpleForm>...</SimpleForm>
  </SectionCard>
);
```

### Hardcoded Button

WRONG:
```tsx
<button className="bg-[#E11D48] text-white h-[36px] rounded">
  Delete
</button>
```

RIGHT:
```tsx
import { Button } from '@/components/ui/button';

<Button variant="destructive" size="default">
  Delete
</Button>
```

Uses semantic color (`destructive`) and standard size (`h-11` = 44px).

## Audit Command

```bash
# Find Tier 1 leaks in features
grep -r "from '@/components/ui/" src/atomic-crm/
```

## Checklist

- [ ] Tier 1 has no `react-admin` or `@supabase` imports
- [ ] Tier 1 has no business logic
- [ ] Tier 1 uses semantic classes (no hex codes)
- [ ] Tier 2 wrappers exist for common layouts
- [ ] Custom inputs wrap `useInput` properly
- [ ] CSS variables defined in `:root`
- [ ] No magic numbers in Tailwind config
