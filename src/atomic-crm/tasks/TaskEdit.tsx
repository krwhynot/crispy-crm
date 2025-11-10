import { Edit } from "@/components/admin/edit";
import { SimpleForm } from "@/components/admin/simple-form";
import { TaskInputs } from "./TaskInputs";

/**
 * TaskEdit Component
 *
 * Edit form for tasks - standalone page version
 * For inline dialog version, see Task.tsx
 */
export default function TaskEdit() {
  return (
    <Edit>
      <SimpleForm>
        <TaskInputs />
      </SimpleForm>
    </Edit>
  );
}
