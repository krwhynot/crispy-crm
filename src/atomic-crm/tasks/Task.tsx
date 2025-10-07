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
import { MoreVertical } from "lucide-react";
import { useDeleteWithUndoController, useNotify, useUpdate } from "ra-core";
import { useEffect, useState } from "react";
import type { Contact, Task as TData } from "../types";
import { TaskEdit } from "./TaskEdit";

export const Task = ({
  task,
  showContact,
}: {
  task: TData;
  showContact?: boolean;
}) => {
  const notify = useNotify();
  const queryClient = useQueryClient();

  // Date helper functions for intelligent postpone menu
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const taskDueDate = new Date(task.due_date);
  taskDueDate.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Calculate next Monday (start of next week)
  const nextMonday = new Date(today);
  const daysUntilMonday = (8 - today.getDay()) % 7 || 7;
  nextMonday.setDate(today.getDate() + daysUntilMonday);

  // Check if task can be postponed
  const canPostponeTomorrow = taskDueDate <= today;
  const canPostponeNextWeek = taskDueDate < nextMonday;

  // Format dates for display
  const formatDate = (date: Date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
  };

  const tomorrowFormatted = formatDate(tomorrow);
  const nextMondayFormatted = formatDate(nextMonday);

  const [openEdit, setOpenEdit] = useState(false);

  const handleCloseEdit = () => {
    setOpenEdit(false);
  };

  const [update, { isPending: isUpdatePending, isSuccess, variables }] =
    useUpdate();
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

  const handleCheck = () => () => {
    update("tasks", {
      id: task.id,
      data: {
        completed: !task.completed_at,
        completed_at: task.completed_at ? null : new Date().toISOString(),
      },
      previousData: task,
    });
  };

  useEffect(() => {
    // We do not want to invalidate the query when a tack is checked or unchecked
    if (
      isUpdatePending ||
      !isSuccess ||
      variables?.data?.completed_at != undefined
    ) {
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["tasks", "getList"] });
  }, [queryClient, isUpdatePending, isSuccess, variables]);

  const labelId = `checkbox-list-label-${task.id}`;

  return (
    <>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-2 flex-1">
          <Checkbox
            id={labelId}
            checked={!!task.completed_at}
            onCheckedChange={handleCheck()}
            disabled={isUpdatePending}
            className="mt-1"
          />
          <div className={`flex-grow ${task.completed_at ? "line-through" : ""}`}>
            <div className="text-sm">
              {task.type && task.type !== "None" && (
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
                        {referenceRecord?.first_name}{" "}
                        {referenceRecord?.last_name})
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
            <Button
              variant="ghost"
              size="icon"
              className="h-5 pr-0! size-8 cursor-pointer"
              aria-label="task actions"
            >
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
                      due_date: tomorrow.toISOString().slice(0, 10),
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
                      due_date: nextMonday.toISOString().slice(0, 10),
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
      {openEdit && (
        <TaskEdit taskId={task.id} open={openEdit} close={handleCloseEdit} />
      )}
    </>
  );
};
