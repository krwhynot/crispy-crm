import { cn } from "@/lib/utils";

interface ButtonPlaceholderProps {
  className?: string;
}

/**
 * Invisible placeholder that maintains button column width for alignment.
 * Use in CompactFormFieldWithButton when a field doesn't have an action button.
 *
 * Dimensions match CreateInDialogButton with size="sm":
 * - h-9 (36px) = sm button height
 * - w-9 (36px) = square, icon-only button size
 */
export const ButtonPlaceholder = ({ className }: ButtonPlaceholderProps) => {
  return (
    <div
      className={cn(
        "h-9 w-9 shrink-0", // Match icon-only button size
        "invisible", // Take space but don't display
        className
      )}
      aria-hidden="true"
    />
  );
};
