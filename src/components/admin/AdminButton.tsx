/**
 * AdminButton - Tier 2 wrapper for shadcn Button
 *
 * Enforces design system constraints:
 * - Minimum 44px touch targets (base Button already uses h-12 = 48px)
 * - Semantic color variants via shadcn/ui
 * - Consistent loading state pattern with Loader2 spinner
 *
 * @example
 * ```tsx
 * <AdminButton isLoading={isPending}>Save</AdminButton>
 * <AdminButton variant="destructive" isLoading={isDeleting} loadingText="Deleting...">
 *   Delete
 * </AdminButton>
 * ```
 */
import { forwardRef, type ComponentProps } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ButtonProps = ComponentProps<typeof Button>;

export interface AdminButtonProps extends ButtonProps {
  /** Shows loading spinner and disables button */
  isLoading?: boolean;
  /** Loading text (default: preserves children) */
  loadingText?: string;
}

export const AdminButton = forwardRef<HTMLButtonElement, AdminButtonProps>(
  ({ isLoading, loadingText, children, disabled, className, ...props }, ref) => {
    return (
      <Button ref={ref} disabled={disabled || isLoading} className={cn(className)} {...props}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            <span>{loadingText ?? children}</span>
          </>
        ) : (
          children
        )}
      </Button>
    );
  }
);

AdminButton.displayName = "AdminButton";
