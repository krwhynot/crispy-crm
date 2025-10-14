# UI/UX Testing Automation - Parallel Implementation Plan

This plan breaks down the comprehensive UI/UX testing automation implementation into parallel-executable tasks optimized for independent development. The implementation follows a **Foundation First** approach: Component + Visual testing (Days 1-3) provides immediate value and stable foundation, followed by E2E Integration (Days 4-6), with CI/CD incrementally integrated throughout.

**✅ VALIDATED BY:**
- Gemini 2.5 Pro (Zen) - Architectural review and recommendations
- Perplexity (Sonar) - Storybook 8.4 + Tailwind v4 + OKLCH compatibility confirmation
- Independent validation agents - Vitest config, React Admin mocking, Playwright setup

**🔧 KEY IMPROVEMENTS INCORPORATED:**
1. Fixed Vitest `timeout` property name (was `testTimeout` - breaking in 3.2+)
2. Added QueryClient requirement for React Admin component tests
3. Split Task 1.10 into 3 parallel sub-tasks (1.10a, 1.10b, 1.10c) for better parallelization
4. Updated auth pattern from global JSON to per-test-file fixtures (prevents session expiry)
5. Added explicit foreign key deletion order (DELETION_ORDER constant)
6. Enhanced OKLCH color validation checklist (42 colors × 2 themes)
7. Confirmed Tailwind v4 @theme syntax works via viteFinal config merging

## High-Level Overview

**Goal**: Implement comprehensive automated UI/UX testing with three layers:
1. **Component Integration Tests** (Vitest + React Testing Library) - Test React Admin forms/lists in isolation
2. **Visual Regression Tests** (Storybook + Chromatic) - Catch CSS/layout changes automatically
3. **E2E Browser Tests** (Playwright) - Validate critical user journeys end-to-end

**Critical Gaps Addressed** (from expert analysis):
- ✅ Authorization/RBAC testing (admin vs non-admin role differentiation)
- ✅ API error state testing (500 errors, RLS violations, network failures)
- ✅ Robust cleanup strategy with `safeCleanup()` helper
- ✅ Test selector strategy (getByRole > data-testid > avoid CSS/text)
- ✅ Accessibility workflow with formal a11y testing
- ✅ Flaky test policy for quarantining unreliable tests

**Total Effort**: 5-7 days with parallel execution

## Critically Relevant Files and Documentation

### Core Application Architecture
- `/home/krwhynot/Projects/atomic/src/atomic-crm/root/CRM.tsx` - React Admin resource registration
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/unifiedDataProvider.ts` - Single data provider (validation-first-transform-second pattern)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/authProvider.ts` - Auth provider with RBAC (is_admin)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/commons/canAccess.ts` - Authorization logic

### Test Infrastructure
- `/home/krwhynot/Projects/atomic/vitest.config.ts` - Minimal Vitest config (needs expansion)
- `/home/krwhynot/Projects/atomic/package.json` - Dependencies and scripts
- `/home/krwhynot/Projects/atomic/.github/workflows/check.yml` - CI workflow (test:ci already fixed)

### Critical Components to Test
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityCreate.tsx` - Create form with transform
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityEdit.tsx` - Edit form with tabs
- `/home/krwhynot/Projects/atomic/src/atomic-crm/contacts/ContactCreate.tsx` - JSONB email/phone arrays
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityList.tsx` - List with kanban, filters, localStorage

### Validation Layer
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/opportunities.ts` - Zod schemas
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/contacts.ts` - Multi-org validation

### UI Components
- `/home/krwhynot/Projects/atomic/src/components/ui/` - 32 base shadcn/ui components
- `/home/krwhynot/Projects/atomic/src/components/admin/` - React Admin integration layer

### Color System
- `/home/krwhynot/Projects/atomic/docs/2025-10/NEW-color-guide.html` - OKLCH color system reference (42 colors)
- `/home/krwhynot/Projects/atomic/src/index.css` - Tailwind v4 with @theme and semantic variables

### Documentation
- `/home/krwhynot/Projects/atomic/.docs/plans/ui-ux-testing-automation/requirements.md` - Complete requirements
- `/home/krwhynot/Projects/atomic/.docs/plans/ui-ux-testing-automation/shared.md` - Architecture reference
- `/home/krwhynot/Projects/atomic/.docs/plans/ui-ux-testing-automation/react-admin-patterns.research.md` - Data provider patterns
- `/home/krwhynot/Projects/atomic/.docs/plans/ui-ux-testing-automation/env-and-auth.research.md` - Auth & RBAC patterns
- `/home/krwhynot/Projects/atomic/CLAUDE.md` - Engineering Constitution

---

## Implementation Plan

### Phase 1: Component & Visual Foundation (Days 1-3)

**Rationale**: Component and visual tests are self-contained, provide fastest feedback, and cover the largest surface area. Getting 100% visual coverage and component test coverage early provides massive confidence boost and stable foundation for E2E tests.

#### Task 1.1: Vitest Configuration Enhancement **Depends on [none]**

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/vitest.config.ts`
- `/home/krwhynot/Projects/atomic/.docs/plans/ui-ux-testing-automation/existing-test-setup.research.md`
- https://vitest.dev/config/

**Instructions**

**Files to Modify**
- `/home/krwhynot/Projects/atomic/vitest.config.ts`
- `/home/krwhynot/Projects/atomic/package.json`

**What to Implement**
1. Enhance `vitest.config.ts` with:
   - Coverage configuration using `@vitest/coverage-v8` provider
   - Coverage thresholds: 70% lines/functions/branches/statements
   - Coverage exclusions: node_modules, tests, dist, .docs, setupTests.js, main.tsx, *.config.ts
   - Include/exclude patterns for test discovery
   - Test timeout: Use `timeout: 10000` (NOT `testTimeout` - property name changed in Vitest 3.2+)
   - Setup files: both `@testing-library/jest-dom` and custom `./src/tests/setup.ts`

2. Add npm scripts to `package.json`:
   ```json
   "test:coverage": "vitest run --coverage",
   "test:ui": "vitest --ui",
   "test:watch": "vitest",
   "test:unit": "vitest run src/**/*.test.{ts,tsx}"
   ```

3. Install missing dependencies:
   ```bash
   npm install -D @vitest/coverage-v8 @vitest/ui
   ```

**Gotchas**
- Coverage v8 provider is faster than c8 but has different configuration syntax
- **CRITICAL**: Use `timeout: 10000` NOT `testTimeout: 10000` (Vitest 3.2+ property name)
- Ensure `setupFiles` runs BEFORE tests (jest-dom matchers must be available)
- Don't set coverage too high initially (70% is realistic baseline)
- Exclude config files, main.tsx, and setupTests.js from coverage

---

#### Task 1.2: React Testing Library Test Utilities **Depends on [none]**

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/.docs/plans/ui-ux-testing-automation/react-admin-patterns.research.md`
- https://marmelab.com/react-admin/Testing.html
- https://testing-library.com/docs/react-testing-library/api

**Instructions**

**Files to Create**
- `/home/krwhynot/Projects/atomic/src/tests/utils/render-admin.tsx`
- `/home/krwhynot/Projects/atomic/src/tests/utils/mock-providers.ts`
- `/home/krwhynot/Projects/atomic/src/tests/setup.ts`

**What to Implement**
1. Create `render-admin.tsx` with helper function:
   - Wraps component in `AdminContext` with mocked data provider
   - **CRITICAL**: Wraps in `QueryClientProvider` with real QueryClient instance
   - Supports partial data provider mocking (only override needed methods)
   - Includes `RecordContextProvider` and `ResourceContextProvider` wrappers
   - Returns Testing Library render result plus helpers (queryClient, dataProvider, authProvider)

2. Create `mock-providers.ts` with:
   - Default mock data provider implementing all CRUD methods
   - Pessimistic mode simulation with `setTimeout(100)` delay in create/update
   - Mock auth provider with configurable role (admin/user)
   - Factory functions for creating test data (opportunities, contacts, organizations)
   - API error simulation helpers (500 errors, RLS violations, network failures)

3. Create `setup.ts` global test setup:
   - Import jest-dom matchers
   - Mock window.matchMedia for responsive tests
   - Mock IntersectionObserver for virtualized lists
   - Define global QueryClient configuration (no retries for tests)

**Gotchas**
- React Admin requires full data provider interface even if not all methods used
- **CRITICAL**: Must provide real QueryClient instance (OpportunityCreate uses queryClient.setQueriesData for cache management)
- Pessimistic mutation mode requires delay simulation (use setTimeout in mocks)
- Must mock both `useDataProvider()` and pass to `AdminContext`
- Error format must match React Admin convention: `{ message: string, errors: { field: string } }`
- Component transforms run BEFORE data provider transforms (test both layers separately)

---

#### Task 1.3: Opportunity Form Component Tests **Depends on [1.2]**

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityCreate.tsx`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityEdit.tsx`
- `/home/krwhynot/Projects/atomic/.docs/plans/ui-ux-testing-automation/requirements.md` (Flow 1, API error examples)

**Instructions**

**Files to Create**
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/__tests__/OpportunityCreate.test.tsx`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/__tests__/OpportunityEdit.test.tsx`

**What to Implement**

For **OpportunityCreate.test.tsx**:
1. Test default values from config (stage, probability, closing_date)
2. Test transform function extracts `products` to `products_to_sync`
3. Test validation errors display inline (Zod schema validation)
4. **API Error States** (CRITICAL):
   - Mock data provider rejection with 500 error → verify error notification displays
   - Mock RLS violation → verify field-specific error message
   - Verify form remains editable after error (not disabled)
5. Test successful submission calls `dataProvider.create()` with correct payload

For **OpportunityEdit.test.tsx**:
1. Test form loads with existing record data
2. Test pessimistic mutation mode (no optimistic updates)
3. Test `onSuccess` cache invalidation
4. Test transform function for products RPC
5. **API Error States**: Same as Create tests but for `update()`

**Testing Pattern**:
```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithAdmin } from '@/tests/utils/render-admin';

describe('OpportunityCreate', () => {
  it('displays error notification on data provider failure', async () => {
    const mockDataProvider = {
      create: vi.fn().mockRejectedValue(new Error('Server error'))
    };

    renderWithAdmin(<OpportunityCreate />, { dataProvider: mockDataProvider });

    await userEvent.type(screen.getByLabelText('Opportunity Name'), 'Test');
    await userEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(await screen.findByText(/server error/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Opportunity Name')).not.toBeDisabled();
  });
});
```

**Gotchas**
- Forms use `CreateBase`/`EditBase` which require full React Admin context
- Transform functions run AFTER validation, so mock validation must pass first
- Need to mock `useGetIdentity()` for `opportunity_owner_id` default value

---

#### Task 1.4: Contact Form Component Tests **Depends on [1.2]**

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/src/atomic-crm/contacts/ContactCreate.tsx`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/contacts.ts` (multi-org validation)

**Instructions**

**Files to Create**
- `/home/krwhynot/Projects/atomic/src/atomic-crm/contacts/__tests__/ContactCreate.test.tsx`

**What to Implement**
1. Test JSONB email array handling:
   - Add multiple emails with different types (Work, Personal)
   - Verify array structure: `[{ email: "x@y.com", type: "Work" }]`
2. Test JSONB phone array handling (same pattern as emails)
3. Test multi-organization validation:
   - Valid: At least one organization with exactly one primary
   - Invalid: Zero organizations → validation error
   - Invalid: Multiple primary organizations → validation error
4. Test transform function for junction table (`contact_organizations`)
5. **API Error States**: Mock data provider rejections for create operation

**Gotchas**
- Multi-org validation uses Zod `superRefine()` for cross-field validation
- `contact_organizations` junction table requires `is_primary` boolean
- Email/phone fields are JSONB arrays, not strings

---

#### Task 1.5: List Component Tests **Depends on [1.2]**

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityList.tsx`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/contacts/ContactList.tsx`

**Instructions**

**Files to Create**
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/__tests__/OpportunityList.test.tsx`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/contacts/__tests__/ContactList.test.tsx`

**What to Implement**

For **OpportunityList.test.tsx**:
1. Test list renders with mocked data from `useListContext()`
2. Test multi-select stage filter application
3. Test filter persistence to localStorage (key: `CRM.opportunities.listParams`)
4. Test empty state rendering (no data vs no results)
5. Test pagination behavior
6. Mock `useDataProvider().getList()` to return dynamic filter choices

For **ContactList.test.tsx**:
1. Test rendering with `contacts_summary` view data
2. Test sidebar filter application
3. Test custom exporter functionality
4. Test tag display and filtering

**Gotcas**
- Mock `useListContext()` from ra-core to avoid rendering full `<List>` wrapper
- localStorage mocking: use `vi.spyOn(Storage.prototype, 'setItem')`
- Filter values use PostgREST operators: `"deleted_at@is": null`

---

#### Task 1.6: Admin Layer Component Tests **Depends on [1.2]**

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/src/components/admin/text-input.tsx`
- `/home/krwhynot/Projects/atomic/src/components/admin/form.tsx`

**Instructions**

**Files to Create**
- `/home/krwhynot/Projects/atomic/src/components/admin/__tests__/text-input.test.tsx`
- `/home/krwhynot/Projects/atomic/src/components/admin/__tests__/select-input.test.tsx`
- `/home/krwhynot/Projects/atomic/src/components/admin/__tests__/form.test.tsx`

**What to Implement**
1. **text-input.test.tsx**:
   - Test `useInput()` integration with React Hook Form
   - Test error display through `FormError` component
   - Test required field indicator
   - Test multiline mode (textarea)

2. **select-input.test.tsx**:
   - Test choices rendering
   - Test reference input mode
   - Test Radix bug workaround (key-based remounting)

3. **form.test.tsx**:
   - Test `FormField` context provider
   - Test `SaveButton` disabled state during submission
   - Test validation error aggregation

**Gotchas**
- Must wrap in `FormProvider` from react-hook-form
- `useInput()` requires resource and source props
- Errors accessed via `useFormField()` hook

---

#### Task 1.7: Storybook Setup & Configuration **Depends on [none]**

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/.docs/plans/ui-ux-testing-automation/requirements.md` (Storybook section)
- `/home/krwhynot/Projects/atomic/docs/2025-10/NEW-color-guide.html` (OKLCH color system - 42 colors)
- `/home/krwhynot/Projects/atomic/vite.config.ts` (Tailwind v4 configuration to merge)
- https://storybook.js.org/docs/get-started/install

**Instructions**

**Files to Create**
- `/home/krwhynot/Projects/atomic/.storybook/main.ts`
- `/home/krwhynot/Projects/atomic/.storybook/preview.tsx`
- `/home/krwhynot/Projects/atomic/.storybook/manager.ts`

**Files to Modify**
- `/home/krwhynot/Projects/atomic/package.json`

**What to Implement**
1. Install Storybook dependencies:
   ```bash
   npx storybook@latest init --type react-vite
   npm install -D @storybook/addon-a11y @storybook/addon-interactions
   ```

2. Configure `.storybook/main.ts`:
   - Framework: `@storybook/react-vite`
   - Addons: essentials, a11y, interactions
   - Stories pattern: `../src/**/*.stories.@(js|jsx|ts|tsx)`
   - Static dirs: `../public`
   - **CRITICAL**: Use `viteFinal` to merge main Vite config (imports Tailwind v4 pipeline):
     ```typescript
     import { mergeConfig } from 'vite';
     import baseViteConfig from '../vite.config';

     async viteFinal(config) {
       return mergeConfig(config, baseViteConfig);
     }
     ```

3. Configure `.storybook/preview.tsx`:
   - Import Tailwind CSS styles: `import '../src/index.css'` (loads all 42 OKLCH colors)
   - Setup decorator wrapping stories in semantic background:
     ```typescript
     decorators: [
       (Story) => (
         <div style={{ background: 'var(--background)', color: 'var(--foreground)', padding: '2rem' }}>
           <Story />
         </div>
       )
     ]
     ```
   - Configure Chromatic modes for light/dark theme testing:
     ```typescript
     chromatic: {
       modes: {
         light: {},
         dark: { globals: { theme: 'dark' } }
       }
     }
     ```
   - Configure viewport addon for responsive testing

4. Add npm scripts:
   ```json
   "storybook": "storybook dev -p 6006",
   "build-storybook": "storybook build"
   ```

**Gotchas**
- **CRITICAL**: Merge main vite.config.ts via `viteFinal` to get Tailwind v4 @theme syntax support
- OKLCH colors work natively in Storybook 8.4 + Chromatic (modern browser support confirmed)
- Import `src/index.css` once in preview.tsx (contains all 42 OKLCH semantic variables)
- Chromatic modes configuration enables automatic light/dark theme snapshots
- a11y addon auto-scans all stories by default (no per-story configuration needed)

---

#### Task 1.8: Base UI Component Stories (Batch 1) **Depends on [1.7]**

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/src/components/ui/button.tsx`
- `/home/krwhynot/Projects/atomic/src/components/ui/input.tsx`
- `/home/krwhynot/Projects/atomic/src/components/ui/select.tsx`
- `/home/krwhynot/Projects/atomic/src/components/ui/badge.tsx`
- https://ui.shadcn.com/

**Instructions**

**Files to Create**
- `/home/krwhynot/Projects/atomic/src/components/ui/button.stories.tsx`
- `/home/krwhynot/Projects/atomic/src/components/ui/input.stories.tsx`
- `/home/krwhynot/Projects/atomic/src/components/ui/select.stories.tsx`
- `/home/krwhynot/Projects/atomic/src/components/ui/badge.stories.tsx`

**What to Implement**

For each component, create stories covering ALL variants:

**Button** (6 variants × 4 sizes = 24 stories):
- Variants: default, destructive, outline, secondary, ghost, link
- Sizes: default, sm, lg, icon
- Props to test: disabled, loading, icon placement

**Input**:
- States: default, disabled, invalid, focus
- Types: text, email, password, number

**Select**:
- Sizes: default, sm
- States: empty, with value, disabled
- Multiple options

**Badge**:
- Variants: default, secondary, destructive, outline

**Story Template**:
```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';

const meta: Meta<typeof Button> = {
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['default', 'destructive', ...] }
  }
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: { children: 'Click me', variant: 'default' }
};
```

**Gotchas**
- Button uses `class-variance-authority` for variant management
- Must test BOTH light and dark mode (Chromatic captures both)
- Semantic color variables only (no hex codes per Engineering Constitution)

---

#### Task 1.9: Base UI Component Stories (Batch 2) **Depends on [1.7]**

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/src/components/ui/card.tsx`
- `/home/krwhynot/Projects/atomic/src/components/ui/dialog.tsx`
- `/home/krwhynot/Projects/atomic/src/components/ui/tabs.tsx`
- `/home/krwhynot/Projects/atomic/src/components/ui/avatar.tsx`

**Instructions**

**Files to Create**
- `/home/krwhynot/Projects/atomic/src/components/ui/card.stories.tsx`
- `/home/krwhynot/Projects/atomic/src/components/ui/dialog.stories.tsx`
- `/home/krwhynot/Projects/atomic/src/components/ui/tabs.stories.tsx`
- `/home/krwhynot/Projects/atomic/src/components/ui/avatar.stories.tsx`

**What to Implement**

**Card** (7 sub-components):
- Basic card with header, content, footer
- Card with image
- Card with form inputs
- Nested cards

**Dialog**:
- Basic modal
- With form content
- Confirmation dialog
- Scrollable content

**Tabs**:
- Horizontal tabs
- With icons
- Disabled tabs

**Avatar**:
- With image
- Fallback initials
- Different sizes

**Gotchas**
- Dialog uses Radix Portal (renders outside story root)
- Card composition requires all sub-components (CardHeader, CardContent, etc.)
- Avatar image loading needs fallback handling

---

#### Task 1.10a: Interactive Component Stories **Depends on [1.7]**

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/src/components/ui/dropdown-menu.tsx`
- `/home/krwhynot/Projects/atomic/src/components/ui/command.tsx`
- `/home/krwhynot/Projects/atomic/src/components/ui/combobox.tsx`
- `/home/krwhynot/Projects/atomic/src/components/ui/popover.tsx`
- `/home/krwhynot/Projects/atomic/src/components/ui/tooltip.tsx`

**Instructions**

**Files to Create** (~40 stories)
- `dropdown-menu.stories.tsx` - Menus with nested items, separators, checkboxes
- `command.stories.tsx` - Command palette with search, keyboard navigation
- `combobox.stories.tsx` - Autocomplete with filtering
- `popover.stories.tsx` - Positioned popovers with triggers
- `tooltip.stories.tsx` - Different placements and delays

**What to Implement**
- Use `play` function from `@storybook/addon-interactions` for interactive demos
- Test keyboard navigation (Tab, Arrow keys, Enter, Escape)
- Test focus management and ARIA attributes
- Cover all trigger types (click, hover, focus)

**Gotchas**
- Radix Portals render outside story container (test in isolation)
- Keyboard navigation must be verified manually (not visual regression)

---

#### Task 1.10b: Layout Component Stories **Depends on [1.7]**

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/src/components/ui/sheet.tsx`
- `/home/krwhynot/Projects/atomic/src/components/ui/scroll-area.tsx`
- `/home/krwhynot/Projects/atomic/src/components/ui/separator.tsx`
- `/home/krwhynot/Projects/atomic/src/components/ui/accordion.tsx`
- `/home/krwhynot/Projects/atomic/src/components/ui/navigation-menu.tsx`

**Instructions**

**Files to Create** (~30 stories)
- `sheet.stories.tsx` - Side sheets from all 4 directions
- `scroll-area.stories.tsx` - Vertical/horizontal scrolling
- `separator.stories.tsx` - Horizontal/vertical dividers
- `accordion.stories.tsx` - Single/multiple expanded items
- `navigation-menu.stories.tsx` - Desktop navigation patterns

**What to Implement**
- Test responsive behavior across viewports
- Test animation states (opening, closing, expanded, collapsed)
- Verify semantic color usage (borders, backgrounds)

---

#### Task 1.10c: Form & Feedback Component Stories **Depends on [1.7]**

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/src/components/ui/checkbox.tsx`
- `/home/krwhynot/Projects/atomic/src/components/ui/switch.tsx`
- `/home/krwhynot/Projects/atomic/src/components/ui/radio-group.tsx`
- `/home/krwhynot/Projects/atomic/src/components/ui/progress.tsx`
- `/home/krwhynot/Projects/atomic/src/components/ui/alert.tsx`
- `/home/krwhynot/Projects/atomic/src/components/ui/toast.tsx`

**Instructions**

**Files to Create** (~35 stories)
- `checkbox.stories.tsx` - Checked/unchecked/indeterminate states
- `switch.stories.tsx` - On/off with labels
- `radio-group.stories.tsx` - Grouped options
- `progress.stories.tsx` - Determinate/indeterminate loading
- `alert.stories.tsx` - Info/success/warning/error variants
- `toast.stories.tsx` (Sonner) - Toast notifications with actions

**What to Implement**
- Cover all status colors (success, warning, error, info)
- Test disabled states and ARIA attributes
- Verify color contrast meets WCAG AA

**Gotchas**
- Total target across all batches: ~215 stories for complete UI coverage
- Each story must pass @storybook/addon-a11y checks automatically

---

#### Task 1.11: Chromatic Integration & Baseline Snapshots **Depends on [1.8, 1.9, 1.10a, 1.10b, 1.10c]**

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/.docs/plans/ui-ux-testing-automation/requirements.md` (Chromatic section)
- https://www.chromatic.com/docs/setup

**Instructions**

**Files to Create**
- `/home/krwhynot/Projects/atomic/.github/workflows/chromatic.yml`

**Files to Modify**
- `/home/krwhynot/Projects/atomic/package.json`

**What to Implement**
1. Set up Chromatic account and get project token

2. Install Chromatic CLI:
   ```bash
   npm install -D chromatic
   ```

3. Create GitHub Actions workflow `.github/workflows/chromatic.yml`:
   ```yaml
   name: 📸 Chromatic
   on:
     pull_request:
       types: [opened, synchronize]

   jobs:
     visual-regression:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
           with:
             fetch-depth: 0  # Full git history for Chromatic
         - uses: actions/setup-node@v4
           with:
             node-version: 22
             cache: npm
         - run: npm ci
         - run: npm run build-storybook
         - uses: chromaui/action@v1
           with:
             projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
             exitOnceUploaded: true
             onlyChanged: true  # Only snapshot changed stories
   ```

4. Establish visual baselines:
   - Run `npx chromatic --project-token=<token>` locally
   - Accept all snapshots as baseline in Chromatic UI
   - Subsequent runs will diff against this baseline

5. Configure `.storybook/main.ts` for Chromatic:
   - Enable Chromatic-specific optimizations
   - Configure snapshot delays for animations

6. **OKLCH Color Validation Checklist** - Verify all 42 colors render correctly:
   - ✅ 10 Neutrals (neutral-50 through neutral-900)
   - ✅ 5 Brand greens (brand-100, 300, 500, 700, 800)
   - ✅ 12 Semantic colors (success/warning/error/info with subtle/default/strong)
   - ✅ 2 Accent colors (purple, teal)
   - ✅ 16 Tag colors (8 bg/fg pairs for warm/green/teal/blue/purple/yellow/gray/pink)
   - ✅ 5 Chart colors (linked to palette)
   - ✅ Light mode and dark mode variants for ALL stories
   - ✅ Semantic variables (--primary, --destructive, --muted, --accent, --ring) work correctly

**Gotchas**
- Must fetch full git history (`fetch-depth: 0`) for Chromatic to detect changed files
- First run establishes baseline - all subsequent runs compare to this
- CHROMATIC_PROJECT_TOKEN must be added to GitHub Secrets
- onlyChanged saves snapshot credits by only capturing modified stories
- **OKLCH colors confirmed working** in Storybook 8.4 + Chromatic (no polyfills needed)

---

### Phase 2: E2E Integration Tests (Days 4-6)

**Rationale**: E2E tests are more stable when underlying components are already verified. Build integration tests on proven foundation. These tests validate critical user journeys in real browser environment.

#### Task 2.1: Playwright Setup & Configuration **Depends on [none]**

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/.docs/plans/ui-ux-testing-automation/requirements.md` (Playwright section)
- https://playwright.dev/docs/intro

**Instructions**

**Files to Create**
- `/home/krwhynot/Projects/atomic/playwright.config.ts`
- `/home/krwhynot/Projects/atomic/tests/global-setup.ts`
- `/home/krwhynot/Projects/atomic/tests/global-teardown.ts`

**Files to Modify**
- `/home/krwhynot/Projects/atomic/package.json`

**What to Implement**
1. Install Playwright:
   ```bash
   npm install -D @playwright/test @axe-core/playwright
   npx playwright install chromium --with-deps
   ```

2. Configure `playwright.config.ts`:
   - Browser: Chromium only (headless mode for WSL2)
   - Retries: 2 attempts for flaky tests
   - Parallel workers: 4
   - Base URL: `http://localhost:5173`
   - Timeout: 30000ms per test
   - Use projects for different viewports (desktop, tablet, mobile)

3. Create `global-setup.ts`:
   - Create test users (admin and regular user) via service client
   - Seed global static data (pipeline stages, settings)
   - **AVOID** saving auth state to global JSON (session expiry issues)

4. Create `global-teardown.ts`:
   - Clean up global test users

5. **Per-Test-File Auth Fixture** (Zen recommendation):
   ```typescript
   // tests/fixtures/authenticated.ts
   import { test as base } from '@playwright/test';

   export const test = base.extend({
     authenticatedPage: async ({ browser }, use) => {
       const context = await browser.newContext();
       const page = await context.newPage();

       // Fresh login per test file
       await page.goto('/');
       await page.getByLabel('Email').fill('test@example.com');
       await page.getByLabel('Password').fill('password');
       await page.getByRole('button', { name: /sign in/i }).click();
       await page.waitForURL('**/');

       await use(page);
       await context.close();
     },
   });
   ```

6. Add npm scripts:
   ```json
   "test:e2e": "playwright test",
   "test:e2e:ui": "playwright test --ui",
   "test:e2e:debug": "playwright test --debug"
   ```

**Gotchas**
- WSL2 requires headless mode (no GUI)
- Test isolation requires each test to create own data in `beforeEach`
- **AVOID global auth-state.json** (tokens expire, causes session pollution)
- Use per-test-file auth fixtures for fresh logins (prevents flaky auth failures)

---

#### Task 2.2: Test Data Factories & Cleanup Utilities **Depends on [none]**

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/.docs/plans/ui-ux-testing-automation/requirements.md` (Test Data Management)
- `/home/krwhynot/Projects/atomic/src/tests/setup-mcp.ts` (existing patterns)

**Instructions**

**Files to Create**
- `/home/krwhynot/Projects/atomic/tests/utils/db-helpers.ts`
- `/home/krwhynot/Projects/atomic/tests/utils/test-data-factory.ts`
- `/home/krwhynot/Projects/atomic/tests/utils/auth-helpers.ts`

**What to Implement**

**db-helpers.ts**:
```typescript
import { createClient } from '@supabase/supabase-js';

type TestDataCleanup = () => Promise<void>;

// CRITICAL: Foreign key deletion order (Zen recommendation)
// Delete in this order to avoid constraint violations:
// tasks → opportunityNotes → contactNotes → opportunity_products →
// opportunity_participants → opportunities → contact_organizations →
// contacts → organizations → sales
export const DELETION_ORDER = [
  'tasks',
  'opportunityNotes',
  'contactNotes',
  'opportunity_products',
  'opportunity_participants',
  'opportunities',
  'contact_organizations',
  'contacts',
  'organizations',
  'sales'  // Delete test users last
];

// Robust cleanup helper (CRITICAL)
export async function safeCleanup(cleanupFunctions: TestDataCleanup[]): Promise<void> {
  const results = await Promise.allSettled(cleanupFunctions.map(fn => fn()));
  const failures = results.filter(r => r.status === 'rejected');
  if (failures.length > 0) {
    console.error(`${failures.length} cleanup operations failed:`, failures);
    // Log but don't throw - allow other tests to continue
  }
}

export async function createTestOpportunity(data): Promise<{ opportunity, cleanup }> {
  // Create via service client
  // Return cleanup function
}

export async function createTestContact(data): Promise<{ contact, cleanup }> {
  // Create with JSONB email/phone arrays
}
```

**test-data-factory.ts**:
```typescript
import { faker } from '@faker-js/faker';

export function generateOpportunityData() {
  return {
    name: faker.company.catchPhrase(),
    amount: faker.number.float({ min: 1000, max: 1000000 }),
    probability: faker.number.int({ min: 0, max: 100 }),
    expected_closing_date: faker.date.future().toISOString(),
  };
}

export function createEmailArray(count: number) {
  return Array.from({ length: count }, () => ({
    email: faker.internet.email(),
    type: faker.helpers.arrayElement(['Work', 'Personal'])
  }));
}
```

**auth-helpers.ts**:
```typescript
export async function createTestUser(options: { isAdmin: boolean }) {
  // Create user via service client
  // Create sales record with is_admin flag
  // Return { user, cleanup }
}

export async function loginAs(page, email, password) {
  await page.goto('/');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('**/');
}
```

**Gotchas**
- `safeCleanup()` uses `Promise.allSettled` to prevent cascading failures
- Test data MUST use unique identifiers to avoid conflicts
- JSONB arrays require specific format: `[{ email: "x", type: "Work" }]`

---

#### Task 2.3: E2E Test - Create Opportunity Flow **Depends on [2.1, 2.2]**

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/.docs/plans/ui-ux-testing-automation/requirements.md` (Flow 1)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityCreate.tsx`

**Instructions**

**Files to Create**
- `/home/krwhynot/Projects/atomic/tests/e2e/opportunities.spec.ts`

**What to Implement**
```typescript
import { test, expect } from '@playwright/test';
import { createTestUser, loginAs } from '../utils/auth-helpers';
import { createTestContact, safeCleanup } from '../utils/db-helpers';

test.describe('Opportunity Creation', () => {
  const cleanups = [];

  test.afterEach(async () => {
    await safeCleanup(cleanups);
    cleanups.length = 0;
  });

  test('creates opportunity with validation', async ({ page }) => {
    // 1. Login
    await loginAs(page, 'test@example.com', 'password');

    // 2. Navigate to opportunities
    await page.goto('/#/opportunities');

    // 3. Click Create button (USE getByRole, not CSS!)
    await page.getByRole('button', { name: /create/i }).click();

    // 4. Fill form with invalid data
    await page.getByLabel('Opportunity Name').fill('');
    await page.getByRole('button', { name: /save/i }).click();

    // 5. Verify validation errors
    await expect(page.getByText(/name is required/i)).toBeVisible();

    // 6. Fill valid data
    await page.getByLabel('Opportunity Name').fill('Test Opportunity');
    await page.getByLabel('Amount').fill('50000');

    // 7. Submit
    await page.getByRole('button', { name: /save/i }).click();

    // 8. Verify redirect and list display
    await expect(page).toHaveURL(/.*#\/opportunities$/);
    await expect(page.getByText('Test Opportunity')).toBeVisible();
  });
});
```

**Gotchas**
- MUST use user-facing selectors (getByRole, getByLabel)
- Track cleanup functions for test data
- Verify both client-side AND server-side validation

---

#### Task 2.4: E2E Test - Contact Management Flow **Depends on [2.1, 2.2]**

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/.docs/plans/ui-ux-testing-automation/requirements.md` (Flow 2)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/contacts/ContactCreate.tsx`

**Instructions**

**Files to Create**
- `/home/krwhynot/Projects/atomic/tests/e2e/contacts.spec.ts`

**What to Implement**
Test contact creation with:
1. JSONB email/phone array inputs
2. Multi-organization linking via junction table
3. Tag addition
4. Navigate to detail page
5. Verify all data displays correctly

**Critical**: Test multi-org validation (exactly one primary organization)

**Gotchas**
- Email/phone inputs may be dynamic (add/remove buttons)
- Organization autocomplete requires waiting for search results
- Primary organization toggle must be enforced

---

#### Task 2.5: E2E Test - Filters & Search Flow **Depends on [2.1, 2.2]**

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/.docs/plans/ui-ux-testing-automation/requirements.md` (Flow 3)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityList.tsx`

**Instructions**

**Files to Create**
- `/home/krwhynot/Projects/atomic/tests/e2e/filters.spec.ts`

**What to Implement**
1. Apply multi-select stage filter
2. Verify filtered results
3. Check localStorage persistence (key: `CRM.opportunities.listParams`)
4. Reload page → verify filter persists
5. Export filtered results
6. Test search input filtering

**Gotchas**
- localStorage access requires `page.evaluate()` in Playwright
- Filter chips display applied filters
- Export triggers download (need to handle file downloads)

---

#### Task 2.6: E2E Test - Edit Flow **Depends on [2.1, 2.2]**

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/.docs/plans/ui-ux-testing-automation/requirements.md` (Flow 4)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityEdit.tsx`

**Instructions**

**Files to Create**
- `/home/krwhynot/Projects/atomic/tests/e2e/edit-flow.spec.ts`

**What to Implement**
1. Create test opportunity via service client
2. Navigate to opportunity detail
3. Click Edit button
4. Modify amount, stage, relationships
5. Submit form
6. Verify pessimistic update (no optimistic UI)
7. Query database to confirm persistence

**Gotchas**
- Edit uses tabs for sections (navigate between tabs)
- Products section uses RPC for atomic updates
- Must verify database persistence, not just UI

---

#### Task 2.7: E2E Test - Authorization (RBAC) **Depends on [2.1, 2.2]**

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/.docs/plans/ui-ux-testing-automation/requirements.md` (Flow 6 - CRITICAL)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/commons/canAccess.ts`
- `/home/krwhynot/Projects/atomic/.docs/plans/ui-ux-testing-automation/env-and-auth.research.md` (RBAC section)

**Instructions**

**Files to Create**
- `/home/krwhynot/Projects/atomic/tests/e2e/authorization.spec.ts`

**What to Implement**
```typescript
test.describe('Authorization (RBAC)', () => {
  test('non-admin user cannot access sales resource', async ({ page }) => {
    // 1. Create regular user (is_admin: false) via service client
    const { user, cleanup } = await createTestUser({ isAdmin: false });
    cleanups.push(cleanup);

    // 2. Login as regular user
    await loginAs(page, user.email, 'password');

    // 3. Verify sales menu item NOT visible
    await expect(page.getByRole('link', { name: /sales/i })).not.toBeVisible();

    // 4. Attempt direct navigation
    await page.goto('/#/sales');

    // 5. Verify redirect OR 403 error
    await expect(page).toHaveURL(/.*#\/$/);  // Redirected to dashboard
    // OR: await expect(page.getByText(/access denied/i)).toBeVisible();
  });

  test('admin user can access all resources', async ({ page }) => {
    // 1. Create admin user (is_admin: true)
    const { user, cleanup } = await createTestUser({ isAdmin: true });
    cleanups.push(cleanup);

    // 2. Login as admin
    await loginAs(page, user.email, 'password');

    // 3. Verify sales menu visible
    await expect(page.getByRole('link', { name: /sales/i })).toBeVisible();

    // 4. Navigate to sales
    await page.click('text=Sales');
    await expect(page).toHaveURL(/.*#\/sales/);

    // 5. Create sales record
    await page.getByRole('button', { name: /create/i }).click();
    // ... fill form and verify CRUD works
  });
});
```

**Gotchas**
- RBAC determined by `sales.is_admin` boolean in database
- Non-admin users should see NO sales menu item at all
- Must test both UI hiding AND API/RLS enforcement

---

#### Task 2.8: E2E Test - Accessibility Baseline **Depends on [2.1]**

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/.docs/plans/ui-ux-testing-automation/requirements.md` (Accessibility Workflow)
- https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright

**Instructions**

**Files to Create**
- `/home/krwhynot/Projects/atomic/tests/e2e/accessibility.spec.ts`

**What to Implement**
```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Baseline', () => {
  test('dashboard has no critical a11y violations', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    // Fail ONLY on critical/serious violations
    const criticalViolations = accessibilityScanResults.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );

    expect(criticalViolations).toEqual([]);
  });

  test('opportunities list has no critical violations', async ({ page }) => {
    await page.goto('/#/opportunities');
    const results = await new AxeBuilder({ page }).analyze();

    const criticalViolations = results.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );

    expect(criticalViolations).toEqual([]);
  });

  // Repeat for: contacts list, create forms, edit forms
});
```

**Scan These Pages**:
1. Dashboard (/)
2. Opportunities list (/#/opportunities)
3. Contacts list (/#/contacts)
4. Opportunity create form (/#/opportunities/create)
5. Contact edit form (/#/contacts/:id)

**Gotchas**
- Fail ONLY on critical/serious violations (not moderate/minor)
- Generate HTML report for full findings
- Some violations may be false positives (requires human review)

---

### Phase 3: CI/CD Integration (Continuous, Days 1-7)

**Rationale**: Build CI/CD incrementally alongside tests to avoid "big bang" integration. Add jobs as test suites are completed.

#### Task 3.1: CI Coverage Reporting **Depends on [1.1, 1.3, 1.4, 1.5, 1.6]**

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/.github/workflows/check.yml`
- https://about.codecov.io/

**Instructions**

**Files to Modify**
- `/home/krwhynot/Projects/atomic/.github/workflows/check.yml`

**What to Implement**
Enhance the existing `test` job:
```yaml
test:
  name: 🔎 Test
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: 22
        cache: npm
    - run: npm ci
    - run: npm run test:ci  # Already uses test:ci from package.json
    - name: Upload coverage
      uses: codecov/codecov-action@v4
      if: always()
      with:
        token: ${{ secrets.CODECOV_TOKEN }}
        files: ./coverage/lcov.info
```

Add CODECOV_TOKEN to GitHub Secrets

**Gotchas**
- Coverage upload should run even if tests fail (`if: always()`)
- Codecov requires lcov format (configured in vitest.config.ts)

---

#### Task 3.2: CI E2E Test Job **Depends on [2.3, 2.4, 2.5, 2.6, 2.7]**

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/.github/workflows/check.yml`

**Instructions**

**Files to Modify**
- `/home/krwhynot/Projects/atomic/.github/workflows/check.yml`

**What to Implement**
Add new `e2e-tests` job:
```yaml
e2e-tests:
  name: 🌐 E2E Tests
  runs-on: ubuntu-latest
  timeout-minutes: 20
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: 22
        cache: npm
    - run: npm ci
    - name: Install Playwright browsers
      run: npx playwright install chromium --with-deps
    - name: Run E2E tests
      run: npm run test:e2e
      env:
        VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
        VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
        SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
    - name: Upload Playwright report
      uses: actions/upload-artifact@v4
      if: failure()
      with:
        name: playwright-report
        path: playwright-report/
        retention-days: 7
```

**Gotchas**
- E2E tests use cloud Supabase (no local instance)
- Playwright browsers need explicit installation
- Upload report ONLY on failure to debug issues

---

#### Task 3.3: CI Accessibility Test Job **Depends on [2.8]**

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/.github/workflows/check.yml`

**Instructions**

**Files to Modify**
- `/home/krwhynot/Projects/atomic/.github/workflows/check.yml`

**What to Implement**
Add dedicated `a11y-tests` job:
```yaml
a11y-tests:
  name: ♿ Accessibility
  runs-on: ubuntu-latest
  timeout-minutes: 10
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: 22
        cache: npm
    - run: npm ci
    - run: npx playwright install chromium --with-deps
    - name: Run accessibility tests
      run: npx playwright test tests/e2e/accessibility.spec.ts
    - name: Upload a11y report
      uses: actions/upload-artifact@v4
      if: always()
      with:
        name: accessibility-report
        path: playwright-report/
        retention-days: 30
```

**Gotchas**
- Always upload a11y report (even on pass) for audit trail
- Fail build ONLY on critical/serious violations

---

#### Task 3.4: Chromatic CI Integration **Depends on [1.11]**

**READ THESE BEFORE TASK**
- Already created in Task 1.11

**Instructions**

Verify `.github/workflows/chromatic.yml` is working:
1. Push branch with component changes
2. Verify Chromatic build triggers
3. Verify snapshot diffs posted to PR
4. Test approval workflow in Chromatic UI

**Gotchas**
- Chromatic runs on PR only (not main branch)
- First PR establishes baseline, subsequent PRs compare

---

#### Task 3.5: Developer Documentation **Depends on [all previous tasks]**

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/CLAUDE.md`
- `/home/krwhynot/Projects/atomic/README.md`

**Instructions**

**Files to Create**
- `/home/krwhynot/Projects/atomic/.docs/testing/TESTING.md`
- `/home/krwhynot/Projects/atomic/.docs/testing/WRITING_TESTS.md`
- `/home/krwhynot/Projects/atomic/.docs/testing/FLAKY_TEST_POLICY.md`

**Files to Modify**
- `/home/krwhynot/Projects/atomic/README.md`

**What to Implement**

**TESTING.md**:
- Overview of 3-layer testing strategy
- How to run tests locally
- How to interpret test failures
- Coverage requirements (70% baseline)

**WRITING_TESTS.md**:
- Component test patterns with examples
- E2E test patterns with examples
- Test selector strategy (MANDATORY: getByRole > data-testid > avoid CSS/text)
- Mocking data providers
- Test data factory usage
- Cleanup best practices with `safeCleanup()`

**FLAKY_TEST_POLICY.md**:
```markdown
# Flaky Test Policy

## Detection
Test is "flaky" if it fails in CI but passes on re-run more than 2 times in one week.

## Action Plan
1. Create P2 ticket to investigate root cause
2. If test blocks >3 PRs, quarantine with `.skip()`:
   ```typescript
   test.skip('flaky test - see issue #123', async () => { ... });
   ```
3. Add comment explaining quarantine reason
4. Weekly review of quarantined tests (remove skip when fixed)

## Common Causes
- Race conditions (async timing issues)
- Flaky selectors (use getByRole, not CSS)
- External dependencies (network, database)
- Test pollution (state leakage between tests)
```

**README.md Updates**:
Add Testing section with:
- Link to TESTING.md
- Quick start commands
- CI badge with coverage percentage

**Gotchas**
- Documentation should be living (update as patterns evolve)
- Include real examples from codebase, not generic templates

---

## Advice for All Implementers

### Critical Principles (Non-Negotiable)

1. **Test Selector Hierarchy** (MANDATORY):
   - 1st choice: `getByRole('button', { name: /create/i })`
   - 2nd choice: `getByLabel('Email')`
   - 3rd choice: `data-testid="submit-form"`
   - ❌ NEVER: `page.click('.btn-primary')` or `page.click('text=Submit')`

2. **API Error Testing** (CRITICAL GAP):
   - EVERY form component test MUST include at least one error state test
   - Mock data provider rejections (500 errors, RLS violations)
   - Verify UI displays error AND remains functional

3. **Authorization Testing** (CRITICAL GAP):
   - EVERY protected resource test MUST verify both admin and non-admin access
   - Create test users with `is_admin: true` and `is_admin: false`
   - Test both UI hiding AND API enforcement

4. **Robust Cleanup** (CRITICAL):
   - ALWAYS use `safeCleanup()` helper with `Promise.allSettled`
   - Track cleanup functions in array: `cleanups.push(cleanup)`
   - Never let cleanup failures poison other tests

5. **Accessibility** (NEW REQUIREMENT):
   - Every Storybook story automatically scanned with addon-a11y
   - E2E tests scan 5 key pages with @axe-core/playwright
   - Fail ONLY on critical/serious violations

### React Admin Testing Gotchas

1. **Data Provider Mocking**:
   - Must implement full interface (getList, getOne, create, update, delete, etc.)
   - Error format must match: `{ message: string, errors: { field: string } }`
   - Transform functions run AFTER validation in data provider

2. **Form Context Requirements**:
   - Components using `useInput()` MUST be wrapped in `AdminContext`
   - Need both `RecordContextProvider` and `ResourceContextProvider`
   - Mock `useGetIdentity()` for default values

3. **List Context Mocking**:
   - Mock `useListContext()` to avoid rendering full `<List>` wrapper
   - Provide: `data`, `isPending`, `filterValues`, pagination state

### Validation Testing Patterns

1. **Zod Schema Testing**:
   - Test boundary values (min/max, required fields)
   - Test cross-field validation (`superRefine` for multi-org contacts)
   - Test error message clarity

2. **Transform Order** (CRITICAL):
   - Validation runs FIRST with original field names
   - Transform runs SECOND (e.g., `products` → `products_to_sync`)
   - Test this order explicitly in component tests

### Visual Regression Best Practices

1. **Story Coverage**:
   - ALL variants (Button: 6 variants × 4 sizes = 24 stories minimum)
   - ALL states (default, hover, focus, disabled, error)
   - BOTH themes (light and dark mode)

2. **Chromatic Optimization**:
   - Use `onlyChanged: true` to save snapshot credits
   - Configure delays for animations to settle
   - Exclude dynamic content (timestamps, UUIDs)

### E2E Testing Patterns

1. **Test Isolation**:
   - Each test creates its own data in `beforeEach`
   - Use `safeCleanup()` in `afterEach`
   - Never rely on test execution order

2. **Auth State Reuse**:
   - Save auth state to JSON file in `global-setup.ts`
   - Reuse across tests to avoid repeated logins
   - Still verify permissions per-test

3. **Flaky Test Prevention**:
   - Use explicit waits: `await page.waitForURL()`, `await expect().toBeVisible()`
   - Avoid implicit timeouts
   - Use user-facing selectors (more stable than CSS)

### CI/CD Integration

1. **Incremental Addition**:
   - Day 1-3: Add Vitest component tests to CI
   - Day 3-4: Add Chromatic visual regression
   - Day 5-6: Add Playwright E2E tests
   - Day 6: Add accessibility job

2. **Failure Handling**:
   - Upload artifacts ONLY on failure (Playwright reports)
   - Upload coverage ALWAYS (`if: always()`)
   - Set appropriate timeouts (10min unit, 20min E2E)

### Engineering Constitution Compliance

- ✅ **NO OVER-ENGINEERING**: Simple patterns, fail fast, no complex retry logic
- ✅ **SINGLE SOURCE OF TRUTH**: All test data via Supabase, minimal mocking
- ✅ **FAIL FAST**: No health monitoring, abort immediately on setup failures
- ✅ **VALIDATION**: Test Zod schemas at API boundary only
- ✅ **COLORS**: Verify semantic CSS variables only (no hex codes)

### Common Pitfalls to Avoid

1. ❌ **Don't** hardcode test data cleanup (use factory pattern)
2. ❌ **Don't** use text content selectors (brittle with i18n)
3. ❌ **Don't** use CSS class selectors (brittle with refactoring)
4. ❌ **Don't** skip error state testing ("happy path only")
5. ❌ **Don't** test implementation details (test user-facing behavior)
6. ❌ **Don't** create E2E tests before component tests (unstable foundation)
7. ❌ **Don't** ignore accessibility violations (enable a11y addon immediately)
8. ❌ **Don't** let flaky tests block PRs (quarantine with policy)

### Performance Optimization

1. **Component Tests**: Parallelize with Vitest workers (4-8 concurrent)
2. **E2E Tests**: Use auth state reuse to skip login steps
3. **Chromatic**: Enable `onlyChanged` to reduce snapshot volume
4. **CI**: Cache npm dependencies and Playwright browsers

### Debugging Tips

1. **Component Tests**: Use `screen.debug()` to print DOM
2. **E2E Tests**: Use Playwright UI mode (`npm run test:e2e:ui`)
3. **Failed CI**: Download Playwright report artifact for traces
4. **Flaky Tests**: Enable video recording to see what happened

### Success Metrics

- **Component Tests**: 100% of Tier 1 forms and Tier 3 lists
- **Visual Regression**: 100% of 32 base UI components (~215 stories)
- **E2E Tests**: 6 critical flows (auth, authorization, create, edit, filter, a11y)
- **Coverage**: 70% baseline (lines, functions, branches, statements)
- **CI/CD**: <10 minutes total pipeline time
- **Flaky Rate**: <5% (tests pass consistently on retry)
