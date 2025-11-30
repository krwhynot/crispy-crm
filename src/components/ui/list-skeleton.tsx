import { Skeleton } from "./skeleton";

/**
 * ListSkeleton - Loading placeholder for list views
 *
 * Provides skeleton UI that matches the shape of PremiumDatagrid rows.
 * Used during initial data load to prevent layout shift and indicate loading state.
 *
 * Design System Compliance:
 * - Uses semantic spacing (gap-4 = 16px, p-4 = 16px)
 * - Skeleton heights match actual row content
 * - Responsive column visibility mirrors actual datagrid
 */

interface ListSkeletonProps {
  /** Number of skeleton rows to display */
  rows?: number;
  /** Number of columns (affects skeleton layout) */
  columns?: number;
  /** Show avatar placeholder in first column */
  showAvatar?: boolean;
}

export function ListSkeleton({
  rows = 5,
  columns = 6,
  showAvatar = false,
}: ListSkeletonProps) {
  return (
    <div className="w-full" role="status" aria-label="Loading list">
      {/* Header skeleton */}
      <div className="flex items-center gap-4 p-4 border-b border-border bg-muted/30">
        {showAvatar && <Skeleton className="h-5 w-10 hidden md:block" />}
        {Array.from({ length: columns - (showAvatar ? 1 : 0) }).map((_, i) => (
          <Skeleton
            key={i}
            className={`h-5 ${i === 0 ? "w-32" : "w-24"} ${i > 3 ? "hidden lg:block" : ""}`}
          />
        ))}
      </div>

      {/* Row skeletons */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex items-center gap-4 p-4 border-b border-border hover:bg-muted/20 transition-colors"
        >
          {/* Avatar column (optional) */}
          {showAvatar && (
            <Skeleton className="h-10 w-10 rounded-full hidden md:block shrink-0" />
          )}

          {/* Data columns */}
          {Array.from({ length: columns - (showAvatar ? 1 : 0) }).map((_, colIndex) => {
            // Vary widths for visual interest
            const widths = ["w-40", "w-32", "w-24", "w-20", "w-16", "w-28"];
            const width = widths[colIndex % widths.length];

            // Hide later columns on smaller screens (mirror actual datagrid)
            const responsiveClass =
              colIndex > 4
                ? "hidden lg:block"
                : colIndex > 2
                  ? "hidden md:block"
                  : "";

            return (
              <Skeleton
                key={colIndex}
                className={`h-5 ${width} ${responsiveClass}`}
              />
            );
          })}
        </div>
      ))}

      {/* Screen reader text */}
      <span className="sr-only">Loading content...</span>
    </div>
  );
}

/**
 * ContactListSkeleton - Pre-configured skeleton for ContactList
 */
export function ContactListSkeleton() {
  return <ListSkeleton rows={10} columns={7} showAvatar />;
}

/**
 * OrganizationListSkeleton - Pre-configured skeleton for OrganizationList
 */
export function OrganizationListSkeleton() {
  return <ListSkeleton rows={10} columns={6} showAvatar={false} />;
}

/**
 * SlideOverSkeleton - Loading placeholder for slide-over detail views
 *
 * Matches the shape of field groups in detail tabs.
 */
export function SlideOverSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading details">
      {/* Field groups */}
      {[1, 2, 3].map((group) => (
        <div key={group} className="space-y-4">
          {/* Section header */}
          <Skeleton className="h-5 w-24" />

          {/* Field rows */}
          {[1, 2, 3].map((field) => (
            <div key={field} className="flex items-center gap-4">
              <Skeleton className="h-4 w-20 shrink-0" />
              <Skeleton className="h-4 flex-1 max-w-xs" />
            </div>
          ))}
        </div>
      ))}

      {/* Screen reader text */}
      <span className="sr-only">Loading details...</span>
    </div>
  );
}
