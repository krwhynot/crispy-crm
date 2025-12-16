# Typography and Readability

Comprehensive typography standards for Crispy CRM ensuring accessibility, readability, and consistency across desktop and iPad experiences.

## Industry Standards

### WCAG 2.1 SC 1.4.3 - Contrast (Minimum)
- **Source**: [WCAG 2.1 Contrast Requirements](https://www.w3.org/TR/WCAG21/#contrast-minimum)
- **Normal text** (<18pt): 4.5:1 contrast ratio minimum
- **Large text** (≥18pt or 14pt bold): 3:1 contrast ratio minimum
- **UI components and graphics**: 3:1 contrast ratio minimum

### WCAG 2.1 SC 1.4.12 - Text Spacing
- **Source**: [WCAG 2.1 Text Spacing](https://www.w3.org/TR/WCAG21/#text-spacing)
- **Line height**: ≥1.5x font size for body text
- **Paragraph spacing**: ≥2x font size
- **Content must remain functional** when spacing is increased to these values

### Material Design 3 - Typography
- **Source**: [Material Design 3 Typography](https://m3.material.io/styles/typography/overview)
- **Body text**: 14px-16px base sizes
- **Responsive scaling**: Tablet/desktop defaults to 16px
- **Hierarchical scale**: Display (36-88px) → Headline (24-32px) → Title (14-22px) → Body (12-16px)

### Optimal Line Length
- **Industry consensus**: 45-75 characters per line for comfortable reading
- **Typographic best practice**: ~65 characters optimal (established print standard)

## Our Implementation

Crispy CRM uses **Tailwind v4 semantic color tokens** and **utility classes** to enforce these standards throughout the application.

### Semantic Color Tokens (WCAG Compliant)
- `text-foreground` - Primary text (4.5:1+ contrast)
- `text-muted-foreground` - Secondary text (4.5:1+ contrast)
- `text-destructive` - Error messages (4.5:1+ contrast)
- `text-primary` - Accent text (4.5:1+ contrast)

**NEVER use**: `text-gray-300`, `text-gray-400`, `text-gray-500`, or raw hex values

## Patterns

### Font Size Minimums

#### Body Text
- **Minimum**: `text-sm` (14px / 0.875rem)
- **Preferred**: `text-base` (16px / 1rem)
- **Use case**: Primary content, form inputs, descriptions

#### Small/Helper Text
- **Size**: `text-xs` (12px / 0.75rem)
- **Use case**: Metadata only (timestamps, file sizes, secondary labels)
- **NEVER for**: Primary content, instructions, error messages

#### Headings
- `text-3xl` (30px / 1.875rem) - Page titles
- `text-2xl` (24px / 1.5rem) - Section headers
- `text-xl` (20px / 1.25rem) - Subsection headers
- `text-lg` (18px / 1.125rem) - Card titles, large labels

#### Form Labels
- **Size**: `text-sm` (14px) minimum
- **Class**: `text-sm font-medium text-foreground`

### Line Length Constraints

#### Optimal Reading Width
- **Primary implementation**: `max-w-prose` (~65ch)
- **Use case**: Long-form text, descriptions, help text

#### Alternatives
- `max-w-xl` (36rem) - Shorter content blocks
- `max-w-2xl` (42rem) - Wider reading areas
- **No constraint**: Form labels, table cells, single-line content

```tsx
// Long description
<p className="text-base max-w-prose">
  This paragraph is constrained to optimal reading width...
</p>

// Form helper text
<p className="text-sm text-muted-foreground max-w-xl">
  Brief guidance text for form field.
</p>
```

### Line Height Standards

#### Body Text
- **Default**: `leading-normal` (1.5) - Meets WCAG 1.5x minimum
- **Relaxed**: `leading-relaxed` (1.625) - Enhanced readability
- **Use case**: Paragraphs, descriptions, multi-line content

#### Headings
- **Tight**: `leading-tight` (1.25) - Large headings
- **Snug**: `leading-snug` (1.375) - Medium headings
- **Use case**: Single or two-line headings

#### Dense UI Elements
- **None**: `leading-none` (1.0) - Single-line labels only
- **Use case**: Badges, chips, single-line table cells
- **WARNING**: Never use for multi-line content

```tsx
// Body text with proper line height
<p className="text-base leading-normal">
  Multi-line paragraph content...
</p>

// Heading with tight line height
<h2 className="text-2xl font-semibold leading-tight">
  Section Header
</h2>

// Dense single-line label
<span className="text-sm leading-none">Active</span>
```

### Contrast Requirements

All semantic tokens meet WCAG AA (4.5:1) for normal text.

#### Primary Content
```tsx
<p className="text-foreground">Primary text content</p>
```

#### Secondary/Helper Content
```tsx
<p className="text-muted-foreground">Metadata, timestamps, descriptions</p>
```

#### Error Messages
```tsx
<p className="text-destructive">Validation error text</p>
```

#### Disabled States
```tsx
<button disabled className="text-muted-foreground opacity-50">
  Disabled action
</button>
```

#### VIOLATIONS
```tsx
// ❌ Insufficient contrast
<p className="text-gray-400">Low contrast text</p>

// ❌ Raw color values
<p className="text-[#666666]">Hardcoded gray</p>

// ❌ Non-semantic token
<p className="text-slate-300">Framework-specific color</p>
```

### Truncation Patterns

#### Single-Line Truncation
- **Class**: `truncate` (shorthand for `overflow-hidden text-ellipsis whitespace-nowrap`)
- **Use case**: Table cells, file names, long single-line labels

```tsx
<div className="max-w-xs truncate">
  Very long filename that needs to be truncated.pdf
</div>
```

#### Multi-Line Truncation
- **Classes**: `line-clamp-2`, `line-clamp-3`, `line-clamp-4`
- **Use case**: Card descriptions, list item previews

```tsx
<p className="text-sm text-muted-foreground line-clamp-2">
  Preview text that will be clamped to two lines with an ellipsis...
</p>
```

#### NEVER Truncate
- Form labels
- Error messages
- Success/confirmation messages
- Critical instructions
- Required field indicators
- Accessibility labels (aria-label, alt text)

```tsx
// ❌ WRONG - Error messages must be fully visible
<p className="text-destructive truncate">{errorMessage}</p>

// ✅ CORRECT - Error messages always readable
<p className="text-destructive text-sm">{errorMessage}</p>
```

#### Tables with Truncation
Use tooltips for full content on hover:

```tsx
<td className="max-w-xs">
  <div className="truncate" title={fullText}>
    {fullText}
  </div>
</td>
```

## Examples

### Font Size Violations

#### ❌ WRONG - Text too small for primary content
```tsx
<p className="text-xs text-gray-400">
  Important information about your account settings
</p>
```

**Issues**:
- `text-xs` (12px) too small for primary content
- `text-gray-400` insufficient contrast
- Not using semantic token

#### ✅ CORRECT - Readable size with semantic token
```tsx
<p className="text-base text-foreground">
  Important information about your account settings
</p>
```

**Why**:
- `text-base` (16px) optimal for primary content
- `text-foreground` meets 4.5:1 contrast
- Semantic token ensures theme consistency

### Line Length Violations

#### ❌ WRONG - No line length constraint
```tsx
<div className="w-full">
  <p className="text-base">
    This paragraph spans the entire width of a wide monitor making it extremely
    difficult to read and track which line you're on because the eye has to
    travel too far horizontally which causes fatigue and reduces comprehension
    significantly especially on desktop screens wider than 1920px.
  </p>
</div>
```

**Issues**:
- No max-width constraint
- Line length exceeds 75 characters
- Poor reading experience on wide screens

#### ✅ CORRECT - Optimal reading width
```tsx
<div className="w-full">
  <p className="text-base max-w-prose">
    This paragraph is constrained to approximately 65 characters per line,
    which is the optimal width for comfortable reading and comprehension.
  </p>
</div>
```

**Why**:
- `max-w-prose` constrains to ~65ch
- Comfortable reading experience
- Works across all screen sizes

### Line Height Violations

#### ❌ WRONG - Insufficient line height for multi-line text
```tsx
<p className="text-base leading-tight">
  This is a multi-line paragraph with insufficient line height that makes
  it difficult to distinguish between lines and reduces overall readability.
</p>
```

**Issues**:
- `leading-tight` (1.25) below WCAG 1.5x minimum
- Lines too close together
- Reduced readability

#### ✅ CORRECT - Proper line height for body text
```tsx
<p className="text-base leading-normal">
  This paragraph uses appropriate line height that meets WCAG standards
  and provides comfortable reading experience.
</p>
```

**Why**:
- `leading-normal` (1.5) meets WCAG minimum
- Proper vertical rhythm
- Enhanced readability

### Contrast Violations

#### ❌ WRONG - Poor contrast with hardcoded colors
```tsx
<div className="bg-white">
  <p className="text-gray-300">Barely visible text</p>
  <p className="text-[#999999]">Hardcoded gray text</p>
</div>
```

**Issues**:
- `text-gray-300` insufficient contrast on white
- Hardcoded hex values
- Not theme-aware

#### ✅ CORRECT - Semantic tokens with proper contrast
```tsx
<div className="bg-background">
  <p className="text-foreground">Primary text with 4.5:1+ contrast</p>
  <p className="text-muted-foreground">Secondary text with 4.5:1+ contrast</p>
</div>
```

**Why**:
- Semantic tokens guarantee contrast ratios
- Theme-aware colors
- WCAG AA compliant

### Truncation Violations

#### ❌ WRONG - Truncating critical information
```tsx
<form>
  <label className="truncate text-sm font-medium">
    Email Address (Required)
  </label>
  <p className="text-destructive text-sm truncate">
    {validationError}
  </p>
</form>
```

**Issues**:
- Form label truncated (could hide "Required")
- Error message truncated (user can't read full error)
- Critical information lost

#### ✅ CORRECT - Critical information always visible
```tsx
<form>
  <label className="text-sm font-medium text-foreground">
    Email Address (Required)
  </label>
  <p className="text-destructive text-sm">
    {validationError}
  </p>
</form>
```

**Why**:
- Labels fully visible
- Error messages fully readable
- No information loss

### Complete Form Example

#### ❌ WRONG - Multiple violations
```tsx
<div className="space-y-2">
  <label className="text-xs text-gray-500">
    Enter Your Password
  </label>
  <input
    type="password"
    className="text-xs leading-none"
  />
  <p className="text-xs text-gray-400 truncate">
    Password must be at least 8 characters long and contain special characters
  </p>
</div>
```

**Issues**:
- Label too small (`text-xs`)
- Poor contrast (`text-gray-500`, `text-gray-400`)
- Input text too small
- Insufficient line height
- Helper text truncated

#### ✅ CORRECT - Accessible form field
```tsx
<div className="space-y-2">
  <label className="text-sm font-medium text-foreground">
    Enter Your Password
  </label>
  <input
    type="password"
    className="text-base leading-normal"
    aria-describedby="password-help"
  />
  <p
    id="password-help"
    className="text-sm text-muted-foreground max-w-prose leading-normal"
  >
    Password must be at least 8 characters long and contain special characters
  </p>
</div>
```

**Why**:
- Readable label size (`text-sm`)
- Proper contrast with semantic tokens
- Input text at `text-base` (16px)
- Proper line height
- Helper text fully visible with max-width constraint
- ARIA attributes for accessibility

## Checklist

Use this checklist when implementing or reviewing typography:

### Font Sizes
- [ ] Body text is `text-sm` (14px) minimum, prefer `text-base` (16px)
- [ ] `text-xs` (12px) used ONLY for metadata, never primary content
- [ ] Headings use appropriate scale (`text-lg` to `text-3xl`)
- [ ] Form inputs use `text-base` (16px) minimum
- [ ] Form labels use `text-sm` (14px) minimum

### Line Length
- [ ] Long-form text uses `max-w-prose` (~65ch)
- [ ] Descriptions use `max-w-xl` or `max-w-2xl`
- [ ] No max-width on form labels or single-line content

### Line Height
- [ ] Body text uses `leading-normal` (1.5) or `leading-relaxed` (1.625)
- [ ] Headings use `leading-tight` (1.25) or `leading-snug` (1.375)
- [ ] `leading-none` (1.0) used ONLY for single-line content

### Contrast
- [ ] Using semantic tokens: `text-foreground`, `text-muted-foreground`
- [ ] NO hardcoded colors: `text-gray-*`, `text-[#hex]`
- [ ] Error text uses `text-destructive`
- [ ] All text meets WCAG AA 4.5:1 contrast minimum

### Truncation
- [ ] NOT truncating: form labels, error messages, critical info
- [ ] Single-line truncation uses `truncate` class
- [ ] Multi-line truncation uses `line-clamp-*` classes
- [ ] Tables with truncation include tooltips on hover

### Accessibility
- [ ] Text respects user browser font-size settings (rem-based)
- [ ] Content remains readable when text spacing increased (WCAG 1.4.12)
- [ ] Touch targets minimum 44x44px (`h-11 w-11`)
- [ ] Form fields have `aria-describedby` linking to help/error text
- [ ] Error messages have `role="alert"` for screen readers

## Common Violations Summary

| Violation | Correct Pattern |
|-----------|----------------|
| `text-xs` for primary content | `text-base` or `text-sm` minimum |
| `text-gray-400` | `text-muted-foreground` |
| `text-[#666]` | Semantic color token |
| No `max-w-prose` on paragraphs | `max-w-prose` for readability |
| `leading-tight` on body text | `leading-normal` (meets WCAG 1.5x) |
| Truncating error messages | Never truncate critical information |
| `leading-none` on multi-line text | `leading-normal` or `leading-relaxed` |
| Wide unconstrained text | `max-w-prose` or `max-w-xl` |

## References

- [WCAG 2.1 Contrast (Minimum)](https://www.w3.org/TR/WCAG21/#contrast-minimum)
- [WCAG 2.1 Text Spacing](https://www.w3.org/TR/WCAG21/#text-spacing)
- [Material Design 3 Typography](https://m3.material.io/styles/typography/overview)
- [Tailwind Typography Plugin](https://tailwindcss.com/docs/typography-plugin)
- [WCAG 2.1 Understanding Docs](https://www.w3.org/WAI/WCAG21/Understanding/)
