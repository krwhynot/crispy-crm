import React, { useState } from 'react';
import { Title, useGetList } from 'react-admin';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PrincipalOpportunitiesWidget } from './PrincipalOpportunitiesWidget';
import { PriorityTasksWidget } from './PriorityTasksWidget';
import { QuickActivityLoggerWidget } from './QuickActivityLoggerWidget';
import { ActivityHistoryDialog } from './ActivityHistoryDialog';
import { PrincipalDashboardV2 } from './v2/PrincipalDashboardV2';
import { useFeatureFlag } from './v2/hooks/useFeatureFlag';

/**
 * Principal Dashboard - MVP dashboard for managing principal relationships
 *
 * Layout: Desktop-first 3-column grid optimized for 1440px+ screens
 * Responsive: Stacks to single column on mobile/tablet (<1024px)
 *
 * Widgets (3 total):
 * 1. Active Opportunities - Principal-grouped opportunities (left)
 * 2. Priority Tasks - Upcoming tasks by principal (middle)
 * 3. Quick Activity Logger - Log activities for principals (right)
 *
 * Additional Features:
 * - Activity History Dialog: View complete activity history for selected principal
 *
 * Data is fetched independently by each widget container using
 * the dashboard_principal_summary database view and related tables.
 */
export const PrincipalDashboard: React.FC = () => {
  const isV2Enabled = useFeatureFlag();

  // If V2 layout is enabled via feature flag, render V2 dashboard
  if (isV2Enabled) {
    return <PrincipalDashboardV2 />;
  }

  // Otherwise render V1 dashboard
  const [activityHistoryOpen, setActivityHistoryOpen] = useState(false);
  const [selectedPrincipalId, setSelectedPrincipalId] = useState<string>('');

  // Fetch principals for the selector
  const { data: principals } = useGetList('organizations', {
    filter: { organization_type: 'principal' },
    pagination: { page: 1, perPage: 100 },
    sort: { field: 'name', order: 'ASC' }
  });

  const selectedPrincipal = principals?.find(p => p.id.toString() === selectedPrincipalId);

  const handleOpenActivityHistory = () => {
    if (selectedPrincipalId) {
      setActivityHistoryOpen(true);
    }
  };

  return (
    <div className="p-content lg:p-widget">
      <Title title="Principal Dashboard" />

      <div className="space-y-section">
        {/* Header with Activity History Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-compact">
          <div className="flex-1">
            <h1 className="text-2xl lg:text-3xl font-bold">Principal Dashboard</h1>
            <p className="text-muted-foreground text-sm lg:text-base">
              Manage your principal relationships and daily activities
            </p>
          </div>

          {/* Activity History Controls */}
          <div className="flex items-center gap-compact">
            <Select value={selectedPrincipalId} onValueChange={setSelectedPrincipalId}>
              <SelectTrigger className="w-48 h-11">
                <SelectValue placeholder="Select principal" />
              </SelectTrigger>
              <SelectContent>
                {principals?.map(p => (
                  <SelectItem key={p.id} value={p.id.toString()}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              className="h-11 w-11 p-0"
              onClick={handleOpenActivityHistory}
              disabled={!selectedPrincipalId}
              aria-label="View activity history"
            >
              <Clock className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Dashboard Grid - 3 equal columns on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-section">
          {/* Left Column - Opportunities */}
          <div className="lg:col-span-1">
            <PrincipalOpportunitiesWidget />
          </div>

          {/* Middle Column - Tasks */}
          <div className="lg:col-span-1">
            <PriorityTasksWidget />
          </div>

          {/* Right Column - Quick Logger */}
          <div className="lg:col-span-1">
            <QuickActivityLoggerWidget />
          </div>
        </div>
      </div>

      {/* Activity History Dialog */}
      <ActivityHistoryDialog
        open={activityHistoryOpen}
        onClose={() => setActivityHistoryOpen(false)}
        principalId={selectedPrincipalId ? parseInt(selectedPrincipalId) : null}
        principalName={selectedPrincipal?.name || ''}
      />
    </div>
  );
};

export default PrincipalDashboard;