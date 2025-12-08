import { useFormState } from "react-hook-form";
import { FormErrorSummary } from "@/components/admin/FormErrorSummary";
import { OrganizationCompactForm } from "./OrganizationCompactForm";

const ORGANIZATION_FIELD_LABELS: Record<string, string> = {
  name: "Organization Name",
  organization_type: "Type",
  sales_id: "Account Manager",
  segment_id: "Segment",
  address: "Street",
  city: "City",
  state: "State",
  postal_code: "Zip Code",
  website: "Website",
  linkedin_url: "LinkedIn URL",
  parent_organization_id: "Parent Organization",
  description: "Description",
  phone: "Phone",
};

export const OrganizationInputs = () => {
  const { errors } = useFormState();
  const hasErrors = Object.keys(errors || {}).length > 0;

  return (
    <div className="flex flex-col gap-4">
      {hasErrors && (
        <FormErrorSummary
          errors={errors}
          fieldLabels={ORGANIZATION_FIELD_LABELS}
          defaultExpanded={Object.keys(errors).length <= 3}
        />
      )}
      <OrganizationCompactForm />
    </div>
  );
};
