import { CreateBase, Form, useNotify, useRedirect } from "ra-core";
import { useFormContext, useFormState } from "react-hook-form";
import { useCallback } from "react";

import { Button } from "@/components/ui/button";
import { SaveButton, FormLoadingSkeleton } from "@/components/admin/form";
import { useSmartDefaults } from "@/atomic-crm/hooks/useSmartDefaults";
import type { Contact } from "../types";
import { ContactInputs } from "./ContactInputs";
import { contactBaseSchema } from "../validation/contacts";

const ContactCreate = () => {
  const notify = useNotify();
  const redirect = useRedirect();
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
          <Form defaultValues={formDefaults}>
            <ContactFormContent notify={notify} redirect={redirect} />
          </Form>
        </div>
      </div>
    </CreateBase>
  );
};

const ContactFormContent = ({
  notify,
  redirect,
}: {
  notify: ReturnType<typeof useNotify>;
  redirect: ReturnType<typeof useRedirect>;
}) => {
  return (
    <>
      <ContactInputs />
      <ContactCreateFooter notify={notify} redirect={redirect} />
    </>
  );
};

const ContactCreateFooter = ({
  notify,
  redirect,
}: {
  notify: ReturnType<typeof useNotify>;
  redirect: ReturnType<typeof useRedirect>;
}) => {
  const { reset } = useFormContext();
  const { isDirty } = useFormState();

  const handleCancel = useCallback(() => {
    if (isDirty) {
      const confirmed = window.confirm("You have unsaved changes. Are you sure you want to leave?");
      if (!confirmed) return;
    }
    redirect("/contacts");
  }, [isDirty, redirect]);

  const handleError = useCallback(
    (error: Error) => {
      notify(error.message || "Failed to create contact", { type: "error" });
    },
    [notify]
  );

  return (
    <div className="sticky bottom-12 bg-card border-t border-border p-4 flex justify-between mt-6">
      <Button variant="outline" onClick={handleCancel}>
        Cancel
      </Button>
      <div className="flex gap-2">
        <SaveButton
          type="button"
          label="Save & Close"
          data-tutorial="contact-save-btn"
          mutationOptions={{
            onSuccess: () => {
              notify("Contact created successfully", { type: "success" });
              redirect("/contacts");
            },
            onError: handleError,
          }}
        />
        <SaveButton
          type="button"
          label="Save & Add Another"
          mutationOptions={{
            onSuccess: () => {
              notify("Contact created successfully", { type: "success" });
              reset();
            },
            onError: handleError,
          }}
        />
      </div>
    </div>
  );
};

export default ContactCreate;
