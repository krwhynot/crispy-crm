# Accessibility (A11y) Quick Reference for Atomic CRM

## Current Compliance Level
**WCAG 2.1 Level A (Partial) - 70% A compliance, 60% AA compliance**

Status: On path to AA with targeted fixes (2-3 weeks focused work)

---

## Quick Checks Before Submitting Code

### 1. Form Labels (HIGH PRIORITY)
```tsx
// ✓ CORRECT
<FormField id="stage" name="stage">
  <FormLabel htmlFor="stage">New Stage</FormLabel>
  <Select id="stage">...</Select>
</FormField>

// ❌ WRONG
<label className="font-medium">New Stage</label>
<Select>...</Select>  // No association
```

### 2. Keyboard Accessibility (HIGH PRIORITY)
```tsx
// ✓ CORRECT - Use native button
<button onClick={handleClick}>Action</button>

// ✓ CORRECT - Add keyboard handler
<div 
  role="button" 
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') handleClick();
  }}
>
  Action
</div>

// ❌ WRONG
<div onClick={handleClick}>Action</div>
```

### 3. Icon Labels (MEDIUM PRIORITY)
```tsx
// ✓ CORRECT
<button aria-label="Create new contact">
  <Plus />
</button>

// ✓ CORRECT
<RoundButton 
  color="tag-warm" 
  aria-label="Color: Warm"
/>

// ❌ WRONG
<button><Plus /></button>  // No label for icon
```

### 4. ARIA Roles (MEDIUM PRIORITY)
```tsx
// ✓ CORRECT - No explicit role on semantic elements
<aside aria-label="Filters">
  <h2>Filter Options</h2>
</aside>

// ❌ WRONG - Redundant role
<aside role="complementary" aria-label="Filters">
  ...
</aside>
```

### 5. Focus States (APPLIED GLOBALLY)
```tsx
// ✓ Already applied via Tailwind classes
className="focus-visible:ring-ring focus-visible:ring-[3px] focus-visible:border-ring outline-none"

// Your components automatically get focus rings through shadcn/ui inputs & buttons
```

---

## Common Violations & Fixes

### A. Unassociated Form Labels
**Files:** BulkActionsToolbar.tsx (lines 227, 282, 334)

```tsx
// Before
<label className="text-sm font-medium">New Stage</label>
<Select value={selectedStage} onValueChange={setSelectedStage}>

// After
<label htmlFor="new-stage">New Stage</label>
<Select id="new-stage" value={selectedStage} onValueChange={setSelectedStage}>
```

### B. Redundant ARIA Roles
**Files:** ContactList.tsx, Dashboard.tsx, BulkActionsToolbar.tsx

```tsx
// Before
<aside role="complementary" aria-label="Filters">

// After
<aside aria-label="Filters">  // role already implicit
```

### C. Non-Keyboard Interactive Elements
**Files:** FloatingCreateButton test, some test components

```tsx
// Before
<div onClick={handleClick} className="cursor-pointer">
  Click me
</div>

// After
<button onClick={handleClick} className="cursor-pointer">
  Click me
</button>
```

### D. Icons Without Labels
**Pattern:** Lucide React icons in buttons

```tsx
// Before
<button><RefreshCw className="h-4 w-4" /></button>

// After
<button aria-label="Refresh dashboard">
  <RefreshCw className="h-4 w-4" />
</button>
```

---

## Accessibility Hooks Available

### useAriaAnnounce() - Live Region Announcements
```tsx
import { useAriaAnnounce } from '@/lib/design-system';

const MyComponent = () => {
  const announce = useAriaAnnounce();
  
  const handleAction = async () => {
    await executeAction();
    announce('Action completed successfully');
  };
};
```

**Use Cases:**
- Form submission success/failure
- Task completion
- Bulk operation results
- Filter application
- Data refresh

### useKeyboardNavigation() - Arrow Key Navigation
```tsx
import { useKeyboardNavigation } from '@/lib/design-system';

const items = [/* ... */];
const { currentIndex, handleKeyDown } = useKeyboardNavigation({
  items,
  onSelect: (index) => navigate(`/item/${items[index].id}`),
});

return <div onKeyDown={handleKeyDown} tabIndex={0}>...</div>;
```

---

## ESLint A11y Rules

These rules run on every commit:
- `jsx-a11y/label-has-associated-control` - Form labels must be associated
- `jsx-a11y/click-events-have-key-events` - Click handlers need keyboard support
- `jsx-a11y/no-static-element-interactions` - Use button element, not div
- `jsx-a11y/no-redundant-roles` - Don't add role to semantic elements
- `jsx-a11y/no-autofocus` - Don't use autoFocus attribute

**Running ESLint:**
```bash
npm run lint:check  # Check for violations
npm run lint:apply  # Auto-fix where possible
```

---

## Component Patterns

### FormField (RECOMMENDED)
Use this for ALL form inputs:
```tsx
<FormField id="email" name="email" className="w-full">
  <FormLabel>Email Address</FormLabel>
  <FormControl>
    <Input
      id="email"
      type="email"
      placeholder="you@example.com"
      aria-invalid={!!errors.email}
      aria-describedby={errors.email ? 'email-error' : undefined}
    />
  </FormControl>
  <FormError />
</FormField>
```

### Interactive Elements
```tsx
// Buttons always get focus rings automatically
<Button>Click me</Button>

// Links are naturally keyboard accessible
<Link to="/path">Go somewhere</Link>

// DIVs with click handlers need role + tabIndex + onKeyDown
<div role="button" tabIndex={0} onClick={...} onKeyDown={...} />
```

### Icons
```tsx
// Icon buttons should have aria-label
<button aria-label="Close dialog">
  <X className="h-4 w-4" />
</button>

// Decorative icons don't need labels (context is clear)
<span className="text-primary">Success</span>  // OK
<CheckCircle className="text-primary" />  // OK - context from text
```

---

## Testing A11y

### Manual Testing
1. **Keyboard Only:** Use Tab, Shift+Tab, Enter, Space to navigate
2. **Screen Reader:** Use VoiceOver (Mac), NVDA (Windows), or JAWS
3. **Focus Visible:** All interactive elements have visible focus ring
4. **Color Contrast:** Text meets WCAG AA (4.5:1 for normal, 3:1 for large)

### Automated Testing
```bash
# Check ESLint rules
npm run lint:check

# Run unit tests
npm test

# Check contrast with design system
npm run validate:colors
```

### Tools
- **Chrome DevTools:** Accessibility panel (right-click > Inspect > Accessibility)
- **axe DevTools:** Browser extension for automated testing
- **WAVE:** Browser extension for visual feedback
- **Screen Reader:** VoiceOver (Mac), NVDA (Windows - free)

---

## Priority Fixes (Ranked)

### MUST DO (Blocking AA compliance)
1. Fix 3 unassociated labels in BulkActionsToolbar
2. Add keyboard handlers to 4+ div elements with onClick
3. Remove 8 redundant role attributes

### SHOULD DO (High impact)
4. Add aria-describedby to form inputs
5. Implement focus trap in modals
6. Add aria-labels to icon buttons (10+ instances)
7. Use useAriaAnnounce for task completion

### NICE TO HAVE (Polish)
8. Replace placeholder-only fields with visible labels
9. Add aria-required to required fields
10. Improve table semantics for data tables

---

## Resources

### WCAG Guidelines
- [WCAG 2.1 AA Checklist](https://www.w3.org/WAI/test-evaluate/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [MDN: Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

### Tools
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE](https://wave.webaim.org/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) (Chrome)

### Learning
- [WebAIM: Introduction to Web Accessibility](https://webaim.org/intro/)
- [Deque: Accessible Components](https://dequeuniversity.com/)
- [A11ycasts by Google Chrome](https://www.youtube.com/playlist?list=PLNYkxOF6rcICWx0C9Xc-RgEzwLvePng7V)

---

## Questions?

See full audit: `accessibility-audit.md`

Audit date: 2025-11-08
Compliance: WCAG 2.1 Level A (Partial) - 60% AA

