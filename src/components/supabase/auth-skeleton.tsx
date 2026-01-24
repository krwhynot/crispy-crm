import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading skeleton for authentication pages
 *
 * Displays while lazy-loaded auth components are being fetched.
 * Uses semantic colors and matches auth page layout dimensions.
 */
export function AuthSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Skeleton className="h-64 w-80 rounded-lg" />
    </div>
  );
}
