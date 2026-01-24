# Badge System Documentation

**Purpose:** Comprehensive badge styling and priority system conventions for Crispy CRM

**Last Updated:** 2026-01-23

---

## Table of Contents

1. [Badge Variants (CVA)](#badge-variants-cva)
2. [Organization Priority System (A-D)](#organization-priority-system)
3. [Task Priority System (low/medium/high/critical)](#task-priority-system)
4. [Semantic Tag Classes](#semantic-tag-classes)
5. [Badge Type Patterns](#badge-type-patterns)
6. [Component Reference](#component-reference)
7. [Design Principles](#design-principles)
8. [Decision Matrix](#decision-matrix)
9. [Accessibility Notes](#accessibility-notes)
10. [FAQ](#faq)

---

## Overview

Badges in Crispy CRM follow a semantic system that maps data categories to visual styles. This ensures users can quickly interpret information based on consistent color and style patterns.

**Dual Priority Systems:**

Crispy CRM uses **two distinct priority badge systems** optimized for their respective domains: organizational business tiers and task urgency levels.

| System | Use Case | Scale | Location | Components |
|--------|----------|-------|----------|------------|
| **Organization Priority** | Business importance/sales tiers | A-D letter scale | Organizations, distributor relationships | `PriorityBadge` (OrganizationBadges.tsx) |
| **Task Priority** | Urgency level | low/medium/high/critical | Tasks, activities | `PriorityBadge` (priority-badge.tsx) |

Both systems use semantic badge variants for consistency with Crispy CRM's design system, but serve different user mental models.

---

## Badge Variants (CVA)

The base `Badge` component (`src/components/ui/badge.tsx`) uses class-variance-authority (CVA) variants defined in `badge.constants.ts`:

### Core Variants

| Variant | Use Case | Visual Style |
|---------|----------|--------------|
| `default` | Primary/important items, high priority | Solid primary green background |
| `secondary` | Standard/medium importance | Muted background |
| `destructive` | Urgent/critical, errors | Red background |
| `success` | Completed, positive outcomes | Green (success) background |
| `warning` | Needs attention, pending | Yellow/amber background |
| `outline` | Low priority, minimal emphasis | Border only, transparent background |

### Organization Type Variants

| Variant | Organization Type | Color (Theme) |
|---------|-------------------|---------------|
| `org-customer` | Customer | `tag-warm` (Clay Orange) |
| `org-prospect` | Prospect | `tag-sage` (Olive Green) |
| `org-principal` | Principal | `tag-purple` (Eggplant) |
| `org-distributor` | Distributor | `tag-teal` |

---

## Organization Priority System

### Purpose

The Organization Priority system classifies organizations by business importance using an A-D scale. This represents strategic value and the level of attention each account should receive.

**Why a letter scale?** Sales and business contexts favor letter grades (A-tier customer, B-list prospect) aligned with how account managers naturally think about account tiers.

### Visual Specification

| Level | Label | Meaning | Badge Variant | Semantic Meaning | Use Case |
|-------|-------|---------|----------------|------------------|----------|
| **A** | A - High | Highest priority, requires immediate attention | `default` (brand primary green) | Premium/VIP status | Top-tier customers, key principals, strategic accounts |
| **B** | B - Medium-High | Important accounts requiring regular attention | `secondary` (neutral gray) | Standard importance | Active customers, promising prospects |
| **C** | C - Medium | Routine attention | `outline` | Standard/routine | Regular customers, routine prospects |
| **D** | D - Low | Minimal attention | `outline` | De-emphasized | Inactive, low-value, or test accounts |

### Component Reference

**File:** `/src/atomic-crm/organizations/OrganizationBadges.tsx`

```typescript
import { PriorityBadge } from "@/atomic-crm/organizations/OrganizationBadges";

// Render A-D priority badges
<PriorityBadge priority="A" />  // Green badge "A - High"
<PriorityBadge priority="B" />  // Gray badge "B - Medium-High"
<PriorityBadge priority="C" />  // Outline badge "C - Medium"
<PriorityBadge priority="D" />  // Outline badge "D - Low"
```

### Constants

**File:** `/src/atomic-crm/organizations/constants.ts`

```typescript
// Priority level type
export type PriorityLevel = "A" | "B" | "C" | "D";

// Choices for forms (SelectInput)
export const PRIORITY_CHOICES = [
  { id: "A", name: "A - High" },
  { id: "B", name: "B - Medium-High" },
  { id: "C", name: "C - Medium" },
  { id: "D", name: "D - Low" },
] as const;

// Variant mapping for rendering
export const PRIORITY_VARIANT_MAP: Record<PriorityLevel, "default" | "secondary" | "outline"> = {
  A: "default",    // Brand primary - importance without alarm
  B: "secondary",  // Standard emphasis
  C: "outline",    // Routine
  D: "outline",    // Minimal
};
```

### Usage Examples

#### In Organization Lists
```typescript
<OrganizationList>
  {/* Each row displays organization priority in a column */}
  <PriorityBadge priority={org.priority} />
</OrganizationList>
```

#### In Organization Details (Slide-Over)
```typescript
<OrganizationSlideOver>
  <h3>Business Tier</h3>
  <PriorityBadge priority={organization.priority} />
</OrganizationSlideOver>
```

#### In Filters
```typescript
<OrganizationListFilter>
  {/* Allow filtering by priority tier */}
  <CheckboxInput choices={PRIORITY_CHOICES} />
</OrganizationListFilter>
```

---

## Task Priority System

### Purpose

The Task Priority system classifies tasks by urgency using a four-level scale (low/medium/high/critical). This represents how soon a task needs to be completed.

**Why urgency levels?** Task contexts require distinct urgency signaling. Users mentally model task priority as "how quickly do I need to do this?" rather than "what tier is this?"

### Visual Specification

| Level | Badge Variant | Semantic Meaning | Color | Use Case |
|-------|----------------|------------------|-------|----------|
| **critical** | `destructive` (red) | Urgent, requires immediate action | Error red | Overdue tasks, blocking items, time-sensitive activities |
| **high** | `default` (brand primary green) | Needs attention soon | Brand green | Important but not urgent, this week priorities |
| **medium** | `secondary` (neutral gray) | Normal attention | Neutral gray | Standard tasks, routine follow-ups |
| **low** | `outline` (minimal emphasis) | Can wait | Outline style | Backlog, nice-to-have, future planning |

### Component Reference

**File:** `/src/components/ui/priority-badge.tsx`

```typescript
import { PriorityBadge } from "@/components/ui/priority-badge";

// Render task priority badges
<PriorityBadge priority="critical" />  // Red badge "Critical"
<PriorityBadge priority="high" />      // Green badge "High"
<PriorityBadge priority="medium" />    // Gray badge "Medium"
<PriorityBadge priority="low" />       // Outline badge "Low"
```

### Constants & Utilities

**File:** `/src/components/ui/priority-badge.tsx`

```typescript
// Priority level type
type PriorityLevel = "low" | "medium" | "high" | "critical";

// Variant mapping for rendering
const priorityVariants = {
  low: "outline",
  medium: "secondary",
  high: "default",
  critical: "destructive",
} as const;

// Choices for forms (SelectInput)
export const priorityChoices = [
  { id: "low", name: "Low" },
  { id: "medium", name: "Medium" },
  { id: "high", name: "High" },
  { id: "critical", name: "Critical" },
] as const;

// Utility function to get badge variant (for use with <Badge> directly)
export function getPriorityVariant(priority: string): BadgeVariant {
  return priorityVariants[priority as PriorityLevel] ?? "outline";
}
```

### Using `getPriorityVariant` Directly

When you need to render a custom badge (not using `<PriorityBadge>`), use the exported utility:

```typescript
import { Badge } from "@/components/ui/badge";
import { getPriorityVariant } from "@/components/ui/priority-badge";

// Render a badge with custom content but consistent priority styling
<Badge variant={getPriorityVariant(record.priority ?? "low")}>
  {record.priority?.toUpperCase()}
</Badge>
```

This ensures all priority-based badges share the same color mapping without duplicating logic.

### Usage Examples

#### In Task Lists
```typescript
import { PriorityBadge } from "@/components/ui/priority-badge";

<TaskList>
  {/* Display task priority in table column */}
  <PriorityBadge priority={task.priority} />
</TaskList>
```

#### In Task Details (Slide-Over)
```typescript
<TaskSlideOverDetailsTab>
  <div>
    <label>Priority</label>
    <PriorityBadge priority={task.priority} />
  </div>
</TaskSlideOverDetailsTab>
```

#### In Task Show Card
```typescript
<TaskShow>
  <PriorityBadge priority={task.priority} />
</TaskShow>
```

#### In Forms
```typescript
import { priorityChoices } from "@/components/ui/priority-badge";
import { SelectInput } from "react-admin";

<SelectInput
  source="priority"
  choices={priorityChoices}
  label="Task Priority"
/>
```

---

## Semantic Tag Classes

For category badges (organization types, contact roles, status), use the MFB Garden to Table theme tag classes:

| Class | Color | Use Cases |
|-------|-------|-----------|
| `tag-warm` | Clay Orange | Customers, active relationships |
| `tag-sage` | Olive Green | Prospects, growth potential |
| `tag-purple` | Eggplant | Principals, authority figures, executives |
| `tag-teal` | Teal | Distributors, connected entities |
| `tag-blue` | Blue | Cold status, technical roles |
| `tag-amber` | Amber | Warm status, gatekeepers, caution |
| `tag-pink` | Pink | Hot status, urgency |
| `tag-gray` | Mushroom | Default/unknown, end users |

---

## Badge Type Patterns

### 1. Status Badges (Filled Backgrounds)

**Use filled backgrounds for workflow/lifecycle states.**

- Contact Status: cold → warm → hot → in-contract
- Sample Status: sent → received → feedback_pending → feedback_received
- Pipeline Health: active, cooling, at_risk

**Pattern:** Tag class for category (`tag-blue`, `tag-amber`), or variant for progression (`secondary` → `warning` → `destructive`)

### 2. Priority Badges (Variant-Based)

**Use CVA variants for priority/importance levels.**

| Task Priority | Organization Priority | Badge Variant |
|---------------|----------------------|---------------|
| critical | A - High | `destructive` |
| high | B - Medium-High | `default` |
| medium | C - Medium | `secondary` |
| low | D - Low | `outline` |

**Implementation:**
- `PriorityBadge` (`src/components/ui/priority-badge.tsx`) - for tasks
- `OrganizationBadges.PriorityBadge` - for organizations

### 3. Type/Category Badges (Tag Classes)

**Use tag classes for categorical data.**

| Category | Examples | Styling |
|----------|----------|---------|
| Organization Type | customer, prospect, principal, distributor | Tag classes |
| Contact Role | executive, champion, buyer, end_user | Tag classes |
| Activity Type | call, email, meeting, sample | Tag classes |

### 4. Count/Info Badges (Neutral)

**Use `secondary` or `outline` for numeric counts.**

```tsx
<Badge variant="secondary">5</Badge>  // Tab count
<Badge variant="outline">+3</Badge>   // Additional items
```

---

## Component Reference

| Component | Location | Purpose |
|-----------|----------|---------|
| `Badge` | `src/components/ui/badge.tsx` | Base component |
| `PriorityBadge` (Tasks) | `src/components/ui/priority-badge.tsx` | Task priority |
| `PriorityBadge` (Orgs) | `src/atomic-crm/organizations/OrganizationBadges.tsx` | Organization priority |
| `SampleStatusBadge` | `src/atomic-crm/components/SampleStatusBadge.tsx` | Sample workflow |
| `ContactBadges` | `src/atomic-crm/contacts/ContactBadges.tsx` | Contact status, role, influence |
| `OrganizationBadges` | `src/atomic-crm/organizations/OrganizationBadges.tsx` | Org type, priority |
| `StageBadgeWithHealth` | `src/atomic-crm/contacts/StageBadgeWithHealth.tsx` | Pipeline stage + health indicator |
| `NextTaskBadge` | `src/atomic-crm/opportunities/components/NextTaskBadge.tsx` | Task summary with due status |

---

## Design Principles

### Why Two Priority Systems?

1. **Domain Appropriateness**
   - Organizations: Sales context naturally uses A-B-C-D tiers (A customer, B prospect)
   - Tasks: Productivity context naturally uses urgency (critical, high, medium, low)

2. **User Mental Models**
   - Account managers think "tier" when managing accounts
   - Task workers think "urgency" when prioritizing work
   - Using language that matches user mental models reduces cognitive load

3. **Visual Consistency**
   - Both systems use the same Badge component
   - Both follow semantic color mapping (`default`, `secondary`, `destructive`, `outline`)
   - Both adhere to Tailwind v4 semantic color tokens (no hardcoded hex values)

### Semantic Color Mapping

Both systems use Tailwind v4 semantic color variants:

| Variant | Color | Meaning | Used By |
|---------|-------|---------|---------|
| `default` | Brand primary green | Important/attention-worthy | Org A, Task high |
| `secondary` | Neutral gray | Standard/routine | Org B, Task medium |
| `destructive` | Error red | Urgent/error state | Task critical |
| `outline` | Border color | De-emphasized/minimal | Org C/D, Task low |

**Important:** Never use hardcoded hex colors or `text-gray-500`. Always use semantic tokens to maintain consistency with the design system.

---

## Decision Matrix

### Choosing the Right Badge System

```
Is it a priority/urgency level?
  └─YES→ Use CVA variants (destructive/default/secondary/outline)
  └─NO→ Is it a category/type?
         └─YES→ Use tag classes (tag-warm, tag-sage, etc.)
         └─NO→ Is it a workflow state?
                └─YES→ Use semantic variants (success/warning/destructive)
                └─NO→ Use secondary or outline
```

### Should I use organization or task priority?

Use **organization priority** if you're:
- Displaying organization/account importance
- Building account tier filters
- Sorting customers by business value

Use **task priority** if you're:
- Displaying task/activity urgency
- Building task urgency filters
- Sorting tasks by deadline impact

### Can I use one system for both?

Not recommended. The two systems have different purposes:
- Organization priority is about **strategic value** (A-D tiers)
- Task priority is about **time sensitivity** (urgency levels)

Mixing these creates confusion. A task can be "high urgency" while the organization is "D priority" (routine work for a low-value account).

### How should I sort by priority?

**Organization Priority (highest to lowest):**
```
A (High) → B (Medium-High) → C (Medium) → D (Low)
```

**Task Priority (highest to lowest):**
```
critical → high → medium → low
```

### Can I customize the colors?

No. Badge colors are tied to the design system's semantic tokens and must remain consistent:
- Use Tailwind v4 semantic color classes only
- Do not override with hardcoded hex colors
- If color changes are needed, update the Badge component and all consumers

### What if an organization should have "critical" priority?

Use the organization system (A-D). If A priority isn't strong enough, this indicates:
1. Your priority scale may need recalibration
2. Or this organization should be a separate, higher tier (e.g., "Strategic Account")

Avoid mixing urgency language into the organization priority system.

---

## Accessibility Notes

### Color Contrast

All badge variants meet WCAG 2.1 AA contrast requirements:
- Text on badge background has minimum 4.5:1 contrast ratio
- Works correctly for color-blind users (shape/text not color-dependent)

### Touch Targets

Badges display priorities in lists with adequate touch targets:
- Minimum 44px touch target height (WCAG 2.1 AAA Fitts's Law)
- Larger spacing in mobile/tablet contexts
- Interactive badges should have `min-h-11` (44px) for touch accessibility

### Screen Reader Announcements

Badge text is read aloud by screen readers:
- "Critical", "High", "Medium", "Low" provide clear priority communication
- "A - High", "B - Medium-High", etc. for organization priorities

### Additional Requirements

1. **Color Independence:** Don't rely solely on color—include text labels or icons
2. **ARIA Labels:** Use `aria-label` for badges that convey critical information
3. **Semantic HTML:** Badges should have appropriate semantic context

---

## FAQ

### Can I mix tag classes with CVA variants?

Yes, for different purposes:
- **CVA variants** (`default`, `secondary`, etc.) for priority/importance
- **Tag classes** (`tag-warm`, `tag-purple`, etc.) for categorical data

Don't mix them for the same badge.

### What about custom colors for special cases?

No. All colors must come from semantic tokens or tag classes. If you need a new color:
1. Propose addition to design system
2. Add as semantic token or tag class
3. Update all relevant documentation

### How do I handle missing priority values?

Use appropriate defaults:
- Organization priority: Default to "C" (medium) if unset
- Task priority: Default to "medium" if unset
- Use `getPriorityVariant()` utility which returns "outline" for invalid values

---

## Examples

```tsx
// Priority badge (Task)
<PriorityBadge priority="high" />

// Priority badge (Organization)
import { PriorityBadge } from "@/atomic-crm/organizations/OrganizationBadges";
<PriorityBadge priority="A" />

// Organization type (Tag class)
<Badge className="tag-purple">Principal</Badge>

// Contact status (Tag class)
<Badge className="tag-amber">Warm</Badge>

// Count badge in tabs
<Badge variant="secondary" className="text-xs">
  {count}
</Badge>

// Health indicator (outline + border color)
<Badge variant="outline" className="border-2 border-success">
  Active
</Badge>

// Using getPriorityVariant directly
import { getPriorityVariant } from "@/components/ui/priority-badge";
<Badge variant={getPriorityVariant(record.priority ?? "low")}>
  {record.priority?.toUpperCase()}
</Badge>
```

---

## Summary Table

Quick reference for choosing the right badge system:

| Feature | Organization Priority | Task Priority |
|---------|----------------------|----------------|
| **Scale** | A, B, C, D | low, medium, high, critical |
| **Meaning** | Business tier/value | Urgency/deadline impact |
| **Most Emphatic** | A (brand green) | critical (red) |
| **Least Emphatic** | D (outline) | low (outline) |
| **Component** | PriorityBadge (OrganizationBadges.tsx) | PriorityBadge (priority-badge.tsx) |
| **Typical Use** | Organization lists, filters | Task lists, details, forms |
| **Design Rationale** | Sales mental model | Productivity mental model |

---

## Related Documentation

- **Component Catalog:** See [COMPONENT-CATALOG.md](../design/COMPONENT-CATALOG.md) for Badge usage patterns
- **Accessibility:** See [ACCESSIBILITY.md](../design/ACCESSIBILITY.md) for WCAG compliance details
- **Responsive Design:** See [RESPONSIVE-SPECS.md](../design/RESPONSIVE-SPECS.md) for touch target and spacing
- **Design System Index:** See [INDEX.md](./INDEX.md) for implementation patterns overview

---

**Last Updated:** 2026-01-23
