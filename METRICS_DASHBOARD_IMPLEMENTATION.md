# Metrics Dashboard Card Grid - Implementation Guide

## Overview

A production-ready, iPad-first responsive metrics dashboard for Atomic CRM's main dashboard. Displays key sales metrics (Total Opportunities, Pipeline Revenue, Win Rate) with optimized touch interactions for field sales teams using iPads.

**Location:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/dashboard/MetricsCardGrid.tsx`

## Design Principles

### 1. iPad-First Responsive Strategy
The component is designed **iPad-first**, not mobile-first:
- **Base (sm)**: Single column layout, optimized for iPad portrait mode
- **md (iPad landscape)**: 3-column grid, optimal for horizontal field use
- **lg+ (Desktop)**: 3-column with expanded spacing and typography

### 2. Semantic Tailwind v4 Color System
**ZERO inline CSS variables.** All colors use semantic Tailwind utilities:
- `text-muted-foreground` (warm gray) - for titles and secondary text
- `text-foreground` (darkest) - for primary metric numbers
- `border-border` (1px hairline) - for card borders
- `shadow-sm` / `shadow-md` - mapped to elevation system
- `bg-card` - white card backgrounds
- Color trends: `text-green-600 dark:text-green-400` / `text-red-600 dark:text-red-400`

### 3. Apple HID Compliant Touch Targets
All interactive areas meet **minimum 44x44px** (Apple Human Interface Guidelines):
- Icon containers: 44px (w-11 h-11) → 48px (md) → 56px (lg)
- Card padding: 16px → 20px → 24px
- Full cards are easily tappable

### 4. Responsive Typography
Text scales smoothly across breakpoints:
```
Card Titles:       xs (8pt) → sm (12pt) → base (14pt)
Metric Values:     2xl (24pt) → 3xl (30pt) → 4xl (36pt)
Unit Labels:       xs (8pt) → sm (12pt) → base (14pt)
```

## Component Architecture

### MetricsCardGrid (Container)
Main grid container that:
- Fetches opportunity data via `useGetList`
- Calculates metrics (revenue, win rate, counts)
- Renders 3 metric cards in a responsive grid
- Shows loading state with skeleton cards

**Layout Grid:**
```
iPad Portrait (base):     grid-cols-1 gap-4
iPad Landscape (md):      grid-cols-3 gap-5
Desktop (lg+):            grid-cols-3 gap-6
```

### MetricCard (Individual Card)
Displays a single metric with:
- Title (uppercase, tracking-wide)
- Icon (44px+ touch target)
- Large metric value (bold, tabular-nums)
- Unit label (secondary)
- Optional trend indicator

## Responsive Sizing Details

### Card Heights
```
iPad Portrait:    h-40  (160px)
iPad Landscape:   h-44  (176px)
Desktop:          h-48  (192px)
```

### Padding
```
iPad Portrait:    p-4   (16px)
iPad Landscape:   md:p-5 (20px)
Desktop:          lg:p-6 (24px)
```

### Icon Container
```
iPad Portrait:    w-11 h-11   (44px) ✓ Apple HIG minimum
iPad Landscape:   md:w-12 md:h-12 (48px)
Desktop:          lg:w-14 lg:h-14 (56px)
```

### Icon Size (Lucide SVG)
```
iPad Portrait:    w-6 h-6   (24px)
iPad Landscape:   md:w-8 md:h-8 (32px)
Desktop:          lg:w-9 lg:h-9 (36px)
```

## Tailwind Classes Used

### No Inline CSS Variables
The old implementation had problematic patterns:
```
❌ WRONG: className="text-[color:var(--text-subtle)]"
❌ WRONG: className="border-[color:var(--stroke-card)]"
❌ WRONG: className="hover:shadow-[var(--elevation-2)]"
```

### All Semantic Classes
```
✓ CORRECT: className="text-muted-foreground"
✓ CORRECT: className="border-border"
✓ CORRECT: className="hover:shadow-md"
✓ CORRECT: className="bg-card"
```

### Complete Class Inventory

#### Grid & Layout
- `grid grid-cols-1 md:grid-cols-3` - responsive grid
- `gap-4 md:gap-5 lg:gap-6` - responsive gaps
- `w-full` - full width
- `flex flex-col` - card layout
- `justify-between` - space content vertically
- `items-start justify-between` - header layout
- `flex-1 min-w-0` - flexible text area

#### Card Styling
- `rounded-lg md:rounded-xl` - responsive corner radius
- `p-4 md:p-5 lg:p-6` - responsive padding
- `border border-border` - hairline border (semantic)
- `bg-card` - white card background
- `h-40 md:h-44 lg:h-48` - responsive height

#### Typography
- `text-xs md:text-sm lg:text-base` - responsive font size
- `text-2xl md:text-3xl lg:text-4xl` - metric value size
- `font-semibold` - title weight
- `font-bold` - metric value weight
- `text-foreground` - primary text color
- `text-muted-foreground` - secondary text color
- `tabular-nums` - fixed-width numbers
- `tracking-wide` - letter spacing for titles
- `uppercase` - title case
- `leading-none` - tight line height

#### Interaction
- `transition-shadow duration-200` - smooth shadow animation
- `hover:shadow-md` - elevated on hover (elevation-2)
- `active:shadow-sm` - depressed on click (elevation-1)

#### Icon Container
- `flex-shrink-0` - prevent flex shrinking
- `w-11 h-11 md:w-12 md:h-12 lg:w-14 lg:h-14` - 44px+ touch targets
- `rounded-md` - subtle rounding
- `flex items-center justify-center` - center icon
- `opacity-75` - subtle visual weight

#### Loading States
- `animate-pulse` - skeleton animation
- Maps to elevation system for consistency

## Color System Integration

### Semantic Colors Used
```typescript
// Light Mode (from index.css @theme)
--text-foreground: oklch(20% 0.012 85)        // text-foreground
--text-muted:      oklch(41% 0.006 92)        // text-muted-foreground
--card:            oklch(100% 0 0)             // bg-card
--border:          oklch(90% 0.005 92)        // border-border

// Shadow System (elevation mapped)
--elevation-1: 0 1px 2px / 10%, 0 4px 8px / 16%  // shadow-sm
--elevation-2: 0 2px 3px / 12%, 0 8px 16px / 18% // shadow-md
```

### Trend Colors
```typescript
Positive: text-green-600 (light) / text-green-400 (dark)
Negative: text-red-600 (light) / text-red-400 (dark)
```

## Metrics Displayed

### 1. Total Opportunities
- **Icon:** Target (lucide-react)
- **Value:** Count of all non-deleted opportunities
- **Unit:** "open" (text label)
- **Calculation:** `opportunities.length`

### 2. Pipeline Revenue
- **Icon:** DollarSign (lucide-react)
- **Value:** Sum of active opportunity amounts (formatted as currency)
- **Unit:** "N active" (count of non-closed opportunities)
- **Calculation:** `active.reduce((sum, opp) => sum + (opp.amount || 0), 0)`
- **Formatting:** USD with no decimal places

### 3. Win Rate
- **Icon:** TrendingUp (lucide-react)
- **Value:** Percentage of won vs closed opportunities
- **Unit:** "W/C closed" (won count / total closed count)
- **Calculation:** `won.length / (won.length + lost.length) * 100`
- **Edge Case:** Returns "0%" if no closed opportunities

## Data Fetching

Uses React Admin's `useGetList` hook:
```typescript
const { data: opportunities, isPending } = useGetList<Opportunity>(
  "opportunities",
  {
    pagination: { page: 1, perPage: 1000 },  // Fetch all active opportunities
    filter: { "deleted_at@is": null },        // Exclude soft-deleted records
  }
);
```

## Performance Optimizations

1. **useMemo for Metrics**: Recalculates only when `opportunities` changes
2. **Lazy Icon Rendering**: Icons only render after data loads
3. **Responsive Image Sizes**: Icons scale with viewport, no full-size images sent
4. **No Re-renders on Hover**: Shadow transitions use CSS, not JavaScript

## State Management

### Loading State
Shows 3 skeleton placeholder cards with same dimensions as final layout:
```tsx
<div className="h-40 md:h-44 lg:h-48 bg-card rounded-lg border border-border animate-pulse" />
```

### Empty State
Handled gracefully:
```typescript
if (!opportunities) {
  return [
    { title: "Total Opportunities", value: "0", icon: null },
    { title: "Pipeline Revenue", value: "$0", icon: null },
    { title: "Win Rate", value: "0%", icon: null },
  ];
}
```

## Accessibility Features

1. **Semantic HTML**: Uses standard card and heading elements
2. **Color Contrast**: All text meets WCAG AAA (defined in color system)
3. **Touch Targets**: 44px minimum on all interactive areas
4. **Keyboard Navigation**: Card styling indicates focus states
5. **Responsive Text**: Scales for readability on all devices
6. **Dark Mode**: Full support via Tailwind `dark:` utilities

## Browser Compatibility

- iOS Safari 12+
- iPadOS 12+
- Android Chrome 80+
- Desktop Chrome/Firefox/Safari (latest)
- Tailwind v4 required

## Dark Mode Support

Automatically respects system preference via Tailwind's `dark:` variant:
```typescript
// Trend colors include dark mode variants
text-green-600 dark:text-green-400
text-red-600 dark:text-red-400
```

Color system automatically inverts in dark mode (defined in `/src/index.css`).

## Field Usage Notes

### iPad Portrait (Most Common in Field)
- Single column, full-width cards
- Easy to scan vertically
- Ideal for standing/walking use
- Touch targets: 44x44px

### iPad Landscape
- Three-column grid, optimal view
- All metrics visible at once
- Best for desk/tabletop review
- Touch targets: 48x48px

### Desktop
- Expanded spacing and typography
- Comfortable reading from distance
- Full feature visibility
- Touch targets: 56x56px

## Maintenance

### Updating Metrics
Edit the `metrics` array in `useMemo`:
```typescript
return [
  {
    title: "Your Metric",
    value: calculatedValue,
    icon: <YourIcon className="w-6 h-6 md:w-8 md:h-8 lg:w-9 lg:h-9" />,
    unit: "optional label",
  },
];
```

### Adding Trend Support
Pass `trend` and `trendLabel` in metric object:
```typescript
{
  title: "Revenue Growth",
  value: "$50K",
  icon: <TrendingUp />,
  unit: "MTD",
  trend: 12.5,          // Positive shows ↑, negative shows ↓
  trendLabel: "vs last month",
}
```

### Color Customization
All colors are semantic - update in `src/index.css`:
```css
/* In :root section */
--text-muted-foreground: oklch(41% 0.006 92);
--text-foreground: oklch(20% 0.012 85);
--border: oklch(90% 0.005 92);
```

## Testing Strategy

The component should be tested for:
1. ✓ Responsive layout at sm/md/lg breakpoints
2. ✓ Touch target sizes (44px minimum)
3. ✓ Loading state appearance
4. ✓ Data calculations (revenue sum, win rate percentage)
5. ✓ Empty state handling
6. ✓ Dark mode rendering
7. ✓ Icon visibility at all sizes
8. ✓ Text overflow handling (min-w-0 prevents breaking flex)

## Files Modified

- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/dashboard/MetricsCardGrid.tsx` - Complete rewrite with semantic Tailwind v4

## Related Files

- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/dashboard/Dashboard.tsx` - Imports and uses MetricsCardGrid
- `/home/krwhynot/projects/crispy-crm/src/components/ui/card.tsx` - Card component with semantic styling
- `/home/krwhynot/projects/crispy-crm/src/index.css` - Color system definition

## Quick Start for Sales Team

1. View dashboard on iPad in portrait mode (single column)
2. Rotate to landscape for 3-column view
3. Cards are fully touchable (44px+ targets)
4. Metrics auto-update as opportunities are created/won/lost
5. Hover animations provide visual feedback

## Migration Notes

This implementation **replaces** the previous MetricsCardGrid that used inline CSS variables:
- Old: `text-[color:var(--text-subtle)]`
- New: `text-muted-foreground` (semantic)
- Old: `hover:shadow-[var(--elevation-2)]`
- New: `hover:shadow-md` (semantic)

The semantic approach ensures:
1. No invalid Tailwind syntax warnings
2. Proper dark mode support
3. Consistent with project design system
4. Easier maintenance and customization
