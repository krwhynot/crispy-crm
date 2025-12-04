import { isAfter } from "date-fns";
import { useListContext } from "ra-core";
import { cn } from "@/lib/utils";
import { Task } from "./Task";
import { parseDateSafely } from "@/lib/date-utils";

export const TasksIterator = ({
  showContact,
  className,
}: {
  showContact?: boolean;
  className?: string;
}) => {
  const { data, error, isPending } = useListContext();
  if (isPending || error || data.length === 0) return null;

  const tasks = data.filter((task) => {
    if (!task.completed_at) return true;
    const completedDate = parseDateSafely(task.completed_at);
    return completedDate ? isAfter(completedDate, new Date(Date.now() - 5 * 60 * 1000)) : true;
  });

  return (
    <div className={cn("space-y-2", className)}>
      {tasks.map((task) => (
        <Task task={task} showContact={showContact} key={task.id} />
      ))}
    </div>
  );
};
