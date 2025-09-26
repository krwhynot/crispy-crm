import { EditBase, Form } from "ra-core";

import { OrganizationInputs } from "./OrganizationInputs";

import { Card, CardContent } from "@/components/ui/card";
import { OrganizationAside } from "./OrganizationAside";
import { FormToolbar } from "../layout/FormToolbar";

export const OrganizationEdit = () => (
  <EditBase
    actions={false}
    redirect="show"
    transform={(values) => {
      // add https:// before website if not present
      if (values.website && !values.website.startsWith("http")) {
        values.website = `https://${values.website}`;
      }
      return values;
    }}
  >
    <div className="mt-2 flex gap-8">
      <Form className="flex flex-1 flex-col gap-4 pb-2">
        <Card>
          <CardContent>
            <OrganizationInputs />
            <FormToolbar />
          </CardContent>
        </Card>
      </Form>

      <OrganizationAside link="show" />
    </div>
  </EditBase>
);
