import { useFormState } from "react-hook-form";
import { FormErrorSummary } from "@/components/ra-wrappers/FormErrorSummary";
import { TaskCompactForm } from "./TaskCompactForm";

const TASK_FIELD_LABELS: Record<string, string> = {
  // Core fields
  title: "Task Title",
  description: "Description",

  // Schedule fields
  due_date: "Due Date",
  reminder_date: "Reminder Date",

  // Classification fields
  priority: "Priority",
  type: "Type",

  // Assignment and relationships
  sales_id: "Assigned To",
  contact_id: "Contact",
  opportunity_id: "Opportunity",
  organization_id: "Organization",

  // Status fields
  completed: "Completed",
  completed_at: "Completed At",
  snooze_until: "Snoozed Until",
};

/**
 * TaskInputs Component
 *
 * Wrapper component that provides:
 * - FormErrorSummary for displaying validation errors at the top
 * - Delegates to TaskCompactForm for actual form fields
 *
 * Used by TaskCreate and TaskEdit for consistent form behavior.
 * For slide-over forms, see TaskSlideOverDetailsTab which has
 * different layout requirements.
 */
export const TaskInputs = () => {
  const { errors } = useFormState();
  const hasErrors = Object.keys(errors || {}).length > 0;

  return (
    <div className="flex flex-col gap-4">
      {hasErrors && (
        <FormErrorSummary
          errors={errors}
          fieldLabels={TASK_FIELD_LABELS}
          defaultExpanded={Object.keys(errors).length <= 3}
        />
      )}
      <TaskCompactForm />
    </div>
  );
};
