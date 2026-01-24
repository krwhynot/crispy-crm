# Design System Index

Central navigation hub for Crispy CRM design documentation.

**Implementation Details:** See [design-system/](../design-system/INDEX.md) for code patterns (forms, filters, badges, typography).

**Target Devices:** Desktop (1440px+) & iPad (equal priority) for field sales representatives.

---

## Quick Links

| Resource | Path | Description |
|----------|------|-------------|
| Color System | [`.claude/skills/ui-ux-design-principles/resources/color-system.md`](../../.claude/skills/ui-ux-design-principles/resources/color-system.md) | OKLCH semantic palette, brand colors, status colors |
| Design Tokens | [`.claude/skills/ui-ux-design-principles/resources/design-tokens.md`](../../.claude/skills/ui-ux-design-principles/resources/design-tokens.md) | Spacing scale, grid system, touch targets |
| Typography | [`.claude/skills/ui-ux-design-principles/resources/typography.md`](../../.claude/skills/ui-ux-design-principles/resources/typography.md) | Font hierarchy, text colors, heading patterns |
| Component Catalog | [`./COMPONENT-CATALOG.md`](./COMPONENT-CATALOG.md) | UI component inventory and usage patterns |
| Accessibility | [`./ACCESSIBILITY.md`](./ACCESSIBILITY.md) | WCAG 2.1 AA compliance, ARIA patterns |
| Interaction Patterns | [`./INTERACTION-PATTERNS.md`](./INTERACTION-PATTERNS.md) | Hover states, focus management, animations |
| Responsive Specs | [`./RESPONSIVE-SPECS.md`](./RESPONSIVE-SPECS.md) | Breakpoints, iPad layouts, touch optimization |
| User Flows | [`./USER-FLOWS.md`](./USER-FLOWS.md) | Key user journeys, navigation patterns |

---

## Design Principles

1. **iPad-First Touch Targets:** All interactive elements must be 44x44px minimum (h-11 w-11). Primary CTAs use 48px (h-12 w-12) for comfortable tablet use.

2. **Semantic Colors Only:** Never use raw hex, OKLCH, or Tailwind color utilities (text-gray-500). Always use semantic tokens: `bg-primary`, `text-muted-foreground`, `border-destructive`.

3. **Fail-Fast UI:** Errors surface immediately with clear messaging. No silent failures, no loading spinners without timeout feedback. Form validation at API boundary only.

4. **Principal-First Visibility:** Design prioritizes answering "What is the ONE thing I need to do this week for each principal?" within 2 seconds.

---

## Related Resources

| Resource | Path | Description |
|----------|------|-------------|
| Implementation Patterns | [`../design-system/INDEX.md`](../design-system/INDEX.md) | Developer-focused technical specs (forms, filters, badges) |
| UI/UX Audit Report | [`../archive/audits/ui-ux/FINAL-AUDIT-REPORT.md`](../archive/audits/ui-ux/FINAL-AUDIT-REPORT.md) | Comprehensive audit findings (93 violations identified) |
| Technical Debt | [`../technical-debt.md`](../technical-debt.md) | Prioritized fix list with open/resolved status |
| Dashboard Reference | [`../features/dashboard-reference.md`](../features/dashboard-reference.md) | Principal dashboard widget specifications |
| Decisions Log | [`../decisions.md`](../decisions.md) | Architectural decisions affecting UI/UX |

---

## Quick Reference: Semantic Color Classes

### Backgrounds

| Class | Usage |
|-------|-------|
| `bg-background` | Page background (warm cream) |
| `bg-card` | Content containers (white, elevated) |
| `bg-muted` | Secondary sections, disabled states |
| `bg-primary` | Primary action buttons |
| `bg-secondary` | Secondary action buttons |
| `bg-destructive` | Delete/error actions |
| `bg-accent` | Hover highlights, emphasis |

### Text

| Class | Usage |
|-------|-------|
| `text-foreground` | Primary text (high contrast) |
| `text-muted-foreground` | Secondary text, labels, metadata |
| `text-primary` | Brand-colored text (forest green) |
| `text-destructive` | Error messages |
| `text-primary-foreground` | Text on primary background |

### Borders

| Class | Usage |
|-------|-------|
| `border-border` | Default borders (subtle) |
| `border-primary` | Focus rings, active states |
| `border-destructive` | Error state borders |
| `border-input` | Form input borders |

### Status Indicators

| Class | Usage |
|-------|-------|
| `text-success` / `bg-success` | Success states, positive trends |
| `text-warning` / `bg-warning` | Warning states, attention needed |
| `text-destructive` / `bg-destructive` | Error states, critical alerts |

---

## Touch Target Reference

| Size | Tailwind | Usage |
|------|----------|-------|
| 44px | `h-11 w-11` | Minimum for all interactive elements |
| 48px | `h-12 w-12` | Standard buttons, recommended default |
| 56px | `h-14 w-14` | Primary CTAs, FABs |

---

**Last Updated:** 2025-12-30
