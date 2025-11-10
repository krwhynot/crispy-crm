import { Filter } from "@/components/admin/filter";
import { ReferenceInput } from "@/components/admin/reference-input";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { SelectInput } from "@/components/admin/select-input";
import { TextInput } from "@/components/admin/text-input";
import { useConfigurationContext } from "../root/ConfigurationContext";

/**
 * TaskListFilter Component
 *
 * Filters for tasks list:
 * - Principal (organization via opportunity)
 * - Due Date (before/after)
 * - Status (completed/incomplete)
 * - Priority (low/medium/high/critical)
 * - Assigned To (sales rep)
 */
export const TaskListFilter = () => {
  const { taskTypes } = useConfigurationContext();

  return (
    <Filter>
      <ReferenceInput
        source="opportunity_id"
        reference="opportunities"
        alwaysOn
      >
        <AutocompleteInput
          label="Opportunity"
          optionText="title"
          helperText="Filter by opportunity"
        />
      </ReferenceInput>

      <TextInput
        source="due_date@gte"
        label="Due After"
        type="date"
        helperText="Tasks due on or after this date"
      />

      <TextInput
        source="due_date@lte"
        label="Due Before"
        type="date"
        helperText="Tasks due on or before this date"
      />

      <SelectInput
        source="completed"
        label="Status"
        choices={[
          { id: "false", name: "Incomplete" },
          { id: "true", name: "Completed" },
        ]}
        helperText="Filter by completion status"
      />

      <SelectInput
        source="priority"
        label="Priority"
        choices={[
          { id: "low", name: "Low" },
          { id: "medium", name: "Medium" },
          { id: "high", name: "High" },
          { id: "critical", name: "Critical" },
        ]}
        helperText="Filter by priority level"
      />

      <SelectInput
        source="type"
        label="Type"
        choices={taskTypes.map((type) => ({ id: type, name: type }))}
        helperText="Filter by task type"
      />

      <ReferenceInput
        source="sales_id"
        reference="sales"
      >
        <AutocompleteInput
          label="Assigned To"
          optionText={(record) =>
            record ? `${record.first_name} ${record.last_name}` : ""
          }
          helperText="Filter by assigned sales rep"
        />
      </ReferenceInput>
    </Filter>
  );
};
