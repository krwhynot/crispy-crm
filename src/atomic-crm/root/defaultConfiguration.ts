import { Mars, NonBinary, Venus } from "lucide-react";

export const defaultDarkModeLogo = "./logos/logo_atomic_crm_dark.svg";
export const defaultLightModeLogo = "./logos/logo_atomic_crm_light.svg";

export const defaultTitle = "Atomic CRM";

export const defaultOrganizationSectors = [
  "Communication Services",
  "Consumer Discretionary",
  "Consumer Staples",
  "Energy",
  "Financials",
  "Health Care",
  "Industrials",
  "Information Technology",
  "Materials",
  "Real Estate",
  "Utilities",
];

export const defaultDealStages = [
  { value: "opportunity", label: "Opportunity" },
  { value: "proposal-sent", label: "Proposal Sent" },
  { value: "in-negociation", label: "In Negotiation" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
  { value: "delayed", label: "Delayed" },
];

export const defaultDealPipelineStatuses = ["won"];

export const defaultDealCategories = [
  "Other",
  "Copywriting",
  "Print project",
  "UI Design",
  "Website design",
];

export const defaultOpportunityStages = [
  { value: "lead", label: "Lead" },
  { value: "qualified", label: "Qualified" },
  { value: "needs_analysis", label: "Needs Analysis" },
  { value: "proposal", label: "Proposal" },
  { value: "negotiation", label: "Negotiation" },
  { value: "closed_won", label: "Closed Won" },
  { value: "closed_lost", label: "Closed Lost" },
  { value: "nurturing", label: "Nurturing" },
];

export const defaultOpportunityCategories = [
  "Other",
  "Copywriting",
  "Print project",
  "UI Design",
  "Website design",
];

export const defaultNoteStatuses = [
  { value: "cold", label: "Cold", color: "var(--info-default)" },
  { value: "warm", label: "Warm", color: "var(--warning-default)" },
  { value: "hot", label: "Hot", color: "var(--error-default)" },
  {
    value: "in-contract",
    label: "In Contract",
    color: "var(--success-default)",
  },
];

export const defaultTaskTypes = [
  "None",
  "Email",
  "Demo",
  "Lunch",
  "Meeting",
  "Follow-up",
  "Thank you",
  "Ship",
  "Call",
];

export const defaultContactGender = [
  { value: "male", label: "He/Him", icon: Mars },
  { value: "female", label: "She/Her", icon: Venus },
  { value: "nonbinary", label: "They/Them", icon: NonBinary },
];
