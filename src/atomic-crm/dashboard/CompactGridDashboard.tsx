import React from 'react';
import { useGetList } from 'react-admin';
import { endOfWeek } from 'date-fns';
import { CompactDashboardHeader } from './CompactDashboardHeader';
import { CompactPrincipalTable } from './CompactPrincipalTable';
import { CompactTasksWidget } from './CompactTasksWidget';
import type { Task } from '../types';

interface Principal {
  id: number;
  name: string;
  activity: string;
}

export const CompactGridDashboard: React.FC = () => {
  // Fetch real data from API
  const today = new Date();
  const endOfWeekDate = endOfWeek(today);

  // Fetch principals from dashboard_principal_summary view
  const { data: principalsData = [], isPending: principalsLoading } = useGetList<Principal>(
    'dashboard_principal_summary',
    {
      pagination: { page: 1, perPage: 100 },
      sort: { field: 'name', order: 'ASC' }
    }
  );

  // Fetch tasks for this week
  const { data: tasksData = [], isPending: tasksLoading } = useGetList<Task>(
    'tasks',
    {
      filter: {
        completed: false,
        due_date_lte: endOfWeekDate.toISOString().split('T')[0],
      },
      pagination: { page: 1, perPage: 20 },
      sort: { field: 'due_date', order: 'ASC' },
    }
  );

  // Transform principals data for compact table
  const principals = principalsData.map(p => ({
    id: p.id,
    name: p.name,
    activity: p.activity || '0/0'
  }));

  // Transform tasks data for compact widget
  const tasks = tasksData.map(t => ({
    id: t.id,
    title: t.title,
    priority: (t.priority || 'normal') as 'high' | 'normal' | 'low'
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <CompactDashboardHeader />
      <div className="p-2 md:p-3 lg:p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[40%_30%_30%] gap-4">
          {/* Left Column - Principal Table */}
          <div className="bg-white rounded-lg p-3">
            <CompactPrincipalTable data={principals} />
          </div>

          {/* Middle Column - Upcoming & Tasks */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-3">
              <div className="h-[140px]">Upcoming Events Placeholder</div>
            </div>
            <div className="bg-white rounded-lg p-3">
              <CompactTasksWidget tasks={tasks} />
            </div>
          </div>

          {/* Right Column - Activity & Pipeline */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-3">
              <div className="h-[140px]">Recent Activity Placeholder</div>
            </div>
            <div className="bg-white rounded-lg p-3">
              <div className="h-[180px]">Pipeline Summary Placeholder</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
