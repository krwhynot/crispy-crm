# Radix UI Components: Industry Standards & Best Practices

> **Research Date:** December 2025
> **Source:** Official Radix UI Documentation, WAI-ARIA Design Patterns
> **Applies to:** 16 Radix Primitives used in Crispy CRM

---

## Table of Contents

1. [Overview & Core Principles](#overview--core-principles)
2. [Overlay Components](#overlay-components)
   - [Dialog](#dialog)
   - [Dropdown Menu](#dropdown-menu)
   - [Popover](#popover)
   - [Tooltip](#tooltip)
3. [Selection Components](#selection-components)
   - [Select](#select)
   - [Tabs](#tabs)
4. [Form Components](#form-components)
   - [Checkbox](#checkbox)
   - [Radio Group](#radio-group)
   - [Switch](#switch)
   - [Label](#label)
5. [Navigation & Layout](#navigation--layout)
   - [Navigation Menu](#navigation-menu)
   - [Accordion](#accordion)
6. [Display Components](#display-components)
   - [Avatar](#avatar)
   - [Progress](#progress)
   - [Separator](#separator)
7. [Utility Components](#utility-components)
   - [Slot](#slot)
8. [MUST-FOLLOW Rules](#must-follow-rules)
9. [Keyboard Navigation Matrix](#keyboard-navigation-matrix)
10. [Accessibility Checklist](#accessibility-checklist)

---

## Overview & Core Principles

### WAI-ARIA Compliance

Radix Primitives follow the **WAI-ARIA Authoring Practices Guidelines** and are tested in modern browsers and assistive technologies. Key principles:

| Principle | Description |
|-----------|-------------|
| **Semantic Roles** | Correct `aria` and `role` attributes applied automatically |
| **Focus Management** | Programmatic focus movement based on user interactions |
| **Keyboard Navigation** | Full keyboard support per WAI-ARIA patterns |
| **Accessible Labels** | Built-in labelling support via Label primitive |

### Core Implementation Pattern

```tsx
// ✅ CORRECT: Use asChild with forwardRef components
const MyButton = React.forwardRef((props, ref) => (
  <button {...props} ref={ref} />
));

<Dialog.Trigger asChild>
  <MyButton>Open</MyButton>
</Dialog.Trigger>

// ❌ WRONG: Missing ref forwarding breaks functionality
const MyButton = (props) => <button {...props} />;
```

---

## Overlay Components

### Dialog

**WAI-ARIA Pattern:** [Dialog (Modal)](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal)

#### MUST-FOLLOW Rules

| Rule | Requirement |
|------|-------------|
| Focus Trap | Focus MUST be trapped within modal when open |
| Focus Return | Focus MUST return to trigger on close |
| Escape Key | MUST close dialog on `Esc` key |
| Background Interaction | MUST prevent interaction with content behind modal |

#### Keyboard Interactions

| Key | Action |
|-----|--------|
| `Space` / `Enter` | Opens/closes the dialog |
| `Tab` | Moves focus to next focusable element |
| `Shift + Tab` | Moves focus to previous focusable element |
| `Esc` | Closes dialog, returns focus to trigger |

#### Best Practices

```tsx
// ✅ Always provide accessible title and description
<Dialog.Root>
  <Dialog.Trigger>Open</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay />
    <Dialog.Content>
      <Dialog.Title>Edit Profile</Dialog.Title>
      <Dialog.Description>
        Make changes to your profile here.
      </Dialog.Description>
      {/* Form content */}
      <Dialog.Close>Save changes</Dialog.Close>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

---

### Dropdown Menu

**WAI-ARIA Pattern:** [Menu Button](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/)

Uses **roving tabindex** for focus management among menu items.

#### MUST-FOLLOW Rules

| Rule | Requirement |
|------|-------------|
| Roving Tabindex | Single tab stop; arrow keys navigate items |
| Item Activation | `Enter`/`Space` activates focused item |
| Submenu Direction | Arrow keys open/close based on reading direction |

#### Keyboard Interactions

| Key | Action |
|-----|--------|
| `Space` / `Enter` | Opens menu (on trigger) or activates item |
| `ArrowDown` | Opens menu or moves to next item |
| `ArrowUp` | Moves to previous item |
| `ArrowRight` / `ArrowLeft` | Opens/closes submenu (RTL-aware) |
| `Esc` | Closes menu, returns focus to trigger |

---

### Popover

**WAI-ARIA Pattern:** [Dialog (Non-modal)](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal)

#### Key Features

- Supports **modal** and **non-modal** modes
- Full focus management and customization
- Collision-aware positioning

#### Best Practices

```tsx
// ✅ Use modal={true} for forms requiring focus lock
<Popover.Root>
  <Popover.Trigger>Edit</Popover.Trigger>
  <Popover.Portal>
    <Popover.Content modal={true}>
      <form>...</form>
      <Popover.Close aria-label="Close">×</Popover.Close>
    </Popover.Content>
  </Popover.Portal>
</Popover.Root>
```

#### CSS Variables for Sizing

```css
.PopoverContent {
  /* Match trigger width */
  width: var(--radix-popover-trigger-width);
  /* Constrain to available viewport */
  max-height: var(--radix-popover-content-available-height);
}
```

---

### Tooltip

**Accessibility Note:** Tooltips are for supplementary information only.

#### MUST-FOLLOW Rules

| Rule | Requirement |
|------|-------------|
| Hover + Focus | MUST open on both mouse hover AND keyboard focus |
| Delay | Default 700ms delay; use `delayDuration={0}` for instant |
| No Essential Info | NEVER put critical actions in tooltips |
| Hoverable Content | Keep `disableHoverableContent={false}` (accessibility) |

#### Keyboard Interactions

| Key | Action |
|-----|--------|
| `Tab` | Opens/closes tooltip without delay |
| `Space` / `Enter` | Closes tooltip if open |
| `Esc` | Closes tooltip without delay |

#### Best Practices

```tsx
// ✅ CORRECT: Wrap entire app for consistent timing
<Tooltip.Provider delayDuration={400} skipDelayDuration={300}>
  <App />
</Tooltip.Provider>

// ✅ Use aria-label for non-descriptive content
<Tooltip.Content aria-label="More detailed description">
  <Icon />
</Tooltip.Content>
```

---

## Selection Components

### Select

**WAI-ARIA Patterns:**
- [Listbox](https://www.w3.org/WAI/ARIA/apg/patterns/listbox)
- [Select-Only Combobox](https://www.w3.org/TR/wai-aria-practices/examples/combobox/combobox-select-only.html)

#### MUST-FOLLOW Rules

| Rule | Requirement |
|------|-------------|
| Labelling | MUST associate with Label component |
| Keyboard Selection | Arrow keys navigate; Enter/Space select |
| Value Announcement | Selected value MUST be announced to screen readers |

#### Keyboard Interactions

| Key | Action |
|-----|--------|
| `Space` / `Enter` | Opens select or selects focused item |
| `ArrowDown` / `ArrowUp` | Opens select or navigates items |
| `Esc` | Closes select, returns focus to trigger |

#### Labelling Patterns

```tsx
// ✅ Pattern 1: Wrapping label
<Label>
  Country
  <Select.Root>
    <Select.Trigger>...</Select.Trigger>
  </Select.Root>
</Label>

// ✅ Pattern 2: htmlFor association
<Label htmlFor="country">Country</Label>
<Select.Root>
  <Select.Trigger id="country">...</Select.Trigger>
</Select.Root>
```

---

### Tabs

**WAI-ARIA Pattern:** [Tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs)

#### MUST-FOLLOW Rules

| Rule | Requirement |
|------|-------------|
| Automatic Activation | Tab activates on focus (default behavior) |
| Orientation | Respect `orientation` for correct arrow key behavior |
| Panel Association | Each tab MUST have associated panel |

#### Keyboard Interactions

| Key | Action |
|-----|--------|
| `Tab` | Moves to active trigger, then to content |
| `ArrowDown` / `ArrowRight` | Next tab (orientation-aware) |
| `ArrowUp` / `ArrowLeft` | Previous tab (orientation-aware) |
| `Home` | First tab |
| `End` | Last tab |

#### Best Practices

```tsx
// ✅ Use orientation for vertical tab layouts
<Tabs.Root orientation="vertical">
  <Tabs.List aria-label="Account settings">
    <Tabs.Trigger value="profile">Profile</Tabs.Trigger>
    <Tabs.Trigger value="security">Security</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="profile">...</Tabs.Content>
  <Tabs.Content value="security">...</Tabs.Content>
</Tabs.Root>
```

---

## Form Components

### Checkbox

**WAI-ARIA Pattern:** [Tri-state Checkbox](https://www.w3.org/WAI/ARIA/apg/patterns/checkbox)

#### Key Features

- Supports **indeterminate** state for partial selection
- Native form integration (hidden input rendered)

#### MUST-FOLLOW Rules

| Rule | Requirement |
|------|-------------|
| Label Association | MUST have accessible label |
| Indeterminate State | Use for "select all" with partial selection |
| Form Integration | `name` prop required for form submission |

#### Keyboard Interactions

| Key | Action |
|-----|--------|
| `Space` | Toggles checked state |

#### Data Attributes for Styling

```css
/* Style based on state */
[data-state="checked"] { /* checked styles */ }
[data-state="unchecked"] { /* unchecked styles */ }
[data-state="indeterminate"] { /* partial styles */ }
[data-disabled] { /* disabled styles */ }
```

---

### Radio Group

**WAI-ARIA Pattern:** [Radio Group](https://www.w3.org/WAI/ARIA/apg/patterns/radio)

Uses **roving tabindex** for focus management.

#### MUST-FOLLOW Rules

| Rule | Requirement |
|------|-------------|
| Single Selection | Only one item can be selected |
| Arrow Navigation | Arrows move focus AND select |
| Loop Behavior | `loop={true}` (default) wraps navigation |
| Orientation | Set for correct arrow key mapping |

#### Keyboard Interactions

| Key | Action |
|-----|--------|
| `Tab` | Moves to checked item (or first if none) |
| `Space` | Checks focused item |
| `ArrowDown` / `ArrowRight` | Next item + check |
| `ArrowUp` / `ArrowLeft` | Previous item + check |

---

### Switch

**WAI-ARIA Pattern:** [Switch](https://www.w3.org/WAI/ARIA/apg/patterns/switch)

#### MUST-FOLLOW Rules

| Rule | Requirement |
|------|-------------|
| Binary State | Only on/off states (no indeterminate) |
| Instant Effect | Changes should take effect immediately |
| Label Clarity | Label should describe the ON state |

#### Keyboard Interactions

| Key | Action |
|-----|--------|
| `Space` | Toggles state |
| `Enter` | Toggles state |

#### Best Practices

```tsx
// ✅ Label describes ON state
<Label htmlFor="notifications">Enable notifications</Label>
<Switch.Root id="notifications">
  <Switch.Thumb />
</Switch.Root>

// ❌ WRONG: Ambiguous label
<Label>Notifications</Label>
```

---

### Label

**Based on:** Native HTML `<label>` element

#### MUST-FOLLOW Rules

| Rule | Requirement |
|------|-------------|
| Control Association | MUST wrap control OR use `htmlFor` |
| Native Elements | Custom controls must use native elements as base |
| Text Selection | Double-click prevention built-in |

#### Patterns

```tsx
// ✅ Wrapping pattern
<Label>
  Email
  <input type="email" />
</Label>

// ✅ htmlFor pattern
<Label htmlFor="email">Email</Label>
<input id="email" type="email" />
```

---

## Navigation & Layout

### Navigation Menu

**WAI-ARIA Role:** [`navigation`](https://www.w3.org/TR/wai-aria-1.2/#navigation)

#### Critical Distinction from Menubar

> ⚠️ **NOT a menubar!** Navigation Menu uses the `navigation` role, not `menu` role. This is intentional—menubars are for desktop application menus, not website navigation.

#### MUST-FOLLOW Rules

| Rule | Requirement |
|------|-------------|
| Use NavigationMenu.Link | ALL navigational links must use this component |
| aria-current | Set `active` prop for current page indication |
| No menu role | Do NOT apply menubar semantics |

#### Keyboard Interactions

| Key | Action |
|-----|--------|
| `Space` / `Enter` | Opens content on trigger |
| `Tab` | Moves to next focusable element |
| `ArrowDown` / `ArrowUp` | Navigate triggers/links (horizontal) |
| `ArrowRight` / `ArrowLeft` | Navigate or enter content (orientation-aware) |
| `Home` / `End` | First/last trigger or link |
| `Esc` | Closes content, returns to trigger |

---

### Accordion

**WAI-ARIA Pattern:** [Accordion](https://www.w3.org/WAI/ARIA/apg/patterns/accordion)

#### MUST-FOLLOW Rules

| Rule | Requirement |
|------|-------------|
| Header Hierarchy | Use `asChild` on Header for correct heading level |
| Type Selection | Choose `single` or `multiple` based on UX needs |
| Collapsible | Enable for single-type if all items can close |

#### Keyboard Interactions

| Key | Action |
|-----|--------|
| `Space` / `Enter` | Expand/collapse focused section |
| `Tab` / `Shift+Tab` | Navigate focusable elements |
| `ArrowDown` / `ArrowUp` | Next/previous trigger (vertical) |
| `ArrowRight` / `ArrowLeft` | Next/previous trigger (horizontal) |
| `Home` / `End` | First/last trigger |

#### Animation with CSS Variables

```css
.AccordionContent[data-state="open"] {
  animation: slideDown 300ms ease-out;
}

@keyframes slideDown {
  from { height: 0; }
  to { height: var(--radix-accordion-content-height); }
}
```

---

## Display Components

### Avatar

#### Key Features

- Automatic fallback when image fails to load
- `delayMs` on Fallback prevents flash for fast connections
- Composable with Tooltip for additional info

#### Best Practices

```tsx
// ✅ Always provide fallback
<Avatar.Root>
  <Avatar.Image src={user.avatar} alt={user.name} />
  <Avatar.Fallback delayMs={600}>
    {user.initials}
  </Avatar.Fallback>
</Avatar.Root>

// ✅ Add alt text for screen readers
<Avatar.Image
  src={user.avatar}
  alt={`Profile picture of ${user.name}`}
/>
```

---

### Progress

**WAI-ARIA Pattern:** [Progressbar](https://www.w3.org/WAI/ARIA/apg/patterns/meter)

#### MUST-FOLLOW Rules

| Rule | Requirement |
|------|-------------|
| Value Label | Provide `getValueLabel` for human-readable progress |
| Max Value | Always set `max` for determinate progress |
| Indeterminate | Use `value={null}` for unknown duration |

#### Best Practices

```tsx
// ✅ Accessible value label
<Progress.Root
  value={progress}
  max={100}
  getValueLabel={(value, max) => `${value} of ${max} items processed`}
>
  <Progress.Indicator style={{ width: `${progress}%` }} />
</Progress.Root>
```

#### Data Attributes

| Attribute | Values |
|-----------|--------|
| `[data-state]` | `complete`, `indeterminate`, `loading` |
| `[data-value]` | Current numeric value |
| `[data-max]` | Maximum value |

---

### Separator

**WAI-ARIA Role:** [`separator`](https://www.w3.org/TR/wai-aria-1.2/#separator)

#### MUST-FOLLOW Rules

| Rule | Requirement |
|------|-------------|
| Semantic vs Decorative | Use `decorative={true}` for visual-only separators |
| Orientation | Set correctly for screen reader context |

```tsx
// ✅ Semantic separator (announced by screen readers)
<Separator.Root orientation="horizontal" />

// ✅ Decorative separator (hidden from accessibility tree)
<Separator.Root decorative />
```

---

## Utility Components

### Slot

#### Purpose

Enables the `asChild` pattern for component composition.

#### MUST-FOLLOW Rules

| Rule | Requirement |
|------|-------------|
| Prop Spreading | Child component MUST spread all props |
| Ref Forwarding | Child component MUST forward refs |
| Event Handler Order | Child handlers take precedence over slot handlers |

#### Implementation Pattern

```tsx
// ✅ Creating your own asChild API
function Button({ asChild, ...props }) {
  const Comp = asChild ? Slot.Root : "button";
  return <Comp {...props} />;
}

// Usage
<Button asChild>
  <a href="/contact">Contact Us</a>
</Button>
```

#### Event Handler Precedence

```tsx
// Child's preventDefault is respected
<Slot.Root onClick={() => console.log("Slot")}>
  <button onClick={(e) => e.preventDefault()} />
</Slot.Root>
// Result: Slot's onClick won't log (default prevented)
```

---

## MUST-FOLLOW Rules

### Critical Accessibility Requirements

| Category | Rule | Consequence of Violation |
|----------|------|-------------------------|
| **Focus** | Always return focus to trigger on close | Users lose position on page |
| **Keyboard** | Support all documented key bindings | Keyboard users cannot operate |
| **Labels** | Associate all form controls with labels | Screen readers cannot announce |
| **Roles** | Never override Radix's semantic roles | Assistive tech breaks |
| **States** | Use data attributes for visual state | State unclear to users |

### Implementation Checklist

- [ ] All components use `forwardRef` when used with `asChild`
- [ ] All components spread props to underlying element
- [ ] Form controls have associated `<Label>` components
- [ ] Overlay components have `<Portal>` for z-index management
- [ ] Focus returns to trigger when overlays close
- [ ] Escape key closes all overlay components
- [ ] Touch targets meet 44x44px minimum

---

## Keyboard Navigation Matrix

| Component | Space/Enter | Tab | Arrows | Esc | Home/End |
|-----------|-------------|-----|--------|-----|----------|
| Dialog | Open/Close | Cycle focus | — | Close | — |
| Dropdown Menu | Activate | — | Navigate | Close | — |
| Popover | Open/Close | Cycle focus | — | Close | — |
| Tooltip | Close | Open/Close | — | Close | — |
| Select | Open/Select | — | Navigate | Close | — |
| Tabs | — | To content | Navigate | — | First/Last |
| Checkbox | Toggle | — | — | — | — |
| Radio Group | Select | To group | Navigate+Select | — | — |
| Switch | Toggle | — | — | — | — |
| Accordion | Expand/Collapse | Navigate | Navigate | — | First/Last |
| Navigation Menu | Open | Navigate | Navigate | Close | First/Last |

---

## Accessibility Checklist

### Before Launch

- [ ] All interactive elements have visible focus indicators
- [ ] Color is not the only means of conveying information
- [ ] Text contrast meets WCAG 2.1 AA (4.5:1 for normal text)
- [ ] Touch targets are minimum 44x44px
- [ ] Form errors are announced to screen readers
- [ ] Loading states are communicated accessibly
- [ ] Animations respect `prefers-reduced-motion`

### Testing Requirements

- [ ] Test with keyboard-only navigation
- [ ] Test with screen reader (VoiceOver, NVDA)
- [ ] Test with browser zoom (200%)
- [ ] Test with high contrast mode
- [ ] Verify focus order is logical

---

## References

- [Radix UI Primitives Documentation](https://www.radix-ui.com/primitives)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [W3C Disclosure Navigation Menu](https://w3c.github.io/aria-practices/examples/disclosure/disclosure-navigation.html)
