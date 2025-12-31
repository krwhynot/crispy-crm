# Accessibility Guidelines - WCAG 2.1 AA Compliance

Crispy CRM accessibility standards for iPad-first field sales users.

## 1. WCAG 2.1 AA Compliance Overview

WCAG 2.1 Level AA is our compliance target. The four principles:

| Principle | Requirement |
|-----------|-------------|
| **Perceivable** | Content available to all senses (text alternatives, captions, contrast) |
| **Operable** | UI navigable via keyboard, touch, and assistive tech |
| **Understandable** | Predictable behavior, error prevention, readable content |
| **Robust** | Compatible with assistive technologies and future devices |

### Success Criteria Prioritized for CRM

- 1.4.3 Contrast (Minimum) - AA
- 1.4.11 Non-text Contrast - AA
- 2.1.1 Keyboard - A
- 2.4.3 Focus Order - A
- 2.4.7 Focus Visible - AA
- 2.5.5 Target Size - AAA (we exceed AA requirements)
- 3.3.1 Error Identification - A
- 3.3.2 Labels or Instructions - A
- 4.1.2 Name, Role, Value - A

## 2. Touch Targets

iPad field sales users require generous touch targets. Our standards exceed WCAG 2.5.5.

### Size Requirements

| Context | Minimum Size | Tailwind Classes | Usage |
|---------|--------------|------------------|-------|
| Minimum | 44x44px | `h-11 w-11 min-h-11 min-w-11` | Icon buttons, checkboxes |
| Standard | 48x48px | `h-12 w-12 min-h-12 min-w-12` | Most interactive elements |
| Primary CTA | 56x56px | `h-14 w-14 min-h-14 min-w-14` | Primary actions, FABs |

### Implementation Patterns

```tsx
// Icon button - minimum 44px
<button className="h-11 w-11 min-h-11 min-w-11 flex items-center justify-center">
  <Icon className="h-5 w-5" />
</button>

// Text button - height 44px minimum
<button className="h-11 min-h-11 px-4">
  Save Contact
</button>

// Primary CTA - 56px
<button className="h-14 min-h-14 px-6 bg-primary text-primary-foreground">
  Create Opportunity
</button>
```

### Spacing Between Targets

Maintain 8px minimum gap between touch targets to prevent accidental activation:

```tsx
<div className="flex gap-2"> {/* 8px gap */}
  <button className="h-11 w-11">...</button>
  <button className="h-11 w-11">...</button>
</div>
```

## 3. Color Contrast Requirements

### Contrast Ratios

| Content Type | Minimum Ratio | Example |
|--------------|---------------|---------|
| Normal text (<18px) | 4.5:1 | Body text, labels |
| Large text (>=18px bold or >=24px) | 3:1 | Headings |
| UI components | 3:1 | Buttons, form borders |
| Non-text content | 3:1 | Icons, focus indicators |

### Semantic Colors (Tailwind v4)

Always use semantic color tokens - never raw hex or oklch values:

| Use Case | Correct | Incorrect |
|----------|---------|-----------|
| Muted text | `text-muted-foreground` | `text-gray-500` |
| Primary actions | `bg-primary text-primary-foreground` | `bg-green-600 text-white` |
| Error states | `text-destructive` | `text-red-500` |
| Borders | `border-border` | `border-gray-200` |
| Focus rings | `ring-ring` | `ring-blue-500` |

### Do Not Rely on Color Alone

Supplement color with:
- Icons (error icon alongside red text)
- Text labels (not just red/green indicators)
- Patterns or underlines (links)

```tsx
// Correct - color + icon + text
<div className="text-destructive flex items-center gap-2">
  <AlertCircle className="h-4 w-4" />
  <span>Required field</span>
</div>

// Incorrect - color only
<span className="text-destructive">*</span>
```

## 4. Form Accessibility Checklist

| Requirement | Implementation | Status Check |
|-------------|----------------|--------------|
| **Labels** | Every input has associated `<label>` or `aria-label` | Required |
| **Error identification** | `aria-invalid={!!error}` on invalid inputs | Required |
| **Error description** | `aria-describedby={errorId}` linking input to message | Required |
| **Error announcement** | `role="alert"` on error messages | Required |
| **Required fields** | `aria-required="true"` on required inputs | Required |
| **Instructions** | Helper text via `aria-describedby` before submission | Recommended |
| **Focus on error** | Focus first invalid field on submission | Required |
| **Autocomplete** | `autocomplete` attribute for known fields | Required |

### Standard Form Input Pattern

```tsx
const FormInput = ({ name, label, error, required }) => {
  const inputId = `input-${name}`;
  const errorId = `error-${name}`;

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>

      <input
        id={inputId}
        name={name}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        className="h-11 min-h-11 w-full border border-input rounded-md px-3"
      />

      {error && (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
};
```

### Form Validation Mode

Use `onSubmit` (default) or `onBlur` validation - never `onChange`:

```tsx
// Correct - validates on submit
const { register } = useForm({ mode: 'onSubmit' });

// Correct - validates on blur
const { register } = useForm({ mode: 'onBlur' });

// Incorrect - causes excessive re-renders and announcements
const { register } = useForm({ mode: 'onChange' });
```

## 5. Keyboard Navigation Requirements

### Required Keyboard Support

| Key | Action |
|-----|--------|
| Tab | Move focus to next focusable element |
| Shift+Tab | Move focus to previous focusable element |
| Enter | Activate buttons, submit forms |
| Space | Activate buttons, toggle checkboxes |
| Escape | Close modals, popovers, dropdowns |
| Arrow keys | Navigate within menus, lists, tabs |

### Focus Order

Focus order must follow visual reading order (left-to-right, top-to-bottom for LTR):

```tsx
// Correct - natural DOM order matches visual order
<div className="flex gap-4">
  <button>First</button>
  <button>Second</button>
  <button>Third</button>
</div>

// Incorrect - visual reordering breaks focus order
<div className="flex flex-row-reverse gap-4">
  <button>First</button>  {/* Appears last visually */}
  <button>Second</button>
  <button>Third</button>  {/* Appears first visually */}
</div>
```

### Skip Links

Provide skip link for main content:

```tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 bg-background px-4 py-2"
>
  Skip to main content
</a>
```

### Focusable Elements

Only naturally focusable elements or elements with `tabindex="0"`:

| Element | Focusable | Notes |
|---------|-----------|-------|
| `<button>` | Yes | Preferred for actions |
| `<a href>` | Yes | Requires href |
| `<input>` | Yes | All form inputs |
| `<div>` | No | Add `tabindex="0"` if interactive |
| `<div role="button">` | Needs tabindex | Prefer `<button>` |

## 6. Focus Management

### Modal Focus Trap

When a modal opens:
1. Focus moves to first focusable element inside modal
2. Tab cycles only within modal (focus trap)
3. Escape closes modal
4. Focus returns to trigger element on close

```tsx
const Modal = ({ isOpen, onClose, triggerRef, children }) => {
  const firstFocusRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Store current focus
      const previousFocus = document.activeElement;

      // Focus first element
      firstFocusRef.current?.focus();

      return () => {
        // Return focus on close
        previousFocus?.focus();
      };
    }
  }, [isOpen]);

  // Handle Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  return (
    <div role="dialog" aria-modal="true">
      <button ref={firstFocusRef}>Close</button>
      {children}
    </div>
  );
};
```

### Slide-Over Panel Focus

For the 40vw slide-over pattern:
1. Focus moves into panel on open
2. Focus trapped within panel
3. Close button receives initial focus
4. Focus returns to trigger (list row) on close

### Popover/Dropdown Focus

```tsx
// Focus first item when popover opens
<PopoverContent
  onOpenAutoFocus={(e) => {
    e.preventDefault();
    firstItemRef.current?.focus();
  }}
  onCloseAutoFocus={(e) => {
    e.preventDefault();
    triggerRef.current?.focus();
  }}
>
```

## 7. Screen Reader Support

### ARIA Roles

| Component | Role | Additional Attributes |
|-----------|------|----------------------|
| Modal | `dialog` | `aria-modal="true"`, `aria-labelledby` |
| Alert | `alert` | Auto-announced |
| Status | `status` | Polite announcement |
| Tab panel | `tablist`, `tab`, `tabpanel` | `aria-selected`, `aria-controls` |
| Menu | `menu`, `menuitem` | `aria-expanded`, `aria-haspopup` |
| Navigation | `navigation` | `aria-label` |

### Live Regions

```tsx
// Assertive - interrupts (errors)
<div role="alert" aria-live="assertive">
  Form submission failed
</div>

// Polite - waits for pause (status updates)
<div role="status" aria-live="polite">
  3 contacts found
</div>
```

### Labeling Patterns

```tsx
// aria-label for icon-only buttons
<button aria-label="Close dialog" className="h-11 w-11">
  <X className="h-5 w-5" />
</button>

// aria-labelledby for sections
<section aria-labelledby="contacts-heading">
  <h2 id="contacts-heading">Contacts</h2>
</section>

// aria-describedby for additional context
<input
  aria-describedby="email-hint"
  type="email"
/>
<p id="email-hint">We'll never share your email</p>
```

### Hiding Decorative Content

```tsx
// Decorative icons
<Icon aria-hidden="true" />

// Visually hidden but screen reader accessible
<span className="sr-only">Loading</span>
```

## 8. Testing Tools

### Automated Testing

| Tool | Usage | Install |
|------|-------|---------|
| **axe DevTools** | Chrome extension, CI integration | Chrome Web Store |
| **WAVE** | Visual overlay of issues | Chrome Web Store |
| **Lighthouse** | Accessibility audit in DevTools | Built into Chrome |
| **eslint-plugin-jsx-a11y** | Lint-time catching | `npm install -D eslint-plugin-jsx-a11y` |

### Manual Testing

| Tool | Usage | Notes |
|------|-------|-------|
| **VoiceOver** | macOS/iOS screen reader | Cmd+F5 to toggle |
| **NVDA** | Windows screen reader | Free download |
| **Keyboard only** | Tab through entire flow | No mouse allowed |
| **Zoom 200%** | Test reflow | Content must not overflow |

### Testing Checklist

1. Tab through entire page - logical order?
2. Complete form with keyboard only
3. Open/close modal with keyboard
4. Listen with screen reader - announced correctly?
5. Run axe DevTools - zero violations?
6. Check color contrast with WAVE
7. Test at 200% zoom

## 9. Common Violations to Avoid

From audit findings (93 violations identified):

### Critical Violations

| Violation | Fix |
|-----------|-----|
| Missing form labels | Add `<label>` or `aria-label` to every input |
| Missing alt text | Add `alt=""` (decorative) or descriptive alt |
| Empty buttons | Add text content or `aria-label` |
| Missing ARIA roles | Add appropriate role to custom widgets |
| Color contrast | Use semantic color tokens |

### Serious Violations

| Violation | Fix |
|-----------|-----|
| Missing skip link | Add skip to main content link |
| Missing focus indicator | Never remove outline without alternative |
| Keyboard trap | Ensure Escape closes modals |
| Missing error announcements | Add `role="alert"` to error messages |
| Touch targets too small | Use `h-11 w-11` minimum |

### Moderate Violations

| Violation | Fix |
|-----------|-----|
| Missing landmarks | Use `<main>`, `<nav>`, `<aside>` |
| Missing heading hierarchy | Use h1 > h2 > h3 in order |
| Missing language attribute | Add `lang="en"` to html element |
| Redundant ARIA | Remove ARIA if native HTML works |

### Prevention Patterns

```tsx
// Always provide button text
<button aria-label="Delete contact">
  <Trash className="h-5 w-5" aria-hidden="true" />
</button>

// Always visible focus
<button className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">

// Never suppress focus outline without replacement
// WRONG: outline-none without ring replacement
<button className="outline-none">

// Form errors always announced
{error && (
  <p role="alert" className="text-destructive">
    {error}
  </p>
)}
```

## Quick Reference

### Required on Every Form Input

```tsx
<input
  id={inputId}
  aria-required={required}
  aria-invalid={!!error}
  aria-describedby={error ? errorId : undefined}
/>
{error && <p id={errorId} role="alert">{error}</p>}
```

### Required on Every Icon Button

```tsx
<button
  aria-label="Action description"
  className="h-11 w-11 min-h-11 min-w-11"
>
  <Icon aria-hidden="true" />
</button>
```

### Required on Every Modal

```tsx
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby={titleId}
>
  <h2 id={titleId}>Modal Title</h2>
</div>
```
