# Dashboard Styling Quick Reference Guide

## Styling Architecture at a Glance

**Stack**: Tailwind CSS v4 + CSS Custom Properties (OKLCH) + shadcn-ui

**No CSS modules, styled-components, or custom CSS files** - all styling is declarative in JSX using Tailwind classes and semantic tokens.

---

## Most Used Tokens

### Spacing (All Custom)
```
--spacing-section: 24px   → .space-y-section, .gap-section
--spacing-widget: 16px    → .space-y-widget, .gap-widget
--spacing-content: 12px   → .space-y-content, .gap-content, .p-content
--spacing-compact: 8px    → .space-y-compact, .gap-compact
```

### Colors (Semantic Only - Never Hex)
```
bg-primary              /* Forest green #336600 */
text-foreground         /* Dark text #333333 */
text-muted-foreground   /* Gray #666666 */
bg-muted               /* Light gray #F5F5F5 */
text-destructive       /* Red/terracotta */
bg-card                /* Pure white #FFFFFF */
```

### Elevation System
```
shadow-[var(--elevation-1)]   /* Cards, widgets */
shadow-[var(--elevation-2)]   /* Hover state, important panels */
shadow-[var(--elevation-3)]   /* Modals, floating menus */
```

### Responsive Breakpoints
```
Base (mobile)           → No prefix
md: (iPad 768px+)       → .md:text-sm, .md:grid-cols-2
lg: (Desktop 1440px+)   → .lg:text-3xl, .lg:grid-cols-3
```

---

## Component Styling Patterns

### Card (shadcn-ui)
```jsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Widget Title</CardTitle>
  </CardHeader>
  <CardContent>Content here</CardContent>
</Card>
```

**Styling Applied Automatically**:
- `bg-card` (white)
- `border-[var(--stroke-card)]` (subtle gray)
- `shadow-[var(--elevation-1)]` (warm-tinted)
- `rounded-xl` (8px radius)

### Button (shadcn-ui with CVA)
```jsx
import { Button } from "@/components/ui/button";

<Button variant="default" size="default">Click me</Button>
```

**Variants**:
- `default` - Forest green primary button
- `outline` - Border with hover effect
- `ghost` - No background
- `destructive` - Red/error button
- `secondary` - Light gray button
- `link` - Text link style

**Sizes**:
- `default` - h-12 px-6 (44px height)
- `sm` - h-12 px-4 (44px height, narrower)
- `lg` - h-12 px-8 (44px height, wider)
- `icon` - 44x44px square

### Widget Container (DashboardWidget)
```jsx
import { DashboardWidget } from "@/atomic-crm/dashboard/DashboardWidget";

<DashboardWidget
  title="My Widget"
  isLoading={isPending}
  error={error}
  onRetry={refetch}
  icon={<StarIcon />}
>
  {children}
</DashboardWidget>
```

**Styling Handled**:
- `p-[var(--spacing-widget-padding)]` - 12px padding
- `gap-6` between Card sections
- `min-h-[60px] md:min-h-[70px] lg:min-h-[80px]` - responsive height
- `transition-all` - smooth hover states
- Loading skeleton with `space-y-content`
- Error state with `text-destructive`

---

## Layout Patterns

### Dashboard Main (70/30 Split)
```jsx
<div className="grid grid-cols-1 lg:grid-cols-[70%_30%] gap-section">
  <div className="space-y-section">
    {/* Main content */}
  </div>
  <aside className="space-y-section">
    {/* Sidebar */}
  </aside>
</div>
```

### 3-Column Grid
```jsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-section">
  <div>Column 1</div>
  <div>Column 2</div>
  <div>Column 3</div>
</div>
```

### List with Compact Rows
```jsx
<div className="space-y-0">
  {items.map(item => (
    <div className="h-8 border-b border-border/30 hover:bg-accent/5 group">
      <span className="text-xs text-foreground">{item.title}</span>
      <span className="text-xs text-muted-foreground">{item.time}</span>
    </div>
  ))}
</div>
```

**Key**: `space-y-0` removes gaps, `border-b` adds dividers, `h-8` (32px) is row height

### Responsive Edge Padding
```jsx
<div className="p-edge-mobile md:p-edge-ipad lg:p-edge-desktop">
  {/* Content */}
</div>
```

Values:
- Mobile: 16px
- iPad: 60px
- Desktop: 24px

---

## Common CSS Tricks Used

### Truncate Text with Ellipsis
```jsx
<span className="truncate">{longText}</span>
```

### Fix Flex Min-Width Issue
```jsx
<div className="flex items-center gap-compact">
  <span className="flex-1 min-w-0 truncate">{text}</span>
</div>
```
The `min-w-0` prevents flex children from expanding past `truncate` width.

### Semantic Color Opacity
```jsx
className="bg-destructive/10 text-destructive"     /* Light red background */
className="hover:bg-accent/5"                      /* Very subtle hover */
className="border-border/30"                       /* Lighter border */
```

### Hidden Until Hover
```jsx
<input className="opacity-0 group-hover:opacity-100 transition-opacity" />
```
Parent must have `group` class.

### Focus Rings (Keyboard Navigation)
```jsx
className="focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:border-ring"
```

### Touch Target (Min 44px)
```jsx
className="min-h-[44px] flex items-center"
```

---

## Color Decision Tree

**For Text**:
- Headings → `text-foreground`
- Primary text → `text-foreground`
- Secondary text → `text-muted-foreground`
- Disabled/inactive → `text-muted-foreground`
- Error messages → `text-destructive`

**For Backgrounds**:
- Buttons → `bg-primary` (forest green)
- Cards → `bg-card` (white)
- Page background → `bg-background` (paper cream)
- Hover state → `bg-accent` or `bg-muted`
- Error zones → `bg-destructive/10`
- Input fields → `bg-input`

**For Borders**:
- Standard → `border-border`
- Subtle → `border-border/30`
- Focus → `focus-visible:border-ring`

---

## Spacing Decision Tree

Use **semantic tokens**, not hardcoded px:

- Between major sections (cards, panels) → `space-y-section` (24px)
- Between widgets on grid → `gap-section` (24px)
- Inside cards, between groups → `space-y-content` (12px), `gap-content` (12px)
- Inside cards, tight items → `space-y-compact` (8px), `gap-compact` (8px)
- Card internal padding → `p-content` (12px)
- Widget padding → `p-widget` (12px, same as content)

**Row heights** (for lists):
- Compact → `h-8` (32px)
- Comfortable → `h-10` (40px)

---

## Typography Patterns

### Heading Hierarchy
```jsx
{/* Page title */}
<h1 className="text-2xl lg:text-3xl font-bold text-foreground">
  My Principals
</h1>

{/* Section title */}
<h2 className="text-lg font-semibold text-foreground uppercase tracking-wider">
  MY TASKS THIS WEEK
</h2>

{/* Widget title (tiny) */}
<h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
  RECENT ACTIVITY
</h3>
```

### Body Text Variants
```jsx
{/* Primary body text */}
<p className="text-sm text-foreground">{text}</p>

{/* Secondary/metadata */}
<p className="text-xs text-muted-foreground">{metadata}</p>

{/* Metric numbers (emphasized) */}
<span className="text-lg font-bold">{count}</span>
```

---

## Icon Usage

**From Lucide React** (not Material UI):
```jsx
import { RefreshCw, Star, Clock } from 'lucide-react';

<Button>
  <RefreshCw className="h-4 w-4" />
  Refresh
</Button>
```

**Icon styling**:
- `h-4 w-4` - Small (16px)
- `h-5 w-5` - Medium (20px)
- `h-6 w-6` - Large (24px)
- `text-primary` or `text-muted-foreground` for color

---

## Accessibility (A11y) Requirements

**Keyboard Navigation**:
```jsx
<div
  className="cursor-pointer hover:bg-accent"
  role="button"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  }}
/>
```

**Focus Rings**:
```jsx
className="focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:border-ring"
```

**ARIA Labels**:
```jsx
<button aria-label="Quick log activity (Ctrl+L)" title="Quick log activity">
  + Quick Log
</button>
```

**Minimum Touch Targets** (44x44px):
```jsx
<button className="min-h-[44px] px-4 py-2">Action</button>
```

**Focus Trap** (modals):
```jsx
<Dialog open={open}>
  {/* Content automatically traps focus */}
</Dialog>
```

---

## Dark Mode

**Automatic** - just add `.dark` class to `<html>` or parent:
```jsx
<html className="dark">
  {/* All colors automatically adjust */}
</html>
```

**Customization by component**:
```jsx
// All components automatically respect .dark class
// No per-component dark mode overrides needed
```

---

## File Locations

| What | Where |
|------|-------|
| All color/spacing tokens | `/src/index.css` |
| Button variants | `/src/components/ui/button.constants.ts` |
| Card component | `/src/components/ui/card.tsx` |
| Dashboard main | `/src/atomic-crm/dashboard/Dashboard.tsx` |
| Dashboard widgets | `/src/atomic-crm/dashboard/*.tsx` |
| Design system docs | `/docs/architecture/design-system.md` |

---

## Do's and Don'ts

### Do
✅ Use semantic color tokens: `bg-primary`, `text-foreground`
✅ Use spacing tokens: `gap-section`, `p-content`, `space-y-widget`
✅ Use `cn()` to merge conflicting classes
✅ Use responsive prefixes: `lg:text-3xl`, `md:grid-cols-2`
✅ Use focus-visible for keyboard navigation
✅ Use semantic shadows: `shadow-[var(--elevation-1)]`

### Don't
❌ Hardcode colors: `bg-[#336600]`, `text-[#666]`
❌ Hardcode spacing: `p-4`, `gap-3`, `mt-12`
❌ Mix Tailwind with inline styles: `style={{ color: 'red' }}`
❌ Use `!important` to override styles
❌ Use `hover:` without `transition-` for smoothness
❌ Use custom CSS files or CSS modules for dashboard

---

## Common Mistakes to Avoid

1. **Forgetting `min-w-0` in truncated flex items**
   ```jsx
   // Bad - won't truncate
   <div className="flex"><span className="truncate">{text}</span></div>
   
   // Good - will truncate
   <div className="flex"><span className="min-w-0 truncate">{text}</span></div>
   ```

2. **Using hardcoded padding instead of tokens**
   ```jsx
   // Bad
   <div className="p-4 gap-3">
   
   // Good
   <div className="p-content gap-compact">
   ```

3. **Forgetting responsive breakpoints**
   ```jsx
   // Bad - only works on desktop
   <div className="text-3xl grid-cols-3">
   
   // Good - responsive on all sizes
   <div className="text-lg md:text-2xl lg:text-3xl grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
   ```

4. **Using hex colors directly**
   ```jsx
   // Bad
   className="bg-[#336600]"
   
   // Good
   className="bg-primary"
   ```

5. **Hardcoding row heights**
   ```jsx
   // Bad
   <div className="h-10 flex items-center">
   
   // Good
   <div className="h-8 flex items-center">  /* 32px compact row */
   ```

