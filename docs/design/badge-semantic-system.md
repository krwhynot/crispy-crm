# Badge Semantic System

**Created:** January 8, 2026
**Purpose:** Document the badge styling conventions for consistency across Crispy CRM

---

## Overview

Badges in Crispy CRM follow a semantic system that maps data categories to visual styles. This ensures users can quickly interpret information based on consistent color and style patterns.

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
| `PriorityBadge` | `src/components/ui/priority-badge.tsx` | Task priority |
| `SampleStatusBadge` | `src/atomic-crm/components/SampleStatusBadge.tsx` | Sample workflow |
| `ContactBadges` | `src/atomic-crm/contacts/ContactBadges.tsx` | Contact status, role, influence |
| `OrganizationBadges` | `src/atomic-crm/organizations/OrganizationBadges.tsx` | Org type, priority |
| `StageBadgeWithHealth` | `src/atomic-crm/contacts/StageBadgeWithHealth.tsx` | Pipeline stage + health indicator |
| `NextTaskBadge` | `src/atomic-crm/opportunities/components/NextTaskBadge.tsx` | Task summary with due status |

---

## Decision Matrix

```
Is it a priority/urgency level?
  └─YES→ Use CVA variants (destructive/default/secondary/outline)
  └─NO→ Is it a category/type?
         └─YES→ Use tag classes (tag-warm, tag-sage, etc.)
         └─NO→ Is it a workflow state?
                └─YES→ Use semantic variants (success/warning/destructive)
                └─NO→ Use secondary or outline
```

---

## Accessibility Notes

1. **Contrast:** All tag colors use WCAG AA compliant foreground/background combinations
2. **Touch Targets:** Interactive badges should have `min-h-11` (44px) for touch accessibility
3. **Screen Readers:** Use `aria-label` for badges that convey critical information
4. **Color Independence:** Don't rely solely on color—include text labels or icons

---

## Examples

```tsx
// Priority badge
<PriorityBadge priority="high" />

// Organization type
<Badge className="tag-purple">Principal</Badge>

// Contact status
<ContactStatusBadge status="warm" />

// Count badge in tabs
<Badge variant="secondary" className="text-xs">
  {count}
</Badge>

// Health indicator (outline + border color)
<Badge variant="outline" className="border-2 border-success">
  Active
</Badge>
```
