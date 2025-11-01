---
name: atomic-crm-ui-design
description: Use when implementing UI features in Atomic CRM - enforces design system consistency with Tailwind v4 semantic utilities, iPad-first responsive design, JSONB array patterns, and accessibility standards before writing component code
---

# Atomic CRM UI Design Consistency

## Overview

Enforce Atomic CRM's design system when implementing UI components. Prevents common violations: inline CSS variable syntax, mobile-first when iPad-first is required, touch targets below 44px, and wrong JSONB array patterns.

**Core principle:** Follow established patterns from CLAUDE.md and validate against design system before writing code.

## When to Use

Use this skill when:
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
- [ ] Identify target viewport: iPad-first or mobile-first?
- [ ] List all colors needed: check if semantic utilities exist
- [ ] Touch targets: will any interactive elements be < 44px?
- [ ] Form inputs: any JSONB arrays needing sub-schemas?

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

### 2. iPad-First Responsive Design

**Requirement:** Design for iPad viewport (768px-1024px) as base, then adapt.

**❌ WRONG - Mobile-First for iPad-Primary App:**
```typescript
// Starts mobile, adapts up to tablet
className="grid-cols-1 md:grid-cols-3"
```

**✅ CORRECT - iPad-First:**
```typescript
// Base is iPad (md), adapt down for mobile, up for desktop
className="grid-cols-3 sm:grid-cols-1 xl:grid-cols-4"
```

**iPad-First Strategy:**

1. **Base styles** = iPad portrait (768px)
2. **`sm:` prefix** = Mobile (smaller than iPad)
3. **`lg:` or `xl:` prefix** = Large desktop (larger than iPad)

**Touch-Friendly Requirements:**
- Minimum tap target: `w-11 h-11` (44px - Apple HIG)
- Text base size: 14px minimum (`text-sm`)
- Padding: generous for fat-finger taps

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

### 4. Accessibility Non-Negotiables

**Minimum requirements:**
- Touch targets: **44x44px minimum** (no "acceptable at 40px")
- Color contrast: WCAG AA (4.5:1 for text)
- Semantic HTML: `<button>` not `<div onClick>`
- Labels: All form inputs have labels (visible or sr-only)
- Keyboard nav: Tab order logical, Enter/Space work

**React Admin provides:** FormField (role="group"), FormLabel (htmlFor), FormError (aria-invalid)

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
| "Slightly under 44px is acceptable" | NO. 44px is minimum. Use `w-11 h-11` base. |
| "Mobile-first works on iPad" | iPad-first means iPad as BASE, not target. |
| `text-[color:var(--text-subtle)]` | Use `text-muted-foreground` semantic utility. |
| `defaultValue` in form component | Defaults go in Zod schema (`.default()`). |
| Hardcoded dropdown choices | Use `ConfigurationContext` for customizable values. |
| Research instead of implement | "Create X" means build it, not document existing X. |

## Implementation Workflow

**1. Verify Requirements**
- iPad-first or mobile-first?
- What colors/spacing needed?
- JSONB arrays involved?

**2. Check CLAUDE.md Patterns**
- Color System section
- JSONB Array Handling Pattern
- Validation Layer section

**3. Write Code Following Patterns**
- Tailwind semantic utilities
- Proper responsive breakpoints
- Zod schemas for validation
- React Admin components

**4. Verify Before Committing**
- Touch targets ≥ 44px
- No inline CSS variables
- Responsive breakpoints test in browser
- Accessibility: keyboard nav works

## Red Flags - STOP and Verify

If you find yourself:
- Using `className="text-[color:var(...)]"` → Wrong Tailwind syntax
- Starting with `grid-cols-1` for iPad-first app → Wrong base breakpoint
- Accepting 40px touch targets → Below minimum
- Setting `defaultValue` in form → Defaults go in Zod
- Researching existing code instead of implementing → Wrong mode

**All of these mean:** Review this skill and CLAUDE.md before proceeding.

## Real-World Impact

**Following these patterns:**
- Consistent design system (users recognize Atomic CRM UI)
- Maintainable code (future devs find patterns quickly)
- Accessible (meets WCAG AA, works with assistive tech)
- iPad-optimized (primary sales tool works perfectly)
- Type-safe (Zod validation catches errors early)

**Violations create:**
- Visual inconsistency (hex codes bypass design tokens)
- Poor iPad UX (mobile-first on tablet feels cramped)
- Accessibility failures (small touch targets, poor contrast)
- Bugs (missing validation, wrong form initialization)
