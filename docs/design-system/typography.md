# Typography Patterns

**Created:** January 8, 2026
**Purpose:** Document typography conventions for consistent visual hierarchy and readability across Crispy CRM

---

## Overview

Crispy CRM uses intentional typography patterns that vary based on context. Section headings follow two distinct patterns: **UPPERCASE for dense information panels** and **Title Case for primary content areas**. This creates visual hierarchy and guides user attention appropriately.

---

## Section Heading Patterns

### 1. Slide-Over Section Headings (SidepaneSection)

**Component:** `SidepaneSection`
**Location:** `src/components/layouts/sidepane/SidepaneSection.tsx`

#### Styling

| Property | Value |
|----------|-------|
| **Case** | UPPERCASE |
| **Size** | `text-xs` (12px) |
| **Weight** | `font-medium` (500) |
| **Letter Spacing** | `tracking-wide` |
| **Color** | `text-muted-foreground` |

#### CSS Class

```
text-xs font-medium uppercase tracking-wide text-muted-foreground
```

#### Design Rationale

Slide-over panels (40vw right sidebars) are **supplementary information panels**. They contain dense, structured metadata where visual hierarchy is constrained by available space. UPPERCASE styling:

- **Maximizes visual impact** in a limited space without increasing font size
- **Clearly separates** metadata sections at a glance
- **Denotes secondary status** compared to primary form content
- **Maintains readability** with letter spacing (tracking-wide) despite small size

#### Usage Examples

- "ORGANIZATION"
- "CONTACT INFO"
- "TAGS"
- "RELATIONSHIPS"
- "HISTORY"

#### Component Props

```tsx
interface SidepaneSectionProps {
  label: string;                          // Section heading text
  children: React.ReactNode;
  variant?: "default" | "list";           // Wrapper style
  showSeparator?: boolean;                // Show separator above
  className?: string;
}
```

#### Implementation Example

```tsx
<SidepaneSection
  label="ORGANIZATION"
  showSeparator={true}
>
  <div className="space-y-2">
    <p className="text-sm">{organizationName}</p>
    <p className="text-xs text-muted-foreground">{organizationType}</p>
  </div>
</SidepaneSection>
```

---

### 2. Form Section Headings (FormSectionWithProgress)

**Component:** `FormSectionWithProgress`
**Location:** `src/components/admin/form/FormSectionWithProgress.tsx`

#### Styling

| Property | Value |
|----------|-------|
| **Case** | Title Case |
| **Size** | `text-lg` (18px) |
| **Weight** | `font-semibold` (600) |
| **Letter Spacing** | Default (no tracking) |
| **Color** | `text-foreground` |

#### CSS Class

```
text-lg font-semibold text-foreground
```

#### Design Rationale

Form sections are **primary content areas** where readability and clear hierarchy are essential. Title Case styling:

- **Improves readability** at larger size with standard letter spacing
- **Denotes primary status** as main form content
- **Provides clear visual breaks** between logical form sections
- **Maintains professional appearance** with familiar title case convention

#### Usage Examples

- "Organization"
- "Contact Info"
- "Additional Details"
- "Opportunity Details"
- "Company Information"

#### Component Props

```tsx
interface FormSectionWithProgressProps {
  id: string;                     // Unique section identifier
  title: string;                  // Section heading (Title Case)
  description?: string;           // Optional description below title
  requiredFields?: string[];      // Field names that are required
  children: React.ReactNode;      // FormFieldWrapper components
  className?: string;
}
```

#### Implementation Example

```tsx
<FormSectionWithProgress
  id="organization-section"
  title="Organization"
  description="Company and account information"
  requiredFields={["organization_name", "organization_type"]}
>
  <FormFieldWrapper source="organization_name" label="Organization Name" />
  <FormFieldWrapper source="organization_type" label="Type" />
</FormSectionWithProgress>
```

#### Progress Indicator

FormSectionWithProgress displays completion status using visual indicators:

- **Incomplete:** Unfilled circle icon (`Circle`) in muted color
- **Complete:** Filled checkmark icon (`CheckCircle2`) in primary color
- **Complete Badge:** "Complete" text badge shown when all required fields are valid

---

## Decision Matrix: When to Use Each Pattern

```
Is this content in a slide-over/sidebar panel?
├─ YES → Use UPPERCASE (SidepaneSection)
│         Compact, metadata-focused, supplementary
│
└─ NO → Is this a form section or primary content area?
        ├─ YES → Use Title Case (FormSectionWithProgress)
        │         Readable, prominent, primary content
        │
        └─ NO → Use appropriate heading hierarchy (h1-h6)
                 based on page context
```

---

## Comparison Table

| Aspect | Slide-Over (UPPERCASE) | Form (Title Case) |
|--------|------------------------|-------------------|
| **Case** | UPPERCASE | Title Case |
| **Size** | `text-xs` (12px) | `text-lg` (18px) |
| **Weight** | font-medium (500) | font-semibold (600) |
| **Letter Spacing** | tracking-wide | Default |
| **Color** | muted-foreground | foreground |
| **Context** | Supplementary, metadata | Primary, content |
| **Space Type** | Dense sidebars, 40vw panels | Full-width forms |
| **Hierarchy Role** | Secondary sections | Primary sections |

---

## Accessibility Considerations

### Semantic HTML

Both components use semantic heading elements:

- **SidepaneSection:** Uses `<h4>` for metadata sections
- **FormSectionWithProgress:** Uses `<h3>` for form sections

This maintains proper heading hierarchy for screen readers and document outline tools.

### Visual Hierarchy for Screen Readers

The UPPERCASE styling is **purely visual**. Screen reader users hear the same text regardless of case. Ensure:

- Heading levels progress logically (h1 → h2 → h3 → h4)
- Text content is meaningful without relying on visual styling
- Links and interactive elements are properly identified

### Color Contrast

Both patterns use semantic color tokens that meet **WCAG AA standards**:

- `text-muted-foreground` on default background: sufficient contrast for body text
- `text-foreground` on default background: sufficient contrast for headings

### Touch Targets

Section headings themselves are not interactive, but adjacent interactive elements (completion icons in forms, close buttons in sidebars) must maintain 44px minimum touch targets.

---

## Related Patterns

### Secondary Headings

For subsections within a form section, use `text-base font-semibold` (smaller than section heading):

```tsx
<h4 className="text-base font-semibold mt-4 mb-2">
  Subsection Title
</h4>
```

### Body Text

Pair headings with appropriate body text:

- **Form descriptions:** `text-sm text-muted-foreground`
- **Slide-over content:** `text-sm` or `text-xs` depending on density

### Error Messages

Form validation errors use semantic styling:

```tsx
<p role="alert" className="text-sm text-destructive">
  This field is required
</p>
```

---

## Implementation Checklist

When adding section headings to forms or panels:

- [ ] **Form sections:** Use `FormSectionWithProgress` with Title Case
- [ ] **Slide-over panels:** Use `SidepaneSection` with UPPERCASE
- [ ] **Heading hierarchy:** Verify proper h-level progression
- [ ] **Semantic colors:** Use `text-foreground` or `text-muted-foreground`
- [ ] **No hardcoded colors:** Never use hex/oklch values
- [ ] **Accessibility:** Test with screen reader (VoiceOver/NVDA)
- [ ] **Responsive:** Verify appearance on iPad (min 1024px) and desktop (1440px+)

---

## Examples in Codebase

### Slide-Over Pattern

```tsx
// Organization detail slide-over
<SidepaneSection label="ORGANIZATION">
  <p className="text-sm font-medium">{org.name}</p>
</SidepaneSection>

<SidepaneSection label="CONTACT INFO" showSeparator>
  <p className="text-xs">{org.email}</p>
  <p className="text-xs">{org.phone}</p>
</SidepaneSection>
```

### Form Pattern

```tsx
// Create opportunity form
<FormSectionWithProgress
  id="basic-info"
  title="Opportunity Details"
  description="Principal and pipeline information"
  requiredFields={["principal_id", "stage"]}
>
  <FormFieldWrapper source="principal_id" label="Principal" />
  <FormFieldWrapper source="stage" label="Pipeline Stage" />
</FormSectionWithProgress>

<FormSectionWithProgress
  id="contact-info"
  title="Contact Information"
  requiredFields={["contact_name", "contact_email"]}
>
  <FormFieldWrapper source="contact_name" label="Contact Name" />
  <FormFieldWrapper source="contact_email" label="Email" />
</FormSectionWithProgress>
```

---

## Tailwind Configuration

Both patterns use standard Tailwind v4 classes:

| Class | Purpose |
|-------|---------|
| `text-xs` | 12px font size |
| `text-lg` | 18px font size |
| `font-medium` | 500 font weight |
| `font-semibold` | 600 font weight |
| `uppercase` | Text transformation |
| `tracking-wide` | Letter spacing 0.05em |
| `text-foreground` | Primary text color (semantic) |
| `text-muted-foreground` | Secondary text color (semantic) |

No custom CSS is required. All styling uses Tailwind utilities and semantic color tokens.

---

## Future Considerations

- **Dark mode:** Current patterns already respect system theme via Tailwind semantic colors
- **Mobile refinements:** Verify UPPERCASE readability on smaller screens (< 768px) if mobile support expands
- **Typography scale:** Consider documenting additional heading levels if form complexity increases
- **Animation:** Currently no transition effects on section headings; consider adding if design goals evolve
