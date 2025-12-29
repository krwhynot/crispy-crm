import { TextInput } from "@/components/admin/text-input";

export const TaskGeneralTab = () => {
  return (
    <div className="space-y-2">
      <div data-tutorial="task-title">
        <TextInput source="title" label="Task Title *" helperText="Required field" />
      </div>
      <TextInput
        source="description"
        label="Description"
        multiline
        rows={3}
        helperText="Optional detailed description"
      />
      <div data-tutorial="task-due-date">
        <TextInput
          source="due_date"
          label="Due Date *"
          type="date"
          isRequired
          helperText="When is this due?"
        />
      </div>
      <TextInput
        source="reminder_date"
        label="Reminder Date"
        type="date"
        helperText="Optional reminder"
      />
    </div>
  );
};
