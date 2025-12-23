import { useMemo } from "react";
import { EditBase, Form, useRecordContext } from "ra-core";
import { useQueryClient } from "@tanstack/react-query";

import { OrganizationInputs } from "./OrganizationInputs";
import { organizationSchema } from "@/atomic-crm/validation/organizations";

import { Card, CardContent } from "@/components/ui/card";
import { ResponsiveGrid } from "@/components/design-system";
import { OrganizationAside } from "./OrganizationAside";
import { FormToolbar } from "../layout/FormToolbar";
import type { Organization } from "../types";

const OrganizationEdit = () => {
  const queryClient = useQueryClient();

  return (
    <EditBase
      actions={false}
      redirect="show"
      mutationOptions={{
        onSuccess: () => {
          // Invalidate related caches to prevent stale data
          queryClient.invalidateQueries({ queryKey: ["organizations"] });
          queryClient.invalidateQueries({ queryKey: ["contacts"] });
          queryClient.invalidateQueries({ queryKey: ["opportunities"] });
        },
      }}
      transform={(values) => {
        // add https:// before website if not present
        if (values.website && !values.website.startsWith("http")) {
          values.website = `https://${values.website}`;
        }
        return values;
      }}
    >
      <OrganizationEditContent />
    </EditBase>
  );
};

const OrganizationEditContent = () => {
  const record = useRecordContext<Organization>();

  const defaultValues = useMemo(
    () => organizationSchema.partial().parse(record),
    [record]
  );

  return (
    <ResponsiveGrid variant="dashboard" className="mt-2">
      <main role="main" aria-label="Edit organization">
        <Form defaultValues={defaultValues} key={record.id} className="flex flex-col gap-4">
          <Card>
            <CardContent>
              <OrganizationInputs />
              <FormToolbar />
            </CardContent>
          </Card>
        </Form>
      </main>

      <aside aria-label="Organization information">
        <OrganizationAside link="show" />
      </aside>
    </ResponsiveGrid>
  );
};

export { OrganizationEdit };
export default OrganizationEdit;
