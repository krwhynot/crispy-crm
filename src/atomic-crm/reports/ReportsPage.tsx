import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GlobalFilterProvider } from './contexts/GlobalFilterContext';
import { Suspense, lazy } from 'react';

// Lazy load tab components (to be created later)
const OverviewTab = () => <div>Overview content coming soon</div>;
const OpportunitiesTab = lazy(() => import('./tabs/OpportunitiesTab'));
const WeeklyActivityTab = lazy(() => import('./tabs/WeeklyActivityTab'));
const CampaignActivityTab = lazy(() => import('./tabs/CampaignActivityTab'));

export default function ReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <GlobalFilterProvider>
      <div className="p-6 space-y-4">
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" data-state={activeTab === 'overview' ? 'active' : 'inactive'}>
              Overview
            </TabsTrigger>
            <TabsTrigger value="opportunities" data-state={activeTab === 'opportunities' ? 'active' : 'inactive'}>
              Opportunities by Principal
            </TabsTrigger>
            <TabsTrigger value="weekly" data-state={activeTab === 'weekly' ? 'active' : 'inactive'}>
              Weekly Activity
            </TabsTrigger>
            <TabsTrigger value="campaign" data-state={activeTab === 'campaign' ? 'active' : 'inactive'}>
              Campaign Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab />
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
