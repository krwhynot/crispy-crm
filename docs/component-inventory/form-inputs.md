# Form Input Components — Inventory

> Generated: 2025-12-29
> Source: `src/components/ui/`
> Design System: OKLCH-based semantic colors, Tailwind v4

## Overview

| Component | File | Type | data-slot | Touch Target | Design System |
|-----------|------|------|-----------|--------------|---------------|
| [Input](#input) | `input.tsx` | Function | `input` | 48px | Compliant |
| [Textarea](#textarea) | `textarea.tsx` | Function | `textarea` | 64px | Compliant |
| [Select](#select) | `select.tsx` | Composite | Multiple | 48px | Compliant |
| [Checkbox](#checkbox) | `checkbox.tsx` | Function | `checkbox` | 20px* | Compliant |
| [Switch](#switch) | `switch.tsx` | Function | `switch` | 44px | Compliant |
| [RadioGroup](#radiogroup) | `radio-group.tsx` | Composite | Multiple | 20px* | Compliant |
| [Combobox](#combobox) | `combobox.tsx` | Custom | None | Button-based | Compliant |
| [Calendar](#calendar) | `calendar.tsx` | Function | `calendar` | CSS var | Compliant |
| [Form](#form) | `form.tsx` | Composite | N/A | N/A | Compliant |
| [Label](#label) | `label.tsx` | Function | `label` | N/A | Compliant |

*\* Parent container should provide 44px touch target (documented in source)*

---

## Component Details

### Input

**Purpose:** Single-line text input with refined depth and focus effects. Supports all HTML input types.

**File:** `src/components/ui/input.tsx`

**Props:**
```typescript
React.ComponentProps<"input">
// All standard HTML input attributes supported
```

**Key Attributes:**
- `data-slot="input"`
- `dir="auto"` (automatic text direction for RTL support)

**Styling Tokens:**

| Token/Class | Purpose |
|-------------|---------|
| `min-h-[48px]` | Touch target compliance (48px) |
| `bg-background` | Surface color |
| `border-input` | Border color |
| `text-base md:text-sm` | Responsive typography |
| `placeholder:text-muted-foreground/70` | Placeholder at 70% opacity |
| `selection:bg-primary selection:text-primary-foreground` | Selection highlighting |
| `shadow-[var(--input-shadow-rest)]` | Subtle inner shadow for depth |
| `focus-visible:border-primary/60` | Focus border accent |
| `focus-visible:shadow-[var(--input-glow-focus),var(--input-shadow-rest)]` | Focus glow effect |
| `aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40` | Error ring (darker in dark mode) |
| `aria-invalid:border-destructive` | Error border |
| `disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50` | Disabled state |

**Accessibility:**
- Touch target: 48px (`min-h-[48px]`)
- ARIA: `aria-invalid` styling for error states
- Focus: `focus-visible` (keyboard-only rings)

**Code Pattern:**
```tsx
<Input
  type="email"
  placeholder="Enter email..."
  aria-invalid={!!error}
/>
```

---

### Textarea

**Purpose:** Multi-line text input with content-aware sizing (`field-sizing-content`).

**File:** `src/components/ui/textarea.tsx`

**Props:**
```typescript
React.ComponentProps<"textarea">
```

**Key Attributes:**
- `data-slot="textarea"`
- CSS `field-sizing-content` for automatic height adjustment

**Styling Tokens:**

| Token/Class | Purpose |
|-------------|---------|
| `min-h-16` | Minimum height 64px |
| `bg-background` | Surface color |
| `border-input` | Border color |
| `placeholder:text-muted-foreground` | Placeholder color |
| `shadow-xs` | Subtle shadow |
| `focus-visible:border-ring focus-visible:ring-ring/50` | Focus ring |
| `focus-visible:ring-[3px]` | Ring width |
| `aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40` | Error ring |
| `aria-invalid:border-destructive` | Error border |
| `disabled:cursor-not-allowed disabled:opacity-50` | Disabled state |

**Accessibility:**
- Touch target: 64px (`min-h-16`)
- ARIA: `aria-invalid` styling
- Focus: 3px ring on `focus-visible`

**Code Pattern:**
```tsx
<Textarea
  placeholder="Enter description..."
  aria-invalid={!!error}
/>
```

---

### Select

**Purpose:** Dropdown selection built on Radix UI primitives with accessible keyboard navigation.

**File:** `src/components/ui/select.tsx`

**Exports:**
- `Select` (root)
- `SelectTrigger` (button)
- `SelectContent` (dropdown)
- `SelectValue` (display)
- `SelectGroup`, `SelectLabel`, `SelectItem`
- `SelectSeparator`, `SelectScrollUpButton`, `SelectScrollDownButton`

**Props:**
```typescript
// SelectTrigger
React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: "sm" | "default";
}
```

**Key Attributes:**
- `data-slot="select"` (root)
- `data-slot="select-trigger"` (trigger)
- `data-slot="select-content"` (content)
- `data-slot="select-item"` (item)
- `data-size={size}` on trigger

**Styling Tokens (SelectTrigger):**

| Token/Class | Purpose |
|-------------|---------|
| `data-[size=default]:min-h-[48px]` | Touch target (both sizes) |
| `data-[size=sm]:min-h-[48px]` | Small variant also 48px |
| `bg-background` | Surface color |
| `border-input` | Border color |
| `data-[placeholder]:text-foreground/70` | Placeholder styling |
| `[&_svg:not([class*='text-'])]:text-foreground/70` | Icon color |
| `focus-visible:border-ring focus-visible:ring-ring/50` | Focus ring |
| `focus-visible:ring-[3px]` | Ring width |
| `aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40` | Error ring |
| `aria-invalid:border-destructive` | Error border |

**Styling Tokens (SelectContent):**

| Token/Class | Purpose |
|-------------|---------|
| `bg-popover` | Dropdown background |
| `text-popover-foreground` | Text color |
| `shadow-md` | Elevation |
| `data-[state=open]:animate-in` | Open animation |
| `data-[state=closed]:animate-out` | Close animation |

**Styling Tokens (SelectItem):**

| Token/Class | Purpose |
|-------------|---------|
| `focus:bg-accent focus:text-accent-foreground` | Focused item |
| `[&_svg:not([class*='text-'])]:text-foreground/70` | Icon color |
| `data-[disabled]:pointer-events-none data-[disabled]:opacity-50` | Disabled item |

**Accessibility:**
- Touch target: 48px on trigger (both sizes)
- Radix provides full keyboard navigation
- Focus management via `focus:bg-accent`

**Code Pattern:**
```tsx
<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="Select..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

---

### Checkbox

**Purpose:** Boolean toggle built on Radix UI with animated check indicator.

**File:** `src/components/ui/checkbox.tsx`

**Props:**
```typescript
React.ComponentProps<typeof CheckboxPrimitive.Root>
```

**Key Attributes:**
- `data-slot="checkbox"`
- `data-slot="checkbox-indicator"` (inner)
- `data-[state=checked]` (Radix state)

**Styling Tokens:**

| Token/Class | Purpose |
|-------------|---------|
| `size-5` | Visual size 20px (parent provides 44px target) |
| `border-input` | Unchecked border |
| `dark:bg-input/30` | Dark mode unchecked background |
| `data-[state=checked]:bg-primary` | Checked background |
| `data-[state=checked]:text-primary-foreground` | Check icon color |
| `data-[state=checked]:border-primary` | Checked border |
| `shadow-xs` | Subtle shadow |
| `focus-visible:border-ring focus-visible:ring-ring/50` | Focus ring |
| `focus-visible:ring-[3px]` | Ring width |
| `aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40` | Error ring |
| `aria-invalid:border-destructive` | Error border |
| `disabled:cursor-not-allowed disabled:opacity-50` | Disabled state |

**Accessibility:**
- Visual size: 20px (`size-5`)
- Touch target: Parent container should provide 44px (documented in source line 12)
- ARIA: `aria-invalid` styling

**Code Pattern:**
```tsx
<div className="flex items-center space-x-2">
  <Checkbox id="terms" aria-invalid={!!error} />
  <Label htmlFor="terms">Accept terms</Label>
</div>
```

---

### Switch

**Purpose:** Toggle switch with thumb animation, built on Radix UI.

**File:** `src/components/ui/switch.tsx`

**Props:**
```typescript
React.ComponentProps<typeof SwitchPrimitive.Root>
```

**Key Attributes:**
- `data-slot="switch"` (root)
- `data-slot="switch-thumb"` (thumb)
- `data-[state=checked]` / `data-[state=unchecked]` (Radix state)

**Styling Tokens (Root):**

| Token/Class | Purpose |
|-------------|---------|
| `h-11 w-[4.5rem]` | 44px height, 72px width |
| `data-[state=checked]:bg-primary` | Checked background |
| `data-[state=unchecked]:bg-input` | Unchecked background |
| `dark:data-[state=unchecked]:bg-input/80` | Dark mode unchecked |
| `shadow-xs` | Subtle shadow |
| `focus-visible:border-ring focus-visible:ring-ring/50` | Focus ring |
| `focus-visible:ring-[3px]` | Ring width |
| `disabled:cursor-not-allowed disabled:opacity-50` | Disabled state |

**Styling Tokens (Thumb):**

| Token/Class | Purpose |
|-------------|---------|
| `size-9` | Thumb size 36px |
| `bg-background` | Light mode thumb |
| `dark:data-[state=unchecked]:bg-foreground` | Dark unchecked thumb |
| `dark:data-[state=checked]:bg-primary-foreground` | Dark checked thumb |
| `data-[state=checked]:translate-x-[calc(100%-2px)]` | Checked position |
| `data-[state=unchecked]:translate-x-0` | Unchecked position |

**Accessibility:**
- Touch target: 44px (`h-11`) - **Fully compliant**
- Radix provides keyboard and screen reader support

**Code Pattern:**
```tsx
<div className="flex items-center space-x-2">
  <Switch id="notifications" />
  <Label htmlFor="notifications">Enable notifications</Label>
</div>
```

---

### RadioGroup

**Purpose:** Single-selection radio buttons built on Radix UI.

**File:** `src/components/ui/radio-group.tsx`

**Exports:**
- `RadioGroup` (root)
- `RadioGroupItem` (individual radio)

**Props:**
```typescript
// RadioGroup
React.ComponentProps<typeof RadioGroupPrimitive.Root>

// RadioGroupItem
React.ComponentProps<typeof RadioGroupPrimitive.Item>
```

**Key Attributes:**
- `data-slot="radio-group"` (root)
- `data-slot="radio-group-item"` (item)
- `data-slot="radio-group-indicator"` (inner dot)

**Styling Tokens (RadioGroup):**

| Token/Class | Purpose |
|-------------|---------|
| `grid gap-3` | Layout with spacing |

**Styling Tokens (RadioGroupItem):**

| Token/Class | Purpose |
|-------------|---------|
| `size-5` | Visual size 20px |
| `p-[14px]` | Padding for indicator alignment |
| `aspect-square` | Maintains circle shape |
| `border-input` | Border color |
| `text-primary` | Selected indicator color |
| `dark:bg-input/30` | Dark mode background |
| `shadow-xs` | Subtle shadow |
| `focus-visible:border-ring focus-visible:ring-ring/50` | Focus ring |
| `focus-visible:ring-[3px]` | Ring width |
| `aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40` | Error ring |
| `aria-invalid:border-destructive` | Error border |
| `disabled:cursor-not-allowed disabled:opacity-50` | Disabled state |

**Styling Tokens (Indicator):**

| Token/Class | Purpose |
|-------------|---------|
| `fill-primary` | Dot fill color |
| `size-2.5` | Dot size 10px |

**Accessibility:**
- Visual size: 20px (`size-5`)
- Touch target: Parent container should provide 44px
- Radix provides keyboard navigation between items

**Code Pattern:**
```tsx
<RadioGroup value={value} onValueChange={setValue}>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="option1" id="r1" />
    <Label htmlFor="r1">Option 1</Label>
  </div>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="option2" id="r2" />
    <Label htmlFor="r2">Option 2</Label>
  </div>
</RadioGroup>
```

---

### Combobox

**Purpose:** Searchable dropdown with autocomplete. Composed from Button, Command, and Popover primitives.

**File:** `src/components/ui/combobox.tsx`

**Exports:**
- `Combobox` (single select)
- `MultiSelectCombobox` (multi-select)

**Props:**
```typescript
interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
}

interface MultiSelectComboboxProps {
  options: ComboboxOption[];
  value?: string[];
  onValueChange?: (value: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  disabled?: boolean;
}
```

**Key Attributes:**
- `role="combobox"` on trigger button
- `aria-expanded={open}` for state

**Styling:**
- Uses `Button` variant="outline" for trigger
- Touch target inherited from Button (48px default)
- Width default `w-[200px]`
- Icon: `ChevronsUpDown` at `opacity-50`
- Check icon: `opacity-100` when selected, `opacity-0` when not

**Note:** This is a custom composite component, not a shadcn primitive. No `data-slot` attributes.

**Accessibility:**
- Touch target: Inherited from Button (48px)
- ARIA: `role="combobox"`, `aria-expanded`
- Keyboard: Command component provides search/navigation

**Code Pattern:**
```tsx
<Combobox
  options={[
    { value: "apple", label: "Apple" },
    { value: "banana", label: "Banana" },
  ]}
  value={value}
  onValueChange={setValue}
  placeholder="Select fruit..."
/>
```

---

### Calendar

**Purpose:** Date picker built on `react-day-picker` with customized styling.

**File:** `src/components/ui/calendar.tsx`

**Exports:**
- `Calendar`
- `CalendarDayButton`

**Props:**
```typescript
React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"];
}
```

**Key Attributes:**
- `data-slot="calendar"` (root)
- `data-day={date}` on day buttons
- `data-selected-single`, `data-range-start`, `data-range-end`, `data-range-middle` on day buttons

**Styling Tokens:**

| Token/Class | Purpose |
|-------------|---------|
| `bg-background` | Calendar background |
| `[--cell-size:--spacing(11)]` | CSS variable for cell size |
| `size-(--cell-size)` | Nav buttons use cell size |
| `text-muted-foreground` | Weekday headers, outside days |
| `bg-accent text-accent-foreground` | Today styling |
| `data-[selected-single=true]:bg-primary` | Selected day |
| `data-[selected-single=true]:text-primary-foreground` | Selected text |
| `data-[range-middle=true]:bg-accent` | Range middle days |
| `data-[range-start=true]:bg-primary data-[range-end=true]:bg-primary` | Range ends |
| `group-data-[focused=true]/day:ring-[3px]` | Focused day ring |
| `group-data-[focused=true]/day:ring-ring/50` | Ring color |
| `has-focus:border-ring has-focus:ring-ring/50` | Dropdown focus |
| `opacity-50` | Disabled days |

**Accessibility:**
- Touch target: CSS variable `--cell-size` (spacing-11 = 44px)
- Keyboard: Full navigation via react-day-picker
- Focus: 3px ring on focused day

**Code Pattern:**
```tsx
<Calendar
  mode="single"
  selected={date}
  onSelect={setDate}
  buttonVariant="ghost"
/>
```

---

### Form

**Purpose:** React Hook Form integration with automatic accessibility wiring.

**File:** `src/components/ui/form.tsx`

**Exports:**
- `Form` (FormProvider wrapper)
- `FormField` (Controller wrapper)
- `FormItem` (field container)
- `FormLabel` (accessible label)
- `FormControl` (input wrapper with ARIA)
- `FormDescription` (help text)
- `FormMessage` (error message)
- `useFormField` (hook for field state)

**Props:**
```typescript
// FormField
ControllerProps<TFieldValues, TName>

// useFormField returns:
{
  id: string;
  name: TName;
  formItemId: string;
  formDescriptionId: string;
  formMessageId: string;
  ...fieldState; // from react-hook-form
}
```

**Key ARIA Patterns:**

| Component | ARIA Implementation |
|-----------|---------------------|
| `FormControl` | `aria-describedby={descriptionId messageId}` |
| `FormControl` | `aria-invalid={!!error}` |
| `FormLabel` | `htmlFor={formItemId}` |
| `FormDescription` | `id={formDescriptionId}` |
| `FormMessage` | `id={formMessageId}` |
| `FormMessage` | `role="alert"` |

**Styling Tokens:**

| Component | Token/Class | Purpose |
|-----------|-------------|---------|
| FormItem | `space-y-2` | Vertical spacing |
| FormLabel | `text-destructive` | Error state (when error exists) |
| FormDescription | `text-sm text-muted-foreground` | Help text |
| FormMessage | `text-sm font-medium text-destructive` | Error text |

**Accessibility:**
- Automatic `aria-describedby` linking description and message IDs
- Automatic `aria-invalid` based on field error state
- `role="alert"` on FormMessage for screen reader announcements
- Label association via `htmlFor`

**Code Pattern:**
```tsx
<Form {...form}>
  <FormField
    control={form.control}
    name="email"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Email</FormLabel>
        <FormControl>
          <Input placeholder="email@example.com" {...field} />
        </FormControl>
        <FormDescription>Your work email address.</FormDescription>
        <FormMessage />
      </FormItem>
    )}
  />
</Form>
```

---

### Label

**Purpose:** Accessible label with peer/group disabled state support.

**File:** `src/components/ui/label.tsx`

**Props:**
```typescript
React.ComponentProps<typeof LabelPrimitive.Root>
```

**Key Attributes:**
- `data-slot="label"`

**Styling Tokens:**

| Token/Class | Purpose |
|-------------|---------|
| `text-sm leading-none font-medium` | Typography |
| `text-foreground` | Text color |
| `flex items-center gap-2` | Layout with icon support |
| `select-none` | Prevent text selection |
| `group-data-[disabled=true]:pointer-events-none` | Group disabled interaction |
| `group-data-[disabled=true]:opacity-50` | Group disabled visual |
| `peer-disabled:cursor-not-allowed` | Peer disabled cursor |
| `peer-disabled:opacity-50` | Peer disabled visual |

**Accessibility:**
- Radix Label provides native label semantics
- Peer/group patterns support disabled state coordination

**Code Pattern:**
```tsx
<div className="flex items-center space-x-2">
  <Checkbox id="terms" className="peer" />
  <Label htmlFor="terms">Accept terms and conditions</Label>
</div>
```

---

## Consistency Check

### Design System Compliant

**All components pass design system compliance:**

| Pattern | Implementation | Status |
|---------|----------------|--------|
| Semantic colors | `text-muted-foreground`, `bg-primary`, `border-destructive` | No hex codes found |
| Focus rings | `focus-visible:ring-[3px] ring-ring/50 border-ring` | Consistent |
| Error states | `aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive` | Consistent |
| Disabled states | `disabled:cursor-not-allowed disabled:opacity-50` | Consistent |
| Dark mode | `dark:` variants where needed | Proper opacity adjustments |
| CSS variables | `var(--input-shadow-rest)`, `var(--input-glow-focus)` | Proper scoping |
| Touch targets | 44px+ for interactive controls | See notes below |

### Touch Target Notes

| Component | Size | Status |
|-----------|------|--------|
| Input | 48px (`min-h-[48px]`) | Compliant |
| Textarea | 64px (`min-h-16`) | Compliant |
| SelectTrigger | 48px (`data-[size=*]:min-h-[48px]`) | Compliant |
| Switch | 44px (`h-11`) | Compliant |
| Checkbox | 20px (`size-5`) | Parent container provides 44px target |
| RadioGroupItem | 20px (`size-5`) | Parent container provides 44px target |
| Calendar cells | 44px (CSS var `--cell-size`) | Compliant |
| Combobox | Inherited from Button | Compliant |

### No Deviations Found

- **Zero hardcoded hex colors** across all 10 components
- **Zero inline `oklch()` values** - all use semantic tokens
- **Consistent patterns** for focus, error, and disabled states
- **data-slot attributes** on all shadcn primitives (Combobox is custom composite)

---

## Quick Reference: Common Patterns

### Focus Ring
```css
focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]
```

### Error State
```css
aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive
```

### Disabled State
```css
disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50
```

### Placeholder
```css
placeholder:text-muted-foreground/70
/* or */
data-[placeholder]:text-foreground/70
```

### Selection
```css
selection:bg-primary selection:text-primary-foreground
```
