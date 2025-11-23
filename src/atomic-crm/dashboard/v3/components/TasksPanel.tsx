import { useState } from "react";
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
} from "lucide-react";
import { TaskGroup } from "./TaskGroup";
import type { TaskItem } from "../types";
import { useMyTasks } from "../hooks/useMyTasks";

export function TasksPanel() {
  const { tasks, loading, error, completeTask, snoozeTask } = useMyTasks();

  const overdueTasks = tasks.filter((t) => t.status === "overdue");
  const todayTasks = tasks.filter((t) => t.status === "today");
  const tomorrowTasks = tasks.filter((t) => t.status === "tomorrow");

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
          {overdueTasks.length > 0 && (
            <Badge variant="destructive" className="text-xs">
              {overdueTasks.length} overdue
            </Badge>
          )}
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
}

function TaskItemComponent({ task, onComplete, onSnooze }: TaskItemProps) {
  const [isSnoozing, setIsSnoozing] = useState(false);
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
        <Button variant="ghost" size="sm" className="h-11 w-11 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
