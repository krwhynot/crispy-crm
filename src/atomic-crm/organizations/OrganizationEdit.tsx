import { EditBase, Form, useRecordContext } from "ra-core";
import { useQueryClient } from "@tanstack/react-query";

import { organizationKeys, contactKeys, opportunityKeys } from "../queryKeys";
import { OrganizationInputs } from "./OrganizationInputs";

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
          queryClient.invalidateQueries({ queryKey: organizationKeys.all });
          queryClient.invalidateQueries({ queryKey: contactKeys.all });
          queryClient.invalidateQueries({ queryKey: opportunityKeys.all });
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

  // Use record directly for form defaults - validation happens at API boundary (save time)
  // Do NOT parse through organizationSchema here - it uses strictObject which rejects
  // internal DB fields (import_session_id, search_tsv, playbook_category_id)
  const defaultValues = record;

  return (
    <ResponsiveGrid variant="dashboard" className="mt-2">
      <main role="main" aria-label="Edit organization">
        <Form defaultValues={defaultValues} className="flex flex-col gap-4">
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
