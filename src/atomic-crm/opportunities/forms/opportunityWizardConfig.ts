/**
 * Opportunity Wizard Configuration
 *
 * Step definitions for the multi-step opportunity creation wizard.
 * Extracted to separate file to satisfy react-refresh/only-export-components.
 */
import type { WizardStepConfig } from "@/components/admin/form";

/**
 * Wizard step configuration for Opportunities
 * 4 steps following Miller's Law (7±2 items max per cognitive chunk)
 */
export const OPPORTUNITY_WIZARD_STEPS: WizardStepConfig[] = [
  {
    id: "basic",
    title: "Basic Information",
    fields: ["name", "customer_organization_id"],
  },
  {
    id: "pipeline",
    title: "Pipeline & Team",
    fields: ["stage", "priority", "estimated_close_date"],
  },
  {
    id: "relationships",
    title: "Contacts & Products",
    fields: [], // Optional step - no required validation
  },
  {
    id: "details",
    title: "Additional Details",
    fields: [], // Optional step - no required validation
  },
];
