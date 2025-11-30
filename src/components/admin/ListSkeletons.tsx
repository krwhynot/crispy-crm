import { Skeleton } from "@/components/ui/skeleton";

interface ListRowSkeletonProps {
  /** Number of columns to render */
  columns?: number;
  /** Whether to show avatar placeholder */
  showAvatar?: boolean;
}

/**
 * Single row skeleton for data grid loading states.
 * Matches the visual structure of PremiumDatagrid rows.
 */
export function ListRowSkeleton({ columns = 5, showAvatar = true }: ListRowSkeletonProps) {
  return (
    <div className="table-row-premium flex items-center gap-4 py-3 px-4">
      {showAvatar && <Skeleton className="h-10 w-10 rounded-full shrink-0" />}
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 ${i === 0 ? "w-32" : i === 1 ? "w-24" : "w-16"} ${i === 0 ? "" : "hidden md:block"}`}
        />
      ))}
    </div>
  );
}

interface ListSkeletonProps {
  /** Number of rows to render */
  rows?: number;
  /** Number of columns per row */
  columns?: number;
  /** Whether to show avatar placeholder */
  showAvatar?: boolean;
}

/**
 * Full list skeleton showing multiple loading rows.
 * Use when entire list is loading (initial load or refresh).
 */
export function ListSkeleton({ rows = 5, columns = 5, showAvatar = true }: ListSkeletonProps) {
  return (
    <div className="space-y-1">
      {/* Header skeleton */}
      <div className="flex items-center gap-4 py-2 px-4 border-b border-border">
        {showAvatar && <div className="w-10" />}
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton
            key={i}
            className={`h-3 ${i === 0 ? "w-20" : "w-14"} ${i < 3 ? "" : "hidden md:block"}`}
          />
        ))}
      </div>

      {/* Row skeletons */}
      {Array.from({ length: rows }).map((_, i) => (
        <ListRowSkeleton key={i} columns={columns} showAvatar={showAvatar} />
      ))}
    </div>
  );
}

interface ContactListSkeletonProps {
  /** Number of contact rows to show */
  rows?: number;
}

/**
 * Contact list specific skeleton matching ContactList column structure.
 * Columns: Avatar, Name, Role, Organization, Status, Notes, Last Activity
 */
export function ContactListSkeleton({ rows = 5 }: ContactListSkeletonProps) {
  return (
    <div className="space-y-1">
      {/* Header */}
      <div className="flex items-center gap-4 py-2 px-4 border-b border-border">
        <div className="w-10" /> {/* Avatar space */}
        <Skeleton className="h-3 w-16" /> {/* Name */}
        <Skeleton className="h-3 w-12 hidden lg:block" /> {/* Role */}
        <Skeleton className="h-3 w-24" /> {/* Organization */}
        <Skeleton className="h-3 w-14" /> {/* Status */}
        <Skeleton className="h-3 w-10 hidden lg:block" /> {/* Notes */}
        <Skeleton className="h-3 w-20 hidden md:block" /> {/* Last Activity */}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="table-row-premium flex items-center gap-4 py-3 px-4">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-20 hidden lg:block" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-5 w-16 rounded-full" /> {/* Badge shape */}
          <Skeleton className="h-4 w-8 hidden lg:block" />
          <Skeleton className="h-4 w-20 hidden md:block" />
        </div>
      ))}
    </div>
  );
}

interface OrganizationListSkeletonProps {
  /** Number of organization rows to show */
  rows?: number;
}

/**
 * Organization list specific skeleton matching OrganizationList column structure.
 * Columns: Name, Type, Priority, Parent, Contacts, Opportunities
 */
export function OrganizationListSkeleton({ rows = 5 }: OrganizationListSkeletonProps) {
  return (
    <div className="space-y-1">
      {/* Header */}
      <div className="flex items-center gap-4 py-2 px-4 border-b border-border">
        <Skeleton className="h-3 w-32" /> {/* Name */}
        <Skeleton className="h-3 w-16" /> {/* Type */}
        <Skeleton className="h-3 w-14" /> {/* Priority */}
        <Skeleton className="h-3 w-24 hidden lg:block" /> {/* Parent */}
        <Skeleton className="h-3 w-14 hidden md:block" /> {/* Contacts */}
        <Skeleton className="h-3 w-20 hidden md:block" /> {/* Opportunities */}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="table-row-premium flex items-center gap-4 py-3 px-4">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-5 w-20 rounded-full" /> {/* Badge shape */}
          <Skeleton className="h-5 w-16 rounded-full" /> {/* Badge shape */}
          <Skeleton className="h-4 w-28 hidden lg:block" />
          <Skeleton className="h-4 w-8 hidden md:block" />
          <Skeleton className="h-4 w-8 hidden md:block" />
        </div>
      ))}
    </div>
  );
}
