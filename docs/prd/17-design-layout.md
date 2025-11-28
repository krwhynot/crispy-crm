---
> **⚠️ SUPERSEDED**: See `../PRD.md` v1.18 Section 9 (UI/UX Guidelines) for current requirements.

**Part of:** Crispy-CRM Product Requirements Document (v1.5 - ARCHIVED)
**Category:** Design System
**Document:** 17-design-layout.md

**Related Documents:**
- 📋 [README - Master Index](./00-README.md)
- 🎨 [Design Tokens](./15-design-tokens.md)
- 🧩 [Design Components](./16-design-components.md)
- 🎯 [Opportunities Feature - Kanban Board](./04-opportunities.md)
- 📊 [Dashboards](./09-dashboards.md)
- 🔍 [Search & Filtering](./10-search-filtering.md)
---

## 📊 Implementation Status

**Last Updated:** November 4, 2025

| Metric | Status |
|--------|--------|
| **Completion** | ✅ **85%** |
| **Confidence** | 🟢 **HIGH** - Strong accessibility foundation |
| **Files** | 80+ with accessibility features |
| **Responsive Design** | 90% - iPad-first patterns throughout |
| **Touch Targets** | 95% - Exceeds 48px minimum (often 56-64px) |
| **ARIA Compliance** | 85% - Comprehensive labeling and focus |
| **Keyboard Nav** | 95% - Full shortcut system implemented |
| **WCAG 2.1 AA** | 80-85% estimated compliance |

**Completed Requirements:**

**Responsive Design (90%):**
- ✅ Grid/flexbox layouts with breakpoints (32+ files: Dashboard.tsx, MetricsCardGrid.tsx, OpportunityInputs.tsx)
- ✅ iPad-first approach: `md:` (768px), `lg:` (1024px), `xl:` (1280px)
- ✅ Responsive columns: 1 → 2 → 3 → 4 as screen size increases
- ✅ Consistent patterns across all modules

**Touch Target Sizes (95%):**
- ✅ Buttons: 48px height (button.tsx:25)
- ✅ Inputs: min-h-48px (input.tsx:11)
- ✅ Selects: min-h-48px (select.tsx:38)
- ✅ Table rows: 56px (exceeds 48px minimum)
- ✅ FAB: 64px mobile, 56px desktop (FloatingCreateButton.tsx:60)
- ✅ Textareas: 64px minimum

**Accessibility Features (85%):**
- ✅ ARIA attributes (75+ occurrences, 78 files)
- ✅ aria-label, aria-describedby, aria-required, aria-invalid throughout
- ✅ Screen reader support (sr-only class in 15 files)
- ✅ Focus management (36 files with focus-visible:ring-[3px] pattern)
- ✅ Focus trapping in dialogs (Radix UI primitives)
- ✅ Role attributes (alert, dialog, form groups)

**Keyboard Navigation (95%):**
- ✅ Global shortcuts system (KeyboardShortcutsProvider.tsx, useKeyboardShortcuts.ts)
- ✅ Ctrl/Cmd + S (Save), Ctrl/Cmd + N (New), Ctrl/Cmd + K (Search), Escape, Enter, Delete
- ✅ Cross-platform support (Mac/Windows detection)
- ✅ Context-aware shortcuts
- ✅ Discovery modal (KeyboardShortcutsModal.tsx)

**Form Validation (90%):**
- ✅ Zod schemas with react-hook-form (21 files)
- ✅ FormError component with ARIA (form.tsx:133)
- ✅ Visual error states: aria-invalid:ring-destructive/20
- ✅ Error boundary (error.tsx with role="alert")

**Missing Requirements (15%):**

| Task | Status | Confidence | Estimate |
|------|--------|-----------|----------|
| Add semantic landmarks (article, section, aside) | ⚠️ Partial | 🟢 HIGH | 1 day |
| Implement visible "Skip to main content" link | ⚠️ Partial | 🟢 HIGH | 2 hours |
| Apply prefers-reduced-motion to all animations | ⚠️ Partial | 🟢 HIGH | 4 hours |
| Add breadcrumb navigation to show/detail pages | ❌ Missing | 🟢 HIGH | 1 day |
| Verify table caption and scope attributes | ⚠️ Partial | 🟢 HIGH | 4 hours |

**Details:**
- **Strength:** Exceptional touch targets (exceeds PRD minimum), comprehensive keyboard navigation, strong ARIA implementation
- **Semantic HTML Gap:** Only 3 files use semantic landmarks (Layout.tsx has `<main id="main-content">`, Header.tsx uses `<nav>` and `<header>`)
- **Motion Reduction:** Only 1 file (App.css:30) respects prefers-reduced-motion
- **Breadcrumbs:** Pattern defined in PRD but not implemented in detail pages
- **Overall:** 80-85% WCAG 2.1 AA compliance estimated

**Blockers:** None

**Status:** Strong accessibility foundation with excellent keyboard navigation and touch target implementation. Needs semantic HTML improvements for full WCAG 2.1 AA compliance.

---

# 17. Design Layout & Accessibility

## 4.3 Layout & Navigation Structure

### Page Layout Template

```tsx
<div className="flex h-screen overflow-hidden">
  {/* Sidebar (collapsible on tablet) */}
  <aside className="w-64 bg-surface-raised border-r border-neutral-200">
    {/* Sidebar content */}
  </aside>

  {/* Main content area */}
  <div className="flex-1 flex flex-col overflow-hidden">
    {/* Top navigation bar */}
    <header className="h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-6">
      {/* Nav content */}
    </header>

    {/* Page content (scrollable) */}
    <main className="flex-1 overflow-y-auto bg-surface-base">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <nav className="mb-4">
          <ol className="flex items-center space-x-2 text-sm text-neutral-500">
            <li><a href="#" className="hover:text-primary-600">Organizations</a></li>
            <li>/</li>
            <li className="text-neutral-900">Ballyhoo Hospitality</li>
          </ol>
        </nav>

        {/* Page title & actions */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-neutral-900">Ballyhoo Hospitality</h1>
          <div className="flex space-x-3">
            <button className="secondary-button">Edit</button>
            <button className="primary-button">Add Opportunity</button>
          </div>
        </div>

        {/* Page content */}
        <div>
          {/* Content goes here */}
        </div>
      </div>
    </main>
  </div>
</div>
```

## 4.4 Responsive Design (iPad-First, Then Desktop)

### Breakpoints

```javascript
screens: {
  'sm': '640px',   // Small tablets
  'md': '768px',   // iPad portrait (PRIMARY TARGET)
  'lg': '1024px',  // iPad landscape, small laptops
  'xl': '1280px',  // Desktop
  '2xl': '1536px', // Large desktop
}
```

### iPad-First Approach

**Core Strategy:**
1. Design base styles for iPad portrait (768px-1023px)
2. Adapt down for smaller screens (640px-767px) if needed
3. Enhance up for desktop (1024px+)

**Layout Adaptations:**

```tsx
// Sidebar: Hidden on iPad portrait, visible on landscape/desktop
<aside className="hidden lg:block w-64">
  {/* Sidebar */}
</aside>

// Hamburger menu: Visible on iPad portrait, hidden on desktop
<button className="lg:hidden">
  <MenuIcon />
</button>

// Table to cards: Table on desktop, cards on iPad portrait
<div className="hidden lg:block">
  <Table /> {/* Desktop: Full table */}
</div>
<div className="lg:hidden">
  <CardGrid /> {/* iPad portrait: Card grid */}
</div>

// Grid columns: Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  {/* Cards */}
</div>
```

**Touch Targets (iPad Optimizations - Essential):**
- **Minimum touch target: 48x48px** (larger than Apple HIG for better usability)
- **Buttons:** `min-h-[48px] px-6` (increased padding for easier tapping)
- **Table rows:** `min-h-[56px]` (more vertical space for touch)
- **Dropdown items:** `py-3` (increased vertical padding)
- **Checkbox/Radio:** Scale to 20x20px with 48px tap area
- **Icon buttons:** 48x48px tap area even if icon is 24x24px
- **Link spacing:** Minimum 8px between clickable elements
- **List items:** Minimum 52px height for comfortable touch

**Touch-Specific UI Adjustments:**
- **Floating Action Button (FAB):** 56x56px for primary actions
- **Tab bar items:** Minimum 48px height
- **Modal close buttons:** 48x48px in top corner
- **Form inputs:** 48px minimum height with 16px font size
- **Swipeable list items:** Full row height as touch target

**No Advanced Gestures in MVP:**
- No swipe to delete (use explicit delete button)
- No pull to refresh (use manual refresh button)
- No pinch to zoom (not needed for MVP)

**Typography Scaling:**
```tsx
// Headings scale down slightly on tablet
<h1 className="text-2xl md:text-3xl font-bold">Page Title</h1>
<h2 className="text-xl md:text-2xl font-semibold">Section Title</h2>
```

### Kanban Board Responsiveness

```tsx
// Desktop: Full horizontal board
<div className="hidden lg:flex space-x-4 overflow-x-auto">
  {stages.map(stage => (
    <div key={stage.id} className="flex-shrink-0 w-80">
      {/* Stage column */}
    </div>
  ))}
</div>

// iPad: Scrollable horizontal board with smaller cards
<div className="lg:hidden flex space-x-3 overflow-x-auto pb-4">
  {stages.map(stage => (
    <div key={stage.id} className="flex-shrink-0 w-64">
      {/* Smaller stage column */}
    </div>
  ))}
</div>
```

## 4.5 Accessibility Requirements (WCAG 2.1 AA)

### Color Contrast

**Minimum Ratios:**
- Normal text (16px): 4.5:1
- Large text (24px or 18px bold): 3:1
- UI components and graphics: 3:1

**Verification:**
- Use OKLCH color picker to ensure sufficient lightness contrast
- Test all text/background combinations
- Provide alternative indicators beyond color (icons, labels)

### Keyboard Navigation

**Focus Management:**
```tsx
// Visible focus indicator
<button className="focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
  Click Me
</button>

// Skip to main content link
<a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-500 focus:text-white">
  Skip to main content
</a>
```

**Keyboard Shortcuts:**
- Tab: Navigate forward through interactive elements
- Shift+Tab: Navigate backward
- Enter/Space: Activate buttons and links
- Escape: Close modals, dropdowns, cancel actions
- Arrow keys: Navigate within lists, tables, dropdowns

**Focus Trapping:**
- Modal/drawer open: Focus trap within modal
- Modal close: Return focus to trigger element

### Screen Reader Support

**ARIA Labels:**
```tsx
// Button with icon only
<button aria-label="Edit organization">
  <PencilIcon className="w-5 h-5" />
</button>

// Form input
<label htmlFor="email" className="sr-only">Email</label>
<input
  id="email"
  type="email"
  aria-describedby="email-helper"
  aria-invalid={hasError}
  aria-required={true}
/>
<p id="email-helper" className="text-xs text-neutral-500">
  We'll never share your email
</p>

// Dynamic content updates
<div role="status" aria-live="polite" aria-atomic="true">
  {/* Success/error messages appear here */}
</div>

// Loading state
<div role="status" aria-live="polite">
  <span className="sr-only">Loading opportunities...</span>
  <SpinnerIcon />
</div>
```

**Semantic HTML:**
- Use `<button>` for buttons, not `<div onclick>`
- Use `<a>` for links with `href`
- Use `<nav>`, `<main>`, `<aside>`, `<header>`, `<footer>` landmarks
- Use `<table>` for tabular data with proper `<thead>`, `<tbody>`, `<th>`

### Form Accessibility

```tsx
<form>
  {/* Fieldset for grouped inputs */}
  <fieldset className="space-y-4">
    <legend className="text-lg font-semibold text-neutral-900">Contact Information</legend>

    <div>
      <label htmlFor="name" className="block text-sm font-medium text-neutral-700">
        Full Name <span aria-label="required">*</span>
      </label>
      <input
        type="text"
        id="name"
        aria-required="true"
        aria-invalid={errors.name ? "true" : "false"}
        aria-describedby={errors.name ? "name-error" : undefined}
      />
      {errors.name && (
        <p id="name-error" role="alert" className="text-xs text-error mt-1">
          {errors.name}
        </p>
      )}
    </div>
  </fieldset>

  <button type="submit" aria-label="Create contact">Create Contact</button>
</form>
```

### Testing Checklist

- [ ] All interactive elements keyboard accessible
- [ ] Focus indicators visible and meet contrast ratios
- [ ] Screen reader announces all content correctly
- [ ] Form errors announced to screen readers
- [ ] Color is not the only indicator of meaning
- [ ] Images have alt text (or aria-label)
- [ ] Animations respect `prefers-reduced-motion`
- [ ] Zoom to 200% without loss of functionality
- [ ] Text can be resized without breaking layout

## 4.6 Keyboard Shortcuts (Basic)

### Basic Keyboard Shortcuts

**Global Shortcuts (Available Everywhere):**
- **Ctrl/Cmd + S**: Save current form
- **Ctrl/Cmd + N**: New (create new record in current module)
- **Escape**: Cancel/close current modal or drawer
- **Ctrl/Cmd + /**: Open search (focus global search bar)
- **Ctrl/Cmd + K**: Quick search (alternative to Ctrl+/)

**Form Shortcuts:**
- **Enter**: Submit form (when not in textarea)
- **Tab**: Move to next field
- **Shift + Tab**: Move to previous field
- **Escape**: Cancel and close form

**List View Shortcuts:**
- **Arrow Up/Down**: Navigate between rows
- **Enter**: Open selected record
- **Space**: Select/deselect for bulk actions
- **Delete**: Delete selected (with confirmation)

**No Advanced Shortcuts in MVP:**
- No customizable shortcuts
- No command palette
- No vim-style navigation
- No multi-key combinations (except Ctrl/Cmd modifiers)

**Shortcut Discovery:**
- Small "Keyboard shortcuts" link in footer
- Opens modal showing all available shortcuts
- Grouped by context (Global, Forms, Lists)
- No in-line hints on buttons (keeps UI clean)
