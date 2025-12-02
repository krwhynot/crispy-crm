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

export function ListSkeleton({ rows = 5, columns = 6, showAvatar = false }: ListSkeletonProps) {
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
          {showAvatar && <Skeleton className="h-10 w-10 rounded-full hidden md:block shrink-0" />}

          {/* Data columns */}
          {Array.from({ length: columns - (showAvatar ? 1 : 0) }).map((_, colIndex) => {
            // Vary widths for visual interest
            const widths = ["w-40", "w-32", "w-24", "w-20", "w-16", "w-28"];
            const width = widths[colIndex % widths.length];

            // Hide later columns on smaller screens (mirror actual datagrid)
            const responsiveClass =
              colIndex > 4 ? "hidden lg:block" : colIndex > 2 ? "hidden md:block" : "";

            return <Skeleton key={colIndex} className={`h-5 ${width} ${responsiveClass}`} />;
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
 * ProductListSkeleton - Pre-configured skeleton for ProductList
 */
export function ProductListSkeleton() {
  return <ListSkeleton rows={10} columns={6} showAvatar={false} />;
}

/**
 * TaskListSkeleton - Pre-configured skeleton for TaskList
 */
export function TaskListSkeleton() {
  return <ListSkeleton rows={10} columns={5} showAvatar={false} />;
}

/**
 * ActivityListSkeleton - Pre-configured skeleton for ActivityList
 */
export function ActivityListSkeleton() {
  return <ListSkeleton rows={10} columns={5} showAvatar={false} />;
}

/**
 * SalesListSkeleton - Pre-configured skeleton for SalesList
 */
export function SalesListSkeleton() {
  return <ListSkeleton rows={10} columns={5} showAvatar />;
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

// ============================================================================
// Resource-Specific Detail View Skeletons
// ============================================================================

/**
 * FieldSkeleton - Label + value pair skeleton for detail views.
 * Reusable building block for form-like layouts.
 */
export function FieldSkeleton({
  labelWidth = "w-20",
  valueWidth = "w-32",
}: {
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
 * ContactDetailSkeleton - Matches ContactDetailsTab structure.
 *
 * Skeleton shape mirrors:
 * - Header with avatar
 * - Contact info grid (email, phone, org, department)
 * - Status badges
 * - Notes area
 */
export function ContactDetailSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading contact details">
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

      <span className="sr-only">Loading contact details...</span>
    </div>
  );
}

/**
 * OrganizationDetailSkeleton - Matches OrganizationMainTab structure.
 *
 * Skeleton shape mirrors:
 * - Header with type/priority badges
 * - Info grid (website, phone, email, segment)
 * - Address section
 * - Stats (contacts, opportunities counts)
 */
export function OrganizationDetailSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading organization details">
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

      <span className="sr-only">Loading organization details...</span>
    </div>
  );
}

/**
 * ActivityTimelineSkeleton - Loading skeleton for activity timeline tabs.
 */
export function ActivityTimelineSkeleton({ items = 3 }: { items?: number }) {
  return (
    <div className="space-y-4" role="status" aria-label="Loading activities">
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
      <span className="sr-only">Loading activities...</span>
    </div>
  );
}

/**
 * NotesListSkeleton - Loading skeleton for notes tab.
 */
export function NotesListSkeleton({ items = 2 }: { items?: number }) {
  return (
    <div className="space-y-4" role="status" aria-label="Loading notes">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="border border-border rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-32" /> {/* Author */}
            <Skeleton className="h-3 w-20" /> {/* Date */}
          </div>
          <Skeleton className="h-16 w-full" /> {/* Note content */}
        </div>
      ))}
      <span className="sr-only">Loading notes...</span>
    </div>
  );
}
