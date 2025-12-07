import { useFormState } from "react-hook-form";
import { FormErrorSummary } from "@/components/admin/FormErrorSummary";
import { OpportunityCompactForm } from "./OpportunityCompactForm";

const OPPORTUNITY_FIELD_LABELS: Record<string, string> = {
  name: "Opportunity Name",
  customer_organization_id: "Customer Organization",
  principal_organization_id: "Principal Organization",
  stage: "Stage",
  priority: "Priority",
  estimated_close_date: "Est. Close Date",
  account_manager_id: "Account Manager",
  distributor_organization_id: "Distributor Organization",
  contact_ids: "Contacts",
  lead_source: "Lead Source",
  campaign: "Campaign",
  description: "Description",
  next_action: "Next Action",
  next_action_date: "Next Action Date",
  decision_criteria: "Decision Criteria",
  notes: "Notes",
};

interface OpportunityInputsProps {
  mode: "create" | "edit";
}

export const OpportunityInputs = ({ mode }: OpportunityInputsProps) => {
  const { errors } = useFormState();
  const hasErrors = Object.keys(errors || {}).length > 0;

  return (
    <div className="flex flex-col gap-4">
      {hasErrors && (
        <FormErrorSummary
          errors={errors}
          fieldLabels={OPPORTUNITY_FIELD_LABELS}
          defaultExpanded={Object.keys(errors).length <= 3}
        />
      )}
      <OpportunityCompactForm mode={mode} />
    </div>
  );
};
