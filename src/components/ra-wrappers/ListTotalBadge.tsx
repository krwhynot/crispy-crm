import { useListContext } from "ra-core";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * ListTotalBadge - Displays the total record count from ListContext.
 *
 * Renders as a parenthesized count (e.g., "(123)") next to a list title.
 * Shows a skeleton while data is loading. Must be used inside a ListContext.
 */
export function ListTotalBadge() {
  const { total, isPending } = useListContext();

  if (isPending) {
    return <Skeleton className="h-4 w-10 inline-block" />;
  }

  return <span className="text-sm text-muted-foreground tabular-nums">({total ?? 0})</span>;
}
