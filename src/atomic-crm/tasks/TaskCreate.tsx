import { CreateBase, Form, useGetIdentity } from "ra-core";
import { useSearchParams } from "react-router-dom";
import { getContextAwareRedirect } from "@/atomic-crm/utils/getContextAwareRedirect";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProgressProvider, FormProgressBar } from "@/components/ra-wrappers/form";
import { CreateFormFooter } from "@/atomic-crm/components";
import { TaskCompactForm } from "./TaskCompactForm";
import { getTaskDefaultValues, taskCreateSchema } from "../validation/task";

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
  const { data: identity } = useGetIdentity();
  const [searchParams] = useSearchParams();

  // Compute context-aware redirect (returns to parent entity if navigated from one)
  const redirect = getContextAwareRedirect(searchParams);

  // Read URL params for pre-fill (follow-up task creation flow)
  const urlTitle = searchParams.get("title");
  const urlType = searchParams.get("type");
  const urlContactId = searchParams.get("contact_id");
  const urlOpportunityId = searchParams.get("opportunity_id");
  const urlOrganizationId = searchParams.get("organization_id");

  const defaultValues = {
    ...getTaskDefaultValues(),
    sales_id: identity?.id,
    // URL params override defaults
    ...(urlTitle && { title: urlTitle }),
    ...(urlType && { type: URL_TYPE_MAP[urlType.toLowerCase()] || urlType }),
    ...(urlContactId && { contact_id: Number(urlContactId) }),
    ...(urlOpportunityId && { opportunity_id: Number(urlOpportunityId) }),
    ...(urlOrganizationId && { organization_id: Number(urlOrganizationId) }),
  };

  return (
    <CreateBase redirect={redirect}>
      <div className="bg-muted px-6 py-6">
        <div className="max-w-4xl mx-auto create-form-card">
          <FormProgressProvider initialProgress={10}>
            <FormProgressBar className="mb-6" />
            <Form
              defaultValues={defaultValues}
              mode="onBlur"
              resolver={zodResolver(taskCreateSchema)}
            >
              <TaskCompactForm />
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
