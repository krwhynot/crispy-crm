import { CreateBase, Form } from "ra-core";

import {
  FormLoadingSkeleton,
  FormProgressProvider,
  FormProgressBar,
} from "@/components/admin/form";
import { useSmartDefaults } from "@/atomic-crm/hooks/useSmartDefaults";
import { CreateFormFooter } from "@/atomic-crm/components";
import type { Contact } from "../types";
import { ContactInputs } from "./ContactInputs";
import { contactBaseSchema } from "../validation/contacts";
import { ContactFormTutorial } from "./ContactFormTutorial";

const ContactCreate = () => {
  const { defaults, isLoading } = useSmartDefaults();

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

  // Generate defaults from schema truth
  // Per Constitution #5: FORM STATE DERIVED FROM TRUTH
  // contactBaseSchema is a ZodObject (not ZodEffects), so .partial().parse({}) works
  // Note: Only spread sales_id from defaults - contacts don't have activity_date
  const formDefaults = {
    ...contactBaseSchema.partial().parse({}),
    sales_id: defaults.sales_id,
  };

  return (
    <CreateBase redirect="list" transform={transformData}>
      <div className="bg-muted px-6 py-6">
        <div className="max-w-4xl mx-auto create-form-card">
          <FormProgressProvider initialProgress={10}>
            <FormProgressBar className="mb-6" />
            <Form defaultValues={formDefaults} mode="onBlur">
              <ContactFormContent />
            </Form>
          </FormProgressProvider>
        </div>
      </div>
      <ContactFormTutorial />
    </CreateBase>
  );
};

const ContactFormContent = () => {
  return (
    <>
      <ContactInputs />
      <CreateFormFooter
        resourceName="contact"
        redirectPath="/contacts"
        tutorialAttribute="contact-save-btn"
      />
    </>
  );
};

export default ContactCreate;
