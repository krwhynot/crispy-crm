import React, { useMemo } from 'react';
import { useGetList, useGetIdentity } from 'ra-core';
import { useNavigate } from 'react-router-dom';
import { DashboardWidget } from './DashboardWidget';
import { formatRelativeTime } from '@/atomic-crm/utils/formatRelativeTime';

interface Task {
  id: number | string;
  title: string;
  due_date: string;
  status: string;
}

/**
 * MyTasksThisWeek - Desktop-first widget showing incomplete tasks due this week
 *
 * Design:
 * - Compact spacing: 12px padding, 32px (h-8) row height
 * - Header: uppercase "MY TASKS THIS WEEK" with count badge
 * - Grouping: OVERDUE → TODAY → THIS WEEK
 * - Inline hover actions (hidden until hover): checkbox, timestamp badge
 * - Semantic colors only (destructive, warning, muted-foreground)
 * - No responsive fallbacks (desktop-only)
 */
export const MyTasksThisWeek: React.FC = () => {
  const navigate = useNavigate();
  const { identity } = useGetIdentity();

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const endOfWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const endOfWeekStr = endOfWeek.toISOString().split('T')[0];

  const { data: tasks = [], isPending, error } = useGetList('tasks', {
    filter: {
      completed: false,
      due_date_lte: endOfWeekStr,
      sales_id: identity?.id,
    },
    sort: { field: 'due_date', order: 'ASC' },
    pagination: { page: 1, perPage: 50 },
  });

  // Group tasks by urgency
  const groupedTasks = useMemo(() => {
    const groups: Record<string, Task[]> = {
      OVERDUE: [],
      TODAY: [],
      'THIS WEEK': [],
    };

    (tasks as Task[]).forEach((task) => {
      if (task.due_date < todayStr) {
        groups.OVERDUE.push(task);
      } else if (task.due_date === todayStr) {
        groups.TODAY.push(task);
      } else {
        groups['THIS WEEK'].push(task);
      }
    });

    return groups;
  }, [tasks, todayStr]);

  if (isPending) {
    return (
      <DashboardWidget>
        <div className="flex items-center justify-between mb-compact h-6">
          <h2 className="text-xs font-semibold text-foreground uppercase tracking-wider">
            MY TASKS THIS WEEK
          </h2>
          <span className="inline-flex items-center justify-center min-w-[1.25rem] px-1 py-0 text-xs font-semibold bg-muted rounded-full">
            -
          </span>
        </div>
        <div data-testid="tasks-skeleton" className="space-y-compact">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 bg-muted/30 rounded animate-pulse" />
          ))}
        </div>
      </DashboardWidget>
    );
  }

  const hasNoTasks = Object.values(groupedTasks).every((group) => group.length === 0);
  const totalTasks = tasks.length;

  return (
    <DashboardWidget>
      {/* Header - Compact (h-6) */}
      <div className="flex items-center justify-between mb-compact h-6">
        <h2 className="text-xs font-semibold text-foreground uppercase tracking-wider">
          MY TASKS THIS WEEK
        </h2>
        <span className="inline-flex items-center justify-center min-w-[1.25rem] px-1 py-0 text-xs font-semibold bg-primary/20 text-primary-foreground rounded-full">
          {totalTasks}
        </span>
      </div>

      {/* Empty State */}
      {hasNoTasks && (
        <div className="text-center py-compact">
          <p className="text-xs text-muted-foreground">No tasks this week</p>
        </div>
      )}

      {/* Task Sections */}
      {!hasNoTasks && (
        <div className="space-y-0">
          {Object.entries(groupedTasks).map(([sectionTitle, sectionTasks]) =>
            sectionTasks.length > 0 ? (
              <div key={sectionTitle}>
                {/* Section Header - h-6 */}
                <div className="bg-muted/30 h-6 px-2 flex items-center border-b border-border/30">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {sectionTitle}
                  </span>
                </div>

                {/* Task Rows - h-8 desktop-compact */}
                {sectionTasks.map((task) => {
                  const isOverdue = sectionTitle === 'OVERDUE';
                  const isToday = sectionTitle === 'TODAY';

                  return (
                    <div
                      key={task.id}
                      data-testid="task-row"
                      className="h-8 border-b border-border/30 hover:bg-accent/5 flex items-center px-2 cursor-pointer group transition-colors"
                      onClick={() => navigate(`/tasks/${task.id}`)}
                    >
                      {/* Checkbox - Hidden until hover */}
                      <input
                        type="checkbox"
                        className="w-3 h-3 mr-compact opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label={`Complete task: ${task.title}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Call API to mark task complete
                        }}
                      />

                      {/* Task Title */}
                      <span className="flex-1 text-xs text-foreground truncate">
                        {task.title}
                      </span>

                      {/* Due Date Badge - Semantic colors */}
                      <span
                        className={`text-xs font-medium px-compact py-0.5 rounded whitespace-nowrap ml-1 ${
                          isOverdue
                            ? 'bg-destructive/10 text-destructive'
                            : isToday
                              ? 'bg-warning/10 text-warning'
                              : 'bg-muted/50 text-muted-foreground'
                        }`}
                      >
                        {isOverdue
                          ? 'OVERDUE'
                          : isToday
                            ? 'TODAY'
                            : formatRelativeTime(task.due_date)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : null
          )}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-xs text-destructive">
          Failed to load tasks
        </div>
      )}
    </DashboardWidget>
  );
};

export default MyTasksThisWeek;
