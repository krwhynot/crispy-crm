import { TextInput } from "@/components/admin/text-input";
import { FormFieldWrapper, FormSectionWithProgress } from "@/components/admin/form";

export const TaskGeneralTab = () => {
  return (
    <FormSectionWithProgress
      id="general-section"
      title="General"
      requiredFields={["title", "due_date"]}
    >
      <div data-tutorial="task-title">
        <FormFieldWrapper name="title" isRequired>
          <TextInput source="title" label="Task Title *" helperText="Required field" />
        </FormFieldWrapper>
      </div>
      <FormFieldWrapper name="description">
        <TextInput
          source="description"
          label="Description"
          multiline
          rows={3}
          helperText="Optional detailed description"
        />
      </FormFieldWrapper>
      <div data-tutorial="task-due-date">
        <FormFieldWrapper name="due_date" isRequired countDefaultAsFilled>
          <TextInput
            source="due_date"
            label="Due Date *"
            type="date"
            helperText="When is this due?"
          />
        </FormFieldWrapper>
      </div>
      <FormFieldWrapper name="reminder_date">
        <TextInput
          source="reminder_date"
          label="Reminder Date"
          type="date"
          helperText="Optional reminder"
        />
      </FormFieldWrapper>
    </FormSectionWithProgress>
  );
};
