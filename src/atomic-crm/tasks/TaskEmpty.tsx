import { CreateButton } from "@/components/admin/create-button";
import useAppBarHeight from "../hooks/useAppBarHeight";

export const TaskEmpty = () => {
  const appbarHeight = useAppBarHeight();
  return (
    <div
      className="flex flex-col justify-center items-center gap-3"
      style={{
        height: `calc(100dvh - ${appbarHeight}px)`,
      }}
    >
      <img src="./img/empty.svg" alt="No tasks found" />
      <div className="flex flex-col gap-0 items-center">
        <h2 className="text-lg font-bold">No tasks found</h2>
        <p className="text-sm text-muted-foreground text-center mb-4">
          Your task list is empty. Create a task to get started.
        </p>
      </div>
      <CreateButton label="New Task" data-tutorial="create-task-btn" />
    </div>
  );
};
