// src/lib/design-system/accessibility.ts

import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * Standard focus ring styles (consistent with button.tsx)
 * 3px ring with offset for visibility
 *
 * @example
 * <button className={cn("...", focusRing)}>Click</button>
 */
export const focusRing =
  'focus-visible:ring-ring focus-visible:ring-[3px] focus-visible:border-ring outline-none';

/**
 * Screen reader only styles (visually hidden, accessible to AT)
 *
 * @example
 * <span className={srOnly}>Loading...</span>
 */
export const srOnly = 'sr-only';

/**
 * Hook for announcing content to screen readers
 * Creates ARIA live region for dynamic updates
 *
 * @example
 * const announce = useAriaAnnounce();
 *
 * const handleRefresh = () => {
 *   refresh();
 *   announce('Dashboard data refreshed');
 * };
 */
export const useAriaAnnounce = () => {
  const liveRegionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Create ARIA live region on mount
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
 * Hook for keyboard navigation in lists (arrow keys, Home, End)
 * Use for data tables, option lists, etc.
 *
 * @example
 * const { currentIndex, handleKeyDown } = useKeyboardNavigation({
 *   items: principals,
 *   onSelect: (index) => navigate(`/principals/${principals[index].id}`)
 * });
 *
 * return <div onKeyDown={handleKeyDown} tabIndex={0}>...</div>;
 */
export const useKeyboardNavigation = <T,>({
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
