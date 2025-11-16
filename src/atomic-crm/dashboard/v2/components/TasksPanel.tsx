import React, { useState, useMemo } from 'react';
import { useGetList, useUpdate, useNotify, useRefresh } from 'react-admin';
import { useNavigate } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { PriorityTask, TaskGrouping, TaskBucket } from '../types';
import { usePrincipalContext } from '../context/PrincipalContext';
import { usePrefs } from '../hooks/usePrefs';
import { getBucket, BUCKET_LABELS, PRIORITY_LABELS } from '../utils/taskGrouping';

interface TaskGroup {
  key: string;
  label: string;
  tasks: PriorityTask[];
  isLater?: boolean;
}

interface TasksPanelProps {
  // Only props that will actually be used for filtering
  // Do NOT pass full FilterState to avoid confusion and unnecessary re-renders
  assignee?: 'me' | 'team' | string | null;  // For future assignee filtering
  currentUserId?: string;                     // React Admin identity.id (string)
}

export function TasksPanel({ assignee, currentUserId }: TasksPanelProps) {
  const { selectedPrincipalId } = usePrincipalContext();
  const [grouping, setGrouping] = usePrefs<TaskGrouping>('taskGrouping', 'due');
  const [laterExpanded, setLaterExpanded] = useState(false);
  const [laterPage, setLaterPage] = useState(1);
  const notify = useNotify();
  const refresh = useRefresh();
  const navigate = useNavigate();

  // Assignee filtering - now enabled with sales_id in priority_tasks view
  const assigneeFilter = assignee === 'me' && currentUserId
    ? { sales_id: currentUserId }
    : assignee && assignee !== 'team' && assignee !== null
    ? { sales_id: assignee }
    : {};

  const { data, isLoading } = useGetList<PriorityTask>(
    'priority_tasks',
    {
      filter: {
        completed: false,
        ...(selectedPrincipalId && { principal_organization_id: selectedPrincipalId }),
        ...assigneeFilter,
      },
      sort: { field: 'due_date', order: 'ASC' },
      pagination: { page: 1, perPage: 500 },
    },
    {
      enabled: !!selectedPrincipalId,
    }
  );

  const [update] = useUpdate();

  const handleComplete = async (taskId: number) => {
    try {
      await update('tasks', {
        id: taskId,
        data: {
          completed: true,
          completed_at: new Date().toISOString(),
        },
        previousData: { id: taskId },
      });
      notify('Task marked as complete', { type: 'success' });

      // Immediately refetch priority_tasks to update UI
      refresh();
    } catch (error) {
      console.error('Task completion failed:', error);
      notify('Failed to complete task', { type: 'error' });
    }
  };

  const handleCreateTask = () => {
    navigate('/tasks/create');
  };

  const groupedTasks = useMemo<TaskGroup[]>(() => {
    if (!data) return [];

    const groups: Record<string, PriorityTask[]> = {};

    data.forEach((task) => {
      let key: string;

      switch (grouping) {
        case 'due': {
          const bucket = getBucket(task.due_date);
          key = bucket;
          break;
        }
        case 'priority': {
          key = task.priority;
          break;
        }
        case 'principal': {
          key = task.principal_name || 'No Principal';
          break;
        }
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(task);
    });

    if (grouping === 'due') {
      const bucketOrder: TaskBucket[] = ['overdue', 'today', 'tomorrow', 'this_week', 'later'];
      return bucketOrder
        .filter((bucket) => groups[bucket]?.length > 0)
        .map((bucket) => ({
          key: bucket,
          label: BUCKET_LABELS[bucket],
          tasks: groups[bucket],
          isLater: bucket === 'later',
        }));
    }

    if (grouping === 'priority') {
      const priorityOrder = ['critical', 'high', 'medium', 'low'];
      return priorityOrder
        .filter((priority) => groups[priority]?.length > 0)
        .map((priority) => ({
          key: priority,
          label: PRIORITY_LABELS[priority],
          tasks: groups[priority],
        }));
    }

    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, tasks]) => ({
        key,
        label: key,
        tasks,
      }));
  }, [data, grouping]);

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-destructive text-destructive-foreground';
      case 'high':
        return 'bg-warning text-warning-foreground';
      case 'medium':
        return 'bg-accent text-accent-foreground';
      case 'low':
        return 'bg-muted text-muted-foreground';
      default:
        return '';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-lg shadow-sm flex flex-col h-full">
        <div className="h-11 px-3 border-b border-border flex items-center justify-between">
          <span className="font-semibold text-sm">Tasks</span>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg shadow-sm flex flex-col h-full" aria-label="Tasks list">
      <div className="h-11 px-3 py-1 border-b border-border flex items-center justify-between gap-3">
        <span className="font-semibold text-sm">Tasks</span>
        <Select value={grouping} onValueChange={(value) => setGrouping(value as TaskGrouping)}>
          <SelectTrigger className="h-11 w-[140px] border-border/50 font-normal">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="due">Due Date</SelectItem>
            <SelectItem value="priority">Priority</SelectItem>
            <SelectItem value="principal">Principal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 overflow-y-auto">
        {groupedTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-3 text-center">
            <p className="text-muted-foreground mb-4">No tasks due</p>
            <Button onClick={handleCreateTask} className="h-11">
              Create Task
            </Button>
          </div>
        ) : (
          <div className="space-y-0" role="list">
            {groupedTasks.map((group) => {
              const isLaterGroup = group.isLater;
              const tasksToShow = isLaterGroup
                ? laterExpanded
                  ? group.tasks.slice(0, laterPage * 10)
                  : []
                : group.tasks;

              const hasMoreTasks = isLaterGroup && group.tasks.length > laterPage * 10;

              return (
                <div key={group.key}>
                  <button
                    onClick={() => {
                      if (isLaterGroup) {
                        setLaterExpanded(!laterExpanded);
                        if (!laterExpanded) {
                          setLaterPage(1);
                        }
                      }
                    }}
                    className="h-11 px-3 w-full bg-muted/50 font-semibold text-sm flex items-center justify-between hover:bg-muted/70 transition-colors"
                    aria-label={
                      isLaterGroup
                        ? `${group.label} (${group.tasks.length} tasks) - ${laterExpanded ? 'Collapse' : 'Expand'}`
                        : group.label
                    }
                    disabled={!isLaterGroup}
                  >
                    <span className="flex items-center gap-2">
                      {group.label}
                      {group.key === 'overdue' && (
                        <Badge className="bg-destructive text-destructive-foreground">
                          {group.tasks.length}
                        </Badge>
                      )}
                      {isLaterGroup && (
                        <span className="text-muted-foreground font-normal">
                          ({group.tasks.length} tasks)
                        </span>
                      )}
                    </span>
                  </button>

                  {tasksToShow.map((task) => (
                    <div
                      key={task.task_id}
                      className="h-11 px-3 hover:bg-muted/30 flex items-center gap-3 border-b border-border/50"
                      role="listitem"
                    >
                      <button
                        onClick={() => handleComplete(task.task_id)}
                        className="shrink-0 h-11 w-11 flex items-center justify-center -ml-1"
                        aria-label={`Mark "${task.task_title}" as complete`}
                      >
                        <Checkbox checked={false} className="h-5 w-5" />
                      </button>

                      <span className="flex-1 text-sm truncate">{task.task_title}</span>

                      {grouping !== 'priority' && (
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded ${getPriorityBadgeClass(task.priority)}`}
                        >
                          {PRIORITY_LABELS[task.priority]}
                        </span>
                      )}
                    </div>
                  ))}

                  {isLaterGroup && laterExpanded && hasMoreTasks && (
                    <div className="h-11 px-3 flex items-center">
                      <button
                        onClick={() => setLaterPage(laterPage + 1)}
                        className="text-sm text-primary hover:underline"
                        aria-label="Show next 10 tasks"
                      >
                        Show next 10
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
