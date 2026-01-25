/**
 * QuickLogFormSkeleton Component
 *
 * Loading skeleton shown while QuickLogForm lazy loads.
 * Matches the form structure for smooth loading transitions.
 *
 * Reusable for similar form patterns that need loading states.
 */

import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton fallback for QuickLogForm
 *
 * Displays placeholder elements that match the actual form structure:
 * - Activity Type section (2 fields)
 * - Who was involved section (2 fields)
 * - Notes section (textarea)
 * - Action buttons (cancel + 2 submit buttons)
 *
 * @example
 * ```tsx
 * <Suspense fallback={<QuickLogFormSkeleton />}>
 *   <QuickLogForm {...props} />
 * </Suspense>
 * ```
 */
export function QuickLogFormSkeleton() {
  return (
    <div className="space-y-4" data-testid="quick-log-form-skeleton">
      {/* Activity Type section */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-11 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-11 w-full" />
        </div>
      </div>

      {/* Who was involved section */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-11 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-11 w-full" />
        </div>
      </div>

      {/* Notes section */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-24 w-full" />
      </div>

      {/* Action buttons */}
      <div className="flex justify-between pt-4">
        <Skeleton className="h-10 w-20" />
        <div className="flex gap-2">
          <Skeleton className="h-11 w-28" />
          <Skeleton className="h-11 w-24" />
        </div>
      </div>
    </div>
  );
}
