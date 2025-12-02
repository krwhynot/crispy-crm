# Status & Semantic Colors

Complete status color system for success, warning, error, and info states in Atomic CRM.

## Success (Emerald Green - Hue 155°)

**Differentiated from brand forest green (142°):**

```css
--success-subtle: oklch(92% 0.08 155);
--success-default: oklch(56% 0.115 155);  /* #10B981 - Bright emerald */
--success-strong: oklch(48% 0.12 155);
--success-bg: oklch(95% 0.05 155);
--success-border: oklch(78% 0.09 155);
--success-hover: oklch(60% 0.112 155);
--success-active: oklch(52% 0.117 155);
--success-disabled: oklch(72% 0.06 155);
```

**Usage:**

```tsx
// Success alert
<Alert className="bg-success-bg border-success-border">
  <CheckCircle className="text-success-default" />
  <AlertDescription className="text-success-strong">
    Organization created successfully
  </AlertDescription>
</Alert>

// Success badge
<Badge className="bg-success text-white">
  Active
</Badge>

// Success button (rare - usually use primary)
<Button className="bg-success text-white hover:bg-success-hover">
  Confirm
</Button>
```

### Success Color Characteristics

- **Hue 155°:** Bright emerald, distinct from brand forest green (142°)
- **Lightness range:** 48-95% (strong to subtle backgrounds)
- **Chroma:** 0.05-0.12 (high saturation for visibility)
- **Primary success:** --success-default (56% lightness)
- **Contrast:** 4.8:1 on white, meets WCAG AA

### Success Best Practices

✅ Use for completed actions, active states, positive feedback
✅ Always pair with CheckCircle or similar icon
✅ Use subtle backgrounds (success-bg) for alerts
✅ Use default/strong for text and icons

❌ Don't use for primary CTAs (use brand green)
❌ Don't rely on color alone - add icons/text
❌ Don't use success-strong on dark backgrounds

## Warning (Golden Amber - Hue 85°)

```css
--warning-subtle: oklch(94% 0.055 85);
--warning-default: oklch(68% 0.14 85);
--warning-strong: oklch(58% 0.145 85);
--warning-bg: oklch(96% 0.045 85);
--warning-border: oklch(82% 0.115 85);
--warning-hover: oklch(72% 0.137 85);
--warning-active: oklch(64% 0.142 85);
--warning-disabled: oklch(78% 0.065 85);
```

**Usage:**

```tsx
// Warning message
<Alert variant="warning" className="bg-warning text-warning-foreground">
  <AlertTriangle className="h-4 w-4" />
  <AlertDescription>
    This action cannot be undone
  </AlertDescription>
</Alert>

// Warning badge
<Badge className="bg-warning/15 text-warning border-warning">
  Pending Review
</Badge>

// Warning button (rare)
<Button className="bg-warning text-warning-foreground hover:bg-warning-hover">
  Proceed with Caution
</Button>
```

### Warning Color Characteristics

- **Hue 85°:** Golden amber, warm and attention-grabbing
- **Lightness range:** 58-96% (strong to subtle backgrounds)
- **Chroma:** 0.045-0.145 (high saturation for urgency)
- **Primary warning:** --warning-default (68% lightness)
- **Contrast:** 4.7:1 on white, meets WCAG AA

### Warning Best Practices

✅ Use for caution messages, pending states, non-critical issues
✅ Always pair with AlertTriangle or similar icon
✅ Use for actions that are risky but not destructive
✅ Use subtle backgrounds (warning-bg) for inline alerts

❌ Don't use for errors (use destructive)
❌ Don't overuse - reduces impact
❌ Don't use warning-strong as background color

## Error/Destructive (Terracotta - Hue 25°)

```css
--error-subtle: oklch(92% 0.075 25);
--error-default: oklch(58% 0.13 25);
--error-strong: oklch(48% 0.135 25);
--error-bg: oklch(95% 0.055 25);
--error-border: oklch(80% 0.105 25);
--error-hover: oklch(62% 0.127 25);
--error-active: oklch(54% 0.132 25);
--error-disabled: oklch(72% 0.07 25);

/* Primary destructive mapping */
--destructive: oklch(58% 0.18 27);  /* Slightly lighter for cream bg */
--destructive-foreground: oklch(99% 0 0);
```

**Usage:**

```tsx
// Destructive button
<Button variant="destructive">
  {/* bg-destructive, text-destructive-foreground */}
  Delete Organization
</Button>

// Error message
<Alert variant="destructive">
  <XCircle className="h-4 w-4" />
  <AlertDescription>Failed to save changes</AlertDescription>
</Alert>

// Form error
<p className="text-sm text-destructive">
  {errors.email?.message}
</p>

// Error badge
<Badge className="bg-destructive text-white">
  Failed
</Badge>
```

### Error/Destructive Color Characteristics

- **Hue 25-27°:** Warm terracotta, less aggressive than pure red
- **Lightness range:** 48-95% (strong to subtle backgrounds)
- **Chroma:** 0.07-0.18 (high saturation for critical actions)
- **Primary destructive:** --destructive (58% lightness, high chroma)
- **Contrast:** 5.1:1 on white, exceeds WCAG AA

### Error/Destructive Best Practices

✅ Use for errors, destructive actions, critical alerts
✅ Always pair with XCircle or Trash icon
✅ Use `variant="destructive"` for delete buttons
✅ Use for form validation errors

❌ Don't use for warnings (use warning colors)
❌ Don't use for primary CTAs
❌ Don't use destructive-strong on dark backgrounds

## Info (Sage-Teal - Hue 200°)

```css
--info-subtle: oklch(94% 0.04 200);
--info-default: oklch(58% 0.065 200);
--info-strong: oklch(48% 0.07 200);
--info-bg: oklch(96% 0.03 200);
--info-border: oklch(80% 0.055 200);
--info-hover: oklch(62% 0.062 200);
--info-active: oklch(54% 0.067 200);
--info-disabled: oklch(72% 0.04 200);
```

**Usage:**

```tsx
// Info alert
<Alert className="bg-info-bg border-info-border">
  <Info className="text-info-default" />
  <AlertDescription className="text-info-strong">
    This organization has 3 branch locations
  </AlertDescription>
</Alert>

// Info badge
<Badge className="bg-info/15 text-info border-info">
  New Feature
</Badge>

// Info message in card
<Card className="border-info-border">
  <CardHeader>
    <Info className="text-info-default" />
    <CardTitle className="text-info-strong">Helpful Tip</CardTitle>
  </CardHeader>
  <CardContent className="text-info-default">
    You can filter results using the search box above
  </CardContent>
</Card>
```

### Info Color Characteristics

- **Hue 200°:** Sage-teal, calm and informative
- **Lightness range:** 48-96% (strong to subtle backgrounds)
- **Chroma:** 0.03-0.07 (lower saturation, less urgent)
- **Primary info:** --info-default (58% lightness)
- **Contrast:** 4.9:1 on white, meets WCAG AA

### Info Best Practices

✅ Use for helpful tips, neutral information, feature announcements
✅ Always pair with Info icon
✅ Use for non-critical system messages
✅ Use subtle backgrounds (info-bg) for inline messages

❌ Don't use for errors or warnings
❌ Don't use for primary CTAs
❌ Don't overuse - keep info special

## Overlay/Backdrop Colors

```css
/* Modal/dialog backdrops */
--overlay: oklch(0 0 0 / 50%);        /* Black 50% for modals */
--overlay-light: oklch(0 0 0 / 30%);  /* Lighter variant */

/* Loading overlays */
--loading-overlay: oklch(100% 0 0 / 60%);  /* White 60% */
```

**Usage:**

```tsx
// Modal backdrop
<Dialog>
  <DialogOverlay className="bg-overlay" />
  <DialogContent>
    {/* Modal content */}
  </DialogContent>
</Dialog>

// Loading spinner overlay
<div className="absolute inset-0 bg-loading-overlay flex items-center justify-center">
  <Spinner />
</div>

// Sheet backdrop (lighter)
<Sheet>
  <SheetOverlay className="bg-overlay-light" />
  <SheetContent>
    {/* Sheet content */}
  </SheetContent>
</Sheet>
```

## Accessibility Considerations

### WCAG Contrast Ratios

All color combinations meet WCAG AA (4.5:1 for text):

```css
/* Primary button: 10.8:1 (WCAG AAA) */
bg-primary (L=38%) + text-primary-foreground (L=99%) = 10.8:1 ✅

/* Body text: 17:1 (WCAG AAA) */
bg-background (L=97.5%) + text-foreground (L=20%) = ~17:1 ✅

/* Muted text: 5.2:1 (WCAG AA) */
bg-background (L=97.5%) + text-muted-foreground (L=71.6%) = ~5.2:1 ✅

/* Success text: 4.8:1 (WCAG AA) */
bg-card (L=100%) + text-success-default (L=56%) = ~4.8:1 ✅

/* Warning text: 4.7:1 (WCAG AA) */
bg-card (L=100%) + text-warning-default (L=68%) = ~4.7:1 ✅

/* Destructive text: 5.1:1 (WCAG AA) */
bg-card (L=100%) + text-destructive (L=58%) = ~5.1:1 ✅

/* Info text: 4.9:1 (WCAG AA) */
bg-card (L=100%) + text-info-default (L=58%) = ~4.9:1 ✅
```

### Color Blindness

OKLCH's perceptual uniformity helps with color blindness:
- Lightness differences are perceivable to all
- Avoid relying solely on hue (use icons + text)
- Success/error states use both color AND iconography

**Good Pattern:**

```tsx
// ✅ Uses color + icon + text
<Alert variant="success">
  <CheckCircle className="h-4 w-4" />  {/* Icon */}
  <AlertTitle>Success</AlertTitle>      {/* Text */}
  <AlertDescription>Changes saved</AlertDescription>
</Alert>

// ❌ Color only (insufficient)
<div className="bg-success-bg">Changes saved</div>
```

## Common Issues & Solutions

### Issue: Text contrast too low

**Solution:** Use color contrast checker

```tsx
// ❌ BAD: Low contrast (3.2:1)
<p className="text-neutral-400">  {/* L=71.6% on L=97.5% */}

// ✅ GOOD: High contrast (5.2:1)
<p className="text-neutral-500">  {/* L=57.7% on L=97.5% */}
```

### Issue: Success looks too similar to brand

**Solution:** Use emerald (155°) not forest green (142°)

```tsx
// ❌ BAD: Brand green for success
<Badge className="bg-primary text-white">Completed</Badge>

// ✅ GOOD: Emerald green for success
<Badge className="bg-success text-white">Completed</Badge>
```

### Issue: Warning not visible enough

**Solution:** Use warning-default or warning-strong, not warning-subtle

```tsx
// ❌ BAD: Too subtle
<AlertTriangle className="text-warning-subtle" />

// ✅ GOOD: Clear visibility
<AlertTriangle className="text-warning-default" />
```
