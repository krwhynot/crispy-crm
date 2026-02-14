import { useState, useEffect, useMemo } from "react";
import { useGetIdentity, downloadCSV, useNotify } from "ra-core";
import { getWeekRange } from "@/atomic-crm/utils";
import jsonExport from "jsonexport/dist";
import { Activity, Users, TrendingUp, ChevronRight, Download } from "lucide-react";
import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";
import { AdminButton } from "@/components/admin/AdminButton";
import { KPICard } from "@/components/ui/kpi-card";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { pluralize } from "@/lib/utils/pluralize";
import { sanitizeCsvValue } from "@/atomic-crm/utils/csvUploadValidator";
import { AppliedFiltersBar, EmptyState } from "./components";
import { useReportData, useReportFilterState, type WeeklyFilterState } from "./hooks";
import { LOW_ACTIVITY_THRESHOLD } from "@/atomic-crm/constants/appConstants";
import type { ActivityRecord } from "../types";

/** Read-only fields from activities_summary view used by this report */
type WeeklyActivityRecord = ActivityRecord & {
  principal_organization_id: number | null;
  principal_organization_name: string | null;
  creator_first_name: string | null;
  creator_last_name: string | null;
};

interface RepInfo {
  id: number;
  name: string;
}

interface PrincipalStats {
  principalName: string;
  call: number;
  email: number;
  meeting: number;
  follow_up: number;
  demo: number;
  proposal: number;
  note: number;
  other: number;
  total: number;
}

interface RepGroup {
  rep: RepInfo;
  principals: Map<number, PrincipalStats>;
}

/**
 * Weekly Activity Summary Report
 *
 * Shows activity counts by rep and principal for manager visibility.
 * Groups: Sales Rep -> Principal -> Activity Type Counts
 *
 * Flags low-activity principals (< LOW_ACTIVITY_THRESHOLD activities/week) with warning.
 *
 * CSV Export: rep_name, principal_name, call, email, meeting, follow_up, demo, proposal, notes, other, total
 */
export default function WeeklyActivitySummary() {
  const { data: identity } = useGetIdentity();
  const notify = useNotify();
  const weeklyDefaults: WeeklyFilterState = getWeekRange();
  const [filterState, _updateFilters, resetFilters] = useReportFilterState<WeeklyFilterState>(
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

  // Fetch activities for date range (view includes principal + creator fields)
  const {
    data: activities,
    isLoading: activitiesLoading,
    error: activitiesError,
  } = useReportData<WeeklyActivityRecord>("activities", {
    dateRange: stableDateRange,
    dateField: "activity_date",
  });

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

  // Group activities by rep -> principal -> type
  const reportData = useMemo(() => {
    if (!activities) return [];

    const groups = new Map<number, RepGroup>();

    activities.forEach((activity) => {
      if (!activity.created_by) return;

      if (!groups.has(activity.created_by)) {
        const repName = activity.creator_first_name
          ? `${activity.creator_first_name} ${activity.creator_last_name || ""}`.trim()
          : `Unknown Rep (#${activity.created_by})`;
        groups.set(activity.created_by, {
          rep: { id: activity.created_by, name: repName },
          principals: new Map(),
        });
      }

      const repGroup = groups.get(activity.created_by)!;

      const principalId = activity.principal_organization_id || 0;
      if (!repGroup.principals.has(principalId)) {
        let principalName: string;
        if (principalId === 0) {
          principalName = "No Principal";
        } else if (activity.principal_organization_name) {
          principalName = activity.principal_organization_name;
        } else {
          principalName = `Principal #${principalId}`;
        }
        repGroup.principals.set(principalId, {
          principalName,
          call: 0,
          email: 0,
          meeting: 0,
          follow_up: 0,
          demo: 0,
          proposal: 0,
          note: 0,
          other: 0,
          total: 0,
        });
      }

      const principalStats = repGroup.principals.get(principalId)!;

      // Count by interaction type (activity.type)
      const typeKey = activity.type;
      if (typeKey === "call") principalStats.call++;
      else if (typeKey === "email") principalStats.email++;
      else if (typeKey === "meeting") principalStats.meeting++;
      else if (typeKey === "follow_up") principalStats.follow_up++;
      else if (typeKey === "demo") principalStats.demo++;
      else if (typeKey === "proposal") principalStats.proposal++;
      else if (typeKey === "note") principalStats.note++;
      else principalStats.other++;

      principalStats.total++;
    });

    return Array.from(groups.values());
  }, [activities]);

  const handleExport = () => {
    const exportData: Array<{
      rep_name: string;
      principal_name: string;
      call: number;
      email: number;
      meeting: number;
      follow_up: number;
      demo: number;
      proposal: number;
      notes: number;
      other: number;
      total: number;
    }> = [];

    reportData.forEach((repGroup) => {
      repGroup.principals.forEach((stats) => {
        exportData.push({
          rep_name: sanitizeCsvValue(repGroup.rep.name),
          principal_name: sanitizeCsvValue(stats.principalName),
          call: stats.call,
          email: stats.email,
          meeting: stats.meeting,
          follow_up: stats.follow_up,
          demo: stats.demo,
          proposal: stats.proposal,
          notes: stats.note,
          other: stats.other,
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

  // Collapsible rep card state: auto-expand first 2 reps on initial data load
  const [expandedReps, setExpandedReps] = useState<Set<number>>(new Set());
  const [hasAutoExpanded, setHasAutoExpanded] = useState(false);
  useEffect(() => {
    if (reportData.length > 0 && !hasAutoExpanded) {
      setExpandedReps(new Set(reportData.slice(0, 2).map((rg) => rg.rep.id)));
      setHasAutoExpanded(true);
    }
  }, [reportData, hasAutoExpanded]);

  const toggleRep = (repId: number) => {
    setExpandedReps((prev) => {
      const next = new Set(prev);
      if (next.has(repId)) next.delete(repId);
      else next.add(repId);
      return next;
    });
  };

  if (isFirstLoad) {
    return (
      <div className="space-y-widget">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-content">
          <KPICard title="Total Activities" value={0} icon={Activity} loading />
          <KPICard title="Active Reps" value={0} icon={Users} loading />
          <KPICard title="Avg per Rep" value={0} icon={TrendingUp} loading />
        </div>
        <p className="text-muted-foreground">Loading activities...</p>
      </div>
    );
  }

  const totalActivities = activities?.length || 0;

  return (
    <div className="space-y-widget">
      {isRefreshing && (
        <div className="text-xs text-muted-foreground animate-pulse" role="status">
          Updating...
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <AppliedFiltersBar
          filters={appliedFilters}
          onResetAll={handleResetAllFilters}
          hasActiveFilters={hasActiveFilters}
        />
        <AdminButton
          variant="outline"
          size="sm"
          className="h-11 shrink-0 gap-2"
          onClick={handleExport}
          disabled={!hasActivityData}
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Export CSV
        </AdminButton>
      </div>

      {/* Error display (fail-fast principle) */}
      {activitiesError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          <p className="font-medium">Failed to load activities</p>
          <p className="text-sm">{activitiesError.message}</p>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-content">
        <KPICard title="Total Activities" value={totalActivities} icon={Activity} />
        <KPICard title="Active Reps" value={reportData.length} icon={Users} />
        <KPICard
          title="Avg per Rep"
          value={reportData.length > 0 ? Math.round(totalActivities / reportData.length) : 0}
          icon={TrendingUp}
        />
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
        <div className="space-y-widget">
          {reportData.map((repGroup) => (
            <RepActivityCard
              key={repGroup.rep.id}
              repGroup={repGroup}
              isExpanded={expandedReps.has(repGroup.rep.id)}
              onToggle={() => toggleRep(repGroup.rep.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface RepActivityCardProps {
  repGroup: RepGroup;
  isExpanded: boolean;
  onToggle: () => void;
}

function RepActivityCard({ repGroup, isExpanded, onToggle }: RepActivityCardProps) {
  const totalActivities = Array.from(repGroup.principals.values()).reduce(
    (sum, p) => sum + p.total,
    0
  );

  const principalStats = Array.from(repGroup.principals.entries()).toSorted(
    ([, a], [, b]) => b.total - a.total
  );

  // Compute top 3 activity types for collapsed preview badges
  const topTypes = useMemo(() => {
    const typeTotals = new Map<string, number>();
    for (const [, stats] of repGroup.principals) {
      if (stats.call > 0) typeTotals.set("Call", (typeTotals.get("Call") ?? 0) + stats.call);
      if (stats.email > 0) typeTotals.set("Email", (typeTotals.get("Email") ?? 0) + stats.email);
      if (stats.meeting > 0)
        typeTotals.set("Meeting", (typeTotals.get("Meeting") ?? 0) + stats.meeting);
      if (stats.follow_up > 0)
        typeTotals.set("Follow-up", (typeTotals.get("Follow-up") ?? 0) + stats.follow_up);
      if (stats.demo > 0) typeTotals.set("Demo", (typeTotals.get("Demo") ?? 0) + stats.demo);
      if (stats.proposal > 0)
        typeTotals.set("Proposal", (typeTotals.get("Proposal") ?? 0) + stats.proposal);
      if (stats.note > 0) typeTotals.set("Notes", (typeTotals.get("Notes") ?? 0) + stats.note);
      if (stats.other > 0) typeTotals.set("Other", (typeTotals.get("Other") ?? 0) + stats.other);
    }
    return Array.from(typeTotals.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);
  }, [repGroup.principals]);

  return (
    <Card>
      <button
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls={`rep-content-${repGroup.rep.id}`}
        className="flex w-full items-center justify-between p-content h-11 text-left"
      >
        <div className="flex items-center gap-content">
          <ChevronRight
            className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-90")}
            aria-hidden="true"
          />
          <span className="font-medium truncate" title={repGroup.rep.name}>
            {repGroup.rep.name}
          </span>
        </div>
        <div className="flex items-center gap-compact">
          {/* Mini breakdown badges for collapsed state */}
          {!isExpanded && (
            <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground">
              {topTypes.map(([type, count]) => (
                <Badge key={type} variant="outline" className="text-xs">
                  {type}: {count}
                </Badge>
              ))}
            </div>
          )}
          <Badge>{pluralize(totalActivities, "activity", "activities")}</Badge>
        </div>
      </button>
      {isExpanded && (
        <CardContent id={`rep-content-${repGroup.rep.id}`}>
          <div className="overflow-x-auto -mx-6">
            <div className="px-6">
              <table className="w-full min-w-[800px] border-separate border-spacing-0">
                <thead>
                  <tr className="text-sm text-muted-foreground">
                    <th
                      scope="col"
                      className="text-left py-2 px-3 border-b sticky left-0 bg-card z-10 min-w-[140px] shadow-col-sticky"
                    >
                      Principal
                    </th>
                    <th scope="col" className="text-right py-2 border-b">
                      Call
                    </th>
                    <th scope="col" className="text-right py-2 border-b">
                      Email
                    </th>
                    <th scope="col" className="text-right py-2 border-b">
                      Meeting
                    </th>
                    <th scope="col" className="text-right py-2 border-b">
                      Follow-up
                    </th>
                    <th scope="col" className="text-right py-2 border-b">
                      Demo
                    </th>
                    <th scope="col" className="text-right py-2 border-b">
                      Proposal
                    </th>
                    <th scope="col" className="text-right py-2 border-b">
                      Notes
                    </th>
                    <th scope="col" className="text-right py-2 border-b">
                      Other
                    </th>
                    <th scope="col" className="text-right py-2 border-b">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {principalStats.map(([principalKey, stats]) => (
                    <tr
                      key={principalKey}
                      className={`group ${stats.total < LOW_ACTIVITY_THRESHOLD ? "bg-warning/10" : ""}`}
                      data-warning={stats.total < LOW_ACTIVITY_THRESHOLD || undefined}
                    >
                      <td className="py-2 px-3 border-b sticky left-0 bg-card z-10 shadow-col-sticky group-data-[warning]:bg-warning/10">
                        <div className="flex items-center gap-2">
                          {stats.principalName}
                          {stats.total < LOW_ACTIVITY_THRESHOLD && (
                            <Badge variant="outline" className="text-xs">
                              Low Activity
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="text-right border-b">{stats.call}</td>
                      <td className="text-right border-b">{stats.email}</td>
                      <td className="text-right border-b">{stats.meeting}</td>
                      <td className="text-right border-b">{stats.follow_up}</td>
                      <td className="text-right border-b">{stats.demo}</td>
                      <td className="text-right border-b">{stats.proposal}</td>
                      <td className="text-right border-b">{stats.note}</td>
                      <td className="text-right border-b">{stats.other}</td>
                      <td className="text-right font-semibold border-b">{stats.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
