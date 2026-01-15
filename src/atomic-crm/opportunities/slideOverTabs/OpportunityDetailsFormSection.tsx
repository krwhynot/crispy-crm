import { useEffect } from "react";
import { ReferenceInput, SelectInput, TextInput } from "react-admin";
import { DateInput } from "@/components/admin/date-input";
import { useFormContext, useFormState } from "react-hook-form";
import { ArrayInput } from "@/components/admin/array-input";
import { SimpleFormIterator } from "@/components/admin/simple-form-iterator";
import { saleOptionRenderer } from "@/atomic-crm/utils/saleOptionRenderer";
import { FormErrorSummary } from "@/components/admin/FormErrorSummary";
import { AutocompleteOrganizationInput } from "../../organizations/AutocompleteOrganizationInput";
import { SidepaneSection } from "@/components/layouts/sidepane";
import { OPPORTUNITY_STAGE_CHOICES } from "../constants/stageConstants";
import { LeadSourceInput } from "../LeadSourceInput";
import { CloseOpportunityModal } from "../components/CloseOpportunityModal";
import type { CloseOpportunityInput } from "@/atomic-crm/validation/opportunities";
import type { Opportunity } from "@/atomic-crm/types";

interface ServerValidationError extends Error {
  body?: {
    errors?: Record<string, string>;
  };
}

interface OpportunityDetailsFormSectionProps {
  record: Opportunity;
  onDirtyChange?: (isDirty: boolean) => void;
  serverError: ServerValidationError | null;
  showCloseModal: boolean;
  closeTargetStage: "closed_won" | "closed_lost";
  handleCloseModalOpenChange: (open: boolean) => void;
  handleCloseConfirm: (data: CloseOpportunityInput) => Promise<void>;
  isSaving: boolean;
}

export function OpportunityDetailsFormSection({
  record,
  onDirtyChange,
  serverError,
  showCloseModal,
  closeTargetStage,
  handleCloseModalOpenChange,
  handleCloseConfirm,
  isSaving,
}: OpportunityDetailsFormSectionProps) {
  const { setError, clearErrors } = useFormContext();
  const { errors, isDirty } = useFormState();

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    if (serverError?.body?.errors) {
      clearErrors();
      Object.entries(serverError.body.errors).forEach(([field, message]) => {
        setError(field, { type: "server", message: String(message) });
      });
    }
  }, [serverError, setError, clearErrors]);

  return (
    <>
      <FormErrorSummary errors={errors} />
      <TextInput source="name" label="Opportunity Name" helperText={false} fullWidth />
      <TextInput
        source="description"
        label="Description"
        helperText={false}
        multiline
        rows={3}
        fullWidth
      />
      <SelectInput
        source="stage"
        label="Stage"
        choices={OPPORTUNITY_STAGE_CHOICES}
        helperText={false}
        fullWidth
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
        helperText={false}
        fullWidth
      />
      <ReferenceInput
        source="account_manager_id"
        reference="sales"
        sort={{ field: "last_name", order: "ASC" }}
        filter={{ "disabled@neq": true }}
      >
        <SelectInput
          label="Account Manager"
          optionText={saleOptionRenderer}
          helperText={false}
          fullWidth
        />
      </ReferenceInput>
      <LeadSourceInput />
      <DateInput
        source="estimated_close_date"
        label="Estimated Close Date"
        helperText={false}
        className="w-full"
      />
      <DateInput
        source="actual_close_date"
        label="Actual Close Date"
        helperText={false}
        className="w-full"
      />

      <TextInput source="campaign" label="Campaign" helperText={false} fullWidth />
      <TextInput source="notes" label="Notes" multiline rows={2} helperText={false} fullWidth />
      <TextInput source="next_action" label="Next Action" helperText={false} fullWidth />
      <DateInput
        source="next_action_date"
        label="Next Action Date"
        helperText={false}
        className="w-full"
      />
      <TextInput
        source="decision_criteria"
        label="Decision Criteria"
        multiline
        rows={2}
        helperText={false}
        fullWidth
      />
      <TextInput source="competition" label="Competition" helperText={false} fullWidth />

      <SidepaneSection label="Tags" showSeparator>
        <ArrayInput source="tags" label={false}>
          <SimpleFormIterator inline disableReordering>
            <TextInput source="" label={false} helperText={false} placeholder="Add tag" />
          </SimpleFormIterator>
        </ArrayInput>
      </SidepaneSection>

      <SidepaneSection label="Organizations" showSeparator>
        <div className="space-y-2">
          <ReferenceInput
            source="customer_organization_id"
            reference="organizations"
            filter={{ "organization_type@in": "(prospect,customer)" }}
          >
            <AutocompleteOrganizationInput
              label="Customer Organization *"
              organizationType="customer"
            />
          </ReferenceInput>

          <ReferenceInput
            source="principal_organization_id"
            reference="organizations"
            filter={{ organization_type: "principal" }}
          >
            <AutocompleteOrganizationInput
              label="Principal Organization *"
              organizationType="principal"
            />
          </ReferenceInput>

          <ReferenceInput
            source="distributor_organization_id"
            reference="organizations"
            filter={{ organization_type: "distributor" }}
          >
            <AutocompleteOrganizationInput
              label="Distributor Organization"
              organizationType="distributor"
            />
          </ReferenceInput>
        </div>
      </SidepaneSection>

      <CloseOpportunityModal
        open={showCloseModal}
        onOpenChange={handleCloseModalOpenChange}
        opportunityId={record.id}
        opportunityName={record.name || "Opportunity"}
        targetStage={closeTargetStage}
        onConfirm={handleCloseConfirm}
        isSubmitting={isSaving}
      />
    </>
  );
}
