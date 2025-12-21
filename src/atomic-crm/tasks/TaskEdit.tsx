import { Card, CardContent } from "@/components/ui/card";
import { EditBase, Form, useRecordContext } from "ra-core";
import { useQueryClient } from "@tanstack/react-query";
import { TaskInputs } from "./TaskInputs";
import { FormToolbar } from "../layout/FormToolbar";
import type { Task } from "../types";

/**
 * TaskEdit Component
 *
 * Edit form for tasks - standalone page version
 * For inline dialog version, see Task.tsx
 */
export const TaskEdit = () => {
  const queryClient = useQueryClient();

  return (
    <EditBase
      redirect="show"
      mutationMode="pessimistic"
      mutationOptions={{
        onSuccess: () => {
          // Invalidate related caches to prevent stale data
          queryClient.invalidateQueries({ queryKey: ["tasks"] });
          queryClient.invalidateQueries({ queryKey: ["opportunities"] });
        },
      }}
    >
      <TaskEditForm />
    </EditBase>
  );
};

const TaskEditForm = () => {
  const record = useRecordContext<Task>();

  if (!record) return null;

  return (
    <div className="mt-2">
      <Form className="flex flex-col gap-4" defaultValues={record} key={record.id}>
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-2xl font-semibold mb-4">Edit Task</h2>
            <TaskInputs />
            <FormToolbar />
          </CardContent>
        </Card>
      </Form>
    </div>
  );
};

export default TaskEdit;
