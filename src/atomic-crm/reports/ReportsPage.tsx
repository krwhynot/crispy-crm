import { useSearchParams } from "react-router-dom";
import { useStore } from "ra-core";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense, lazy, useCallback, useEffect, useState } from "react";
import { Link2, Check } from "lucide-react";
import { AdminButton } from "@/components/admin/AdminButton";
import { cleanupOldReportKeys } from "./utils/cleanupMigration";
import { ReportPageShell } from "./components/ReportPageShell";
import {
  buildShareUrl,
  OVERVIEW_DEFAULTS,
  CAMPAIGN_DEFAULTS,
  OPPORTUNITIES_DEFAULTS,
  type OverviewFilterState,
  type CampaignFilterState,
  type WeeklyFilterState,
  type OpportunitiesFilterState,
} from "./hooks";

const OverviewTab = lazy(() => import("./tabs/OverviewTab"));
const OpportunitiesTab = lazy(() => import("./tabs/OpportunitiesTab"));
const WeeklyActivityTab = lazy(() => import("./tabs/WeeklyActivityTab"));
const CampaignActivityTab = lazy(() => import("./tabs/CampaignActivityTab"));

function TabSkeleton() {
  return (
    <div className="space-y-section">
      <Skeleton className="h-14 w-full rounded-lg" />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-content">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-section">
        <Skeleton className="h-80 rounded-lg" />
        <Skeleton className="h-80 rounded-lg" />
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";
  const [copied, setCopied] = useState(false);

  // Read stored filter state for each tab (for share URL generation)
  const [overviewFilters] = useStore<OverviewFilterState>("reports.overview", OVERVIEW_DEFAULTS);
  const [campaignFilters] = useStore<CampaignFilterState>("reports.campaign", CAMPAIGN_DEFAULTS);
  const [weeklyFilters] = useStore<WeeklyFilterState>("reports.weekly", { start: "", end: "" });
  const [opportunitiesFilters] = useStore<OpportunitiesFilterState>(
    "reports.opportunities",
    OPPORTUNITIES_DEFAULTS
  );

  useEffect(() => {
    cleanupOldReportKeys();
  }, []);

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  const handleCopyShareUrl = useCallback(() => {
    const filterMap: Record<string, { filters: unknown; defaults: unknown }> = {
      overview: { filters: overviewFilters, defaults: OVERVIEW_DEFAULTS },
      campaign: { filters: campaignFilters, defaults: CAMPAIGN_DEFAULTS },
      weekly: { filters: weeklyFilters, defaults: { start: "", end: "" } },
      opportunities: { filters: opportunitiesFilters, defaults: OPPORTUNITIES_DEFAULTS },
    };

    const entry = filterMap[activeTab];
    if (!entry) return;

    const url = buildShareUrl(activeTab, entry.filters as never, entry.defaults as never);
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [activeTab, overviewFilters, campaignFilters, weeklyFilters, opportunitiesFilters]);

  const tabLabels: Record<string, string> = {
    overview: "Overview",
    opportunities: "Opportunities by Principal",
    weekly: "Weekly Activity",
    campaign: "Campaign Activity",
  };

  const breadcrumbs = [
    { label: "Reports", href: "/reports?tab=overview" },
    { label: tabLabels[activeTab] || "Overview" },
  ];

  return (
    <ReportPageShell
      title="Reports & Analytics"
      breadcrumbs={breadcrumbs}
      actions={
        <AdminButton
          variant="outline"
          size="sm"
          onClick={handleCopyShareUrl}
          className="h-11 gap-2"
          aria-label="Copy shareable link with current filters"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" aria-hidden="true" />
              Copied!
            </>
          ) : (
            <>
              <Link2 className="h-4 w-4" aria-hidden="true" />
              Copy Link
            </>
          )}
        </AdminButton>
      }
    >
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto">
          <TabsTrigger value="overview" className="h-11">
            Overview
          </TabsTrigger>
          <TabsTrigger value="opportunities" className="h-11">
            Opportunities
          </TabsTrigger>
          <TabsTrigger value="weekly" className="h-11">
            Weekly Activity
          </TabsTrigger>
          <TabsTrigger value="campaign" className="h-11">
            Campaign
          </TabsTrigger>
        </TabsList>

        <div className="mt-section">
          <TabsContent value="overview" className="mt-0">
            <Suspense fallback={<TabSkeleton />}>
              <OverviewTab />
            </Suspense>
          </TabsContent>

          <TabsContent value="opportunities" className="mt-0">
            <Suspense fallback={<TabSkeleton />}>
              <OpportunitiesTab />
            </Suspense>
          </TabsContent>

          <TabsContent value="weekly" className="mt-0">
            <Suspense fallback={<TabSkeleton />}>
              <WeeklyActivityTab />
            </Suspense>
          </TabsContent>

          <TabsContent value="campaign" className="mt-0">
            <Suspense fallback={<TabSkeleton />}>
              <CampaignActivityTab />
            </Suspense>
          </TabsContent>
        </div>
      </Tabs>
    </ReportPageShell>
  );
}
