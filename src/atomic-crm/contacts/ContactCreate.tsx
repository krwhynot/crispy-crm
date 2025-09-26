import { Card, CardContent } from "@/components/ui/card";
import { CreateBase, Form, useGetIdentity } from "ra-core";

import { FormToolbar } from "@/components/admin";
import type { Contact } from "../types";
import { ContactInputs } from "./ContactInputs";

const ContactCreate = () => {
  const { identity } = useGetIdentity();

  const transformData = (data: Contact) => ({
    ...data,
    first_seen: new Date().toISOString(),
    last_seen: new Date().toISOString(),
    tags: [],
  });

  return (
    <CreateBase redirect="show" transform={transformData}>
      <div className="mt-2 flex lg:mr-72">
        <div className="flex-1">
          <Form defaultValues={{ sales_id: identity?.id }}>
            <Card>
              <CardContent>
                <ContactInputs />
                <FormToolbar />
              </CardContent>
            </Card>
          </Form>
        </div>
      </div>
    </CreateBase>
  );
};

export default ContactCreate;
