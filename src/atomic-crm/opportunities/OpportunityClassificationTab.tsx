import { SelectInput } from "@/components/admin/select-input";
import { OPPORTUNITY_STAGE_CHOICES } from "./stageConstants";
import { LeadSourceInput } from "./LeadSourceInput";

export const OpportunityClassificationTab = () => {
  return (
    <div className="space-y-2">
      <SelectInput
        source="stage"
        label="Stage *"
        choices={OPPORTUNITY_STAGE_CHOICES}
        helperText={false}
      />
      <SelectInput
        source="priority"
        label="Priority *"
        choices={[
          { id: "low", name: "Low" },
          { id: "medium", name: "Medium" },
          { id: "high", name: "High" },
          { id: "critical", name: "Critical" },
        ]}
        helperText={false}
      />
      <LeadSourceInput />
    </div>
  );
};
