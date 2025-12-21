import { Edit } from "@/components/admin/edit";
import { SimpleForm } from "@/components/admin/simple-form";
import { useQueryClient } from "@tanstack/react-query";
import { TaskInputs } from "./TaskInputs";

/**
 * TaskEdit Component
 *
 * Edit form for tasks - standalone page version
 * For inline dialog version, see Task.tsx
 */
export default function TaskEdit() {
  const queryClient = useQueryClient();

  return (
    <Edit
      mutationOptions={{
        onSuccess: () => {
          // Invalidate related caches to prevent stale data
          queryClient.invalidateQueries({ queryKey: ["tasks"] });
          queryClient.invalidateQueries({ queryKey: ["opportunities"] });
        },
      }}
    >
      <SimpleForm>
        <TaskInputs />
      </SimpleForm>
    </Edit>
  );
}
