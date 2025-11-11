import { TabbedFormInputs } from "@/components/admin/tabbed-form";
import { OpportunityGeneralTab } from "./OpportunityGeneralTab";
import { OpportunityClassificationTab } from "./OpportunityClassificationTab";
import { OpportunityRelationshipsTab } from "./OpportunityRelationshipsTab";
import { OpportunityDetailsTab } from "./OpportunityDetailsTab";

interface OpportunityInputsProps {
  mode: "create" | "edit";
}

export const OpportunityInputs = ({ mode }: OpportunityInputsProps) => {
  const tabs = [
    {
      key: "general",
      label: "General",
      fields: ["name", "description", "estimated_close_date"],
      content: <OpportunityGeneralTab mode={mode} />,
    },
    {
      key: "classification",
      label: "Classification",
      fields: ["stage", "priority", "lead_source", "campaign", "tags"],
      content: <OpportunityClassificationTab />,
    },
    {
      key: "relationships",
      label: "Relationships",
      fields: [
        "customer_organization_id",
        "principal_organization_id",
        "distributor_organization_id",
        "account_manager_id",
        "contact_ids",
        "products_to_sync",
      ],
      content: <OpportunityRelationshipsTab />,
    },
    {
      key: "details",
      label: "Details",
      fields: [
        "related_opportunity_id",
        "notes",
        "next_action",
        "next_action_date",
        "decision_criteria",
      ],
      content: <OpportunityDetailsTab />,
    },
  ];

  return <TabbedFormInputs tabs={tabs} defaultTab="general" />;
};
