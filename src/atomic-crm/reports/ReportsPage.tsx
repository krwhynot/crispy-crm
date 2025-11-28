import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlobalFilterProvider } from "./contexts/GlobalFilterContext";
import { GlobalFilterBar } from "./components/GlobalFilterBar";
import { Suspense, lazy, useEffect } from "react";
import { cleanupOldReportKeys } from "./utils/cleanupMigration";

const OverviewTab = lazy(() => import("./tabs/OverviewTab"));
const OpportunitiesTab = lazy(() => import("./tabs/OpportunitiesTab"));
const WeeklyActivityTab = lazy(() => import("./tabs/WeeklyActivityTab"));
const CampaignActivityTab = lazy(() => import("./tabs/CampaignActivityTab"));

export default function ReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";

  useEffect(() => {
    // Clean up old localStorage keys on first mount
    cleanupOldReportKeys();
  }, []);

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <GlobalFilterProvider>
      <div className="p-6 space-y-4">
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>

        {/* Global filters apply to Overview tab */}
        <GlobalFilterBar />

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger
              value="overview"
              data-state={activeTab === "overview" ? "active" : "inactive"}
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="opportunities"
              data-state={activeTab === "opportunities" ? "active" : "inactive"}
            >
              Opportunities by Principal
            </TabsTrigger>
            <TabsTrigger value="weekly" data-state={activeTab === "weekly" ? "active" : "inactive"}>
              Weekly Activity
            </TabsTrigger>
            <TabsTrigger
              value="campaign"
              data-state={activeTab === "campaign" ? "active" : "inactive"}
            >
              Campaign Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Suspense fallback={<div>Loading...</div>}>
              <OverviewTab />
            </Suspense>
          </TabsContent>

          <TabsContent value="opportunities">
            <Suspense fallback={<div>Loading...</div>}>
              <OpportunitiesTab />
            </Suspense>
          </TabsContent>

          <TabsContent value="weekly">
            <Suspense fallback={<div>Loading...</div>}>
              <WeeklyActivityTab />
            </Suspense>
          </TabsContent>

          <TabsContent value="campaign">
            <Suspense fallback={<div>Loading...</div>}>
              <CampaignActivityTab />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </GlobalFilterProvider>
  );
}
