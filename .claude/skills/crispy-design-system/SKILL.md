---
name: ui-ux-design-principles
description: Use when designing UI, auditing UI/UX, choosing colors, implementing buttons/forms, or making layout decisions - prevents hardcoded hex values, pure black/white, too many accents, accessibility violations, and convention breaking through systematic color and UX frameworks
---

# UI/UX Design Principles

## Overview

Systematic framework for making UI/UX decisions grounded in cognitive science and user experience laws. This skill provides **universal principles** that apply to any project, with project-specific implementation details in resource files.

**Core Mission:** Design experiences that are fast under pressure, effortless under fatigue, predictable by pattern, and emotionally confident.

## The Sienna Protocol

Every UI/UX decision follows this structured approach:

### 1. Cognitive Audit (Before Design)

Identify context and friction:
- **Who:** User role, expertise level, frequency of use
- **Where:** Device (desktop/tablet/mobile), environment (office/field/dim lighting)
- **What:** Task goals, current pain points, cognitive load
- **Which laws:** Identify violated UX principles (see table below)

### 2. Strategy Selection

| Strategy | Focus | Best For |
|----------|-------|----------|
| **A - Familiar Efficiency** | Low learning curve, speed | Power users, CRM/Excel veterans |
| **B - Progressive Clarity** | Reduced cognitive load | New users, complex onboarding |
| **C - Hybrid Field Resilience** | High contrast, large targets, feedback-rich | Field use, tablets, challenging environments |
| **D - Behavioral Momentum** | Habit loops, emotional reinforcement | Repetitive workflows, gamification |

**Default recommendation:** Strategy C (Hybrid Field Resilience) balances accessibility, speed, and adaptability.

### 3. Decision Matrix Evaluation

Score each criterion (1-5), multiply by weight:

| Criterion | Weight | Target | Quick Check |
|-----------|--------|--------|-------------|
| **Usability** | ×3 | ≥4 | Can complete task without training? |
| **Speed** | ×3 | ≥4 | Task time acceptable? |
| **Accessibility** | ×3 | ≥4 | Touch ≥44px? Contrast ≥4.5:1? |
| **Familiarity** | ×2 | ≥4 | Follows platform conventions? |
| **Cognitive Load** | ×2 | ≥4 | ≤7 visible choices? |
| **Visual Clarity** | ×2 | ≥4 | Clear hierarchy? |
| **Feedback** | ×2 | ≥4 | Response <400ms? |
| **Adaptability** | ×2 | ≥4 | Works across devices? |

**Redesign triggers:**
- Accessibility < 4 → WCAG blocker
- Usability < 3 → Users can't complete tasks
- Speed < 3 → Workflow unacceptably slow
- 3+ criteria < 4 → Review against UX Laws

### 4. Implementation Spec

Output concrete, actionable code with:
- Exact CSS/Tailwind classes
- ARIA attributes for accessibility
- Responsive breakpoints
- Feedback patterns (loading states, success confirmation)

---

## UX Laws Reference

### Interaction Laws

| Law | Principle | Implementation |
|-----|-----------|----------------|
| **Jakob's Law** | Users spend most time on OTHER sites; expect familiar patterns | Use standard nav positions, button styles, form layouts |
| **Hick's Law** | Decision time increases with choices | Limit visible options to 5-7; use progressive disclosure |
| **Fitts's Law** | Larger + closer targets = faster/easier to hit | Min 44px touch targets; important actions largest |
| **Tesler's Law** | Complexity can't be eliminated, only moved | Push complexity to system logic, not user workflows |
| **Miller's Law** | Working memory holds ~7 items | Chunk information; avoid forcing mental juggling |
| **Doherty Threshold** | <400ms response maintains flow state | Show immediate feedback; use optimistic updates |

### Visual & Cognitive Laws

| Law | Principle | Implementation |
|-----|-----------|----------------|
| **Aesthetic-Usability** | Beautiful interfaces seem easier to use | Consistent styling increases perceived reliability |
| **Peak-End Rule** | Users remember most intense moment + ending | End flows with clear confirmation, positive closure |
| **Von Restorff Effect** | Different items stand out | Use accent colors sparingly for CTAs |
| **Serial Position Effect** | First and last items remembered best | Put key actions at start/end of lists |
| **Gestalt: Proximity** | Close items appear grouped | Use spacing to show relationships |
| **Gestalt: Similarity** | Similar items appear related | Consistent button styles, text treatments |
| **Gestalt: Continuity** | Eye follows smooth paths | Align elements; guide natural reading flow |

### Code Patterns for UX Laws

```tsx
// Fitts's Law: Large touch target (44px minimum)
<Button className="h-11 min-w-[44px] px-4">
  Save
</Button>

// Hick's Law: Progressive disclosure
<Accordion>
  <AccordionItem value="advanced">
    <AccordionTrigger>Advanced Options</AccordionTrigger>
    <AccordionContent>
      {/* Hidden until explicitly requested */}
    </AccordionContent>
  </AccordionItem>
</Accordion>

// Doherty Threshold: Immediate feedback
<Button onClick={async () => {
  toast.loading("Saving...");  // Instant feedback (<100ms)
  await save();
  toast.success("Saved!");     // Closure (Peak-End)
}}>
  Save
</Button>

// Miller's Law: Chunked information
<Tabs defaultValue="basics">
  <TabsList>
    <TabsTrigger value="basics">Basics</TabsTrigger>
    <TabsTrigger value="details">Details</TabsTrigger>
    <TabsTrigger value="advanced">Advanced</TabsTrigger>
  </TabsList>
  {/* Max 5-7 fields per tab */}
</Tabs>
```

---

## Accessibility Non-Negotiables

These are **blockers** - no exceptions:

| Requirement | Standard | Implementation |
|-------------|----------|----------------|
| **Touch targets** | 44×44px minimum | `h-11 w-11` or `min-h-[44px] min-w-[44px]` |
| **Color contrast** | WCAG AA (4.5:1 text) | Use semantic colors, never pure gray on white |
| **Semantic HTML** | Native elements | `<button>` not `<div onClick>` |
| **Labels** | All inputs labeled | Visible label or `aria-label` / `sr-only` |
| **Keyboard nav** | Full functionality | Tab order logical, Enter/Space work |
| **Focus visible** | Clear indicator | `:focus-visible` with visible ring |
| **Motion** | Respect preferences | `prefers-reduced-motion` support |

### ARIA Patterns

```tsx
// Dialog/Modal
<div role="dialog" aria-modal="true" aria-labelledby="dialog-title">
  <h2 id="dialog-title">Edit Contact</h2>
  {/* Focus trap required */}
</div>

// Live regions for updates
<div aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>

// Form errors
<input aria-invalid={hasError} aria-describedby="error-msg" />
<span id="error-msg" role="alert">{errorText}</span>
```

---

## Color System Principles

### The 60-30-10 Rule

| Role | Percentage | Usage |
|------|------------|-------|
| **Dominant (60%)** | Background, large surfaces | `bg-background`, `bg-card` |
| **Secondary (30%)** | Supporting elements, sections | `bg-muted`, `border-border` |
| **Accent (10%)** | CTAs, highlights, focus states | `bg-primary`, `text-primary` |

### Semantic Color Categories

| Category | Purpose | Examples |
|----------|---------|----------|
| **Brand** | Identity, primary actions | Primary button, logo, key CTAs |
| **Neutral** | Text, backgrounds, borders | Body text, cards, dividers |
| **Status** | Feedback states | Success (green), Warning (amber), Error (red), Info (blue) |
| **Interactive** | Hover, focus, active states | Button hover, focus rings, selected items |

### Color Anti-Patterns

| Problem | Why It Fails | Fix |
|---------|--------------|-----|
| Hardcoded hex values | Bypasses design system | Use semantic tokens |
| Pure black `#000` | Too harsh, poor readability | Use `slate-900` or similar |
| Pure white `#FFF` | Glare, accessibility issues | Use `slate-50` or warm white |
| Too many accent colors | Cognitive overload, no hierarchy | Max 2 accent colors |
| Color-only meaning | Fails colorblind users | Add icons, text, patterns |

---

## Response Format

When answering UI/UX questions, structure responses as:

### 1) Cognitive Audit (2-4 sentences)
- Context: role, device, environment
- Friction points identified
- UX laws at stake

### 2) Strategy Recommendation
- Choose A/B/C/D with rationale
- Brief pros/cons

### 3) Implementation Spec
- Concrete code/CSS
- ARIA attributes
- Responsive considerations
- Feedback patterns

**Example:**

> **Audit:** Field sales rep on iPad in warehouse (dim lighting, possible gloves). Current filter panel has 15 visible options (Hick's Law violation) with 38px buttons (Fitts's Law violation).
>
> **Strategy:** C - Hybrid Field Resilience. High contrast, large targets essential for environment.
>
> **Implementation:**
> ```tsx
> <FilterPanel className="bg-card p-4">
>   {/* Grouped to reduce visible choices */}
>   <FilterGroup label="Status">
>     <FilterButton className="h-11 min-w-[44px] text-base">
>       Active
>     </FilterButton>
>   </FilterGroup>
> </FilterPanel>
> ```

---

## Quick Checklists

### Pre-Design Checklist
- [ ] Identified user context (who, where, what device)
- [ ] Listed UX laws that apply
- [ ] Chosen strategy (A/B/C/D)
- [ ] Mapped colors to semantic tokens

### Pre-Commit Checklist
- [ ] Touch targets ≥ 44px on ALL screen sizes
- [ ] No hardcoded colors (hex, rgb, hsl)
- [ ] ARIA labels on interactive elements
- [ ] Keyboard navigation works
- [ ] Feedback on all actions (<400ms)
- [ ] Tested on primary target device

### Optimization Triggers

| Trigger | Problem | Action |
|---------|---------|--------|
| **Performance** | Feedback >400ms | Add skeleton/shimmer loader |
| **Visual** | Contrast <4.5:1 | Use semantic colors with higher contrast |
| **Ergonomic** | Targets <44px | Increase padding/hit area |
| **Cognitive** | >7 visible choices | Progressive disclosure, grouping |
| **Feedback** | Missing states | Add loading, success, error states |
| **Emotional** | Abrupt flow endings | Add microcopy, confirmation |

---

## Resource Files

### Universal Principles
- [UX Laws Deep Dive](resources/ux-laws-reference.md) - Extended explanations and research citations
- [Decision Matrix Guide](resources/decision-matrix-guide.md) - Scoring examples and case studies
- [Color Theory](resources/color-system.md) - OKLCH, semantic mappings, accessibility

### Project-Specific Implementation
- [Design Tokens](resources/design-tokens.md) - Spacing, CSS variables
- [Typography](resources/typography.md) - Font scales, hierarchy
- [Elevation](resources/elevation.md) - Shadows, depth, layering
- [Form Patterns](resources/form-patterns.md) - Validation, arrays, accessibility
- [Data Tables](resources/data-tables.md) - Sorting, pagination, responsive

---

## Core Beliefs

- **Design is a system, not an aesthetic**
- **Every pixel must serve cognition or confidence**
- **Accessibility and speed are fundamentals, not features**
- **We don't redesign for beauty; we redesign for measurable improvement**
- **Familiarity reduces friction; innovation must earn its cost**

---

## Cross-Reference

**See also:** `engineering-constitution` skill for:
- Error handling patterns
- Validation (Zod schemas)
- Form state management
- Testing patterns
