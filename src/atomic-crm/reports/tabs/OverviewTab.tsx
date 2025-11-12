import { useMemo } from 'react';
import { useGetList } from 'ra-core';
import {
  TrendingUp,
  DollarSign,
  Activity,
  AlertCircle
} from 'lucide-react';
import { KPICard } from '../components/KPICard';
import { ChartWrapper } from '../components/ChartWrapper';
import { Skeleton } from '@/components/ui/skeleton';
import { useGlobalFilters } from '../contexts/GlobalFilterContext';
import { PipelineChart } from '../charts/PipelineChart';
import { OPPORTUNITY_STAGE_CHOICES } from '../../opportunities/stageConstants';
import '../charts/chartSetup';

export default function OverviewTab() {
  const { filters } = useGlobalFilters();

  const { data: opportunities = [], isPending: opportunitiesPending } = useGetList(
    'opportunities',
    {
      pagination: { page: 1, perPage: 10000 },
      filter: {
        'deleted_at@is': null,
        ...(filters.salesRepId && { opportunity_owner_id: filters.salesRepId }),
      },
    }
  );

  const { data: activities = [], isPending: activitiesPending } = useGetList(
    'activities',
    {
      pagination: { page: 1, perPage: 10000 },
      filter: {
        'created_at@gte': filters.dateRange.start.toISOString(),
        'created_at@lte': filters.dateRange.end.toISOString(),
        ...(filters.salesRepId && { created_by: filters.salesRepId }),
      },
    }
  );

  const kpis = useMemo(() => {
    const totalOpportunities = opportunities.length;
    const pipelineValue = opportunities.reduce((sum, opp) => sum + (opp.amount || 0), 0);
    const weekActivities = activities.filter(a => {
      const date = new Date(a.created_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return date >= weekAgo;
    }).length;
    const staleLeads = opportunities.filter(opp => {
      return opp.stage === 'Lead' && !opp.last_activity_at;
    }).length;

    return {
      totalOpportunities,
      pipelineValue,
      weekActivities,
      staleLeads,
    };
  }, [opportunities, activities]);

  const pipelineData = useMemo(() => {
    const stageCounts = OPPORTUNITY_STAGE_CHOICES.map(stage => ({
      stage: stage.name,
      count: opportunities.filter(o => o.stage === stage.id).length,
    }));
    return stageCounts.filter(s => s.count > 0);
  }, [opportunities]);

  const isLoading = opportunitiesPending || activitiesPending;

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <KPICard
            title="Total Opportunities"
            value={kpis.totalOpportunities}
            change={12}
            trend="up"
            icon={TrendingUp}
            subtitle={`$${Math.round(kpis.pipelineValue / 1000)}k pipeline`}
          />
          <KPICard
            title="Pipeline Value"
            value={`$${Math.round(kpis.pipelineValue / 1000)}k`}
            change={8}
            trend="up"
            icon={DollarSign}
            subtitle={`Avg $${Math.round(kpis.pipelineValue / Math.max(kpis.totalOpportunities, 1) / 1000)}k`}
          />
          <KPICard
            title="Activities This Week"
            value={kpis.weekActivities}
            change={-5}
            trend="down"
            icon={Activity}
            subtitle="Most: Emails"
          />
          <KPICard
            title="Stale Leads"
            value={kpis.staleLeads}
            change={0}
            trend="neutral"
            icon={AlertCircle}
            subtitle="> 7 days inactive"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartWrapper title="Pipeline by Stage" isLoading={isLoading}>
          <PipelineChart data={pipelineData} />
        </ChartWrapper>

        <ChartWrapper title="Activity Trend" isLoading={isLoading}>
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Chart implementation coming soon
          </div>
        </ChartWrapper>

        <ChartWrapper title="Top Principals" isLoading={isLoading}>
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Chart implementation coming soon
          </div>
        </ChartWrapper>

        <ChartWrapper title="Rep Performance" isLoading={isLoading}>
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Chart implementation coming soon
          </div>
        </ChartWrapper>
      </div>
    </div>
  );
}
