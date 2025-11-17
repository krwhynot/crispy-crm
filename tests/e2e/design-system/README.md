# Design System E2E Tests

This directory contains Playwright tests for the Unified Design System Rollout Plan.

**Plan Reference:** `docs/plans/2025-11-16-unified-design-system-rollout.md` (lines 1479-1542)

## Test Organization

### Test Files

1. **list-layout.spec.ts** - StandardListLayout validation
   - Filter sidebar (256px width, sticky positioning)
   - Main content area with card container
   - Premium table row hover effects (border reveal, shadow, lift)
   - Layout parity across all 6 resources (Contacts, Organizations, Opportunities, Tasks, Sales, Products)
   - No horizontal scrolling
   - Touch target sizes (44px minimum)

2. **slide-over.spec.ts** - ResourceSlideOver pattern
   - Deep links (?view=123, ?edit=123)
   - Keyboard support (ESC, Tab, Shift+Tab)
   - Focus management (focus trap, focus return)
   - Tab switching
   - URL sync (popstate, pushState, replaceState)
   - Browser back/forward navigation
   - Panel dimensions (40vw, min 480px, max 720px)
   - ARIA attributes

3. **create-form.spec.ts** - Full-page create forms
   - Breadcrumb navigation
   - Form card styling (.create-form-card with shadow-lg)
   - Sticky footer actions (Cancel | Save & Close | Save & Add)
   - Validation (Zod schema errors, inline display)
   - Dirty state confirmation
   - Autosave drafts to localStorage (complex forms)
   - Tab error badges

4. **visual-primitives.spec.ts** - Semantic tokens & styling
   - Semantic color utilities (bg-muted, text-foreground, border-border)
   - Spacing tokens (--spacing-edge-desktop, --spacing-section)
   - Typography scale (text-sm, text-base, text-lg)
   - Interactive states (hover, focus, active)
   - Shadow elevation (shadow-sm, shadow-lg)
   - Border radius consistency (rounded-xl, rounded-lg)
   - Motion-safe transitions (150ms)

### Fixtures

Located in `tests/e2e/support/fixtures/design-system/`:

- **listPage.ts** - List page helpers (filter sidebar, table interactions, layout assertions)
- **slideOver.ts** - Slide-over helpers (URL sync, keyboard support, focus management)
- **createForm.ts** - Create form helpers (breadcrumbs, validation triggers, autosave)

## Running Tests

### All Design System Tests
```bash
npx playwright test tests/e2e/design-system
```

### Individual Specs
```bash
npx playwright test tests/e2e/design-system/list-layout.spec.ts
npx playwright test tests/e2e/design-system/slide-over.spec.ts
npx playwright test tests/e2e/design-system/create-form.spec.ts
npx playwright test tests/e2e/design-system/visual-primitives.spec.ts
```

### Desktop + iPad Projects

Tests run across multiple projects configured in `playwright.config.ts`:

- **chromium** (Desktop: 1920x1080) - Primary target
- **iPad Portrait** (768x1024) - Tablet support
- **iPad Landscape** (1024x768) - Tablet landscape

```bash
# Run on specific project
npx playwright test --project=chromium
npx playwright test --project="iPad Portrait"
```

### Headed Mode (See Browser)
```bash
npx playwright test tests/e2e/design-system --headed
```

### Debug Mode
```bash
npx playwright test tests/e2e/design-system --debug
```

## Test Coverage Map

| Resource | List Layout | Slide-Over | Create Form |
|----------|-------------|------------|-------------|
| Contacts | ✓ | ✓ | ✓ |
| Organizations | ✓ | ✓ | ✓ |
| Opportunities | ✓ (with Kanban detection) | - | - |
| Tasks | ✓ | ✓ | - |
| Sales | ✓ | - | - |
| Products | ✓ | - | - |

## Playwright Skill Compliance

These tests follow the `playwright-e2e-testing` skill requirements:

- ✅ Page Object Models (via fixtures)
- ✅ Semantic selectors only (`getByRole`, `getByLabel`, `getByText`)
- ✅ Console monitoring for diagnostics
- ✅ Condition-based waiting (no arbitrary timeouts except animations)
- ✅ Timestamp-based test data for isolation
- ✅ Focus trap testing
- ✅ Accessibility validation (ARIA attributes)

## Console Error Monitoring

All tests include `consoleMonitor` to capture:
- RLS/Permission errors
- React errors
- Network errors

Errors are attached to test reports for diagnosis.

## Expected Test Count

- **list-layout.spec.ts**: ~30 tests (6 resources × ~5 tests each)
- **slide-over.spec.ts**: ~25 tests (URL sync, keyboard, browser nav, tabs)
- **create-form.spec.ts**: ~20 tests (layout, validation, save actions, responsive)
- **visual-primitives.spec.ts**: ~20 tests (colors, spacing, typography, interactions)

**Total**: ~95 tests across 4 spec files

## Debugging Tips

### Test Failing with "No errors" but Still Fails

Check the console-report attachment in the HTML report:
```bash
npx playwright show-report
```

### Slide-Over Not Opening

- Verify URL contains `?view=` or `?edit=` parameter
- Check that `ResourceSlideOver` component is implemented
- Verify `useSlideOverState` hook is used in the list page

### Hover Effects Not Working

- Ensure `.table-row-premium` class is applied
- Check that `PremiumDatagrid` wrapper is used instead of plain `<Datagrid>`
- Verify CSS utility classes are in `src/index.css`

### Touch Target Too Small

- Check computed bounding box: `box.height` and `box.width`
- Verify `w-11 h-11` (44px) minimum classes
- Test on iPad project to catch smaller targets

## Integration with CI/CD

These tests are designed to run in GitHub Actions:
- Sharded by spec file
- Artifacts include screenshots and trace viewers
- Per-resource failures map to rollout plan sections
- Console error reports attached for failed tests

## Next Steps

1. Run tests locally to verify baseline
2. Add tests for remaining resources (Products Create, Tasks Create, etc.)
3. Add visual regression with Percy or Chromatic
4. Integrate into CI/CD pipeline with shard labeled `design-system`
