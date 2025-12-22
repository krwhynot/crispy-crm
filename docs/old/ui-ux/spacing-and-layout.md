# Spacing and Layout

> **For:** UI developers working on Crispy CRM
> **Created:** 2025-12-15
> **Platform:** Desktop-first (1440px+), iPad-optimized

---

## Industry Standards

### Material Design 3 - Density and Spacing
**Source:** [Material Design - Applying Density](https://m2.material.io/design/layout/applying-density.html)

Material Design recommends:
- **Default density** provides comfortable reading with generous spacing
- **Higher density** (compact mode) reduces spacing via props like `margin: 'dense'` and `size: 'small'`
- Use dense layouts for data-heavy views where more information needs to be visible
- Maintain minimum touch targets even in dense mode

**Our Application:** Desktop-first CRM with dense datagrid views but comfortable form spacing.

### WCAG 2.2 SC 1.4.12 - Text Spacing
**Source:** [WCAG 2.2 - Text Spacing](https://www.w3.org/TR/WCAG22/#text-spacing)

Users must be able to set:
- Line height to at least 1.5x the font size
- Paragraph spacing to at least 2x the font size
- Letter spacing to at least 0.12x the font size
- Word spacing to at least 0.16x the font size

**Our Implementation:** Tailwind's default `leading-normal` (1.5) meets this requirement. Paragraph spacing enforced via `space-y-*` utilities.

### Touch Target Guidelines
**Source:** WCAG 2.5.5 Target Size (Level AAA)

- Minimum touch target: 44x44px (iOS/WCAG AAA)
- Desktop click targets: 24x24px minimum
- Crispy CRM standard: **44x44px** (iPad-optimized)

---

## Our Implementation

### Tailwind Spacing Scale
Crispy CRM uses Tailwind's spacing scale (1 unit = 0.25rem = 4px):

| Class | Size | Use Case |
|-------|------|----------|
| `gap-1` / `space-y-1` | 4px | Tight spacing (icon + text) |
| `gap-2` / `space-y-2` | 8px | **Minimum clickable element spacing** |
| `gap-3` / `space-y-3` | 12px | Related items |
| `gap-4` / `space-y-4` | 16px | **Form field spacing** |
| `gap-6` / `space-y-6` | 24px | **Form section padding** |
| `gap-8` / `space-y-8` | 32px | **Section separation** |
| `gap-12` / `space-y-12` | 48px | Page-level separation |

### Touch Targets
All interactive elements use **minimum 44x44px** (Tailwind: `h-11 w-11` = 44px):

```tsx
// Button heights (from button.constants.ts)
size: {
  default: "h-12 px-6 py-2",  // 48px height (exceeds minimum)
  sm: "h-12 px-4",            // 48px height
  lg: "h-12 px-8",            // 48px height
  icon: "size-12",            // 48px × 48px
}
```

**Note:** Crispy CRM uses `h-12` (48px) for buttons, exceeding the 44px minimum for better ergonomics.

---

## Patterns

### Minimum Spacing Between Elements

#### Clickable Elements
**Rule:** Minimum `gap-2` (8px) between buttons, links, and interactive controls to prevent mis-taps.

```tsx
// ✅ CORRECT - Adequate spacing
<div className="flex gap-2">
  <Button>Save</Button>
  <Button variant="outline">Cancel</Button>
</div>

// ❌ WRONG - No spacing (can cause mis-taps)
<div className="flex">
  <Button>Save</Button>
  <Button variant="outline">Cancel</Button>
</div>
```

**From codebase:** `FormToolbar` uses `gap-2` for button groups (simple-form.tsx:35).

#### Form Fields
**Rule:** Minimum `gap-4` (16px) vertical spacing between form fields for readability.

```tsx
// ✅ CORRECT - SimpleForm pattern
<Form className="flex flex-col gap-4 w-full max-w-lg">
  <TextInput source="first_name" />
  <TextInput source="last_name" />
  <TextInput source="email" />
</Form>

// ❌ WRONG - Too tight
<Form className="flex flex-col gap-1">
  <TextInput source="first_name" />
  <TextInput source="last_name" />
</Form>
```

**From codebase:** `SimpleForm` default is `gap-4` (simple-form.tsx:19).

#### Grid Layouts
**Rule:** Use `gap-x-6 gap-y-5` (24px horizontal, 20px vertical) for form grids.

```tsx
// ✅ CORRECT - FormGrid pattern
<FormGrid columns={2} className="gap-x-6 gap-y-5">
  <TextInput source="first_name" />
  <TextInput source="last_name" />
  <TextInput source="email" />
  <TextInput source="phone" />
</FormGrid>

// ❌ WRONG - Inconsistent spacing
<div className="grid grid-cols-2 gap-2">
  <TextInput source="first_name" />
  <TextInput source="last_name" />
</div>
```

**From codebase:** `FormGrid` uses `gap-x-6 gap-y-5` (FormGrid.tsx:18-19).

---

### Container Padding Standards

#### Page Containers
**Desktop:** `p-6` (24px)
**Tablet:** `p-4` (16px)
**Responsive:** `p-4 md:p-6`

```tsx
// ✅ CORRECT - Responsive padding
<div className="p-4 md:p-6">
  <h1>Contacts</h1>
  {/* Content */}
</div>

// ❌ WRONG - Fixed padding
<div className="p-8">
  <h1>Contacts</h1>
</div>
```

#### Card Content
**Rule:** Use `p-4` or `p-6` depending on card density.

```tsx
// ✅ CORRECT - Card with breathing room
<Card>
  <CardHeader className="p-6">
    <CardTitle>Contact Details</CardTitle>
  </CardHeader>
  <CardContent className="p-6 space-y-4">
    {/* Fields */}
  </CardContent>
</Card>

// ❌ WRONG - No padding
<Card>
  <CardHeader>
    <CardTitle>Contact Details</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Fields crushed against edges */}
  </CardContent>
</Card>
```

#### Form Sections
**Rule:** Use `space-y-4` for internal field spacing, `space-y-8` between sections.

```tsx
// ✅ CORRECT - Section spacing
<form className="space-y-8">
  <section className="space-y-4">
    <h2>Personal Information</h2>
    <TextInput source="first_name" />
    <TextInput source="last_name" />
  </section>

  <section className="space-y-4">
    <h2>Contact Information</h2>
    <TextInput source="email" />
    <TextInput source="phone" />
  </section>
</form>

// ❌ WRONG - No section separation
<form className="space-y-4">
  <h2>Personal Information</h2>
  <TextInput source="first_name" />
  <h2>Contact Information</h2>
  <TextInput source="email" />
</form>
```

---

### When to Use gap-* vs space-y-*

#### gap-* (Preferred for Flex/Grid)
**When:** Using `display: flex` or `display: grid`
**Why:** Respects wrapping, cleaner syntax, no margin collapsing issues

```tsx
// ✅ CORRECT - Flex with gap
<div className="flex flex-col gap-4">
  <TextInput source="field1" />
  <TextInput source="field2" />
  <TextInput source="field3" />
</div>

// ✅ CORRECT - Grid with gap
<div className="grid grid-cols-2 gap-x-6 gap-y-4">
  <TextInput source="field1" />
  <TextInput source="field2" />
</div>
```

#### space-y-* (Simple Stacks)
**When:** Stacking block-level elements without flex/grid
**Why:** Simpler syntax for basic vertical stacks

```tsx
// ✅ CORRECT - Simple stack
<div className="space-y-4">
  <p>Paragraph 1</p>
  <p>Paragraph 2</p>
  <p>Paragraph 3</p>
</div>

// ❌ WRONG - Overkill for simple stack
<div className="flex flex-col gap-4">
  <p>Paragraph 1</p>
  <p>Paragraph 2</p>
</div>
```

**Decision Matrix:**

| Scenario | Use | Reason |
|----------|-----|--------|
| Form with multiple inputs | `gap-4` | Flex column, consistent spacing |
| Text paragraphs | `space-y-4` | Block-level, no flex needed |
| Button group (horizontal) | `gap-2` | Flex row, respects wrapping |
| Grid layout | `gap-x-* gap-y-*` | Grid-specific, independent axes |

---

### Safe Area Handling for iPad

#### Bottom Safe Area (Home Indicator)
**Rule:** Add `pb-safe` or manual padding for bottom-fixed elements.

```tsx
// ✅ CORRECT - Safe area padding
<div className="fixed bottom-0 pb-safe">
  <FormToolbar />
</div>

// Alternative: Manual calculation
<div className="fixed bottom-0" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
  <FormToolbar />
</div>

// ❌ WRONG - Overlaps home indicator
<div className="fixed bottom-0">
  <FormToolbar />
</div>
```

#### Notch Area (Top Safe Area)
**Rule:** Use `pt-safe` for fullscreen views or header elements.

```tsx
// ✅ CORRECT - Respects notch
<header className="fixed top-0 w-full pt-safe bg-background">
  <h1>Crispy CRM</h1>
</header>

// ❌ WRONG - Obscured by notch
<header className="fixed top-0 w-full bg-background">
  <h1>Crispy CRM</h1>
</header>
```

**Note:** Most Crispy CRM views are not fullscreen, so safe areas are primarily relevant for modal dialogs and slide-overs.

---

### Maximum Content Width Constraints

#### Prose Content (Readability)
**Rule:** Use `max-w-prose` (65ch) for long-form text.

```tsx
// ✅ CORRECT - Readable line length
<div className="max-w-prose">
  <p>Long paragraph of text that should not extend beyond 65 characters...</p>
</div>

// ❌ WRONG - Lines too long (eye strain)
<div className="w-full">
  <p>Long paragraph of text that extends across entire viewport on wide screens...</p>
</div>
```

#### Forms
**Rule:** Use `max-w-lg` (512px) or `max-w-2xl` (672px) for form containers.

```tsx
// ✅ CORRECT - Form with max width (from simple-form.tsx)
<Form className="flex flex-col gap-4 w-full max-w-lg">
  <TextInput source="first_name" />
  <TextInput source="last_name" />
</Form>

// ❌ WRONG - Form too wide
<Form className="w-full">
  <TextInput source="first_name" />
</Form>
```

**From codebase:** `SimpleForm` default is `max-w-lg` (simple-form.tsx:19).

#### Tables and Datagrids
**Rule:** No max-width constraint. Use full viewport width.

```tsx
// ✅ CORRECT - Full-width datagrid
<Datagrid className="w-full">
  <TextField source="name" />
  <EmailField source="email" />
  <DateField source="created_at" />
</Datagrid>

// ❌ WRONG - Constrained table (wastes space)
<Datagrid className="max-w-2xl">
  <TextField source="name" />
</Datagrid>
```

**Max-width Decision Matrix:**

| Content Type | Max Width | Tailwind Class | Pixels |
|--------------|-----------|----------------|--------|
| Prose text | 65 characters | `max-w-prose` | ~650px |
| Simple forms | Medium | `max-w-lg` | 512px |
| Complex forms | Large | `max-w-2xl` | 672px |
| Tables/Datagrids | None | (omit) | 100vw |
| Modal dialogs | Extra Large | `max-w-4xl` | 896px |

---

## Examples

### ❌ Violation: No Spacing Between Buttons

```tsx
// ❌ WRONG - Buttons crushed together
export function MyForm() {
  return (
    <div className="flex justify-end">
      <Button>Save</Button>
      <Button variant="outline">Cancel</Button>
    </div>
  );
}
```

**Problem:** No `gap-*` between buttons. Users may accidentally tap wrong button on iPad.

### ✅ Correct: Adequate Button Spacing

```tsx
// ✅ CORRECT - gap-2 prevents mis-taps
export function MyForm() {
  return (
    <div className="flex justify-end gap-2">
      <Button>Save</Button>
      <Button variant="outline">Cancel</Button>
    </div>
  );
}
```

**Why:** `gap-2` (8px) provides clear separation for touch targets.

---

### ❌ Violation: Raw Pixel Values

```tsx
// ❌ WRONG - Raw px values bypass design system
export function MyForm() {
  return (
    <div style={{ padding: '12px', marginBottom: '20px' }}>
      <TextInput source="name" />
    </div>
  );
}
```

**Problem:** Hard-coded pixels don't scale with Tailwind theme, break responsive design.

### ✅ Correct: Tailwind Spacing Scale

```tsx
// ✅ CORRECT - Tailwind spacing scale
export function MyForm() {
  return (
    <div className="p-3 mb-5">
      <TextInput source="name" />
    </div>
  );
}
```

**Why:** `p-3` (12px) and `mb-5` (20px) use design system tokens, scale consistently.

---

### ❌ Violation: Form Fields Too Tight

```tsx
// ❌ WRONG - Fields crushed together
export function ContactForm() {
  return (
    <Form className="flex flex-col gap-1">
      <TextInput source="first_name" label="First Name" />
      <TextInput source="last_name" label="Last Name" />
      <TextInput source="email" label="Email" />
      <TextInput source="phone" label="Phone" />
    </Form>
  );
}
```

**Problem:** `gap-1` (4px) is too tight. User's eye can't distinguish field boundaries.

### ✅ Correct: Comfortable Field Spacing

```tsx
// ✅ CORRECT - gap-4 for readability
export function ContactForm() {
  return (
    <Form className="flex flex-col gap-4 w-full max-w-lg">
      <TextInput source="first_name" label="First Name" />
      <TextInput source="last_name" label="Last Name" />
      <TextInput source="email" label="Email" />
      <TextInput source="phone" label="Phone" />
    </Form>
  );
}
```

**Why:** `gap-4` (16px) provides breathing room. `max-w-lg` prevents form from being too wide.

---

### ❌ Violation: Touch Target Too Small

```tsx
// ❌ WRONG - Icon button too small for iPad
export function MyToolbar() {
  return (
    <button className="p-1">
      <X className="h-4 w-4" />
    </button>
  );
}
```

**Problem:** `p-1` (4px) + 16px icon = 24x24px total. Below 44px minimum.

### ✅ Correct: iPad-Safe Touch Target

```tsx
// ✅ CORRECT - 48x48px touch target
export function MyToolbar() {
  return (
    <Button variant="ghost" size="icon">
      <X className="h-4 w-4" />
    </Button>
  );
}
```

**Why:** `size="icon"` = `size-12` (48px). Exceeds 44px minimum, comfortable for iPad.

---

### ❌ Violation: No Section Separation

```tsx
// ❌ WRONG - Sections blur together
export function OpportunityForm() {
  return (
    <form className="space-y-4">
      <h2>Basic Information</h2>
      <TextInput source="name" />
      <TextInput source="stage" />

      <h2>Principal Details</h2>
      <ReferenceInput source="principal_id" reference="organizations">
        <AutocompleteInput />
      </ReferenceInput>
      <TextInput source="products" />
    </form>
  );
}
```

**Problem:** Headings mixed with fields. No visual hierarchy.

### ✅ Correct: Clear Section Boundaries

```tsx
// ✅ CORRECT - space-y-8 between sections
export function OpportunityForm() {
  return (
    <form className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Basic Information</h2>
        <TextInput source="name" />
        <TextInput source="stage" />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Principal Details</h2>
        <ReferenceInput source="principal_id" reference="organizations">
          <AutocompleteInput />
        </ReferenceInput>
        <TextInput source="products" />
      </section>
    </form>
  );
}
```

**Why:** `space-y-8` (32px) between sections, `space-y-4` (16px) within sections. Clear hierarchy.

---

### ❌ Violation: Form Too Wide

```tsx
// ❌ WRONG - Form extends full viewport width
export function ContactCreate() {
  return (
    <Create>
      <SimpleForm className="w-full">
        <TextInput source="first_name" />
        <TextInput source="last_name" />
        <TextInput source="email" />
      </SimpleForm>
    </Create>
  );
}
```

**Problem:** On 1440px+ screens, form inputs become comically wide. Hard to scan.

### ✅ Correct: Constrained Form Width

```tsx
// ✅ CORRECT - max-w-lg for comfortable reading
export function ContactCreate() {
  return (
    <Create>
      <SimpleForm className="flex flex-col gap-4 w-full max-w-lg">
        <TextInput source="first_name" />
        <TextInput source="last_name" />
        <TextInput source="email" />
      </SimpleForm>
    </Create>
  );
}
```

**Why:** `max-w-lg` (512px) keeps form compact and scannable. Default pattern from `simple-form.tsx`.

---

## Checklist

Before committing UI changes, verify:

### Spacing
- [ ] Minimum `gap-2` (8px) between clickable elements
- [ ] `gap-4` (16px) vertical spacing between form fields
- [ ] `gap-x-6 gap-y-5` for form grids (if using FormGrid)
- [ ] `space-y-8` (32px) between form sections
- [ ] `space-y-4` (16px) within sections

### Touch Targets
- [ ] All buttons/icons are minimum `h-11 w-11` (44px)
- [ ] Interactive elements have adequate spacing (`gap-2` minimum)
- [ ] No overlapping tap zones on iPad

### Containers
- [ ] Page containers use `p-4 md:p-6` responsive padding
- [ ] Cards use `p-4` or `p-6` for content
- [ ] Forms have `max-w-lg` or `max-w-2xl` constraint
- [ ] Tables/datagrids have NO max-width constraint

### Safe Areas (iPad)
- [ ] Bottom-fixed elements use `pb-safe` or manual padding
- [ ] Fullscreen views respect `pt-safe` for notch

### Semantic Classes Only
- [ ] NO raw pixel values (`style={{ padding: '12px' }}`)
- [ ] NO hard-coded hex colors
- [ ] Use Tailwind spacing scale (`gap-*`, `p-*`, `m-*`, `space-*`)
- [ ] Use semantic color tokens (`text-muted-foreground`, `bg-primary`)

### Responsive Behavior
- [ ] Desktop (1440px+): Comfortable spacing, not too loose
- [ ] iPad (1024px): Touch-friendly targets, adequate spacing
- [ ] Form widths constrained for readability on large screens

---

## Quick Reference

### Common Spacing Patterns

```tsx
// Button groups
<div className="flex gap-2">...</div>

// Form fields (vertical stack)
<Form className="flex flex-col gap-4 w-full max-w-lg">...</Form>

// Form grid (2 columns)
<FormGrid columns={2} className="gap-x-6 gap-y-5">...</FormGrid>

// Sections with hierarchy
<div className="space-y-8">
  <section className="space-y-4">...</section>
  <section className="space-y-4">...</section>
</div>

// Card content
<Card>
  <CardHeader className="p-6">...</CardHeader>
  <CardContent className="p-6 space-y-4">...</CardContent>
</Card>

// Form toolbar (sticky bottom)
<FormToolbar className="sticky bottom-0 pt-4 pb-4 px-6">
  <div className="flex gap-2 justify-end">
    <Button variant="outline">Cancel</Button>
    <Button>Save</Button>
  </div>
</FormToolbar>
```

---

## Related Documentation

- [CLAUDE.md](/home/krwhynot/projects/crispy-crm/CLAUDE.md) - Design system overview
- [Form Progress Implementation Guide](/home/krwhynot/projects/crispy-crm/docs/guides/form-progress-implementation-guide.md) - Form UX patterns
- [Material Design - Applying Density](https://m2.material.io/design/layout/applying-density.html)
- [WCAG 2.2 - Text Spacing](https://www.w3.org/TR/WCAG22/#text-spacing)
