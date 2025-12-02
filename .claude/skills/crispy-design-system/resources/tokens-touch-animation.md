# Touch & Animation Tokens

## Touch Target Sizes

### WCAG 2.5.5 Requirements

**Minimum: 44x44px (WCAG Level AAA)**

```typescript
// Tailwind classes for touch targets
h-11 w-11   = 44px × 44px (minimum)
h-12 w-12   = 48px × 48px (standard buttons)
h-14 w-14   = 56px × 56px (primary CTAs)
```

**Button Sizes:**

```tsx
// Small button (minimum viable)
<Button size="sm" className="h-11 px-4">
  Action
</Button>

// Default button (standard)
<Button size="default" className="h-12 px-6">
  Primary Action
</Button>

// Large button (spacious)
<Button size="lg" className="h-14 px-8">
  Important CTA
</Button>

// Icon button (square)
<Button size="icon" className="h-12 w-12">
  <X className="h-4 w-4" />
</Button>
```

**Validation in Development:**

```typescript
import { validateTouchTarget } from '@/lib/design-system/spacing';

// Throws error if size < 44px in development mode
validateTouchTarget(48, 'Button');  // OK
validateTouchTarget(40, 'Button');  // Throws error
```

### Touch-Friendly Padding

**iPad/Touch Optimization:**

```tsx
// Mobile: compact padding
// iPad: comfortable padding
// Desktop: spacious padding

<Card className="p-4 md:p-6 lg:p-8">
  {/* 16px → 24px → 32px */}
</Card>

// Form inputs - generous tap area
<Input className="h-12 px-4 py-3" />  {/* 48px height, 16px horizontal padding */}
```

## Border Radius Tokens

**From `src/index.css`:**

```css
@theme inline {
  --radius: 0.5rem; /* 8px - MFB organic aesthetic */
  --radius-sm: calc(var(--radius) - 4px);  /* 4px */
  --radius-md: calc(var(--radius) - 2px);  /* 6px */
  --radius-lg: var(--radius);              /* 8px */
  --radius-xl: calc(var(--radius) + 4px);  /* 12px */
}
```

**Tailwind Classes:**

```tsx
rounded-sm   // 4px - small elements
rounded-md   // 6px - inputs, badges
rounded-lg   // 8px - cards, buttons
rounded-xl   // 12px - large cards, dialogs
rounded-full // 9999px - avatars, pills
```

**Usage:**

```tsx
// Card with organic aesthetic
<Card className="rounded-xl">  {/* 12px */}

// Button with standard radius
<Button className="rounded-lg">  {/* 8px */}

// Input field
<Input className="rounded-md" />  {/* 6px */}

// Badge/Pill
<Badge className="rounded-full">  {/* Fully rounded */}
```

## Shadow Tokens (Elevation)

**Three-tier system:**

```css
/* Elevation 1: Low - List items, default cards */
--elevation-1:
  0px 1px 2px -1px oklch(30% 0.010 92 / 0.05),
  0px 1px 3px -1px oklch(30% 0.010 92 / 0.10);

/* Elevation 2: Medium - Hover states, focused cards */
--elevation-2:
  0px 2px 4px -1px oklch(30% 0.010 92 / 0.06),
  0px 4px 6px -1px oklch(30% 0.010 92 / 0.12);

/* Elevation 3: High - Modals, dropdowns, tooltips */
--elevation-3:
  0px 10px 15px -3px oklch(30% 0.010 92 / 0.08),
  0px 4px 6px -2px oklch(30% 0.010 92 / 0.10);
```

**Tailwind Mapping:**

```tsx
shadow-sm  → Elevation 1 (default)
shadow-md  → Elevation 2 (hover)
shadow-lg  → Elevation 3 (floating)
shadow-xl  → Extra high (overlays)
```

**Usage:**

```tsx
// Default card
<Card className="shadow-sm">  {/* Elevation 1 */}

// Hover state
<Card className="shadow-sm hover:shadow-md transition-shadow">
  {/* Elevation 1 → 2 on hover */}
</Card>

// Modal/Dialog
<Dialog className="shadow-lg">  {/* Elevation 3 */}
```

## Animation/Transition Tokens

**Standard transitions:**

```tsx
// Color transitions (buttons, hovers)
transition-colors duration-150

// Shadow transitions (elevation changes)
transition-shadow duration-150

// All properties (complex animations)
transition-all duration-200

// Transform (slide-ins, scale)
transition-transform duration-200
```

**Usage:**

```tsx
// Button hover
<Button className="transition-colors hover:bg-primary/90">
  Smooth color transition
</Button>

// Card elevation
<Card className="shadow-sm hover:shadow-md transition-shadow duration-150">
  Smooth shadow transition
</Card>

// Dropdown animation
<div className="transition-all duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out">
  Smooth open/close
</div>
```

## Validation Helpers

**Development-time validation:**

```typescript
// src/lib/design-system/spacing.ts

/** Validates touch target size */
export const validateTouchTarget = (size: number, componentName: string): void => {
  if (process.env.NODE_ENV === 'development') {
    if (size < TOUCH_TARGET_MIN) {
      throw new Error(
        `[Design System] ${componentName} has ${size}px touch target (minimum: ${TOUCH_TARGET_MIN}px)`
      );
    }
  }
};

/** Non-throwing check */
export const isTouchTargetValid = (size: number): boolean => {
  return size >= TOUCH_TARGET_MIN;
};
```

**Usage:**

```typescript
// In component
useEffect(() => {
  const buttonHeight = buttonRef.current?.offsetHeight || 0;
  validateTouchTarget(buttonHeight, 'CustomButton');
}, []);
```

## Accessibility Considerations

### Minimum Sizes

- **Touch Targets:** 44x44px minimum (WCAG 2.5.5 Level AAA)
- **Body Text:** 14px minimum (text-sm)
- **Click Gap:** 8px minimum between interactive elements

### Color Contrast

All token-based colors maintain WCAG AA contrast ratios:
- Body text: 4.5:1 minimum
- Large text (18px+): 3:1 minimum
- UI components: 3:1 minimum

## Performance Notes

- CSS variables have ~0 performance impact (native browser)
- TypeScript constants are compile-time only (zero runtime cost)
- Tailwind JIT compiles only used classes
- Shadow tokens: ~0.5ms per card (negligible)

## Best Practices

### DO
✅ Use semantic spacing tokens (--spacing-widget, --spacing-section)
✅ Maintain 44x44px minimum touch targets
✅ Use 4px base unit for all spacing
✅ Apply iPad-first responsive patterns (optimize md:)
✅ Use TypeScript constants for validation logic
✅ Test on iPad viewport (768px-1024px) first
✅ Use Tailwind utility classes (not inline CSS variables)

### DON'T
❌ Create custom spacing values outside 4px scale
❌ Use touch targets smaller than 44x44px
❌ Skip responsive variants (always consider mobile/iPad/desktop)
❌ Hardcode pixel values (use tokens)
❌ Use inline CSS variable syntax in className
❌ Test only on desktop (iPad is primary)
❌ Mix spacing systems (stick to tokens)

## Common Issues & Solutions

### Issue: Button too small for touch

**Solution:** Use minimum size classes

```tsx
// ❌ BAD: Below minimum
<button className="h-10 w-10">  {/* 40px */}

// ✅ GOOD: Meets minimum
<Button size="sm" className="h-11 w-11">  {/* 44px */}
```

### Issue: Inconsistent spacing

**Solution:** Use semantic tokens

```tsx
// ❌ BAD: Random values
<div className="mb-5 mt-7 px-3">

// ✅ GOOD: Token-based
<div className="space-y-6 px-4 md:px-6">  {/* --spacing-section, --spacing-widget-padding */}
```

### Issue: Poor iPad experience

**Solution:** Optimize md: breakpoint

```tsx
// ❌ BAD: Mobile-first only
<div className="p-2 lg:p-8">  {/* Cramped on iPad */}

// ✅ GOOD: iPad-optimized
<div className="p-4 md:p-6 lg:p-8">  {/* Comfortable on iPad */}
```

## Related Resources

- [Design Tokens Overview](design-tokens.md) - Main tokens documentation
- [Spacing & Grid](tokens-spacing-grid.md) - Grid system and breakpoints
- [Color System](color-system.md) - Color tokens and semantic mapping
- [Component Architecture](component-architecture.md) - Using tokens in components
