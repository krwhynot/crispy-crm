import { SelectInput } from "@/components/admin/select-input";

/**
 * Opportunity Context choices (SIMPLIFIED - 7 values only, no legacy)
 */
export const OPPORTUNITY_CONTEXT_CHOICES = [
  { id: "Site Visit", name: "Site Visit" },
  { id: "Food Show", name: "Food Show" },
  { id: "New Product Interest", name: "New Product Interest" },
  { id: "Follow-up", name: "Follow-up" },
  { id: "Demo Request", name: "Demo Request" },
  { id: "Sampling", name: "Sampling" },
  { id: "Custom", name: "Custom" },
];

/**
 * Opportunity Context Input Component
 * Simple dropdown with 7 clean values (no legacy support)
 */
export const OpportunityContextInput = () => {
  return (
    <SelectInput
      source="opportunity_context"
      label="Opportunity Context"
      choices={OPPORTUNITY_CONTEXT_CHOICES}
      helperText={false}
    />
  );
};
