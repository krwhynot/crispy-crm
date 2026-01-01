# Accessibility Testing Manual Checklist (WCAG 2.1 AA)

Manual E2E testing checklist for WCAG 2.1 Level AA accessibility compliance. Based on automated test specifications in `/tests/e2e/dashboard-v3/accessibility.spec.ts` and `/tests/e2e/specs/ui-ux-changes/accessibility.spec.ts`.

## Test Environment Setup

**Environment Selection:**
| Environment | Base URL | Credentials |
|-------------|----------|-------------|
| Local | http://localhost:5173 | admin@test.com / password123 |
| Production | https://crm.kjrcloud.com | [production credentials] |

## Overview

This checklist covers WCAG 2.1 AA requirements across:
- Keyboard navigation and focus management
- Screen reader compatibility and ARIA attributes
- Color contrast and visual design
- Form accessibility (labels, errors, validation)
- Touch target sizing (44x44px minimum)

## 1. Full Page Accessibility

### Test 1.1: Dashboard WCAG Compliance
**Goal:** Verify Dashboard V3 passes automated WCAG 2.1 AA checks.

**Prerequisites:**
- Install axe DevTools browser extension OR use axe-core via DevTools Console
- Navigate to `/#/` (Dashboard V3)

**Steps:**
1. Open browser DevTools
2. Navigate to "Accessibility" tab (if using Edge/Chrome with axe extension)
   - OR run axe-core via Console: `axe.run().then(results => console.log(results))`
3. Run full page scan with WCAG 2.1 AA rules
4. Review violations report

**Expected Results:**
- [ ] Zero critical violations
- [ ] Zero serious violations
- [ ] Zero moderate violations
- [ ] All WCAG 2.1 AA rules pass: wcag2a, wcag2aa, wcag21a, wcag21aa

**Violations to Check:**
- 1.1.1 Non-text Content (images, icons have alt text)
- 1.3.1 Info and Relationships (semantic HTML, ARIA)
- 1.4.3 Contrast Minimum (4.5:1 for text, 3:1 for large text)
- 2.1.1 Keyboard (all functionality accessible via keyboard)
- 2.4.6 Headings and Labels (descriptive, unique)
- 4.1.2 Name, Role, Value (ARIA attributes valid)

---

### Test 1.2: Post-Load Accessibility
**Goal:** Verify accessibility is maintained after dynamic data loads.

**Steps:**
1. Navigate to Dashboard (`/#/`)
2. Wait for all loading skeletons to disappear
3. Verify no `.animate-pulse` elements remain visible
4. Run axe-core scan again

**Expected Results:**
- [ ] Zero violations after data loads
- [ ] No new accessibility issues introduced by dynamic content

---

## 2. Keyboard Navigation

### Test 2.1: Tab Navigation
**Goal:** Verify entire dashboard can be navigated using Tab key only.

**Steps:**
1. Navigate to Dashboard (`/#/`)
2. Click into address bar, then press Tab to enter page
3. Press Tab repeatedly (20-30 times)
4. Track which elements receive focus (write them down)

**Expected Results:**
- [ ] Focus moves sequentially through interactive elements
- [ ] At least 5 unique elements receive focus
- [ ] No keyboard traps (focus doesn't get stuck on same element)
- [ ] Focus order is logical (left-to-right, top-to-bottom)
- [ ] All major UI controls are reachable

**Elements That Should Be Focusable:**
- "My Principals" toggle switch
- "Filters" dropdown button
- Search principal input
- Pipeline table rows
- Task checkboxes
- Snooze buttons
- "New Activity" button
- Form inputs in Quick Logger

---

### Test 2.2: Escape Key Closes Dialogs
**Goal:** Verify Escape key closes open dropdowns and dialogs.

**Steps:**
1. Navigate to Dashboard (`/#/`)
2. Click "Filters" dropdown button
3. Verify dropdown menu is visible
4. Press Escape key

**Expected Results:**
- [ ] Dropdown closes immediately
- [ ] No console errors
- [ ] Focus returns to trigger button (Filters button)

**Repeat for:**
- [ ] Task action menus (More Actions dropdown)
- [ ] Quick Logger form (if applicable)
- [ ] Any modal dialogs

---

### Test 2.3: Focus Trap in Dialogs
**Goal:** Verify focus stays within open dialogs.

**Steps:**
1. Navigate to Dashboard (`/#/`)
2. Click on a pipeline row to open drill-down sheet
3. Wait for sheet/dialog to appear
4. Press Tab repeatedly (10+ times)
5. Track whether focus leaves the dialog

**Expected Results:**
- [ ] Focus cycles within dialog only
- [ ] Focus never escapes to background content
- [ ] Tab reaches all interactive elements in dialog
- [ ] Shift+Tab reverses direction correctly

---

### Test 2.4: Focus Return After Dialog Close
**Goal:** Verify focus returns to trigger element after closing dialogs.

**Steps:**
1. Navigate to Dashboard (`/#/`)
2. Click "Filters" button (note which element has focus)
3. Press Escape to close dropdown
4. Check which element now has focus

**Expected Results:**
- [ ] Focus returns to "Filters" button
- [ ] No focus loss to document body

**Repeat for:**
- [ ] Pipeline drill-down sheet close
- [ ] Task action menus
- [ ] Any modal closes

---

## 3. Screen Reader Compatibility

### Test 3.1: Heading Hierarchy
**Goal:** Verify logical heading structure for screen readers.

**Prerequisites:**
- Use browser extension like "HeadingsMap" OR use axe DevTools
- Navigate to Dashboard (`/#/`)

**Steps:**
1. Open HeadingsMap or axe DevTools
2. View heading structure outline

**Expected Results:**
- [ ] Exactly one H1 on page ("Principal Dashboard")
- [ ] Heading levels don't skip (no H1 → H3 jumps)
- [ ] Headings are descriptive and unique
- [ ] Logical hierarchy: H1 > H2 > H3

**Example Structure:**
```
H1: Principal Dashboard
  H2: Pipeline by Principal
  H2: My Tasks
    H3: Overdue (if using headings for task groups)
    H3: Today
    H3: Tomorrow
  H2: Log Activity
```

---

### Test 3.2: ARIA Attributes Validity
**Goal:** Verify ARIA attributes are properly used.

**Prerequisites:**
- Use axe DevTools or manual inspection
- Navigate to Dashboard (`/#/`)

**Steps:**
1. Run axe-core with ARIA-specific rules:
   - `aria-allowed-attr`
   - `aria-required-attr`
   - `aria-required-children`
   - `aria-required-parent`
   - `aria-roles`
   - `aria-valid-attr-value`
   - `aria-valid-attr`
2. Review violations

**Expected Results:**
- [ ] All ARIA attributes are valid
- [ ] No invalid `aria-*` attribute names
- [ ] All required ARIA attributes present
- [ ] ARIA roles have required children/parents
- [ ] No `aria-hidden` on focusable elements

---

### Test 3.3: Live Regions for Dynamic Updates
**Goal:** Verify screen readers announce dynamic updates.

**Prerequisites:**
- Enable screen reader (NVDA on Windows, VoiceOver on Mac)
- Navigate to Dashboard (`/#/`)

**Steps:**
1. Inspect page for `aria-live`, `role="alert"`, `role="status"` regions
2. Trigger a dynamic update (e.g., complete a task, log an activity)
3. Listen for screen reader announcement

**Expected Results:**
- [ ] Live regions exist in the document
- [ ] Success messages use `role="alert"` or `aria-live="assertive"`
- [ ] Status updates use `aria-live="polite"`
- [ ] Screen reader announces changes without manual navigation

**Manual Inspection:**
Use DevTools Elements tab to search for:
```html
<div role="alert">Success message</div>
<div aria-live="polite">Status update</div>
```

---

### Test 3.4: Table Semantic Structure
**Goal:** Verify Pipeline table has proper semantic structure.

**Steps:**
1. Navigate to Dashboard (`/#/`)
2. Inspect Pipeline by Principal table
3. Right-click table > Inspect element

**Expected Results:**
- [ ] Table uses `<table>` element (not divs styled as table)
- [ ] Column headers use `<th>` with `role="columnheader"`
- [ ] Sortable columns have `aria-sort` attribute (ascending, descending, or none)
- [ ] Each `<th>` has at least 5 columns: Principal, New Lead, Initial Outreach, Sample/Visit Offered, Next Action
- [ ] Rows use `<tr>`, cells use `<td>`

**ARIA-Sort Values:**
- `aria-sort="ascending"` when sorted A→Z or 0→9
- `aria-sort="descending"` when sorted Z→A or 9→0
- `aria-sort="none"` when not sorted

---

### Test 3.5: Images and Icons Have Alt Text
**Goal:** Verify non-text content has text alternatives.

**Prerequisites:**
- Use axe DevTools
- Navigate to any page with images/icons

**Steps:**
1. Run axe-core with rules: `image-alt`, `svg-img-alt`
2. Review violations
3. Manually check decorative icons have `aria-hidden="true"`

**Expected Results:**
- [ ] All `<img>` elements have `alt` attribute
- [ ] Decorative images have `alt=""` or `aria-hidden="true"`
- [ ] Functional images have descriptive alt text (e.g., "Delete task", not "icon")
- [ ] SVG icons are either hidden or have accessible names

---

## 4. Focus Management

### Test 4.1: Focus Visible on All Interactive Elements
**Goal:** Verify focus indicators are visible.

**Steps:**
1. Navigate to Dashboard (`/#/`)
2. Press Tab to focus first interactive element
3. Continue tabbing through 10+ elements
4. Observe focus ring/outline on each element

**Expected Results:**
- [ ] Every focusable element shows a visible focus indicator
- [ ] Focus ring is at least 2px wide (design system uses 3px ring)
- [ ] Focus ring contrasts with background (3:1 minimum)
- [ ] Focus ring is not obscured by other elements

**Check Focus Styles:**
- Tailwind ring utilities: `ring-2`, `ring-offset-2`
- Semantic focus colors: `ring-ring` (uses design system color)
- No `outline: none` without replacement

---

### Test 4.2: Focus Ring Standards
**Goal:** Verify focus ring meets design system standards (3px ring per Crispy Design System).

**Prerequisites:**
- Browser DevTools open
- Navigate to any page

**Steps:**
1. Press Tab to focus an interactive element
2. Right-click element > Inspect
3. Check Computed styles in DevTools
4. Look for:
   - `outline` property
   - `box-shadow` property (Tailwind ring uses box-shadow)
   - `--tw-ring-width` CSS variable

**Expected Results:**
- [ ] Focus ring is visible (outline or box-shadow)
- [ ] Ring width is 3px (matches design system)
- [ ] Ring color contrasts with background
- [ ] Ring is offset from element boundary (prevents overlap)

**Design System Standards:**
- 3px ring width (`ring-3` or equivalent)
- Offset for clarity (`ring-offset-2`)
- Semantic color (`ring-ring`)

---

## 5. Color Contrast

### Test 5.1: Text Color Contrast (4.5:1 Minimum)
**Goal:** Verify all text meets WCAG AA contrast requirements.

**Prerequisites:**
- Use axe DevTools OR "WCAG Color Contrast Checker" extension
- Navigate to any page

**Steps:**
1. Run axe-core with rule: `color-contrast`
2. Review violations
3. Note any text with insufficient contrast

**Expected Results:**
- [ ] Normal text (< 18pt) has 4.5:1 contrast minimum
- [ ] Large text (≥ 18pt or bold ≥ 14pt) has 3:1 contrast minimum
- [ ] Zero color contrast violations

**Common Violations to Check:**
- Placeholder text (often too light)
- Disabled button text
- Muted text (design system: `text-muted-foreground`)
- Link text on colored backgrounds

---

### Test 5.2: Semantic Colors (No Hardcoded Hex)
**Goal:** Verify design system semantic colors are used (not hardcoded hex/rgb).

**Steps:**
1. Navigate to Dashboard (`/#/`)
2. Right-click any text element > Inspect
3. Check Computed styles > `color` property
4. Verify color uses CSS custom properties (variables)

**Expected Results:**
- [ ] Colors use CSS variables like `hsl(var(--foreground))`
- [ ] No hardcoded hex values like `#000000` or `#6B7280`
- [ ] No pure black (`rgb(0, 0, 0)`) or pure white (`rgb(255, 255, 255)`)
- [ ] Semantic color tokens used: `text-foreground`, `text-muted-foreground`, `bg-primary`, `text-destructive`

**Design System Semantic Colors:**
- `text-foreground` (primary text)
- `text-muted-foreground` (secondary text)
- `bg-primary` (primary background)
- `bg-secondary` (secondary background)
- `text-destructive` (error/danger text)
- `border` (borders)

---

### Test 5.3: Information Not Conveyed by Color Alone
**Goal:** Verify color is not the only means of conveying information.

**Steps:**
1. Navigate to Dashboard (`/#/`)
2. Identify colored indicators (e.g., status badges, validation errors)
3. Check if color is supplemented by:
   - Icons
   - Text labels
   - Patterns/shapes

**Expected Results:**
- [ ] Error states use red color + icon + "Required" text
- [ ] Success states use green color + checkmark icon + "Success" text
- [ ] Status badges use color + text label
- [ ] Links are underlined or have icons (not just color difference)

**Examples:**
- ✅ Error: Red border + X icon + "Required field" text
- ❌ Error: Red border only

---

## 6. Form Accessibility

### Test 6.1: Label-Input Connection
**Goal:** Verify clicking labels focuses associated inputs.

**Steps:**
1. Navigate to `/#/contacts/create`
2. Wait for form to load
3. Click on the text of the "First Name" label (not the input)

**Expected Results:**
- [ ] Input field receives focus
- [ ] Cursor appears in the input

**Repeat for:**
- [ ] Last Name
- [ ] Email
- [ ] Any other text inputs

**Technical Implementation:**
- Label has `for` attribute matching input `id`
- OR input is nested inside `<label>` element

---

### Test 6.2: Error Message Association (aria-describedby)
**Goal:** Verify validation errors are programmatically associated with inputs.

**Steps:**
1. Navigate to `/#/contacts/create`
2. Click "Save & Close" without filling any fields
3. Wait for validation errors to appear
4. Right-click an input with an error > Inspect

**Expected Results:**
- [ ] Input has `aria-invalid="true"` attribute
- [ ] Input has `aria-describedby` attribute pointing to error message ID
- [ ] Error message element exists with matching ID
- [ ] Error message element has `role="alert"` for screen reader announcement

**Example HTML:**
```html
<input
  id="first-name"
  aria-invalid="true"
  aria-describedby="first-name-error"
/>
<p id="first-name-error" role="alert">Required field</p>
```

---

### Test 6.3: Error Announcement (role="alert")
**Goal:** Verify validation errors are announced to screen readers.

**Prerequisites:**
- Enable screen reader (optional, or inspect manually)

**Steps:**
1. Navigate to `/#/contacts/create`
2. Click "Save & Close" without filling fields
3. Inspect error messages in DevTools

**Expected Results:**
- [ ] Error message container has `role="alert"` attribute
- [ ] Screen reader announces error immediately when it appears
- [ ] Error text is descriptive ("First Name is required", not just "Required")

**Alternative (Manual Inspection):**
Search page source for `role="alert"` elements after triggering validation.

---

### Test 6.4: Form Input Labels
**Goal:** Verify all form inputs have accessible labels.

**Prerequisites:**
- Use axe DevTools
- Navigate to any form page

**Steps:**
1. Navigate to `/#/opportunities/create` (or any form)
2. Run axe-core with rule: `label`
3. Review violations

**Expected Results:**
- [ ] Zero "Form elements must have labels" violations
- [ ] Every `<input>`, `<select>`, `<textarea>` has associated label
- [ ] Labels are visible (not hidden) or have `aria-label` attribute
- [ ] Comboboxes have accessible names via `aria-labelledby` or `aria-label`

---

### Test 6.5: Focus Indicators on Form Inputs
**Goal:** Verify form inputs show focus indicators.

**Steps:**
1. Navigate to `/#/contacts/create`
2. Press Tab to navigate through form fields
3. Observe focus ring on each input

**Expected Results:**
- [ ] Text inputs show focus ring when focused
- [ ] Select dropdowns show focus ring
- [ ] Comboboxes show focus ring
- [ ] Focus ring is at least 2px wide with good contrast

---

### Test 6.6: Keyboard Navigation on Forms
**Goal:** Verify forms are fully keyboard-navigable.

**Steps:**
1. Navigate to `/#/contacts/create`
2. Use only keyboard to complete form:
   - Tab to move forward
   - Shift+Tab to move backward
   - Arrow keys for select/combobox options
   - Enter to select options
   - Space to check checkboxes

**Expected Results:**
- [ ] Can reach all form fields with Tab
- [ ] Can select all dropdown/combobox options with keyboard
- [ ] Can submit form with Enter or Tab to submit button + Space
- [ ] Can navigate between tabs (if form has tabs) with keyboard
- [ ] No keyboard traps in combobox components

---

## 7. Touch Target Sizing (44x44px Minimum)

### Test 7.1: Button Touch Targets
**Goal:** Verify all interactive elements meet 44x44px minimum touch target size (WCAG 2.1 Level AA).

**Prerequisites:**
- Browser DevTools with ruler/measure tool OR
- "Accessibility Insights" browser extension

**Steps:**
1. Navigate to Dashboard (`/#/`)
2. Open DevTools > Elements tab
3. Select an interactive element (button, checkbox, link)
4. View Computed styles > Box Model > Width and Height

**Expected Results:**
- [ ] All buttons are at least 44x44px
- [ ] All checkboxes are at least 44x44px (including invisible hit area)
- [ ] All icon-only buttons are at least 44x44px
- [ ] All links in task items are at least 44x44px

**Design System Standards:**
- Tailwind classes: `h-11 w-11` (44px x 44px)
- Minimum for touch targets: 44x44px
- Exceptions: Inline text links (but should have padding to increase hit area)

**Elements to Check:**
- [ ] "Filters" button
- [ ] "New Activity" button
- [ ] "Snooze" buttons in tasks
- [ ] "More Actions" menu buttons
- [ ] Task checkboxes
- [ ] Pipeline table row click targets
- [ ] Form submit buttons

---

### Test 7.2: Touch Target Spacing
**Goal:** Verify adequate spacing between touch targets.

**Steps:**
1. Navigate to Dashboard (`/#/`)
2. Inspect task items with multiple action buttons
3. Measure distance between "Snooze" and "More Actions" buttons

**Expected Results:**
- [ ] At least 8px spacing between adjacent touch targets
- [ ] Buttons don't overlap
- [ ] Clear visual separation

---

## 8. Component-Specific Tests

### Test 8.1: Pipeline Table Row Accessibility
**Goal:** Verify clickable table rows are keyboard accessible.

**Steps:**
1. Navigate to Dashboard (`/#/`)
2. Tab to first pipeline table row
3. Inspect the `<tr>` element

**Expected Results:**
- [ ] Row has `tabindex="0"` (focusable)
- [ ] Row has `role="button"` (announces as button to screen readers)
- [ ] Row has `aria-label` describing action (e.g., "View opportunities for [Principal Name]")
- [ ] Pressing Enter or Space activates row (opens drill-down)

---

### Test 8.2: Task Checkboxes Labels
**Goal:** Verify task checkboxes have accessible labels.

**Steps:**
1. Navigate to Dashboard (`/#/`)
2. Locate task items in "My Tasks" panel
3. Right-click a checkbox > Inspect

**Expected Results:**
- [ ] Checkbox has accessible name via `aria-label` or `aria-labelledby`
- [ ] Label describes the task (e.g., "Mark task complete: Follow up with...")
- [ ] Checkbox can be toggled with keyboard (Space key)

---

### Test 8.3: Snooze and Action Buttons Accessible Names
**Goal:** Verify icon-only buttons have accessible names.

**Steps:**
1. Navigate to Dashboard (`/#/`)
2. Locate "Snooze" button in a task item
3. Right-click button > Inspect

**Expected Results:**
- [ ] Button has `aria-label` attribute (e.g., "Snooze task until tomorrow")
- [ ] "More Actions" button has `aria-label` (e.g., "More actions for task")
- [ ] Accessible name is descriptive, not generic ("More" → "More actions for task")

---

### Test 8.4: Task Group Collapsible Sections
**Goal:** Verify task groups (Overdue, Today, Tomorrow) are accessible.

**Steps:**
1. Navigate to Dashboard (`/#/`)
2. Locate "Overdue" section header (if collapsible)
3. Inspect the button/header element

**Expected Results:**
- [ ] Collapsible section has `aria-expanded` attribute (true/false)
- [ ] Button/header is keyboard accessible (focusable and activatable)
- [ ] Section role is `button` or has `role="button"`

---

### Test 8.5: Quick Logger Form Controls
**Goal:** Verify Quick Logger form has proper labels.

**Steps:**
1. Navigate to Dashboard (`/#/`)
2. Click "New Activity" button to open form
3. Run axe-core on the form container

**Expected Results:**
- [ ] All form inputs have labels
- [ ] Comboboxes have accessible names
- [ ] Submit buttons are labeled ("Save & Close", "Save & New")
- [ ] Cancel button is labeled
- [ ] No label violations

---

### Test 8.6: Combobox Keyboard Navigation
**Goal:** Verify comboboxes (shadcn/ui Command component) are keyboard accessible.

**Steps:**
1. Navigate to Dashboard (`/#/`)
2. Click "New Activity", open Quick Logger form
3. Tab to Activity Type combobox
4. Press Enter or Arrow Down to open options
5. Use Arrow keys to navigate options
6. Press Enter to select option

**Expected Results:**
- [ ] Combobox opens with Enter or Arrow Down
- [ ] Arrow keys navigate options
- [ ] Enter selects focused option
- [ ] Escape closes combobox
- [ ] Combobox has `role="combobox"`
- [ ] Options have `role="option"` or `[cmdk-item]` attribute

---

## 9. Drill-Down Sheet Accessibility

### Test 9.1: Sheet Dialog Announcement
**Goal:** Verify drill-down sheet is properly announced to screen readers.

**Steps:**
1. Navigate to Dashboard (`/#/`)
2. Click on a pipeline table row
3. Wait for sheet to open
4. Right-click sheet container > Inspect

**Expected Results:**
- [ ] Sheet has `role="dialog"` attribute
- [ ] Sheet has `aria-modal="true"` attribute
- [ ] Sheet has `aria-labelledby` or `aria-label` with descriptive title
- [ ] Focus moves into dialog when it opens

---

### Test 9.2: Focus Trap in Sheet
**Goal:** Verify focus is trapped within open sheet.

**Steps:**
1. Navigate to Dashboard (`/#/`)
2. Open a pipeline drill-down sheet
3. Press Tab repeatedly (10+ times)
4. Track whether focus leaves the sheet

**Expected Results:**
- [ ] Focus cycles within sheet only
- [ ] Focus never escapes to background
- [ ] Tab order is logical within sheet
- [ ] Shift+Tab reverses correctly

---

### Test 9.3: Sheet Keyboard Close
**Goal:** Verify sheet can be closed with keyboard.

**Steps:**
1. Navigate to Dashboard (`/#/`)
2. Open a drill-down sheet
3. Press Escape key

**Expected Results:**
- [ ] Sheet closes immediately
- [ ] Focus returns to trigger (table row or button that opened sheet)
- [ ] No console errors

---

## 10. Automated Testing Tools

### Recommended Tools

**Browser Extensions:**
- **axe DevTools** (Chrome, Edge, Firefox) - Comprehensive WCAG testing
- **WAVE** (Web Accessibility Evaluation Tool) - Visual feedback on accessibility issues
- **Accessibility Insights for Web** - Microsoft's accessibility testing tool
- **HeadingsMap** - Visualize heading hierarchy
- **WCAG Color Contrast Checker** - Quick contrast checks

**Screen Readers:**
- **NVDA** (Windows, free) - Most popular Windows screen reader
- **JAWS** (Windows, paid) - Industry standard for Windows
- **VoiceOver** (macOS, built-in) - Press Cmd+F5 to enable
- **TalkBack** (Android, built-in) - Mobile screen reader

**Command-Line Tools:**
- **axe-core** via NPM: `npm install -g axe-core`
- Run in browser console:
  ```javascript
  axe.run().then(results => {
    console.log(results.violations);
  });
  ```

---

## 11. WCAG 2.1 AA Criteria Quick Reference

### Level A Criteria (Must Pass)

| Criterion | Description | How to Test |
|-----------|-------------|-------------|
| 1.1.1 Non-text Content | Images have alt text | Check `<img alt="">`, decorative icons `aria-hidden="true"` |
| 1.3.1 Info and Relationships | Semantic HTML, ARIA | Run axe-core, verify `<table>`, `<th>`, `<label>`, ARIA |
| 1.3.2 Meaningful Sequence | Logical reading order | Tab through page, verify order makes sense |
| 2.1.1 Keyboard | All functionality via keyboard | Use only keyboard to navigate entire app |
| 2.1.2 No Keyboard Trap | Can escape all components | Tab through, verify no traps |
| 2.4.1 Bypass Blocks | Skip navigation links | Check for skip links (may not apply to SPA) |
| 3.3.1 Error Identification | Errors clearly identified | Trigger validation, verify errors are visible |
| 3.3.2 Labels or Instructions | Inputs have labels | Run axe-core label rule |
| 4.1.1 Parsing | Valid HTML | Run HTML validator |
| 4.1.2 Name, Role, Value | ARIA attributes correct | Run axe-core ARIA rules |

### Level AA Criteria (Must Pass)

| Criterion | Description | How to Test |
|-----------|-------------|-------------|
| 1.4.3 Contrast (Minimum) | 4.5:1 text, 3:1 large text | Run axe-core color-contrast rule |
| 1.4.4 Resize Text | Text scalable to 200% | Zoom browser to 200%, verify usability |
| 2.4.3 Focus Order | Focus order is logical | Tab through page, verify logical order |
| 2.4.6 Headings and Labels | Descriptive headings/labels | Check heading hierarchy, label text |
| 2.4.7 Focus Visible | Focus indicator visible | Tab to elements, verify visible ring |
| 3.2.1 On Focus | No context change on focus | Tab to elements, verify no auto-submit/redirect |
| 3.2.2 On Input | No unexpected context change | Fill inputs, verify no auto-submit |
| 4.1.3 Status Messages | Live regions announce | Check `role="alert"`, `aria-live` |

### WCAG 2.1 New Criteria (Level AA)

| Criterion | Description | How to Test |
|-----------|-------------|-------------|
| 1.4.10 Reflow | Content reflows at 320px | Resize browser to 320px width, verify no horizontal scroll |
| 1.4.11 Non-text Contrast | 3:1 for UI components | Check button borders, focus indicators |
| 1.4.12 Text Spacing | Text readable with increased spacing | Apply text spacing bookmarklet, verify readability |
| 1.4.13 Content on Hover/Focus | Hoverable, dismissible, persistent | Hover over tooltips, verify dismissible with Escape |
| 2.5.1 Pointer Gestures | All gestures have single-pointer alternative | Check for swipe/drag gestures, verify click alternatives |
| 2.5.2 Pointer Cancellation | Click/tap completion on up-event | Click buttons, verify action on mouse-up not mouse-down |
| 2.5.3 Label in Name | Accessible name contains visible text | Check icon buttons have `aria-label` matching visible text |
| 2.5.4 Motion Actuation | No motion-only input | Verify no shake-to-undo or tilt controls |

---

## 12. Testing Checklist Summary

### Pre-Test Setup
- [ ] Install axe DevTools browser extension
- [ ] Install WAVE extension (optional)
- [ ] Enable screen reader (NVDA or VoiceOver) for specific tests
- [ ] Clear browser cache and cookies
- [ ] Use test user credentials from `tests/e2e/.auth/user.json` logic

### Dashboard V3 Tests
- [ ] Full page axe-core scan (Test 1.1)
- [ ] Post-load accessibility (Test 1.2)
- [ ] Tab navigation (Test 2.1)
- [ ] Escape key closes dialogs (Test 2.2)
- [ ] Focus trap in dialogs (Test 2.3)
- [ ] Focus return after close (Test 2.4)
- [ ] Heading hierarchy (Test 3.1)
- [ ] ARIA attributes validity (Test 3.2)
- [ ] Table semantic structure (Test 3.4)
- [ ] Focus visible (Test 4.1)
- [ ] Focus ring standards (Test 4.2)
- [ ] Text color contrast (Test 5.1)
- [ ] Semantic colors (Test 5.2)
- [ ] Pipeline row accessibility (Test 8.1)
- [ ] Task checkboxes (Test 8.2)
- [ ] Touch targets (Test 7.1)

### Form Accessibility Tests
- [ ] Label-input connection (Test 6.1)
- [ ] Error message association (Test 6.2)
- [ ] Error announcement (Test 6.3)
- [ ] Form input labels (Test 6.4)
- [ ] Focus indicators on inputs (Test 6.5)
- [ ] Keyboard navigation on forms (Test 6.6)
- [ ] Combobox keyboard navigation (Test 8.6)

### List Page Tests
- [ ] Opportunities page axe scan
- [ ] Contacts page axe scan

### Known Issues and Skips
- [ ] Document any violations found with severity and affected elements
- [ ] File issues for any critical/serious violations
- [ ] Note incomplete rules that need manual review

---

## 13. Reporting Accessibility Issues

When reporting accessibility violations, include:

1. **WCAG Criterion:** Which rule was violated (e.g., 1.4.3 Contrast Minimum)
2. **Severity:** Critical, Serious, Moderate, Minor
3. **Page/Component:** Where the issue occurs
4. **Element:** Specific HTML element or component
5. **Current Behavior:** What's wrong
6. **Expected Behavior:** What should happen
7. **Steps to Reproduce:** How to trigger the issue
8. **Screenshot/Code:** Visual or code example

**Example Issue:**
```
WCAG 2.1 AA Violation: 1.4.3 Contrast (Minimum)

Severity: Serious
Page: Dashboard - My Tasks panel
Element: Task description text in "Today" section
Current: Text color has 3.2:1 contrast ratio (fails 4.5:1 requirement)
Expected: Text should have at least 4.5:1 contrast for readability
Steps:
  1. Navigate to Dashboard
  2. View "Today" tasks
  3. Inspect task description text color
Screenshot: [attached]
Affected CSS: .task-description { color: #7E8A9D; }
Fix: Use text-foreground token instead of hardcoded color
```

---

## Production Safety

**All accessibility tests are safe for production environments** - they are read-only inspections and do not modify any data.

**Tests Safe for Production (Read-Only):**
| Test Category | Safe for Production | Notes |
|--------------|---------------------|-------|
| 1. Automated axe-core Scans | Yes | Read-only DOM analysis |
| 2. Keyboard Navigation | Yes | Read-only navigation (do not save forms) |
| 3. Semantic HTML | Yes | Read-only inspection |
| 4. Dynamic Content | Yes | Read-only observation |
| 5. Color Accessibility | Yes | Read-only inspection |
| 6. Form Accessibility | Partial | View forms but do not submit |
| 7. Touch Target Size | Yes | Read-only measurement |
| 8. Advanced ARIA | Yes | Read-only inspection |
| 9. Screen Reader | Yes | Read-only with screen reader |
| 10. Recommended Tools | Yes | Read-only scanning |

**Caution for Production:**
- Test 6.2 (Error Message Association) requires triggering validation errors - click Cancel after testing to avoid saving
- Test 8.5-8.6 (Combobox Navigation) - only navigate, do not select and save values

**Recommendation:** All accessibility tests can be run on production safely as they only observe and inspect the UI without modifying data.
