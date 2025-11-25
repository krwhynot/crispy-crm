import { useState, useMemo, memo } from "react";
import { useNotify } from "react-admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlarmClock,
  CheckCircle2,
  Phone,
  Mail,
  Users,
  FileText,
  MoreHorizontal,
  Loader2,
  Eye,
  Pencil,
  Trash2,
  Plus,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TaskGroup } from "./TaskGroup";
import type { TaskItem } from "../types";
import { useMyTasks } from "../hooks/useMyTasks";

export function TasksPanel() {
  const { tasks, loading, error, completeTask, snoozeTask, deleteTask, viewTask } = useMyTasks();

  // Memoize filtered task lists to avoid recomputing on every render
  // Only recalculates when tasks array reference changes
  const { overdueTasks, todayTasks, tomorrowTasks } = useMemo(() => ({
    overdueTasks: tasks.filter((t) => t.status === "overdue"),
    todayTasks: tasks.filter((t) => t.status === "today"),
    tomorrowTasks: tasks.filter((t) => t.status === "tomorrow"),
  }), [tasks]);

  if (loading) {
    return (
      <Card className="card-container flex h-full flex-col">
        <CardHeader className="border-b border-border pb-3">
          <Skeleton className="mb-2 h-6 w-32" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="flex-1 p-4">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="card-container flex h-full flex-col">
        <CardHeader>
          <CardTitle>My Tasks</CardTitle>
        </CardHeader>
        <CardContent className="flex h-full items-center justify-center">
          <div className="text-center">
            <p className="text-destructive">Failed to load tasks</p>
            <p className="text-sm text-muted-foreground">{error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-container flex h-full flex-col">
      <CardHeader className="border-b border-border pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">My Tasks</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Today's priorities and upcoming activities
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {overdueTasks.length > 0 && (
              <Badge variant="destructive" className="text-xs">
                {overdueTasks.length} overdue
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1"
              onClick={() => {
                window.location.href = "/#/tasks/create";
              }}
            >
              <Plus className="h-4 w-4" />
              New Task
            </Button>
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Overdue items highlighted • Click to complete
        </p>
      </CardHeader>

      <CardContent className="flex-1 overflow-auto p-0">
        <div className="space-y-4 p-4">
          {/* Overdue section */}
          {overdueTasks.length > 0 && (
            <TaskGroup title="Overdue" variant="danger" count={overdueTasks.length}>
              {overdueTasks.map((task) => (
                <TaskItemComponent
                  key={task.id}
                  task={task}
                  onComplete={completeTask}
                  onSnooze={snoozeTask}
                  onDelete={deleteTask}
                  onView={viewTask}
                />
              ))}
            </TaskGroup>
          )}

          {/* Today section - only show if has tasks */}
          {todayTasks.length > 0 && (
            <TaskGroup title="Today" variant="warning" count={todayTasks.length}>
              {todayTasks.map((task) => (
                <TaskItemComponent
                  key={task.id}
                  task={task}
                  onComplete={completeTask}
                  onSnooze={snoozeTask}
                  onDelete={deleteTask}
                  onView={viewTask}
                />
              ))}
            </TaskGroup>
          )}

          {/* Tomorrow section - only show if has tasks */}
          {tomorrowTasks.length > 0 && (
            <TaskGroup title="Tomorrow" variant="info" count={tomorrowTasks.length}>
              {tomorrowTasks.map((task) => (
                <TaskItemComponent
                  key={task.id}
                  task={task}
                  onComplete={completeTask}
                  onSnooze={snoozeTask}
                  onDelete={deleteTask}
                  onView={viewTask}
                />
              ))}
            </TaskGroup>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface TaskItemProps {
  task: TaskItem;
  onComplete: (taskId: number) => Promise<void>;
  onSnooze: (taskId: number) => Promise<void>;
  onDelete: (taskId: number) => Promise<void>;
  onView: (taskId: number) => void;
}

// Memoized to prevent re-renders when parent re-renders but props haven't changed
// Each task item has local state (isSnoozing, isDeleting) that shouldn't trigger sibling re-renders
const TaskItemComponent = memo(function TaskItemComponent({ task, onComplete, onSnooze, onDelete, onView }: TaskItemProps) {
  const [isSnoozing, setIsSnoozing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const notify = useNotify();

  const handleSnooze = async () => {
    setIsSnoozing(true);
    try {
      await onSnooze(task.id);
      notify("Task snoozed for tomorrow", { type: "success" });
    } catch {
      // Error already logged in hook, just reset state
    } finally {
      setIsSnoozing(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(task.id);
      notify("Task deleted", { type: "success" });
    } catch {
      // Error already logged in hook, just reset state
    } finally {
      setIsDeleting(false);
    }
  };

  const handleView = () => {
    onView(task.id);
  };

  const handleEdit = () => {
    // Navigate to edit page
    window.location.href = `/#/tasks/${task.id}`;
  };

  const getTaskIcon = (type: TaskItem["taskType"]) => {
    switch (type) {
      case "Call":
        return <Phone className="h-4 w-4" />;
      case "Email":
        return <Mail className="h-4 w-4" />;
      case "Meeting":
        return <Users className="h-4 w-4" />;
      case "Follow-up":
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: TaskItem["priority"]) => {
    switch (priority) {
      case "critical":
        return "destructive";
      case "high":
        return "warning";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="interactive-card flex items-center gap-3 rounded-lg border border-transparent bg-card px-3 py-2">
      <Checkbox
        className="h-5 w-5"
        onCheckedChange={(checked) => {
          if (checked) {
            onComplete(task.id);
          }
        }}
      />

      <div className="flex-1">
        <div className="flex items-center gap-2">
          {getTaskIcon(task.taskType)}
          <span className="font-medium">{task.subject}</span>
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant={getPriorityColor(task.priority)} className="text-xs">
            {task.priority}
          </Badge>
          <span>→ {task.relatedTo.name}</span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-11 w-11 p-0"
          onClick={handleSnooze}
          disabled={isSnoozing}
          title="Snooze task by 1 day"
          aria-label={`Snooze "${task.subject}" by 1 day`}
        >
          {isSnoozing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <AlarmClock className="h-4 w-4" />
          )}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-11 w-11 p-0"
              aria-label={`More actions for "${task.subject}"`}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MoreHorizontal className="h-4 w-4" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleView}>
              <Eye className="mr-2 h-4 w-4" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleEdit}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDelete} variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
});
