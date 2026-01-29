import { useId } from "react";
import { cn } from "@/lib/utils";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "./accordion";

interface AccordionSectionProps {
  /** Section title displayed in trigger */
  title: string;
  /** Content shown when expanded */
  children: React.ReactNode;
  /** Start expanded (default: true) */
  defaultOpen?: boolean;
  /** Optional badge/counter next to title */
  badge?: React.ReactNode;
  /** Container className */
  className?: string;
  /** Content area className */
  contentClassName?: string;
}

/**
 * Tier 2 wrapper for single-item collapsible sections.
 *
 * Use this for simple expand/collapse UI patterns like filter panels.
 * For complex nested accordions, use the primitive exports from ./accordion.
 *
 * Features:
 * - 44px minimum touch target (h-11) for Fitts's Law compliance
 * - focus-visible ring for keyboard navigation
 * - Optional badge support for counts/status
 * - Sensible defaults (expanded by default, no underline on hover)
 *
 * @example
 * ```tsx
 * <AccordionSection
 *   title="Active Filters"
 *   badge={<span className="text-xs text-muted-foreground">(3 filters)</span>}
 * >
 *   <FilterChips />
 * </AccordionSection>
 * ```
 */
export const AccordionSection = ({
  title,
  children,
  defaultOpen = true,
  badge,
  className,
  contentClassName,
}: AccordionSectionProps) => {
  // useId generates a unique, stable ID for accessibility (aria relationships)
  const sectionId = useId();

  return (
    <Accordion
      type="single"
      collapsible
      defaultValue={defaultOpen ? sectionId : undefined}
      className={className}
      data-slot="accordion-section"
    >
      <AccordionItem value={sectionId} className="border-b">
        <AccordionTrigger
          className={cn(
            "py-2 h-11", // 44px touch target - Fitts's Law
            "hover:no-underline", // Cleaner appearance
            "focus-visible:ring-2 focus-visible:ring-ring" // Keyboard navigation
          )}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{title}</span>
            {badge}
          </div>
        </AccordionTrigger>
        <AccordionContent className={contentClassName}>{children}</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
