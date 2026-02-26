import { useSearchParams } from "react-router-dom";
import { useStore } from "ra-core";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import { Link2, Check } from "lucide-react";
import { AdminButton } from "@/components/admin/AdminButton";
import { FilterSidebarProvider } from "@/components/layouts/FilterSidebarContext";
import { AdaptiveFilterContainer } from "@/components/layouts/AdaptiveFilterContainer";
import { migrateReportStores } from "./utils/cleanupMigration";
import { ReportPageShell } from "./components/ReportPageShell";
import { ReportFilterSidebar } from "./components/ReportFilterSidebar";
import { ReportsAppliedFiltersBar } from "./components/ReportsAppliedFiltersBar";
import {
  buildReportShareUrl,
  countReportActiveFilters,
  GLOBAL_DEFAULTS,
  CAMPAIGN_DEFAULTS,
  OPPORTUNITIES_DEFAULTS,
  type GlobalReportFilterState,
  type CampaignFilterState,
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-content">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-content md:gap-section">
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

  // Read global store
  const [globalFilters, setGlobalFilters] = useStore<GlobalReportFilterState>(
    "reports.global",
    GLOBAL_DEFAULTS
  );

  // Read tab-local stores for share URL and clear-all
  const [campaignFilters, setCampaignFilters] = useStore<CampaignFilterState>(
    "reports.campaign",
    CAMPAIGN_DEFAULTS
  );
  const [opportunitiesFilters, setOpportunitiesFilters] = useStore<OpportunitiesFilterState>(
    "reports.opportunities",
    OPPORTUNITIES_DEFAULTS
  );

  // Compute filter count
  const localStoreMap: Record<
    string,
    { state: Record<string, unknown>; defaults: Record<string, unknown> }
  > = {
    opportunities: {
      state: opportunitiesFilters as unknown as Record<string, unknown>,
      defaults: OPPORTUNITIES_DEFAULTS as unknown as Record<string, unknown>,
    },
    campaign: {
      state: campaignFilters as unknown as Record<string, unknown>,
      defaults: CAMPAIGN_DEFAULTS as unknown as Record<string, unknown>,
    },
  };
  const localEntry = localStoreMap[activeTab];
  const filterCount = countReportActiveFilters(
    globalFilters as unknown as Record<string, unknown>,
    GLOBAL_DEFAULTS as unknown as Record<string, unknown>,
    localEntry?.state,
    localEntry?.defaults
  );

  // Clear all resets ALL stores
  const handleClearAll = useCallback(() => {
    setGlobalFilters(GLOBAL_DEFAULTS);
    setCampaignFilters(CAMPAIGN_DEFAULTS);
    setOpportunitiesFilters(OPPORTUNITIES_DEFAULTS);
  }, [setGlobalFilters, setCampaignFilters, setOpportunitiesFilters]);

  // URL seeding + migration
  const [isSeeded, setIsSeeded] = useState(false);
  const seededRef = useRef(false);

  useEffect(() => {
    if (seededRef.current) return;
    seededRef.current = true;

    // 1. Run store migration (old per-tab -> unified global)
    const migrated = migrateReportStores();

    // 2. Check URL for ?global= param (takes priority over migration)
    const globalParam = searchParams.get("global");
    const filtersParam = searchParams.get("filters");

    if (globalParam) {
      try {
        const decoded = JSON.parse(
          decodeURIComponent(globalParam)
        ) as Partial<GlobalReportFilterState>;
        setGlobalFilters({ ...GLOBAL_DEFAULTS, ...decoded });
      } catch {
        /* ignore malformed */
      }
    } else if (migrated) {
      setGlobalFilters(migrated);
    }

    if (filtersParam) {
      try {
        const decoded = JSON.parse(decodeURIComponent(filtersParam)) as Record<string, unknown>;
        // Seed the active tab's local store
        const tab = searchParams.get("tab") || "overview";
        if (tab === "opportunities") {
          setOpportunitiesFilters({
            ...OPPORTUNITIES_DEFAULTS,
            ...(decoded as Partial<OpportunitiesFilterState>),
          });
        } else if (tab === "campaign") {
          setCampaignFilters({
            ...CAMPAIGN_DEFAULTS,
            ...(decoded as Partial<CampaignFilterState>),
          });
        }
      } catch {
        /* ignore malformed */
      }
    }

    // Clean URL, preserve tab
    const tab = searchParams.get("tab");
    const cleaned = new URLSearchParams();
    if (tab) cleaned.set("tab", tab);
    setSearchParams(cleaned, { replace: true });

    setIsSeeded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Run once on mount
  }, []);

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  const handleCopyShareUrl = useCallback(() => {
    const localDefaultsMap: Record<string, Record<string, unknown>> = {
      opportunities: OPPORTUNITIES_DEFAULTS as unknown as Record<string, unknown>,
      campaign: CAMPAIGN_DEFAULTS as unknown as Record<string, unknown>,
    };
    const localStateMap: Record<string, Record<string, unknown>> = {
      opportunities: opportunitiesFilters as unknown as Record<string, unknown>,
      campaign: campaignFilters as unknown as Record<string, unknown>,
    };

    const url = buildReportShareUrl(
      activeTab,
      globalFilters,
      localStateMap[activeTab],
      localDefaultsMap[activeTab]
    );
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [activeTab, globalFilters, opportunitiesFilters, campaignFilters]);

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
    <FilterSidebarProvider storageKey="crm-reports-filter-sidebar-collapsed">
      <ReportPageShell
        title="Reports & Analytics"
        breadcrumbs={breadcrumbs}
        sidebar={
          <AdaptiveFilterContainer
            filterComponent={<ReportFilterSidebar activeTab={activeTab} />}
            resource="reports"
            onClearAll={handleClearAll}
            activeFilterCountOverride={filterCount}
          />
        }
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
        {isSeeded ? (
          <Tabs value={activeTab} onValueChange={handleTabChange} className="flex flex-col gap-0">
            <TabsList className="paper-tabs-list grid grid-cols-2 lg:grid-cols-4">
              <TabsTrigger value="overview" className="paper-tabs-trigger">
                Overview
              </TabsTrigger>
              <TabsTrigger value="opportunities" className="paper-tabs-trigger">
                Opportunities
              </TabsTrigger>
              <TabsTrigger value="weekly" className="paper-tabs-trigger">
                Weekly Activity
              </TabsTrigger>
              <TabsTrigger value="campaign" className="paper-tabs-trigger">
                Campaign
              </TabsTrigger>
            </TabsList>

            <ReportsAppliedFiltersBar activeTab={activeTab} />

            <div className="pt-section">
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
        ) : (
          <TabSkeleton />
        )}
      </ReportPageShell>
    </FilterSidebarProvider>
  );
}
