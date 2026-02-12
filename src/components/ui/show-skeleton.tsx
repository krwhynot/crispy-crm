import { Skeleton } from "./skeleton";
import { FieldSkeleton } from "./list-skeleton";

/**
 * OpportunityDetailSkeleton - Matches OpportunityShow layout.
 *
 * Skeleton shape mirrors:
 * - TrackRecordView header area
 * - ResponsiveGrid (dashboard variant: 7fr main + 3fr aside)
 * - Main: SectionCard with OpportunityHeader, 3-tab TabsList,
 *   Details content (OrganizationInfoCard, WorkflowSection, field pairs,
 *   contacts list, products table)
 * - Aside: 3 AsideSection groups (Pipeline Status, Key Dates, Ownership)
 */
export function OpportunityDetailSkeleton() {
  return (
    <div role="status" aria-label="Loading opportunity details">
      {/* TrackRecordView header area */}
      <div className="mb-2">
        <Skeleton className="h-8 w-48" />
      </div>

      {/* ResponsiveGrid: dashboard variant (7fr / 3fr) */}
      <div className="grid grid-cols-1 lg:grid-cols-[7fr_3fr] gap-6 mt-2 mb-2">
        {/* Main content */}
        <div className="space-y-6">
          {/* SectionCard wrapper */}
          <div className="rounded-lg border border-border p-6 space-y-6">
            {/* OpportunityHeader: name + badges */}
            <div className="space-y-2">
              <Skeleton className="h-7 w-64" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </div>

            {/* 3-tab TabsList */}
            <div className="grid w-full grid-cols-3 gap-1 rounded-lg bg-muted p-1">
              <Skeleton className="h-8 rounded-md" />
              <Skeleton className="h-8 rounded-md" />
              <Skeleton className="h-8 rounded-md" />
            </div>

            {/* Details tab content */}
            <div className="space-y-6 pt-4">
              {/* OrganizationInfoCard */}
              <div className="rounded-lg border border-border p-4 space-y-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-5 w-36" />
              </div>

              {/* WorkflowManagementSection */}
              <Skeleton className="h-32 w-full rounded-lg" />

              {/* Field pairs row: Expected closing date, Stage, Priority */}
              <div className="flex gap-8">
                <FieldSkeleton labelWidth="w-28" valueWidth="w-32" />
                <FieldSkeleton labelWidth="w-12" valueWidth="w-20" />
                <FieldSkeleton labelWidth="w-16" valueWidth="w-16" />
              </div>

              {/* Contacts list: 3 avatar + name rows */}
              <div className="space-y-3">
                <Skeleton className="h-3 w-16" />
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </div>

              {/* Products table */}
              <div className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-20 w-full rounded-md" />
              </div>
            </div>
          </div>
        </div>

        {/* Aside: 3 field groups matching AsideSection pattern */}
        <div className="hidden sm:block space-y-6">
          {/* Pipeline Status section */}
          <div className="space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-px w-full" />
            <FieldSkeleton labelWidth="w-12" valueWidth="w-20" />
            <FieldSkeleton labelWidth="w-16" valueWidth="w-16" />
            <FieldSkeleton labelWidth="w-12" valueWidth="w-20" />
          </div>

          {/* Key Dates section */}
          <div className="space-y-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-px w-full" />
            <FieldSkeleton labelWidth="w-24" valueWidth="w-28" />
            <FieldSkeleton labelWidth="w-20" valueWidth="w-32" />
          </div>

          {/* Ownership section */}
          <div className="space-y-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-px w-full" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-6 rounded-full shrink-0" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-6 rounded-full shrink-0" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
        </div>
      </div>

      <span className="sr-only">Loading...</span>
    </div>
  );
}

/**
 * SalesDetailSkeleton - Matches SalesShow layout.
 *
 * Skeleton shape mirrors:
 * - Single SectionCard with avatar, name, email, role, status
 */
export function SalesDetailSkeleton() {
  return (
    <div className="mt-2 mb-2" role="status" aria-label="Loading sales details">
      <div className="rounded-lg border border-border p-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <Skeleton className="h-11 w-11 rounded-full shrink-0" />

          {/* Info */}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-40" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </div>
      </div>

      <span className="sr-only">Loading...</span>
    </div>
  );
}
