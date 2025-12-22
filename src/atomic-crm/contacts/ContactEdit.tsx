import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ResponsiveGrid } from "@/components/design-system";
import { EditBase, Form, useEditContext } from "ra-core";
import { useQueryClient } from "@tanstack/react-query";

import type { Contact } from "../types";
import { ContactAside } from "./ContactAside";
import { ContactInputs } from "./ContactInputs";
import { FormToolbar } from "../layout/FormToolbar";
import { contactBaseSchema } from "@/atomic-crm/validation/contacts";

export const ContactEdit = () => {
  const queryClient = useQueryClient();

  return (
    <EditBase
      redirect="show"
      mutationOptions={{
        onSuccess: () => {
          // Invalidate related caches to prevent stale data
          queryClient.invalidateQueries({ queryKey: ["contacts"] });
          queryClient.invalidateQueries({ queryKey: ["activities"] });
          queryClient.invalidateQueries({ queryKey: ["opportunities"] });
        },
      }}
    >
      <ContactEditContent />
    </EditBase>
  );
};

const ContactEditContent = () => {
  const { isPending, record } = useEditContext<Contact>();

  const defaultValues = useMemo(
    () => contactBaseSchema.partial().parse(record),
    [record]
  );

  if (isPending || !record) return null;

  return (
    <ResponsiveGrid variant="dashboard" className="mt-2">
      <main role="main" aria-label="Edit contact">
        <Form className="flex flex-col gap-4" defaultValues={defaultValues} key={record.id}>
          <Card>
            <CardContent>
              <ContactInputs />
              <FormToolbar />
            </CardContent>
          </Card>
        </Form>
      </main>

      <aside aria-label="Contact information">
        <ContactAside link="show" />
      </aside>
    </ResponsiveGrid>
  );
};

export default ContactEdit;
