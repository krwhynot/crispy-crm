import React, { useMemo } from 'react';
import { useGetList } from 'react-admin';
import { PrincipalCard } from './PrincipalCard';
import { calculatePriority, Priority } from './PriorityIndicator';

interface Opportunity {
  id: string;
  name: string;
  principal_organization_id: string;
  principal_organization?: { id: string; name: string };
  expected_value: number;
  stage: string;
  sales_id: string;
  status: string;
}

interface Task {
  id: string;
  title: string;
  due_date: string;
  opportunity_id: string;
  status: string;
}

interface Activity {
  id: string;
  type: string;
  created_at: string;
  opportunity_id: string;
}

interface Principal {
  id: string;
  name: string;
  tasks: Task[];
  activities: Activity[];
  topOpportunity: Opportunity | null;
  priority: Priority;
}

export const PrincipalDashboard = () => {
  // Fetch user's active opportunities (grouped by principal)
  const { data: opportunities, isLoading: oppLoading, error: oppError } = useGetList(
    'opportunities',
    {
      filter: {
        status: 'Active'
      },
      pagination: { page: 1, perPage: 100 },
      sort: { field: 'expected_value', order: 'DESC' }
    }
  );

  // Fetch user's tasks
  const { data: tasks, isLoading: tasksLoading, error: tasksError } = useGetList('tasks', {
    pagination: { page: 1, perPage: 500 },
    sort: { field: 'due_date', order: 'ASC' }
  });

  // Fetch user's recent activities (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const { data: activities, isLoading: activitiesLoading, error: activitiesError } = useGetList(
    'activities',
    {
      filter: {
        created_at: { gte: sevenDaysAgo.toISOString() }
      },
      pagination: { page: 1, perPage: 500 },
      sort: { field: 'created_at', order: 'DESC' }
    }
  );

  // Group data by principal
  const principals = useMemo(() => {
    if (!opportunities || opportunities.length === 0) {
      return [];
    }

    const principalMap = new Map<string, Principal>();

    // Group opportunities by principal
    opportunities.forEach((opp: Opportunity) => {
      if (!principalMap.has(opp.principal_organization_id)) {
        // Use the principal_organization.name if available, otherwise use the ID
        const principalName = opp.principal_organization?.name || opp.principal_organization_id;

        principalMap.set(opp.principal_organization_id, {
          id: opp.principal_organization_id,
          name: principalName,
          tasks: [],
          activities: [],
          topOpportunity: null,
          priority: 'low'
        });
      }

      const principal = principalMap.get(opp.principal_organization_id)!;

      // Set top opportunity (highest value)
      if (!principal.topOpportunity || opp.expected_value > principal.topOpportunity.expected_value) {
        principal.topOpportunity = opp;
      }

      // Update principal name if we have better data
      if (opp.principal_organization?.name && principal.name === opp.principal_organization_id) {
        principal.name = opp.principal_organization.name;
      }
    });

    // Add tasks to principals
    if (tasks) {
      tasks.forEach((task: Task) => {
        const opp = opportunities.find((o: Opportunity) => o.id === task.opportunity_id);
        if (opp && principalMap.has(opp.principal_organization_id)) {
          principalMap.get(opp.principal_organization_id)!.tasks.push(task);
        }
      });
    }

    // Add activities to principals
    if (activities) {
      activities.forEach((activity: Activity) => {
        const opp = opportunities.find((o: Opportunity) => o.id === activity.opportunity_id);
        if (opp && principalMap.has(opp.principal_organization_id)) {
          principalMap.get(opp.principal_organization_id)!.activities.push(activity);
        }
      });
    }

    // Calculate priority for each principal
    Array.from(principalMap.values()).forEach((principal) => {
      principal.priority = calculatePriority({
        tasks: principal.tasks,
        activities: principal.activities
      });
    });

    // Sort principals by priority (high first, then by task count)
    return Array.from(principalMap.values()).sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.tasks.length - a.tasks.length;
    });
  }, [opportunities, tasks, activities]);

  const isLoading = oppLoading || tasksLoading || activitiesLoading;

  // Handle error state
  if (oppError || tasksError || activitiesError) {
    return (
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Principal Dashboard</h1>
        </div>
        <div className="text-center py-12 bg-red-50 rounded-lg border border-red-200">
          <p className="text-red-600">
            Error loading dashboard. Please try refreshing the page.
          </p>
        </div>
      </div>
    );
  }

  // Handle loading state
  if (isLoading) {
    return (
      <div
        data-testid="dashboard-loading"
        className="flex items-center justify-center h-64"
      >
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
          <p className="text-gray-600">Loading your principals...</p>
        </div>
      </div>
    );
  }

  // Calculate summary stats
  const totalTasks = principals.reduce((sum, p) => sum + p.tasks.length, 0);
  const totalActivities = principals.reduce(
    (sum, p) => sum + p.activities.length,
    0
  );
  const overdueTasks = principals.reduce(
    (sum, p) =>
      sum +
      p.tasks.filter((t) => {
        const today = new Date().toISOString().split('T')[0];
        return t.due_date < today && t.status !== 'Completed';
      }).length,
    0
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Principal Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Week of {new Date().toLocaleDateString()}
        </p>
      </div>

      {/* Principal Cards Grid */}
      {principals.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-600">
            No active principals found. Check your opportunities.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {principals.map((principal) => (
            <PrincipalCard key={principal.id} principal={principal} />
          ))}
        </div>
      )}

      {/* Summary Stats Footer */}
      {principals.length > 0 && (
        <div
          data-testid="dashboard-summary-stats"
          className="mt-8 pt-6 border-t border-gray-200"
        >
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-600">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{totalTasks}</p>
              {overdueTasks > 0 && (
                <p className="text-sm text-red-600">
                  {overdueTasks} overdue
                </p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-600">Activities This Week</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalActivities}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Principals</p>
              <p className="text-2xl font-bold text-gray-900">
                {principals.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrincipalDashboard;