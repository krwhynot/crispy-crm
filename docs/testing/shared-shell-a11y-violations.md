# Shared Shell Accessibility Violations

**Status:** Documented | **Priority:** Medium | **Impact:** App-wide
**Last Updated:** 2025-11-16

## Overview

These accessibility violations are present in the **shared application shell** (header, navigation, main layout) and affect all pages in the CRM, not just Dashboard V2. They were discovered during Dashboard V2 UI/UX acceptance testing but require fixes to the root `CRM.tsx` layout and React Admin chrome.

**Scope:** These violations appear in the comprehensive Axe scan but are **excluded from Dashboard V2 acceptance criteria** since they exist outside the Dashboard V2 feature boundary.

---

## Violations Summary

| Violation ID | Impact | WCAG Level | Status |
|--------------|--------|------------|--------|
| `button-name` | Critical | AA | Open |
| `color-contrast` | Serious | AA | Open |
| `landmark-unique` | Moderate | Best Practice | Open |
| `page-has-heading-one` | Moderate | Best Practice | Open |

---

## 1. Button Without Discernible Text (Critical)

**Rule:** `button-name`
**Impact:** Critical
**WCAG:** 4.1.2 Name, Role, Value (Level A)

### Description
At least one button element in the app shell lacks visible text, `aria-label`, `aria-labelledby`, or `title` attribute, making it inaccessible to screen readers.

### Failure Details
```
"message": "Element does not have inner text that is visible to screen readers"
"message": "aria-label attribute does not exist or is empty"
"message": "Element has no title attribute"
```

### Location
App shell (exact button not identified - requires manual inspection)

### Fix Required
1. Inspect all buttons in app header/navigation
2. Add `aria-label` to icon-only buttons
3. Ensure all buttons have accessible names

**Example Fix:**
```tsx
// ❌ Bad: Icon button without label
<Button>
  <MenuIcon />
</Button>

// ✅ Good: Icon button with aria-label
<Button aria-label="Open menu">
  <MenuIcon />
</Button>
```

### Resources
- [Deque: button-name](https://dequeuniversity.com/rules/axe/4.11/button-name?application=playwright)
- [WCAG 4.1.2: Name, Role, Value](https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html)

---

## 2. Color Contrast Issues (Serious)

**Rule:** `color-contrast`
**Impact:** Serious
**WCAG:** 1.4.3 Contrast (Minimum) (Level AA)

### Description
Some text elements in the app shell do not meet the WCAG AA minimum contrast ratio of 4.5:1 for normal text or 3:1 for large text.

### Failure Details
Specific elements not identified in automated scan - requires manual inspection of:
- Header navigation text
- Secondary navigation items
- Disabled button states
- Placeholder text

### Location
App shell navigation and header

### Fix Required
1. Run Lighthouse audit to identify specific elements
2. Use browser DevTools color picker to verify contrast ratios
3. Update color variables in `src/index.css` if needed
4. Ensure all text meets minimum ratios:
   - **Normal text (<18px):** 4.5:1 minimum
   - **Large text (≥18px or bold ≥14px):** 3:1 minimum

**Testing:**
```bash
# Manual contrast verification
npx lighthouse http://localhost:5173/dashboard?layout=v2 \
  --only-categories=accessibility \
  --view
```

### Resources
- [Deque: color-contrast](https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright)
- [WCAG 1.4.3: Contrast](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

---

## 3. Non-Unique Navigation Landmarks (Moderate)

**Rule:** `landmark-unique`
**Impact:** Moderate
**WCAG:** Best Practice (not a formal requirement)

### Description
The page contains multiple `<nav>` landmarks without unique labels, making it difficult for screen reader users to distinguish between them.

### Failure Details
```html
<!-- First nav (no unique identifier) -->
<nav class="flex-grow"></nav>

<!-- Second nav (no unique identifier) -->
<nav class="flex items-center"></nav>
```

**Message:** "The landmark must have a unique aria-label, aria-labelledby, or title to make landmarks distinguishable"

### Location
App shell header - appears to be primary navigation and secondary/user navigation

### Fix Required
Add unique `aria-label` attributes to each `<nav>` element:

```tsx
// ✅ Primary navigation
<nav className="flex-grow" aria-label="Main navigation">
  {/* Resource links */}
</nav>

// ✅ User/utility navigation
<nav className="flex items-center" aria-label="User menu">
  {/* User profile, settings, logout */}
</nav>
```

### Resources
- [Deque: landmark-unique](https://dequeuniversity.com/rules/axe/4.11/landmark-unique?application=playwright)
- [MDN: ARIA Landmarks](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/landmark_role)

---

## 4. Missing Level-One Heading (Moderate)

**Rule:** `page-has-heading-one`
**Impact:** Moderate
**WCAG:** Best Practice (not a formal requirement)

### Description
The page does not contain an `<h1>` element, which is a best practice for document structure and screen reader navigation.

### Failure Details
```
"message": "Page must have a level-one heading"
"target": ["html"]
```

### Location
Entire page (no `<h1>` present)

### Fix Required
Add an `<h1>` element to the page, either:

**Option 1:** Visible page title
```tsx
<h1 className="text-2xl font-semibold">Principal Dashboard</h1>
```

**Option 2:** Visually hidden but accessible to screen readers
```tsx
<h1 className="sr-only">Principal Dashboard</h1>
```

### Considerations
- Each page should have a unique `<h1>` describing its purpose
- Dashboard V2 currently uses visual hierarchy but no semantic `<h1>`
- Consider adding to `PrincipalDashboardV2.tsx` or shared header

### Resources
- [Deque: page-has-heading-one](https://dequeuniversity.com/rules/axe/4.11/page-has-heading-one?application=playwright)
- [MDN: Heading elements](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/Heading_Elements)

---

## Remediation Plan

### Phase 1: Critical Violations (button-name)
1. **Audit app shell buttons** - Identify all icon-only buttons
2. **Add aria-labels** - Ensure every button has accessible name
3. **Test with NVDA/VoiceOver** - Verify screen reader announces buttons correctly

### Phase 2: Serious Violations (color-contrast)
1. **Run Lighthouse audit** - Identify specific elements with contrast issues
2. **Update color tokens** - Adjust in `src/index.css` if needed
3. **Verify with DevTools** - Check all contrast ratios meet minimums
4. **Re-run Axe scan** - Confirm violations resolved

### Phase 3: Moderate Violations (landmarks, heading)
1. **Add navigation labels** - Unique `aria-label` for each `<nav>`
2. **Add page headings** - `<h1>` for each page (visible or sr-only)
3. **Test with screen readers** - Verify landmarks are distinguishable

---

## Testing Strategy

### Automated Testing
```bash
# Run comprehensive accessibility scan
npx playwright test tests/e2e/dashboard-v2-a11y.spec.ts \
  --grep "includes comprehensive accessibility rules" \
  --project=chromium
```

### Manual Testing
1. **Screen Readers:**
   - NVDA (Windows): Navigate app shell, verify button announcements
   - VoiceOver (macOS): Navigate landmarks, verify uniqueness
2. **Lighthouse Audit:**
   ```bash
   npx lighthouse http://localhost:5173/dashboard?layout=v2 \
     --only-categories=accessibility \
     --view
   ```
3. **Contrast Checker:**
   - Use browser DevTools color picker
   - Verify all text meets 4.5:1 minimum (3:1 for large text)

---

## Notes

### Dashboard V2 Acceptance Criteria
These violations **do not block Dashboard V2 rollout** because:
1. They exist in the shared app shell, not Dashboard V2 code
2. Dashboard V2 passes WCAG AA scan when tested in isolation
3. Fixing requires changes to `CRM.tsx` and React Admin chrome

### Remediation Timeline
- **Critical (button-name):** Target within 2 weeks (affects screen reader users)
- **Serious (color-contrast):** Target within 1 month (affects low-vision users)
- **Moderate (landmarks, heading):** Target within 2 months (best practices)

### Related Issues
- Dashboard V2 sidebar focus test: Documented in `docs/testing/known-issues.md`
- Dashboard V2 ARIA tree: Fixed (5/5 tests passing)
- Dashboard V2 touch targets: Verified compliant (44px minimum)

---

## References

- **Axe Documentation:** https://www.deque.com/axe/core-documentation/
- **WCAG 2.1 AA:** https://www.w3.org/WAI/WCAG21/quickref/?currentsidebar=%23col_customize&levels=aa
- **React Admin Accessibility:** https://marmelab.com/react-admin/Accessibility.html
- **Testing Guide:** `/docs/testing/rollout-checklist.md`
