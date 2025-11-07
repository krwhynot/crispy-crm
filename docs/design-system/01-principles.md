# Design System Principles

## Engineering Constitution Alignment

This design system follows Atomic CRM's Engineering Constitution:

### 1. No Over-Engineering

**Principle:** Fail fast, no circuit breakers, minimal abstraction

**Applied:**
- ❌ No custom breakpoint system (use Tailwind md:, lg:, xl:)
- ❌ No TouchTarget wrapper (fix components at source)
- ✅ Only 2 ResponsiveGrid variants (dashboard, cards)
- ✅ Document standards, add utilities only when genuinely needed

**Example:**
```typescript
// ❌ BAD: Over-engineered wrapper
<TouchTarget size="minimum">
  <button className="size-8">Icon</button>
</TouchTarget>

// ✅ GOOD: Fix button at source
<Button size="icon" className="size-12">{/* 48px ✅ */}</Button>
```

### 2. Single Source of Truth

**Principle:** Validate at API boundary (Supabase + Zod), form state from schema

**Applied:**
- Touch target constants in `spacing.ts` (TOUCH_TARGET_MIN = 44)
- Focus ring styles in `accessibility.ts` (focusRing constant)
- Grid patterns in `ResponsiveGrid.tsx` (dashboard, cards)
- Color system in `src/index.css` (OKLCH semantic tokens)

### 3. Boy Scout Rule

**Principle:** Fix inconsistencies when editing files

**Applied:**
- When touching a component, validate touch targets
- When adding interactivity, add keyboard navigation
- When showing dynamic content, add screen reader announcements

## iPad-First Responsive Design

**Philosophy:** Design for iPad (768-1024px), then scale up (desktop) and down (mobile)

### Breakpoint Strategy

| Viewport | Width | Tailwind | Layout Strategy |
|----------|-------|----------|-----------------|
| **Mobile Portrait** | < 768px | Default (no prefix) | Single column, stacked, bottom sheets |
| **iPad Portrait** | 768-1023px | `md:` | Base design, 2-column where appropriate |
| **iPad Landscape** | 1024-1279px | `lg:` | Multi-column grids, sidebars visible |
| **Desktop** | 1280px+ | `xl:` | Maximum 3 columns, wider content areas |

### When to Use JavaScript

**Use Tailwind classes first:**
```tsx
// ✅ GOOD: Responsive with Tailwind classes
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {items.map(item => <Card key={item.id} {...item} />)}
</div>
```

**Use JavaScript hooks only when necessary:**
```tsx
// ✅ GOOD: Conditional rendering needs JS
const { isMobile } = useBreakpoint();
if (isMobile) return <BottomSheet />;
return <Modal />;
```

## Touch-Friendly Interactions

### Touch Target Sizes

**WCAG 2.5.5:** Minimum 44x44px for interactive elements

**Our standard:** 48x48px (h-12 in Tailwind)

```typescript
// All button sizes meet 44px minimum
const buttonVariants = {
  size: {
    default: "h-12 px-6",  // 48px ✅
    sm: "h-12 px-4",       // 48px ✅
    lg: "h-12 px-8",       // 48px ✅
    icon: "size-12",       // 48x48px ✅
  },
};
```

### Touch Target Spacing

**Minimum gap:** 8px between touch targets (Tailwind gap-2)

```tsx
// ✅ GOOD: 8px gap between buttons
<div className="flex gap-2">
  <Button>Save</Button>
  <Button variant="outline">Cancel</Button>
</div>
```

## Accessibility (WCAG 2.1 AA)

### Color Contrast

**Requirements:**
- Text: 4.5:1 minimum (normal text)
- Large text: 3.0:1 minimum (18px+ or 14px+ bold)
- Focus indicators: 3.0:1 minimum

**Validation:**
```bash
npm run validate:colors
```

### Keyboard Navigation

**Requirements:**
- All interactive elements keyboard-accessible (Tab, Shift+Tab)
- Visible focus indicators (3px ring)
- Logical tab order (left-to-right, top-to-bottom)
- Arrow keys for lists/tables (Home, End for first/last)

**Implementation:**
```typescript
// Standard focus ring (already in button.tsx)
import { focusRing } from '@/lib/design-system';
className={cn("...", focusRing)}

// Arrow key navigation for tables
const { handleKeyDown } = useKeyboardNavigation({ items, onSelect });
<div onKeyDown={handleKeyDown} tabIndex={0}>...</div>
```

### Screen Reader Support

**Requirements:**
- ARIA landmarks (main, nav, aside)
- ARIA live regions for dynamic updates
- Descriptive labels for all inputs
- Alt text for all images

**Implementation:**
```typescript
// Announce dynamic updates
const announce = useAriaAnnounce();
announce('Dashboard data refreshed');

// ARIA landmarks
<main role="main" aria-label="Dashboard">
  <nav role="navigation" aria-label="Main navigation">
```

## Testing Strategy

### Automated Tests

```bash
# TypeScript compilation
npx tsc --noEmit

# Color contrast validation
npm run validate:colors

# Accessibility audit (axe-core via Playwright)
npm run test:e2e
```

### Manual Testing

**Breakpoints:**
1. Test on 375px (mobile), 768px (iPad portrait), 1024px (iPad landscape), 1280px (desktop)
2. Use Chrome DevTools device toolbar
3. Verify layouts don't break, no horizontal scroll

**Keyboard Navigation:**
1. Tab through entire page
2. Verify all interactive elements receive focus
3. Verify focus visible (3px ring)
4. Test arrow keys in tables/lists

**Screen Reader:**
1. Test with NVDA (Windows) or VoiceOver (Mac)
2. Verify all content announced
3. Verify dynamic updates announced
4. Verify landmark navigation works

## Decision Records

### Why No Custom Breakpoint System?

**Decision:** Use Tailwind's md:, lg:, xl: directly

**Rationale:**
- Tailwind breakpoints already match our strategy (768, 1024, 1280)
- Custom hook adds 50+ lines of duplicate logic
- Tailwind classes are more readable: `md:grid-cols-2` vs `{isTablet && ...}`

**Exception:** Use `useMediaQuery` hook only when conditional rendering truly requires JavaScript

### Why No TouchTarget Wrapper?

**Decision:** Fix components at source, don't wrap

**Rationale:**
- Button component already uses h-12 (48px) ✅
- Wrapper adds 60 lines of code, 0 value
- Constitution: "Fail fast" - if size is wrong, fix it, don't hide it

**Alternative:** Use `validateTouchTarget()` in dev mode to catch issues

### Why Only 2 ResponsiveGrid Variants?

**Decision:** Dashboard (70/30) and cards only, others use Tailwind

**Rationale:**
- Dashboard layout reused across 5+ pages - worth abstracting
- Card grid reused across all list pages - worth abstracting
- Two-column, three-column are one-offs - use `grid-cols-2`, `grid-cols-3` directly (YAGNI)

**Guideline:** Abstract when pattern used 3+ times, otherwise use Tailwind
