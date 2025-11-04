import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import type { ReactNode } from "react";

interface DashboardWidgetProps {
  /**
   * Widget title displayed at the top
   */
  title: string;

  /**
   * Widget content (only rendered when not loading and no error)
   */
  children: ReactNode;

  /**
   * Loading state - shows skeleton when true
   */
  isLoading?: boolean;

  /**
   * Error state - shows error message with retry when present
   */
  error?: Error | null;

  /**
   * Retry callback for error recovery
   */
  onRetry?: () => void;

  /**
   * Optional click handler for navigation
   */
  onClick?: () => void;

  /**
   * Optional icon to display next to title
   */
  icon?: ReactNode;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * DashboardWidget - Reusable container for dashboard widgets
 *
 * Provides consistent:
 * - Loading states with skeleton
 * - Error states with retry button
 * - Click actions for navigation
 * - Design system styling
 *
 * Usage:
 * ```tsx
 * <DashboardWidget
 *   title="My Open Opportunities"
 *   isLoading={isPending}
 *   error={error}
 *   onRetry={refetch}
 *   onClick={() => navigate('/opportunities?filter=mine')}
 * >
 *   <div className="text-4xl font-bold">{count}</div>
 * </DashboardWidget>
 * ```
 */
export const DashboardWidget = ({
  title,
  children,
  isLoading = false,
  error = null,
  onRetry,
  onClick,
  icon,
  className = "",
}: DashboardWidgetProps) => {
  const isClickable = Boolean(onClick);

  return (
    <Card
      className={`
        rounded-md p-2 md:p-2.5 lg:p-3
        flex flex-col
        min-h-[60px] md:min-h-[70px] lg:min-h-[80px]
        transition-all duration-200
        ${isClickable ? "cursor-pointer hover:shadow-md active:shadow-sm hover:border-primary/50" : ""}
        ${className}
      `}
      onClick={isClickable && !isLoading && !error ? onClick : undefined}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      aria-label={isClickable ? `View ${title}` : undefined}
    >
      {/* Header: Title + Icon */}
      <div className="flex items-center justify-between gap-2 mb-2 md:mb-3">
        <h3 className="text-xs md:text-sm lg:text-base font-semibold text-muted-foreground tracking-wide uppercase flex-1 min-w-0">
          {title}
        </h3>
        {icon && (
          <div className="flex-shrink-0 text-muted-foreground opacity-75">
            {icon}
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 flex items-center justify-center">
        {/* Loading State */}
        {isLoading && (
          <div className="w-full space-y-3">
            <div className="h-12 bg-muted animate-pulse rounded" />
            <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="flex flex-col items-center justify-center gap-3 text-center py-4">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <div>
              <p className="text-sm font-medium text-destructive mb-1">
                Unable to load
              </p>
              <p className="text-xs text-muted-foreground">{error.message}</p>
            </div>
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onRetry();
                }}
                className="mt-2"
              >
                Retry
              </Button>
            )}
          </div>
        )}

        {/* Success State - Children */}
        {!isLoading && !error && children}
      </div>
    </Card>
  );
};

export default DashboardWidget;
