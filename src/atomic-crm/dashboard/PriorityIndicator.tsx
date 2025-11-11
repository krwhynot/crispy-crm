import React from 'react';

export type Priority = 'high' | 'medium' | 'low';

export interface PrincipalData {
  tasks: Array<{ due_date: string; status: string }>;
  activities: Array<{ created_at: string; type: string }>;
}

/**
 * Calculate priority indicator based on:
 * - Overdue tasks (high)
 * - Low activity count this week (high)
 * - Tasks due in next 48 hours (medium)
 * - Everything on track (low)
 */
export function calculatePriority(principal: PrincipalData): Priority {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  // Check for overdue tasks
  const overdueTasks = principal.tasks.filter(
    (t) => t.due_date < today && t.status !== 'Completed'
  );
  if (overdueTasks.length > 0) {
    return 'high';
  }

  // Check for low activity this week (< 3)
  const activitiesThisWeek = principal.activities.filter((a) => {
    const activityDate = a.created_at.split('T')[0];
    return activityDate >= sevenDaysAgo;
  });
  if (activitiesThisWeek.length < 3) {
    return 'high';
  }

  // Check for tasks due in next 48 hours
  const inTwoDays = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];
  const dueSoon = principal.tasks.filter(
    (t) =>
      t.due_date >= today && t.due_date <= inTwoDays && t.status !== 'Completed'
  );
  if (dueSoon.length > 0) {
    return 'medium';
  }

  return 'low';
}

interface PriorityIndicatorProps {
  priority: Priority;
}

const priorityConfig = {
  high: {
    bgColor: 'bg-red-100',
    borderColor: 'border-red-300',
    icon: '⚠️',
    label: 'Needs attention'
  },
  medium: {
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-300',
    icon: '⚡',
    label: 'Tasks due soon'
  },
  low: {
    bgColor: 'bg-green-100',
    borderColor: 'border-green-300',
    icon: '✅',
    label: 'On track'
  }
};

export const PriorityIndicator = ({ priority }: PriorityIndicatorProps) => {
  const config = priorityConfig[priority];

  return (
    <div
      data-testid="priority-indicator"
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border ${config.bgColor} ${config.borderColor}`}
    >
      <span data-testid="priority-icon">{config.icon}</span>
      <span className="text-sm font-medium">{config.label}</span>
    </div>
  );
};