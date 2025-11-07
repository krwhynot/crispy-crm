// src/lib/design-system/spacing.ts

/**
 * Touch target size standards
 * Based on WCAG 2.5.5 (44x44px minimum) and current button standard (48px)
 *
 * Engineering Constitution: Document standards, don't over-engineer wrappers
 *
 * @see https://www.w3.org/WAI/WCAG21/Understanding/target-size.html
 * @see src/components/ui/button.tsx - Already uses h-12 (48px) ✅
 */

/** WCAG 2.5.5 minimum touch target size (44x44px) */
export const TOUCH_TARGET_MIN = 44;

/** Current button standard - comfortable size (48x48px) */
export const TOUCH_TARGET_STANDARD = 48;

/** Spacious size for primary CTAs (56x56px) */
export const TOUCH_TARGET_SPACIOUS = 56;

/**
 * Spacing scale for touch-friendly layouts (all values in px)
 */
export const spacing = {
  /** Minimum gap between touch targets */
  touchGap: 8,

  /** Standard card padding (Tailwind p-4) */
  cardPadding: 16,

  /** Gap between sections (Tailwind gap-6) */
  sectionGap: 24,

  /** Page margins (Tailwind px-8) */
  pageMargin: 32,
} as const;

/**
 * Validates touch target size in development mode
 * Fails fast if size is below WCAG minimum
 *
 * @example
 * validateTouchTarget(40, 'IconButton'); // Throws in dev mode
 * validateTouchTarget(48, 'Button'); // OK
 */
export const validateTouchTarget = (size: number, componentName: string): void => {
  if (process.env.NODE_ENV === 'development') {
    if (size < TOUCH_TARGET_MIN) {
      throw new Error(
        `[Design System] ${componentName} has ${size}px touch target (minimum: ${TOUCH_TARGET_MIN}px). ` +
        `Fix the component at source, don't wrap it! See docs/design-system/README.md`
      );
    }
  }
};

/**
 * Checks if size meets minimum touch target (non-throwing)
 *
 * @example
 * const isValid = isTouchTargetValid(48); // true
 * const isTooSmall = isTouchTargetValid(40); // false
 */
export const isTouchTargetValid = (size: number): boolean => {
  return size >= TOUCH_TARGET_MIN;
};
