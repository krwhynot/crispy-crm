# A11y Priority Fixes - Implementation Guide

Generated: 2025-11-08
Current Compliance: WCAG 2.1 Level A (Partial) - 60% AA

---

## PRIORITY 1 - CRITICAL (Blocking AA Compliance) - 1-2 Days

### 1. Fix Form Label Associations
**File:** `src/atomic-crm/opportunities/BulkActionsToolbar.tsx`
**Violations:** Lines 227, 282, 334 (jsx-a11y/label-has-associated-control)
**Impact:** High - Common accessibility violation

**Current Code (Line 225-240):**
```tsx
{/* Stage selector */}
<div className="space-y-2">
  <label className="text-sm font-medium">New Stage</label>
  <Select value={selectedStage} onValueChange={setSelectedStage}>
    <SelectTrigger>
      <SelectValue placeholder="Select a stage" />
    </SelectTrigger>
    <SelectContent>
      {OPPORTUNITY_STAGES.map((stage) => (
        <SelectItem key={stage.value} value={stage.value}>
          {stage.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
```

**Fix:**
```tsx
{/* Stage selector */}
<div className="space-y-2">
  <label htmlFor="opportunity-stage" className="text-sm font-medium">
    New Stage
  </label>
  <Select value={selectedStage} onValueChange={setSelectedStage}>
    <SelectTrigger id="opportunity-stage">
      <SelectValue placeholder="Select a stage" />
    </SelectTrigger>
    <SelectContent>
      {OPPORTUNITY_STAGES.map((stage) => (
        <SelectItem key={stage.value} value={stage.value}>
          {stage.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
```

**Repeat for lines 282 and 334 with appropriate ID names**

**Time:** 10 minutes

---

### 2. Remove Redundant ARIA Roles
**Files:** 
- `src/atomic-crm/dashboard/Dashboard.tsx` - Line 89
- `src/atomic-crm/contacts/ContactList.tsx` - Line 56
- `src/atomic-crm/opportunities/BulkActionsToolbar.tsx` - Lines 32, 97, 141 (estimated)

**Violations:** jsx-a11y/no-redundant-roles
**Impact:** Medium - Best practice cleanup

**Current Pattern:**
```tsx
<aside role="complementary" aria-label="Supporting information">
```

**Fix:**
```tsx
<aside aria-label="Supporting information">
  {/* Remove role="complementary" - it's implicit for <aside> */}
```

**Time:** 10 minutes

---

### 3. Add Keyboard Handlers to Interactive Divs
**Files:**
- `src/components/admin/__tests__/FloatingCreateButton.test.tsx` - Line 91
- Filter modal test components

**Violations:** jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
**Impact:** High - Critical for keyboard users

**Pattern:** Find all `<div onClick={...}>` and convert

**Solution A - Use Button Element (PREFERRED):**
```tsx
// Before
<div onClick={handleClick} className="cursor-pointer">
  Click me
</div>

// After
<button 
  onClick={handleClick} 
  className="cursor-pointer"
>
  Click me
</button>
```

**Solution B - Add Keyboard Handler:**
```tsx
// If you must use div
<div 
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(e);
    }
  }}
  className="cursor-pointer"
>
  Click me
</div>
```

**Time:** 15 minutes

---

## PRIORITY 2 - HIGH IMPACT (AA Compliance) - 2-3 Days

### 4. Add aria-describedby to Form Inputs with Error/Helper Text
**Files:** All form input components
**Scope:** 15+ inputs across the codebase
**Impact:** Medium - Improves screen reader experience

**Pattern in form.tsx:**
The infrastructure exists but isn't fully connected.

**Implementation:**
```tsx
// In FormField.tsx or input components
const useFormField = () => {
  const { getFieldState, formState } = useFormContext();
  const { id, name } = useContext(FormItemContext);
  const fieldState = getFieldState(name, formState);

  return useMemo(
    () => ({
      formItemId: id,
      formDescriptionId: `${id}-description`,
      formMessageId: `${id}-message`,
      ...fieldState,
    }),
    [id, fieldState],
  );
};

// In Input components
export const Input = (props) => {
  const { formItemId, formDescriptionId, formMessageId } = useFormField();
  
  return (
    <input
      {...props}
      id={formItemId}
      aria-invalid={!!error}
      aria-describedby={
        error ? `${formMessageId}` : `${formDescriptionId}`
      }
    />
  );
};
```

**Time:** 4-6 hours

---

### 5. Implement Focus Trap in Modals
**Files:**
- `src/atomic-crm/tags/TagDialog.tsx`
- `src/atomic-crm/organizations/OrganizationImportDialog.tsx`
- Other Dialog/Modal components

**Impact:** Medium - Improves keyboard navigation in modals
**Good News:** Already using Radix UI Dialog which has built-in focus trap

**Verification Checklist:**
```tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Radix Dialog handles:
// - Focus trap (Tab stays within modal)
// - Focus restore (Focus returns to trigger on close)
// - Backdrop click close
// - ESC key close

export function TagDialog({
  open,
  onClose,
  onSubmit,
}: TagDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Tag</DialogTitle>
        </DialogHeader>
        
        {/* Form automatically focuses first input */}
        <form onSubmit={handleSubmit}>
          <Input autoFocus={false} />  {/* No autoFocus - focus trap handles it */}
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

**Action:** Verify all modals use Dialog from shadcn (they do)
**Time:** 1 hour (verification only)

---

### 6. Add aria-labels to Icon Buttons
**Count:** 10+ instances
**Files:**
- Dashboard: RefreshCw button ✓ (already has label)
- TagDialog: Color picker buttons (no labels)
- Filter icons (various)
- Delete/Edit/Create buttons with icons only

**Impact:** Medium - Improves screen reader experience

**Pattern:**
```tsx
// Before
<button className="h-10 w-10">
  <Trash2 className="h-4 w-4" />
</button>

// After
<button 
  className="h-10 w-10"
  aria-label="Delete item"
  title="Delete item"
>
  <Trash2 className="h-4 w-4" />
</button>
```

**Find & Fix:**
```bash
# Find all icon buttons without aria-label
grep -r "<button.*<[A-Z].*Icon" src/atomic-crm --include="*.tsx" | grep -v aria-label
```

**Time:** 3-4 hours

---

### 7. Use useAriaAnnounce for Async Operations
**Files:**
- `src/atomic-crm/dashboard/MyTasksThisWeek.tsx` - Task completion
- `src/atomic-crm/opportunities/BulkActionsToolbar.tsx` - Bulk operations
- Any form submit handlers

**Impact:** Low-Medium - Improves user feedback for screen reader users

**Implementation:**
```tsx
import { useAriaAnnounce } from '@/lib/design-system';

export const MyTasksThisWeek = () => {
  const announce = useAriaAnnounce();
  const [update] = useUpdate();

  const handleTaskComplete = (taskId: number) => {
    update(
      'tasks',
      {
        id: taskId,
        data: { completed: true },
      },
      {
        onSuccess: () => {
          announce(`Task completed`);
        },
        onError: (error) => {
          announce(`Error completing task: ${error.message}`);
        },
      }
    );
  };

  // ...
};
```

**Time:** 2-3 hours

---

## PRIORITY 3 - MEDIUM PRIORITY (Polish) - 3-4 Days

### 8. Replace Placeholder-Only Inputs with Labels
**Files:**
- `src/components/admin/search-input.tsx`
- `src/components/admin/SegmentComboboxInput.tsx`
- `src/components/ui/command.tsx` (stories)

**Pattern:**
```tsx
// Before
<input placeholder="Search items..." />

// After
<label htmlFor="search">Search items</label>
<input 
  id="search"
  placeholder="Start typing to filter..."
/>
```

**Time:** 2 hours

---

### 9. Add aria-required to Required Form Fields
**Files:** All form inputs where validation shows "required"
**Pattern:**
```tsx
<Input
  aria-required={isRequired}
  required={isRequired}
  {...otherProps}
/>
```

**Time:** 1-2 hours

---

### 10. Verify Table Semantics
**Files:**
- `src/components/admin/data-table.tsx` (verify structure)
- `src/atomic-crm/dashboard/PrincipalDashboardTable.tsx`

**Checklist:**
- [ ] Uses `<table>` semantic element
- [ ] Headers in `<thead>` with `<th>` and scope attribute
- [ ] Body rows in `<tbody>`
- [ ] Table has aria-label or aria-describedby

**Time:** 2-3 hours (investigation + fixes)

---

## PRIORITY 4 - DOCUMENTATION & CI/CD - 1-2 Days

### 11. Update CLAUDE.md with A11y Guidance
**File:** `CLAUDE.md`
**Content:**
- Link to new `docs/A11Y_QUICK_REFERENCE.md`
- A11y patterns section
- ESLint rules overview

**Time:** 30 minutes

---

### 12. Add Pre-commit A11y Check
**File:** `.husky/pre-commit` or `package.json` scripts
**Command:**
```bash
npm run lint:check -- --fix
```

**Time:** 30 minutes

---

## TIMELINE ESTIMATE

| Priority | Task | Hours | Total |
|----------|------|-------|-------|
| 1 | Form labels + redundant roles + div handlers | 0.5 | 0.5 |
| 2 | aria-describedby (form infrastructure) | 4-6 | 4.5 |
| 2 | Focus traps (verification) | 1 | 1 |
| 2 | Icon aria-labels | 3-4 | 3.5 |
| 2 | Live region announcements | 2-3 | 2.5 |
| 3 | Placeholder-only inputs | 2 | 2 |
| 3 | aria-required attributes | 1-2 | 1.5 |
| 3 | Table semantics | 2-3 | 2.5 |
| 4 | Documentation | 1 | 1 |
| **TOTAL** | | | **19.5 hours** |

**Timeline:** 2-3 weeks at normal development pace
**Fast Track:** 1 week with focused sprint

---

## VERIFICATION CHECKLIST

After implementing fixes:

- [ ] Run `npm run lint:check` - 0 jsx-a11y violations
- [ ] Manual keyboard test (Tab through every page)
- [ ] Test with screen reader (VoiceOver/NVDA)
- [ ] Check focus visible rings on all interactive elements
- [ ] Verify color contrast with Chrome DevTools
- [ ] Test with axe DevTools extension

---

## RESOURCES

- Full Audit: `docs/ACCESSIBILITY_AUDIT.md`
- Quick Reference: `docs/A11Y_QUICK_REFERENCE.md`
- ESLint Config: `eslint.config.js` (jsx-a11y plugin configured)

---

## Next Steps

1. Start with Priority 1 (4 violations = 30 minutes)
2. Move to Priority 2 (6 items = 11-13 hours)
3. Polish with Priority 3 (4 items = 6 hours)
4. Document & CI/CD (1 hour)

Total focused effort: ~20 hours to reach AA compliance

