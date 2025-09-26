import {
  AutocompleteArrayInput,
  ReferenceArrayInput,
  ReferenceInput,
  TextInput,
  NumberInput,
  SelectInput,
} from "@/components/admin";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";
// Validation removed per Engineering Constitution - single-point validation at API boundary only
import { useWatch } from "react-hook-form";
import { contactOptionText } from "../misc/ContactOption";
import { useConfigurationContext } from "../root/ConfigurationContext";
import { AutocompleteOrganizationInput } from "@/atomic-crm/organizations/AutocompleteOrganizationInput";
import {
  OPPORTUNITY_STAGE_CHOICES,
  getStageFieldsConfig,
  type OpportunityStageValue,
} from "./stageConstants";

export const OpportunityInputs = () => {
  const isMobile = useIsMobile();
  const stage = useWatch({ name: "stage" }) as OpportunityStageValue;
  const stageConfig = getStageFieldsConfig(stage);

  return (
    <div className="flex flex-col gap-8">
      <OpportunityInfoInputs />

      <div className={`flex gap-6 ${isMobile ? "flex-col" : "flex-row"}`}>
        <OpportunityLinkedToInputs />
        <Separator orientation={isMobile ? "horizontal" : "vertical"} />
        <OpportunityMiscInputs />
      </div>

      {/* Stage-specific fields */}
      {(stageConfig.showSampleFields ||
        stageConfig.showDemoFields ||
        stageConfig.showCloseFields ||
        stageConfig.showFeedbackFields) && (
        <>
          <Separator />
          <OpportunityStageSpecificInputs
            stage={stage}
            stageConfig={stageConfig}
          />
        </>
      )}
    </div>
  );
};

const OpportunityInfoInputs = () => {
  return (
    <div className="flex flex-col gap-4 flex-1">
      <TextInput
        source="name"
        label="Opportunity name *"
        helperText="Required field"
      />
      <TextInput source="description" multiline rows={3} helperText={false} />
    </div>
  );
};

const OpportunityLinkedToInputs = () => {
  return (
    <div className="flex flex-col gap-4 flex-1">
      <h3 className="text-base font-medium">Linked to</h3>
      <ReferenceInput
        source="customer_organization_id"
        reference="organizations"
      >
        <AutocompleteOrganizationInput label="Customer Organization" />
      </ReferenceInput>

      <ReferenceInput
        source="principal_organization_id"
        reference="organizations"
      >
        <AutocompleteOrganizationInput label="Principal Organization (Optional)" />
      </ReferenceInput>

      <ReferenceInput
        source="distributor_organization_id"
        reference="organizations"
      >
        <AutocompleteOrganizationInput label="Distributor Organization (Optional)" />
      </ReferenceInput>

      <ReferenceArrayInput source="contact_ids" reference="contacts_summary">
        <AutocompleteArrayInput
          label="Contacts *"
          optionText={contactOptionText}
          helperText="At least one contact is required"
        />
      </ReferenceArrayInput>
    </div>
  );
};

const OpportunityMiscInputs = () => {
  const { opportunityCategories } = useConfigurationContext();
  return (
    <div className="flex flex-col gap-4 flex-1">
      <h3 className="text-base font-medium">Misc</h3>

      <SelectInput
        source="category"
        label="Category"
        choices={opportunityCategories.map((type) => ({
          id: type,
          name: type,
        }))}
        helperText={false}
      />

      <SelectInput
        source="stage"
        label="Lifecycle Stage *"
        choices={OPPORTUNITY_STAGE_CHOICES}
        defaultValue="new_lead"
        helperText="Required field"
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
        defaultValue="medium"
        helperText="Required field"
      />

      <NumberInput
        source="amount"
        label="Amount *"
        defaultValue={0}
        helperText="Required field"
      />

      <NumberInput
        source="probability"
        label="Probability (%) *"
        min={0}
        max={100}
        defaultValue={50}
        helperText="Required: Enter a value between 0-100"
      />

      <TextInput
        source="expected_closing_date"
        label="Expected Closing Date *"
        helperText="Required field"
        type="date"
        defaultValue={new Date().toISOString().split("T")[0]}
      />
    </div>
  );
};

interface OpportunityStageSpecificInputsProps {
  stage: OpportunityStageValue;
  stageConfig: ReturnType<typeof getStageFieldsConfig>;
}

const OpportunityStageSpecificInputs = ({
  stage,
  stageConfig,
}: OpportunityStageSpecificInputsProps) => {
  const isMobile = useIsMobile();

  return (
    <div className="flex flex-col gap-6">
      <h3 className="text-base font-medium">Stage-Specific Information</h3>

      <div className={`flex gap-6 ${isMobile ? "flex-col" : "flex-row"}`}>
        {/* Sample/Visit Fields */}
        {stageConfig.showSampleFields && (
          <div className="flex flex-col gap-4 flex-1">
            <h4 className="text-sm font-medium text-muted-foreground">
              Sample & Visit Information
            </h4>
            <TextInput
              source="sampleType"
              label="Sample Type"
              helperText={false}
            />
            <TextInput
              source="visitDate"
              label="Visit Date"
              type="date"
              helperText={false}
            />
            <TextInput
              source="sampleProducts"
              label="Sample Products (comma-separated)"
              helperText="Enter product names separated by commas"
            />
          </div>
        )}

        {/* Demo Fields */}
        {stageConfig.showDemoFields && (
          <div className="flex flex-col gap-4 flex-1">
            <h4 className="text-sm font-medium text-muted-foreground">
              Demo Information
            </h4>
            <TextInput
              source="demoDate"
              label={stage === "demo_scheduled" ? "Demo Date *" : "Demo Date"}
              type="date"
              helperText={stage === "demo_scheduled" ? "Required for Demo Scheduled stage" : false}
            />
            <TextInput
              source="attendees"
              label="Attendees (comma-separated)"
              helperText="Enter attendee names separated by commas"
            />
            <TextInput
              source="demoProducts"
              label="Demo Products (comma-separated)"
              helperText="Enter product names separated by commas"
            />
          </div>
        )}
      </div>

      <div className={`flex gap-6 ${isMobile ? "flex-col" : "flex-row"}`}>
        {/* Feedback Fields */}
        {stageConfig.showFeedbackFields && (
          <div className="flex flex-col gap-4 flex-1">
            <h4 className="text-sm font-medium text-muted-foreground">
              Feedback Information
            </h4>
            <TextInput
              source="feedbackNotes"
              label={stage === "feedback_logged" ? "Feedback Notes *" : "Feedback Notes"}
              multiline
              rows={3}
              helperText={stage === "feedback_logged" ? "Required for Feedback Logged stage" : false}
            />
            <SelectInput
              source="sentimentScore"
              label="Sentiment Score"
              choices={[
                { id: 1, name: "1 - Very Negative" },
                { id: 2, name: "2 - Negative" },
                { id: 3, name: "3 - Neutral" },
                { id: 4, name: "4 - Positive" },
                { id: 5, name: "5 - Very Positive" },
              ]}
              helperText={false}
            />
            <TextInput
              source="nextSteps"
              label="Next Steps"
              multiline
              rows={2}
              helperText={false}
            />
          </div>
        )}

        {/* Closing Fields */}
        {stageConfig.showCloseFields && (
          <div className="flex flex-col gap-4 flex-1">
            <h4 className="text-sm font-medium text-muted-foreground">
              {stage === "closed_won"
                ? "Won Deal Information"
                : "Lost Deal Information"}
            </h4>

            {stage === "closed_won" && (
              <>
                <NumberInput
                  source="finalAmount"
                  label="Final Amount *"
                  helperText="Required for closed won deals"
                />
                <TextInput
                  source="contractStartDate"
                  label="Contract Start Date"
                  type="date"
                  helperText={false}
                />
                <NumberInput
                  source="contractTermMonths"
                  label="Contract Term (Months)"
                  helperText={false}
                  min={1}
                />
              </>
            )}

            {stage === "closed_lost" && (
              <>
                <SelectInput
                  source="lossReason"
                  label="Loss Reason"
                  choices={[
                    { id: "price", name: "Price" },
                    { id: "product_fit", name: "Product Fit" },
                    { id: "competitor", name: "Competitor" },
                    { id: "timing", name: "Timing" },
                    { id: "other", name: "Other" },
                  ]}
                  helperText="Required for closed lost deals"
                />
                <TextInput
                  source="competitorWon"
                  label="Competitor Who Won"
                  helperText={false}
                />
                <TextInput
                  source="lossNotes"
                  label="Loss Notes"
                  multiline
                  rows={3}
                  helperText={false}
                />
              </>
            )}

            {(stage === "closed_won" || stage === "closed_lost") && (
              <TextInput
                source="actual_close_date"
                label="Actual Close Date"
                type="date"
                helperText="Required when closing a deal"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
