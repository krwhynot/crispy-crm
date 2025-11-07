import { useGetList, useGetIdentity, useUpdate } from "react-admin";
import { Link } from "react-router-dom";
import { format, addDays, startOfDay, endOfDay, isPast, isToday } from "date-fns";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

/**
 * My Tasks This Week Widget
 *
 * Shows incomplete tasks due this week, prioritized by urgency.
 * Groups tasks into: Overdue → Today → This Week
 *
 * Data Source: tasks table
 * Filter: assigned_to = current_user.sales_id, completed = false
 * Sort: due_date ASC, priority DESC
 *
 * Interactions:
 * - Checkbox: Mark task complete (inline)
 * - Task text: Open task detail
 * - "View All Tasks": Navigate to /tasks
 *
 * Design: docs/plans/2025-11-07-dashboard-widgets-design.md (Widget 3)
 */

interface Task {
  id: number;
  title: string;
  due_date: string | null;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  assigned_to: number;
  opportunity_id?: number;
}

interface GroupedTasks {
  overdue: Task[];
  today: Task[];
  thisWeek: Task[];
}

export const MyTasksThisWeek = () => {
  const { identity } = useGetIdentity();
  const [update] = useUpdate();
  const today = new Date();
  const sevenDaysFromNow = addDays(today, 7);

  const { data: tasks, isPending, error } = useGetList<Task>('tasks', {
    filter: {
      assigned_to: identity?.id,
      completed: false,
      // Get tasks due this week OR overdue
      due_date_lte: format(endOfDay(sevenDaysFromNow), 'yyyy-MM-dd'),
    },
    sort: { field: 'due_date', order: 'ASC' },
  });

  if (isPending) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Tasks This Week</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Tasks This Week</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Unable to load tasks. Please refresh.</p>
        </CardContent>
      </Card>
    );
  }

  const grouped = groupTasksByUrgency(tasks || []);
  const totalTasks =
    grouped.overdue.length + grouped.today.length + grouped.thisWeek.length;

  if (totalTasks === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Tasks This Week</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground italic">No tasks due this week 🎉</p>
        </CardContent>
      </Card>
    );
  }

  const handleTaskComplete = (taskId: number) => {
    update(
      'tasks',
      {
        id: taskId,
        data: { completed: true },
        previousData: tasks?.find((t) => t.id === taskId),
      },
      {
        onSuccess: () => {
          // Task will be removed from list via React Admin cache invalidation
        },
        onError: (error) => {
          console.error('Failed to complete task:', error);
        },
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Tasks This Week</CardTitle>
      </CardHeader>
      <CardContent className="max-h-[350px] overflow-y-auto space-y-4">
        {grouped.overdue.length > 0 && (
          <TaskGroup
            title="⚠️ OVERDUE"
            tasks={grouped.overdue}
            onComplete={handleTaskComplete}
            variant="overdue"
          />
        )}
        {grouped.today.length > 0 && (
          <TaskGroup
            title="📅 DUE TODAY"
            tasks={grouped.today}
            onComplete={handleTaskComplete}
            variant="today"
          />
        )}
        {grouped.thisWeek.length > 0 && (
          <TaskGroup
            title="📆 THIS WEEK"
            tasks={grouped.thisWeek}
            onComplete={handleTaskComplete}
            variant="week"
          />
        )}
      </CardContent>
      <CardFooter>
        <Link
          to="/tasks"
          className="text-sm text-primary hover:underline"
        >
          View All Tasks →
        </Link>
      </CardFooter>
    </Card>
  );
};

function groupTasksByUrgency(tasks: Task[]): GroupedTasks {
  const today = startOfDay(new Date());
  const grouped: GroupedTasks = {
    overdue: [],
    today: [],
    thisWeek: [],
  };

  tasks.forEach((task) => {
    if (!task.due_date) {
      // Tasks without due dates go to "thisWeek"
      grouped.thisWeek.push(task);
      return;
    }

    const dueDate = startOfDay(new Date(task.due_date));

    if (isPast(dueDate) && !isToday(dueDate)) {
      grouped.overdue.push(task);
    } else if (isToday(dueDate)) {
      grouped.today.push(task);
    } else {
      grouped.thisWeek.push(task);
    }
  });

  return grouped;
}

interface TaskGroupProps {
  title: string;
  tasks: Task[];
  onComplete: (taskId: number) => void;
  variant: 'overdue' | 'today' | 'week';
}

function TaskGroup({ title, tasks, onComplete, variant }: TaskGroupProps) {
  const titleColors = {
    overdue: 'text-destructive',
    today: 'text-warning',
    week: 'text-foreground',
  };

  return (
    <div className="space-y-2">
      <h4 className={`text-sm font-semibold ${titleColors[variant]}`}>
        {title} ({tasks.length})
      </h4>
      <div className="space-y-2">
        {tasks.map((task) => (
          <TaskItem key={task.id} task={task} onComplete={onComplete} variant={variant} />
        ))}
      </div>
    </div>
  );
}

interface TaskItemProps {
  task: Task;
  onComplete: (taskId: number) => void;
  variant: 'overdue' | 'today' | 'week';
}

function TaskItem({ task, onComplete, variant }: TaskItemProps) {
  const daysLate = task.due_date
    ? Math.floor((new Date().getTime() - new Date(task.due_date).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const formattedDueDate = task.due_date
    ? format(new Date(task.due_date), 'EEE M/d')
    : 'No due date';

  return (
    <div className="flex items-start gap-2 group">
      <Checkbox
        checked={false}
        onCheckedChange={() => onComplete(task.id)}
        className="mt-0.5"
        aria-label={`Mark "${task.title}" as complete`}
      />
      <div className="flex-1 min-w-0">
        <div className="text-sm">
          <Link
            to={`/tasks/${task.id}`}
            className="hover:underline"
          >
            {task.title}
          </Link>
        </div>
        <div className="text-xs text-muted-foreground">
          {variant === 'overdue' && daysLate > 0 && (
            <span className="text-destructive font-medium">
              {daysLate} day{daysLate !== 1 ? 's' : ''} late
            </span>
          )}
          {variant !== 'overdue' && <span>{formattedDueDate}</span>}
          {task.opportunity_id && (
            <>
              {' '}
              →{' '}
              <Link
                to={`/opportunities/${task.opportunity_id}/show`}
                className="text-primary hover:underline"
              >
                View Opportunity
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
