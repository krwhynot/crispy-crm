# Interaction Patterns

Micro-interactions, hover states, and feedback patterns for Crispy CRM's premium UI experience.

## Hover States

### Card Hover (Premium)

Interactive cards use the `.interactive-card` utility class for consistent premium feel.

```css
/* Base state */
.interactive-card {
  @apply transition-all duration-150 ease-out;
}

/* Hover state */
.interactive-card:hover {
  @apply shadow-md border-primary/20 -translate-y-0.5;
}
```

**Tailwind classes:**
```
transition-all duration-150 ease-out
hover:shadow-md hover:border-primary/20 hover:-translate-y-0.5
```

### Button Hover

Buttons use the `.btn-premium` utility for subtle background transitions.

```css
/* Primary button hover */
.btn-premium:hover {
  @apply bg-primary/90;
}
```

**Tailwind classes:**
```
transition-colors duration-200
hover:bg-primary/90
```

**Variants:**
| Button Type | Hover Effect |
|-------------|--------------|
| Primary | `hover:bg-primary/90` |
| Secondary | `hover:bg-secondary/80` |
| Destructive | `hover:bg-destructive/90` |
| Ghost | `hover:bg-accent` |
| Outline | `hover:bg-accent hover:text-accent-foreground` |

### Table Row Hover

Premium table rows use `.table-row-premium` for elevated hover states.

```css
.table-row-premium {
  @apply transition-colors duration-150;
}

.table-row-premium:hover {
  @apply bg-muted/50;
}

/* Optional lift for interactive rows */
.table-row-premium.with-lift:hover {
  @apply -translate-y-px shadow-sm;
}
```

**Tailwind classes:**
```
transition-colors duration-150
hover:bg-muted/50
```

### Link Hover

Links use underline or color change, never both simultaneously.

**Underline variant:**
```
hover:underline underline-offset-4
```

**Color variant:**
```
text-muted-foreground hover:text-foreground transition-colors duration-150
```

## Loading States

### Page Load

Use skeleton screens instead of spinners for content loading.

```tsx
// Skeleton placeholder
<div className="animate-pulse space-y-4">
  <div className="h-4 bg-muted rounded w-3/4" />
  <div className="h-4 bg-muted rounded w-1/2" />
</div>
```

**Tailwind classes:**
```
animate-pulse bg-muted rounded
```

### Button Submit

Disabled state with inline spinner during form submission.

```tsx
<button
  disabled={isSubmitting}
  className="relative disabled:opacity-50 disabled:cursor-not-allowed"
>
  {isSubmitting && (
    <span className="absolute inset-0 flex items-center justify-center">
      <Loader2 className="h-4 w-4 animate-spin" />
    </span>
  )}
  <span className={isSubmitting ? "invisible" : ""}>
    Save
  </span>
</button>
```

**Requirements:**
- Button must be disabled during submit
- Spinner replaces text (text becomes invisible, not removed)
- Use `Loader2` icon from lucide-react with `animate-spin`

### Data Fetch

Loading overlay for partial data refresh.

```tsx
<div className="relative">
  {isLoading && (
    <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  )}
  <DataContent />
</div>
```

### Optimistic Updates

Apply optimistic updates for:
- Toggle actions (checkboxes, switches)
- Status changes
- Quick edits

Revert on error with toast notification.

## Feedback Patterns

### Success Toast

```tsx
toast.success("Changes saved", {
  duration: 3000, // Auto-dismiss 3s
  icon: <CheckCircle className="h-4 w-4 text-green-500" />,
});
```

**Specifications:**
- Green color: `text-green-500` or semantic `text-success`
- Auto-dismiss: 3 seconds
- Icon: Checkmark with subtle animation
- Position: Top-right (default)

### Error Toast

```tsx
toast.error("Failed to save changes", {
  duration: Infinity, // Manual dismiss required
  description: "Please try again or contact support.",
});
```

**Specifications:**
- Red color: `text-destructive`
- Manual dismiss required (no auto-dismiss)
- Include actionable description
- Combine with inline field errors for form validation

### Warning Toast

```tsx
toast.warning("Unsaved changes", {
  duration: 5000,
  action: {
    label: "Save now",
    onClick: handleSave,
  },
});
```

**Specifications:**
- Yellow/amber color: `text-yellow-500` or semantic `text-warning`
- Include action button when appropriate
- Auto-dismiss: 5 seconds (longer than success)

### Pending State

Elements awaiting action use reduced opacity and disabled interaction.

```
opacity-50 pointer-events-none cursor-not-allowed
```

**Use cases:**
- Dependent fields waiting for parent selection
- Items being processed
- Disabled actions due to permissions

### Inline Field Errors

```tsx
<input
  aria-invalid={!!error}
  aria-describedby={error ? `${name}-error` : undefined}
  className="border-destructive focus-visible:ring-destructive"
/>
{error && (
  <p
    id={`${name}-error`}
    role="alert"
    className="text-sm text-destructive mt-1"
  >
    {error.message}
  </p>
)}
```

**Requirements:**
- `aria-invalid={!!error}` on input
- `aria-describedby` linking to error message
- `role="alert"` on error text for screen readers

## Transition Specifications

### Duration Scale

| Speed | Duration | Use Case |
|-------|----------|----------|
| Fast | 150ms | Hover states, color changes, micro-interactions |
| Normal | 200ms | Button transitions, focus states |
| Slow | 300ms | Panel slides, content reveals, modals |

### Easing Functions

| Easing | Tailwind Class | Use Case |
|--------|----------------|----------|
| ease-out | `ease-out` | UI feedback (hovers, clicks) |
| ease-in-out | `ease-in-out` | Content transitions (slides, fades) |
| ease-in | `ease-in` | Exit animations only |

### Common Transition Patterns

```css
/* UI element (hover, focus) */
transition-all duration-150 ease-out

/* Content appearance */
transition-opacity duration-300 ease-in-out

/* Transform with opacity */
transition-all duration-200 ease-out
```

## Focus States

### Standard Focus Ring

All interactive elements must have visible focus indicators.

```
focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
```

**Requirements:**
- Use `focus-visible` (not `focus`) to avoid mouse-click rings
- Ring width: 2px minimum
- Ring color: `ring-primary` for consistency
- Ring offset: 2px for visual separation

### Focus Within (Container)

For components with internal focusable elements:

```
focus-within:ring-2 focus-within:ring-primary
```

### Never Remove Focus Without Replacement

```css
/* WRONG - removes accessibility */
outline-none

/* CORRECT - replaces with ring */
outline-none focus-visible:ring-2 focus-visible:ring-primary
```

## Animation Utilities

### Built-in Tailwind Animations

| Class | Use Case |
|-------|----------|
| `animate-spin` | Loading spinners |
| `animate-ping` | Notification badges |
| `animate-pulse` | Skeleton loaders |
| `animate-bounce` | Attention indicators (use sparingly) |

### Custom Animation Classes

```css
/* Fade in */
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
.animate-fade-in {
  animation: fade-in 200ms ease-out;
}

/* Slide up */
@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-slide-up {
  animation: slide-up 200ms ease-out;
}

/* Scale in */
@keyframes scale-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
.animate-scale-in {
  animation: scale-in 150ms ease-out;
}
```

### Transition Property Classes

| Class | Properties |
|-------|------------|
| `transition-none` | No transitions |
| `transition-all` | All properties |
| `transition-colors` | Background, border, text colors |
| `transition-opacity` | Opacity only |
| `transition-shadow` | Box shadow |
| `transition-transform` | Transform properties |

## Implementation Checklist

When implementing interactive elements:

- [ ] Hover state defined with appropriate duration
- [ ] Focus state uses `focus-visible:ring-2`
- [ ] Loading state shows skeleton or spinner
- [ ] Error state includes toast and/or inline message
- [ ] Success feedback via toast (3s auto-dismiss)
- [ ] Touch target minimum 44x44px (`h-11 w-11`)
- [ ] Transitions use semantic durations (150/200/300ms)
- [ ] Animations use `ease-out` for UI, `ease-in-out` for content
