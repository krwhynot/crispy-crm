---
name: ui-ux-design-principles
description: Use when designing UI, auditing UI/UX, choosing colors, implementing buttons/forms, or making layout decisions. Covers WCAG 2.1 AA form accessibility (aria-invalid, role="alert", aria-describedby, focus management), UX laws (Fitts, Hick, Jakob), color theory (60-30-10), touch targets (44px). Prevents hardcoded hex, accessibility violations, missing ARIA attributes.
---

# UI/UX Design Principles

## Overview

Systematic framework for making UI/UX decisions grounded in cognitive science and user experience laws. Provides **universal principles** with project-specific implementation in resource files.

**Core Mission:** Design experiences that are fast under pressure, effortless under fatigue, predictable by pattern, and emotionally confident.

## The Sienna Protocol

Every UI/UX decision follows this structured approach:

### 1. Cognitive Audit
Identify context: **Who** (role, expertise), **Where** (device, environment), **What** (task goals, pain points), **Which laws** apply (see UX Laws reference below).

### 2. Strategy Selection

| Strategy | Focus | Best For |
|----------|-------|----------|
| **A - Familiar Efficiency** | Low learning curve, speed | Power users, CRM/Excel veterans |
| **B - Progressive Clarity** | Reduced cognitive load | New users, complex onboarding |
| **C - Hybrid Field Resilience** | High contrast, large targets | Field use, tablets, challenging environments |
| **D - Behavioral Momentum** | Habit loops, reinforcement | Repetitive workflows |

**Default:** Strategy C balances accessibility, speed, and adaptability.

### 3. Decision Matrix
Score criteria (1-5) weighted by importance. Redesign if Accessibility < 4, Usability < 3, Speed < 3, or 3+ criteria < 4.

**See:** [Decision Matrix Guide](resources/decision-matrix-guide.md) for scoring details and case studies.

### 4. Implementation Spec
Output concrete code with exact CSS/Tailwind classes, ARIA attributes, responsive breakpoints, and feedback patterns.

## Quick Reference

| Topic | Resource | Key Rules |
|-------|----------|-----------|
| **UX Laws** | [resources/ux-laws-reference.md](resources/ux-laws-reference.md) | Fitts (44px targets), Hick (5-7 choices), Doherty (<400ms feedback), Jakob (familiar patterns), Miller (chunk to ~7 items), Tesler (push complexity to system), Von Restorff (accent sparingly for CTAs), Peak-End (end flows with confirmation), Gestalt: Proximity/Similarity/Continuity |
| **Accessibility** | `.claude/rules/CODE_QUALITY.md` (always loaded) | `aria-invalid`, `aria-describedby`, `role="alert"`, `aria-required`, focus management |
| **Form Patterns** | [resources/form-patterns.md](resources/form-patterns.md) | Field grouping, validation timing, error handling |
| **Colors** | [resources/color-system.md](resources/color-system.md), [resources/color-status-semantic.md](resources/color-status-semantic.md) | 60-30-10 rule, semantic tokens, no hardcoded hex |
| **Touch & Animation** | [resources/tokens-touch-animation.md](resources/tokens-touch-animation.md) | 44px minimum, easing curves, reduced motion |
| **Component Architecture** | [resources/component-architecture.md](resources/component-architecture.md) | Three-tier (Atoms, Molecules, Organisms) |
| **Data Tables** | [resources/data-tables.md](resources/data-tables.md) | Sortable columns, pagination, keyboard nav |
| **Typography** | [resources/typography.md](resources/typography.md) | Font hierarchy, line height, weight scales |

## Response Format

When answering UI/UX questions, structure responses as:

1. **Cognitive Audit** (2-4 sentences) — Context, friction points, UX laws at stake
2. **Strategy Recommendation** — Choose A/B/C/D with rationale
3. **Implementation Spec** — Concrete code, ARIA attributes, responsive considerations, feedback patterns

## Pre-Commit Checklist

- [ ] Touch targets >= 44px on all screen sizes
- [ ] No hardcoded colors (hex, rgb, hsl)
- [ ] ARIA labels on interactive elements (`aria-invalid`, `aria-describedby`, `role="alert"`)
- [ ] All inputs have associated `<label htmlFor={id}>` or `aria-label`
- [ ] Required fields have `aria-required="true"`
- [ ] Focus moves to first error on submit failure
- [ ] Keyboard navigation works (Tab order, Enter/Space)
- [ ] Feedback on all actions (<400ms)
- [ ] Tested on primary target device

## Resource Navigation

This skill includes **18 detailed resource files** (308 KB). For a categorized index, see **AGENTS.md**:

- **Colors & branding** → `resources/color-*.md`, `color-system.md`
- **Component patterns** → `resources/form-patterns.md`, `data-tables.md`, `component-architecture.md`
- **Layout & spacing** → `resources/dashboard-layouts.md`, `tokens-spacing-grid.md`, `elevation.md`
- **Implementation** → `resources/react-performance.md`, `typescript-patterns.md`, `state-management.md`
- **UX decision-making** → `resources/decision-matrix-guide.md`, `ux-laws-reference.md`

## Core Beliefs

- **Design is a system, not an aesthetic**
- **Every pixel must serve cognition or confidence**
- **Accessibility and speed are fundamentals, not features**
- **We don't redesign for beauty; we redesign for measurable improvement**
- **Familiarity reduces friction; innovation must earn its cost**

---

**Cross-Reference:** `enforcing-principles` skill for error handling, Zod validation, form state management, testing patterns.
