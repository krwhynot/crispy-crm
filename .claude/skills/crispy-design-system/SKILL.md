---
name: crispy-design-system
description: Use when implementing UI features in Atomic CRM - enforces design system consistency with Tailwind v4 semantic utilities, desktop-first responsive design, JSONB array patterns, and accessibility standards before writing component code
---

# Atomic CRM UI Design Consistency

## Overview

Enforce Atomic CRM's unified design system when implementing UI components. This skill ensures compliance with three flagship layout patterns from the unified design system rollout (docs/plans/2025-11-16-unified-design-system-rollout.md):

1. **Standardized List Shell** - Filter sidebar + table-based lists with premium hover effects
2. **Resource Slide-Over** - Right panel for view/edit operations with focus management
3. **Create Form Patterns** - Full-page forms with tabbed sections and sticky footers

**Core principle:** Follow established patterns from CLAUDE.md and the unified design system rollout plan to maintain visual consistency across all resources.

## Cognitive Foundation

For **UX theory and cognitive principles** (Jakob's Law, Hick's Law, Fitts's Law, decision matrices, 60-30-10 rule), use the `ui-ux-design-principles` skill.

This skill focuses on **Atomic CRM implementation specifics**: Tailwind v4 utilities, OKLCH colors, component patterns, and responsive strategies.

## UX Laws Applied to Atomic CRM

| Law | Principle | Atomic CRM Implementation |
|-----|-----------|---------------------------|
| **Jakob's Law** | Users expect familiar patterns | StandardListLayout mimics Excel/Salesforce; slide-overs follow modal conventions |
| **Hick's Law** | More choices = slower decisions | Filter sidebar groups options; 5-7 nav items max; progressive disclosure |
| **Fitts's Law** | Larger + closer = easier to hit | 44px min touch targets (`h-11 w-11`); FloatingCreateButton is 56px (`h-14 w-14`) |
| **Doherty Threshold** | <400ms feedback maintains flow | Skeleton loaders; optimistic updates; toast notifications |
| **Miller's Law** | ~7 items in working memory | Dashboard shows 3-5 KPIs; tabs group related fields |
| **Peak-End Rule** | Users remember endings | Success toasts on save; slide-over confirms changes |
| **Aesthetic-Usability** | Beautiful = perceived as usable | Garden to Table theme; warm shadows; OKLCH colors |

### Implementation Patterns

```tsx
// Fitts's Law: Large touch target
<Button className="h-11 min-w-[44px] px-4">Save</Button>

// Hick's Law: Progressive disclosure
<Accordion>
  <AccordionItem value="advanced">
    <AccordionTrigger>Advanced Options</AccordionTrigger>
    <AccordionContent>{/* Hidden until needed */}</AccordionContent>
  </AccordionItem>
</Accordion>

// Doherty Threshold: Immediate feedback
<Button onClick={async () => {
  toast.loading("Saving...");  // Instant feedback
  await save();
  toast.success("Saved!");     // Closure
}}>
  Save
</Button>
```

**Full cognitive framework:** See `ui-ux-design-principles` skill.

## When to Use

Use this skill when:
- Implementing list pages (must use StandardListLayout + PremiumDatagrid)
- Creating view/edit functionality (must use ResourceSlideOver pattern)
- Building create forms (must use full-page pattern with .create-form-card)
- Starting new UI feature work in Atomic CRM
- Creating React components with styling
- Adding form inputs (especially JSONB arrays)
- Implementing responsive layouts
- Fixing inconsistent UI patterns
- Working with colors, spacing, or typography

Do NOT use for:
- Backend/database-only changes
- Documentation updates
- Non-UI bug fixes

## Pre-Implementation Checklist

**Before writing any UI code, verify:**

- [ ] Read CLAUDE.md sections: Color System, JSONB Array Handling, Core Principles
- [ ] Prototype on desktop viewport (1440px+) - this is the primary target
- [ ] List all colors needed: map to semantic utilities (`text-muted-foreground`, not `text-[color:var(...)]`)
- [ ] Touch targets: ensure all interactive elements are ≥ 44px (`w-11 h-11` minimum) across ALL screen sizes
- [ ] Form inputs: any JSONB arrays needing sub-schemas?
- [ ] Test responsive breakpoints: base (mobile) → `lg:` (desktop 1024px+)

## Critical Rules

### 1. Tailwind v4 Semantic Utilities ONLY

**❌ WRONG - Inline CSS Variable Syntax:**
```typescript
className="text-[color:var(--text-subtle)] bg-[var(--warning-default)] border-[color:var(--stroke-card)]"
```

**✅ CORRECT - Semantic Utility Classes:**
```typescript
className="text-muted-foreground bg-warning border-border"
```

**Common Mappings:**

| Inline CSS Variable | Semantic Utility |
|---------------------|------------------|
| `text-[color:var(--text-subtle)]` | `text-muted-foreground` |
| `text-[color:var(--text-primary)]` | `text-foreground` |
| `bg-[var(--warning-default)]` | `bg-warning` |
| `bg-[var(--destructive)]` | `bg-destructive` |
| `bg-[var(--brand-500)]` | `bg-primary` |
| `border-[color:var(--stroke-card)]` | `border-border` |
| `shadow-[var(--elevation-2)]` | `shadow-md` |

**If semantic utility doesn't exist:** Check `tailwind.config.ts` or ask before adding inline syntax.

### 2. Desktop-First Responsive Design

**Requirement:** Atomic CRM is used primarily on desktops (1440px+). Design and test on desktop viewport first, then adapt for tablet and mobile while maintaining touch-friendly targets.

**Important:** Tailwind is inherently mobile-first (base styles apply at 0px). "Desktop-first" means **design thinking**, not Tailwind syntax.

**✅ CORRECT - Desktop-First Pattern:**
```typescript
// Mobile base → Desktop optimized (lg:)
// Desktop gets the full experience, mobile/tablet gets streamlined version
className="grid-cols-1 lg:grid-cols-3"
```

**Desktop-First Strategy:**

1. **Design on desktop viewport** - Prototype at 1440px+ width (primary business tool)
2. **Optimize `lg:` breakpoint** - Desktop (1024px+) is primary target
3. **Adapt tablet/mobile** - Base styles provide simplified, stacked layouts
4. **Maintain touch targets** - 44px minimum across ALL screen sizes (desktop, tablet, mobile)
5. **Progressive enhancement** - Desktop gets full features, mobile gets essential features

**Key Difference from Mobile-First:**
- Mobile-first: optimize for phones, adapt up
- Desktop-first: optimize for `lg:` breakpoint, adapt down gracefully

**Touch-Friendly Requirements (ALL Screen Sizes):**
- Minimum tap/click target: `w-11 h-11` (44px) on desktop, tablet, AND mobile
- Text base size: 14px minimum (`text-sm`)
- Padding: `p-content lg:p-widget` (16px mobile → 20px desktop)
- Use semantic spacing tokens (`gap-section`, `space-y-compact`)

**Example: Desktop-First Dashboard Card**
```typescript
// Mobile: stacked, compact, touch-friendly
// Desktop (1024px+): grid layout, spacious, optimized for mouse+keyboard

<Card className="p-content lg:p-widget h-48 lg:h-64">
  {/* 44px touch targets on all screen sizes */}
  <button className="h-11 w-11">
    <Icon className="h-6 w-6" />
  </button>
</Card>

// Grid layout example
<div className="grid grid-cols-1 lg:grid-cols-2 gap-section">
  {/* Mobile: Stacked vertically */}
  {/* Desktop (1024px+): Side-by-side PRIMARY VIEW */}
  <Widget1 />
  <Widget2 />
</div>
```

**Breakpoint Strategy:**
- Base (0px-1023px): Mobile + tablet get stacked layouts, touch-friendly
- `lg:` (1024px+): Desktop gets full multi-column layouts, optimized spacing
- Always test: Desktop (1440px) FIRST → Tablet (768px) → Mobile (375px)

### 3. JSONB Array Pattern (Atomic CRM Specific)

**When adding array fields** (emails, phones, websites, tags):

**Database Migration:**
```sql
ALTER TABLE contacts ADD COLUMN websites JSONB DEFAULT '[]'::jsonb;
```

**Zod Sub-Schema:**
```typescript
// src/atomic-crm/validation/contacts.ts

export const websiteTypeSchema = z.enum(["Personal", "Company", "Portfolio"]);

export const websiteAndTypeSchema = z.object({
  url: z.string().url("Invalid URL"),
  type: websiteTypeSchema.default("Company"), // Default in schema
});

const contactBaseSchema = z.object({
  websites: z.array(websiteAndTypeSchema).default([]), // Empty array default
  // ... other fields
});
```

**Form Component:**
```typescript
<ArrayInput source="websites" label="Websites" helperText={false}>
  <SimpleFormIterator inline disableReordering disableClear>
    <TextInput source="url" placeholder="Website URL" />
    <SelectInput source="type" choices={websiteTypes} />
    {/* NO defaultValue prop - Zod handles defaults */}
  </SimpleFormIterator>
</ArrayInput>

const websiteTypes = [
  { id: "Personal" },
  { id: "Company" },
  { id: "Portfolio" }
];
```

**Key Pattern:**
- Sub-schema for array items (`websiteAndTypeSchema`)
- Defaults in Zod (`.default()`), NOT in form
- `ArrayInput` + `SimpleFormIterator` from React Admin
- Form state: `zodSchema.partial().parse({})` for initialization

### 4. Visual Styling & Spacing

**Strict semantic colors** (docs/plans/2025-11-16-unified-design-system-rollout.md:295-308):
- Backgrounds: `bg-muted` (page), `bg-card` (content), `bg-background` (nested)
- Borders: `border-border` (default), `border-primary` (focus), `border-destructive` (error)
- Never use hex values or inline CSS variables

**Spacing tokens** (docs/plans/2025-11-16-unified-design-system-rollout.md:306-344):
```css
--spacing-edge-desktop: 24px     /* Screen borders */
--spacing-section: 32px          /* Between sections */
--spacing-content: 16px          /* Content gaps */
--spacing-compact: 12px          /* Tight spacing */
```

**Required utility classes** (docs/plans/2025-11-16-unified-design-system-rollout.md:346-398):
- `.card-container` - Standard card wrapper
- `.create-form-card` - Create forms (includes shadow-lg)
- `.interactive-card` - Premium hover effects
- `.table-row-premium` - Applied by PremiumDatagrid rowClassName
- `.filter-sidebar` - Left sidebar filter panel
- `.btn-premium` - Button hover states
- `.focus-ring` - Focus indicators

**List rows MUST** use `.table-row-premium` (via PremiumDatagrid)
**Create forms MUST** use `.create-form-card` for shadow-lg elevation

### 5. Accessibility Non-Negotiables

**Minimum requirements:**
- Touch targets: **44x44px minimum** (no "acceptable at 40px")
- Color contrast: WCAG AA (4.5:1 for text)
- Semantic HTML: `<button>` not `<div onClick>`
- Labels: All form inputs have labels (visible or sr-only)
- Keyboard nav: Tab order logical, Enter/Space work

**Slide-over specific** (docs/plans/2025-11-16-unified-design-system-rollout.md:144-205):
- Focus trap when open (focus stays within)
- `role="dialog"` and `aria-modal="true"`
- Initial focus to first interactive element
- ESC key closes slide-over
- Tab/Shift+Tab cycles within slide-over only
- Screen reader announces mode changes (view/edit)
- Focus returns to trigger element on close

**React Admin provides:** FormField (role="group"), FormLabel (htmlFor), FormError (aria-invalid)

## Layout Requirements

Per unified design system (docs/plans/2025-11-16-unified-design-system-rollout.md:45-288):

### List Views (docs/plans/2025-11-16-unified-design-system-rollout.md:45-104)
**MUST** wrap content in `StandardListLayout`:
- `.filter-sidebar` (256px left panel) + `.card-container` (main content)
- Apply `PremiumDatagrid` wrapper with `.table-row-premium` rowClassName
- Row clicks open slide-over (NOT full page navigation)
- Floating create button (bottom-right) or header toolbar

### View/Edit Interactions (docs/plans/2025-11-16-unified-design-system-rollout.md:95-205)
**MUST** use `ResourceSlideOver` shell:
- Width: 40vw (min 480px, max 720px)
- Animation: slide from right (200ms ease-out)
- Tabs: Resource-specific (Details | History | Files | Notes)
- Focus trap required (role="dialog", aria-modal="true")
- URL sync: `?view=123` or `?edit=123` query params

### Create Forms (docs/plans/2025-11-16-unified-design-system-rollout.md:211-288)
**MUST** stay full-page (no slide-overs):
- Breadcrumb navigation at top
- Centered `.create-form-card` (max-w-4xl, shadow-lg)
- Tabbed sections with error badges
- Sticky footer with Cancel | Save & Close | Save & Add Another
- Validation: Zod schemas with inline errors
- Optional autosave to localStorage (complex forms only)

## Color System Quick Reference

**Brand (Garden to Table Theme):**
- Primary: Lime Green (`bg-primary`, `text-primary`)
- Accent: Clay Orange (`bg-accent-clay-600`)
- Background: Warm cream (`bg-background`)

**Semantic:**
- Success: `bg-success`, `text-success`
- Warning: `bg-warning`, `text-warning`
- Destructive/Error: `bg-destructive`, `text-destructive`
- Muted: `text-muted-foreground`

**Never use:**
- Hex codes: `#FF6600`, `#FEFEF9`
- Direct OKLCH: `oklch(68% 0.140 85)`
- Inline variables: `bg-[var(--warning)]`

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| "Slightly under 44px is acceptable" | NO. 44px is minimum on ALL screen sizes. Use `h-11 w-11`. |
| "Mobile-first works fine" | Optimize `lg:` breakpoint for desktop (1440px+), not just make it "work". |
| Only testing on mobile | Test on desktop viewport (1440px+) FIRST. |
| `text-[color:var(--text-subtle)]` | Use `text-muted-foreground` semantic utility. |
| `defaultValue` in form component | Defaults go in Zod schema (`.default()`). |
| Hardcoded dropdown choices | Use `ConfigurationContext` for customizable values. |
| Research instead of implement | "Create X" means build it, not document existing X. |
| `md:` as primary breakpoint | Use `lg:` (1024px+) for desktop-first design. |

## Implementation Checklist

Per resource migration (docs/plans/2025-11-16-unified-design-system-rollout.md:488-502):

- [ ] List view uses `StandardListLayout` with filter sidebar
- [ ] Table styled with `PremiumDatagrid` wrapper
- [ ] Row clicks open slide-over (NOT full page navigation)
- [ ] Slide-over component created with view/edit modes
- [ ] URL routing updated (`?view=123` or `?edit=123`)
- [ ] Create form uses full-page pattern with `.create-form-card`
- [ ] All semantic colors applied (no hex/inline vars)
- [ ] Spacing uses CSS variables (`--spacing-*`)
- [ ] Old components deleted (no legacy code)
- [ ] Accessibility audit passed (focus trap, ARIA attributes)
- [ ] E2E tests updated for new patterns

## Implementation Workflow

**1. Verify Requirements**
- Desktop-first design (1440px+ primary)
- What colors/spacing needed? (use semantic tokens)
- JSONB arrays involved?
- Which flagship layout pattern applies? (list/slide-over/create)

**2. Check CLAUDE.md Patterns**
- Color System section
- JSONB Array Handling Pattern
- Validation Layer section
- Spacing System section
- Unified Design System Rollout plan

**3. Write Code Following Patterns**
- Tailwind semantic utilities (no inline CSS variables)
- Desktop-first breakpoints (`lg:` for 1024px+)
- Zod schemas for validation
- React Admin components
- Semantic spacing (`gap-section`, `space-y-compact`)
- **Direct Migration** (docs/plans/2025-11-16-unified-design-system-rollout.md:436-487):
  - No feature flags or gradual rollout
  - Delete old components immediately
  - Breaking changes are expected and encouraged
  - Fix forward if issues arise (don't revert)

**4. Verify Before Committing**
- Touch targets ≥ 44px on ALL screen sizes (desktop, tablet, mobile)
- No inline CSS variables (`text-[color:var(...)]`)
- Test responsive: Desktop (1440px) FIRST → Tablet (768px) → Mobile (375px)
- Accessibility: keyboard nav works, aria-labels present
- All checklist items above completed

## Red Flags - STOP and Verify

If you find yourself:
- Using `className="text-[color:var(...)]"` → Wrong Tailwind syntax
- Not testing on desktop viewport (1440px+) first → Wrong design target
- Using `md:` as primary breakpoint → Should be `lg:` for desktop-first
- Accepting under 44px touch targets → Below minimum (applies to ALL screens)
- Setting `defaultValue` in form → Defaults go in Zod
- Using hardcoded pixel spacing → Use semantic tokens (`gap-section`, `p-content`)
- Researching existing code instead of implementing → Wrong mode

**All of these mean:** Review this skill and CLAUDE.md before proceeding.

## Resource Files

Comprehensive design system documentation with real code examples:

### React Patterns
- [Component Architecture](resources/component-architecture.md) - Compound components, presentational/container patterns, CVA variants, custom hooks
- [React Performance](resources/react-performance.md) - Memoization, lazy loading, code splitting, virtual scrolling, GPU acceleration
- [TypeScript Patterns](resources/typescript-patterns.md) - Interface vs type, Zod schema inference, generics, utility types, discriminated unions
- [State Management](resources/state-management.md) - Local state, Context, server state with React Admin hooks, URL state, form state

### Design System
- [Design Tokens](resources/design-tokens.md) - Spacing scale, CSS variables overview
  - [Spacing & Grid](resources/tokens-spacing-grid.md) - Grid system, breakpoints, density
  - [Touch & Animation](resources/tokens-touch-animation.md) - Touch targets, shadows, transitions
- [Color System](resources/color-system.md) - OKLCH overview, semantic mappings, best practices
  - [Brand & Accent](resources/color-brand-accent.md) - Forest green, clay scales, neutrals, shadows
  - [Status Colors](resources/color-status-semantic.md) - Success, warning, error, info, overlays
  - [Charts & Tags](resources/color-charts-tags.md) - Data viz and tag palettes
- [Typography](resources/typography.md) - Font families, sizing scale, weights, semantic text colors, hierarchy patterns
- [Elevation](resources/elevation.md) - Three-tier shadow system, stroke patterns, divider system, rounded corners, avatar micro-elevation

### CRM UI Patterns
- [Data Tables](resources/data-tables.md) - Sortable columns, hover states, sticky headers, pagination, responsive tables
- [Form Patterns](resources/form-patterns.md) - Zod validation, React Hook Form integration, JSONB arrays, tabbed forms, accessibility
- [Dashboard Layouts](resources/dashboard-layouts.md) - Grid systems, widget patterns, spacing tokens, responsive breakpoints

## Real-World Impact

**Following these patterns:**
- Consistent design system (users recognize Atomic CRM UI)
- Maintainable code (future devs find patterns quickly)
- Accessible (meets WCAG AA on all screen sizes, works with assistive tech)
- Desktop-first with mobile support (primary business tool optimized for 1440px+, adapts gracefully to tablet/mobile)
- Type-safe (Zod validation catches errors early)
- Touch-friendly everywhere (44px minimum targets across desktop, tablet, mobile)

**Violations create:**
- Visual inconsistency (hex codes bypass design tokens)
- Poor UX (using `md:` instead of `lg:` as primary breakpoint)
- Accessibility failures (touch targets under 44px, poor contrast)
- Bugs (missing validation, wrong form initialization)
- Maintenance nightmares (hardcoded spacing instead of semantic tokens)

## Cross-Reference

**See also:** `engineering-constitution` skill for:
- Error handling patterns (fail-fast, Promise.allSettled)
- Validation patterns (Zod schemas, API boundary validation)
- Form state management (schema-derived defaults)
- Database patterns (GRANT + RLS, migrations)
- Security patterns (CSV validation, RLS policies)
- Testing patterns (unit tests, E2E tests, coverage)
