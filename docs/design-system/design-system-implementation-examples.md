# Design System Implementation Examples

This document contains concrete code examples for the UI/UX modernization plan.

---

## File 1: `src/lib/design-system/breakpoints.ts`

```typescript
import { useEffect, useState } from 'react';

/**
 * Breakpoint definitions aligned with Tailwind CSS defaults
 * Philosophy: iPad-first responsive design
 *
 * @see docs/design-system/03-responsive.md
 */
export const breakpoints = {
  mobile: 0,       // 0-767px (portrait phone)
  tablet: 768,     // 768-1023px (iPad portrait) - Tailwind 'md:'
  tabletLg: 1024,  // 1024-1279px (iPad landscape) - Tailwind 'lg:'
  desktop: 1280,   // 1280px+ (desktop) - Tailwind 'xl:'
} as const;

export type Breakpoint = keyof typeof breakpoints;

/**
 * Hook to detect current breakpoint
 *
 * @example
 * const { isMobile, isTablet, isDesktop, currentBreakpoint } = useBreakpoint();
 * if (isMobile) return <MobileLayout />;
 */
export const useBreakpoint = () => {
  const [currentBreakpoint, setCurrentBreakpoint] = useState<Breakpoint>('desktop');

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;

      if (width >= breakpoints.desktop) {
        setCurrentBreakpoint('desktop');
      } else if (width >= breakpoints.tabletLg) {
        setCurrentBreakpoint('tabletLg');
      } else if (width >= breakpoints.tablet) {
        setCurrentBreakpoint('tablet');
      } else {
        setCurrentBreakpoint('mobile');
      }
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return {
    currentBreakpoint,
    isMobile: currentBreakpoint === 'mobile',
    isTablet: currentBreakpoint === 'tablet' || currentBreakpoint === 'tabletLg',
    isTabletPortrait: currentBreakpoint === 'tablet',
    isTabletLandscape: currentBreakpoint === 'tabletLg',
    isDesktop: currentBreakpoint === 'desktop',
  };
};

/**
 * Create media query string for a breakpoint
 *
 * @example
 * const query = createMediaQuery('tablet'); // "(min-width: 768px)"
 */
export const createMediaQuery = (breakpoint: Breakpoint): string => {
  return `(min-width: ${breakpoints[breakpoint]}px)`;
};

/**
 * Hook to check if media query matches
 *
 * @example
 * const isTabletOrLarger = useMediaQuery('tablet');
 */
export const useMediaQuery = (breakpoint: Breakpoint): boolean => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const query = createMediaQuery(breakpoint);
    const mediaQuery = window.matchMedia(query);

    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => setMatches(event.matches);
    mediaQuery.addEventListener('change', handler);

    return () => mediaQuery.removeEventListener('change', handler);
  }, [breakpoint]);

  return matches;
};
```

**Usage in Dashboard:**
```typescript
// src/atomic-crm/dashboard/Dashboard.tsx
import { useBreakpoint } from '@/lib/design-system/breakpoints';

export const Dashboard = () => {
  const { isMobile, isTablet } = useBreakpoint();

  // Use for conditional rendering when Tailwind classes aren't enough
  if (isMobile) {
    return <MobileDashboard />;
  }

  return <DesktopDashboard />;
};
```

---

## File 2: `src/lib/design-system/spacing.ts`

```typescript
/**
 * Touch target size standards
 * Based on Apple HIG (44px) and Material Design (48px)
 *
 * @see https://developer.apple.com/design/human-interface-guidelines/accessibility
 */
export const touchTarget = {
  /** Absolute minimum per WCAG 2.5.5 (44x44px) */
  minimum: 44,

  /** Comfortable default - current button standard (48x48px) */
  comfortable: 48,

  /** Spacious for primary CTAs (56x56px) */
  spacious: 56,
} as const;

/**
 * Spacing scale for touch-friendly layouts
 * All values in pixels
 */
export const spacing = {
  /** Minimum gap between touch targets (8px) */
  touchGap: 8,

  /** Standard card padding (16px) - Tailwind 'p-4' */
  cardPadding: 16,

  /** Gap between sections (24px) - Tailwind 'gap-6' */
  sectionGap: 24,

  /** Page margins (32px) - Tailwind 'px-8' */
  pageMargin: 32,
} as const;

/**
 * Validates that a size meets minimum touch target
 *
 * @example
 * const validSize = ensureTouchTarget(32); // Returns 44 (minimum)
 * const alreadyValid = ensureTouchTarget(48); // Returns 48 (unchanged)
 */
export const ensureTouchTarget = (size: number): number => {
  return Math.max(size, touchTarget.minimum);
};

/**
 * Checks if a size meets touch target standards
 *
 * @example
 * const isValid = isTouchTargetValid(48); // true
 * const isTooSmall = isTouchTargetValid(40); // false
 */
export const isTouchTargetValid = (size: number): boolean => {
  return size >= touchTarget.minimum;
};

/**
 * TypeScript type for touch target sizes
 */
export type TouchTargetSize = 'minimum' | 'comfortable' | 'spacious';

/**
 * Get numeric value for a touch target size
 *
 * @example
 * getTouchTargetSize('comfortable'); // 48
 */
export const getTouchTargetSize = (size: TouchTargetSize): number => {
  return touchTarget[size];
};
```

**Usage in Button validation:**
```typescript
// Validate existing button sizes meet standards
import { isTouchTargetValid, touchTarget } from '@/lib/design-system/spacing';

// In button.tsx:
// size: { default: "h-12" } // h-12 = 48px ✅ Valid!

// Validation test:
console.assert(isTouchTargetValid(48), 'Button default size must meet touch target minimum');
```

---

## File 3: `src/lib/design-system/accessibility.ts`

```typescript
import { useEffect, useRef, useCallback } from 'react';

/**
 * Standard focus ring styles (already used in button.tsx)
 * Consistent 3px ring with offset for visibility
 */
export const focusRing = "focus-visible:ring-ring focus-visible:ring-[3px] focus-visible:border-ring outline-none";

/**
 * Screen reader only styles (hide visually, keep in DOM)
 */
export const srOnly = "sr-only";

/**
 * Hook for managing focus trap in modals/dialogs
 *
 * @example
 * const dialogRef = useFocusTrap<HTMLDivElement>();
 * return <div ref={dialogRef}>...</div>
 */
export const useFocusTrap = <T extends HTMLElement>() => {
  const elementRef = useRef<T>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Get all focusable elements
    const focusableElements = element.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element
    firstElement.focus();

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift+Tab: wrap to last element
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: wrap to first element
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    element.addEventListener('keydown', handleTab);
    return () => element.removeEventListener('keydown', handleTab);
  }, []);

  return elementRef;
};

/**
 * Hook for announcing content to screen readers
 * Creates an ARIA live region
 *
 * @example
 * const announce = useAriaAnnounce();
 * announce('Dashboard refreshed');
 */
export const useAriaAnnounce = () => {
  const liveRegionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Create live region on mount
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('role', 'status');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    document.body.appendChild(liveRegion);
    liveRegionRef.current = liveRegion;

    return () => {
      // Cleanup on unmount
      if (liveRegionRef.current) {
        document.body.removeChild(liveRegionRef.current);
      }
    };
  }, []);

  const announce = useCallback((message: string) => {
    if (liveRegionRef.current) {
      // Clear then set (ensures re-announcement if same message)
      liveRegionRef.current.textContent = '';
      setTimeout(() => {
        if (liveRegionRef.current) {
          liveRegionRef.current.textContent = message;
        }
      }, 100);
    }
  }, []);

  return announce;
};

/**
 * Hook for keyboard navigation in lists/grids
 * Handles arrow keys, Home, End
 *
 * @example
 * const { currentIndex, handleKeyDown } = useKeyboardNavigation({
 *   items: principals,
 *   onSelect: (index) => navigateToPrincipal(principals[index])
 * });
 */
export const useKeyboardNavigation = <T>({
  items,
  onSelect,
  loop = true,
}: {
  items: T[];
  onSelect: (index: number) => void;
  loop?: boolean;
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const { key } = e;

      switch (key) {
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault();
          setCurrentIndex((prev) => {
            const next = prev + 1;
            if (next >= items.length) {
              return loop ? 0 : prev;
            }
            return next;
          });
          break;

        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault();
          setCurrentIndex((prev) => {
            const next = prev - 1;
            if (next < 0) {
              return loop ? items.length - 1 : 0;
            }
            return next;
          });
          break;

        case 'Home':
          e.preventDefault();
          setCurrentIndex(0);
          break;

        case 'End':
          e.preventDefault();
          setCurrentIndex(items.length - 1);
          break;

        case 'Enter':
        case ' ':
          e.preventDefault();
          onSelect(currentIndex);
          break;
      }
    },
    [items.length, loop, onSelect, currentIndex]
  );

  return { currentIndex, handleKeyDown, setCurrentIndex };
};
```

**Usage in Dashboard:**
```typescript
// src/atomic-crm/dashboard/Dashboard.tsx
import { useAriaAnnounce } from '@/lib/design-system/accessibility';

export const Dashboard = () => {
  const announce = useAriaAnnounce();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    refresh();
    announce('Dashboard data refreshed'); // ← Screen reader announcement
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // ... rest of component
};
```

---

## File 4: `src/components/design-system/TouchTarget.tsx`

```typescript
import * as React from 'react';
import { cn } from '@/lib/utils';
import { ensureTouchTarget, type TouchTargetSize, getTouchTargetSize } from '@/lib/design-system/spacing';

interface TouchTargetProps {
  /**
   * Child element (must be a single React element)
   */
  children: React.ReactElement;

  /**
   * Minimum touch target size
   * @default 'comfortable' (48px)
   */
  size?: TouchTargetSize | number;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * TouchTarget Component
 *
 * Ensures any interactive element meets WCAG 2.5.5 minimum size (44x44px)
 * Wraps child element with minimum dimensions
 *
 * @example
 * // Ensure icon button meets 44px minimum
 * <TouchTarget size="minimum">
 *   <button className="size-8">
 *     <Icon />
 *   </button>
 * </TouchTarget>
 *
 * @example
 * // Use comfortable size for standard interactions
 * <TouchTarget>
 *   <a href="/profile">Link</a>
 * </TouchTarget>
 */
export const TouchTarget: React.FC<TouchTargetProps> = ({
  children,
  size = 'comfortable',
  className,
}) => {
  const minSize = typeof size === 'number' ? ensureTouchTarget(size) : getTouchTargetSize(size);

  // Clone child and add wrapper with minimum dimensions
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center',
        className
      )}
      style={{
        minWidth: `${minSize}px`,
        minHeight: `${minSize}px`,
      }}
    >
      {children}
    </span>
  );
};

TouchTarget.displayName = 'TouchTarget';
```

**Usage Example:**
```typescript
// Small icon button that would otherwise be too small
<TouchTarget size="minimum">
  <button className="size-6 p-0">
    <TrashIcon />
  </button>
</TouchTarget>

// Result: Button is visually 24x24px (size-6) but touch target is 44x44px
```

---

## File 5: `src/components/design-system/ResponsiveGrid.tsx`

```typescript
import * as React from 'react';
import { cn } from '@/lib/utils';

type GridVariant =
  | 'dashboard'      // 70/30 split (Dashboard layout)
  | 'twoColumn'      // Equal 50/50 split
  | 'threeColumn'    // Triple column
  | 'cards'          // Auto-fit cards
  | 'table';         // Full width table container

interface ResponsiveGridProps {
  /**
   * Grid layout variant
   */
  variant: GridVariant;

  /**
   * Gap between grid items (Tailwind spacing)
   * @default 'gap-6' (24px)
   */
  gap?: string;

  /**
   * Children elements
   */
  children: React.ReactNode;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Responsive grid layout patterns
 * Pre-configured variants for common layouts
 *
 * Breakpoint strategy:
 * - Mobile (< 768px): Single column for all variants
 * - Tablet Portrait (768-1023px): Variant-specific behavior
 * - Tablet Landscape+ (1024px+): Full multi-column layout
 */
const gridVariants: Record<GridVariant, string> = {
  // Dashboard: Main content (70%) + Sidebar (30%)
  // Mobile: Stack vertically
  // Tablet Landscape+: 70/30 split
  dashboard: 'grid grid-cols-1 lg:grid-cols-[70%_30%]',

  // Two Column: Equal split
  // Mobile: Stack
  // Tablet+: Side-by-side
  twoColumn: 'grid grid-cols-1 md:grid-cols-2',

  // Three Column: Equal split
  // Mobile: Stack
  // Tablet Portrait: 2 columns
  // Tablet Landscape+: 3 columns
  threeColumn: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3',

  // Cards: Auto-fit responsive cards
  // Mobile: 1 column
  // Tablet: 2-3 columns based on space
  // Desktop: 3-4 columns based on space
  cards: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',

  // Table: Full width container
  // No column splitting, just responsive padding
  table: 'w-full overflow-x-auto',
};

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  variant,
  gap = 'gap-6',
  children,
  className,
}) => {
  return (
    <div className={cn(gridVariants[variant], gap, className)}>
      {children}
    </div>
  );
};

ResponsiveGrid.displayName = 'ResponsiveGrid';
```

**Migration Example (Dashboard):**
```typescript
// BEFORE: Manual grid classes
<div className="grid grid-cols-1 lg:grid-cols-[70%_30%] gap-6">
  <div>{/* Main */}</div>
  <div>{/* Sidebar */}</div>
</div>

// AFTER: Pattern component (clearer intent)
<ResponsiveGrid variant="dashboard" gap="gap-6">
  <div>{/* Main */}</div>
  <div>{/* Sidebar */}</div>
</ResponsiveGrid>

// BENEFIT: Intent is clearer, pattern is reusable, consistent across app
```

---

## File 6: `src/components/design-system/ScreenReaderAnnouncer.tsx`

```typescript
import * as React from 'react';
import { useAriaAnnounce } from '@/lib/design-system/accessibility';

interface ScreenReaderAnnouncerProps {
  /**
   * Message to announce
   */
  message?: string;

  /**
   * Politeness level
   * - 'polite': Wait for screen reader to finish current task
   * - 'assertive': Interrupt immediately
   * @default 'polite'
   */
  politeness?: 'polite' | 'assertive';
}

/**
 * ScreenReaderAnnouncer Component
 *
 * Announces messages to screen readers without visual display
 * Uses ARIA live regions for dynamic content updates
 *
 * @example
 * // Announce form submission success
 * <ScreenReaderAnnouncer message="Form submitted successfully" />
 *
 * @example
 * // Urgent error announcement
 * <ScreenReaderAnnouncer
 *   message="Error: Connection lost"
 *   politeness="assertive"
 * />
 */
export const ScreenReaderAnnouncer: React.FC<ScreenReaderAnnouncerProps> = ({
  message,
  politeness = 'polite',
}) => {
  const announce = useAriaAnnounce();

  React.useEffect(() => {
    if (message) {
      announce(message);
    }
  }, [message, announce]);

  // Render ARIA live region (visually hidden)
  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
};

ScreenReaderAnnouncer.displayName = 'ScreenReaderAnnouncer';

/**
 * Hook-based alternative for programmatic announcements
 *
 * @example
 * const Dashboard = () => {
 *   const announce = useAnnounce();
 *
 *   const handleRefresh = () => {
 *     refresh();
 *     announce('Dashboard refreshed');
 *   };
 * };
 */
export const useAnnounce = () => {
  return useAriaAnnounce();
};
```

**Usage in Dashboard:**
```typescript
// Method 1: Component-based
import { ScreenReaderAnnouncer } from '@/components/design-system';

export const Dashboard = () => {
  const [announcement, setAnnouncement] = useState<string>('');

  const handleRefresh = () => {
    refresh();
    setAnnouncement('Dashboard data refreshed');
    setTimeout(() => setAnnouncement(''), 100); // Clear after announcement
  };

  return (
    <>
      <ScreenReaderAnnouncer message={announcement} />
      {/* Rest of dashboard */}
    </>
  );
};

// Method 2: Hook-based (simpler)
import { useAnnounce } from '@/components/design-system';

export const Dashboard = () => {
  const announce = useAnnounce();

  const handleRefresh = () => {
    refresh();
    announce('Dashboard data refreshed');
  };

  return (/* ... */);
};
```

---

## Migration Pattern: Backward Compatible Enhancement

**Principle:** Never break existing code, make patterns opt-in

### Example: Migrating Dashboard Grid

```typescript
// STEP 1: Existing code continues to work
// src/atomic-crm/dashboard/Dashboard.tsx (no changes required)
<div className="grid grid-cols-1 lg:grid-cols-[70%_30%] gap-6">
  <div>{/* Main */}</div>
  <div>{/* Sidebar */}</div>
</div>

// STEP 2: Gradually adopt new pattern (opt-in)
import { ResponsiveGrid } from '@/components/design-system';

<ResponsiveGrid variant="dashboard">
  <div>{/* Main */}</div>
  <div>{/* Sidebar */}</div>
</ResponsiveGrid>

// STEP 3: Both patterns coexist during migration period
// No forced migration timeline
// New components use ResponsiveGrid
// Old components can be migrated opportunistically
```

### Example: Adding Touch Target Validation

```typescript
// STEP 1: Existing buttons work unchanged
<Button size="default">Click Me</Button>

// STEP 2: Add validation in development mode only
if (process.env.NODE_ENV === 'development') {
  import { isTouchTargetValid } from '@/lib/design-system/spacing';

  // Warn if button is too small
  console.assert(
    isTouchTargetValid(buttonHeight),
    `Button does not meet 44px touch target minimum`
  );
}

// STEP 3: Fix warnings over time, no immediate breakage
```

---

## Definition of Done: Phase 1 (Foundation)

### Code Deliverables
- [ ] All 3 utility files created with TypeScript types
- [ ] All 3 pattern components render without errors
- [ ] Barrel exports in `index.ts` files
- [ ] Zero ESLint errors
- [ ] Zero TypeScript errors

### Testing
- [ ] Unit tests for utility functions (breakpoints, spacing validation)
- [ ] Storybook stories for pattern components
- [ ] Components render in all breakpoints (mobile/tablet/desktop)
- [ ] Accessibility: Focus trap works in modals
- [ ] Accessibility: Screen reader announces messages

### Documentation
- [ ] README.md with installation instructions
- [ ] 01-principles.md explaining iPad-first approach
- [ ] Code comments in all files (JSDoc)
- [ ] Usage examples for each utility/component

### Integration
- [ ] Pattern components imported in 1 dashboard component (proof of concept)
- [ ] No regressions in existing functionality
- [ ] Build passes (`npm run build`)
- [ ] Tests pass (`npm test`)

**Total Effort:** 10-15 hours (1-2 weeks with other work)

---

## Next Steps

Would you like me to:

1. **Create a formal implementation plan** using `/superpowers:write-plan` with these examples?
2. **Start implementing Phase 1** by creating these files in your codebase?
3. **Refine further** - dive deeper into specific components or patterns?

Let me know which direction you'd like to go!
