# Spacing & Grid Tokens

## Grid System

**Desktop-optimized 12-column grid:**

```css
--spacing-grid-columns-desktop: 12;
--spacing-grid-columns-ipad: 8;
--spacing-gutter-desktop: 12px;
--spacing-gutter-ipad: 20px;
```

**Tailwind Grid:**

```tsx
// Dashboard: 3-column grid (desktop), 2-column (iPad), 1-column (mobile)
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 lg:gap-6">
  <StatCard />
  <StatCard />
  <StatCard />
</div>

// Full-width with gutters
<div className="grid grid-cols-12 gap-3 md:gap-5">
  <div className="col-span-12 md:col-span-8">  {/* Main content */}
  <div className="col-span-12 md:col-span-4">  {/* Sidebar */}
</div>
```

## Edge Padding (Screen Borders)

**Responsive edge spacing:**

```css
--spacing-edge-desktop: 24px;
--spacing-edge-ipad: 60px;
--spacing-edge-mobile: 16px;
```

**Usage:**

```tsx
// Page container with responsive edge padding
<div className="px-4 md:px-[60px] lg:px-6">
  {/* 16px → 60px → 24px */}
  <PageContent />
</div>

// Simpler pattern with Tailwind
<div className="px-4 md:px-12 lg:px-6">
  {/* Close approximation */}
</div>
```

## Widget/Card Internals

**Standard card spacing:**

```css
--spacing-widget-padding: 12px;
--spacing-widget-min-height: 240px;
```

**Usage:**

```tsx
// Dashboard widget with standard spacing
<Card className="p-3 min-h-[240px]">  {/* 12px padding, 240px min height */}
  <CardHeader className="px-6 py-4">
    <CardTitle>Widget Title</CardTitle>
  </CardHeader>
  <CardContent className="px-6 pb-6">
    {/* Content */}
  </CardContent>
</Card>
```

## Data Density Tokens (Desktop)

**Compact table rows for desktop:**

```css
--row-height-compact: 32px;
--row-height-comfortable: 40px;
--row-padding-desktop: 6px 12px;
--action-button-size: 28px;
```

**Usage:**

```tsx
// Compact table row (desktop)
<tr className="h-8 hover:bg-accent">  {/* 32px */}
  <td className="px-3 py-1.5">  {/* 12px, 6px */}
    Organization Name
  </td>
  <td>
    <Button size="icon" className="h-7 w-7">  {/* 28px action button */}
      <MoreHorizontal className="h-4 w-4" />
    </Button>
  </td>
</tr>

// Comfortable row (default)
<tr className="h-10">  {/* 40px */}
  {/* ... */}
</tr>
```

## Responsive Breakpoints

**iPad-first approach:**

```typescript
// Tailwind breakpoints
sm: '640px'   // Small phones (landscape)
md: '768px'   // iPad portrait (PRIMARY TARGET)
lg: '1024px'  // iPad landscape / small desktop
xl: '1280px'  // Desktop
2xl: '1536px' // Large desktop
```

**Usage Pattern:**

```tsx
// Design on iPad (md:), adapt down (base) and up (lg:)
<div className="
  p-4           {/* Mobile: 16px */}
  md:p-6        {/* iPad: 24px - PRIMARY */}
  lg:p-8        {/* Desktop: 32px */}
">
  Content optimized for iPad first
</div>

// Grid: 1 col mobile, 2 col iPad, 3 col desktop
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* ... */}
</div>
```

## Typography Sizing

**Minimum body text: 14px (text-sm)**

```typescript
text-xs    = 12px  // Metadata, timestamps
text-sm    = 14px  // Body text (minimum for readability)
text-base  = 16px  // Emphasized body text
text-lg    = 18px  // Section headers
text-xl    = 20px  // Page headers
text-2xl   = 24px  // Large headers
text-3xl   = 30px  // Hero text
text-4xl   = 36px  // Marketing/landing
```

**Usage:**

```tsx
// Page title
<h1 className="text-2xl font-bold">Organizations</h1>

// Section header
<h2 className="text-lg font-semibold">Contact Information</h2>

// Body text
<p className="text-sm text-muted-foreground">
  Description text with 14px minimum
</p>

// Metadata
<span className="text-xs text-muted-foreground">
  Updated 2 hours ago
</span>
```

## Related Resources

- [Design Tokens Overview](design-tokens.md) - Main tokens documentation
- [Touch & Animation](tokens-touch-animation.md) - Touch targets and transitions
- [Typography](typography.md) - Font sizing and hierarchy
- [Component Architecture](component-architecture.md) - Using tokens in components
