import { useMemo } from "react";
import { SectionCard } from "@/components/ra-wrappers/SectionCard";
import { ResponsiveGrid } from "@/components/design-system";
import { EditBase, Form, useEditContext, useRefresh } from "ra-core";
import { createFormResolver } from "@/lib/zodErrorFormatting";
import { useSafeNotify } from "../hooks/useSafeNotify";
import { useQueryClient } from "@tanstack/react-query";

import { contactKeys, activityKeys, opportunityKeys } from "../queryKeys";
import type { Contact } from "../types";
import { ContactAside } from "./ContactAside";
import { ContactInputs } from "./ContactInputs";
import { FormToolbar } from "../layout/FormToolbar";
import { contactBaseSchema } from "@/atomic-crm/validation/contacts";
import { notificationMessages } from "@/atomic-crm/constants/notificationMessages";

export const ContactEdit = () => {
  const queryClient = useQueryClient();
  const { success, actionError } = useSafeNotify();
  const refresh = useRefresh();

  return (
    <EditBase
      redirect="show"
      mutationMode="pessimistic"
      mutationOptions={{
        onSuccess: (data) => {
          // FIX [EDIT-001]: Invalidate specific contact detail + related caches
          // Prevents stale data when navigating back to show page
          const contactId = typeof data?.id === "number" ? data.id : Number(data?.id);
          if (contactId) {
            queryClient.invalidateQueries({ queryKey: contactKeys.detail(contactId) });
          }
          queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
          queryClient.invalidateQueries({ queryKey: activityKeys.lists() });
          queryClient.invalidateQueries({ queryKey: opportunityKeys.lists() });
          success(notificationMessages.updated("Contact"));
        },
        onError: (err: Error) => {
          // BUG-008 fix: Catch validation errors, RLS failures, network errors
          // Without this callback, errors from dataProvider.update() were silently swallowed
          actionError(err, "update", "contact");
          refresh(); // Reset form to last known good state
        },
      }}
    >
      <ContactEditContent />
    </EditBase>
  );
};

const ContactEditContent = () => {
  const { isPending, record } = useEditContext<Contact>();

  const defaultValues = useMemo(() => contactBaseSchema.partial().parse(record), [record]);

  if (isPending || !record) return null;

  return (
    <ResponsiveGrid variant="dashboard" className="mt-2">
      <main role="main" aria-label="Edit contact">
        <Form
          className="flex flex-col gap-4"
          defaultValues={defaultValues}
          mode="onBlur"
          resolver={createFormResolver(contactBaseSchema)}
        >
          <SectionCard>
            <ContactInputs />
            <FormToolbar />
          </SectionCard>
        </Form>
      </main>

      <aside aria-label="Contact information">
        <ContactAside link="show" />
      </aside>
    </ResponsiveGrid>
  );
};

export default ContactEdit;
