import { Mars, NonBinary, Venus } from "lucide-react";
import { STAGE } from "@/atomic-crm/opportunities/constants";

export const defaultDarkModeLogo = "./logos/logo_atomic_crm_dark.svg";
export const defaultLightModeLogo = "./logos/logo_atomic_crm_light.svg";

export const defaultTitle = "Atomic CRM";

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
  { value: "new_lead", label: "New Lead" },
  { value: "initial_outreach", label: "Initial Outreach" },
  { value: "sample_visit_offered", label: "Sample Visit Offered" },
  { value: "feedback_logged", label: "Feedback Logged" },
  { value: "demo_scheduled", label: "Demo Scheduled" },
  { value: "closed_won", label: "Closed Won" },
  { value: "closed_lost", label: "Closed Lost" },
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
  "Call", // Phone conversations
  "Email", // Email communications
  "Meeting", // In-person/virtual meetings
  "Follow-up", // Re-engagement reminders
  "Demo", // Product demonstrations
  "Proposal", // Formal offers and proposals
  "Other", // Miscellaneous tasks
];

export const defaultContactGender = [
  { value: "male", label: "He/Him", icon: Mars },
  { value: "female", label: "She/Her", icon: Venus },
  { value: "nonbinary", label: "They/Them", icon: NonBinary },
];
