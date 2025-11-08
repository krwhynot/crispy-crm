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

**Definition:** The smallest reusable, functional units that do one thing well.

**Key Characteristics:**
- Application-agnostic (no business logic specific to CRM)
- Reusable across different contexts
- Combine atoms and/or other molecules
- Encapsulate simple, focused behavior

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
// ✅ Good: Common keyboard shortcut pattern
export const useKeyboardShortcut = (key: string, callback: () => void) => {
  // Combines: key detection (atom) + callback execution
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === key) callback();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [key, callback]);
};

// ✅ Good: Reusable focus trap for modals/dialogs
export const useFocusTrap = (ref: RefObject<HTMLElement>) => {
  // Combines: focus management atoms + tab key detection
  // Keeps focus within modal for accessibility
};

// ❌ Bad: Custom validation (use Zod + React Admin instead)
// Validation belongs at API boundary per Engineering Constitution
export const useFormFieldState = (/* ... */) => {
  // ❌ Don't create parallel validation systems
};

// ❌ Bad: Just use Tailwind directly
const FormLabel = ({ children }) => (
  <label className="text-sm font-medium">{children}</label>
);
```

**Note on Form Validation:** Per Engineering Constitution, validation happens at the API boundary using Zod schemas. React Admin forms use `zodResolver` to connect schemas to forms. See "React Admin Integration" section below for proper form validation patterns.

---

## 🦠 Organisms

**Definition:** Feature-level components that solve specific business problems for Atomic CRM.

**Key Characteristics:**
- Domain-specific (e.g., ContactList, DealPipelineView, PrincipalDashboardTable)
- This is where your CRM's identity begins to show
- Often contain data-fetching logic (Supabase queries)
- Combine molecules, atoms, and can include other organisms when it makes sense
- Reusable across multiple pages within the same feature domain

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

## 📐 Templates (Layout Components)

**Definition:** Reusable page layouts that define structure without content.

**In React Terms:** These are **Layout Components** - they manage the overall chrome and structure of pages.

**Key Characteristics:**
- Define header, sidebar, main content areas
- Accept `children` props for content slots
- No data fetching or business logic
- Reusable across multiple pages
- Examples: `DashboardLayout.tsx`, `DetailPageLayout.tsx`

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

## 📄 Pages (Routed Components)

**Definition:** Components rendered by your router that combine templates, organisms, and data.

**In React Terms:** These are **Routed Components** - the components your React Router actually renders.

**Key Responsibilities:**
1. Select a Template (Layout Component)
2. Fetch data needed for the page (via Supabase/React Admin)
3. Assemble Organisms to build the feature
4. Connect Organisms (state from one organism affects another)
5. Handle page-level routing and navigation

**Examples:** `/dashboard`, `/contacts/123`, `/contacts/123/edit`

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

## Implementation in Atomic CRM

This section bridges Atomic Design theory with our specific tech stack: React 19, TypeScript, Supabase, React Admin, Tailwind CSS 4.

### Data Fetching & State Management

**Guideline:** Data fetching (Supabase queries) and complex business logic should primarily reside in **Organisms** and **Pages**.

**Rationale:** Keeps Atoms and Molecules pure, presentational, and highly reusable.

```typescript
// ✅ Good: Organism handles data fetching
export const ContactList = () => {
  const { data: contacts, isLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => supabase.from('contacts_summary').select('*')
  });

  if (isLoading) return <LoadingSpinner />;  // Atom

  return (
    <div>
      {contacts.map(contact => (
        <ContactListItem key={contact.id} contact={contact} />  // Molecule
      ))}
    </div>
  );
};

// ❌ Bad: Atom shouldn't know about Supabase
export const Button = () => {
  const { data } = useQuery(/* ... */);  // Too much responsibility
  return <button>...</button>;
};

// ❌ Bad: Molecule shouldn't have domain-specific data fetching
export const SearchBox = () => {
  const { data: contacts } = useQuery(/* ... */);  // Should be in parent Organism
  return <input />;
};
```

### React Admin Integration

**Guideline:** Treat React Admin's core components (`<List>`, `<Edit>`, `<Datagrid>`) as part of the **Template** or **Page** layer.

**Rationale:** They handle routing, data fetching, and provide structure - that's template/page territory.

```typescript
// ✅ Good: Page uses React Admin components as infrastructure
export const ContactList = () => (
  <List>  // Template-level (React Admin provides routing + data)
    <Datagrid>
      <TextField source="first_name" />  // Atom
      <TextField source="last_name" />   // Atom
      <ContactStatusBadge />  // Molecule (combines atom + logic)
    </Datagrid>
  </List>
);

// ✅ Good: Custom Filter is an Organism
export const ContactFilters = () => (
  <Filter>  // Template-level
    <TextInput source="q" label="Search" />  // Atom
    <DateRangePicker source="created_at" />  // Molecule
    <OrganizationSelect source="organization_id" />  // Molecule
  </Filter>
);
```

### Supabase Views & Database Logic

**Guideline:** Organisms that display data should use Supabase views when available.

```typescript
// ✅ Good: Organism uses view designed for its purpose
export const PrincipalDashboardTable = () => {
  const { data } = useGetList('principals_summary');  // View with computed fields
  // ...
};

// ✅ Good: Organism handles RLS errors gracefully
export const RecentActivityFeed = () => {
  const { data, error } = useGetList('activities');

  if (error) {
    if (error.message.includes('permission denied')) {
      return <EmptyState message="No recent activity" />;  // Fail fast but gracefully
    }
    throw error;  // Unexpected errors still throw
  }

  return <ActivityList activities={data} />;
};
```

### Tailwind CSS 4 & Styling

**Guideline:** Use Tailwind classes directly in components at all levels. Don't create wrapper components just for styling.

```typescript
// ✅ Good: Molecule uses Tailwind directly
export const ContactCard = ({ contact }) => (
  <div className="rounded-lg border border-border bg-card p-4">
    <h3 className="text-lg font-semibold">{contact.name}</h3>
    <p className="text-sm text-muted-foreground">{contact.email}</p>
  </div>
);

// ❌ Bad: Unnecessary wrapper just for styling
export const CardWrapper = ({ children }) => (
  <div className="rounded-lg border border-border bg-card p-4">
    {children}
  </div>
);
```

### When to Create vs. Use Inline

**Atoms:** Create constants for repeated values
```typescript
// ✅ Create: Used everywhere
export const TOUCH_TARGET_MIN = 44;

// ❌ Don't create: One-off value
const modalPadding = 16;  // Just use p-4 in Tailwind
```

**Molecules:** Create when pattern appears 3+ times
```typescript
// ✅ Create: Used in 5+ forms
export const FormField = ({ label, error, children }) => (
  <div className="space-y-2">
    <label>{label}</label>
    {children}
    {error && <span className="text-destructive">{error}</span>}
  </div>
);

// ❌ Don't create: Used once
// Just inline the pattern where needed
```

**Organisms:** Create when feature appears on multiple pages
```typescript
// ✅ Create: ContactAside used in ContactShow + ContactEdit
export const ContactAside = ({ contact }) => {
  // Complex sidebar with multiple sections
};

// ❌ Don't create: Page-specific header used nowhere else
// Keep inline in the page component
```

---

## Component Creation Workflow

### 1. Identify the Level

**Better Heuristics:** Focus on purpose, not structure.

**Question:**Does this solve a specific problem for **Atomic CRM's domain?**
- **Yes** → Likely an **Organism** (e.g., ContactList, DealPipelineView)
- **No** → Likely a **Molecule** or **Atom** (e.g., Button, SearchBox, DatePicker)

**Question:** Does it have any business context at all?
- **No** → **Atom** (Button, Input, Badge)
- **Yes, but generic** → **Molecule** (SearchBox, FormField, UserAvatar)
- **Yes, CRM-specific** → **Organism** (ContactCard, OpportunityTimeline)

**Question:** Does it define page structure?
- **Yes, reusable layout** → **Template** (DashboardLayout, DetailPageLayout)
- **Yes, specific route** → **Page** (/contacts/123)

**When in doubt:**
- If you'd spend more than 5 minutes debating Molecule vs Organism, just build it and iterate
- The category matters less than code quality and YAGNI compliance
- You can always refactor later if a pattern emerges

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

**Why allow organisms to contain other organisms?**
- Brad Frost's original methodology permits this ("groups of molecules and/or atoms and/or other organisms")
- Real-world components are fluid - strict rules cause over-engineering
- Example: A `CustomerDetailsPanel` organism can contain an `AddressForm` organism
- Flexibility prevents unnecessary refactoring just to satisfy naming conventions

**Why emphasize "when in doubt, just build it"?**
- Engineering Constitution prioritizes shipping over taxonomy debates
- The category matters less than code quality and YAGNI compliance
- Developers shouldn't spend 30 minutes debating Molecule vs Organism
- Atomic Design is a mental model, not a set of rigid laws

**Why focus on business domain for categorization?**
- Most actionable heuristic: "Is this CRM-specific?"
- Prevents debates about structural composition
- Aligns with how developers actually think about components
- Makes the hierarchy intuitive rather than theoretical

---

## References

- [Atomic Design by Brad Frost](https://atomicdesign.bradfrost.com/)
- [Pattern Lab](https://patternlab.io/) - Atomic Design tooling
- [Engineering Constitution](../claude/engineering-constitution.md)
- [Design System Principles](./01-principles.md)
