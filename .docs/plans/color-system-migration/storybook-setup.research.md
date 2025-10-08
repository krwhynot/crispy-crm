# Storybook and Visual Regression Testing Setup Research

Comprehensive analysis of the existing Storybook infrastructure, visual regression testing configuration, and component coverage gaps.

## Overview

The project has a **well-configured Storybook setup** with Chromatic visual regression testing infrastructure. However, **critical components are missing stories**, particularly the tag system components (TagChip, TagDialog) which are central to the color system migration. The workflow is disabled but ready for activation.

**Key Stats:**
- 23 UI component stories (out of 56 total UI components = 41% coverage)
- 0 admin layer component stories
- 0 feature layer component stories (including tag components)
- Chromatic workflow exists but is **disabled** (`.github/workflows/chromatic.yml.disabled`)
- All required dependencies installed and configured

## Relevant Files

### Storybook Configuration
- `/home/krwhynot/Projects/atomic/.storybook/main.js` - Main Storybook config with Chromatic optimizations
- `/home/krwhynot/Projects/atomic/.storybook/preview.tsx` - Preview config with theme switching and decorators
- `/home/krwhynot/Projects/atomic/.storybook/manager.ts` - Manager config (minimal, awaiting Storybook 9.x theming API)

### UI Component Stories (23 files)
- `/home/krwhynot/Projects/atomic/src/components/ui/button.stories.tsx` - 40+ story variants (6 variants × sizes + states)
- `/home/krwhynot/Projects/atomic/src/components/ui/badge.stories.tsx` - 40+ story variants (status, category, priority badges)
- `/home/krwhynot/Projects/atomic/src/components/ui/alert.stories.tsx` - 30+ story variants (info/success/warning/error with icons)
- `/home/krwhynot/Projects/atomic/src/components/ui/accordion.stories.tsx`
- `/home/krwhynot/Projects/atomic/src/components/ui/avatar.stories.tsx`
- `/home/krwhynot/Projects/atomic/src/components/ui/card.stories.tsx`
- `/home/krwhynot/Projects/atomic/src/components/ui/checkbox.stories.tsx`
- `/home/krwhynot/Projects/atomic/src/components/ui/combobox.stories.tsx`
- `/home/krwhynot/Projects/atomic/src/components/ui/command.stories.tsx`
- `/home/krwhynot/Projects/atomic/src/components/ui/dialog.stories.tsx`
- `/home/krwhynot/Projects/atomic/src/components/ui/dropdown-menu.stories.tsx`
- `/home/krwhynot/Projects/atomic/src/components/ui/input.stories.tsx`
- `/home/krwhynot/Projects/atomic/src/components/ui/navigation-menu.stories.tsx`
- `/home/krwhynot/Projects/atomic/src/components/ui/popover.stories.tsx`
- `/home/krwhynot/Projects/atomic/src/components/ui/progress.stories.tsx`
- `/home/krwhynot/Projects/atomic/src/components/ui/radio-group.stories.tsx`
- `/home/krwhynot/Projects/atomic/src/components/ui/select.stories.tsx`
- `/home/krwhynot/Projects/atomic/src/components/ui/separator.stories.tsx`
- `/home/krwhynot/Projects/atomic/src/components/ui/sheet.stories.tsx`
- `/home/krwhynot/Projects/atomic/src/components/ui/sonner.stories.tsx`
- `/home/krwhynot/Projects/atomic/src/components/ui/switch.stories.tsx`
- `/home/krwhynot/Projects/atomic/src/components/ui/tabs.stories.tsx`
- `/home/krwhynot/Projects/atomic/src/components/ui/tooltip.stories.tsx`

### Tag Components (NO STORIES)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/tags/TagChip.tsx` - **Missing story** (inline tag display with remove button)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/tags/TagDialog.tsx` - **Missing story** (tag creation/edit modal)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/tags/TagCreateModal.tsx`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/tags/TagEditModal.tsx`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/tags/RoundButton.tsx` - Color picker button component
- `/home/krwhynot/Projects/atomic/src/atomic-crm/tags/tag-colors.ts` - Tag color validation and CSS class mapping
- `/home/krwhynot/Projects/atomic/src/atomic-crm/tags/colors.ts` - Exports VALID_TAG_COLORS array

### Visual Regression Workflow
- `/home/krwhynot/Projects/atomic/.github/workflows/chromatic.yml.disabled` - **Disabled workflow** ready for activation

### Color System
- `/home/krwhynot/Projects/atomic/src/lib/color-types.ts` - Semantic color definitions, TagColorName type
- `/home/krwhynot/Projects/atomic/src/index.css` - CSS custom properties with OKLCH values

## Architectural Patterns

### Storybook Configuration Architecture

**Story Discovery Pattern:**
```javascript
// .storybook/main.js lines 5-8
stories: [
  '../src/**/*.mdx',
  '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'
]
```
- Automatic discovery of all `.stories.tsx` files under `/src`
- Currently only `/src/components/ui/` has stories
- No stories in `/src/components/admin/` or `/src/atomic-crm/`

**Addon Configuration:**
```javascript
// .storybook/main.js lines 9-14
addons: [
  '@chromatic-com/storybook',    // Chromatic visual regression integration
  '@storybook/addon-docs',        // Auto-generated documentation
  '@storybook/addon-a11y',        // Accessibility testing (installed but not visible in UI by default)
  '@storybook/addon-onboarding'   // First-time user onboarding
]
```

**Chromatic-Specific Optimizations:**
```javascript
// .storybook/main.js lines 42-68
...(process.env.CHROMATIC ? {
  disabledAddons: ['@storybook/addon-onboarding'],
  chromatic: {
    delay: 300,                    // Wait for animations
    diffThreshold: 0.063,          // ~16/255 for anti-aliasing differences
    viewports: [
      { width: 320, height: 568 }, // Mobile
      { width: 768, height: 1024 }, // Tablet
      { width: 1280, height: 800 }  // Desktop
    ],
    pauseAnimationAtEnd: true,
    forcedColors: 'none'           // Natural color rendering for OKLCH validation
  }
} : {})
```

### Theme Switching Pattern

**Preview Decorator:**
```tsx
// .storybook/preview.tsx lines 58-76
decorators: [
  (Story, context) => {
    const isDark = context.globals.theme === 'dark';
    return (
      <div
        className={isDark ? 'dark' : ''}
        style={{
          background: 'var(--background)',
          color: 'var(--foreground)',
          padding: '2rem',
          minHeight: '100vh',
        }}
      >
        <Story />
      </div>
    );
  },
]
```

**Chromatic Modes:**
```tsx
// .storybook/preview.tsx lines 16-28
chromatic: {
  modes: {
    light: { theme: 'light' },
    dark: {
      theme: 'dark',
      globals: { theme: 'dark' }
    }
  }
}
```
- Automatically captures **both light and dark mode** snapshots for every story
- Essential for validating OKLCH color system across themes

### Story Pattern Analysis

**Button Story Pattern** (326 lines, 40+ variants):
```tsx
// button.stories.tsx
export const Default: Story = {
  args: { children: 'Button', variant: 'default', size: 'default' }
};
// Each variant × size combination gets dedicated story
```
- Exhaustive coverage: 6 variants (default, destructive, outline, secondary, ghost, link)
- All sizes tested (default, sm, lg, icon)
- State variations (disabled, loading)
- Icon placement examples (left, right, both)

**Badge Story Pattern** (338 lines, 40+ variants):
```tsx
// badge.stories.tsx
export const StatusNew: Story = {
  args: { children: 'NEW', variant: 'default' }
};
// Semantic usage examples (status, category, priority, environment, role)
```
- Status badges, number badges, category badges
- Grouped badge showcases
- Icon integration examples

**Alert Story Pattern** (398 lines, 30+ variants):
```tsx
// alert.stories.tsx
export const WithErrorIcon: Story = {
  render: () => (
    <div className="w-[400px]">
      <Alert variant="destructive">
        <AlertCircle />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Message here</AlertDescription>
      </Alert>
    </div>
  )
};
```
- Complex render functions for composite components
- Accessibility examples (`aria-live`, `role="alert"`)
- Custom styling and custom colors (should use semantic variables)

## Edge Cases & Gotchas

### Missing Tag Component Stories

**Critical Gap:** Tag components (`TagChip`, `TagDialog`) have **zero stories** despite being central to color system migration.

**TagChip Component Analysis** (`/src/atomic-crm/tags/TagChip.tsx`):
- **Color dependency:** Uses `getTagColorClass(tag.color)` to map semantic color names to CSS classes
- **Interactive states:** Hover, focus, click to edit, remove button
- **Modal integration:** Opens `TagEditModal` on click
- **Accessibility:** Has `role="button"`, `tabIndex`, keyboard handlers
- **Why story needed:** Must validate all 8 tag colors (warm, yellow, pink, green, teal, blue, purple, gray) in light/dark themes = **16 snapshot combinations minimum**

**TagDialog Component Analysis** (`/src/atomic-crm/tags/TagDialog.tsx`):
- **Color picker:** Renders all 8 colors from `VALID_TAG_COLORS` as `RoundButton` components
- **Validation:** Uses `validateTagColor()` to ensure only semantic names accepted
- **Normalization:** `normalizeColorToSemantic()` converts legacy hex to semantic names
- **Form states:** Empty, filled, validation error, disabled
- **Why story needed:** Must validate color picker rendering, selection states, error states across themes

### Chromatic Workflow Disabled

**File:** `.github/workflows/chromatic.yml.disabled`

**Why disabled:**
- Likely awaiting `CHROMATIC_PROJECT_TOKEN` secret setup
- Comprehensive workflow ready (142 lines, well-documented)
- PR comment integration, build summary, OKLCH color validation checklist

**Activation requirements:**
1. Add `CHROMATIC_PROJECT_TOKEN` to GitHub secrets
2. Rename file to `.github/workflows/chromatic.yml` (remove `.disabled`)
3. Ensure tag component stories exist before first run

**Workflow features:**
- Only runs on non-draft PRs
- `onlyChanged: true` - Only snapshots changed stories (saves Chromatic credits)
- `exitZeroOnChanges: true` - Visual changes don't fail CI build
- Full git history (`fetch-depth: 0`) for change detection
- PR comment with OKLCH color validation checklist

### A11y Addon Not Visible

**Installed but not configured:**
```bash
@storybook/addon-a11y@9.1.10
```

**Issue:** Addon is listed in `main.js` but doesn't appear in Storybook UI by default.

**Why this matters:** Color contrast validation for OKLCH colors requires a11y addon to:
- Check WCAG 2.1 contrast ratios
- Validate color-blind friendly palettes
- Test semantic color variable usage

**Fix needed:** Add a11y panel to `.storybook/main.js`:
```javascript
addons: [
  '@chromatic-com/storybook',
  '@storybook/addon-docs',
  {
    name: '@storybook/addon-a11y',
    options: {
      // Enable by default
      element: '#storybook-root',
    }
  },
  '@storybook/addon-onboarding'
]
```

### Hard-coded Colors in Alert Stories

**Example from `alert.stories.tsx` lines 70-79:**
```tsx
export const WithSuccessIcon: Story = {
  render: () => (
    <div className="w-[400px]">
      <Alert className="border-green-200 text-green-800 [&>svg]:text-green-600">
        <CheckCircle2 />
        <AlertTitle>Success!</AlertTitle>
        <AlertDescription>Message here</AlertDescription>
      </Alert>
    </div>
  )
};
```

**Violation:** Uses hard-coded Tailwind colors (`green-200`, `green-800`, `green-600`) instead of semantic variables.

**Should use:**
```tsx
className="border-success-subtle bg-success-subtle text-success-strong [&>svg]:text-success-default"
```

**Impact on migration:** These stories will break visual regression tests when hard-coded colors are replaced with OKLCH semantic variables. Stories need updating to use semantic classes.

### Missing Component Coverage

**33 UI components without stories** (59% uncovered):
- `breadcrumb.tsx` - Navigation breadcrumbs
- `drawer.tsx` - Slide-out drawer (like sheet but different)
- `label.tsx` - Form label
- `pagination.tsx` - Pagination controls
- `sidebar.tsx` - Complex sidebar component (21KB file, likely multi-variant)
- `skeleton.tsx` - Loading skeleton
- `spinner.tsx` - Loading spinner
- `table.tsx` - Table component
- `textarea.tsx` - Multi-line text input
- `VirtualizedList.tsx` - Performance-optimized list

**Most critical missing:** `sidebar.tsx` (21KB), `table.tsx`, `pagination.tsx` - likely use many color variables

### Storybook Template Stories

**Legacy files in `/src/stories/`:**
- `Page.stories.ts`
- `Header.stories.ts`
- `Button.stories.ts`

**Issue:** These are Storybook default template files, not actual component stories.

**Cleanup needed:** Delete `/src/stories/` directory, as all real stories are in `/src/components/ui/*.stories.tsx`

## Relevant Docs

### Internal Documentation
- `/home/krwhynot/Projects/atomic/.docs/plans/color-system-migration/requirements.md` - Migration requirements
- `/home/krwhynot/Projects/atomic/.docs/plans/color-system-migration/gap-analysis.md` - Color system gaps
- `/home/krwhynot/Projects/atomic/.docs/plans/color-system-migration/validation-strategy.md` - Validation approach
- `/home/krwhynot/Projects/atomic/.docs/plans/color-system-migration/current-state-analysis.md` - Current state

### External Documentation
- [Storybook 9.x Documentation](https://storybook.js.org/docs/react/get-started/introduction) - Latest Storybook API
- [Chromatic Visual Testing](https://www.chromatic.com/docs/) - Visual regression testing guide
- [@storybook/addon-a11y](https://storybook.js.org/addons/@storybook/addon-a11y) - Accessibility testing addon
- [OKLCH Color Space](https://oklch.com/) - Perceptual color space reference
- [WCAG 2.1 Contrast](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html) - Contrast requirements

### Package.json Scripts
```bash
npm run storybook              # Start dev server on port 6006
npm run build-storybook        # Build static Storybook site
npm run chromatic              # Run Chromatic with --exit-zero-on-changes
npm run chromatic:ci           # Run Chromatic with --only-changed for CI
```

## Component Coverage Summary

### Button/Badge/Alert Coverage

**Button:** 40+ stories covering:
- All 6 variants × 4 sizes = 24 size/variant combinations
- All disabled states (3 stories)
- Icon placement variations (5 stories)
- Loading state
- Long text handling
- Total: ~35 stories

**Badge:** 40+ stories covering:
- All 4 variants (default, secondary, destructive, outline)
- Icon integration (4 stories)
- Status badges (4 stories)
- Number/version badges (3 stories)
- Category badges (4 stories)
- Priority badges (3 stories)
- Environment badges (3 stories)
- Role badges (3 stories)
- Grouped showcase
- Total: ~30 stories

**Alert:** 30+ stories covering:
- Basic variants (2 stories)
- With icons (5 stories)
- Content variations (3 stories)
- With actions (3 stories)
- Accessibility examples (2 stories)
- Custom styling (2 stories)
- Status examples (3 stories)
- Total: ~25 stories

### Tag Components Coverage: ZERO

**Missing stories for:**
1. `TagChip` - 0 stories (needs 8 color × 2 themes = 16 minimum)
2. `TagDialog` - 0 stories (needs color picker, form states, validation)
3. `RoundButton` - 0 stories (needs all 8 colors, selected/unselected states)

**Why this is critical:**
- Tag components are the **primary visual manifestation** of the color system migration
- 8 semantic colors defined in `VALID_TAG_COLORS`: warm, yellow, pink, green, teal, blue, purple, gray
- Each color must be validated in light/dark themes
- Color picker in `TagDialog` renders all colors simultaneously - perfect for snapshot testing
- **Without stories, color system migration cannot be visually validated**

## Chromatic Workflow Details

**File:** `.github/workflows/chromatic.yml.disabled`

**Key Configuration:**
```yaml
# Lines 43-52
- name: 📸 Run Chromatic
  uses: chromaui/action@v1
  with:
    projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
    exitOnceUploaded: true
    onlyChanged: true              # Only snapshot changed stories
    autoAcceptChanges: false       # Require manual approval
    exitZeroOnChanges: true        # Don't fail CI on visual changes
    buildScriptName: false         # Manually built above
    storybookBuildDir: storybook-static
```

**PR Comment Template** (lines 68-92):
- Shows pass/fail status with emoji
- Links to Chromatic build
- **OKLCH Color Validation Checklist:**
  - 10 Neutrals (neutral-50 through neutral-900)
  - 5 Brand greens (brand-100, 300, 500, 700, 800)
  - 12 Semantic colors (success/warning/error/info in subtle/default/strong)
  - 2 Accent colors (purple, teal)
  - **8 Tag colors** (warm/green/teal/blue/purple/yellow/gray/pink with bg/fg pairs)
  - 5 Chart colors
  - Light/dark mode coverage
  - Semantic variable mappings

**What this tells us:**
- Workflow author **already anticipated tag color validation** (line 84: "8 Tag colors")
- Expected to validate all 8 tag colors with bg/fg pairs
- **Tag component stories are required** to fulfill this checklist

## npm Scripts Analysis

**Storybook Commands:**
```json
"storybook": "storybook dev -p 6006",
"build-storybook": "storybook build",
"chromatic": "chromatic --exit-zero-on-changes",
"chromatic:ci": "chromatic --only-changed --exit-once-uploaded"
```

**Usage patterns:**
- `npm run storybook` - Local development, hot reload
- `npm run build-storybook` - Generates static site in `/storybook-static`
- `npm run chromatic` - Manual Chromatic upload, doesn't fail on changes
- `npm run chromatic:ci` - CI-optimized, only changed stories, exit after upload

**No separate Chromatic config file:**
- All Chromatic settings in `.storybook/main.js` under `process.env.CHROMATIC` condition
- No `chromatic.config.json` or `.chromatic.json`
- Configuration is **inline with Storybook config** (good for single source of truth)

## Installed Addons

**From `package.json` devDependencies:**
```json
"@chromatic-com/storybook": "^4.1.1",     // Visual regression integration
"@storybook/addon-a11y": "^9.1.10",       // Accessibility testing
"@storybook/addon-docs": "^9.1.10",       // Auto-generated documentation
"@storybook/addon-onboarding": "^9.1.10", // First-time user guide
"@storybook/react-vite": "^9.1.10",       // React + Vite framework
"chromatic": "^11.18.1",                  // Chromatic CLI
"eslint-plugin-storybook": "^9.0.13",     // ESLint rules for stories
"storybook": "^9.1.10"                    // Core Storybook
```

**All addons properly installed** - no missing dependencies.

**Addon configuration in `.storybook/main.js`:**
- All 4 addons registered
- A11y addon installed but may need explicit configuration to show in UI
- Chromatic addon provides integration with chromatic CLI

## Recommendations for Tag Component Stories

### Priority 1: TagChip Stories

Create `/src/atomic-crm/tags/TagChip.stories.tsx`:
```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { TagChip } from './TagChip';
import { VALID_TAG_COLORS } from '@/lib/color-types';

const meta = {
  title: 'CRM/Tags/TagChip',
  component: TagChip,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof TagChip>;

export default meta;
type Story = StoryObj<typeof meta>;

// Story for each of the 8 colors
export const Warm: Story = {
  args: {
    tag: { id: 1, name: 'Customer', color: 'warm' },
    onUnlink: async () => console.log('Unlinked'),
  }
};

export const Green: Story = { /* ... */ };
// ... (8 total color stories)

// Grouped showcase
export const AllColors: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {VALID_TAG_COLORS.map(color => (
        <TagChip
          key={color}
          tag={{ id: 1, name: color, color }}
          onUnlink={async () => {}}
        />
      ))}
    </div>
  )
};
```

**Expected snapshots:** 8 colors × 2 themes × 3 viewports = **48 snapshots**

### Priority 2: TagDialog Stories

Create `/src/atomic-crm/tags/TagDialog.stories.tsx`:
```tsx
export const CreateMode: Story = {
  args: {
    open: true,
    title: 'Create Tag',
    tag: undefined,
    onSubmit: async (tag) => console.log('Created', tag),
    onClose: () => console.log('Closed'),
  }
};

export const EditMode: Story = {
  args: {
    open: true,
    title: 'Edit Tag',
    tag: { name: 'Important', color: 'warm' },
    onSubmit: async (tag) => console.log('Updated', tag),
    onClose: () => console.log('Closed'),
  }
};

// Color picker showcase (most important for OKLCH validation)
export const ColorPickerShowcase: Story = {
  args: { open: true, /* ... */ }
};
```

**Expected snapshots:** 3 states × 2 themes × 3 viewports = **18 snapshots**

### Priority 3: Missing UI Component Stories

Focus on components likely to use many color variables:
1. `sidebar.stories.tsx` - Complex component (21KB file)
2. `table.stories.tsx` - Likely uses many semantic colors
3. `pagination.stories.tsx` - Interactive states
4. `skeleton.stories.tsx` - Loading states with muted colors
5. `spinner.stories.tsx` - Loading indicator

## Activation Checklist

To enable visual regression testing for color system migration:

- [ ] Create `TagChip.stories.tsx` with all 8 color variants
- [ ] Create `TagDialog.stories.tsx` with color picker showcase
- [ ] Add `CHROMATIC_PROJECT_TOKEN` to GitHub secrets
- [ ] Rename `.github/workflows/chromatic.yml.disabled` → `chromatic.yml`
- [ ] Update hard-coded color classes in `alert.stories.tsx` to semantic variables
- [ ] Configure a11y addon to show in Storybook UI
- [ ] Delete legacy `/src/stories/` directory
- [ ] Run `npm run chromatic` locally to establish baseline
- [ ] Create PR to validate workflow runs correctly

**Estimated effort:** 4-6 hours for tag component stories + 2 hours for workflow setup = **1 day total**
