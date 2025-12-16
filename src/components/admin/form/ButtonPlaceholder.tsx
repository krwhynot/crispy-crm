import { cn } from "@/lib/utils";

interface ButtonPlaceholderProps {
  className?: string;
}

/**
 * Invisible placeholder that maintains button column width for alignment.
 * Use in CompactFormFieldWithButton when a field doesn't have an action button.
 *
 * Dimensions match Button component with size="icon":
 * - size-12 (48px) = icon button touch target (meets 44px minimum)
 */
export const ButtonPlaceholder = ({ className }: ButtonPlaceholderProps) => {
  return (
    <div
      className={cn(
        "size-12 shrink-0", // Match icon button size (48px)
        "invisible", // Take space but don't display
        className
      )}
      aria-hidden="true"
    />
  );
};
