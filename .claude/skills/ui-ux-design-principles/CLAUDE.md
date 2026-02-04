# UI/UX Design Principles - Resource Guide

> **Note:** `CLAUDE.md` is a symlink to this file.

## Overview

Comprehensive design system covering WCAG 2.1 AA accessibility, UX laws, color theory, component patterns, and implementation guidelines. Use this skill when designing UI, auditing UI/UX, choosing colors, implementing buttons/forms, or making layout decisions.

**Core Mission:** Design experiences that are fast under pressure, effortless under fatigue, predictable by pattern, and emotionally confident.

## Structure

```
ui-ux-design-principles/
  SKILL.md       # Main skill file - Sienna Protocol framework, UX laws, decision matrix
  AGENTS.md      # This navigation guide - resource index and usage examples
  CLAUDE.md      # Symlink to AGENTS.md
  resources/     # 18 detailed reference files (308 KB total)
```

## Usage

1. **Start with SKILL.md** for the Sienna Protocol framework, UX laws reference, and decision matrix
2. **Use this guide (AGENTS.md)** to navigate to specific topics based on your task
3. **Browse resources/** for detailed guidance on colors, components, accessibility, implementation

Resources are loaded on-demand - read only what you need for your current task.

---

## Resource Categories

| Category | Files | Focus | When to Use |
|----------|-------|-------|-------------|
| **Foundation Systems** | 6 files | Color tokens, design tokens, typography | Setting up design system, choosing colors, defining scales |
| **Component & Layout Patterns** | 5 files | Forms, tables, dashboards, elevation, architecture | Designing specific UI components, layouts |
| **Design System Tokens** | 2 files | Spacing, grid, touch targets, animation | Implementing consistent spacing, responsive grids |
| **Implementation Patterns** | 3 files | React performance, state management, TypeScript | Writing performant, type-safe component code |
| **UX Philosophy & Frameworks** | 2 files | Decision matrix, UX laws deep-dive | Making strategic UX decisions, justifying design choices |

---

## Available Resources

### 1. Foundation Systems

Core design tokens and visual language - the building blocks of your design system.

- **`resources/color-brand-accent.md`** (8.7 KB) - Brand accent colors, primary/secondary palettes, gradient systems
- **`resources/color-charts-tags.md`** (8.2 KB) - Data visualization colors, tag colors, color-blind safe palettes
- **`resources/color-status-semantic.md`** (9.5 KB) - Semantic status colors (success, warning, error, info), context-aware color usage
- **`resources/color-system.md`** (5.2 KB) - Color theory fundamentals, 60-30-10 rule, OKLCH palette generation, contrast requirements
- **`resources/design-tokens.md`** (6.1 KB) - Spacing scale (4px base), shadow/elevation scales, border radius, opacity values
- **`resources/typography.md`** (27 KB) - Font sizing hierarchy, line height ratios, weight scales, readable text standards, heading styles

### 2. Component & Layout Patterns

UI component design and layout systems - how to build specific interfaces.

- **`resources/component-architecture.md`** (18 KB) - Three-tier architecture (Atoms, Molecules, Organisms), component composition patterns, prop design
- **`resources/dashboard-layouts.md`** (9 KB) - Dashboard grid systems, widget layouts, responsive dashboard patterns, sidebar navigation
- **`resources/data-tables.md`** (13 KB) - Table accessibility, sortable columns, pagination patterns, keyboard navigation, row selection
- **`resources/elevation.md`** (25 KB) - Shadow systems, z-index scales, layering principles, modal/dialog elevation, dropdown positioning
- **`resources/form-patterns.md`** (16 KB) - Form accessibility (`aria-invalid`, `role="alert"`, `aria-describedby`), error handling, field grouping, validation patterns

### 3. Design System Tokens

Spacing, grid, and animation scales for consistent implementation.

- **`resources/tokens-spacing-grid.md`** (4 KB) - Consistent spacing scales (margin, padding, gap), 4px/8px grid system, responsive spacing
- **`resources/tokens-touch-animation.md`** (7.2 KB) - Touch targets (44px minimum), animation duration scales, easing curves, reduced motion preferences

### 4. Implementation Patterns

React/TypeScript code patterns for building performant, maintainable UIs.

- **`resources/react-performance.md`** (22 KB) - React.memo, useMemo, useCallback, virtualization, lazy loading, bundle optimization
- **`resources/state-management.md`** (21 KB) - State lifting, context patterns, server state vs UI state, React Query integration
- **`resources/typescript-patterns.md`** (23 KB) - Component prop types, discriminated unions, type guards, utility types for UI components

### 5. UX Philosophy & Frameworks

Strategic decision-making guides grounded in cognitive science.

- **`resources/decision-matrix-guide.md`** (12 KB) - Sienna Protocol decision matrix, scoring criteria (usability, speed, accessibility), redesign triggers
- **`resources/ux-laws-reference.md`** (13 KB) - Deep dive into Jakob's Law, Hick's Law, Fitts's Law, Tesler's Law, Miller's Law, Doherty Threshold

---

## Usage Examples

### Scenario: Designing a Contact Form

**Path:** Form design → Accessibility → Color choices → Touch targets

1. **Start with `resources/form-patterns.md`**
   - Learn aria-invalid, role="alert", aria-describedby patterns
   - Understand field grouping and validation timing

2. **Reference `resources/color-status-semantic.md`**
   - Get error state colors (text-destructive)
   - Ensure contrast ratios meet WCAG 2.1 AA

3. **Check `resources/tokens-touch-animation.md`**
   - Verify input fields meet 44px minimum touch target
   - Apply appropriate focus states and transitions

4. **Validate with `resources/decision-matrix-guide.md`**
   - Score accessibility (must be ≥4)
   - Verify usability and speed criteria

### Scenario: Auditing Existing UI for Accessibility

**Path:** Accessibility audit → Color contrast → Component patterns → Touch targets

1. **Use `resources/ux-laws-reference.md` as checklist**
   - Verify Jakob's Law (familiar patterns)
   - Check Hick's Law (5-7 visible options max)
   - Validate Fitts's Law (important actions are largest/closest)

2. **Run through `resources/color-system.md`**
   - Identify hardcoded hex violations
   - Check contrast ratios (4.5:1 text, 3:1 UI components)
   - Replace with semantic tokens (text-primary, bg-muted)

3. **Measure against `resources/tokens-touch-animation.md`**
   - Verify all interactive elements ≥44px
   - Check spacing between touch targets

4. **Review component-specific patterns:**
   - Forms → `resources/form-patterns.md`
   - Tables → `resources/data-tables.md`
   - Navigation → `resources/dashboard-layouts.md`

### Scenario: Implementing Dark Mode

**Path:** Color system → Semantic tokens → Component testing

1. **Read `resources/color-system.md`**
   - Understand OKLCH palette generation
   - Learn semantic token approach (bg-primary works in both themes)

2. **Apply semantic colors from `resources/color-status-semantic.md`**
   - Use text-destructive (not hardcoded red-500)
   - Verify all colors have light/dark mode variants

3. **Test components from `resources/component-architecture.md`**
   - Verify buttons, cards, inputs work in both themes
   - Check elevation/shadow in dark mode (from `resources/elevation.md`)

4. **Validate contrast with `resources/color-system.md`**
   - Re-check WCAG 2.1 AA ratios in dark mode
   - Ensure status colors (error, success) remain distinguishable

### Scenario: Building a Dashboard with Data Tables

**Path:** Layout planning → Table design → Responsive patterns

1. **Start with `resources/dashboard-layouts.md`**
   - Choose grid system (12-column, CSS Grid, sidebar layout)
   - Plan widget hierarchy and spacing

2. **Design table with `resources/data-tables.md`**
   - Implement sortable columns
   - Add keyboard navigation (arrow keys, Enter to select)
   - Apply pagination patterns

3. **Apply spacing from `resources/tokens-spacing-grid.md`**
   - Use consistent gap between widgets (gap-4, gap-6)
   - Apply responsive spacing scales

4. **Optimize performance with `resources/react-performance.md`**
   - Virtualize long tables (react-window)
   - Memoize expensive table calculations
   - Lazy load off-screen widgets

---

## Quick Reference: Common Tasks

| Task | Primary Resource | Supporting Resources |
|------|------------------|---------------------|
| Choose button colors | `color-brand-accent.md` | `color-system.md`, `tokens-touch-animation.md` |
| Design accessible form | `form-patterns.md` | `color-status-semantic.md`, `tokens-touch-animation.md` |
| Build data table | `data-tables.md` | `dashboard-layouts.md`, `react-performance.md` |
| Implement typography | `typography.md` | `design-tokens.md` |
| Audit accessibility | `ux-laws-reference.md` | `color-system.md`, `form-patterns.md` |
| Optimize React component | `react-performance.md` | `typescript-patterns.md`, `state-management.md` |
| Design dashboard layout | `dashboard-layouts.md` | `tokens-spacing-grid.md`, `elevation.md` |
| Make UX decision | `decision-matrix-guide.md` | `ux-laws-reference.md` |
| Create color palette | `color-system.md` | `color-brand-accent.md`, `color-status-semantic.md` |
| Ensure touch accessibility | `tokens-touch-animation.md` | `form-patterns.md`, `data-tables.md` |

---

## Skill Triggers

This skill automatically activates when tasks involve:

**Design & Layout:**
- Designing UI components
- Building layouts (dashboards, forms, tables)
- Choosing color systems or palettes
- Implementing responsive designs

**Accessibility & UX:**
- Auditing UI/UX for accessibility violations
- Ensuring WCAG 2.1 AA compliance
- Validating touch target sizes (44px)
- Implementing ARIA attributes

**Implementation:**
- Writing React components
- Optimizing component performance
- Managing state in UI
- Implementing TypeScript patterns

**Standards Enforcement:**
- Preventing hardcoded hex colors
- Enforcing semantic color tokens
- Validating design system compliance
- Checking UX law violations

---

## Maintenance

**Last Updated:** 2026-02-02
**Total Resources:** 18 markdown files
**Total Size:** 308 KB
**Skill Version:** 1.0

For foundational philosophy and decision-making framework, see `SKILL.md` (Sienna Protocol).
