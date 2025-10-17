/**
 * This component displays the opportunities pipeline for the current user.
 * It's currently not used in the application but can be added to the dashboard.
 */

import { Card } from "@/components/ui/card";
import { DollarSign } from "lucide-react";
import { useGetIdentity, useGetList } from "ra-core";

import { ReferenceField } from "@/components/admin/reference-field";
import { Link } from "react-router-dom";
import { SimpleList } from "../simple-list/SimpleList";
import { OrganizationAvatar } from "../organizations/OrganizationAvatar";
import { findOpportunityLabel } from "../opportunities/opportunity";
import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Opportunity } from "../types";

export const OpportunitiesPipeline = () => {
  const { identity } = useGetIdentity();
  const { opportunityStages, opportunityPipelineStatuses } =
    useConfigurationContext();
  const { data, total, isPending } = useGetList<Opportunity>(
    "opportunities",
    {
      pagination: { page: 1, perPage: 10 },
      sort: { field: "last_seen", order: "DESC" },
      filter: { "stage@neq": "lost", sales_id: identity?.id },
    },
    { enabled: Number.isInteger(identity?.id) },
  );

  const getOrderedOpportunities = (
    data?: Opportunity[],
  ): Opportunity[] | undefined => {
    if (!data) {
      return;
    }
    const opportunities: Opportunity[] = [];
    opportunityStages
      .filter((stage) => !opportunityPipelineStatuses.includes(stage.value))
      .forEach((stage) =>
        data
          .filter((opportunity) => opportunity.stage === stage.value)
          .forEach((opportunity) => opportunities.push(opportunity)),
      );
    return opportunities;
  };

  return (
    <>
      <div className="flex items-center mb-4">
        <div className="ml-8 mr-8 flex">
          <DollarSign className="text-[color:var(--text-subtle)] w-6 h-6" />
        </div>
        <Link
          className="text-xl font-semibold text-[color:var(--text-title)] hover:underline"
          to="/opportunities"
        >
          Opportunities Pipeline
        </Link>
      </div>
      <Card>
        <SimpleList<Opportunity>
          resource="opportunities"
          linkType="show"
          data={getOrderedOpportunities(data)}
          total={total}
          isPending={isPending}
          primaryText={(opportunity) => opportunity.name}
          secondaryText={(opportunity) =>
            `${opportunity.amount.toLocaleString("en-US", {
              notation: "compact",
              style: "currency",
              currency: "USD",
              currencyDisplay: "narrowSymbol",
              minimumSignificantDigits: 3,
            })} , ${findOpportunityLabel(opportunityStages, opportunity.stage)}`
          }
          leftAvatar={(opportunity) => (
            <ReferenceField
              source="customer_organization_id"
              record={opportunity}
              reference="organizations"
              resource="opportunities"
              link={false}
            >
              <OrganizationAvatar width={20} height={20} />
            </ReferenceField>
          )}
        />
      </Card>
    </>
  );
};
