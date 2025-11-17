# Unified Design System Rollout

**Date:** 2025-11-16
**Status:** Design Complete
**Author:** Claude (with human refinement)
**Type:** Visual Consistency & UX Modernization

## Executive Summary

Transform Atomic CRM into a visually cohesive, premium-feeling application by applying the polished design patterns from Dashboard V2 and Contacts across all pages. This design standardizes list views with tables, implements slide-over panels for view/edit operations, maintains full-page forms for creation, and applies consistent visual styling throughout.

## Vision

Create a unified, professional CRM experience where every page follows the same design language, interaction patterns, and visual polish - making the application feel cohesive, modern, and premium.

## Core Design Principles

### 1. Visual Consistency
- Single design language across all resources (Contacts, Organizations, Opportunities, Tasks, Sales, Products)
- Unified color palette, spacing, and interaction patterns
- Professional, modern aesthetic with subtle polish

### 2. Layout Standardization
- **List views**: Left sidebar filters + main content area with tables
- **View/Edit**: Slide-over panels from right (keeps context, modern UX)
- **Create**: Full-page forms (clear "new record" experience, more space for complex inputs)

### 3. Premium Interactivity
- Smooth hover transitions on all clickable elements
- Shadow elevation on hover for depth
- Subtle lift animation (`-translate-y-0.5`) for tactile feedback
- Border state changes (transparent → visible) for focus indication

### 4. Information Density
- Moderate spacing (Dashboard V2 pattern: `p-3`, `gap-3`)
- Tables for list views (better information density than cards)
- Clean, breathable layouts that don't feel cramped

### 5. Light & Airy Aesthetic
- More `bg-muted` backgrounds for pages
- White/light cards (`bg-card`) for content containers
- Generous use of border radius (`rounded-lg`, `rounded-xl`)
- Subtle shadows for depth without heaviness

## List View Specification

### Layout Structure

Every list page follows this standardized pattern:

```
┌─────────────────────────────────────────────────────┐
│ Page Title (hidden via title={false})               │
│ TopToolbar (Sort, Export, Create buttons)           │
├────────────┬────────────────────────────────────────┤
│ Filters    │ Main Content Area                      │
│ Sidebar    │                                        │
│ (256px)    │ Card Container (bg-card)               │
│            │ ├─ Table (premium hover effects)       │
│            │ └─ Pagination                          │
│            │                                        │
│            │ FloatingCreateButton (bottom-right)    │
└────────────┴────────────────────────────────────────┘
```

### Component Breakdown

**1. Standardized List Shell** (`StandardListLayout.tsx`)
```tsx
<div className="flex flex-row gap-6">
  <aside
    aria-label="Filter {resource}"
    className="filter-sidebar sticky top-[var(--spacing-section)] h-fit"
  >
    <div className="card-container p-2">
      {filterComponent}
    </div>
  </aside>
  <main role="main" aria-label="{Resource} list" className="flex-1 min-w-0">
    <div className="card-container">
      {children} {/* Table content */}
    </div>
  </main>
</div>
```

**2. Premium Table Row Styling** (`.table-row-premium`)
- Rounded corners with transparent border
- Hover effects: border reveal, shadow, lift animation
- Active state: scale feedback
- Focus state: ring indicator
- Applied via `PremiumDatagrid` wrapper's `rowClassName` prop

**3. Filter Sidebar Pattern**
- Fixed width: `w-64` (256px)
- Sticky positioning for long lists
- Consistent filter components
- Active filter count badge
- "Clear all filters" button when filters active

**4. Table Specifications**
- Use React Admin `<Datagrid>` with custom styling
- Checkbox column for bulk actions
- Column headers with sort indicators
- Row click navigates to slide-over (not full page)
- Premium hover effects on every row

## Slide-Over Pattern for View/Edit

### Pattern Overview

Clicking any table row or "View" button opens a right slide-over panel (modeled after Dashboard V2's `RightSlideOver.tsx`). This replaces traditional full-page navigation for viewing and editing records.

### Component API (`ResourceSlideOver.tsx`)

**Props Interface:**
```typescript
interface ResourceSlideOverProps {
  resource: string;           // Resource name (e.g., "contacts", "organizations")
  recordId: number | null;   // ID of record to display
  isOpen: boolean;           // Slide-over visibility
  onClose: () => void;       // Close handler
  mode?: 'view' | 'edit';    // Initial mode (default: 'view')
  tabs?: TabConfig[];        // Resource-specific tab configuration
}

interface TabConfig {
  key: string;
  label: string;
  component: React.ComponentType<{ record: any; mode: 'view' | 'edit' }>;
  icon?: React.ComponentType;
}
```

**Hook Usage (`useSlideOverState`):**
```typescript
function useSlideOverState() {
  const [slideOverId, setSlideOverId] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'view' | 'edit'>('view');

  // Parse URL params on initial load to support deep linking
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewId = params.get('view');
    const editId = params.get('edit');

    if (viewId) {
      setSlideOverId(Number(viewId));
      setMode('view');
      setIsOpen(true);
    } else if (editId) {
      setSlideOverId(Number(editId));
      setMode('edit');
      setIsOpen(true);
    }
  }, []); // Run once on mount

  // Listen to browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const viewId = params.get('view');
      const editId = params.get('edit');

      if (viewId) {
        setSlideOverId(Number(viewId));
        setMode('view');
        setIsOpen(true);
      } else if (editId) {
        setSlideOverId(Number(editId));
        setMode('edit');
        setIsOpen(true);
      } else {
        // No params means slide-over should be closed
        setIsOpen(false);
        setSlideOverId(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Handle ESC key to close slide-over
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeSlideOver();
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen]);

  const openSlideOver = (id: number, initialMode: 'view' | 'edit' = 'view') => {
    setSlideOverId(id);
    setMode(initialMode);
    setIsOpen(true);
    // Update URL for deep linking and browser history
    const params = new URLSearchParams(window.location.search);
    // Clear both view and edit params first
    params.delete('view');
    params.delete('edit');
    // Set the new param
    params.set(initialMode, String(id));
    window.history.pushState(null, '', `${window.location.pathname}?${params}`);
  };

  const closeSlideOver = () => {
    setIsOpen(false);
    setSlideOverId(null);
    // Remove slide-over params from URL
    const params = new URLSearchParams(window.location.search);
    params.delete('view');
    params.delete('edit');
    const newUrl = params.toString()
      ? `${window.location.pathname}?${params}`
      : window.location.pathname;
    window.history.pushState(null, '', newUrl);
  };

  const toggleMode = () => {
    const newMode = mode === 'view' ? 'edit' : 'view';
    setMode(newMode);
    // Update URL when mode changes
    if (slideOverId) {
      const params = new URLSearchParams(window.location.search);
      params.delete('view');
      params.delete('edit');
      params.set(newMode, String(slideOverId));
      window.history.replaceState(null, '', `${window.location.pathname}?${params}`);
    }
  };

  return { slideOverId, isOpen, mode, openSlideOver, closeSlideOver, setMode, toggleMode };
}
```

**Usage Example:**
```typescript
function ContactList() {
  const { slideOverId, isOpen, mode, openSlideOver, closeSlideOver, toggleMode } = useSlideOverState();

  return (
    <>
      <Datagrid rowClick={(id) => openSlideOver(id)}>
        {/* columns */}
      </Datagrid>

      <ResourceSlideOver
        resource="contacts"
        recordId={slideOverId}
        isOpen={isOpen}
        onClose={closeSlideOver}
        mode={mode}
        onModeToggle={toggleMode} // Allow switching between view/edit
        tabs={contactTabs}
      />
    </>
  );
}

// The hook now provides:
// - Deep linking support: Share URLs like /contacts?view=123
// - Browser navigation: Back/forward buttons work correctly
// - ESC key handling: Closes slide-over instantly
// - Mode persistence: URL updates when toggling view/edit
// - Clean URLs: Removes params when closing, preserves others
```

**🔄 URL Sync Flow Diagram:**
```
┌─────────────────────────────────────────────────────────────┐
│ USER ACTION               │ HOOK BEHAVIOR                   │
├───────────────────────────┼─────────────────────────────────┤
│ 1. Direct URL navigation  │ useEffect (mount) reads params  │
│    /contacts?view=123     │ → Sets slideOverId=123,         │
│                           │   mode='view', isOpen=true      │
├───────────────────────────┼─────────────────────────────────┤
│ 2. Click table row        │ openSlideOver(123, 'view')      │
│                           │ → Pushes ?view=123 to URL       │
│                           │ → Opens slide-over in view mode │
├───────────────────────────┼─────────────────────────────────┤
│ 3. Toggle edit mode       │ toggleMode()                    │
│                           │ → Replaces ?view=123 with       │
│                           │   ?edit=123 (no page reload)    │
├───────────────────────────┼─────────────────────────────────┤
│ 4. Press browser back     │ popstate listener fires         │
│                           │ → Reads URL params              │
│                           │ → Reopens previous slide-over   │
│                           │   OR closes if no params        │
├───────────────────────────┼─────────────────────────────────┤
│ 5. Press ESC key          │ closeSlideOver()                │
│                           │ → Removes ?view/?edit from URL  │
│                           │ → Closes slide-over             │
│                           │ → Preserves other query params  │
└───────────────────────────┴─────────────────────────────────┘

**Key Implementation Details:**
- Lines 142-157: Mount effect reads initial URL state
- Lines 159-183: Popstate listener handles browser navigation
- Lines 186-195: ESC key listener calls closeSlideOver
- Lines 197-209: openSlideOver pushes new history state
- Lines 211-222: closeSlideOver removes params cleanly
- Lines 224-235: toggleMode replaces state for mode changes
```

### Visual Specifications

**Panel Dimensions**
- Width: `40vw` (min: 480px, max: 720px)
- Height: Full viewport (`h-screen`)
- Slides in from right with smooth transition (200ms ease-out)

**Panel Structure**
```
┌─────────────────────────────────────┐
│ Header                              │
│ ├─ Record title/name                │
│ ├─ Edit mode toggle button          │
│ └─ Close button (X)                 │
├─────────────────────────────────────┤
│ Tabs (horizontal)                   │
│ Details | History | Files | Notes   │
├─────────────────────────────────────┤
│                                     │
│ Tab Content Area                    │
│ (scrollable, padded)                │
│                                     │
│ [View mode: Read-only display]     │
│ [Edit mode: Form fields]            │
│                                     │
├─────────────────────────────────────┤
│ Footer (edit mode only)             │
│ [Cancel] [Save Changes]             │
└─────────────────────────────────────┘
```

### Two Modes

**View Mode** (default when opening)
- Read-only data display
- "Edit" button in header switches to edit mode
- Clean, card-based layout for fields
- Related data sections

**Edit Mode** (toggled from header)
- Inline form fields using existing tabbed form components
- "Cancel" discards changes, returns to view mode
- "Save" persists changes, returns to view mode
- Validation errors display inline

### Navigation Behavior

**Opening**
- Table row click → opens slide-over in view mode
- Edit button in table row → opens slide-over in edit mode directly

**Closing**
- X button in header
- ESC key
- Click backdrop (optional dimmed overlay)
- Save/Cancel in edit mode

**URL Handling**
- Slide-over state syncs with URL query params: `?view=123` or `?edit=123`
- Direct URL navigation works (deep linking)
- Browser back/forward buttons close/open slide-over

**🔍 IMPLEMENTATION NOTE:**
All URL sync requirements above are **fully implemented** in the `useSlideOverState` hook (lines 136-238).
The hook provides:
- ✅ Initial URL param reading on mount (lines 142-157)
- ✅ Browser back/forward via `popstate` listener (lines 159-183)
- ✅ URL updates when opening/closing slide-over (lines 197-222)
- ✅ URL updates when toggling view/edit mode (lines 224-235)

**No additional code needed** - just use the hook as shown in the usage example (lines 243-263).

### Resource-Specific Tabs

- **Contacts**: Details | Activities | Notes | Files
- **Organizations**: Details | Contacts | Opportunities | Notes
- **Opportunities**: Details | History | Files | Activities
- **Tasks**: Details | Related Items
- **Sales**: Profile | Permissions
- **Products**: Details | Relationships

### Accessibility Requirements

**Focus Management**
- Focus trap when open (focus stays within slide-over)
- Focus moves to first interactive element on open (close button or first tab)
- Focus returns to triggering element when closed
- Tab/Shift+Tab cycles through slide-over elements only

**ARIA Attributes**
- `role="dialog"` on slide-over container
- `aria-modal="true"` to indicate modal behavior
- `aria-labelledby` pointing to header title
- `aria-describedby` for any helper text

**Keyboard Navigation**
- Tab: Move focus forward
- Shift+Tab: Move focus backward
- ESC: Close slide-over
- Enter/Space: Activate buttons and links

**Screen Reader Support**
- Announce slide-over opening
- Read record name and current mode (view/edit)
- Announce tab changes
- Read validation errors in edit mode

## Create Form Patterns

### Pattern Overview

Create operations use full-page forms (not slide-overs) to provide ample space for complex inputs, clear "new record" context, and reduced cognitive load.

### Layout Structure

```
┌─────────────────────────────────────────────────────┐
│ Breadcrumb Navigation                                │
│ Home > Resources > New {Resource}                    │
├─────────────────────────────────────────────────────┤
│                                                       │
│   ┌───────────────────────────────────────────┐    │
│   │ Card Container (centered, max-w-4xl)      │    │
│   │                                            │    │
│   │  Tabs (horizontal)                         │    │
│   │  General | Details | Other                 │    │
│   │  ────────────────────────────────────────  │    │
│   │                                            │    │
│   │  Tab Content (scrollable)                  │    │
│   │  [Form fields with validation]             │    │
│   │                                            │    │
│   │  ────────────────────────────────────────  │    │
│   │  Footer Actions                            │    │
│   │  [Cancel] [Save & Close] [Save & Add]     │    │
│   └───────────────────────────────────────────┘    │
│                                                       │
└─────────────────────────────────────────────────────┘
```

### Visual Specifications

**Page Container**
- Background: `bg-muted` (light, airy feel)
- Padding: `px-[var(--spacing-edge-desktop)] py-6`

**Form Card**
- Centered: `max-w-4xl mx-auto`
- Card styling: `.create-form-card` utility (includes `shadow-lg` elevation)
- Interior padding: included in utility class

**Footer Actions**
- Sticky footer: `sticky bottom-0 bg-card border-t border-border p-4`
- Button layout: Left (Cancel), Right (Save & Close, Save & Add Another)

### Quick-Add Variants

Some resources offer quick-add modals from list views:

- Modal dialog (not full-page)
- Single card, centered: `max-w-md`
- Minimal fields (name + 1-2 key fields)
- Used for: Tasks, Opportunities, Contacts, Organizations

### Form Behavior

**Validation**
- Zod schema validation (existing pattern: `src/atomic-crm/validation/`)
- Real-time validation on blur for critical fields
- Error display inline below fields with red border
- Error count badges on tabs (show count when > 0)
- Prevent submission until all required fields valid

**Save Actions**
- **Save & Close**: Creates record, redirects to list view with success toast
- **Save & Add Another**: Creates record, clears form, shows success toast, keeps on create page
- **Cancel**: Shows confirmation if form dirty ("You have unsaved changes. Discard?"), returns to list

**Dirty State Management**
- Track form modifications using React Hook Form's `isDirty`
- Warn on navigation attempts with unsaved changes
- Browser beforeunload event: "You have unsaved changes that will be lost"
- Cancel button shows confirmation only when dirty

**Optional Autosave**
- For complex forms (Opportunities, Organizations)
- Save draft to localStorage every 30 seconds when dirty
- Key format: `crm.draft.{resource}.{userId}`
- On form mount: check for draft, offer to restore ("Restore previous draft?")
- Clear draft on successful save
- Draft expiry: 7 days

**Field Defaults**
- Defaults from Zod schema (`.default()` methods)
- Form initialization: `zodSchema.partial().parse({})`
- Never use `defaultValue` prop in form components
- Date fields default to today for due dates, empty for others

## Visual Styling System

### Color Palette

**Strict semantic color usage** (no hex values):

- **Backgrounds**: `bg-muted` (page), `bg-card` (content), `bg-background` (nested)
- **Borders**: `border-border` (default), `border-primary` (focus), `border-destructive` (error)
- **Text**: `text-foreground`, `text-muted-foreground`, `text-primary`
- **Interactive**: `bg-primary`, `bg-secondary`, `bg-destructive`, `bg-accent`

### Spacing System

**Moderate density** (Dashboard V2 pattern):

- Extra tight: `p-1` `gap-1` (4px) - icon spacing
- Tight: `p-2` `gap-2` (8px) - compact lists
- **Standard**: `p-3` `gap-3` (12px) - most UI elements ✓
- Comfortable: `p-4` `gap-4` (16px) - form fields
- Spacious: `p-6` `gap-6` (24px) - cards, sections

**Semantic Spacing Variables** (AUTHORITATIVE - already defined in `src/index.css` lines 92-111):

**⚠️ CRITICAL IMPLEMENTATION NOTE:**
These values are the **AUTHORITATIVE SOURCE OF TRUTH** for spacing in the application.
They exactly match what's already implemented in `src/index.css` (lines 88-112).
**DO NOT CHANGE THESE VALUES** - they are desktop-optimized for data density.
The comments showing "Reduced from X" are historical references only, not targets to restore.

```css
@theme inline {
  /* Grid System - THESE ARE THE CORRECT VALUES */
  --spacing-grid-columns-desktop: 12;
  --spacing-grid-columns-ipad: 8;
  --spacing-gutter-desktop: 12px;    /* KEEP AT 12px (historical: was 24px) */
  --spacing-gutter-ipad: 20px;

  /* Edge Padding (Screen Borders) - THESE ARE THE CORRECT VALUES */
  --spacing-edge-desktop: 24px;      /* KEEP AT 24px (historical: was 120px) */
  --spacing-edge-ipad: 60px;
  --spacing-edge-mobile: 16px;

  /* Vertical Rhythm - THESE ARE THE CORRECT VALUES */
  --spacing-section: 24px;           /* KEEP AT 24px (historical: was 32px) */
  --spacing-widget: 16px;            /* KEEP AT 16px (historical: was 24px) */
  --spacing-content: 12px;           /* KEEP AT 12px (historical: was 16px) */
  --spacing-compact: 8px;            /* KEEP AT 8px (historical: was 12px) */

  /* Widget/Card Internals - THESE ARE THE CORRECT VALUES */
  --spacing-widget-padding: 12px;    /* KEEP AT 12px (historical: was 20px) */
  --spacing-widget-min-height: 240px;/* KEEP AT 240px (historical: was 280px) */
}

/* IMPLEMENTATION GUIDANCE:
   1. These values are ALREADY in src/index.css - do not override
   2. Use these CSS variables via Tailwind's arbitrary value syntax
   3. The "historical" values in comments are for context only
   4. Any restoration of larger spacing would break desktop data density */
```

Use these variables for consistent spacing:
- Edge padding: `px-[var(--spacing-edge-desktop)]`
- Content gaps: `gap-[var(--spacing-content)]`
- Section spacing: `mb-[var(--spacing-section)]`

### Tokenized Utility Classes

Location: `src/index.css` in `@layer components`

**⚠️ COMMON IMPLEMENTATION MISTAKES TO AVOID:**

1. **❌ WRONG: Using `@layer theme { :root { } }` syntax**
   ```css
   /* DON'T DO THIS - Invalid Tailwind v4 syntax */
   @layer theme {
     :root {
       --spacing-gutter-desktop: 24px;
     }
   }
   ```
   **✅ CORRECT: Use `@theme inline { }` syntax**
   ```css
   @theme inline {
     --spacing-gutter-desktop: 12px;
   }
   ```
   See lines 490-511 for authoritative spacing token values.

2. **❌ WRONG: Using Sass `@extend` syntax**
   ```css
   /* DON'T DO THIS - Sass not supported in PostCSS */
   .table-row-premium {
     @extend .interactive-card;
   }
   ```
   **✅ CORRECT: Comma-separated selectors with duplicated @apply**
   ```css
   .interactive-card,
   .table-row-premium {
     @apply rounded-lg border border-transparent;
     /* ... all shared styles ... */
   }
   ```
   See lines 537-545 for complete implementation pattern.

3. **❌ WRONG: Adding CSS properties directly without @apply**
   ```css
   /* DON'T DO THIS - Breaks Tailwind's utility-first approach */
   .my-card {
     border-radius: 8px;
     padding: 16px;
   }
   ```
   **✅ CORRECT: Use @apply with Tailwind utilities**
   ```css
   .my-card {
     @apply rounded-lg p-4;
   }
   ```

**CRITICAL: PostCSS/Tailwind Implementation Pattern**
The project uses plain PostCSS with Tailwind v4, which **does NOT support Sass features like @extend**.
To share styles between classes, you MUST duplicate the @apply statements:

```css
@layer components {
  /* Premium interactive card/row - shared styles for all premium hover effects */
  /* IMPORTANT: Both classes need identical @apply statements (no @extend in PostCSS!) */
  .interactive-card,
  .table-row-premium {
    @apply rounded-lg border border-transparent bg-card px-3 py-1.5;
    @apply transition-all duration-150;
    @apply hover:border-border hover:shadow-md;
    @apply motion-safe:hover:-translate-y-0.5;
    @apply active:scale-[0.98];
    @apply focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2;
  }

  /* Implementation Pattern:
     - DO: List both classes with comma separation, duplicate all @apply rules
     - DON'T: Try to use @extend (Sass-only), @mixin (Sass-only), or CSS custom properties for complex rules
     - WHY: PostCSS processes @apply at build time but doesn't support Sass preprocessing

     Usage:
     - .interactive-card for standalone clickable cards (e.g., contact cards, dashboard widgets)
     - .table-row-premium for Datagrid rows via rowClassName prop (maintains semantic clarity) */

  /* Standard card container */
  .card-container {
    @apply bg-card border border-border shadow-sm rounded-xl p-6;
  }

  /* Create form card - higher elevation */
  .create-form-card {
    @apply bg-card border border-border shadow-lg rounded-xl p-6;
  }

  /* Sidebar filter panel */
  .filter-sidebar {
    @apply w-64 shrink-0 space-y-4;
  }

  /* Premium button hover */
  .btn-premium {
    @apply transition-all duration-150;
    @apply hover:shadow-md hover:-translate-y-0.5;
    @apply active:scale-[0.98];
  }

  /* Focus ring */
  .focus-ring {
    @apply focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2;
  }
}
```

### Interactive States

- **Hover**: Background shift, border reveal, shadow elevation, subtle lift
- **Focus**: Ring with offset, outline removal (when ring present)
- **Active**: Scale down, brightness adjustment
- **Disabled**: Reduced opacity, cursor change

### Shadows & Borders

- **Shadows**: `shadow-sm` (cards), `shadow-md` (hover), `shadow-lg` (modals, create form cards)
- **Border Radius**: `rounded-xl` (cards), `rounded-lg` (buttons), `rounded-md` (inputs)
- **Transitions**: Standard 150ms with ease-out, wrapped in `motion-safe:`

## Implementation Approach

### Phase 1: Foundation (Week 1)

**Goal:** Establish reusable components and utilities

#### Task 1.1: Add Tokenized Utility Classes

**File:** `src/index.css`

**Pre-flight Check:**
```bash
# Verify .table-row-premium doesn't already exist
grep -n "table-row-premium" src/index.css
# Should return no results - if it exists, verify implementation matches spec
```

**Add to `@layer components`:**
- `.interactive-card` + `.table-row-premium` (comma-separated, lines 537-545 pattern)
- `.card-container`
- `.create-form-card`
- `.filter-sidebar`
- `.btn-premium`
- `.focus-ring`

**Acceptance Criteria:**
- [ ] All 6 utility classes added to `src/index.css` in `@layer components`
- [ ] `.table-row-premium` uses comma-separated selector with `.interactive-card` (no @extend)
- [ ] Build succeeds: `npm run build`
- [ ] No PostCSS errors in console
- [ ] Classes visible in compiled CSS: `grep "table-row-premium" dist/assets/*.css`

#### Task 1.2: Create StandardListLayout Component

**File:** `src/components/layouts/StandardListLayout.tsx`

**Component API:**
```typescript
interface StandardListLayoutProps {
  filterComponent: React.ReactNode;  // Filter sidebar content
  children: React.ReactNode;         // Main content area (table)
  resource: string;                  // Resource name for ARIA labels
}

export function StandardListLayout({
  filterComponent,
  children,
  resource
}: StandardListLayoutProps) {
  return (
    <div className="flex flex-row gap-6">
      <aside
        aria-label={`Filter ${resource}`}
        className="filter-sidebar sticky top-[var(--spacing-section)] h-fit"
      >
        <div className="card-container p-2">
          {filterComponent}
        </div>
      </aside>
      <main role="main" aria-label={`${resource} list`} className="flex-1 min-w-0">
        <div className="card-container">
          {children}
        </div>
      </main>
    </div>
  );
}
```

**Storybook Test (Optional but Recommended):**
```bash
# Create: src/components/layouts/StandardListLayout.stories.tsx
npm run storybook  # Test in isolation with mock filter/table
```

**Acceptance Criteria:**
- [ ] Component created at exact path above
- [ ] Props match interface (filterComponent, children, resource)
- [ ] Semantic HTML: `<aside>`, `<main>` with proper ARIA labels
- [ ] Uses `.filter-sidebar` and `.card-container` classes
- [ ] No React Admin-specific props mixed in (pure wrapper)
- [ ] TypeScript compiles without errors
- [ ] Renders without errors in Storybook (if testing)

#### Task 1.3: Create ResourceSlideOver Component

**File:** `src/components/layouts/ResourceSlideOver.tsx`

**Component API:**
```typescript
interface ResourceSlideOverProps {
  resource: string;
  recordId: number | null;
  isOpen: boolean;
  onClose: () => void;
  mode?: 'view' | 'edit';
  onModeToggle?: () => void;
  tabs: TabConfig[];
}

interface TabConfig {
  key: string;
  label: string;
  component: React.ComponentType<{ record: any; mode: 'view' | 'edit' }>;
  icon?: React.ComponentType;
}
```

**Accessibility Requirements:**
- [ ] Focus trap: Use `@radix-ui/react-dialog` or `react-focus-lock`
- [ ] `role="dialog"` and `aria-modal="true"`
- [ ] `aria-labelledby` pointing to header title
- [ ] Initial focus to close button or first tab
- [ ] ESC key closes (handled by useSlideOverState hook)

**Helper Hook:** `src/hooks/useSlideOverState.ts`
- Full implementation in lines 136-238 of this document
- Handles URL sync, popstate, ESC key
- **Copy implementation exactly as documented**

**Acceptance Criteria:**
- [ ] Component created with exact prop interface above
- [ ] Focus trap implemented (test with Tab/Shift+Tab)
- [ ] ARIA attributes present (verify with axe DevTools)
- [ ] `useSlideOverState` hook created in `src/hooks/`
- [ ] Hook passes all 5 URL sync scenarios (see lines 273-308)
- [ ] Width: 40vw (min 480px, max 720px)
- [ ] Slide-in animation: 200ms ease-out
- [ ] TypeScript compiles without errors

#### Task 1.4: Create PremiumDatagrid Wrapper

**File:** `src/components/admin/PremiumDatagrid.tsx`

**Component API:**
```typescript
import { Datagrid, DatagridProps } from 'react-admin';

interface PremiumDatagridProps extends DatagridProps {
  // Inherits ALL React Admin Datagrid props
  // Only overrides rowClassName and rowClick behavior
}

export function PremiumDatagrid(props: PremiumDatagridProps) {
  return (
    <Datagrid
      {...props}
      rowClassName="table-row-premium"
      rowClick={(id) => {
        // Open slide-over instead of full page navigation
        // Implementation uses openSlideOver from useSlideOverState
      }}
    />
  );
}
```

**Critical Implementation Notes:**
- **MUST spread `{...props}`** to maintain all Datagrid features (sorting, selection, bulk actions)
- **rowClassName** always set to `"table-row-premium"` (applies premium hover effects)
- **rowClick** behavior changed to open slide-over (not navigate to `/resource/:id/show`)

**Acceptance Criteria:**
- [ ] Component created at exact path above
- [ ] Extends `DatagridProps` interface (all props passed through)
- [ ] `rowClassName="table-row-premium"` applied
- [ ] `rowClick` opens slide-over (not full page navigation)
- [ ] All React Admin features work: sorting, filters, bulk select, pagination
- [ ] Premium hover effects visible in browser (border reveal, shadow, lift)
- [ ] TypeScript compiles without errors

#### Phase 1 Deliverables Checklist

- [ ] `src/index.css` updated with 6 utility classes
- [ ] `src/components/layouts/StandardListLayout.tsx` created
- [ ] `src/components/layouts/ResourceSlideOver.tsx` created
- [ ] `src/hooks/useSlideOverState.ts` created
- [ ] `src/components/admin/PremiumDatagrid.tsx` created
- [ ] All TypeScript compilation passes: `npm run typecheck`
- [ ] Build succeeds: `npm run build`
- [ ] No console errors when importing components
- [ ] JSDoc comments added to all exported components
- [ ] Storybook stories created (optional but recommended)
- [ ] **Before/after screenshots captured** for Phase 4 comparison

### Phase 2: Pilot Resource - Contacts (Week 2)

**Goal:** Prove the pattern with one complete resource

#### Task 2.1: Refactor ContactList.tsx

**File:** `src/atomic-crm/contacts/ContactList.tsx`

**Changes:**
```typescript
import { StandardListLayout } from '@/components/layouts/StandardListLayout';
import { PremiumDatagrid } from '@/components/admin/PremiumDatagrid';

export function ContactList() {
  const { slideOverId, isOpen, mode, openSlideOver, closeSlideOver, toggleMode } = useSlideOverState();

  return (
    <>
      <StandardListLayout
        resource="contacts"
        filterComponent={<ContactFilters />}
      >
        <PremiumDatagrid rowClick={(id) => openSlideOver(id, 'view')}>
          {/* Existing columns */}
        </PremiumDatagrid>
      </StandardListLayout>

      <ContactSlideOver
        recordId={slideOverId}
        isOpen={isOpen}
        mode={mode}
        onClose={closeSlideOver}
        onModeToggle={toggleMode}
      />
    </>
  );
}
```

**Filter Parity Acceptance Criteria:**
- [ ] Search filter remains functional (text search across name, email, organization)
- [ ] Tag filters work (multi-select checkboxes for contact tags)
- [ ] Organization filter dropdown populated and functional
- [ ] "Clear all filters" button visible when filters active
- [ ] Filter state persists when opening/closing slide-over
- [ ] No console errors when applying filters
- [ ] Filter sidebar uses `.filter-sidebar` class (256px width, sticky)

#### Task 2.2: Build ContactSlideOver.tsx

**File:** `src/atomic-crm/contacts/ContactSlideOver.tsx`

**Tab Configuration:**
```typescript
const contactTabs: TabConfig[] = [
  {
    key: 'details',
    label: 'Details',
    component: ContactDetailsTab,  // Reuses existing ContactShow fields
    icon: UserIcon
  },
  {
    key: 'activities',
    label: 'Activities',
    component: ContactActivitiesTab,  // NEW: Activity timeline component
    icon: ActivityIcon
  },
  {
    key: 'notes',
    label: 'Notes',
    component: ContactNotesTab,  // Reuses existing Notes list/create
    icon: NoteIcon
  },
  {
    key: 'files',
    label: 'Files',
    component: ContactFilesTab,  // NEW: File attachments component
    icon: FileIcon
  }
];
```

**Component Reuse Map:**
- **ContactDetailsTab**: Reuse fields from `ContactShow.tsx` (identity, position, contact info sections)
- **ContactActivitiesTab**: Create new component using `activities` view query
- **ContactNotesTab**: Reuse `ContactNotesList` + `ContactNoteCreate` components
- **ContactFilesTab**: Create new file upload/list component

**Acceptance Criteria:**
- [ ] ContactSlideOver created at exact path above
- [ ] All 4 tabs render without errors
- [ ] Details tab shows all contact fields from ContactShow
- [ ] Activities tab shows timeline (create if not exists)
- [ ] Notes tab allows create/edit/delete notes
- [ ] Files tab shows placeholder "Coming soon" (MVP)
- [ ] Tab switching works smoothly (no flicker)
- [ ] View/Edit mode toggle works in header
- [ ] Edit mode shows form with validation
- [ ] Save button persists changes and returns to view mode

#### Task 2.3: Update Routing for Slide-Over Navigation

**Files to Modify:**
- `src/atomic-crm/root/CRM.tsx` (remove `/contacts/:id/show` route if exists)
- `src/atomic-crm/contacts/index.ts` (export only list, create; remove show)

**Breaking Changes:**
- ❌ **OLD**: `/contacts/123/show` → Full page navigation
- ✅ **NEW**: `/contacts?view=123` → Slide-over panel

**Redirect Strategy (Optional):**
```typescript
// Add redirect in CRM.tsx for bookmarked URLs
<Route path="/contacts/:id/show" element={
  <Navigate to={`/contacts?view=${id}`} replace />
} />
```

**Acceptance Criteria:**
- [ ] `/contacts/:id/show` route removed or redirects to `?view=:id`
- [ ] ContactShow component no longer exported from index.ts
- [ ] Table row clicks open slide-over (not full page)
- [ ] Browser back button closes slide-over correctly
- [ ] Deep links work: `/contacts?view=123` opens slide-over on mount
- [ ] URL updates when toggling view/edit: `?view=123` ↔ `?edit=123`

#### Task 2.4: Update ContactCreate.tsx Styling

**File:** `src/atomic-crm/contacts/ContactCreate.tsx`

**Changes:**
```typescript
// Wrap form card in .create-form-card class
<div className="bg-muted px-[var(--spacing-edge-desktop)] py-6">
  <div className="max-w-4xl mx-auto create-form-card">
    {/* Existing tabbed form content */}
  </div>
</div>
```

**Sticky Footer Pattern:**
```typescript
<div className="sticky bottom-0 bg-card border-t border-border p-4 flex justify-between">
  <Button variant="outline" onClick={handleCancel}>Cancel</Button>
  <div className="flex gap-2">
    <Button onClick={handleSaveAndClose}>Save & Close</Button>
    <Button onClick={handleSaveAndAddAnother}>Save & Add Another</Button>
  </div>
</div>
```

**Acceptance Criteria:**
- [ ] Page background uses `bg-muted`
- [ ] Form card uses `.create-form-card` class (shadow-lg elevation)
- [ ] Card centered with `max-w-4xl mx-auto`
- [ ] Sticky footer remains visible when scrolling
- [ ] Cancel button shows confirmation if form dirty
- [ ] Save & Close returns to list view with success toast
- [ ] Save & Add Another clears form and stays on create page

#### Task 2.5: Testing Requirements

**Test Files to Update/Create:**

**Unit Tests:**
- `src/atomic-crm/contacts/ContactList.test.tsx` (update for StandardListLayout)
- `src/atomic-crm/contacts/ContactSlideOver.test.tsx` (NEW)
- `src/hooks/useSlideOverState.test.ts` (NEW)

**E2E Tests:**
- `tests/e2e/contacts/slide-over.spec.ts` (NEW)

**Test Scenarios:**
```typescript
// tests/e2e/contacts/slide-over.spec.ts
describe('Contact Slide-Over', () => {
  test('opens slide-over on row click', async ({ page }) => {
    await page.goto('/contacts');
    await page.click('[data-testid="contact-row-1"]');
    await expect(page.locator('[role="dialog"]')).toBeVisible();
  });

  test('keyboard navigation - Tab cycles within slide-over', async ({ page }) => {
    // Test focus trap
  });

  test('ESC key closes slide-over', async ({ page }) => {
    // Test ESC handling
  });

  test('deep link opens slide-over on mount', async ({ page }) => {
    await page.goto('/contacts?view=123');
    await expect(page.locator('[role="dialog"]')).toBeVisible();
  });

  test('browser back closes slide-over', async ({ page }) => {
    // Test popstate listener
  });

  test('form validation in edit mode', async ({ page }) => {
    // Test inline validation errors
  });
});
```

**Acceptance Criteria:**
- [ ] All unit tests pass: `npm test -- contacts`
- [ ] E2E tests pass: `npm run test:e2e -- contacts/slide-over`
- [ ] Keyboard navigation test passes (Tab/Shift+Tab stays in dialog)
- [ ] ESC key test passes (closes slide-over)
- [ ] Deep link test passes (URL state restored on mount)
- [ ] Browser back test passes (popstate listener works)
- [ ] Form validation test passes (errors display inline)
- [ ] Coverage ≥70% for new components

#### Phase 2 Deliverables Checklist

- [ ] ContactList.tsx refactored with StandardListLayout
- [ ] ContactSlideOver.tsx created with 4 tabs
- [ ] All filters functional inside .filter-sidebar
- [ ] Routing updated (no `/contacts/:id/show` route)
- [ ] ContactCreate.tsx styling updated
- [ ] 7 new test files created/updated (see Task 2.5)
- [ ] All tests passing
- [ ] Accessibility audit passed (axe DevTools, 0 violations)
- [ ] **Screenshots captured**: List view, slide-over (view mode), slide-over (edit mode), create form

### Phase 3: Rollout to Other Resources (Weeks 3-5)

**Order of migration** (based on complexity):

- **Week 3**: Tasks & Sales (simpler resources)
- **Week 4**: Organizations & Products
- **Week 5**: Opportunities (most complex, Kanban stays as alternate view)

#### Week 3: Tasks & Sales

**Tasks Resource Migration:**

**Unique Features to Preserve:**
- Principal-grouped card view (secondary view option)
- Inline task completion checkboxes
- Due date color coding (overdue = red, today = yellow)
- Quick-add modal from dashboard

**Migration Notes:**
- **List View**: Migrate to table as primary view, keep principal grouping as filter option
- **Tabs**: Details | Related Items (opportunity, contact links)
- **Filters**: Principal dropdown, due date range, status, priority, type
- **Test Files**:
  - `src/atomic-crm/tasks/TaskList.test.tsx` (update)
  - `src/atomic-crm/tasks/TaskSlideOver.test.tsx` (NEW)
  - `tests/e2e/tasks/slide-over.spec.ts` (NEW)

**Acceptance Criteria:**
- [ ] Table view as default (principal-grouped cards optional/removed)
- [ ] Inline completion checkbox preserved in table rows
- [ ] Quick-add modal still works from dashboard widgets
- [ ] All filters functional (principal, due date, status, priority, type)
- [ ] Slide-over opens on row click
- [ ] Tests pass: `npm test -- tasks && npm run test:e2e -- tasks`

---

**Sales Resource Migration:**

**Unique Features to Preserve:**
- Two tabs only: Profile | Permissions
- Administrator toggle (affects permissions)
- Sales target display

**Migration Notes:**
- **List View**: Simple table with name, email, role, status
- **Tabs**: Profile (editable fields) | Permissions (role, admin toggle)
- **Filters**: Role dropdown (admin, manager, rep), status (active/inactive)
- **Test Files**:
  - `src/atomic-crm/sales/SalesList.test.tsx` (update)
  - `src/atomic-crm/sales/SalesSlideOver.test.tsx` (NEW)
  - `tests/e2e/sales/slide-over.spec.ts` (NEW)

**Acceptance Criteria:**
- [ ] Table shows name, email, role badge, status indicator
- [ ] Slide-over has Profile + Permissions tabs
- [ ] Administrator toggle functional in Permissions tab
- [ ] Role filter dropdown works (admin, manager, rep)
- [ ] Slide-over opens on row click
- [ ] Tests pass: `npm test -- sales && npm run test:e2e -- sales`

#### Week 4: Organizations & Products

**Organizations Resource Migration:**

**Unique Features to Preserve:**
- Parent/child hierarchy (distributor branches)
- Organization type badges (customer, distributor, principal)
- Quick contact count display
- Grid view toggle (REMOVE per direct migration approach)

**Migration Notes:**
- **List View**: Table with name, type badge, parent, contact count
- **Tabs**: Details | Contacts | Opportunities | Notes
- **Filters**: Type multi-select, parent organization dropdown
- **REMOVE**: Grid view toggle (direct migration, no legacy views)
- **Test Files**:
  - `src/atomic-crm/organizations/OrganizationList.test.tsx` (update for table only)
  - `src/atomic-crm/organizations/OrganizationSlideOver.test.tsx` (NEW)
  - `tests/e2e/organizations/slide-over.spec.ts` (NEW)
  - `tests/e2e/organizations/hierarchy.spec.ts` (update if exists)

**Acceptance Criteria:**
- [ ] Table shows name, type badge, parent name (if exists), contact count
- [ ] Grid view toggle removed (breaking change, document in PR)
- [ ] Hierarchy relationships display correctly in Details tab
- [ ] Contacts tab shows all related contacts
- [ ] Opportunities tab shows all linked opportunities
- [ ] Type filter multi-select works
- [ ] Tests pass: `npm test -- organizations && npm run test:e2e -- organizations`

---

**Products Resource Migration:**

**Unique Features to Preserve:**
- Product type classification (flavor, ingredient, packaging, etc.)
- Relationships tab (substitute products, paired products)

**Migration Notes:**
- **List View**: Table with name, SKU, type, classification
- **Tabs**: Details | Relationships
- **Filters**: Product type multi-select, classification dropdown
- **Test Files**:
  - `src/atomic-crm/products/ProductList.test.tsx` (update)
  - `src/atomic-crm/products/ProductSlideOver.test.tsx` (NEW)
  - `tests/e2e/products/slide-over.spec.ts` (NEW)

**Acceptance Criteria:**
- [ ] Table shows name, SKU, type, classification
- [ ] Slide-over has Details + Relationships tabs
- [ ] Relationships tab shows substitute/paired products
- [ ] Type and classification filters functional
- [ ] Slide-over opens on row click
- [ ] Tests pass: `npm test -- products && npm run test:e2e -- products`

#### Week 5: Opportunities

**Unique Features to Preserve:**
- **Kanban board view** (remains as alternate view)
- Drag-and-drop stage transitions
- Health status indicators
- Days-in-stage metrics
- Priority badges

**Migration Notes:**
- **List View**: Table as PRIMARY view (new default)
  - Columns: Name, Customer, Principal, Stage, Health, Amount, Close Date, Days in Stage
  - Table becomes default when visiting `/opportunities`
- **Kanban View**: SECONDARY view (accessible via toggle)
  - Keep all existing features: drag-drop, quick-add, column collapse
  - Toggle button in top toolbar: "Table View" ↔ "Kanban View"
  - Preference saved to localStorage: `opportunity.view_mode`
- **Tabs**: Details | History | Files | Activities
- **Filters**: Health status, stage, assignee, close date range
- **Test Files**:
  - `src/atomic-crm/opportunities/OpportunityList.test.tsx` (update for table + view toggle)
  - `src/atomic-crm/opportunities/OpportunitySlideOver.test.tsx` (NEW)
  - `src/atomic-crm/opportunities/OpportunityKanban.test.tsx` (update, keep existing tests)
  - `tests/e2e/opportunities/slide-over.spec.ts` (NEW)
  - `tests/e2e/opportunities/kanban.spec.ts` (update, preserve existing)

**View Toggle Implementation:**
```typescript
const [viewMode, setViewMode] = useLocalStorage('opportunity.view_mode', 'table');

return (
  <>
    <TopToolbar>
      <Button onClick={() => setViewMode(viewMode === 'table' ? 'kanban' : 'table')}>
        {viewMode === 'table' ? 'Switch to Kanban' : 'Switch to Table'}
      </Button>
    </TopToolbar>

    {viewMode === 'table' ? (
      <StandardListLayout ...>
        <PremiumDatagrid .../>
      </StandardListLayout>
    ) : (
      <OpportunityKanban /> // Existing Kanban component
    )}
  </>
);
```

**Acceptance Criteria:**
- [ ] Table view is default when visiting `/opportunities`
- [ ] Toggle button switches between table and Kanban
- [ ] Kanban view preserves all existing features (drag-drop, column collapse, etc.)
- [ ] View preference persists (localStorage)
- [ ] Slide-over works from BOTH table and Kanban views
- [ ] All filters work in both views
- [ ] Health status indicators display correctly in table
- [ ] Days-in-stage calculated and displayed
- [ ] Existing Kanban tests still pass
- [ ] Tests pass: `npm test -- opportunities && npm run test:e2e -- opportunities`

#### Phase 3 Migration Checklist (Per Resource)

For each resource (Tasks, Sales, Organizations, Products, Opportunities):

- [ ] List view migrated to StandardListLayout + PremiumDatagrid
- [ ] Resource-specific slide-over created with appropriate tabs
- [ ] All unique features preserved (see resource notes above)
- [ ] Filters functional and migrated to .filter-sidebar
- [ ] Create form styling updated to use .create-form-card
- [ ] Old Show component removed from exports (breaking change)
- [ ] Routing updated (no `/resource/:id/show` routes)
- [ ] Test files created/updated (see resource notes for file list)
- [ ] All tests passing
- [ ] Accessibility audit passed (axe DevTools)
- [ ] **Screenshots captured**: List view + slide-over for each resource

### Phase 4: Polish & Optimization (Week 6)

**Goal:** Refinement and performance

1. Accessibility audit (WCAG 2.1 AA)
2. Performance optimization (code splitting, lazy loading)
3. Visual consistency pass
4. Documentation updates

### Implementation Guidelines

**Boy Scout Rule & Direct Migration**
- Fix inconsistencies when touching files
- Convert `type` to `interface` per ESLint rule (22 files pending)
- Update old color usages to semantic tokens
- Replace hardcoded spacing with semantic variables
- Delete old patterns immediately - no gradual migration
- Breaking changes are expected and encouraged

**Testing Strategy**
- **Unit Tests**: 70% coverage minimum for new components
  - StandardListLayout.tsx
  - ResourceSlideOver.tsx
  - PremiumDatagrid.tsx
  - All utility hooks
- **E2E Tests**: Critical flows for each resource
  - List → View → Edit → Save flow
  - Slide-over open/close with keyboard
  - URL deep linking and browser navigation
  - Form validation and submission
- **Visual Regression** (optional but recommended)
  - Percy or Chromatic for detecting style drift
  - Capture before/after screenshots per phase

**Code Review Checkpoints**
- **After Phase 1**: Review foundation components for reusability
- **After Phase 2**: Validate Contacts implementation as template
- **Mid-Phase 3**: Review Tasks & Sales for pattern consistency
- **Before Phase 4**: Full review before polish phase
- **Final Review**: Complete accessibility and performance audit

**Direct Migration Approach**

Per Engineering Constitution: `no-backward-compatibility: Breaking changes allowed`

- **No feature flags** - Direct replacement of components
- **No legacy fallbacks** - Old patterns removed immediately
- **Clean switchover** - Each resource migrates completely in one commit
- **Delete old code** - No `@deprecated` markers, remove unused components
- **URL changes allowed** - `/contacts/123/show` becomes `/contacts?view=123`

**Migration Process**
1. Build new component alongside old
2. Test new component thoroughly
3. Replace all usages in single commit
4. Delete old component immediately
5. No gradual rollout or toggles

**Handling Issues**
- If problems arise: Fix forward, don't revert
- Breaking changes communicated clearly in PR
- Team prepared for immediate adoption
- No dual-maintenance burden

### Migration Checklist (Per Resource)

- [ ] List view migrated to StandardListLayout
- [ ] Table styled with PremiumDatagrid
- [ ] Filter sidebar standardized
- [ ] Slide-over component created
- [ ] View mode implemented
- [ ] Edit mode implemented
- [ ] URL routing updated (breaking changes OK)
- [ ] Create form styling updated
- [ ] Old components deleted (no legacy code)
- [ ] E2E tests passing
- [ ] Accessibility audit passed
- [ ] Documentation updated

### Risk Mitigation

- **Slide-over breaking workflows**: Test all navigation paths thoroughly before migration
- **Performance degradation**: Use `motion-safe:` prefix, monitor Core Web Vitals
- **Accessibility regressions**: Automated testing, manual keyboard nav checks
- **Scope creep**: Strict phase boundaries, no feature additions
- **Breaking changes**: Clear communication in PRs, team coordination for immediate adoption

## Success Metrics

- All 6 resources following unified design
- Lighthouse accessibility score ≥95 on all pages
- E2E test coverage for all critical flows
- Zero visual inconsistencies between resources
- Performance metrics maintained or improved

## Next Steps

1. Review and approve this design document
2. Set up feature branch for Phase 1 implementation
3. Create detailed task tickets for each phase
4. Begin Phase 1: Foundation components

## References

- Dashboard V2 implementation: `src/atomic-crm/dashboard/v2/`
- Contact list patterns: `src/atomic-crm/contacts/`
- Existing tabbed forms: `src/components/admin/tabbed-form/`
- Engineering Constitution: `.claude/engineering-constitution.md`
- Design System: `docs/architecture/design-system.md`