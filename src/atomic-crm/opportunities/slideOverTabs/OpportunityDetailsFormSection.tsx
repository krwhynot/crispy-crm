import { useEffect, useMemo } from "react";
import { ReferenceInput } from "react-admin";
import { AutocompleteInput } from "@/components/ra-wrappers/autocomplete-input";
import { DateInput } from "@/components/ra-wrappers/date-input";
import { SelectInput } from "@/components/ra-wrappers/select-input";
import { TextInput } from "@/components/ra-wrappers/text-input";
import { useFormContext, useFormState } from "react-hook-form";
import { ArrayInput } from "@/components/ra-wrappers/array-input";
import { SimpleFormIterator } from "@/components/ra-wrappers/simple-form-iterator";
import { saleOptionRenderer } from "@/atomic-crm/utils/saleOptionRenderer";
import { FormErrorSummary } from "@/components/ra-wrappers/FormErrorSummary";
import { AutocompleteOrganizationInput } from "../../organizations/AutocompleteOrganizationInput";
import {
  FormSectionWithProgress,
  CollapsibleSection,
  CompactFormRow,
} from "@/components/ra-wrappers/form";
import { OPPORTUNITY_STAGE_CHOICES } from "../constants";
import { LeadSourceInput } from "../LeadSourceInput";
import { CloseOpportunityModal } from "../CloseOpportunityModal";
import type { CloseOpportunityInput } from "@/atomic-crm/validation/opportunities";
import type { Opportunity } from "@/atomic-crm/types";

const priorityChoices = [
  { id: "low", name: "Low" },
  { id: "medium", name: "Medium" },
  { id: "high", name: "High" },
  { id: "critical", name: "Critical" },
];

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

  // Filter for Related Opportunity picker:
  // - Exclude self (can't link to itself)
  // - Only show opportunities with same principal (business rule)
  const relatedOpportunityFilter = useMemo(
    () => ({
      ...(record?.id ? { "id@neq": record.id } : {}),
      ...(record?.principal_organization_id
        ? { principal_organization_id: record.principal_organization_id }
        : {}),
    }),
    [record?.id, record?.principal_organization_id]
  );

  return (
    <>
      <FormErrorSummary errors={errors} />

      {/* Opportunity Details Section */}
      <FormSectionWithProgress
        id="opportunity-details"
        title="Opportunity Details"
        requiredFields={["name"]}
      >
        <div className="space-y-4">
          <TextInput source="name" label="Opportunity Name *" helperText={false} fullWidth />
          <TextInput
            source="description"
            label="Description"
            helperText={false}
            multiline
            rows={3}
            fullWidth
          />
        </div>
      </FormSectionWithProgress>

      {/* Pipeline Section */}
      <FormSectionWithProgress
        id="pipeline-section"
        title="Pipeline"
        requiredFields={["stage", "priority"]}
      >
        <div className="space-y-4">
          <CompactFormRow>
            <SelectInput
              source="stage"
              label="Stage *"
              choices={OPPORTUNITY_STAGE_CHOICES}
              helperText={false}
            />
            <SelectInput
              source="priority"
              label="Priority *"
              choices={priorityChoices}
              helperText={false}
            />
          </CompactFormRow>
          <CompactFormRow columns="md:grid-cols-3">
            <ReferenceInput
              source="opportunity_owner_id"
              reference="sales"
              sort={{ field: "last_name", order: "ASC" }}
              filter={{ "disabled@neq": true }}
            >
              <SelectInput
                label="Primary Account Manager"
                optionText={saleOptionRenderer}
                helperText={false}
              />
            </ReferenceInput>
            <ReferenceInput
              source="account_manager_id"
              reference="sales"
              sort={{ field: "last_name", order: "ASC" }}
              filter={{ "disabled@neq": true }}
            >
              <SelectInput
                label="Secondary Account Manager"
                optionText={saleOptionRenderer}
                helperText={false}
              />
            </ReferenceInput>
            <LeadSourceInput />
          </CompactFormRow>
        </div>
      </FormSectionWithProgress>

      {/* Organizations Section */}
      <FormSectionWithProgress
        id="organizations-section"
        title="Organizations"
        requiredFields={["customer_organization_id", "principal_organization_id"]}
      >
        <div className="space-y-4">
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
      </FormSectionWithProgress>

      {/* Timeline Section */}
      <CollapsibleSection title="Timeline" defaultOpen>
        <div className="space-y-4">
          <CompactFormRow>
            <DateInput
              source="estimated_close_date"
              label="Estimated Close Date"
              helperText={false}
            />
            <DateInput source="actual_close_date" label="Actual Close Date" helperText={false} />
          </CompactFormRow>
          <CompactFormRow>
            <TextInput source="next_action" label="Next Action" helperText={false} />
            <DateInput source="next_action_date" label="Next Action Date" helperText={false} />
          </CompactFormRow>
        </div>
      </CollapsibleSection>

      {/* Details Section */}
      <CollapsibleSection title="Additional Details">
        <div className="space-y-4">
          <TextInput source="campaign" label="Campaign" helperText={false} fullWidth />
          <TextInput
            source="decision_criteria"
            label="Decision Criteria"
            multiline
            rows={2}
            helperText={false}
            fullWidth
          />
          <TextInput source="competition" label="Competition" helperText={false} fullWidth />
          <TextInput source="notes" label="Notes" multiline rows={2} helperText={false} fullWidth />
        </div>
      </CollapsibleSection>

      {/* Tags Section */}
      <CollapsibleSection title="Tags">
        <ArrayInput source="tags" label={false}>
          <SimpleFormIterator inline disableReordering>
            <TextInput source="" label={false} helperText={false} placeholder="Add tag" />
          </SimpleFormIterator>
        </ArrayInput>
      </CollapsibleSection>

      {/* Related Opportunity Section */}
      <CollapsibleSection title="Related Opportunity">
        <ReferenceInput
          source="related_opportunity_id"
          reference="opportunities"
          filter={relatedOpportunityFilter}
        >
          <AutocompleteInput
            optionText="name"
            label={false}
            helperText="Link to a parent or related opportunity with the same principal"
          />
        </ReferenceInput>
      </CollapsibleSection>

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
