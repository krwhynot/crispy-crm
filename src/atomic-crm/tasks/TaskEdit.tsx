import { SectionCard } from "@/components/ra-wrappers/SectionCard";
import { EditBase, Form, useRecordContext } from "ra-core";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

import { taskKeys, opportunityKeys, entityTimelineKeys } from "../queryKeys";
import { TaskInputs } from "./TaskInputs";
import { FormToolbar } from "../layout/FormToolbar";
import { taskSchema } from "@/atomic-crm/validation/task";
import { createFormResolver } from "@/lib/zodErrorFormatting";
import type { Task } from "./types";

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
          queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
          queryClient.invalidateQueries({ queryKey: opportunityKeys.lists() });
          queryClient.invalidateQueries({ queryKey: entityTimelineKeys.lists() });
        },
      }}
    >
      <TaskEditForm />
    </EditBase>
  );
};

const TaskEditForm = () => {
  const record = useRecordContext<Task>();

  const defaultValues = useMemo(() => taskSchema.partial().parse(record), [record]);

  if (!record) return null;

  return (
    <div className="mt-2">
      <Form
        className="flex flex-col gap-4"
        defaultValues={defaultValues}
        mode="onBlur"
        resolver={createFormResolver(taskSchema)}
      >
        <SectionCard contentClassName="pt-6">
          <h2 className="text-2xl font-semibold mb-4">Edit Task</h2>
          <TaskInputs />
          <FormToolbar />
        </SectionCard>
      </Form>
    </div>
  );
};

export default TaskEdit;
