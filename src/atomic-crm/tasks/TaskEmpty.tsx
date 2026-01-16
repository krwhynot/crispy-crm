import { CreateButton } from "@/components/admin/create-button";
import { EmptyState } from "@/components/ui/empty-state";

export const TaskEmpty = () => {
  return (
    <EmptyState
      variant="fullscreen"
      image="./img/empty.svg"
      title="No tasks found"
      description="Your task list is empty. Create a task to get started."
    >
      <span data-tutorial="create-task-btn" className="mt-4">
        <CreateButton label="New Task" />
      </span>
    </EmptyState>
  );
};
