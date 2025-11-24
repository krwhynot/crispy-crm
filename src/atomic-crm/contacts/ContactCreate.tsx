import { CreateBase, Form, useGetIdentity, useNotify, useRedirect } from "ra-core";
import { useFormContext, useFormState } from "react-hook-form";
import { useCallback } from "react";

import { Button } from "@/components/ui/button";
import { SaveButton } from "@/components/admin/form";
import type { Contact } from "../types";
import { ContactInputs } from "./ContactInputs";
import { contactSchema } from "../validation/contacts";

const ContactCreate = () => {
  const { identity } = useGetIdentity();
  const notify = useNotify();
  const redirect = useRedirect();

  // Generate defaults from schema, then merge with identity-specific values
  // Per Constitution #5: FORM STATE DERIVED FROM TRUTH
  // Use .partial() to make all fields optional during default generation
  // This extracts fields with .default() (email: [], phone: [])
  const formDefaults = {
    ...contactSchema.partial().parse({}),
    sales_id: identity?.id,
  };

  const transformData = (data: Contact) => ({
    ...data,
    first_seen: new Date().toISOString(),
    last_seen: new Date().toISOString(),
    tags: [],
  });

  return (
    <CreateBase redirect="list" transform={transformData}>
      <div className="bg-muted px-6 py-6">
        <div className="max-w-4xl mx-auto create-form-card">
          <Form defaultValues={formDefaults}>
            <ContactInputs />
            <ContactCreateFooter notify={notify} redirect={redirect} />
          </Form>
        </div>
      </div>
    </CreateBase>
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
    <div className="sticky bottom-0 bg-card border-t border-border p-4 flex justify-between mt-6">
      <Button variant="outline" onClick={handleCancel}>
        Cancel
      </Button>
      <div className="flex gap-2">
        <SaveButton
          type="button"
          label="Save & Close"
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
