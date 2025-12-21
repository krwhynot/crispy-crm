/**
 * ActivityInputs - Shared form inputs for Activity create/edit forms
 *
 * This component wraps ActivitySinglePage to provide a standard module interface.
 * ActivitySinglePage contains the actual form fields for activities.
 */
import { useFormState } from "react-hook-form";
import { FormErrorSummary } from "@/components/admin/FormErrorSummary";
import ActivitySinglePage from "./ActivitySinglePage";

const ACTIVITY_FIELD_LABELS: Record<string, string> = {
  type: "Interaction Type",
  subject: "Subject",
  activity_date: "Date",
  duration_minutes: "Duration",
  description: "Notes",
  opportunity_id: "Opportunity",
  contact_id: "Contact",
  organization_id: "Organization",
  sentiment: "Sentiment",
  follow_up_date: "Follow-up Date",
  follow_up_notes: "Follow-up Notes",
  location: "Location",
  outcome: "Outcome",
};

export const ActivityInputs = () => {
  const { errors } = useFormState();
  const hasErrors = Object.keys(errors || {}).length > 0;

  return (
    <div className="flex flex-col gap-4">
      {hasErrors && (
        <FormErrorSummary
          errors={errors}
          fieldLabels={ACTIVITY_FIELD_LABELS}
          defaultExpanded={Object.keys(errors).length <= 3}
        />
      )}
      <ActivitySinglePage />
    </div>
  );
};

export default ActivityInputs;
