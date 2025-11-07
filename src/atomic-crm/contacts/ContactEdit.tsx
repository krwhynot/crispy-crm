import { Card, CardContent } from "@/components/ui/card";
import { ResponsiveGrid } from "@/components/design-system";
import { EditBase, Form, useEditContext } from "ra-core";

import type { Contact } from "../types";
import { ContactAside } from "./ContactAside";
import { ContactInputs } from "./ContactInputs";
import { FormToolbar } from "../layout/FormToolbar";

export const ContactEdit = () => (
  <EditBase redirect="show">
    <ContactEditContent />
  </EditBase>
);

const ContactEditContent = () => {
  const { isPending, record } = useEditContext<Contact>();
  if (isPending || !record) return null;
  return (
    <ResponsiveGrid variant="dashboard" className="mt-2">
      <main role="main" aria-label="Edit contact">
        <Form className="flex flex-col gap-4">
          <Card>
            <CardContent>
              <ContactInputs />
              <FormToolbar />
            </CardContent>
          </Card>
        </Form>
      </main>

      <aside role="complementary" aria-label="Contact information">
        <ContactAside link="show" />
      </aside>
    </ResponsiveGrid>
  );
};

export default ContactEdit;
