import React from 'react';
import { useGetList } from 'react-admin';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { PriorityTask, TaskPriority } from './types';
import { Calendar } from 'lucide-react';

export const PriorityTasksWidget: React.FC = () => {
  const { data, isLoading, error } = useGetList<PriorityTask>(
    'priority_tasks',
    {
      pagination: { page: 1, perPage: 100 },
      sort: { field: 'principal_name', order: 'ASC' }
    }
  );

  // Group tasks by principal
  const groupedByPrincipal = React.useMemo(() => {
    if (!data) return {};
    return data.reduce((acc, task) => {
      const key = task.principal_name || 'No Principal';
      if (!acc[key]) acc[key] = [];
      acc[key].push(task);
      return acc;
    }, {} as Record<string, PriorityTask[]>);
  }, [data]);

  // Priority indicator component
  const PriorityBadge: React.FC<{ priority: TaskPriority }> = ({ priority }) => {
    const styles = {
      critical: 'bg-destructive text-destructive-foreground',
      high: 'bg-warning text-warning-foreground',
      medium: 'bg-accent text-accent-foreground',
      low: 'bg-muted text-muted-foreground'
    };
    return (
      <span
        className={`inline-flex items-center px-compact py-compact text-xs font-medium rounded ${styles[priority]}`}
        aria-label={`Priority: ${priority}`}
      >
        {priority}
      </span>
    );
  };

  // Format due date
  const formatDueDate = (dueDate: string | null): string => {
    if (!dueDate) return 'No due date';
    const date = new Date(dueDate);
    const today = new Date();
    const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays <= 7) return `${diffDays} days`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <Card className="min-h-80 flex flex-col">
        <CardHeader>
          <CardTitle>Priority Tasks</CardTitle>
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
          <CardTitle>Priority Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Error loading tasks</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="min-h-80 flex flex-col">
      <CardHeader>
        <CardTitle>Priority Tasks</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto space-y-section">
        {Object.entries(groupedByPrincipal).map(([principal, tasks]) => (
          <div key={principal} className="space-y-compact">
            <h3 className="font-semibold text-sm lg:text-base">{principal}</h3>
            <div className="space-y-compact">
              {tasks.map(task => (
                <div
                  key={task.task_id}
                  className="flex items-center justify-between p-compact bg-card border border-border rounded-md min-h-11"
                >
                  <div className="flex items-center gap-compact flex-1 min-w-0">
                    <PriorityBadge priority={task.priority} />
                    <span className="text-sm truncate">{task.task_title}</span>
                  </div>
                  <div className="flex items-center gap-compact text-xs text-muted-foreground">
                    {task.due_date && (
                      <span className="flex items-center gap-1" aria-label={`Due: ${formatDueDate(task.due_date)}`}>
                        <Calendar className="h-3 w-3" />
                        {formatDueDate(task.due_date)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {Object.keys(groupedByPrincipal).length === 0 && (
          <p className="text-muted-foreground text-center py-widget">No priority tasks</p>
        )}
      </CardContent>
    </Card>
  );
};
