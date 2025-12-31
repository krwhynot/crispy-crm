# ADR-013: WCAG 2.1 AA Accessibility Standards

## Status

Accepted

## Context

Crispy CRM is a sales pipeline management tool designed for field sales representatives who use tablets (iPad) in addition to desktop. Accessibility is critical for several reasons:

1. **Legal Compliance**: WCAG 2.1 AA is the legal baseline in many jurisdictions (ADA, Section 508, EN 301 549)
2. **User Diversity**: Account managers may have varying abilities, including motor impairments that affect precise pointer use
3. **Touch Devices**: iPad users interact via touch, requiring larger hit areas and clear visual feedback
4. **Screen Reader Support**: Users with visual impairments rely on assistive technology

### Why WCAG 2.1 AA (Not AAA)

- **AA is the practical baseline**: AAA is aspirational and includes requirements that often conflict with business needs (e.g., 7:1 contrast ratio limits design flexibility)
- **Legal standard**: Most accessibility laws reference AA as the compliance target
- **Broad coverage**: AA covers the majority of accessibility needs for most users
- **Achievable**: AAA compliance is rarely fully achieved in production applications

## Decision

Adopt WCAG 2.1 AA as the accessibility baseline for all Crispy CRM user interfaces, implementing these specific patterns:

### 1. Form Error Accessibility (ARIA)

All form validation errors must include:
- `aria-invalid={!!error}` on the input control
- `aria-describedby` linking input to error message
- `role="alert"` with `aria-live="polite"` on error messages
- `role="group"` on form field wrappers

### 2. Touch Targets (44px Minimum)

All interactive elements must have a minimum 44x44px touch target area, using:
- Direct sizing (h-11, h-12) for buttons
- Pseudo-element expansion for compact inputs

### 3. Focus Indicators

Visible focus rings must be present on all interactive elements:
- 3px ring width minimum
- Semantic color tokens (ring-ring, ring-primary)
- focus-visible (not focus) to avoid mouse-click rings

### 4. Screen Reader Support

- Visually hidden labels using `sr-only` class
- Live regions for dynamic content announcements
- Proper heading hierarchy

## Consequences

### Positive

- **Inclusive Design**: All users can effectively use the CRM regardless of ability
- **Legal Protection**: Meets compliance requirements for accessibility laws
- **Better UX**: Touch targets and focus indicators improve usability for all users
- **Testable**: Patterns can be verified through automated and manual testing

### Negative

- **Development Overhead**: Requires consistent application of ARIA attributes
- **Design Constraints**: 44px touch targets may limit information density
- **Testing Burden**: Accessibility testing adds to QA cycles

## Code Examples

### Form Error Pattern (Complete Implementation)

From `src/components/admin/form/form-primitives.tsx`:

```tsx
// FormControl: Applies aria-invalid and aria-describedby to inputs
function FormControl({ ...props }: React.ComponentProps<typeof Slot>) {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField();

  return (
    <Slot
      data-slot="form-control"
      id={formItemId}
      aria-describedby={!error ? `${formDescriptionId}` : `${formDescriptionId} ${formMessageId}`}
      aria-invalid={!!error}
      {...props}
    />
  );
}

// FormError: Announces errors to screen readers
const FormError = ({ className, ...props }: React.ComponentProps<"p">) => {
  const { invalid, error, formMessageId } = useFormField();

  const err = error?.root?.message ?? error?.message;
  if (!invalid || !err) {
    return null;
  }

  return (
    <p
      data-slot="form-message"
      id={formMessageId}
      role="alert"
      aria-live="polite"
      className={cn("text-destructive text-sm", className)}
      {...props}
    >
      <ValidationError error={err} />
    </p>
  );
};

// FormField: Groups related form elements
function FormField({ className, id, name, ...props }: FormItemProps) {
  const contextValue: FormItemContextValue = useMemo(
    () => ({ id, name }),
    [id, name]
  );

  return (
    <FormItemContext.Provider value={contextValue}>
      <div data-slot="form-item" className={cn("grid gap-2", className)} role="group" {...props} />
    </FormItemContext.Provider>
  );
}
```

### Touch Target Expansion (Pseudo-Element Technique)

From `src/components/ui/input.tsx`:

```tsx
// Compact 32px visual height with 44px touch target via pseudo-element
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, size = "default", ...props }, ref) => {
    return (
      <input
        type={type}
        data-slot="input"
        className={cn(
          // Base compact height: 32px
          "h-8 px-2 py-1",

          // TOUCH TARGET EXPANSION (44px)
          // Pseudo-element extends hit area without affecting layout
          "relative",
          "before:content-['']",
          "before:absolute",
          "before:top-[calc((44px-100%)/-2)]",
          "before:bottom-[calc((44px-100%)/-2)]",
          "before:left-0",
          "before:right-0",

          // Error state styling via aria-invalid
          "aria-invalid:border-destructive",
          "aria-invalid:ring-1 aria-invalid:ring-destructive/30",

          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
```

### Button Touch Targets (Direct Sizing)

From `src/components/ui/button.constants.ts`:

```tsx
export const buttonVariants = cva(
  // Base styles with focus ring
  "... focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] ...",
  {
    variants: {
      size: {
        // All sizes meet 44px minimum (h-12 = 48px)
        default: "h-12 px-6 py-2 has-[>svg]:px-4",
        sm: "h-12 rounded-md gap-2 px-4 has-[>svg]:px-3",
        lg: "h-12 rounded-md px-8 has-[>svg]:px-6",
        icon: "size-12",  // 48x48px
      },
    },
  }
);
```

### Dialog Close Button (44px Target)

From `src/components/ui/dialog.tsx`:

```tsx
<DialogPrimitive.Close
  className="... size-11 flex items-center justify-center"
>
  <XIcon />
  <span className="sr-only">Close</span>
</DialogPrimitive.Close>
```

### Anti-Patterns (DO NOT USE)

```tsx
// BAD: Missing aria-invalid on error state
<input className={error ? "border-red-500" : ""} />

// GOOD: Use aria-invalid for both styling and screen readers
<input aria-invalid={!!error} className="aria-invalid:border-destructive" />


// BAD: Error message without role="alert"
{error && <span className="text-red-500">{error}</span>}

// GOOD: Screen reader announces the error
{error && (
  <span role="alert" aria-live="polite" className="text-destructive">
    {error}
  </span>
)}


// BAD: Small touch targets
<button className="h-8 w-8">X</button>

// GOOD: 44px minimum touch target
<button className="size-11">X</button>


// BAD: No focus ring or custom focus
<button className="focus:outline-none">Submit</button>

// GOOD: Visible focus ring with semantic colors
<button className="focus-visible:ring-[3px] focus-visible:ring-ring/50">
  Submit
</button>
```

## Accessibility Checklist

When implementing new UI components, verify:

- [ ] Touch targets are at least 44x44px (h-11/w-11 or larger)
- [ ] Form inputs have `aria-invalid={!!error}` when validation fails
- [ ] Error messages have `role="alert"` and `aria-live="polite"`
- [ ] Inputs reference errors via `aria-describedby`
- [ ] Focus rings are 3px width with semantic colors
- [ ] Buttons use `focus-visible` (not `focus`) for keyboard-only rings
- [ ] Icons have screen reader text via `sr-only` class
- [ ] Semantic color tokens are used (not raw hex values)

## Implementation Files

| File | Responsibility |
|------|----------------|
| `src/components/admin/form/form-primitives.tsx` | ARIA form patterns |
| `src/components/ui/input.tsx` | Touch target expansion, error styling |
| `src/components/ui/button.constants.ts` | Touch targets, focus rings |
| `src/components/ui/dialog.tsx` | Modal accessibility, close button |
| `src/components/admin/form/__tests__/form-primitives-accessibility.test.tsx` | A11y test coverage |

## Testing

Unit tests for accessibility patterns are located in:
- `src/components/admin/form/__tests__/form-primitives-accessibility.test.tsx`

Tests verify:
- `aria-invalid` is set on invalid inputs
- Error messages have `role="alert"` and `aria-live="polite"`
- `aria-describedby` links inputs to error messages
- Form fields have `role="group"`
- Labels are associated with inputs via `htmlFor`
- Keyboard navigation works correctly

## Related ADRs

- **ADR-005: @dnd-kit** - Keyboard navigation for drag-and-drop interactions
- **ADR-006: Semantic Colors** - Color contrast and theme support
- **ADR-010: Slide-Over Panels** - Focus management and trap patterns
