---
description: Quick reference for Atomic CRM design system patterns - Tailwind v4 utilities, iPad-optimized responsive, touch targets, and JSONB arrays
---

# Atomic CRM Design System Quick Reference

You are implementing UI features in Atomic CRM. Follow these design system patterns:

## 🎨 Tailwind v4 Semantic Colors (Most Important)

**❌ NEVER use inline CSS variable syntax:**
```typescript
// WRONG - will break design system
className="text-[color:var(--text-subtle)] bg-[var(--warning)]"
```

**✅ ALWAYS use semantic utility classes:**

| Use This | Not This |
|----------|----------|
| `text-foreground` | `text-[color:var(--text-primary)]` |
| `text-muted-foreground` | `text-[color:var(--text-subtle)]` |
| `bg-primary` | `bg-[var(--brand-500)]` |
| `bg-warning` | `bg-[var(--warning-default)]` |
| `bg-destructive` | `bg-[var(--destructive)]` |
| `border-border` | `border-[color:var(--stroke-card)]` |
| `shadow-md` | `shadow-[var(--elevation-2)]` |

**Never use hex codes:** `#FF6600`, `#FEFEF9`, etc.

## 📱 iPad-Optimized Responsive Design

**Primary viewport:** iPad (768px-1024px)

**Pattern:**
```typescript
// Base (mobile) → md: (iPad optimized) → lg: (desktop)
className="grid-cols-1 md:grid-cols-3 lg:grid-cols-4"
className="p-4 md:p-6 lg:p-8"
className="text-sm md:text-base lg:text-lg"
```

**Breakpoint Strategy:**
- Design and test on iPad viewport FIRST (768px-1024px)
- Optimize `md:` breakpoint for iPad portrait
- Test `lg:` for iPad landscape
- Adapt down to mobile (base styles)
- Enhance up to desktop (`xl:`)

## 👆 Touch Targets (Non-Negotiable)

**Minimum:** 44x44px (Apple HIG)

```typescript
// Interactive elements - icons, buttons, etc.
className="w-11 h-11 md:w-12 md:h-12"  // 44px → 48px

// Icon sizing inside containers
<Icon className="w-6 h-6 md:w-8 md:h-8" />

// Padding for touch-friendly cards
className="p-4 md:p-6 lg:p-8"
```

**No exceptions:** 40px is NOT "acceptable, slightly under"

## 🗃️ JSONB Array Pattern (Email/Phone/Websites)

**When adding array fields:**

1. **Database Migration:**
```sql
ALTER TABLE contacts ADD COLUMN websites JSONB DEFAULT '[]'::jsonb;
```

2. **Zod Sub-Schema:**
```typescript
// src/atomic-crm/validation/contacts.ts
export const websiteTypeSchema = z.enum(["Personal", "Company", "Portfolio"]);

export const websiteAndTypeSchema = z.object({
  url: z.string().url("Invalid URL"),
  type: websiteTypeSchema.default("Company"),
});

const contactSchema = z.object({
  websites: z.array(websiteAndTypeSchema).default([]),
});
```

3. **Form Component:**
```typescript
<ArrayInput source="websites" label="Websites" helperText={false}>
  <SimpleFormIterator inline disableReordering disableClear>
    <TextInput source="url" placeholder="Website URL" />
    <SelectInput source="type" choices={websiteTypes} />
    {/* NO defaultValue - Zod handles it */}
  </SimpleFormIterator>
</ArrayInput>
```

**Key Rules:**
- Defaults in Zod (`.default()`), NOT in form components
- Sub-schema for array items
- Empty array default: `.default([])`

## ♿ Accessibility Checklist

- [ ] Touch targets ≥ 44px
- [ ] Color contrast WCAG AA (4.5:1)
- [ ] Semantic HTML (`<button>` not `<div onClick>`)
- [ ] All inputs have labels (visible or `sr-only`)
- [ ] Keyboard navigation works (Tab, Enter, Space)

## 🚫 Red Flags - STOP

If you catch yourself:
- Using `text-[color:var(...)]` → Use semantic utility
- Accepting 40px touch targets → Must be 44px minimum
- Not testing on iPad viewport → Primary target is iPad
- Setting `defaultValue` in form → Put in Zod schema
- Using hex codes → Use semantic utilities

## 📚 Full Reference

For complete patterns, see: `.claude/skills/ui-design-consistency/SKILL.md`

---

**Now proceed with your UI implementation following these patterns.**
