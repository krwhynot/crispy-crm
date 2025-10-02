import { SelectInput } from "@/components/admin/select-input";

export const LEAD_SOURCE_CHOICES = [
  { id: "referral", name: "Referral" },
  { id: "trade_show", name: "Trade Show" },
  { id: "website", name: "Website" },
  { id: "cold_call", name: "Cold Call" },
  { id: "email_campaign", name: "Email Campaign" },
  { id: "social_media", name: "Social Media" },
  { id: "partner", name: "Partner" },
  { id: "existing_customer", name: "Existing Customer" },
];

export const LeadSourceInput = () => {
  return (
    <SelectInput
      source="lead_source"
      label="Lead Source"
      choices={LEAD_SOURCE_CHOICES}
      helperText={false}
    />
  );
};
