import { ReferenceField } from "@/components/admin/reference-field";
import { DateField } from "@/components/admin/date-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQueryClient } from "@tanstack/react-query";

import { taskKeys } from "../queryKeys";
import {
  addDays,
  addWeeks,
  format,
  isAfter,
  isBefore,
  startOfDay,
  startOfToday,
  startOfWeek,
} from "date-fns";
import { MoreVertical } from "lucide-react";
import { useDeleteWithUndoController, useNotify, useUpdate } from "ra-core";
import { useEffect, useState } from "react";
import type { Contact, Task as TData } from "../types";
import TaskEdit from "./TaskEdit";
import { QuickLogActivity } from "../activities/QuickLogActivity";
import { cn } from "@/lib/utils";
import { parseDateSafely } from "@/lib/date-utils";

export const Task = ({ task, showContact }: { task: TData; showContact?: boolean }) => {
  const notify = useNotify();
  const queryClient = useQueryClient();

  const today = startOfToday();
  const taskDueDate = parseDateSafely(task.due_date)
    ? startOfDay(parseDateSafely(task.due_date)!)
    : today;
  const tomorrow = addDays(today, 1);

  // Calculate next Monday (start of next week). weekStartsOn: 1 ensures Monday is the start.
  const nextMonday = startOfWeek(addWeeks(today, 1), { weekStartsOn: 1 });

  // Check if task can be postponed
  const canPostponeTomorrow = !isAfter(taskDueDate, today);
  const canPostponeNextWeek = isBefore(taskDueDate, nextMonday);

  // Format dates for display using date-fns
  const tomorrowFormatted = format(tomorrow, "EEE, MMM d");
  const nextMondayFormatted = format(nextMonday, "EEE, MMM d");

  const [openEdit, setOpenEdit] = useState(false);
  const [openActivityDialog, setOpenActivityDialog] = useState(false);

  const handleCloseEdit = () => {
    setOpenEdit(false);
  };

  const handleCloseActivityDialog = () => {
    setOpenActivityDialog(false);
  };

  const [update, { isPending: isUpdatePending, isSuccess, variables }] = useUpdate();
  const { handleDelete } = useDeleteWithUndoController({
    record: task,
    redirect: false,
    mutationOptions: {
      onSuccess() {
        notify("Task deleted successfully", { undoable: true });
      },
    },
  });

  const handleEdit = () => {
    setOpenEdit(true);
  };

  const handleCheck = (checked: boolean) => {
    update(
      "tasks",
      {
        id: task.id,
        data: {
          id: task.id, // Include ID to trigger partial update validation
          completed: checked,
          completed_at: checked ? new Date().toISOString() : null,
        },
        previousData: task,
      },
      {
        onSuccess: () => {
          // Only open activity dialog when task is being completed (not uncompleted)
          if (checked) {
            setOpenActivityDialog(true);
          }
        },
      }
    );
  };

  useEffect(() => {
    // We do not want to invalidate the query when a tack is checked or unchecked
    if (isUpdatePending || !isSuccess || variables?.data?.completed_at != undefined) {
      return;
    }

    queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
  }, [queryClient, isUpdatePending, isSuccess, variables]);

  const labelId = `checkbox-list-label-${task.id}`;

  return (
    <>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-2 flex-1">
          <Checkbox
            id={labelId}
            checked={!!task.completed_at}
            onCheckedChange={handleCheck}
            disabled={isUpdatePending}
            className="mt-1"
          />
          <div className={cn("flex-grow", task.completed_at && "line-through")}>
            <div className="text-sm">
              {task.type && task.type !== "Other" && (
                <>
                  <span className="font-semibold text-sm">{task.type}</span>
                  &nbsp;
                </>
              )}
              {task.title}
              {task.description && (
                <span className="text-muted-foreground"> - {task.description}</span>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              due&nbsp;
              <DateField source="due_date" record={task} />
              {showContact && (
                <ReferenceField<TData, Contact>
                  source="contact_id"
                  reference="contacts"
                  record={task}
                  link="show"
                  className="inline text-sm text-muted-foreground"
                  render={({ referenceRecord }) => {
                    if (!referenceRecord) return null;
                    return (
                      <>
                        {" "}
                        (Re:&nbsp;
                        {referenceRecord?.first_name} {referenceRecord?.last_name})
                      </>
                    );
                  }}
                />
              )}
            </div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0" aria-label="task actions">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {canPostponeTomorrow && (
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => {
                  update("tasks", {
                    id: task.id,
                    data: {
                      ...task, // Include all existing task fields
                      due_date: format(tomorrow, "yyyy-MM-dd"),
                    },
                    previousData: task,
                  });
                }}
              >
                Postpone to tomorrow ({tomorrowFormatted})
              </DropdownMenuItem>
            )}
            {canPostponeNextWeek && (
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => {
                  update("tasks", {
                    id: task.id,
                    data: {
                      ...task, // Include all existing task fields
                      due_date: format(nextMonday, "yyyy-MM-dd"),
                    },
                    previousData: task,
                  });
                }}
              >
                Postpone to next week ({nextMondayFormatted})
              </DropdownMenuItem>
            )}
            <DropdownMenuItem className="cursor-pointer" onClick={handleEdit}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={handleDelete}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* This part is for editing the Task directly via a Dialog */}
      {openEdit && <TaskEdit taskId={task.id} open={openEdit} close={handleCloseEdit} />}

      {/* Quick log activity dialog after task completion */}
      {openActivityDialog && (
        <QuickLogActivity
          open={openActivityDialog}
          onClose={handleCloseActivityDialog}
          task={task}
        />
      )}
    </>
  );
};
