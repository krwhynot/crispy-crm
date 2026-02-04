---
name: three-tier-architecture-audit
description: Enforces three-tier UI architecture from UI_STANDARDS.md. Detects Tier 1 importing react-admin/supabase (forbidden), features using raw shadcn (should use wrappers), raw Datagrid imports (use PremiumDatagrid), missing DialogTitle (Radix requirement), and prop leaks to DOM. Triggers on - UI audit, tier audit, component layers, architecture audit, shadcn, react-admin patterns, accessibility.
---

# Three-Tier Architecture Audit

## Purpose

Enforce UI_STANDARDS.md three-tier architecture to prevent "Spaghetti UI" where features rebuild the wheel instead of using standard blocks.

**Core Mandate:** TIER 1 = DUMB, TIER 2 = CONNECTED, TIER 3 = FEATURES

## When to Use

Automatically activates when you mention:
- Architecture terms: tier audit, UI layers, component architecture, three-tier
- Tier terms: Tier 1, Tier 2, Tier 3, atoms, molecules, organisms
- Component terms: shadcn, ui components, wrappers, ra-wrappers
- React Admin terms: Datagrid, PremiumDatagrid, react-admin patterns
- Accessibility terms: DialogTitle, ARIA, Radix accessibility
- Symptoms: import violations, prop leaks, missing wrappers

## The Three Tiers

### Tier 1: Atoms (`src/components/ui/`)
- **Pure presentation** - No business logic
- **FORBIDDEN imports:** `react-admin`, `@supabase`, data providers
- **Allowed imports:** React, Radix UI, class-variance-authority, Tailwind
- **Example:** Button, Card, Input, Dialog (shadcn components)

### Tier 2: Molecules (`src/components/ra-wrappers/`)
- **Connect Tier 1 to React Admin**
- **Required imports:** React Admin hooks (`useInput`, `useRecordContext`)
- **Wraps:** Tier 1 components with RA integration
- **Example:** SaveButton, TextInput, List, PremiumDatagrid

### Tier 3: Features (`src/atomic-crm/*/`)
- **Business logic and composition**
- **MUST use:** Tier 2 wrappers (NOT raw Tier 1)
- **Example:** ContactList, OrganizationEdit, OpportunityForm

---

## The Six Audit Checks

### Check 1: Tier 1 Import Violations

**Rule:** Tier 1 components MUST NOT import `react-admin` or `@supabase`.

**Detection Pattern:**

```tsx
// ❌ VIOLATION: Tier 1 importing react-admin
// src/components/ui/custom-button.tsx
import { useRecordContext } from 'react-admin';  // FORBIDDEN
import { Button } from './button';

export const CustomButton = () => {
  const record = useRecordContext();  // Business logic in Tier 1!
  return <Button>{record.name}</Button>;
};

// ❌ VIOLATION: Tier 1 importing Supabase
// src/components/ui/data-card.tsx
import { supabase } from '@supabase/supabase-js';  // FORBIDDEN

// ✅ COMPLIANT: Pure presentation
// src/components/ui/button.tsx
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

export const Button = React.forwardRef<
  HTMLButtonElement,
  ButtonProps
>(({ className, variant, size, ...props }, ref) => {
  return <button ref={ref} className={...} {...props} />;
});
```

**What to Check:**
- Scan all files in `src/components/ui/`
- Parse imports for forbidden packages:
  - `from 'react-admin'`
  - `from 'ra-core'`
  - `from '@supabase/supabase-js'`
  - `from '@/atomic-crm/providers'`
  - `from '@/lib/supabase'`
- Flag if forbidden import found

**Exceptions:**
- `src/components/ui/index.ts` (re-export file)
- TypeScript type-only imports: `import type { ... }`

**Output Format:**

```
Tier 1 Import Violations (2 files)

src/components/ui/custom-button.tsx:2
  ❌ Import: 'react-admin'
  ⚠️  Risk: Business logic in presentation layer
  ✅ Fix: Move to Tier 2 wrapper (src/components/ra-wrappers/)

src/components/ui/data-card.tsx:5
  ❌ Import: '@supabase/supabase-js'
  ⚠️  Risk: Data fetching in UI component
  ✅ Fix: Create Tier 2 wrapper that uses data provider
```

---

### Check 2: Features Using Raw Tier 1

**Rule:** Feature modules MUST use Tier 2 wrappers, not raw Tier 1 components.

**Detection Pattern:**

```tsx
// ❌ VIOLATION: Feature importing raw Tier 1
// src/atomic-crm/contacts/ContactForm.tsx
import { Card, CardContent } from '@/components/ui/card';  // Raw Tier 1
import { Button } from '@/components/ui/button';  // Raw Tier 1

export const ContactForm = () => (
  <Card>
    <CardContent>
      {/* Manual wiring - should use Tier 2 wrapper */}
      <Button onClick={handleSave}>Save</Button>
    </CardContent>
  </Card>
);

// ✅ COMPLIANT: Feature using Tier 2 wrappers
// src/atomic-crm/contacts/ContactForm.tsx
import { SimpleForm } from 'react-admin';  // Tier 2
import { SaveButton } from '@/components/ra-wrappers/SaveButton';  // Tier 2
import { SectionCard } from '@/components/ra-wrappers/SectionCard';  // Tier 2

export const ContactForm = () => (
  <SectionCard title="Contact Details">
    <SimpleForm>
      {/* Tier 2 components handle RA integration */}
      <SaveButton />
    </SimpleForm>
  </SectionCard>
);
```

**What to Check:**
- Scan feature modules: `src/atomic-crm/*/`
- Find imports from `@/components/ui/`
- Flag if common UI components imported directly:
  - `Card` (should use `SectionCard`)
  - `Button` (should use `SaveButton`, `AdminButton`)
  - `Input` (should use `TextInput`, custom RA input)
  - `Dialog` (check if needs RA integration)

**Common Wrappers:**

| Tier 1 Component | Tier 2 Wrapper | Use Case |
|------------------|----------------|----------|
| `Card` | `SectionCard` | Form sections |
| `Button` | `SaveButton`, `AdminButton` | RA actions |
| `Input` | `TextInput`, custom inputs | Form fields |
| `Dialog` | Custom wrappers | Modals with RA context |
| `Datagrid` | `PremiumDatagrid` | Lists with prop hygiene |

**Output Format:**

```
Features Using Raw Tier 1 (5 files)

src/atomic-crm/contacts/ContactForm.tsx:8
  ⚠️  Import: Card from '@/components/ui/card'
  ⚠️  Risk: Manual wiring, no RA integration
  ✅ Replace with: SectionCard from '@/components/ra-wrappers/SectionCard'

src/atomic-crm/opportunities/OpportunityEdit.tsx:12
  ⚠️  Import: Button from '@/components/ui/button'
  ⚠️  Risk: Missing RA save/redirect logic
  ✅ Replace with: SaveButton from '@/components/ra-wrappers/SaveButton'
```

---

### Check 3: Raw Datagrid Usage

**Rule:** MUST use `PremiumDatagrid`, not raw `Datagrid` from react-admin.

**Detection Pattern:**

```tsx
// ❌ VIOLATION: Raw Datagrid
import { List, Datagrid, TextField } from 'react-admin';

export const ContactList = () => (
  <List>
    <Datagrid>  {/* Prop leaks, no keyboard nav */}
      <TextField source="name" />
    </Datagrid>
  </List>
);

// ✅ COMPLIANT: PremiumDatagrid
import { List, TextField } from 'react-admin';
import { PremiumDatagrid } from '@/components/ra-wrappers/PremiumDatagrid';

export const ContactList = () => (
  <List>
    <PremiumDatagrid>  {/* Prop hygiene, keyboard nav */}
      <TextField source="name" />
    </PremiumDatagrid>
  </List>
);
```

**What to Check:**
- Scan all files for `import { Datagrid } from 'react-admin'`
- Exception: `PremiumDatagrid.tsx` itself (wrapper implementation)
- Flag if raw Datagrid imported in features

**Why PremiumDatagrid:**
- Prevents prop leaks (`rowClassName`, `record`, etc. to DOM)
- Consistent keyboard navigation
- Standardized row click behavior
- Proper focus management

**Output Format:**

```
Raw Datagrid Imports (3 files)

src/atomic-crm/contacts/ContactList.tsx:5
  ❌ Import: Datagrid from 'react-admin'
  ⚠️  Risk: Prop leaks, React warnings, keyboard nav issues
  ✅ Replace with:
    import { PremiumDatagrid } from '@/components/ra-wrappers/PremiumDatagrid';
    <PremiumDatagrid> instead of <Datagrid>
```

---

### Check 4: Missing DialogTitle (Radix UI)

**Rule:** All Radix dialogs MUST include `<DialogTitle>` for accessibility.

**Detection Pattern:**

```tsx
// ❌ VIOLATION: Missing DialogTitle
import { Dialog, DialogContent } from '@/components/ui/dialog';

export const MyModal = () => (
  <Dialog>
    <DialogContent>
      {/* MISSING: <DialogTitle> */}
      <p>Modal content here</p>
    </DialogContent>
  </Dialog>
);
// Result: Radix fires console warning

// ✅ COMPLIANT: Has DialogTitle (visible)
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

export const MyModal = () => (
  <Dialog>
    <DialogContent>
      <DialogTitle>Edit Contact</DialogTitle>
      <p>Modal content here</p>
    </DialogContent>
  </Dialog>
);

// ✅ ALSO COMPLIANT: Has DialogTitle (visually hidden)
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

export const MyModal = () => (
  <Dialog>
    <DialogContent>
      <DialogTitle className="sr-only">Keyboard Shortcuts</DialogTitle>
      <p>Modal content here</p>
    </DialogContent>
  </Dialog>
);
```

**What to Check:**
- Find all `<DialogContent>` usage
- Check if same file/component contains `<DialogTitle>`
- Flag if DialogTitle missing
- Also check: `<AlertDialogContent>`, `<DrawerContent>`

**Radix Requirements:**

| Component | Required Child | Alternative |
|-----------|----------------|-------------|
| `<DialogContent>` | `<DialogTitle>` | Add `className="sr-only"` if no visual title |
| `<AlertDialogContent>` | `<AlertDialogTitle>` | Same |
| `<DrawerContent>` | `<DrawerTitle>` | Vaul uses Radix internally |

**Output Format:**

```
Missing DialogTitle (4 components)

src/atomic-crm/contacts/ContactSlideOver.tsx:45
  ❌ Found: <DialogContent> without <DialogTitle>
  ⚠️  Risk: Radix console warning, accessibility violation
  ✅ Fix (visible title):
    <DialogContent>
      <DialogTitle>Contact Details</DialogTitle>
      ...
    </DialogContent>

  ✅ Fix (hidden title):
    <DialogContent>
      <DialogTitle className="sr-only">Contact Details</DialogTitle>
      ...
    </DialogContent>
```

---

### Check 5: Prop Leak to DOM

**Rule:** Custom wrappers MUST destructure React Admin props before spreading to DOM elements.

**Detection Pattern:**

```tsx
// ❌ VIOLATION: Props leak to DOM
const CustomRow = (props: any) => (
  <tr {...props} />
  {/* rowClassName, record, etc. passed to <tr> - React warns! */}
);

// ✅ COMPLIANT: Destructure custom props
const CustomRow = ({
  rowClassName,
  record,
  id,
  ...rest  // Only valid HTML props
}: CustomRowProps) => (
  <tr className={rowClassName} {...rest} />
);
```

**What to Check:**
- Find components that accept props and spread them to DOM elements
- Check if destructuring custom props first
- Common leak sources:
  - `rowClassName` (Datagrid)
  - `record` (React Admin)
  - `onRowClick` (List)
  - `focusedIndex` (keyboard nav)

**PremiumDatagrid Pattern:**
```tsx
// PremiumDatagrid.tsx destructures before passing down
export const PremiumDatagrid = ({
  rowClassName,
  onRowClick,
  focusedIndex,
  ...rest
}: PremiumDatagridProps) => {
  // Custom logic with destructured props
  return <Datagrid {...rest} />;  // Only safe props passed
};
```

**Output Format:**

```
Potential Prop Leaks (2 components)

src/components/custom/CustomRow.tsx:8
  ⚠️  Pattern: <tr {...props} />
  ⚠️  Risk: React Admin props leak to DOM
  ✅ Fix: Destructure custom props first
    const CustomRow = ({ rowClassName, record, ...rest }) => (
      <tr className={rowClassName} {...rest} />
    );
```

---

### Check 6: Business Logic in Tier 1

**Rule:** Tier 1 components MUST be pure presentation (no if/else logic based on data).

**Detection Pattern:**

```tsx
// ❌ VIOLATION: Business logic in Tier 1
// src/components/ui/status-badge.tsx
export const StatusBadge = ({ user }: { user: User }) => {
  // Business logic - checking user role!
  if (user.role === 'admin') {
    return <Badge variant="destructive">Admin</Badge>;
  }
  return <Badge variant="default">User</Badge>;
};

// ✅ COMPLIANT: Pure presentation
// src/components/ui/badge.tsx
export const Badge = ({ variant, children }: BadgeProps) => {
  return (
    <div className={badgeVariants({ variant })}>
      {children}
    </div>
  );
};

// ✅ Business logic in Tier 2/3
// src/atomic-crm/users/UserBadge.tsx (Tier 3)
import { Badge } from '@/components/ui/badge';

export const UserBadge = ({ user }: { user: User }) => {
  const variant = user.role === 'admin' ? 'destructive' : 'default';
  return <Badge variant={variant}>{user.role}</Badge>;
};
```

**What to Check:**
- Scan Tier 1 components for:
  - `if (record.` or `if (data.` - data-dependent logic
  - `useEffect` with data fetching
  - Complex calculations
  - Role checks, permission checks
- Flag if business logic found

**Allowed in Tier 1:**
- Variant-based styling (`variant === 'destructive'`)
- Disabled state (`disabled ? ... : ...`)
- Size props (`size === 'sm'`)
- Pure presentation logic

**Output Format:**

```
Business Logic in Tier 1 (3 components)

src/components/ui/status-badge.tsx:8
  ⚠️  Logic: if (user.role === 'admin')
  ⚠️  Risk: Business rules in presentation layer
  ✅ Fix: Move logic to Tier 3 feature, pass variant to Tier 1
```

---

## Global Audit Output

### Architecture Health Score

```
UI Architecture Health: B (2 critical, 8 warnings)

Critical Issues:
✗ 2 Tier 1 components import react-admin (architecture violation)
✗ 3 raw Datagrid imports (should use PremiumDatagrid)

Warnings:
⚠ 5 features import raw Tier 1 (should use wrappers)
⚠ 4 dialogs missing DialogTitle (accessibility)
⚠ 2 components have prop leaks
⚠ 3 Tier 1 components have business logic
```

### Summary by Tier

```
Tier 1 (src/components/ui/):
  ✓ 45 components compliant
  ✗ 2 importing react-admin
  ✗ 3 with business logic

Tier 2 (src/components/ra-wrappers/):
  ✓ 18 wrappers available
  ⚠ 2 with prop leaks

Tier 3 (src/atomic-crm/):
  ⚠ 5 features using raw Tier 1
  ✗ 3 using raw Datagrid
```

---

## Quick Reference Checklist

Before merging UI changes, verify:

- [ ] Tier 1 components import only React, Radix UI, Tailwind
- [ ] No `react-admin` or `@supabase` imports in `src/components/ui/`
- [ ] Features use Tier 2 wrappers (not raw Card, Button, Input)
- [ ] All Datagrid usage is `PremiumDatagrid`
- [ ] All `<DialogContent>` has `<DialogTitle>` (or `className="sr-only"`)
- [ ] Custom wrappers destructure RA props before DOM spread
- [ ] Tier 1 components are pure presentation (no business logic)
- [ ] New wrappers added to Tier 2 when common pattern emerges

---

## Tool Integration

### Required Files

| File | Purpose |
|------|---------|
| `UI_STANDARDS.md` | Source of truth for three-tier rules |
| `src/components/ui/` | Tier 1 atoms to audit |
| `src/components/ra-wrappers/` | Tier 2 wrappers to reference |
| `src/atomic-crm/` | Tier 3 features to audit |

### Recommended Commands

```bash
# Find Tier 1 import violations
rg "from 'react-admin'|from '@supabase" src/components/ui --type tsx

# Find raw Datagrid imports
rg "import.*Datagrid.*from.*react-admin" src/atomic-crm --type tsx

# Find missing DialogTitle
rg "<DialogContent" src/ --type tsx -A 10 | rg -v "DialogTitle"

# Find features importing raw Tier 1
rg "from '@/components/ui/(card|button|input)'" src/atomic-crm --type tsx
```

---

## Enforcement Mode

**Severity Levels:**

| Violation | Severity | Block Merge? | Rationale |
|-----------|----------|--------------|-----------|
| Tier 1 imports react-admin | CRITICAL | Yes | Breaks architecture |
| Raw Datagrid | CRITICAL | Yes | Prop leaks, React warnings |
| Missing DialogTitle | HIGH | Suggest | Accessibility violation |
| Features using raw Tier 1 | MEDIUM | Suggest | Maintainability issue |
| Prop leaks | MEDIUM | Suggest | React warnings |
| Business logic in Tier 1 | MEDIUM | Suggest | Architecture smell |

---

## Common Patterns & Fixes

### Pattern 1: Creating Tier 2 Wrapper

**When:** Common Tier 1 usage pattern appears in 3+ features

```tsx
// Step 1: Identify pattern (3+ files using same Tier 1 combo)
// src/atomic-crm/contacts/ContactForm.tsx
// src/atomic-crm/opportunities/OpportunityForm.tsx
// src/atomic-crm/organizations/OrganizationForm.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Section Title</CardTitle>
  </CardHeader>
  <CardContent>...</CardContent>
</Card>

// Step 2: Create Tier 2 wrapper
// src/components/ra-wrappers/SectionCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const SectionCard = ({
  title,
  children
}: SectionCardProps) => (
  <Card className="mt-4 border-muted">
    {title && (
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
    )}
    <CardContent>{children}</CardContent>
  </Card>
);

// Step 3: Use in features
import { SectionCard } from '@/components/ra-wrappers/SectionCard';

<SectionCard title="Contact Details">
  ...
</SectionCard>
```

### Pattern 2: PremiumDatagrid Migration

```tsx
// Before: Raw Datagrid
import { List, Datagrid, TextField } from 'react-admin';

<List>
  <Datagrid rowClick="show">
    <TextField source="name" />
  </Datagrid>
</List>

// After: PremiumDatagrid
import { List, TextField } from 'react-admin';
import { PremiumDatagrid } from '@/components/ra-wrappers/PremiumDatagrid';

<List>
  <PremiumDatagrid rowClick="show">
    <TextField source="name" />
  </PremiumDatagrid>
</List>
```

### Pattern 3: DialogTitle Fix

```tsx
// Before: Missing title
<Dialog>
  <DialogContent>
    <p>Content</p>
  </DialogContent>
</Dialog>

// After: Visible title
<Dialog>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Edit Contact</DialogTitle>
    </DialogHeader>
    <p>Content</p>
  </DialogContent>
</Dialog>

// After: Hidden title (for modals without visual header)
<Dialog>
  <DialogContent>
    <DialogHeader className="sr-only">
      <DialogTitle>Keyboard Shortcuts</DialogTitle>
    </DialogHeader>
    <p>Content</p>
  </DialogContent>
</Dialog>
```

---

## Summary

Three-tier architecture prevents "Spaghetti UI" by enforcing clear boundaries:

1. **Tier 1 (Atoms):** Pure presentation, no logic
2. **Tier 2 (Molecules):** RA integration wrappers
3. **Tier 3 (Features):** Business logic composition

Violations lead to:
- Tangled dependencies (can't swap UI library)
- Duplicate code (features rebuild same patterns)
- React warnings (prop leaks)
- Accessibility violations (missing ARIA)
- Hard to test (logic mixed with presentation)

**Remember:** When you see the same Tier 1 pattern 3+ times, create a Tier 2 wrapper. Keep Tier 1 dumb, keep Tier 3 focused.

---

*Generated by three-tier-architecture-audit skill | Based on UI_STANDARDS.md rules*
