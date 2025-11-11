import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PriorityIndicator, Priority } from './PriorityIndicator';

export interface PrincipalTask {
  id: string;
  title: string;
  due_date: string;
  status: string;
}

export interface PrincipalActivity {
  id: string;
  type: string;
  created_at: string;
}

export interface TopOpportunity {
  id: string;
  name: string;
  expected_value: number;
  stage: string;
}

export interface PrincipalCardProps {
  principal: {
    id: string;
    name: string;
    tasks: PrincipalTask[];
    activities: PrincipalActivity[];
    topOpportunity: TopOpportunity | null;
    priority: Priority;
  };
}

export const PrincipalCard = ({ principal }: PrincipalCardProps) => {
  const navigate = useNavigate();

  const overdueTasks = principal.tasks.filter((t) => {
    const today = new Date().toISOString().split('T')[0];
    return t.due_date < today && t.status !== 'Completed';
  });

  const handleViewTasks = () => {
    navigate('/tasks', { state: { principalFilter: principal.id } });
  };

  const handleViewOpportunities = () => {
    navigate('/opportunities', {
      state: { principalFilter: principal.id }
    });
  };

  const handlePrincipalClick = () => {
    navigate('/opportunities', {
      state: { principalFilter: principal.id }
    });
  };

  return (
    <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
      {/* Header: Principal name + Priority */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <button
          onClick={handlePrincipalClick}
          className="text-left hover:underline"
        >
          <h2 className="text-lg font-semibold text-gray-900">
            {principal.name}
          </h2>
        </button>
        <PriorityIndicator priority={principal.priority} />
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <span className="text-gray-600">Tasks</span>
          <p className="font-semibold">
            {principal.tasks.length} tasks
            {overdueTasks.length > 0 && (
              <span className="text-red-600 ml-1">
                ({overdueTasks.length} overdue)
              </span>
            )}
          </p>
        </div>
        <div>
          <span className="text-gray-600">Activities This Week</span>
          <p className="font-semibold">{principal.activities.length} activities</p>
        </div>
      </div>

      {/* Top opportunity */}
      {principal.topOpportunity && (
        <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
          <p className="text-xs text-gray-600 mb-1">Top Opportunity</p>
          <button
            onClick={() =>
              navigate(`/opportunities/${principal.topOpportunity!.id}`)
            }
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            {principal.topOpportunity.name}
          </button>
          <p className="text-xs text-gray-600 mt-1">
            {principal.topOpportunity.stage} - $
            {principal.topOpportunity.expected_value.toLocaleString()}
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 pt-4 border-t border-gray-200">
        <button
          onClick={handleViewTasks}
          className="flex-1 px-3 py-2 bg-primary text-white rounded font-medium text-sm hover:opacity-90 transition-opacity min-h-[44px]"
        >
          View All Tasks
        </button>
        <button
          onClick={handleViewOpportunities}
          className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded font-medium text-sm hover:bg-gray-50 transition-colors min-h-[44px]"
        >
          View Opportunities
        </button>
      </div>
    </div>
  );
};