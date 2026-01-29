import { useMemo } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { CreateBase, Form, type RedirectTo } from "ra-core";

import { createFormResolver } from "@/lib/zodErrorFormatting";
import { getContextAwareRedirect } from "@/atomic-crm/utils/getContextAwareRedirect";

import {
  FormLoadingSkeleton,
  FormProgressProvider,
  FormProgressBar,
} from "@/components/ra-wrappers/form";
import { useSmartDefaults } from "@/atomic-crm/hooks/useSmartDefaults";
import { CreateFormFooter } from "@/atomic-crm/components";
import type { Contact } from "../types";
import { ContactInputs } from "./ContactInputs";
import { contactBaseSchema } from "../validation/contacts";
import { ContactFormTutorial } from "./ContactFormTutorial";

const ContactCreate = () => {
  const { defaults, isLoading } = useSmartDefaults();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Compute context-aware redirect (returns to parent if navigated from org/opp)
  const redirect = getContextAwareRedirect(searchParams);

  // Read URL params (US3: ?organization_id=123)
  const urlOrganizationId = searchParams.get("organization_id");

  // Read location.state (US2: navigation from Org detail)
  const stateOrganizationId = (location.state as { record?: { organization_id?: string | number } })
    ?.record?.organization_id;

  // Generate defaults from schema truth
  // Per Constitution #5: FORM STATE DERIVED FROM TRUTH
  // URL param takes precedence over location.state
  // NOTE: Must be BEFORE early return to satisfy React Rules of Hooks
  const formDefaults = useMemo(
    () => ({
      ...contactBaseSchema.partial().parse({}),
      sales_id: defaults.sales_id,
      // US2 + US3: organization context (URL param > state > undefined)
      ...(urlOrganizationId && { organization_id: Number(urlOrganizationId) }),
      ...(!urlOrganizationId &&
        stateOrganizationId && { organization_id: Number(stateOrganizationId) }),
      // UX: Start with one empty row for email/phone arrays (schema defaults to [])
      email: [{ type: "work", value: "" }],
      phone: [{ type: "mobile", value: "" }],
    }),
    [defaults.sales_id, urlOrganizationId, stateOrganizationId]
  );

  const transformData = (data: Contact) => ({
    ...data,
    first_seen: new Date().toISOString(),
    last_seen: new Date().toISOString(),
    tags: [],
  });

  if (isLoading) {
    return (
      <div className="bg-muted px-6 py-6">
        <div className="max-w-4xl mx-auto">
          <FormLoadingSkeleton rows={4} />
        </div>
      </div>
    );
  }

  return (
    <CreateBase redirect={redirect} transform={transformData}>
      <div className="bg-muted px-6 py-6">
        <div className="max-w-4xl mx-auto create-form-card">
          <FormProgressProvider initialProgress={10}>
            <FormProgressBar schema={contactBaseSchema} className="mb-6" />
            <Form defaultValues={formDefaults} mode="onBlur">
              <ContactFormContent redirect={redirect} />
            </Form>
          </FormProgressProvider>
        </div>
      </div>
      <ContactFormTutorial />
    </CreateBase>
  );
};

interface ContactFormContentProps {
  redirect: RedirectTo;
}

const ContactFormContent = ({ redirect }: ContactFormContentProps) => {
  return (
    <>
      <ContactInputs />
      <CreateFormFooter
        resourceName="contact"
        redirectPath="/contacts"
        redirect={redirect}
        tutorialAttribute="contact-save-btn"
        preserveFields={["organization_id", "sales_id"]}
      />
    </>
  );
};

export default ContactCreate;
