import React from 'react';
import { useGetList } from 'react-admin';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PrincipalOpportunity, HealthStatus } from './types';

export const PrincipalOpportunitiesWidget: React.FC = () => {
  const { data, isLoading, error } = useGetList<PrincipalOpportunity>(
    'principal_opportunities',
    {
      pagination: { page: 1, perPage: 100 },
      sort: { field: 'principal_name', order: 'ASC' }
    }
  );

  // Group opportunities by principal
  const groupedByPrincipal = React.useMemo(() => {
    if (!data) return {};
    return data.reduce((acc, opp) => {
      const key = opp.principal_name;
      if (!acc[key]) acc[key] = [];
      acc[key].push(opp);
      return acc;
    }, {} as Record<string, PrincipalOpportunity[]>);
  }, [data]);

  // Health status indicator component
  const HealthIndicator: React.FC<{ status: HealthStatus }> = ({ status }) => {
    const colors = {
      active: 'bg-success',
      cooling: 'bg-warning',
      at_risk: 'bg-destructive'
    };
    return (
      <span
        className={`inline-block h-3 w-3 rounded-full ${colors[status]}`}
        aria-label={`Status: ${status}`}
      />
    );
  };

  if (isLoading) {
    return (
      <Card className="min-h-80 flex flex-col">
        <CardHeader>
          <CardTitle>Active Opportunities by Principal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-compact">
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="min-h-80 flex flex-col">
        <CardHeader>
          <CardTitle>Active Opportunities by Principal</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Error loading opportunities</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="min-h-80 flex flex-col">
      <CardHeader>
        <CardTitle>Active Opportunities by Principal</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto space-y-section">
        {Object.entries(groupedByPrincipal).map(([principal, opportunities]) => (
          <div key={principal} className="space-y-compact">
            <h3 className="font-semibold text-sm lg:text-base">{principal}</h3>
            <div className="space-y-compact">
              {opportunities.map(opp => (
                <div
                  key={opp.opportunity_id}
                  className="flex items-center justify-between p-compact bg-card border border-border rounded-md min-h-11"
                >
                  <div className="flex items-center gap-compact">
                    <HealthIndicator status={opp.health_status} />
                    <span className="text-sm">{opp.customer_name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{opp.stage}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        {Object.keys(groupedByPrincipal).length === 0 && (
          <p className="text-muted-foreground text-center py-widget">No active opportunities</p>
        )}
      </CardContent>
    </Card>
  );
};
