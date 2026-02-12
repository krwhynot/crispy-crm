import { useMemo } from "react";
import { useGetList, useGetIdentity, downloadCSV, useNotify } from "ra-core";
import { getWeekRange } from "@/atomic-crm/utils";
import jsonExport from "jsonexport/dist";
import { Activity } from "lucide-react";
import { logger } from "@/lib/logger";
import { ReportLayout } from "./ReportLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { pluralize } from "@/lib/utils/pluralize";
import { sanitizeCsvValue } from "@/atomic-crm/utils/csvUploadValidator";
import { AppliedFiltersBar, EmptyState } from "./components";
import { useReportData, useReportFilterState, type WeeklyFilterState } from "./hooks";
import { DEFAULT_PAGE_SIZE, LOW_ACTIVITY_THRESHOLD } from "@/atomic-crm/constants/appConstants";
import type { ActivityRecord, Organization, Sale } from "../types";

/**
 * Weekly Activity Summary Report
 *
 * Shows activity counts by rep and principal for manager visibility.
 * Groups: Sales Rep → Principal → Activity Type Counts
 *
 * Flags low-activity principals (< LOW_ACTIVITY_THRESHOLD activities/week) with warning.
 *
 * CSV Export: rep_name, principal_name, calls, emails, meetings, tasks, notes, total
 */
export default function WeeklyActivitySummary() {
  const { data: identity } = useGetIdentity();
  const notify = useNotify();
  const weeklyDefaults: WeeklyFilterState = getWeekRange();
  const [filterState, updateFilters, resetFilters] = useReportFilterState<WeeklyFilterState>(
    "reports.weekly",
    weeklyDefaults
  );
  const dateRange = useMemo(
    () => ({ start: filterState.start, end: filterState.end }),
    [filterState.start, filterState.end]
  );

  // CRITICAL: Memoize Date objects to prevent render loop
  // new Date() creates new object reference every render, causing useReportData
  // to see "changed" dependencies and re-fetch continuously
  const stableDateRange = useMemo(
    () => ({
      start: new Date(dateRange.start),
      end: new Date(dateRange.end),
    }),
    [dateRange.start, dateRange.end] // Depend on primitives, not objects
  );

  // Fetch activities for date range
  const {
    data: activities,
    isLoading: activitiesLoading,
    error: activitiesError,
  } = useReportData<ActivityRecord>("activities", {
    dateRange: stableDateRange,
    dateField: "activity_date",
  });

  // Fetch sales reps
  const createdByIds = useMemo(
    () => Array.from(new Set((activities || []).map((a) => a.created_by).filter(Boolean))),
    [activities]
  );

  // Memoize filter to prevent render loop (inline objects cause re-fetches)
  const salesFilter = useMemo(
    () => (createdByIds.length > 0 ? { id: createdByIds } : undefined),
    [createdByIds]
  );

  const { data: sales } = useGetList<Sale>("sales", {
    pagination: { page: 1, perPage: DEFAULT_PAGE_SIZE },
    filter: salesFilter,
  });

  // Fetch organizations (principals)
  const orgIds = useMemo(
    () => Array.from(new Set((activities || []).map((a) => a.organization_id).filter(Boolean))),
    [activities]
  );

  // Memoize filter to prevent render loop
  const orgsFilter = useMemo(() => (orgIds.length > 0 ? { id: orgIds } : undefined), [orgIds]);

  const { data: organizations } = useGetList<Organization>("organizations", {
    pagination: { page: 1, perPage: DEFAULT_PAGE_SIZE },
    filter: orgsFilter,
  });

  // Build lookup maps
  const salesMap = useMemo(() => new Map((sales || []).map((s) => [s.id, s])), [sales]);

  const orgMap = useMemo(
    () => new Map((organizations || []).map((o) => [o.id, o])),
    [organizations]
  );

  // Applied filters for filter bar
  const appliedFilters = useMemo(() => {
    const result: Array<{ label: string; value: string; onRemove: () => void }> = [];

    // Week filter (always show current date range)
    result.push({
      label: "Week",
      value: `${dateRange.start} to ${dateRange.end}`,
      onRemove: () => {
        resetFilters();
      },
    });

    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- resetFilters is stable (useCallback with defaults dep)
  }, [dateRange.start, dateRange.end, resetFilters]);

  // Check if we're viewing current week (not a non-default filter)
  const isCurrentWeek = useMemo(() => {
    const currentWeek = getWeekRange();
    const currentStart = currentWeek.start;
    const currentEnd = currentWeek.end;
    return dateRange.start === currentStart && dateRange.end === currentEnd;
  }, [dateRange.start, dateRange.end]);

  const hasActiveFilters = !isCurrentWeek;

  const handleResetAllFilters = () => {
    resetFilters();
  };

  // Group activities by rep → principal → type
  const reportData = useMemo(() => {
    if (!activities) return [];

    const groups = new Map<
      number,
      {
        rep: Sale;
        principals: Map<
          number,
          {
            org: Organization;
            calls: number;
            emails: number;
            meetings: number;
            tasks: number;
            notes: number;
            total: number;
          }
        >;
      }
    >();

    activities.forEach((activity) => {
      if (!activity.created_by) return;

      const rep = salesMap.get(activity.created_by);
      if (!rep) return;

      if (!groups.has(activity.created_by)) {
        groups.set(activity.created_by, { rep, principals: new Map() });
      }

      const repGroup = groups.get(activity.created_by)!;

      const orgId = activity.organization_id || 0;
      if (!repGroup.principals.has(orgId)) {
        const org = orgId ? orgMap.get(orgId) : null;
        repGroup.principals.set(orgId, {
          org: org || ({ id: 0, name: "No Principal" } as Organization),
          calls: 0,
          emails: 0,
          meetings: 0,
          tasks: 0,
          notes: 0,
          total: 0,
        });
      }

      const principalStats = repGroup.principals.get(orgId)!;

      // Count by type: tasks use activity_type field, others use interaction type field
      if (activity.activity_type === "task") principalStats.tasks++;
      else if (activity.type === "call") principalStats.calls++;
      else if (activity.type === "email") principalStats.emails++;
      else if (activity.type === "meeting") principalStats.meetings++;
      else principalStats.notes++;

      principalStats.total++;
    });

    return Array.from(groups.values());
  }, [activities, salesMap, orgMap]);

  const handleExport = () => {
    const exportData: Array<{
      rep_name: string;
      principal_name: string;
      calls: number;
      emails: number;
      meetings: number;
      tasks: number;
      notes: number;
      total: number;
    }> = [];

    reportData.forEach((repGroup) => {
      repGroup.principals.forEach((stats) => {
        exportData.push({
          rep_name: sanitizeCsvValue(`${repGroup.rep.first_name} ${repGroup.rep.last_name}`),
          principal_name: sanitizeCsvValue(stats.org.name),
          calls: stats.calls,
          emails: stats.emails,
          meetings: stats.meetings,
          tasks: stats.tasks,
          notes: stats.notes,
          total: stats.total,
        });
      });
    });

    jsonExport(exportData, (err, csv) => {
      if (err) {
        logger.error("Export error", err, { feature: "WeeklyActivitySummary" });
        notify("Export failed. Please try again.", { type: "error" });
        return;
      }
      downloadCSV(csv, `weekly-activity-${dateRange.start}-to-${dateRange.end}`);
      notify("Report exported successfully", { type: "success" });
    });
  };

  const hasActivityData = (activities?.length ?? 0) > 0;
  const isFirstLoad = (activitiesLoading || !identity) && !hasActivityData;
  const isRefreshing = activitiesLoading && hasActivityData;

  if (isFirstLoad) {
    return (
      <ReportLayout title="Weekly Activity Summary">
        <p className="text-muted-foreground">Loading activities...</p>
      </ReportLayout>
    );
  }

  const totalActivities = activities?.length || 0;

  return (
    <ReportLayout
      title="Weekly Activity Summary"
      onExport={handleExport}
      actions={
        <div className="flex items-center gap-2">
          <label htmlFor="activity-start-date" className="sr-only">
            Start date
          </label>
          <input
            id="activity-start-date"
            type="date"
            aria-label="Start date"
            value={dateRange.start}
            onChange={(e) => updateFilters({ start: e.target.value })}
            className="h-11 px-3 py-2 border rounded text-sm"
          />
          <span className="text-muted-foreground" aria-hidden="true">
            to
          </span>
          <label htmlFor="activity-end-date" className="sr-only">
            End date
          </label>
          <input
            id="activity-end-date"
            type="date"
            aria-label="End date"
            value={dateRange.end}
            onChange={(e) => updateFilters({ end: e.target.value })}
            className="h-11 px-3 py-2 border rounded text-sm"
          />
        </div>
      }
    >
      {isRefreshing && (
        <div className="text-xs text-muted-foreground animate-pulse mb-4" role="status">
          Updating...
        </div>
      )}

      <AppliedFiltersBar
        filters={appliedFilters}
        onResetAll={handleResetAllFilters}
        hasActiveFilters={hasActiveFilters}
      />

      <div className="space-y-section">
        {/* Error display (fail-fast principle) */}
        {activitiesError && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
            <p className="font-medium">Failed to load activities</p>
            <p className="text-sm">{activitiesError.message}</p>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-content">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Activities</p>
              <p className="text-2xl font-bold">{totalActivities}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Active Reps</p>
              <p className="text-2xl font-bold">{reportData.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Avg per Rep</p>
              <p className="text-2xl font-bold">
                {reportData.length > 0 ? Math.round(totalActivities / reportData.length) : 0}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Rep Activity Breakdown */}
        {reportData.length === 0 && !activitiesLoading && !activitiesError && (
          <EmptyState
            title="No Activities This Week"
            description="Log calls, emails, or meetings to see activity summaries."
            icon={Activity}
          />
        )}
        {reportData.length > 0 && (
          <div className="space-y-6">
            {reportData.map((repGroup) => (
              <RepActivityCard key={repGroup.rep.id} repGroup={repGroup} />
            ))}
          </div>
        )}
      </div>
    </ReportLayout>
  );
}

interface RepActivityCardProps {
  repGroup: {
    rep: Sale;
    principals: Map<
      number,
      {
        org: Organization;
        calls: number;
        emails: number;
        meetings: number;
        tasks: number;
        notes: number;
        total: number;
      }
    >;
  };
}

function RepActivityCard({ repGroup }: RepActivityCardProps) {
  const totalActivities = Array.from(repGroup.principals.values()).reduce(
    (sum, p) => sum + p.total,
    0
  );

  const principalStats = Array.from(repGroup.principals.values()).toSorted(
    (a, b) => b.total - a.total
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>
            {repGroup.rep.first_name} {repGroup.rep.last_name}
          </span>
          <Badge>{pluralize(totalActivities, "activity", "activities")}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <table className="w-full">
          <thead>
            <tr className="border-b text-sm text-muted-foreground">
              <th className="text-left py-2">Principal</th>
              <th className="text-right py-2">Calls</th>
              <th className="text-right py-2">Emails</th>
              <th className="text-right py-2">Meetings</th>
              <th className="text-right py-2">Tasks</th>
              <th className="text-right py-2">Notes</th>
              <th className="text-right py-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {principalStats.map((stats, idx) => (
              <tr
                key={stats.org.id || idx}
                className={`border-b ${stats.total < LOW_ACTIVITY_THRESHOLD ? "bg-warning/10" : ""}`}
              >
                <td className="py-2 flex items-center gap-2">
                  {stats.org.name}
                  {stats.total < LOW_ACTIVITY_THRESHOLD && (
                    <Badge variant="outline" className="text-xs">
                      ⚠️ Low Activity
                    </Badge>
                  )}
                </td>
                <td className="text-right">{stats.calls}</td>
                <td className="text-right">{stats.emails}</td>
                <td className="text-right">{stats.meetings}</td>
                <td className="text-right">{stats.tasks}</td>
                <td className="text-right">{stats.notes}</td>
                <td className="text-right font-semibold">{stats.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
