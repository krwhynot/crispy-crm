import { useFormState } from "react-hook-form";
import { FormErrorSummary } from "@/components/admin/FormErrorSummary";
import { ContactCompactForm } from "./ContactCompactForm";

const CONTACT_FIELD_LABELS: Record<string, string> = {
  first_name: "First Name",
  last_name: "Last Name",
  organization_id: "Organization",
  sales_id: "Account Manager",
  email: "Email",
  phone: "Phone",
  title: "Job Title",
  department: "Department",
  linkedin_url: "LinkedIn URL",
  notes: "Notes",
};

export const ContactInputs = () => {
  const { errors } = useFormState();
  const hasErrors = Object.keys(errors || {}).length > 0;

  return (
    <div className="flex flex-col gap-4">
      {hasErrors && (
        <FormErrorSummary
          errors={errors}
          fieldLabels={CONTACT_FIELD_LABELS}
          defaultExpanded={Object.keys(errors).length <= 3}
        />
      )}
      <ContactCompactForm />
    </div>
  );
};
