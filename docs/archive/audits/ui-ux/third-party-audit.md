# Third-Party Integration Forensic Audit

**Agent:** 10 of 13 (Third-Party Specialist)
**Audited:** 2025-12-15
**Codebase:** Crispy CRM (React 19 + React Admin 5 + Tailwind v4)

---

## Library Usage Summary

| Library | Import Count | Override Count | Violations |
|---------|--------------|----------------|------------|
| react-admin | 47 files | 0 (no dense/size=small) | 3 (Storybook only) |
| @radix-ui/* | 27 wrappers | 6 prop overrides | 6 |
| @mui/x-data-grid | 0 | 0 | 0 (not used) |
| shadcn/ui | 27 components | N/A | 0 (wrapper layer) |
| Chart.js | 4 charts | N/A | 0 |

**Key Finding:** No MUI DataGrid is used. All datagrids are React Admin's `Datagrid` component, wrapped by a custom `PremiumDatagrid` component that enforces 52px row heights.

---

## Package Version Analysis

### package.json Versions (2025-12-15)

| Package | Version | Status |
|---------|---------|--------|
| react-admin | ^5.10.0 | Current |
| react | ^19.1.0 | Current |
| @radix-ui/react-dialog | ^1.1.15 | Current |
| @radix-ui/react-dropdown-menu | ^2.1.16 | Current |
| @radix-ui/react-popover | ^1.1.15 | Current |
| @radix-ui/react-tooltip | ^1.2.8 | Current |
| @radix-ui/react-select | ^2.2.6 | Current |
| @radix-ui/react-checkbox | ^1.3.3 | Current |
| @radix-ui/react-switch | ^1.2.6 | Current |
| @radix-ui/react-tabs | ^1.1.12 | Current |
| tailwindcss | ^4.1.11 | Current |

### Known Issues by Package

| Package | Issue | Impact |
|---------|-------|--------|
| None identified | - | - |

All packages are current and compatible with React 19.

---

## React Admin Analysis

### Summary

**Total Components Audited:** 31 instances across 15 files
**Violations Found:** 3 (all in Storybook, not production)
**Compliance Status:** EXCELLENT

### Component Usage Patterns

| Component | Count | Props Used | Violations |
|-----------|-------|------------|------------|
| List | 10 | title, actions, perPage, sort, exporter | 0 |
| PremiumDatagrid | 8 | onRowClick, focusedIndex, bulkActionButtons | 0 |
| Datagrid | 2 | rowClick, bulkActionButtons, className | 0 |
| SimpleForm | 6 | onSubmit, defaultValues, toolbar | 0 |
| Edit | 2 | redirect | 0 |
| Create | - | (wrapped in custom components) | 0 |
| SimpleFormIterator | 3 | inline, disableReordering, disableClear | 0 |

### Key Findings

#### Custom Wrapper: PremiumDatagrid
**File:** `src/components/admin/PremiumDatagrid.tsx`

The codebase properly wraps React Admin's Datagrid with a custom component that:
- Enforces **52px row height** via CSS class `.table-row-premium`
- Adds keyboard navigation support (`focusedIndex`)
- Maintains semantic styling
- **No density prop** (avoids compact mode that violates touch targets)

```tsx
// COMPLIANT pattern used throughout codebase
<PremiumDatagrid
  onRowClick={handleRowClick}
  focusedIndex={focusedIndex}
  bulkActionButtons={<BulkActions />}
>
  {/* Fields */}
</PremiumDatagrid>
```

#### Touch Target Compliance

All React Admin inputs use the custom wrapper components that enforce 44px+ touch targets:

| Component | Touch Target | Compliant? |
|-----------|--------------|------------|
| TextInput | min-h-[48px] | YES |
| SelectInput | h-12 (48px) | YES |
| Button | h-12 (48px) | YES |
| Button (icon) | size-12 (48px) | YES |

### Violations (Storybook Only)

| ID | File:Line | Component | Issue | Severity |
|----|-----------|-----------|-------|----------|
| RA-1 | `src/stories/Header.tsx:45` | Button | `size="small"` reduces touch target | P3 |
| RA-2 | `src/stories/Header.tsx:49` | Button | `size="small"` reduces touch target | P3 |
| RA-3 | `src/stories/Header.tsx:50` | Button | `size="small"` reduces touch target | P3 |

**Note:** These violations are in Storybook story files, not production CRM code.

### Correct Usage Examples

```tsx
// CORRECT - PremiumDatagrid with proper row height
<List title="Contacts" perPage={25} sort={{ field: 'last_name', order: 'ASC' }}>
  <PremiumDatagrid onRowClick={handleRowClick} focusedIndex={focusedIndex}>
    <TextField source="first_name" />
    <TextField source="last_name" />
    <EmailField source="email" />
  </PremiumDatagrid>
</List>

// CORRECT - SimpleForm with proper styling
<SimpleForm onSubmit={handleSubmit} defaultValues={initialValues}>
  <TextInput source="name" />
  <TextInput source="email" />
</SimpleForm>

// CORRECT - Delete button with 44px touch target
<Button
  className="h-11 w-11 inline-flex items-center justify-center"
  aria-label="Delete"
>
  <Trash className="size-5" />
</Button>
```

---

## Radix UI Analysis

### Summary

**Total Wrappers:** 27 shadcn/ui components wrapping Radix primitives
**Direct Radix Imports:** 0 (all via shadcn wrappers)
**Violations Found:** 6 (2 P1, 4 P2)

### Component Inventory

| Radix Primitive | shadcn Wrapper | Portal Config |
|-----------------|----------------|---------------|
| Dialog | dialog.tsx | Default (correct) |
| DropdownMenu | dropdown-menu.tsx | Default (correct) |
| Popover | popover.tsx | Default (correct) |
| Tooltip | tooltip.tsx | Default (correct) |
| AlertDialog | alert-dialog.tsx | Default (correct) |
| Select | select.tsx | Default (correct) |
| Checkbox | checkbox.tsx | N/A |
| Switch | switch.tsx | N/A |
| Tabs | tabs.tsx | N/A |

### Portal Configuration Analysis

The shadcn wrappers correctly configure Radix Portal behavior:

```tsx
// dropdown-menu.tsx:29 - CORRECT portal configuration
function DropdownMenuContent({ className, sideOffset = 4, ...props }, ref) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        // Automatically portals to document.body
      />
    </DropdownMenuPrimitive.Portal>
  );
}
```

### Violations

#### P1 - High (Modal Configuration)

| ID | File:Line | Component | Issue | Impact |
|----|-----------|-----------|-------|--------|
| RX-1 | `src/components/admin/theme-mode-toggle.tsx:50` | DropdownMenu | `modal={false}` passed | Disables focus management |
| RX-2 | `src/components/admin/locales-menu-button.tsx:29` | DropdownMenu | `modal={false}` passed | Disables focus management |

**Problem:** `modal={false}` disables Radix Dialog's modal behavior, preventing:
- Proper focus management (focus escapes dropdown)
- Backdrop handling
- Keyboard accessibility (Escape key behavior)

**Fix:**
```tsx
// WRONG
<DropdownMenuContent modal={false}>

// CORRECT - remove modal prop, use default
<DropdownMenuContent>
```

#### P2 - Medium (forceMount Anti-Pattern)

| ID | File:Line | Component | Issue | Impact |
|----|-----------|-----------|-------|--------|
| RX-3 | `src/components/admin/columns-button.tsx:86` | Popover | `forceMount` on Portal | Keeps hidden DOM mounted |
| RX-4 | `src/components/admin/user-menu.tsx:48` | DropdownMenuContent | `forceMount` enabled | Keeps content mounted when closed |
| RX-5 | `src/atomic-crm/dashboard/v3/components/DashboardTabPanel.tsx:102-138` | TabsContent | `forceMount` on all 4 tabs | Keeps inactive tabs in DOM |

**Problem:** `forceMount` keeps components in the DOM when hidden. This:
- Increases memory usage
- May cause hydration mismatches
- Defeats lazy-loading benefits

**Exceptions:** `forceMount` on Tabs MAY be intentional for preserving scroll position/state. Document if so.

#### P2 - Medium (Touch Target)

| ID | File:Line | Component | Issue | Impact |
|----|-----------|-----------|-------|--------|
| RX-6 | `src/components/ui/checkbox.tsx:13` | Checkbox | Visual size `size-5` (20px) | Below 44px minimum |

**Note:** Component includes comment acknowledging parent container should provide 44px touch target. Ensure all checkbox usages include proper label padding:

```tsx
// CORRECT - 44px via label padding
<label className="flex cursor-pointer items-center gap-2 p-2.5">
  <Checkbox />
  <span>Accept terms</span>
</label>
```

### Correct Usage Examples

```tsx
// CORRECT - Dialog with default portal behavior
<Dialog>
  <DialogTrigger asChild>
    <Button>Open Modal</Button>
  </DialogTrigger>
  <DialogContent>
    {/* Automatically portals to document.body */}
  </DialogContent>
</Dialog>

// CORRECT - DropdownMenu without modal={false}
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

// CORRECT - Tooltip with collision detection
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="ghost" size="icon" className="size-11">
        <Info className="size-5" />
      </Button>
    </TooltipTrigger>
    <TooltipContent>
      {/* Auto-positions to avoid clipping */}
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

---

## MUI DataGrid Analysis

### Summary

**MUI DataGrid Usage:** NONE
**React Admin Datagrid Usage:** 9 instances
**Compliance Status:** EXCELLENT

The codebase does NOT use `@mui/x-data-grid`. All data tables use React Admin's `Datagrid` component, wrapped by the custom `PremiumDatagrid`.

### Datagrid Configuration Audit

| File | Component | Row Height | Density | Compliant? |
|------|-----------|------------|---------|------------|
| ContactList.tsx:109 | PremiumDatagrid | 52px | N/A | YES |
| SalesList.tsx:109 | PremiumDatagrid | 52px | N/A | YES |
| TaskList.tsx:130 | PremiumDatagrid | 52px | N/A | YES |
| ActivityList.tsx:120 | PremiumDatagrid | 52px | N/A | YES |
| OrganizationList.tsx:145 | PremiumDatagrid | 52px | N/A | YES |
| ProductList.tsx:166 | PremiumDatagrid | 52px | N/A | YES |
| OpportunitiesTab.tsx:204 | Datagrid | 52px | N/A | YES |
| ProductDistributorList.tsx:52 | Datagrid | 52px | N/A | YES |

### Row Height Enforcement

Row height is enforced via CSS class `.table-row-premium` in `index.css`:

```css
.table-row-premium {
  @apply py-3; /* 12px top + 12px bottom = 24px padding */
  /* With 40px content = 52px total row height */
}
```

**52px > 40px minimum** - COMPLIANT with touch target requirements.

### Density Check

No `density="compact"` usage found in the codebase. All datagrids use default (comfortable) density.

---

## sx Prop Analysis (All MUI Components)

### Summary

**Total sx={{}} usages:** 35 instances
**Violations Found:** 1 (P1), 2 (Storybook only)
**Compliance Status:** EXCELLENT for production code

### Semantic Color Usage

The codebase demonstrates excellent adherence to semantic colors:

**Pattern 1: Stage Colors via Hook**
```tsx
// Uses getOpportunityStageColor() which returns CSS variables
style={{ backgroundColor: getOpportunityStageColor(opportunity.stage) }}

// stageConstants.ts returns semantic values:
// 'var(--info-subtle)', 'var(--success-strong)', etc.
```

**Pattern 2: Chart Colors via Hook**
```tsx
// Uses useChartTheme() which derives from CSS custom properties
const { colors } = useChartTheme();
// colors.primary, colors.success, etc. are CSS variable references
```

### Violation: Non-Standard CSS Variable

| ID | File:Line | Property | Value | Issue |
|----|-----------|----------|-------|-------|
| SX-1 | `src/atomic-crm/opportunities/components/SimilarOpportunitiesDialog.tsx:111` | color | `"var(--text-on-color)"` | Not in design system |

**Problem:** `--text-on-color` is not a documented semantic token in the design system.

**Fix:**
```tsx
// WRONG
style={{ backgroundColor: getOpportunityStageColor(opp.stage), color: "var(--text-on-color)" }}

// CORRECT - use standard semantic token
style={{ backgroundColor: getOpportunityStageColor(opp.stage) }}
className="text-foreground"

// OR define --text-on-color in design system if needed
```

### Minor Violations (Storybook Only)

| ID | File:Line | Property | Value | Severity |
|----|-----------|----------|-------|----------|
| SX-2 | `src/stories/Header.tsx:25` | fill | `#FFF` | P3 (Storybook) |
| SX-3 | `src/stories/Page.tsx:64` | fill | `#999` | P3 (Storybook) |

### Acceptable Inline Styles

The following patterns are acceptable and NOT violations:

| Pattern | Example | Why Acceptable |
|---------|---------|----------------|
| Dynamic width | `style={{ width: \`${percentage}%\` }}` | Progress bars |
| Dynamic transform | `style={{ transform: \`translateX(-${x}%)\` }}` | Animations |
| Dynamic position | `style={{ left: \`${x}px\`, top: \`${y}px\` }}` | Context menus |
| Viewport calc | `style={{ height: \`calc(100dvh - ${h}px)\` }}` | Full-height layouts |
| Grid minmax | `style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}` | Responsive grids |
| Input minWidth | `sx={{ minWidth: 200 }}` | Form layout constraints |

---

## NEW Violations from Third-Party Misuse

| ID | Library | File:Line | Issue | Correct Usage | Priority |
|----|---------|-----------|-------|---------------|----------|
| TP-1 | Radix | `theme-mode-toggle.tsx:50` | `modal={false}` disables focus management | Remove `modal` prop | P1 |
| TP-2 | Radix | `locales-menu-button.tsx:29` | `modal={false}` disables focus management | Remove `modal` prop | P1 |
| TP-3 | MUI/CSS | `SimilarOpportunitiesDialog.tsx:111` | `var(--text-on-color)` not in design system | Use `text-foreground` | P1 |
| TP-4 | Radix | `columns-button.tsx:86` | `forceMount` on Popover Portal | Remove `forceMount`, use default | P2 |
| TP-5 | Radix | `user-menu.tsx:48` | `forceMount` on DropdownMenuContent | Remove `forceMount` | P2 |
| TP-6 | Radix | `DashboardTabPanel.tsx:102-138` | `forceMount` on all TabsContent | Evaluate necessity, document if intentional | P2 |
| TP-7 | Radix | `checkbox.tsx:13` | Visual size 20px, relies on parent for 44px | Ensure all usages have label padding | P2 |
| TP-8 | Storybook | `Header.tsx:45,49,50` | `size="small"` on Buttons | Use `size="default"` | P3 |
| TP-9 | Storybook | `Header.tsx:25` | Hardcoded `#FFF` in SVG | Use CSS variable | P3 |
| TP-10 | Storybook | `Page.tsx:64` | Hardcoded `#999` in SVG | Use CSS variable | P3 |

---

## Correct Usage Examples Summary

### Instead of: `modal={false}` on DropdownMenu

```tsx
// WRONG
<DropdownMenuContent modal={false}>

// CORRECT
<DropdownMenuContent>
```

### Instead of: `forceMount` without justification

```tsx
// WRONG
<DropdownMenuContent forceMount>

// CORRECT
<DropdownMenuContent>

// ACCEPTABLE (if documented)
<TabsContent forceMount> {/* Preserves scroll position */}
```

### Instead of: Non-standard CSS variable

```tsx
// WRONG
color: "var(--text-on-color)"

// CORRECT
className="text-foreground"
// OR
color: "var(--foreground)"
```

### Instead of: Small touch targets on checkboxes

```tsx
// WRONG - Checkbox alone (20px)
<Checkbox />

// CORRECT - Checkbox with 44px touch target via label
<label className="flex cursor-pointer items-center gap-2 p-2.5">
  <Checkbox />
  <span>Label</span>
</label>
```

---

## Success Criteria Verification

- [x] ALL React Admin usages audited (31 instances, 3 Storybook-only violations)
- [x] ALL Radix usages verified (portal, sizes) - 27 wrappers, 6 violations
- [x] ALL MUI DataGrid configs checked (0 instances - not used)
- [x] ALL sx props analyzed (35 instances, 1 production violation)
- [x] Misuse patterns documented with correct alternatives

---

## Summary Statistics

| Category | Total | Compliant | Violations |
|----------|-------|-----------|------------|
| React Admin | 31 | 28 | 3 (Storybook) |
| Radix UI | 27 wrappers | 21 | 6 |
| MUI DataGrid | 0 | N/A | N/A |
| sx Props | 35 | 32 | 3 (1 prod, 2 Storybook) |
| **Total** | **93** | **81** | **12** |

### Priority Breakdown

| Priority | Count | Action |
|----------|-------|--------|
| P1 (Critical) | 3 | Fix immediately (modal={false}, --text-on-color) |
| P2 (High) | 4 | Fix this sprint (forceMount, checkbox) |
| P3 (Low) | 5 | Backlog (Storybook files) |

---

## Recommendations

### Immediate Actions (P1)

1. **Remove `modal={false}` from theme-mode-toggle.tsx and locales-menu-button.tsx**
   - Impact: Restores focus management and keyboard accessibility
   - Effort: 5 minutes

2. **Fix `--text-on-color` in SimilarOpportunitiesDialog.tsx**
   - Replace with standard `text-foreground` class or define variable in design system
   - Effort: 10 minutes

### This Sprint (P2)

3. **Audit `forceMount` usage** - Evaluate whether state preservation justifies DOM overhead
4. **Document checkbox touch target requirement** - Ensure all usages include label padding

### Documentation

5. **Add to style guide:** "Do not override Radix `modal` or `forceMount` props without explicit justification"
6. **Add to PR checklist:** "Verify Radix components use default portal configuration"

---

## Related Documentation

- [Spacing and Layout](/docs/archive/audits/ui-ux/spacing-and-layout.md)
- [Interactive Elements](/docs/archive/audits/ui-ux/interactive-elements.md)
- [Layout Patterns](/docs/archive/audits/ui-ux/layout-patterns.md)
- [Prioritized Backlog](/docs/archive/audits/ui-ux/prioritized-backlog.md)
