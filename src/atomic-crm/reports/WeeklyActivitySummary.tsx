import { useState, useMemo } from "react";
import { useGetList, useGetIdentity, downloadCSV, useNotify } from "ra-core";
import { startOfWeek, endOfWeek, format } from "date-fns";
import jsonExport from "jsonexport/dist";
import { Activity } from "lucide-react";
import { ReportLayout } from "./ReportLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { sanitizeCsvValue } from "@/atomic-crm/utils/csvUploadValidator";
import { AppliedFiltersBar, EmptyState } from "./components";
import { useReportData } from "./hooks";
import type { ActivityRecord, Organization, Sale } from "../types";

/**
 * Weekly Activity Summary Report
 *
 * Shows activity counts by rep and principal for manager visibility.
 * Groups: Sales Rep → Principal → Activity Type Counts
 *
 * Flags low-activity principals (< 3 activities/week) with warning.
 *
 * CSV Export: rep_name, principal_name, calls, emails, meetings, notes, total
 */
export default function WeeklyActivitySummary() {
  const { data: identity } = useGetIdentity();
  const notify = useNotify();
  const [dateRange, setDateRange] = useState(() => ({
    start: format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd"),
    end: format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd"),
  }));

  // Fetch activities for date range
  const { data: activities, isPending: activitiesPending } = useGetList<ActivityRecord>(
    "activities",
    {
      pagination: { page: 1, perPage: 10000 },
      filter: {
        "activity_date@gte": dateRange.start,
        "activity_date@lte": dateRange.end,
      },
      sort: { field: "activity_date", order: "DESC" },
    }
  );

  // Fetch sales reps
  const createdByIds = useMemo(
    () => Array.from(new Set((activities || []).map((a) => a.created_by).filter(Boolean))),
    [activities]
  );

  const { data: sales } = useGetList<Sale>("sales", {
    pagination: { page: 1, perPage: 1000 },
    filter: { id: createdByIds },
  });

  // Fetch organizations (principals)
  const orgIds = useMemo(
    () => Array.from(new Set((activities || []).map((a) => a.organization_id).filter(Boolean))),
    [activities]
  );

  const { data: organizations } = useGetList<Organization>("organizations", {
    pagination: { page: 1, perPage: 1000 },
    filter: { id: orgIds },
  });

  // Build lookup maps
  const salesMap = useMemo(() => new Map((sales || []).map((s) => [s.id, s])), [sales]);

  const orgMap = useMemo(
    () => new Map((organizations || []).map((o) => [o.id, o])),
    [organizations]
  );

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
          notes: 0,
          total: 0,
        });
      }

      const principalStats = repGroup.principals.get(orgId)!;

      // Count by type
      if (activity.type === "call") principalStats.calls++;
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
          notes: stats.notes,
          total: stats.total,
        });
      });
    });

    jsonExport(exportData, (err, csv) => {
      if (err) {
        console.error("Export error:", err);
        notify("Export failed. Please try again.", { type: "error" });
        return;
      }
      downloadCSV(csv, `weekly-activity-${dateRange.start}-to-${dateRange.end}`);
      notify("Report exported successfully", { type: "success" });
    });
  };

  if (activitiesPending || !identity) {
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
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="px-3 py-2 border rounded text-sm"
          />
          <span className="text-muted-foreground">to</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="px-3 py-2 border rounded text-sm"
          />
        </div>
      }
    >
      <div className="space-y-section">
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
        {reportData.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No activities found for this date range
          </p>
        ) : (
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

  const principalStats = Array.from(repGroup.principals.values()).sort((a, b) => b.total - a.total);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>
            {repGroup.rep.first_name} {repGroup.rep.last_name}
          </span>
          <Badge>{totalActivities} activities</Badge>
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
              <th className="text-right py-2">Notes</th>
              <th className="text-right py-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {principalStats.map((stats, idx) => (
              <tr
                key={stats.org.id || idx}
                className={`border-b ${stats.total < 3 ? "bg-warning/10" : ""}`}
              >
                <td className="py-2 flex items-center gap-2">
                  {stats.org.name}
                  {stats.total < 3 && (
                    <Badge variant="outline" className="text-xs">
                      ⚠️ Low Activity
                    </Badge>
                  )}
                </td>
                <td className="text-right">{stats.calls}</td>
                <td className="text-right">{stats.emails}</td>
                <td className="text-right">{stats.meetings}</td>
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
