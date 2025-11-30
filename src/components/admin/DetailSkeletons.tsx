import { Skeleton } from "@/components/ui/skeleton";

/**
 * Field skeleton for detail views - label + value pair.
 */
export function FieldSkeleton({ labelWidth = "w-20", valueWidth = "w-32" }: {
  labelWidth?: string;
  valueWidth?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Skeleton className={`h-3 ${labelWidth}`} />
      <Skeleton className={`h-5 ${valueWidth}`} />
    </div>
  );
}

/**
 * Contact detail view skeleton matching ContactDetailsTab structure.
 */
export function ContactDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header section with avatar */}
      <div className="flex items-start gap-4">
        <Skeleton className="h-16 w-16 rounded-full shrink-0" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-6 w-48" /> {/* Name */}
          <Skeleton className="h-4 w-32" /> {/* Title */}
        </div>
      </div>

      {/* Contact info section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FieldSkeleton labelWidth="w-12" valueWidth="w-40" /> {/* Email */}
        <FieldSkeleton labelWidth="w-14" valueWidth="w-28" /> {/* Phone */}
        <FieldSkeleton labelWidth="w-24" valueWidth="w-36" /> {/* Organization */}
        <FieldSkeleton labelWidth="w-20" valueWidth="w-24" /> {/* Department */}
      </div>

      {/* Status section */}
      <div className="flex gap-4">
        <Skeleton className="h-6 w-20 rounded-full" /> {/* Status badge */}
        <Skeleton className="h-6 w-24 rounded-full" /> {/* Tag */}
      </div>

      {/* Notes section */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" /> {/* Label */}
        <Skeleton className="h-20 w-full" /> {/* Notes area */}
      </div>
    </div>
  );
}

/**
 * Organization detail view skeleton matching OrganizationDetailsTab structure.
 */
export function OrganizationDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-56" /> {/* Name */}
        <div className="flex gap-2">
          <Skeleton className="h-5 w-20 rounded-full" /> {/* Type badge */}
          <Skeleton className="h-5 w-16 rounded-full" /> {/* Priority badge */}
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FieldSkeleton labelWidth="w-16" valueWidth="w-36" /> {/* Website */}
        <FieldSkeleton labelWidth="w-14" valueWidth="w-28" /> {/* Phone */}
        <FieldSkeleton labelWidth="w-12" valueWidth="w-40" /> {/* Email */}
        <FieldSkeleton labelWidth="w-20" valueWidth="w-24" /> {/* Segment */}
      </div>

      {/* Address section */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" /> {/* Label */}
        <Skeleton className="h-4 w-48" /> {/* Address line 1 */}
        <Skeleton className="h-4 w-36" /> {/* City, State */}
      </div>

      {/* Stats section */}
      <div className="flex gap-6">
        <div className="space-y-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-6 w-8" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-6 w-8" />
        </div>
      </div>
    </div>
  );
}

/**
 * Activity timeline skeleton for ActivitiesTab.
 */
export function ActivityTimelineSkeleton({ items = 3 }: { items?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-24" /> {/* Activity type */}
              <Skeleton className="h-3 w-20" /> {/* Date */}
            </div>
            <Skeleton className="h-4 w-full max-w-md" /> {/* Description */}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Notes list skeleton for NotesTab.
 */
export function NotesListSkeleton({ items = 2 }: { items?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="border border-border rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-32" /> {/* Author */}
            <Skeleton className="h-3 w-20" /> {/* Date */}
          </div>
          <Skeleton className="h-16 w-full" /> {/* Note content */}
        </div>
      ))}
    </div>
  );
}
