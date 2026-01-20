import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

interface FormLoadingSkeletonProps {
  /** Number of field rows to show (default: 4) */
  rows?: number;
  /** Show 2-column grid for each row (default: true) */
  twoColumn?: boolean;
}

/**
 * Loading skeleton for forms waiting on async data (e.g., identity).
 * Matches the visual structure of FormGrid's 2-column layout.
 *
 * Usage in Create forms:
 * ```tsx
 * const { defaults, isLoading } = useSmartDefaults();
 * if (isLoading) return <FormLoadingSkeleton rows={4} />;
 * ```
 */
export const FormLoadingSkeleton = ({ rows = 4, twoColumn = true }: FormLoadingSkeletonProps) => (
  <Card data-slot="card">
    <CardContent className="space-y-6 p-6">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className={twoColumn ? "grid grid-cols-2 gap-6" : ""}>
          {/* First field */}
          <div className="space-y-2">
            <Skeleton data-slot="skeleton" className="h-4 w-20" />
            <Skeleton data-slot="skeleton" className="h-11 w-full" />
          </div>

          {/* Second field (only in 2-column mode) */}
          {twoColumn && (
            <div className="space-y-2">
              <Skeleton data-slot="skeleton" className="h-4 w-20" />
              <Skeleton data-slot="skeleton" className="h-11 w-full" />
            </div>
          )}
        </div>
      ))}
    </CardContent>
  </Card>
);
