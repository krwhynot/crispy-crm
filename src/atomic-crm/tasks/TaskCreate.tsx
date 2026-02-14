import { useMemo } from "react";
import { CreateBase, Form, useGetIdentity } from "ra-core";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { getContextAwareRedirect } from "@/atomic-crm/utils/getContextAwareRedirect";
import { createFormResolver } from "@/lib/zodErrorFormatting";
import { FormProgressProvider, FormProgressBar } from "@/components/ra-wrappers/form";
import { CreateFormFooter } from "@/atomic-crm/components";
import { TaskInputs } from "./TaskInputs";
import { getTaskDefaultValues, taskCreateSchema } from "../validation/task";
import {
  taskKeys,
  opportunityKeys,
  contactKeys,
  organizationKeys,
  dashboardKeys,
  entityTimelineKeys,
} from "../queryKeys";

// Map URL param values to task type enum values
const URL_TYPE_MAP: Record<string, string> = {
  follow_up: "Follow-up",
  call: "Call",
  email: "Email",
  meeting: "Meeting",
  demo: "Demo",
  proposal: "Proposal",
  other: "Other",
};

/**
 * TaskCreate Component
 *
 * Full-page create form following unified design system:
 * - bg-muted page background
 * - Centered card with create-form-card styling
 * - Single-page form with sections via TaskCompactForm
 * - Sticky footer with Cancel, Save & Close, Save & Add Another
 * - Dirty state confirmation on cancel
 *
 * Pre-fills: today's due date, current user, medium priority
 */
export default function TaskCreate() {
  const { data: identity, isLoading: isIdentityLoading } = useGetIdentity();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  // Compute context-aware redirect (returns to parent entity if navigated from one)
  const redirect = getContextAwareRedirect(searchParams);

  // Read URL params for pre-fill (follow-up task creation flow)
  const urlTitle = searchParams.get("title");
  const urlType = searchParams.get("type");
  const urlContactId = searchParams.get("contact_id");
  const urlOpportunityId = searchParams.get("opportunity_id");
  const urlOrganizationId = searchParams.get("organization_id");
  const urlRelatedTaskId = searchParams.get("related_task_id");

  // Memoize defaultValues with stable identity.id to prevent form reset
  // when identity loads asynchronously (ra-core Form resets on defaultValues change)
  const defaultValues = useMemo(
    () => ({
      ...getTaskDefaultValues(),
      sales_id: identity?.id,
      // URL params override defaults
      ...(urlTitle && { title: urlTitle }),
      ...(urlType && { type: URL_TYPE_MAP[urlType.toLowerCase()] || urlType }),
      ...(urlContactId && { contact_id: Number(urlContactId) }),
      ...(urlOpportunityId && { opportunity_id: Number(urlOpportunityId) }),
      ...(urlOrganizationId && { organization_id: Number(urlOrganizationId) }),
      ...(urlRelatedTaskId && { related_task_id: Number(urlRelatedTaskId) }),
    }),
    [
      identity?.id,
      urlTitle,
      urlType,
      urlContactId,
      urlOpportunityId,
      urlOrganizationId,
      urlRelatedTaskId,
    ]
  );

  // Guard: Wait for identity to load before rendering form
  // Prevents form reset when identity loads after user starts typing
  if (isIdentityLoading || !identity?.id) {
    return (
      <div className="bg-muted px-6 py-6">
        <div className="max-w-4xl mx-auto create-form-card p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted-foreground/10 rounded w-1/4" />
            <div className="h-10 bg-muted-foreground/10 rounded" />
            <div className="h-24 bg-muted-foreground/10 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <CreateBase
      resource="tasks"
      redirect={redirect}
      mutationOptions={{
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: taskKeys.all });
          queryClient.invalidateQueries({ queryKey: opportunityKeys.all });
          queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
          queryClient.invalidateQueries({ queryKey: dashboardKeys.all });

          // Invalidate contact detail cache if task linked to contact
          const contactId = searchParams.get("contact_id");
          if (contactId) {
            queryClient.invalidateQueries({
              queryKey: contactKeys.detail(Number(contactId)),
            });
          }

          // Invalidate organization detail cache if task linked to organization
          const orgId = searchParams.get("organization_id");
          if (orgId) {
            queryClient.invalidateQueries({
              queryKey: organizationKeys.detail(Number(orgId)),
            });
          }

          // Invalidate entity timeline so Activities tab refreshes immediately
          // Use .all to match React Admin's "getList" query key pattern
          queryClient.invalidateQueries({ queryKey: entityTimelineKeys.all });
        },
      }}
    >
      <div className="bg-muted px-6 py-6">
        <div className="max-w-4xl mx-auto create-form-card">
          <FormProgressProvider initialProgress={10}>
            <FormProgressBar schema={taskCreateSchema} className="mb-6" />
            <Form
              defaultValues={defaultValues}
              mode="onBlur"
              resolver={createFormResolver(taskCreateSchema)}
            >
              <TaskInputs />
              <CreateFormFooter
                resourceName="task"
                redirectPath="/tasks"
                redirect={redirect}
                tutorialAttribute="task-save-btn"
              />
            </Form>
          </FormProgressProvider>
        </div>
      </div>
    </CreateBase>
  );
}
