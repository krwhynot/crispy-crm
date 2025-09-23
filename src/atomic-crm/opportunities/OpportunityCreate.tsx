import { Create } from "@/components/admin";
import { SaveButton } from "@/components/admin";
import { FormToolbar } from "@/components/admin";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useQueryClient } from "@tanstack/react-query";
import type { GetListResult } from "ra-core";
import {
  Form,
  useDataProvider,
  useGetIdentity,
  useListContext,
  useRedirect,
} from "ra-core";
import type { Opportunity } from "../types";
import { OpportunityInputs } from "./OpportunityInputs";

export const OpportunityCreate = ({ open }: { open: boolean }) => {
  const redirect = useRedirect();
  const dataProvider = useDataProvider();
  const { data: allOpportunities } = useListContext<Opportunity>();

  const handleClose = () => {
    redirect("/opportunities");
  };

  const queryClient = useQueryClient();

  const onSuccess = async (opportunity: Opportunity) => {
    if (!allOpportunities) {
      redirect("/opportunities");
      return;
    }
    // increase the index of all opportunities in the same stage as the new opportunity
    // first, get the list of opportunities in the same stage
    const opportunities = allOpportunities.filter(
      (o: Opportunity) => o.stage === opportunity.stage && o.id !== opportunity.id,
    );
    // update the actual opportunities in the database
    await Promise.all(
      opportunities.map(async (oldOpportunity) =>
        dataProvider.update("opportunities", {
          id: oldOpportunity.id,
          data: { index: oldOpportunity.index + 1 },
          previousData: oldOpportunity,
        }),
      ),
    );
    // refresh the list of opportunities in the cache as we used dataProvider.update(),
    // which does not update the cache
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
          data: res.data.map((o: Opportunity) => opportunitiesById[o.id] || o),
        };
      },
      { updatedAt: now },
    );
    redirect("/opportunities");
  };

  const { identity } = useGetIdentity();

  return (
    <Dialog open={open} onOpenChange={() => handleClose()}>
      <DialogContent className="lg:max-w-4xl overflow-y-auto max-h-9/10 top-1/20 translate-y-0">
        <Create resource="opportunities" mutationOptions={{ onSuccess }}>
          <Form
            defaultValues={{
              sales_id: identity?.id,
              contact_ids: [],
              index: 0,
              priority: 'medium',
              probability: 50,
              stage: 'lead'
            }}
          >
            <OpportunityInputs />
            <FormToolbar>
              <SaveButton />
            </FormToolbar>
          </Form>
        </Create>
      </DialogContent>
    </Dialog>
  );
};