# Interactive Elements

## Industry Standards

### WCAG 2.2 SC 2.5.8 - Target Size (Minimum) - Level AA
- **URL**: https://www.w3.org/TR/WCAG22/#target-size-minimum
- **Minimum target size**: 24x24 CSS pixels
- **Recommended**: 44x44 CSS pixels (Apple HIG, Material Design)
- **Exception**: Inline links within text blocks

### WCAG 2.2 SC 2.5.5 - Target Size (Enhanced) - Level AAA
- **URL**: https://www.w3.org/TR/WCAG22/#target-size-enhanced
- **Minimum target size**: 44x44 CSS pixels
- **This is our target for Crispy CRM** (iPad optimization requires AAA compliance)

### Material Design 3 - Touch Targets
- **URL**: https://m3.material.io/foundations/accessible-design/accessibility-basics
- **Minimum touch target**: 48x48dp on Android (converts to ~44px on web)
- **Touch targets can exceed visual bounds**: Icon can be 20px, button can be 44px

### Apple Human Interface Guidelines
- **URL**: https://developer.apple.com/design/human-interface-guidelines/accessibility
- **Minimum**: 44x44 points
- **Critical for iPad optimization**: Our primary tablet target

### WCAG 2.1 SC 2.4.7 - Focus Visible - Level AA
- **URL**: https://www.w3.org/TR/WCAG21/#focus-visible
- **All interactive elements must have visible focus indicators**
- **Required for keyboard navigation**

## Our Implementation

Crispy CRM enforces **WCAG 2.2 AAA (SC 2.5.5)** for touch targets to optimize iPad usage by field sales reps.

### Tailwind Classes for Touch Targets
- `h-11 w-11` - 44x44px (minimum for all buttons)
- `size-11` - Shorthand for 44x44px
- `min-h-[44px] min-w-[44px]` - When using flex/grid
- `p-2.5` - 10px padding (ensures 44px with 24px content)

### Tailwind Classes for Focus States
- `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` - Standard focus indicator
- `focus-visible:outline-none` - Remove default outline (only when adding ring)

### Z-Index Scale
- `z-0` - Base content layer
- `z-10` - Sticky headers, fixed toolbars
- `z-50` - Dropdowns, popovers, modals (via Radix Portal)
- `z-[100]` - Toasts, notifications

## Patterns

### Minimum Touch Target Sizes

#### Icon Buttons
Icon buttons MUST be `h-11 w-11` (44x44px), even if the icon inside is smaller.

```tsx
// ❌ WRONG - Touch target too small (32px)
<Button size="icon" className="h-8 w-8">
  <Icon className="size-4" />
</Button>

// ✅ CORRECT - 44px touch target, 20px icon
<Button size="icon" className="h-11 w-11">
  <Icon className="size-5" />
</Button>
```

#### Text Buttons
Text buttons MUST have `h-11` minimum height.

```tsx
// ❌ WRONG - Height too small (36px)
<Button variant="outline" className="h-9">
  Save
</Button>

// ✅ CORRECT - 44px height
<Button variant="outline" className="h-11">
  Save
</Button>
```

#### Inline Links (Exception)
Links within text blocks are exempt from 44px requirement per WCAG 2.2 SC 2.5.8.

```tsx
// ✅ CORRECT - Inline link (exception to 44px rule)
<p className="text-sm text-muted-foreground">
  By continuing, you agree to our{' '}
  <a href="/terms" className="underline hover:text-foreground">
    Terms of Service
  </a>
</p>
```

#### Checkbox/Radio Touch Targets
Form controls MUST have 44x44px clickable area.

```tsx
// ❌ WRONG - Control too small
<input type="checkbox" className="h-4 w-4" />

// ✅ CORRECT - 44px touch target via padding
<label className="flex items-center gap-2 p-2.5">
  <input type="checkbox" className="h-5 w-5" />
  <span>Accept terms</span>
</label>
```

### Button Visibility Requirements

#### Never Clip Buttons
Buttons MUST NOT be placed where container overflow can clip them.

```tsx
// ❌ WRONG - Overflow clips button
<div className="overflow-hidden">
  <div className="flex justify-end">
    <Button>Save</Button> {/* May be clipped! */}
  </div>
</div>

// ✅ CORRECT - Button always visible
<div className="overflow-y-auto">
  <div className="p-4">
    {/* Content */}
  </div>
</div>
<div className="flex justify-end gap-2 border-t p-4">
  <Button variant="outline">Cancel</Button>
  <Button>Save</Button>
</div>
```

#### Sticky Form Actions
Form submit buttons MUST be visible without scrolling.

```tsx
// ✅ CORRECT - Sticky footer with safe area
<form className="flex h-full flex-col">
  <div className="flex-1 overflow-y-auto p-6">
    {/* Form fields */}
  </div>
  <div className="sticky bottom-0 flex justify-end gap-2 border-t bg-background p-4">
    <Button type="button" variant="outline">
      Cancel
    </Button>
    <Button type="submit">Save</Button>
  </div>
</form>
```

#### Button Groups with Wrapping
Button groups MUST wrap to prevent horizontal overflow.

```tsx
// ❌ WRONG - No wrapping (buttons may overflow on small screens)
<div className="flex gap-2">
  <Button>Action 1</Button>
  <Button>Action 2</Button>
  <Button>Action 3</Button>
  <Button>Action 4</Button>
</div>

// ✅ CORRECT - Wraps on overflow
<div className="flex flex-wrap gap-2">
  <Button>Action 1</Button>
  <Button>Action 2</Button>
  <Button>Action 3</Button>
  <Button>Action 4</Button>
</div>
```

### Z-Index and Portal Usage

#### Radix Primitives Auto-Portal
Radix UI primitives (Dialog, DropdownMenu, Popover, Tooltip) automatically render to `document.body` via portals, preventing z-index and clipping issues.

```tsx
// ✅ CORRECT - Radix Dialog auto-portals
<Dialog>
  <DialogTrigger asChild>
    <Button>Open Modal</Button>
  </DialogTrigger>
  <DialogContent className="z-50">
    {/* Renders to document.body, not inline */}
  </DialogContent>
</Dialog>
```

#### Dropdown Menus
NEVER wrap DropdownMenu in `overflow-hidden` containers.

```tsx
// ❌ WRONG - Overflow clips dropdown
<div className="overflow-hidden">
  <DropdownMenu>
    <DropdownMenuTrigger>Options</DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuItem>Edit</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</div>

// ✅ CORRECT - Radix portals to document.body automatically
<DropdownMenu>
  <DropdownMenuTrigger>Options</DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Edit</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

#### Z-Index Layering
Use the standardized z-index scale. NEVER use arbitrary values like `z-[9999]`.

```tsx
// ❌ WRONG - Arbitrary z-index
<div className="z-[9999]">
  <Popover>...</Popover>
</div>

// ✅ CORRECT - Use z-index scale
<div className="sticky top-0 z-10">
  {/* Sticky header */}
</div>

<Dialog>
  <DialogContent className="z-50">
    {/* Modal - Radix handles z-index */}
  </DialogContent>
</Dialog>

<Toast className="z-[100]">
  {/* Toast notification */}
</Toast>
```

### Preventing Clipped Elements

#### Table Row Actions
Use overflow menu for table actions to prevent clipping.

```tsx
// ❌ WRONG - Actions may be clipped by table scroll
<Table>
  <TableBody>
    <TableRow>
      <TableCell>Name</TableCell>
      <TableCell>
        <Button size="sm">Edit</Button>
        <Button size="sm">Delete</Button>
      </TableCell>
    </TableRow>
  </TableBody>
</Table>

// ✅ CORRECT - Overflow menu portals out
<Table>
  <TableBody>
    <TableRow>
      <TableCell>Name</TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-11">
              <MoreVertical className="size-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Edit</DropdownMenuItem>
            <DropdownMenuItem>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  </TableBody>
</Table>
```

#### Tooltips with Collision Detection
Radix Tooltip automatically adjusts position to prevent clipping.

```tsx
// ✅ CORRECT - Radix Tooltip has collision detection
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="ghost" size="icon" className="size-11">
        <Info className="size-5" />
      </Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>Additional information</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

### Focus and Active States

#### Visible Focus Indicators
ALL interactive elements MUST have visible focus indicators for keyboard navigation.

```tsx
// ❌ WRONG - Focus indicator removed
<button className="outline-none focus:outline-none">
  Click me
</button>

// ✅ CORRECT - Visible focus ring
<button className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
  Click me
</button>
```

#### Custom Focus Styles
When customizing focus, ALWAYS provide alternative visible indicator.

```tsx
// ❌ WRONG - No focus indicator
<a href="/dashboard" className="outline-none">
  Dashboard
</a>

// ✅ CORRECT - Custom focus indicator
<a
  href="/dashboard"
  className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
>
  Dashboard
</a>
```

#### Skip Links for Keyboard Navigation
Provide skip links for keyboard users to bypass repetitive navigation.

```tsx
// ✅ CORRECT - Skip to main content
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:ring-2 focus:ring-ring"
>
  Skip to main content
</a>

<main id="main-content">
  {/* Page content */}
</main>
```

## Examples

### Icon Button Sizes

```tsx
// ❌ VIOLATION - Touch target too small (32px)
<Button size="icon" className="h-8 w-8">
  <Edit className="size-4" />
</Button>

// ❌ VIOLATION - Touch target too small (36px)
<Button size="icon" className="h-9 w-9">
  <Trash className="size-4" />
</Button>

// ✅ CORRECT - 44px touch target
<Button size="icon" className="h-11 w-11">
  <Edit className="size-5" />
</Button>

// ✅ CORRECT - Using size utility
<Button size="icon" className="size-11">
  <Trash className="size-5" />
</Button>
```

### Form Controls

```tsx
// ❌ VIOLATION - Checkbox too small
<div className="flex items-center gap-2">
  <input type="checkbox" id="terms" className="h-4 w-4" />
  <label htmlFor="terms">Accept terms</label>
</div>

// ✅ CORRECT - 44px clickable area via label padding
<label className="flex cursor-pointer items-center gap-2 p-2.5">
  <input type="checkbox" className="h-5 w-5" />
  <span>Accept terms</span>
</label>

// ✅ CORRECT - Using React Admin FormDataConsumer
<BooleanInput
  source="terms_accepted"
  label="Accept terms"
  className="[&_label]:min-h-[44px] [&_label]:p-2.5"
/>
```

### Dropdown Clipping

```tsx
// ❌ VIOLATION - Overflow clips dropdown
<div className="max-h-[400px] overflow-hidden rounded-lg border">
  <div className="p-4">
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>Actions</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {/* Will be clipped by overflow-hidden! */}
        <DropdownMenuItem>Edit</DropdownMenuItem>
        <DropdownMenuItem>Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</div>

// ✅ CORRECT - Radix portals to document.body
<div className="max-h-[400px] overflow-y-auto rounded-lg border">
  <div className="p-4">
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>Actions</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {/* Portaled, not clipped */}
        <DropdownMenuItem>Edit</DropdownMenuItem>
        <DropdownMenuItem>Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</div>
```

### Z-Index Violations

```tsx
// ❌ VIOLATION - Arbitrary z-index
<div className="absolute z-[9999]">
  <div className="bg-background p-4 shadow-lg">
    <p>Custom modal</p>
  </div>
</div>

// ❌ VIOLATION - Z-index without portal
<div className="relative">
  <button>Open Menu</button>
  <div className="absolute z-50 bg-background">
    {/* Should use Radix primitive instead */}
  </div>
</div>

// ✅ CORRECT - Use Radix Dialog with portal
<Dialog>
  <DialogTrigger asChild>
    <Button>Open Modal</Button>
  </DialogTrigger>
  <DialogContent className="z-50">
    <p>Modal content</p>
  </DialogContent>
</Dialog>

// ✅ CORRECT - Sticky header with standardized z-index
<header className="sticky top-0 z-10 border-b bg-background">
  <div className="flex h-16 items-center px-4">
    <h1>Crispy CRM</h1>
  </div>
</header>
```

### Focus Indicator Violations

```tsx
// ❌ VIOLATION - No focus indicator
<button className="rounded-md bg-primary px-4 py-2 text-primary-foreground outline-none">
  Submit
</button>

// ❌ VIOLATION - Focus removed without replacement
<a href="/profile" className="text-foreground hover:underline focus:outline-none">
  View Profile
</a>

// ✅ CORRECT - Visible focus ring
<button className="rounded-md bg-primary px-4 py-2 text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
  Submit
</button>

// ✅ CORRECT - Custom focus with visible indicator
<a
  href="/profile"
  className="text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
>
  View Profile
</a>
```

## Checklist

### Touch Targets
- [ ] All icon buttons use `h-11 w-11` or `size-11` (44x44px minimum)
- [ ] All text buttons use `h-11` minimum height
- [ ] All form controls (checkbox, radio) have 44x44px clickable area
- [ ] Inline text links are exempt from 44px requirement
- [ ] Icon size is `size-5` (20px) inside 44px buttons

### Button Visibility
- [ ] Submit buttons are always visible without scrolling
- [ ] Sticky/fixed buttons include safe area padding
- [ ] Button groups use `flex-wrap` to prevent overflow
- [ ] No buttons are placed inside `overflow-hidden` containers without safe positioning

### Z-Index and Portals
- [ ] All modals use Radix Dialog (auto-portals to `document.body`)
- [ ] All dropdowns use Radix DropdownMenu (auto-portals)
- [ ] All tooltips use Radix Tooltip (auto-portals with collision detection)
- [ ] Z-index values use standardized scale (0, 10, 50, 100)
- [ ] No arbitrary z-index values like `z-[9999]`

### Clipped Elements Prevention
- [ ] Dropdowns are NOT wrapped in `overflow-hidden` containers
- [ ] Table row actions use overflow menu (DropdownMenu)
- [ ] Tooltips use Radix Tooltip with collision detection
- [ ] Popovers use Radix Popover (auto-portals)

### Focus States
- [ ] All interactive elements have visible focus indicators
- [ ] Focus indicator uses `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`
- [ ] Never use `outline-none` without providing alternative focus indicator
- [ ] Skip links provided for keyboard navigation
- [ ] Custom interactive elements include `tabIndex={0}` for keyboard access

### Testing
- [ ] Tab through all interactive elements to verify focus indicators
- [ ] Test with screen reader (VoiceOver on iPad)
- [ ] Verify all buttons are tappable on iPad (44x44px)
- [ ] Check dropdowns/modals don't get clipped on small screens
- [ ] Validate form submission works without scrolling to submit button
