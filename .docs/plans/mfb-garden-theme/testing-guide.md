# MFB "Garden to Table" Theme Testing Guide

**Project**: Atomic CRM Color System Migration
**Purpose**: Comprehensive testing procedures to validate theme migration quality
**Scope**: Visual regression, accessibility, performance, cross-browser compatibility

---

## Table of Contents

1. [Testing Overview](#testing-overview)
2. [Pre-Testing Setup](#pre-testing-setup)
3. [Visual Regression Testing](#visual-regression-testing)
4. [Accessibility Testing](#accessibility-testing)
5. [Color Contrast Validation](#color-contrast-validation)
6. [Component Testing](#component-testing)
7. [Dark Mode Testing](#dark-mode-testing)
8. [Browser Compatibility](#browser-compatibility)
9. [Performance Testing](#performance-testing)
10. [Automated Test Updates](#automated-test-updates)
11. [User Acceptance Testing](#user-acceptance-testing)
12. [Bug Reporting](#bug-reporting)

---

## 1. Testing Overview

### 1.1 Testing Goals
- ✅ Verify all color tokens render correctly in OKLCH format
- ✅ Ensure WCAG AA compliance (4.5:1 text, 3:1 interactive)
- ✅ Validate visual consistency across all pages
- ✅ Confirm dark mode works seamlessly
- ✅ Verify no regressions in existing functionality
- ✅ Ensure cross-browser compatibility

### 1.2 Testing Phases
1. **Phase 1**: Automated validation (color scripts, linting, builds)
2. **Phase 2**: Visual regression (screenshot comparison)
3. **Phase 3**: Accessibility audits (axe, Lighthouse, manual)
4. **Phase 4**: Interactive testing (forms, navigation, data entry)
5. **Phase 5**: Browser/device testing
6. **Phase 6**: Performance benchmarking
7. **Phase 7**: User acceptance testing

### 1.3 Success Criteria
- ✅ Zero color contrast violations (WCAG AA)
- ✅ All automated tests pass
- ✅ Lighthouse Accessibility score ≥ 95
- ✅ Lighthouse Performance score ≥ 90
- ✅ No visual regressions on critical user paths
- ✅ Dark mode toggle works without flicker
- ✅ Charts render correctly in all browsers

---

## 2. Pre-Testing Setup

### 2.1 Install Testing Tools

```bash
# Browser extensions
# - axe DevTools (Chrome/Firefox)
# - WAVE Accessibility (Chrome/Firefox)
# - Lighthouse (built into Chrome DevTools)

# Node packages (if not already installed)
npm install --save-dev @axe-core/cli
npm install --save-dev pa11y
npm install --save-dev backstopjs  # Visual regression
```

### 2.2 Prepare Test Environment

#### A. Create Test Data
```bash
# Ensure you have sample data
npm run seed:data:clean

# Verify data exists
# - At least 20 contacts
# - At least 10 organizations
# - At least 15 opportunities
# - At least 5 tasks
```

#### B. Start Development Server
```bash
npm run dev
# Server should run on http://localhost:5173
```

#### C. Start Supabase (if using local)
```bash
npm run supabase:local:start
npm run supabase:local:status  # Verify it's running
```

### 2.3 Create Screenshot Baseline

Before starting migration, capture baseline screenshots:

```bash
# Manual screenshot locations
screenshots/
  baseline/
    light-mode/
      login.png
      dashboard.png
      contacts-list.png
      contact-detail.png
      opportunity-kanban.png
      create-contact-form.png
      sidebar-nav.png
    dark-mode/
      (repeat all above)
```

**Tools**:
- Manual: Use browser built-in screenshot (Cmd+Shift+4 on Mac, Snipping Tool on Windows)
- Automated: Use BackstopJS (see Section 3.3)

---

## 3. Visual Regression Testing

### 3.1 Manual Screenshot Comparison

#### A. Capture Post-Migration Screenshots
After each migration phase, capture screenshots in the same locations:

```bash
screenshots/
  post-migration/
    phase-1-core-colors/
    phase-2-typography/
    phase-3-components/
    ...
```

#### B. Side-by-Side Comparison
1. Open baseline and post-migration screenshots side-by-side
2. Check for:
   - Background color changes (expected: white → warm cream)
   - Text readability (no washed out text)
   - Button colors (expected: brand-green → MFB lime green)
   - Card shadows (expected: more prominent)
   - Rounded corners (expected: more rounded)

### 3.2 Critical Pages to Screenshot

#### Light Mode
- [ ] **Login Page** (`/`)
  - Focus: Background, form styling, button hover
- [ ] **Dashboard** (`/dashboard`)
  - Focus: Charts, cards, sidebar, overall layout
- [ ] **Contacts List** (`/contacts`)
  - Focus: Table rows, tags, action buttons
- [ ] **Contact Detail** (`/contacts/1`)
  - Focus: Header, tabs, activity timeline
- [ ] **Contact Create Form** (`/contacts/create`)
  - Focus: Input fields, validation errors, submit button
- [ ] **Opportunities Kanban** (`/opportunities`)
  - Focus: Column colors, card styling, drag feedback
- [ ] **Organizations List** (`/organizations`)
  - Focus: Consistent with contacts styling
- [ ] **Task List** (`/tasks`)
  - Focus: Priority indicators, due date colors

#### Dark Mode
- [ ] Repeat all above pages with dark mode enabled

### 3.3 Automated Visual Regression (BackstopJS)

#### A. Configure BackstopJS
Create `backstop.config.js`:

```javascript
module.exports = {
  id: 'mfb_theme_migration',
  viewports: [
    { label: 'desktop', width: 1920, height: 1080 },
    { label: 'tablet', width: 768, height: 1024 },
    { label: 'mobile', width: 375, height: 667 }
  ],
  scenarios: [
    {
      label: 'Login',
      url: 'http://localhost:5173/',
      selectors: ['document']
    },
    {
      label: 'Dashboard',
      url: 'http://localhost:5173/dashboard',
      selectors: ['document']
    },
    {
      label: 'Contacts List',
      url: 'http://localhost:5173/contacts',
      selectors: ['document']
    },
    {
      label: 'Contact Detail',
      url: 'http://localhost:5173/contacts/1',
      selectors: ['document']
    },
    {
      label: 'Create Contact Form',
      url: 'http://localhost:5173/contacts/create',
      selectors: ['document']
    },
    {
      label: 'Opportunities Kanban',
      url: 'http://localhost:5173/opportunities',
      selectors: ['document']
    }
  ],
  paths: {
    bitmaps_reference: 'backstop_data/bitmaps_reference',
    bitmaps_test: 'backstop_data/bitmaps_test',
    html_report: 'backstop_data/html_report',
    ci_report: 'backstop_data/ci_report'
  },
  report: ['browser'],
  engine: 'puppeteer',
  engineOptions: {
    args: ['--no-sandbox']
  },
  asyncCaptureLimit: 5,
  asyncCompareLimit: 50,
  debug: false,
  debugWindow: false
}
```

#### B. Run Visual Regression Tests

```bash
# 1. Create baseline (BEFORE migration)
npx backstop reference

# 2. After migration, run comparison
npx backstop test

# 3. Review report
# Opens in browser automatically, showing side-by-side diffs

# 4. Approve changes (if intentional)
npx backstop approve
```

---

## 4. Accessibility Testing

### 4.1 Automated Accessibility Audits

#### A. Lighthouse (Chrome DevTools)
1. Open Chrome DevTools (F12)
2. Navigate to "Lighthouse" tab
3. Select:
   - ✅ Accessibility
   - ✅ Best Practices
   - ✅ Performance
4. Click "Analyze page load"
5. Review report:
   - **Target**: Accessibility ≥ 95
   - Common issues: Color contrast, missing alt text, ARIA labels

**Pages to audit**:
- [ ] Login
- [ ] Dashboard
- [ ] Contacts List
- [ ] Contact Detail
- [ ] Create Contact Form
- [ ] Opportunities Kanban

#### B. axe DevTools Extension
1. Install: [axe DevTools](https://chrome.google.com/webstore/detail/axe-devtools-web-accessib/lhdoppojpmngadmnindnejefpokejbdd)
2. Open DevTools → "axe DevTools" tab
3. Click "Scan ALL of my page"
4. Review violations:
   - **Critical**: Must fix before deployment
   - **Serious**: Should fix
   - **Moderate**: Nice to fix
   - **Minor**: Low priority

**Expected violations to fix**:
- Color contrast failures (especially on warm cream background)
- Missing focus indicators
- Insufficient button labels

#### C. WAVE Extension
1. Install: [WAVE](https://wave.webaim.org/extension/)
2. Click WAVE icon in toolbar
3. Review:
   - **Errors** (red): Must fix
   - **Alerts** (yellow): Review carefully
   - **Contrast errors**: Check all instances

#### D. pa11y CLI (Automated)
```bash
# Install
npm install --save-dev pa11y

# Run on all pages
npx pa11y http://localhost:5173/
npx pa11y http://localhost:5173/dashboard
npx pa11y http://localhost:5173/contacts
npx pa11y http://localhost:5173/contacts/1
npx pa11y http://localhost:5173/contacts/create
npx pa11y http://localhost:5173/opportunities

# Save results
npx pa11y http://localhost:5173/ > pa11y-results.txt
```

### 4.2 Keyboard Navigation Testing

#### A. Tab Order
Test keyboard navigation without mouse:
1. Start on Login page
2. Press Tab repeatedly
3. Verify:
   - [ ] All interactive elements are reachable
   - [ ] Focus indicator is visible (should use brand color ring)
   - [ ] Tab order is logical (top-to-bottom, left-to-right)
   - [ ] No focus traps (can escape modals with Esc)

#### B. Keyboard Shortcuts
Test all interactive elements:
- [ ] **Enter**: Submits forms, activates buttons
- [ ] **Space**: Toggles checkboxes, activates buttons
- [ ] **Escape**: Closes modals/dialogs
- [ ] **Arrow keys**: Navigate within components (tables, selects)

#### C. Skip Links
- [ ] Verify "Skip to main content" link exists
- [ ] Verify it's visible on focus
- [ ] Verify it jumps to main content

### 4.3 Screen Reader Testing

#### A. Test with NVDA (Windows) or VoiceOver (Mac)

**NVDA Setup** (Windows):
1. Download: [NVDA](https://www.nvaccess.org/download/)
2. Install and launch
3. Navigate to app in browser

**VoiceOver Setup** (Mac):
1. Enable: System Preferences → Accessibility → VoiceOver
2. Toggle: Cmd+F5
3. Navigate to app in browser

#### B. Screen Reader Checklist
- [ ] Page title is announced correctly
- [ ] Headings are hierarchical (h1 → h2 → h3)
- [ ] Landmark regions are announced (nav, main, aside)
- [ ] Buttons have descriptive labels (not just "Click here")
- [ ] Form inputs have associated labels
- [ ] Error messages are announced
- [ ] Success messages are announced
- [ ] Charts have text alternatives (data tables)

#### C. ARIA Attributes
Verify critical ARIA usage:
- [ ] `aria-label` on icon-only buttons
- [ ] `aria-labelledby` on form sections
- [ ] `aria-live` regions for dynamic updates (notifications)
- [ ] `aria-current="page"` on active nav items
- [ ] `aria-expanded` on collapsible sections

---

## 5. Color Contrast Validation

### 5.1 Manual Contrast Checking

#### A. WebAIM Contrast Checker
1. Open: [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
2. Test critical color combinations:

**Text on Warm Cream Background**:
- [ ] Body text (#1F2937 / --foreground) on cream (#FEFEF9)
  - Expected ratio: ≥ 4.5:1 (WCAG AA)
- [ ] Headings (--neutral-900) on cream
  - Expected ratio: ≥ 4.5:1
- [ ] Subtle text (--neutral-600) on cream
  - Expected ratio: ≥ 4.5:1

**Interactive Elements**:
- [ ] MFB green button (#7CB342) text (white) on button bg
  - Expected ratio: ≥ 4.5:1
- [ ] Warning yellow (#FBBF24) text on warning bg
  - Expected ratio: ≥ 4.5:1 (or darken to pass)
- [ ] Link color (--brand-700) on cream
  - Expected ratio: ≥ 4.5:1

**Chart Labels**:
- [ ] Chart-1-label (#5D4A2F) on cream
  - Expected ratio: ≥ 4.5:1
- [ ] Chart-2-label (#2F6A1F) on cream
  - Expected ratio: ≥ 4.5:1
- [ ] (Test all 8 chart label colors)

### 5.2 Automated Contrast Validation

#### A. Color Contrast Analyzer (CCA)
1. Download: [CCA](https://www.tpgi.com/color-contrast-checker/)
2. Use eyedropper tool to sample colors from live app
3. Verify all combinations pass WCAG AA

#### B. Browser DevTools Contrast Info
1. Open Chrome DevTools
2. Inspect text element
3. Look for contrast ratio info in Styles panel
4. Chrome will show ✅ or ❌ for WCAG compliance

### 5.3 Known Contrast Issues to Fix

Based on initial MFB color palette analysis, these colors need adjustment:

- [ ] **Primary green button on cream**: Originally failed (2.48:1)
  - **Fix**: Darken to --brand-700 (56% lightness) → should pass (≥3:1)

- [ ] **Warning yellow on cream**: Originally failed (1.65:1)
  - **Fix**: Darken to oklch(68% 0.140 85) → should pass (≥4.5:1)

- [ ] **Subtle text (--neutral-500)**: May fail on cream
  - **Fix**: Use --neutral-600 or darker for body text

---

## 6. Component Testing

### 6.1 Button Component

#### A. Visual States
- [ ] **Default**: MFB green background, white text, rounded-lg corners
- [ ] **Hover**: Subtle scale (1.02x), smooth transition (200ms)
- [ ] **Focus**: Visible focus ring with brand color
- [ ] **Active**: Slightly darker green
- [ ] **Disabled**: Muted colors, no pointer events

#### B. Variants
- [ ] **Primary**: Green background, white text
- [ ] **Secondary**: Outline style, green border, green text
- [ ] **Destructive**: Red/clay background, white text
- [ ] **Ghost**: Transparent background, green text on hover

#### C. Sizes
- [ ] **Small** (sm): Compact padding, smaller text
- [ ] **Medium** (default): Standard size
- [ ] **Large** (lg): More padding, larger text

### 6.2 Card Component

#### A. Visual States
- [ ] **Default**: White background, subtle shadow-md, rounded-xl corners
- [ ] **Hover**: Elevated shadow-lg, smooth transition (200ms)
- [ ] **Focus**: Focus ring on interactive cards

#### B. Content
- [ ] Header styled correctly (uses --card-foreground)
- [ ] Body text readable (uses --foreground)
- [ ] Footer separated with subtle border

### 6.3 Form Input Component

#### A. Visual States
- [ ] **Default**: White background, rounded-lg border, --border color
- [ ] **Focus**: Brand color ring, outline visible
- [ ] **Error**: Red border, error message below in red text
- [ ] **Disabled**: Muted background, no interaction

#### B. Input Types
- [ ] **Text**: Standard input
- [ ] **Email**: Email validation
- [ ] **Select**: Dropdown with brand color on selected option
- [ ] **Textarea**: Multi-line, same styling as text input
- [ ] **Checkbox**: Brand green checkmark
- [ ] **Radio**: Brand green selection

### 6.4 Tag/Badge Component

#### A. New Tag Colors
Test all 13 tag colors render correctly:
- [ ] **Gray** (neutral)
- [ ] **Blue** (cool accent)
- [ ] **Green** (success)
- [ ] **Red** (danger)
- [ ] **Yellow** (warning)
- [ ] **Purple** (misc)
- [ ] **Terracotta** (NEW)
- [ ] **Sage** (NEW)
- [ ] **Olive** (NEW)
- [ ] **Amber** (NEW)
- [ ] **Teal** (NEW)
- [ ] **Eggplant** (NEW)
- [ ] **Mushroom** (NEW)

#### B. Tag States
- [ ] Text is readable (contrast ≥ 4.5:1)
- [ ] Background is subtle
- [ ] Border is visible but not harsh
- [ ] Hover state shows slight darkening

### 6.5 Navigation Component

#### A. Sidebar
- [ ] Background has warm cream tint (--sage-tint or custom)
- [ ] Active item highlighted with brand green
- [ ] Hover state shows feedback
- [ ] Icons are visible and aligned

#### B. Top Navigation
- [ ] Logo is visible and clear
- [ ] User menu is styled correctly
- [ ] Notification badge uses brand color

### 6.6 Modal/Dialog Component

- [ ] Overlay is semi-transparent (dim background)
- [ ] Modal content is centered
- [ ] Close button is visible and accessible
- [ ] Focus trapped within modal
- [ ] Escape key closes modal
- [ ] Rounded-xl corners

---

## 7. Dark Mode Testing

### 7.1 Toggle Functionality

- [ ] **Toggle exists**: Find theme toggle button (sun/moon icon)
- [ ] **Persists**: Reload page, dark mode should persist
- [ ] **No flicker**: Switching modes should be instant, no flash of wrong theme
- [ ] **System preference**: Respects `prefers-color-scheme` on first load

### 7.2 Dark Mode Visual Checks

#### A. Background & Foreground
- [ ] Background is dark warm gray (not pure black)
- [ ] Text is light warm gray (not pure white)
- [ ] Contrast is comfortable for extended reading

#### B. Components
- [ ] **Buttons**: Slightly desaturated colors, still visible
- [ ] **Cards**: Dark background with subtle border
- [ ] **Inputs**: Dark background, light text, visible borders
- [ ] **Sidebar**: Darker than main content, warm tint preserved

#### C. Charts
- [ ] All chart colors are visible on dark background
- [ ] Chart labels are readable (light text)
- [ ] Fill and stroke colors distinguishable

#### D. Semantic Colors
- [ ] **Success** (green): Lighter and less saturated
- [ ] **Warning** (yellow): Lighter, still distinguishable
- [ ] **Danger** (red): Lighter, still indicates urgency
- [ ] **Info** (teal): Visible on dark background

### 7.3 Dark Mode Accessibility

- [ ] Run Lighthouse audit in dark mode (Accessibility ≥ 95)
- [ ] Run axe DevTools in dark mode (no critical violations)
- [ ] Check contrast ratios:
  - [ ] Body text on dark background: ≥ 4.5:1
  - [ ] Button text on button background: ≥ 4.5:1
  - [ ] Chart labels on chart background: ≥ 4.5:1

---

## 8. Browser Compatibility

### 8.1 OKLCH Browser Support

**Support**:
- Chrome/Edge 111+ ✅
- Firefox 113+ ✅
- Safari 15.4+ ✅

**Fallback Strategy**:
If targeting older browsers, add hex fallbacks:
```css
/* Fallback for old browsers */
--brand-500: #7CB342;
--brand-500: oklch(72% 0.132 100);
```

### 8.2 Browser Testing Matrix

#### A. Desktop Browsers
- [ ] **Chrome** (latest)
  - [ ] OKLCH colors render correctly
  - [ ] No console errors
  - [ ] Performance is smooth

- [ ] **Firefox** (latest)
  - [ ] OKLCH colors render correctly
  - [ ] Charts render correctly
  - [ ] No visual bugs

- [ ] **Safari** (latest, if Mac available)
  - [ ] OKLCH colors render correctly
  - [ ] Font loading works correctly
  - [ ] No rendering issues

- [ ] **Edge** (latest)
  - [ ] Same as Chrome (Chromium-based)

#### B. Mobile Browsers
- [ ] **Chrome Mobile** (Android)
  - [ ] Responsive layout works
  - [ ] Touch interactions smooth
  - [ ] Colors render correctly

- [ ] **Safari Mobile** (iOS)
  - [ ] Responsive layout works
  - [ ] Touch interactions smooth
  - [ ] Colors render correctly

### 8.3 Cross-Browser Issues to Watch For

- **Font rendering**: Nunito may render differently on Windows vs Mac
- **Shadow rendering**: Some browsers handle box-shadow differently
- **OKLCH fallback**: Test on Safari 15.3 or earlier (if accessible) to verify fallbacks

---

## 9. Performance Testing

### 9.1 Lighthouse Performance Audit

1. Open Chrome DevTools → Lighthouse
2. Select "Performance" + "Desktop" + "Clear storage"
3. Click "Analyze page load"
4. Review metrics:
   - [ ] **FCP** (First Contentful Paint): ≤ 1.8s (green)
   - [ ] **LCP** (Largest Contentful Paint): ≤ 2.5s (green)
   - [ ] **TBT** (Total Blocking Time): ≤ 200ms (green)
   - [ ] **CLS** (Cumulative Layout Shift): ≤ 0.1 (green)
   - [ ] **Speed Index**: ≤ 3.4s (green)

**Target**: Performance Score ≥ 90

### 9.2 Network Performance

#### A. Font Loading
1. Open DevTools → Network tab
2. Filter: "Font"
3. Check Nunito loads:
   - [ ] Nunito-Regular.woff2 (priority: high)
   - [ ] Nunito-Bold.woff2
   - [ ] Total font weight ≤ 200KB
   - [ ] `font-display: swap` prevents FOIT (flash of invisible text)

#### B. CSS Bundle Size
1. Open DevTools → Network tab
2. Filter: "CSS"
3. Check bundle sizes:
   - [ ] main.css ≤ 150KB (gzipped ≤ 30KB)
   - [ ] No unused CSS (use Coverage tool in DevTools)

### 9.3 Runtime Performance

#### A. Paint Performance
1. Open DevTools → Performance tab
2. Click "Record" and interact with app (scroll, click, navigate)
3. Stop recording
4. Check for:
   - [ ] Smooth 60 FPS scrolling
   - [ ] No long tasks (>50ms)
   - [ ] No layout thrashing (repeated layout/paint cycles)

#### B. Memory Leaks
1. Open DevTools → Memory tab
2. Take heap snapshot
3. Navigate around app (10+ pages)
4. Take another heap snapshot
5. Check for:
   - [ ] No significant memory growth (should be ≤ 20% increase)
   - [ ] No detached DOM nodes

---

## 10. Automated Test Updates

### 10.1 Unit Test Updates

#### A. Snapshot Tests
If you have snapshot tests (e.g., with Jest), they will fail due to color changes:

```bash
npm test

# Review failing snapshots
# If changes are intentional, update snapshots:
npm test -- -u
```

#### B. Component Tests
Update tests that assert on specific styles:

**Before**:
```typescript
expect(button).toHaveStyle({ backgroundColor: 'oklch(74% 0.12 125)' })
```

**After**:
```typescript
expect(button).toHaveStyle({ backgroundColor: 'oklch(72% 0.132 100)' })
```

#### C. Accessibility Tests
If using `jest-axe` or `vitest-axe`:

```typescript
import { axe } from 'vitest-axe'

it('should have no accessibility violations', async () => {
  const { container } = render(<ContactList />)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

### 10.2 E2E Test Updates

If using Playwright or Cypress, update visual tests:

#### A. Playwright Visual Regression
```typescript
// tests/e2e/visual-regression.spec.ts
import { test, expect } from '@playwright/test'

test('dashboard matches screenshot', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page).toHaveScreenshot('dashboard.png')
})
```

**Update baseline**:
```bash
npx playwright test --update-snapshots
```

#### B. Cypress Component Tests
```typescript
// cypress/component/Button.cy.tsx
describe('Button', () => {
  it('should render with MFB green background', () => {
    cy.mount(<Button>Click Me</Button>)
    cy.get('button').should('have.css', 'background-color', 'oklch(72% 0.132 100)')
  })
})
```

---

## 11. User Acceptance Testing (UAT)

### 11.1 UAT Test Scenarios

#### Scenario 1: Daily Workflow - Contact Management
**Persona**: Sales Rep

1. **Login**
   - [ ] Background is warm cream (not stark white)
   - [ ] Button uses MFB green
   - [ ] No visual glitches

2. **View Dashboard**
   - [ ] Charts use earth-tone colors
   - [ ] Cards have subtle shadows
   - [ ] All text is readable

3. **Search for Contact**
   - [ ] Search input has rounded corners
   - [ ] Autocomplete dropdown styled correctly
   - [ ] Hover states work

4. **View Contact Detail**
   - [ ] Tags use new warm colors
   - [ ] Activity timeline is readable
   - [ ] Related records section is clear

5. **Edit Contact**
   - [ ] Form inputs have rounded corners
   - [ ] Validation errors are visible (red text)
   - [ ] Save button is prominent (green)

6. **Add Note**
   - [ ] Textarea has rounded corners
   - [ ] Character count is visible
   - [ ] Save button changes on hover

#### Scenario 2: Pipeline Management
**Persona**: Sales Manager

1. **View Opportunities Kanban**
   - [ ] Columns have semantic stage colors
   - [ ] Cards have subtle shadows
   - [ ] Drag-and-drop feedback is clear

2. **Create New Opportunity**
   - [ ] Form is styled consistently
   - [ ] Select dropdowns use brand colors
   - [ ] Submit button is prominent

3. **Move Opportunity**
   - [ ] Drag feedback uses brand color
   - [ ] Drop zones are highlighted
   - [ ] Animation is smooth

#### Scenario 3: Reporting & Analytics
**Persona**: Business Analyst

1. **View Reports**
   - [ ] Charts use consistent earth-tone palette
   - [ ] Chart legends are readable
   - [ ] Export button is styled correctly

2. **Filter Data**
   - [ ] Filter chips use warm tag colors
   - [ ] Active filters are highlighted
   - [ ] Clear filters button is visible

3. **Export Data**
   - [ ] Export modal is styled correctly
   - [ ] Loading state uses brand color
   - [ ] Success message is prominent

### 11.2 UAT Feedback Collection

Create a feedback form for UAT testers:

**Questions**:
1. Does the warm cream background feel natural for a food industry CRM? (1-5)
2. Are the colors appropriate for the agricultural/food broker context? (1-5)
3. Is text readable on all backgrounds? (Yes/No + comments)
4. Do the charts feel cohesive with the overall design? (1-5)
5. Are the hover effects and transitions smooth? (Yes/No + comments)
6. Does dark mode feel comfortable to use? (1-5)
7. Any colors or UI elements that feel "off"? (Open text)
8. Overall theme rating (1-5)

---

## 12. Bug Reporting

### 12.1 Bug Report Template

When you find an issue during testing, create a bug report with this template:

```markdown
## Bug Title
[Clear, concise description]

## Priority
- [ ] Critical (blocks deployment)
- [ ] High (major usability issue)
- [ ] Medium (minor issue)
- [ ] Low (cosmetic)

## Description
[Detailed description of the issue]

## Steps to Reproduce
1. Navigate to [URL]
2. Click [element]
3. Observe [issue]

## Expected Behavior
[What should happen]

## Actual Behavior
[What actually happens]

## Environment
- Browser: [Chrome 120, Firefox 121, etc.]
- OS: [Windows 11, macOS Sonoma, etc.]
- Theme: [Light mode / Dark mode]
- Screen resolution: [1920x1080, etc.]

## Screenshots
[Attach screenshots showing the issue]

## Additional Context
[Any other relevant information]

## Suggested Fix (optional)
[If you have an idea for a fix]
```

### 12.2 Common Issues to Watch For

#### Color-Related Issues
- [ ] Text too light on warm cream background
- [ ] Warning colors fail contrast (yellow on cream)
- [ ] Chart colors too similar (hard to distinguish)
- [ ] Dark mode colors too bright or too dark

#### Layout Issues
- [ ] Sidebar warm tint too prominent (competes with content)
- [ ] Card shadows too harsh
- [ ] Rounded corners inconsistent across components

#### Performance Issues
- [ ] Font loading slow (FOUT - flash of unstyled text)
- [ ] Dark mode toggle flickers
- [ ] Chart rendering slow (especially on Dashboard)

#### Browser-Specific Issues
- [ ] OKLCH fallback not working (Safari <15.4)
- [ ] Nunito font not loading (font-display issue)
- [ ] Hover states not working on mobile (touch devices)

---

## Appendix A: Testing Checklist Summary

### Quick Pre-Deployment Checklist

- [ ] ✅ All automated tests pass (`npm test`)
- [ ] ✅ Build succeeds (`npm run build`)
- [ ] ✅ Linter passes (`npm run lint`)
- [ ] ✅ No console errors in browser
- [ ] ✅ Lighthouse Accessibility ≥ 95
- [ ] ✅ Lighthouse Performance ≥ 90
- [ ] ✅ Zero WCAG AA contrast violations
- [ ] ✅ Dark mode works seamlessly
- [ ] ✅ All critical pages load correctly
- [ ] ✅ Forms validate and submit correctly
- [ ] ✅ Charts render in all tested browsers
- [ ] ✅ UAT feedback collected and reviewed
- [ ] ✅ Critical bugs fixed or documented

---

## Appendix B: Testing Tools Reference

| Tool | Purpose | URL |
|------|---------|-----|
| **Lighthouse** | Performance & Accessibility audit | Built into Chrome DevTools |
| **axe DevTools** | Accessibility testing | [Link](https://www.deque.com/axe/devtools/) |
| **WAVE** | Accessibility evaluation | [Link](https://wave.webaim.org/extension/) |
| **WebAIM Contrast Checker** | Manual contrast validation | [Link](https://webaim.org/resources/contrastchecker/) |
| **Color Contrast Analyzer** | Desktop contrast checker | [Link](https://www.tpgi.com/color-contrast-checker/) |
| **pa11y** | Automated accessibility testing | `npm install --save-dev pa11y` |
| **BackstopJS** | Visual regression testing | `npm install --save-dev backstopjs` |
| **Playwright** | E2E testing with screenshots | [Link](https://playwright.dev) |

---

## Appendix C: WCAG AA Compliance Reference

### Text Contrast Requirements
- **Normal text** (< 24px or < 18px bold): **4.5:1** minimum
- **Large text** (≥ 24px or ≥ 18px bold): **3.0:1** minimum
- **Interactive elements** (buttons, links): **3.0:1** minimum

### Non-Text Contrast Requirements
- **Graphical objects** (icons, charts): **3.0:1** minimum
- **UI components** (borders, focus indicators): **3.0:1** minimum

### Color-Independent
- Information must not be conveyed by color alone
- Always use additional indicators (icons, text, patterns)

---

**Last Updated**: 2025-01-17
**Status**: Ready for use
**Version**: 1.0
