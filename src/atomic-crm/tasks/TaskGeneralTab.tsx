import { TextInput } from "@/components/admin/text-input";

export const TaskGeneralTab = () => {
  return (
    <div className="space-y-4">
      <TextInput
        source="title"
        label="Task Title *"
        helperText="Required field"
      />
      <TextInput
        source="description"
        label="Description"
        multiline
        rows={3}
        helperText="Optional detailed description"
      />
      <TextInput
        source="due_date"
        label="Due Date *"
        type="date"
        isRequired
        helperText="When is this due?"
      />
      <TextInput
        source="reminder_date"
        label="Reminder Date"
        type="date"
        helperText="Optional reminder"
      />
    </div>
  );
};
