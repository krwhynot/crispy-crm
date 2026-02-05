import { useState, useMemo } from "react";
import {
  useShowContext,
  useGetList,
  useGetMany,
  useRefresh,
  useCreate,
  useNotify,
  useDataProvider,
} from "ra-core";
import type { Identifier } from "ra-core";
import { useQueryClient } from "@tanstack/react-query";
import { activityKeys } from "../queryKeys";
import { logger } from "@/lib/logger";
import {
  FunctionField,
  ReferenceField,
  TextField,
  NumberField,
  ListContextProvider,
} from "react-admin";
import { PremiumDatagrid } from "@/components/ra-wrappers/PremiumDatagrid";
import { Link } from "react-router-dom";
import { AdminButton } from "@/components/admin/AdminButton";
import { Trash2 } from "lucide-react";
import { StageBadgeWithHealth } from "./StageBadgeWithHealth";
import { LinkOpportunityModal } from "./LinkOpportunityModal";
import { UnlinkConfirmDialog } from "./UnlinkConfirmDialog";
import { SuggestedOpportunityCard } from "./SuggestedOpportunityCard";
import { isClosedStage } from "@/atomic-crm/opportunities/constants";
import type { Contact, Opportunity, OpportunityContact } from "../types";
import { DEFAULT_PAGE_SIZE, DEFAULT_STALE_TIME_MS } from "@/atomic-crm/constants/appConstants";

// Extended type for opportunities with junction table metadata
interface OpportunityWithJunction extends Opportunity {
  junctionId: Identifier;
}

export function OpportunitiesTab() {
  const { record: contact, isPending } = useShowContext<Contact>();
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [unlinkingOpportunity, setUnlinkingOpportunity] = useState<OpportunityWithJunction | null>(
    null
  );
  const refresh = useRefresh();
  const [create] = useCreate();
  const notify = useNotify();
  const dataProvider = useDataProvider();
  const queryClient = useQueryClient();

  // Step 1: Fetch junction records
  const { data: junctionRecords, isLoading: junctionLoading } = useGetList(
    "opportunity_contacts",
    {
      filter: { contact_id: contact?.id },
      pagination: { page: 1, perPage: DEFAULT_PAGE_SIZE },
      sort: { field: "created_at", order: "DESC" },
    },
    {
      enabled: !!contact?.id,
      staleTime: DEFAULT_STALE_TIME_MS, // 5 minutes - prevent refetch if data is fresh
      refetchOnWindowFocus: true, // Refresh on tab return only if stale
    }
  );

  // Step 2: Extract opportunity IDs
  const opportunityIds = junctionRecords?.map((jr: OpportunityContact) => jr.opportunity_id) || [];

  // Step 3: Fetch opportunity details using getMany (batch fetch by IDs)
  const { data: opportunities, isLoading: oppsLoading } = useGetMany(
    "opportunities",
    { ids: opportunityIds },
    { enabled: opportunityIds.length > 0 }
  );

  // Step 4: Fetch suggested opportunities from contact's organization
  const { data: orgOpportunities } = useGetList(
    "opportunities",
    {
      filter: {
        customer_organization_id: contact?.organization_id,
      },
      pagination: { page: 1, perPage: DEFAULT_PAGE_SIZE },
      sort: { field: "updated_at", order: "DESC" },
    },
    { enabled: !!contact?.organization_id && (!junctionRecords || junctionRecords.length === 0) }
  );

  const suggestedOpps = useMemo(() => {
    if (!orgOpportunities) return [];
    return orgOpportunities.filter((opp: Opportunity) => !isClosedStage(opp.stage)).slice(0, 5);
  }, [orgOpportunities]);

  const isLoading = isPending || junctionLoading || oppsLoading;

  const contactName = `${contact?.first_name} ${contact?.last_name}`;

  const handleLinkSuccess = () => {
    refresh();
    setShowLinkModal(false);
  };

  const handleUnlinkSuccess = () => {
    refresh();
    setUnlinkingOpportunity(null);
  };

  const handleQuickLink = async (opportunity: Opportunity) => {
    try {
      await create(
        "opportunity_contacts",
        {
          data: {
            opportunity_id: opportunity.id,
            contact_id: contact.id,
          },
        },
        {
          onSuccess: async () => {
            notify("Opportunity linked", { type: "success" });
            refresh();

            // Log activity after successful link
            try {
              await dataProvider.create("activities", {
                data: {
                  activity_type: "activity",
                  type: "note",
                  subject: `Contact linked: ${contactName}`,
                  activity_date: new Date().toISOString(),
                  opportunity_id: opportunity.id,
                  organization_id: opportunity.customer_organization_id,
                },
              });
              queryClient.invalidateQueries({ queryKey: activityKeys.all });
            } catch (activityError) {
              logger.error("Failed to log contact link activity", activityError, {
                feature: "OpportunitiesTab",
                opportunityId: opportunity.id,
              });
              notify("Contact linked, but failed to log activity", { type: "warning" });
            }
          },
          onError: (error: Error) => {
            notify(error?.message || "Failed to link opportunity", { type: "error" });
          },
        }
      );
    } catch {
      notify("Failed to link opportunity", { type: "error" });
    }
  };

  if (isPending || !contact) return null;

  if (isLoading) {
    return <div>Loading opportunities...</div>;
  }

  if (!junctionRecords || junctionRecords.length === 0) {
    if (suggestedOpps.length > 0) {
      return (
        <div className="text-center py-8 space-y-4">
          <h3 className="text-lg font-semibold">Suggested Opportunities</h3>
          <p className="text-sm text-muted-foreground">
            We found {suggestedOpps.length} active opportunities at {contact.organization?.name}
          </p>

          <div className="space-y-2 max-w-2xl mx-auto">
            {suggestedOpps.map((opp: Opportunity) => (
              <SuggestedOpportunityCard
                key={opp.id}
                opportunity={opp}
                onLink={() => handleQuickLink(opp)}
              />
            ))}
          </div>

          <AdminButton variant="outline" onClick={() => setShowLinkModal(true)}>
            Or search all opportunities
          </AdminButton>

          <LinkOpportunityModal
            open={showLinkModal}
            contactName={contactName}
            contactId={contact.id}
            linkedOpportunityIds={[]}
            onClose={() => setShowLinkModal(false)}
            onSuccess={handleLinkSuccess}
          />
        </div>
      );
    }

    return (
      <div className="text-center py-12 space-y-4">
        <div className="text-muted-foreground">
          <p className="text-lg">No opportunities linked yet</p>
          <p className="text-sm mt-2 max-w-md mx-auto">
            Link this contact to deals they're involved in to track their influence on your
            pipeline.
          </p>
        </div>

        <AdminButton onClick={() => setShowLinkModal(true)}>Link Opportunity</AdminButton>

        <LinkOpportunityModal
          open={showLinkModal}
          contactName={contactName}
          contactId={contact.id}
          linkedOpportunityIds={[]}
          onClose={() => setShowLinkModal(false)}
          onSuccess={handleLinkSuccess}
        />
      </div>
    );
  }

  // Merge junction data with opportunities
  const linkedOpportunities = junctionRecords.flatMap((junction: OpportunityContact) => {
    const opp = opportunities?.find((o: Opportunity) => o.id === junction.opportunity_id);
    return opp ? [{ ...opp, junctionId: junction.id } as OpportunityWithJunction] : [];
  });

  const linkedOpportunityIds = linkedOpportunities.map((opp: OpportunityWithJunction) => opp.id);

  // Convert array to object keyed by ID for React Admin Datagrid
  const linkedOpportunitiesData = linkedOpportunities.reduce(
    (acc: Record<Identifier, OpportunityWithJunction>, opp: OpportunityWithJunction) => {
      acc[opp.id] = opp;
      return acc;
    },
    {} as Record<Identifier, OpportunityWithJunction>
  );

  const listContext = {
    data: linkedOpportunitiesData,
    ids: linkedOpportunityIds,
    total: linkedOpportunities.length,
    isLoading: false,
    isFetching: false,
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <AdminButton onClick={() => setShowLinkModal(true)}>Link Opportunity</AdminButton>
      </div>

      <ListContextProvider value={listContext}>
        <PremiumDatagrid bulkActionButtons={false} rowClick={false} className="border rounded-lg">
          <FunctionField
            label="Opportunity"
            render={(record: OpportunityWithJunction) => (
              <Link
                to={`/opportunities/${record.id}`}
                className="font-medium text-primary hover:underline"
              >
                {record.name}
              </Link>
            )}
          />

          <ReferenceField
            source="customer_organization_id"
            reference="organizations"
            label="Customer"
          >
            <TextField source="name" />
          </ReferenceField>

          <FunctionField
            label="Stage"
            render={(record: OpportunityWithJunction) => (
              <StageBadgeWithHealth stage={record.stage} health={record.health_status} />
            )}
          />

          <NumberField source="amount" options={{ style: "currency", currency: "USD" }} />

          <FunctionField
            label=""
            render={(record: OpportunityWithJunction) => (
              <button
                aria-label={`Unlink ${record.name} from ${contactName}`}
                className="h-11 w-11 inline-flex items-center justify-center rounded-md hover:bg-muted"
                onClick={() => setUnlinkingOpportunity(record)}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          />
        </PremiumDatagrid>
      </ListContextProvider>

      <LinkOpportunityModal
        open={showLinkModal}
        contactName={contactName}
        contactId={contact.id}
        linkedOpportunityIds={linkedOpportunityIds}
        onClose={() => setShowLinkModal(false)}
        onSuccess={handleLinkSuccess}
      />

      <UnlinkConfirmDialog
        opportunity={unlinkingOpportunity}
        contactName={contactName}
        contactId={contact.id}
        onClose={() => setUnlinkingOpportunity(null)}
        onSuccess={handleUnlinkSuccess}
      />
    </div>
  );
}
