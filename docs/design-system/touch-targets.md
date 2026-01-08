# Touch Target Standards

This document defines touch target sizing standards for Crispy CRM, ensuring consistent accessibility across desktop and tablet devices.

## Project Standard

**Minimum touch target size: 44x44px (`h-11 w-11`)**

This aligns with:
- Apple Human Interface Guidelines (44pt minimum)
- WCAG 2.1 AAA Success Criterion 2.5.5 (Target Size)
- Project's iPad-first design philosophy

---

## WCAG Touch Target Requirements

| Standard | Level | Minimum Size | Notes |
|----------|-------|--------------|-------|
| WCAG 2.1 AA | No requirement | - | No SC at AA level |
| WCAG 2.1 AAA (SC 2.5.5) | Required | **44x44px** | Full AAA compliance |
| WCAG 2.2 AA (SC 2.5.8) | Required | **24x24px** | New in WCAG 2.2 |

**Key Insight**: WCAG measures the clickable/touchable area, not just the visible element. However, Crispy CRM chooses to make touch targets **visually** 44px for better UX.

---

## Form Input Heights

### Current Implementation

| Component | Height | Tailwind Class | File |
|-----------|--------|----------------|------|
| Input (default) | 44px | `h-11` | `src/components/ui/input.tsx` |
| SelectTrigger (default) | 44px | `h-11` | `src/components/ui/select.tsx` |
| Input (lg) | 48px | `min-h-[48px]` | Legacy variant |
| SelectTrigger (lg) | 48px | `min-h-[48px]` | Legacy variant |
| Switch | 44px | `h-11` | `src/components/ui/switch.tsx` |
| Textarea | 64px min | `min-h-16` | `src/components/ui/textarea.tsx` |

### Size Variants

```typescript
// Default: 44px touch-friendly (h-11)
<Input />
<SelectTrigger />

// Large: 48px legacy (backward compatibility)
<Input size="lg" />
<SelectTrigger size="lg" />

// Small: 32px compact (for constrained spaces only)
<SelectTrigger size="sm" />
```

### Typography at 44px Height

With the taller 44px inputs:
- Font size: `text-sm` (14px)
- Line height: `leading-normal`
- Padding: `px-3 py-2`
- Border radius: `rounded-md`

---

## Table Row Heights

### Current Behavior

Table rows use `.table-row-premium` with `height: 56px`, but actual rendered height varies based on content:

| Resource | Typical Height | Reason |
|----------|---------------|--------|
| Contacts | ~57px | Avatar (40x40) + padding |
| Tasks | ~57px | Checkbox + multi-line content |
| Organizations | ~38px | Small badges only |
| Products | ~35px | Minimal badge content |
| Activities | Variable | Text content wrapping |

### Why Heights Vary

The CSS `height: 56px` on `<tr>` sets a **minimum**, not a constraint. Table cells (`<td>`) size based on their content plus padding. When cell content is shorter than 56px (e.g., small badges at ~22px), the row doesn't expand to fill.

**This is expected CSS table behavior**, not a bug.

### Options for Uniform Heights

If exact uniform heights are required:

1. **Flexbox cells**: Add `display: flex; align-items: center;` to `<td>`
2. **Min-height on cells**: Apply `min-h-14` (56px) to cell content
3. **Accept variance**: Document that heights vary by content density

Currently, Crispy CRM accepts variance as appropriate for data-dense tables.

---

## Button Touch Targets

All interactive buttons should meet 44px minimum:

| Button Type | Size Class | Touch Target |
|-------------|------------|--------------|
| Primary action | `h-11` | 44px |
| Icon button | `size-11` | 44x44px |
| Floating action | `size-14` | 56x56px |

### Icon-Only Buttons

Icon buttons must be at least 44x44px even if the icon is smaller:

```tsx
// Correct: 44px touch target with smaller icon
<Button size="icon" className="h-11 w-11">
  <PlusIcon className="h-5 w-5" />
</Button>

// Incorrect: Icon determines button size
<Button size="icon">
  <PlusIcon className="h-5 w-5" />
</Button>
```

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-01-08 | Initial documentation; changed inputs from h-8 (32px) to h-11 (44px) | Claude |

---

## References

- [WCAG 2.1 SC 2.5.5 Target Size (AAA)](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)
- [WCAG 2.2 SC 2.5.8 Target Size Minimum (AA)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
- [Apple Human Interface Guidelines - Touch Targets](https://developer.apple.com/design/human-interface-guidelines/accessibility#Touch-targets)
- [Google Material Design - Touch Targets](https://m3.material.io/foundations/accessible-design/accessibility-basics#touch-and-pointer-targets)
