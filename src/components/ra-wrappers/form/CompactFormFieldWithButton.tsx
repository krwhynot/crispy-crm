import { cn } from "@/lib/utils";
import { ButtonPlaceholder } from "./ButtonPlaceholder";

interface CompactFormFieldWithButtonProps {
  children: React.ReactNode;
  button?: React.ReactNode;
  className?: string;
  /** Content to render below the field (e.g., warnings) */
  footer?: React.ReactNode;
}

/**
 * Consistent layout for form field + optional action button.
 * Always reserves space for button column to maintain alignment across rows.
 *
 * Usage:
 * - With button: <CompactFormFieldWithButton button={<CreateInDialogButton />}>
 * - Without button: <CompactFormFieldWithButton> (auto-adds placeholder)
 */
export const CompactFormFieldWithButton = ({
  children,
  button,
  className,
  footer,
}: CompactFormFieldWithButtonProps) => {
  return (
    <div className={cn("flex flex-col", className)}>
      <div className="grid grid-cols-[1fr_auto] items-end gap-2">
        <div className="min-w-0">{children}</div>
        {button ?? <ButtonPlaceholder />}
      </div>
      {footer}
    </div>
  );
};
