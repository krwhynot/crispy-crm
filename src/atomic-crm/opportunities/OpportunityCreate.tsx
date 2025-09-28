import {
  CreateBase,
  Form,
  useGetIdentity,
  useDataProvider,
  useNotify,
  useRedirect,
  useGetList,
} from "ra-core";
import { Card, CardContent } from "@/components/ui/card";
import { CancelButton } from "@/components/admin/cancel-button";
import { SaveButton } from "@/components/admin/form";
import { FormToolbar } from "../layout/FormToolbar";
import { useQueryClient } from "@tanstack/react-query";
import type { GetListResult } from "ra-core";
import { OpportunityInputs } from "./OpportunityInputs";
import type { Opportunity } from "../types";

const OpportunityCreate = () => {
  const { identity } = useGetIdentity();
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const redirect = useRedirect();
  const queryClient = useQueryClient();

  // Get all opportunities for index management
  const { data: allOpportunities } = useGetList<Opportunity>("opportunities", {
    pagination: { page: 1, perPage: 1000 },
    filter: { "deleted_at@is": null },
  });

  const onSuccess = async (opportunity: Opportunity) => {
    // Manage kanban board indexes
    if (allOpportunities) {
      // Get opportunities in the same stage
      const opportunities = allOpportunities.filter(
        (o: Opportunity) =>
          o.stage === opportunity.stage && o.id !== opportunity.id,
      );

      // Update indexes to make room for the new opportunity at index 0
      await Promise.all(
        opportunities.map(async (oldOpportunity) =>
          dataProvider.update("opportunities", {
            id: oldOpportunity.id,
            data: { index: oldOpportunity.index + 1 },
            previousData: oldOpportunity,
          }),
        ),
      );

      // Update cache to reflect index changes
      const opportunitiesById = opportunities.reduce(
        (acc, o) => ({
          ...acc,
          [o.id]: { ...o, index: o.index + 1 },
        }),
        {} as { [key: string]: Opportunity },
      );

      const now = Date.now();
      queryClient.setQueriesData<GetListResult | undefined>(
        { queryKey: ["opportunities", "getList"] },
        (res) => {
          if (!res) return res;
          return {
            ...res,
            data: res.data.map(
              (o: Opportunity) => opportunitiesById[o.id] || o,
            ),
          };
        },
        { updatedAt: now },
      );
    }

    notify("Opportunity created successfully");
    redirect(`/opportunities/${opportunity.id}/show`);
  };

  return (
    <CreateBase mutationOptions={{ onSuccess }} redirect={false}>
      <div className="mt-2 flex lg:mr-72">
        <div className="flex-1">
          <Form
            defaultValues={{
              sales_id: identity?.id,
              contact_ids: [],
              index: 0,
              priority: "medium",
              probability: 50,
              stage: "new_lead",
            }}
          >
            <Card>
              <CardContent>
                <OpportunityInputs />
                <FormToolbar>
                  <div className="flex flex-row gap-2 justify-end">
                    <CancelButton />
                    <SaveButton label="Create Opportunity" />
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

export { OpportunityCreate };
export default OpportunityCreate;
