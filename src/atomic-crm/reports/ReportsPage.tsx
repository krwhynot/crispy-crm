import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense, lazy, useEffect } from "react";
import { cleanupOldReportKeys } from "./utils/cleanupMigration";
import { ReportPageShell } from "./components/ReportPageShell";

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

  useEffect(() => {
    cleanupOldReportKeys();
  }, []);

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

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
    <ReportPageShell title="Reports & Analytics" breadcrumbs={breadcrumbs}>
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
