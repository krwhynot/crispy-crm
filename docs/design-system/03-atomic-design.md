# Atomic Design in Atomic CRM

This document provides detailed guidance on applying Atomic Design methodology to the Atomic CRM design system.

## Overview

Atomic Design is a methodology for creating design systems by Brad Frost. It breaks UI components into a hierarchy inspired by chemistry:

**⚛️ Atoms** → **🧬 Molecules** → **🦠 Organisms** → **📐 Templates** → **📄 Pages**

**Core Principle:** Components at any level should **primarily** be composed of components from levels below it. This is a guideline for clarity, not a rigid rule - flexibility is key.

**Engineering Constitution Alignment:**
- **YAGNI:** Create components only when needed in 3+ places
- **No Over-Engineering:** Don't debate Molecule vs Organism for hours - build the feature
- **Fail Fast:** Validate at the appropriate level, throw errors in development
- **Single Source of Truth:** Define components once, import everywhere

---

## ⚛️ Atoms

**Definition:** The most basic building blocks that can't be broken down further without losing meaning.

### Current Atoms

**Touch Target Constants** (`src/lib/design-system/spacing.ts`)
```typescript
export const TOUCH_TARGET_MIN = 44;        // WCAG 2.5.5 minimum
export const TOUCH_TARGET_STANDARD = 48;   // Our standard (h-12)
export const TOUCH_TARGET_SPACIOUS = 56;   // Generous sizing (h-14)
```

**Focus Ring** (`src/lib/design-system/accessibility.ts`)
```typescript
export const focusRing = 'outline-2 outline-primary outline-offset-2';
```

**Screen Reader Only** (`src/lib/design-system/accessibility.ts`)
```typescript
export const srOnly = 'sr-only absolute w-1 h-1 p-0 -m-1 overflow-hidden';
```

**Color Tokens** (CSS variables in `tailwind.config.ts`)
```css
--primary: oklch(0.45 0.15 165);
--brand-700: oklch(0.35 0.12 165);
--foreground: oklch(0.15 0.02 105);
```

### When to Create Atoms

Create a new atom when:
- ✅ It's a fundamental value used across multiple components
- ✅ It enforces a design standard (like touch targets)
- ✅ It's validated or has specific requirements
- ❌ Don't create atoms for one-off values

### Examples of Good Atoms

```typescript
// ✅ Good: Enforces standard, used everywhere
export const ANIMATION_DURATION = 200; // ms

// ✅ Good: Accessibility requirement
export const MIN_CONTRAST_RATIO = 4.5; // WCAG AA

// ❌ Bad: One-off value, use inline
const headerHeight = 64; // Just use h-16 in Tailwind
```

---

## 🧬 Molecules

**Definition:** Simple UI patterns that combine atoms into reusable groups.

### Current Molecules

**useAriaAnnounce Hook** (`src/lib/design-system/accessibility.ts`)
```typescript
// Combines: live region (atom) + announcement logic
const announce = useAriaAnnounce();
announce('Dashboard data refreshed');
```

**useKeyboardNavigation Hook** (`src/lib/design-system/accessibility.ts`)
```typescript
// Combines: focus management (atom) + arrow key logic
const { currentIndex, handleKeyDown } = useKeyboardNavigation({
  items: principals,
  onSelect: (index) => navigate(`/principals/${index}`)
});
```

### When to Create Molecules

Create a new molecule when:
- ✅ You're combining 2-3 atoms into a common pattern
- ✅ The pattern is reused in 3+ places
- ✅ It encapsulates a specific behavior (focus, announcement, etc.)
- ❌ Don't create molecules for simple wrappers

### Examples of Good Molecules

```typescript
// ✅ Good: Reusable validation + error display pattern
export const useFormFieldState = (fieldName: string) => {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const validate = () => {
    // Validation logic combining multiple atoms
  };

  return { value, setValue, error, validate };
};

// ✅ Good: Common keyboard shortcut pattern
export const useKeyboardShortcut = (key: string, callback: () => void) => {
  // Combines: key detection (atom) + callback execution
};

// ❌ Bad: Just use Tailwind directly
const FormLabel = ({ children }) => (
  <label className="text-sm font-medium">{children}</label>
);
```

---

## 🦠 Organisms

**Definition:** Complex, standalone UI components with specific purposes.

### Current Organisms

**ResponsiveGrid** (`src/components/design-system/ResponsiveGrid.tsx`)
```typescript
// Dashboard variant: 70% main + 30% sidebar
<ResponsiveGrid variant="dashboard">
  <main>Content</main>
  <aside>Sidebar</aside>
</ResponsiveGrid>

// Cards variant: Responsive card grid
<ResponsiveGrid variant="cards" gap="lg">
  {items.map(item => <Card key={item.id}>{item.name}</Card>)}
</ResponsiveGrid>
```

### When to Create Organisms

Create a new organism when:
- ✅ The component appears on 3+ pages
- ✅ It has complex internal state or behavior
- ✅ It combines multiple molecules
- ✅ It serves a specific, reusable purpose
- ❌ Don't create organisms for page-specific layouts

### Examples of Good Organisms

```typescript
// ✅ Good: Reusable data table with sorting, filtering
export const DataTable = ({ data, columns, onSort, onFilter }) => {
  // Combines: molecules (keyboard nav, announcements)
  // + complex state management
};

// ✅ Good: Navigation component used sitewide
export const MainNavigation = () => {
  // Combines: touch targets, keyboard nav, ARIA
};

// ❌ Bad: Too page-specific, keep in page file
const DashboardHeader = () => (
  <div>
    <h1>My Principals</h1>
    <RefreshButton />
  </div>
);
```

---

## 📐 Templates

**Definition:** Page-level layouts showing content structure without real data.

### Current Templates

**Dashboard Template** (src/atomic-crm/dashboard/Dashboard.tsx)
- Structure: Main content (70%) + Sidebar (30%)
- Slots: Header with actions, widget areas, complementary info
- Responsive: Stacks on mobile, side-by-side on tablet+

**List/Detail Template** (ContactList, OrganizationList patterns)
- Structure: Filter sidebar + Main list + Bulk actions
- Slots: Filters, search, sort controls, list content
- Responsive: Filters collapse on mobile

**Form Template** (ContactEdit, OrganizationEdit patterns)
- Structure: Form (70%) + Context sidebar (30%)
- Slots: Form fields, validation, actions, related info
- Responsive: Sidebar below on mobile

### When to Define Templates

Define a template when:
- ✅ The layout pattern is used on 3+ pages
- ✅ It establishes consistent content structure
- ✅ Multiple resources share the same layout
- ❌ Don't create templates for one-off pages

### Template Guidelines

```typescript
// ✅ Good: Reusable layout structure
export const DetailPageTemplate = ({ main, sidebar }) => (
  <ResponsiveGrid variant="dashboard">
    <main role="main" aria-label="Details">
      {main}
    </main>
    <aside role="complementary" aria-label="Information">
      {sidebar}
    </aside>
  </ResponsiveGrid>
);

// Use across multiple resources
<DetailPageTemplate
  main={<ContactDetails contact={contact} />}
  sidebar={<ContactAside contact={contact} />}
/>
```

---

## 📄 Pages

**Definition:** Specific instances of templates with real content and data.

### Current Pages

**Dashboard** (`/dashboard`)
- Template: Dashboard layout
- Content: Real principal data, actual widgets, live metrics
- Data: Fetched from Supabase via React Admin

**ContactShow** (`/contacts/123`)
- Template: Detail page layout
- Content: Real contact information, notes, tasks
- Data: Contact record from database

**ContactEdit** (`/contacts/123/edit`)
- Template: Form layout
- Content: Editable contact fields, validation
- Data: Contact record + save handlers

### Page Development Guidelines

When building pages:

1. **Start with the template** - Choose or create appropriate layout
2. **Add organisms** - Place complex UI components in slots
3. **Connect data** - Wire up React Admin data providers
4. **Implement interactions** - Add form handlers, navigation
5. **Test accessibility** - ARIA, keyboard nav, screen readers

```typescript
// Example: Building a new page
export const OrganizationShow = () => (
  <ShowBase>  // React Admin data fetching
    <DetailPageTemplate  // Template
      main={
        <Card>
          <OrganizationDetails />  // Organism
        </Card>
      }
      sidebar={<OrganizationAside />}  // Organism
    />
  </ShowBase>
);
```

---

## Component Creation Workflow

### 1. Identify the Level

**Ask:**
- Is it a constant/token? → **Atom**
- Does it combine 2-3 atoms? → **Molecule**
- Is it a complex, reusable UI section? → **Organism**
- Is it a page layout structure? → **Template**
- Is it a specific page with real data? → **Page**

### 2. Check for Existing Components

Before creating new components:

```bash
# Search for similar patterns
grep -r "ResponsiveGrid" src/
grep -r "useAriaAnnounce" src/

# Check design system docs
cat docs/design-system/README.md
```

### 3. Follow Constitutional Principles

- **YAGNI**: Only create it if needed in 3+ places
- **Fail Fast**: Validate inputs, throw errors in development
- **Single Source of Truth**: One place to change, everywhere updates
- **Fix at Source**: Don't wrap broken components, fix them

### 4. Document and Test

```typescript
/**
 * useAriaAnnounce - Screen reader announcement hook (Molecule)
 *
 * Creates a live region and provides a function to announce
 * dynamic updates to screen reader users.
 *
 * @example
 * const announce = useAriaAnnounce();
 * announce('Dashboard data refreshed');
 */
export const useAriaAnnounce = () => {
  // Implementation
};
```

---

## Migration Path

### Current State (What We Have)

- ✅ **Atoms**: Touch targets, focus ring, SR-only, colors
- ✅ **Molecules**: useAriaAnnounce, useKeyboardNavigation
- ✅ **Organisms**: ResponsiveGrid (2 variants)
- ✅ **Templates**: Dashboard, List/Detail, Form (implicit)
- ✅ **Pages**: Dashboard, ContactShow, ContactEdit

### Next Steps (Priority Order)

1. **Apply existing organisms to remaining modules:**
   - Organizations (Show, Edit) - Use ResponsiveGrid
   - Opportunities (Show, Edit) - Use ResponsiveGrid
   - Tasks (Show, Edit) - Use ResponsiveGrid

2. **Extract common molecules:**
   - Form field validation patterns
   - Data table sorting/filtering
   - Modal dialog patterns

3. **Create new organisms as needed:**
   - Only when pattern appears 3+ times
   - Document in this file
   - Test for accessibility

4. **Document templates explicitly:**
   - Create template components if helpful
   - Or keep as documented patterns

---

## Decision Log

**Why not reorganize files by atomic level?**
- Current structure works well (lib vs components)
- Reorganizing would be churn without benefit
- Documentation provides the hierarchy
- YAGNI: Don't reorganize until we have 10+ organisms

**Why combine atoms and molecules in one directory?**
- Both are lib utilities (not visual components)
- Separating adds cognitive overhead
- Easy to find all utilities in `lib/design-system/`

**Why keep templates implicit rather than explicit components?**
- Templates are patterns, not always code
- ResponsiveGrid serves as template infrastructure
- Creating explicit <Template> components is over-abstraction
- Can create explicit templates later if genuinely needed

---

## References

- [Atomic Design by Brad Frost](https://atomicdesign.bradfrost.com/)
- [Pattern Lab](https://patternlab.io/) - Atomic Design tooling
- [Engineering Constitution](../claude/engineering-constitution.md)
- [Design System Principles](./01-principles.md)
