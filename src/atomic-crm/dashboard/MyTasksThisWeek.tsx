import { useGetList, useGetIdentity, useRefresh } from "react-admin";
import { Link } from "react-router-dom";
import { format, addDays, startOfDay, endOfDay, isPast, isToday } from "date-fns";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { QuickCompleteTaskModal } from "./QuickCompleteTaskModal";
import type { Task } from "../types";

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
 * - Checkbox: Opens QuickCompleteTaskModal for progressive disclosure workflow
 * - Task text: Open task detail
 * - "View All Tasks": Navigate to /tasks
 *
 * Design: docs/plans/2025-11-07-dashboard-widgets-design.md (Widget 3)
 * Feature: Dashboard Quick Actions (docs/plans/2025-11-10-dashboard-quick-actions-design.md)
 */

interface GroupedTasks {
  overdue: Task[];
  today: Task[];
  thisWeek: Task[];
}

export const MyTasksThisWeek = () => {
  const { identity } = useGetIdentity();
  const refresh = useRefresh();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const today = new Date();
  const sevenDaysFromNow = addDays(today, 7);

  const {
    data: tasks,
    isPending,
    error,
  } = useGetList<Task>(
    "tasks",
    {
      filter: {
        sales_id: identity?.id, // Note: tasks use sales_id, not assigned_to
        completed: false,
        // Get tasks due this week OR overdue
        "due_date@lte": format(endOfDay(sevenDaysFromNow), "yyyy-MM-dd"),
      },
      sort: { field: "due_date", order: "ASC" },
    },
    {
      enabled: !!identity?.id, // Don't query until identity is available
    }
  );

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
  const totalTasks = grouped.overdue.length + grouped.today.length + grouped.thisWeek.length;

  if (totalTasks === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Tasks This Week</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-muted-foreground">You're all caught up! 🎉</p>
          <p className="text-sm text-muted-foreground">
            Consider planning your next steps or reaching out to principals for updates.
          </p>
        </CardContent>
        <CardFooter>
          <Link to="/tasks/create" className="text-sm text-primary hover:underline">
            Create Task →
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>My Tasks This Week</CardTitle>
        </CardHeader>
        <CardContent className="max-h-[350px] overflow-y-auto space-y-4">
          {grouped.overdue.length > 0 && (
            <TaskGroup
              title="⚠️ OVERDUE"
              tasks={grouped.overdue}
              onTaskSelect={setSelectedTask}
              variant="overdue"
            />
          )}
          {grouped.today.length > 0 && (
            <TaskGroup
              title="📅 DUE TODAY"
              tasks={grouped.today}
              onTaskSelect={setSelectedTask}
              variant="today"
            />
          )}
          {grouped.thisWeek.length > 0 && (
            <TaskGroup
              title="📆 THIS WEEK"
              tasks={grouped.thisWeek}
              onTaskSelect={setSelectedTask}
              variant="week"
            />
          )}
        </CardContent>
        <CardFooter>
          <Link to="/tasks" className="text-sm text-primary hover:underline">
            View All Tasks →
          </Link>
        </CardFooter>
      </Card>

      {/* Quick Complete Task Modal */}
      {selectedTask && (
        <QuickCompleteTaskModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onComplete={() => {
            setSelectedTask(null);
            refresh();
          }}
        />
      )}
    </>
  );
};

function groupTasksByUrgency(tasks: Task[]): GroupedTasks {
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
  onTaskSelect: (task: Task) => void;
  variant: "overdue" | "today" | "week";
}

function TaskGroup({ title, tasks, onTaskSelect, variant }: TaskGroupProps) {
  const titleColors = {
    overdue: "text-destructive",
    today: "text-warning",
    week: "text-foreground",
  };

  return (
    <div className="space-y-2">
      <h4 className={`text-sm font-semibold ${titleColors[variant]}`}>
        {title} ({tasks.length})
      </h4>
      <div className="space-y-2">
        {tasks.map((task) => (
          <TaskItem key={task.id} task={task} onTaskSelect={onTaskSelect} variant={variant} />
        ))}
      </div>
    </div>
  );
}

interface TaskItemProps {
  task: Task;
  onTaskSelect: (task: Task) => void;
  variant: "overdue" | "today" | "week";
}

function TaskItem({ task, onTaskSelect, variant }: TaskItemProps) {
  const daysLate = task.due_date
    ? Math.floor((new Date().getTime() - new Date(task.due_date).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const formattedDueDate = task.due_date
    ? format(new Date(task.due_date), "EEE M/d")
    : "No due date";

  return (
    <div className="flex items-start gap-2 group">
      <Checkbox
        checked={false}
        onCheckedChange={() => onTaskSelect(task)}
        className="mt-0.5"
        aria-label={`Complete task: ${task.title}`}
      />
      <div className="flex-1 min-w-0">
        <div className="text-sm">
          <Link to={`/tasks/${task.id}`} className="hover:underline">
            {task.title}
          </Link>
        </div>
        <div className="text-xs text-muted-foreground">
          {variant === "overdue" && daysLate > 0 && (
            <span className="text-destructive font-medium">
              {daysLate} day{daysLate !== 1 ? "s" : ""} late
            </span>
          )}
          {variant !== "overdue" && <span>{formattedDueDate}</span>}
          {task.opportunity_id && (
            <>
              {" "}
              →{" "}
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
