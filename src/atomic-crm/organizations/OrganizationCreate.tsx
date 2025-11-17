import { CreateBase, Form, useGetIdentity, useGetList } from "ra-core";
import { Card, CardContent } from "@/components/ui/card";
import { CancelButton } from "@/components/admin/cancel-button";
import { SaveButton } from "@/components/admin/form";
import { FormToolbar } from "@/components/admin/simple-form";
import { useLocation } from "react-router-dom";

import { OrganizationInputs } from "./OrganizationInputs";
import type { Database } from "@/types/database.generated";

type Segment = Database["public"]["Tables"]["segments"]["Row"];

const OrganizationCreate = () => {
  const { identity } = useGetIdentity();
  const location = useLocation();

  const { data: segments = [] } = useGetList<Segment>(
    "segments",
    {
      filter: { name: "Unknown" },
      pagination: { page: 1, perPage: 1 },
      sort: { field: "name", order: "ASC" },
    },
    {
      enabled: true,
    }
  );

  const unknownSegmentId = segments?.[0]?.id;

  // Read parent_organization_id from router state (set by "Add Branch" button)
  const parentOrgId = (location.state as any)?.record?.parent_organization_id;

  const defaultValues = {
    sales_id: identity?.id,
    segment_id: unknownSegmentId ?? undefined,
    ...(parentOrgId ? { parent_organization_id: parentOrgId } : {}), // Pre-fill parent when adding branch
  };
  const formKey = unknownSegmentId ? `org-create-${unknownSegmentId}` : "org-create";

  return (
    <CreateBase
      redirect="show"
      transform={(values) => {
        // add https:// before website if not present
        if (values.website && !values.website.startsWith("http")) {
          values.website = `https://${values.website}`;
        }
        return values;
      }}
    >
      <div className="mt-2 flex lg:mr-72">
        <div className="flex-1">
          <Form key={formKey} defaultValues={defaultValues}>
            <Card>
              <CardContent>
                <OrganizationInputs />
                <FormToolbar>
                  <div className="flex flex-row gap-2 justify-end">
                    <CancelButton />
                    <SaveButton label="Create Organization" />
                  </div>
                </FormToolbar>
              </CardContent>
            </Card>
          </Form>
        </div>
      </div>
    </CreateBase>
  );
};

export { OrganizationCreate };
export default OrganizationCreate;
