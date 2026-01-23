Here is the **UI Foundation Standardization Checklist** to secure Tiers 1 & 2 of your architecture.

This checklist prevents the "Spaghetti UI" problem where feature modules accidentally rebuild the wheel instead of using standard blocks.

### 📋 UI Foundation Standardization Checklist

**Scope:** `src/components/ui/` and `src/components/ra-wrappers/`
**Goal:** Enforce Rule #4 (Three-Tier Components) & Rule #8 (Semantic Colors).

---

### 1. Tier 1 Audit: The "Atoms" (`src/components/ui/`)

*These should be dumb, presentational components (shadcn/ui).*

* [ ] **Purity Check:** Search for `import ... from 'react-admin'` or `@supabase`.
* *Rule:* **FORBIDDEN.** Tier 1 cannot know about the admin framework or database.


* [ ] **Logic Check:** Open `button.tsx`, `input.tsx`, `card.tsx`.
* *Rule:* Ensure there are no `if (user.role === 'admin')` style checks. Logic belongs in Tier 2/3.


* [ ] **Style Check:** Search for hex codes (`#123456`) or specific pixel values (`350px`) in `className`.
* *Rule:* Must use Tailwind semantic classes (`bg-primary`, `w-80`).


* [ ] **Accessibility Check:**
* Are `ref`s forwarded correctly? (`React.forwardRef`)
* Do interactive elements have `focus-visible` states defined?



### 2. Tier 2 Construction: The "Molecules" (`src/components/ra-wrappers/`)

*These connect the dumb UI to the smart Admin framework.*

* [ ] **Wrapper Existence:** Do you have wrappers for common layouts?
* `AdminCard.tsx` (Wraps shadcn Card + CardHeader + CardContent)
* `AdminDialog.tsx` (Wraps shadcn Dialog + handles `open` state via props)


* [ ] **Prop Passthrough:** Do wrappers accept standard React Admin props?
* *Example:* `<AdminCard children={...} actions={<EditButton />} />`


* [ ] **Input Standardization:**
* If using custom inputs (e.g., `CurrencyInput`), do they wrap `useInput` from React Admin properly?
* *Rule:* They must handle `onChange` and `onBlur` to register with React Hook Form.



### 3. Global Styling & Theming (`src/index.css`)

*Enforces consistency across the entire app.*

* [ ] **Variable Audit:** Check `:root` in `index.css`.
* Are all core colors defined as variables (`--primary`, `--destructive`)?


* [ ] **Tailwind Config:** Check `tailwind.config.js`.
* *Rule:* No "Magic Numbers" in `extend`. Use standard spacing scales.


* [ ] **Typography:** Is the font family defined globally? (Avoid repeating `font-sans` in every component).

---

### 🛠️ Migration Guide: How to Fix Common Violations

Use this reference when fixing the violations found in your Module Audit.

#### Scenario A: The "Raw Card" Violation

*Found in `opportunities/OpportunityEdit.tsx*`

**❌ Bad (Tier 1 Leak):**

```tsx
import { Card, CardContent } from '@/components/ui/card'; // Direct import

export const OpportunityEdit = () => (
  <Card className="mt-4">
    <CardContent>
      <SimpleForm>...</SimpleForm>
    </CardContent>
  </Card>
);

```

**✅ Good (Tier 2 Usage):**

```tsx
// 1. Create wrapper in src/components/ra-wrappers/SectionCard.tsx
export const SectionCard = ({ children, title }: { children: ReactNode, title?: string }) => (
  <Card className="mt-4 border-muted">
    {title && <CardHeader><CardTitle>{title}</CardTitle></CardHeader>}
    <CardContent>{children}</CardContent>
  </Card>
);

// 2. Use in Feature
import { SectionCard } from '@/components/ra-wrappers/SectionCard';

export const OpportunityEdit = () => (
  <SectionCard title="Opportunity Details">
    <SimpleForm>...</SimpleForm>
  </SectionCard>
);

```

#### Scenario B: The "Hardcoded Button" Violation

*Found in `contacts` popovers*

**❌ Bad (Hardcoded):**

```tsx
<button className="bg-[#E11D48] text-white h-[36px] rounded">
  Delete
</button>

```

**✅ Good (Semantic):**

```tsx
import { Button } from '@/components/ui/button';

// Uses semantic 'destructive' color and standard h-11 size
<Button variant="destructive" size="default">
  Delete
</Button>

```

---

### Recommended First Step

Run this command to see how many "Tier 1 Leaks" you currently have in your feature modules:

```bash
# Find feature files importing raw UI components directly
grep -r "from '@/components/ui/" src/atomic-crm/

```