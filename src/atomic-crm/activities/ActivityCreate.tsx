import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CreateBase, Form, useInput, useGetIdentity } from "ra-core";
import { useFormState } from "react-hook-form";
import { useLocation } from "react-router-dom";
import { FormErrorSummary } from "@/components/admin/FormErrorSummary";
import { CreateFormFooter } from "@/atomic-crm/components";
import { activitiesSchema } from "../validation/activities";
import ActivitySinglePage from "./ActivitySinglePage";
import { FormProgressProvider, FormProgressBar } from "@/components/admin/form";
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";

const HiddenActivityTypeField = () => {
  // Use "engagement" as default - doesn't require opportunity_id like "interaction" does
  // This prevents validation errors on form mount when no opportunity is pre-selected
  const { field } = useInput({
    source: "activity_type",
    defaultValue: "engagement",
  });

  return <input type="hidden" {...field} value={field.value ?? "engagement"} />;
};

export default function ActivityCreate() {
  const { identity } = useGetIdentity();
  const location = useLocation();

  // Read URL params for pre-fill
  const searchParams = new URLSearchParams(location.search);
  const urlType = searchParams.get("type");
  const urlSubject = searchParams.get("subject");
  const urlContactId = searchParams.get("contact_id");
  const urlOpportunityId = searchParams.get("opportunity_id");
  const urlOrganizationId = searchParams.get("organization_id");

  const defaultValues = useMemo(
    () => ({
      ...activitiesSchema.partial().parse({}),
      // Set current user as creator - ensures proper audit trail
      created_by: identity?.id,
      // URL params override defaults
      ...(urlType && { type: urlType }),
      ...(urlSubject && { subject: decodeURIComponent(urlSubject) }),
      ...(urlContactId && { contact_id: Number(urlContactId) }),
      ...(urlOpportunityId && { opportunity_id: Number(urlOpportunityId) }),
      ...(urlOrganizationId && { organization_id: Number(urlOrganizationId) }),
    }),
    [identity?.id, urlType, urlSubject, urlContactId, urlOpportunityId, urlOrganizationId]
  );

  return (
    <CreateBase redirect="list">
      <div className="bg-muted mt-2 flex justify-center px-6 py-6">
        <div className="w-full max-w-5xl">
          <FormProgressProvider initialProgress={10}>
            <FormProgressBar className="mb-6" />
            <Form defaultValues={defaultValues} mode="onBlur">
              <Card>
                <CardContent className="space-y-6 p-6">
                  <ActivityFormContent />
                </CardContent>
              </Card>
            </Form>
          </FormProgressProvider>
        </div>
      </div>
    </CreateBase>
  );
}

const ActivityFormContent = () => {
  const { errors } = useFormState();
  useUnsavedChangesWarning();

  return (
    <>
      <FormErrorSummary errors={errors} />
      <HiddenActivityTypeField />
      <ActivitySinglePage />
      <CreateFormFooter
        resourceName="activity"
        redirectPath="/activities"
        tutorialAttribute="activity-save-btn"
        preserveFields={["contact_id", "organization_id", "opportunity_id"]}
      />
    </>
  );
};
