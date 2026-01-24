# Design System Implementation Guide

Developer-focused technical specifications for implementing Crispy CRM's design system.

**Purpose:** This directory contains implementation details, code patterns, and technical specifications. For design philosophy and user experience patterns, see [docs/design/](../design/INDEX.md).

---

## Quick Links

| Document | Description | Size |
|----------|-------------|------|
| [badges.md](./badges.md) | Badge variants, dual priority systems, semantic tag classes | Comprehensive |
| [filter-patterns.md](./filter-patterns.md) | FilterChipBar, column filters, resource-specific configs | 23KB |
| [form-patterns.md](./form-patterns.md) | Three form layout patterns with implementation | 18KB |
| [typography.md](./typography.md) | UPPERCASE vs Title Case, section heading rules | 9.5KB |
| [touch-targets.md](./touch-targets.md) | 44px minimum, form input heights, WCAG compliance | 4.3KB |

---

## Implementation Patterns

### 1. Forms (Create/Edit)
**Document:** [form-patterns.md](./form-patterns.md)

Three distinct patterns for different form types:
- **Pattern 1: Compact Sections** (Recommended) - Organized sections with progress indicators
- **Pattern 2: Card Wrapped** - For forms with duplicate checking logic
- **Pattern 3: Wide Container** - For forms with inline related records

**When to use:** Creating or editing any resource (contacts, opportunities, organizations)

**Key Components:**
- `FormProgressProvider` + `FormProgressBar` - Visual feedback
- `FormSectionWithProgress` - Sectioned forms with completion tracking
- `CompactFormRow` - Multi-column field layouts
- `CreateFormFooter` - Standardized save/cancel actions

### 2. Filters (List Views)
**Document:** [filter-patterns.md](./filter-patterns.md)

Resource-specific filter configurations with shared patterns:
- Common filters: Starred, Owner (all resources)
- Resource-specific: Organization Type, Contact Status, Opportunity Stage
- Date range filters: Two syntaxes (@ vs underscore)
- Column header filters: Excel-style inline filtering

**When to use:** Building list views, implementing FilterChipBar, adding column filters

**Key Components:**
- `FilterChipBar` - Persistent filter display
- `FilterableColumnHeader` - Column filters in table headers
- `SearchInput` - Full-text search
- Resource-specific filter components

### 3. Badges (Status Indicators)
**Document:** [badges.md](./badges.md)

Complete badge system including:
- CVA variants: default, secondary, destructive, success, warning, outline
- Dual priority systems: Organization (A-D) vs Task (low/medium/high/critical)
- Semantic tag classes: MFB Garden to Table theme
- Decision matrix for choosing badge types

**When to use:** Displaying status, priority, categories, or counts

**Key Components:**
- `Badge` - Base component with CVA variants
- `PriorityBadge` (Tasks) - Task urgency levels
- `PriorityBadge` (Organizations) - Account tier priorities
- Tag classes (`tag-warm`, `tag-sage`, etc.) - Categorical data

### 4. Typography (Section Headings)
**Document:** [typography.md](./typography.md)

Two distinct section heading patterns:
- **UPPERCASE** - Slide-over panels (metadata, supplementary info)
- **Title Case** - Form sections (primary content areas)

**When to use:** Creating slide-over panels or form sections

**Decision Rule:**
- Is it a slide-over? → UPPERCASE
- Is it a form section? → Title Case

### 5. Touch Targets (Accessibility)
**Document:** [touch-targets.md](./touch-targets.md)

Touch target sizing standards:
- Minimum: 44x44px (`h-11 w-11`)
- Forms: Default 44px input height
- Buttons: Icon buttons, CTAs, floating actions
- WCAG AAA compliance

**When to use:** Implementing any interactive element

**Standard Classes:**
- `h-11 w-11 min-h-11 min-w-11` - Minimum touch target
- `h-12 w-12` - Standard buttons (48px)
- `h-14 w-14` - Primary CTAs (56px)

---

## Design Principles (Cross-Reference)

For design philosophy and broader patterns, see:
- [Accessibility Guidelines](../design/ACCESSIBILITY.md) - WCAG 2.1 AA compliance
- [Component Catalog](../design/COMPONENT-CATALOG.md) - Component inventory
- [Interaction Patterns](../design/INTERACTION-PATTERNS.md) - Hover, focus, animations
- [Responsive Specs](../design/RESPONSIVE-SPECS.md) - Viewport behaviors
- [User Flows](../design/USER-FLOWS.md) - Key user journeys

---

## Using This Directory

### For Developers

1. **Starting a new form?** → [form-patterns.md](./form-patterns.md)
2. **Adding filters to a list?** → [filter-patterns.md](./filter-patterns.md)
3. **Creating status badges?** → [badges.md](./badges.md)
4. **Unsure about section headings?** → [typography.md](./typography.md)
5. **Touch target questions?** → [touch-targets.md](./touch-targets.md)

### For Designers

See [docs/design/](../design/INDEX.md) for UX patterns, user flows, and design philosophy.

---

## Implementation Checklist

Before shipping any UI component:

- [ ] Follows appropriate pattern from this directory
- [ ] Uses semantic color tokens (no hex/oklch)
- [ ] Touch targets meet 44px minimum
- [ ] ARIA attributes for accessibility
- [ ] Responsive behavior tested on Desktop + iPad
- [ ] Form validation at API boundary only
- [ ] No banned patterns (see [COMPONENT-CATALOG.md](../design/COMPONENT-CATALOG.md#deprecated-patterns--banned-imports))

---

## Pattern Decision Tree

```
What are you building?

├─ Form (Create/Edit)
│  ├─ Well-organized logical sections? → Pattern 1: Compact Sections
│  ├─ Duplicate checking needed? → Pattern 2: Card Wrapped
│  └─ Wide content (inline records)? → Pattern 3: Wide Container
│
├─ List View
│  ├─ Need filters? → filter-patterns.md
│  ├─ Column sorting? → filter-patterns.md (column filters)
│  └─ Search? → FilterChipBar + SearchInput
│
├─ Status/Priority Indicator
│  ├─ Organization tier? → badges.md (A-D priority system)
│  ├─ Task urgency? → badges.md (low/medium/high/critical)
│  ├─ Category/type? → badges.md (semantic tag classes)
│  └─ Workflow state? → badges.md (success/warning/destructive)
│
├─ Section Heading
│  ├─ Slide-over panel? → UPPERCASE (typography.md)
│  └─ Form section? → Title Case (typography.md)
│
└─ Interactive Element
   └─ Check touch targets → touch-targets.md (min 44px)
```

---

## File Organization

```
docs/design-system/
├── INDEX.md (this file)
├── badges.md              # Badge system comprehensive guide
├── filter-patterns.md     # List filtering patterns
├── form-patterns.md       # Form layout patterns (3 types)
├── touch-targets.md       # Touch target sizing standards
└── typography.md          # Section heading conventions
```

---

## Quick Reference Tables

### Badge Decision Matrix

| Use Case | Badge Type | Example |
|----------|------------|---------|
| Organization tier | Organization Priority (A-D) | `<PriorityBadge priority="A" />` |
| Task urgency | Task Priority (low/medium/high/critical) | `<PriorityBadge priority="high" />` |
| Organization type | Tag class | `<Badge className="tag-purple">Principal</Badge>` |
| Contact status | Tag class | `<Badge className="tag-amber">Warm</Badge>` |
| Workflow state | Semantic variant | `<Badge variant="success">Complete</Badge>` |
| Count/info | secondary/outline | `<Badge variant="secondary">5</Badge>` |

### Form Pattern Selection

| Scenario | Pattern | Max Width | Progress Tracking |
|----------|---------|-----------|-------------------|
| Well-organized sections | Pattern 1 | max-w-4xl | Per-section completion |
| Duplicate checking | Pattern 2 | max-w-4xl | Overall progress bar |
| Inline related records | Pattern 3 | max-w-5xl | Overall progress bar |

### Touch Target Sizes

| Element Type | Size | Tailwind Class |
|--------------|------|----------------|
| Minimum (all interactive) | 44x44px | `h-11 w-11` |
| Standard button | 48x48px | `h-12 w-12` |
| Primary CTA | 56x56px | `h-14 w-14` |
| Form input default | 44px height | `h-11` |

---

## Common Patterns

### Form Defaults

```typescript
// Always derive defaults from Zod schema
const formDefaults = {
  ...mySchema.partial().parse({}),
  // Add smart defaults
  sales_id: currentUser.id,
};
```

### Form Validation

```typescript
// Use onBlur or onSubmit (never onChange)
<Form defaultValues={formDefaults} mode="onBlur">
```

### Badge Selection

```typescript
// Organization priority
import { PriorityBadge } from "@/atomic-crm/organizations/OrganizationBadges";
<PriorityBadge priority="A" />

// Task priority
import { PriorityBadge } from "@/components/ui/priority-badge";
<PriorityBadge priority="high" />

// Category (tag class)
<Badge className="tag-purple">Principal</Badge>
```

### Semantic Colors

```tsx
// CORRECT: Semantic tokens
className="bg-primary text-primary-foreground"
className="text-muted-foreground"
className="border-border"

// INCORRECT: Hardcoded colors
className="bg-green-600 text-white"  // BANNED
className="text-gray-500"            // BANNED
className="bg-[#E5E7EB]"             // BANNED
```

---

**Last Updated:** 2026-01-23
