import { useFormState } from "react-hook-form";
import { FormErrorSummary } from "@/components/ra-wrappers/FormErrorSummary";
import { ContactCompactForm } from "./ContactCompactForm";

const CONTACT_FIELD_LABELS: Record<string, string> = {
  // Primary identity fields
  first_name: "First Name",
  last_name: "Last Name",
  name: "Full Name",

  // Organization and relationships
  organization_id: "Organization",
  sales_id: "Primary Account Manager",
  secondary_sales_id: "Secondary Account Manager",
  manager_id: "Manager",

  // Contact information - top level
  email: "Email",
  phone: "Phone",

  // Nested email array fields (email.0.value, email.0.type, etc.)
  "email.value": "Email Address",
  "email.type": "Email Type",

  // Nested phone array fields (phone.0.value, phone.0.type, etc.)
  "phone.value": "Phone Number",
  "phone.type": "Phone Type",

  // Professional information
  title: "Job Title",
  department: "Department",
  department_type: "Department Type",

  // Social and web
  linkedin_url: "LinkedIn URL",
  twitter_handle: "Twitter Handle",

  // Territory fields
  district_code: "District Code",
  territory_name: "Territory",

  // Address fields
  address: "Address",
  city: "City",
  state: "State",
  postal_code: "Postal Code",
  country: "Country",

  // Personal info
  birthday: "Birthday",
  gender: "Gender",

  // Classification
  status: "Status",
  tags: "Tags",

  // Other
  notes: "Notes",
  avatar: "Profile Photo",
};

interface ContactInputsProps {
  disabled?: boolean;
}

export const ContactInputs = ({ disabled = false }: ContactInputsProps) => {
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
      <ContactCompactForm disabled={disabled} />
    </div>
  );
};
