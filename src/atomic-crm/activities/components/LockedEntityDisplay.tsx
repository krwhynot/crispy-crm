/**
 * LockedEntityDisplay Component
 *
 * Displays a read-only entity field with a "Locked" badge.
 * Used when entity context provides a pre-filled ID that shouldn't be changed.
 *
 * Common use cases:
 * - Activity logging from a specific contact's slide-over
 * - Opportunity-specific actions where the opportunity is fixed
 * - Any form where certain relationships are pre-determined
 */

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export interface LockedEntityDisplayProps {
  /** Field label (e.g., "Contact", "Organization") */
  label: string;
  /** Entity name to display */
  name: string | undefined;
  /** Whether the entity data is still loading */
  loading: boolean;
}

/**
 * Displays a locked (read-only) entity field
 *
 * Shows a disabled-looking input with the entity name and a "Locked" badge
 * to indicate the field cannot be changed.
 *
 * @example
 * ```tsx
 * <LockedEntityDisplay
 *   label="Contact"
 *   name="John Doe"
 *   loading={false}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // While loading
 * <LockedEntityDisplay
 *   label="Organization"
 *   name={undefined}
 *   loading={true}
 * />
 * ```
 */
export function LockedEntityDisplay({ label, name, loading }: LockedEntityDisplayProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex h-11 items-center justify-between rounded-md border border-border bg-muted px-3">
        {loading ? (
          <Skeleton className="h-4 w-32" />
        ) : (
          <span className="text-sm">{name || "Unknown"}</span>
        )}
        <Badge variant="secondary" className="ml-2 text-xs">
          Locked
        </Badge>
      </div>
    </div>
  );
}
