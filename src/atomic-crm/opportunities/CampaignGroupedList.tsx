import { useMemo } from "react";
import { useListContext } from "ra-core";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ExternalLink, FolderOpen, Building2, Factory } from "lucide-react";
import type { Opportunity } from "../types";
import { STAGE } from "@/atomic-crm/opportunities/constants/stageConstants";

/**
 * Campaign Grouped List View
 *
 * Displays opportunities in a hierarchical accordion structure:
 * Campaign → Principal Organization → Customer Organization → Opportunities
 *
 * Example:
 * "Winter Fancy Food Show 2025" (3 opportunities across 2 principals) →
 *   "Ocean Hugger" (2 opportunities across 2 customers) →
 *     "Nobu Miami" (1) →
 *       - Ocean Hugger Seafood Alternative opportunity
 *     "The French Laundry" (1) →
 *       - Ocean Hugger Premium Line opportunity
 *   "Kaufholds" (1 opportunity across 1 customer) →
 *     "The French Laundry" (1) →
 *       - Cheese Curd opportunity
 */

/**
 * Type for 3-level nested grouping structure
 * Campaign → Principal → Customer → Opportunities
 */
type CampaignGroupedData = Record<
  string, // Campaign name
  Record<
    string, // Principal organization name
    Record<
      string, // Customer organization name
      Opportunity[]
    >
  >
>;
interface CampaignGroupedListProps {
  openSlideOver: (id: number, mode?: "view" | "edit") => void;
}

export const CampaignGroupedList = ({ openSlideOver }: CampaignGroupedListProps) => {
  const { data: opportunities, isPending } = useListContext<Opportunity>();

  // Group opportunities by campaign → principal → customer organization
  const groupedData = useMemo((): CampaignGroupedData => {
    if (!opportunities) return {};

    const campaignGroups: CampaignGroupedData = {};

    opportunities.forEach((opp) => {
      // Skip opportunities without campaign
      if (!opp.campaign) return;

      // Initialize campaign group if needed
      if (!campaignGroups[opp.campaign]) {
        campaignGroups[opp.campaign] = {};
      }

      // Group by principal organization within campaign
      const principalKey = opp.principal_organization_name || "Unknown Principal";
      if (!campaignGroups[opp.campaign][principalKey]) {
        campaignGroups[opp.campaign][principalKey] = {};
      }

      // Group by customer organization within principal
      const customerKey = opp.customer_organization_name || "Unknown Customer";
      if (!campaignGroups[opp.campaign][principalKey][customerKey]) {
        campaignGroups[opp.campaign][principalKey][customerKey] = [];
      }

      campaignGroups[opp.campaign][principalKey][customerKey].push(opp);
    });

    return campaignGroups;
  }, [opportunities]);

  const campaignNames = Object.keys(groupedData).sort();

  if (isPending) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading campaigns...</div>
      </div>
    );
  }

  if (campaignNames.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <FolderOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No campaigns found</h3>
          <p className="text-sm text-muted-foreground">
            Add a campaign name to opportunities to see them grouped here.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <FolderOpen className="w-5 h-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Campaigns ({campaignNames.length})</h2>
      </div>

      {/* Level 1: Campaigns */}
      <Accordion type="multiple" className="space-y-2">
        {campaignNames.map((campaignName) => {
          const principalGroups = groupedData[campaignName];
          const principalNames = Object.keys(principalGroups).sort();

          // Calculate total opportunities across all principals/customers in this campaign
          const totalOpportunities = principalNames.reduce((sum, principal) => {
            const customerGroups = principalGroups[principal];
            return (
              sum +
              Object.values(customerGroups).reduce(
                (customerSum, opps) => customerSum + opps.length,
                0
              )
            );
          }, 0);

          return (
            <AccordionItem
              key={campaignName}
              value={campaignName}
              className="border border-border rounded-lg bg-card"
            >
              <AccordionTrigger className="px-4 hover:no-underline hover:bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-start">
                    <span className="font-semibold text-base">{campaignName}</span>
                    <span className="text-xs text-muted-foreground">
                      {totalOpportunities}{" "}
                      {totalOpportunities === 1 ? "opportunity" : "opportunities"} across{" "}
                      {principalNames.length}{" "}
                      {principalNames.length === 1 ? "principal" : "principals"}
                    </span>
                  </div>
                </div>
              </AccordionTrigger>

              <AccordionContent className="px-4 pb-4">
                {/* Level 2: Principals */}
                <Accordion type="multiple" className="space-y-2 mt-2">
                  {principalNames.map((principalName) => {
                    const customerGroups = principalGroups[principalName];
                    const customerNames = Object.keys(customerGroups).sort();

                    // Calculate opportunities for this principal across all customers
                    const principalTotalOpps = customerNames.reduce(
                      (sum, customer) => sum + customerGroups[customer].length,
                      0
                    );

                    return (
                      <AccordionItem
                        key={principalName}
                        value={principalName}
                        className="border border-border rounded-md bg-muted/50"
                      >
                        <AccordionTrigger className="px-3 py-2 hover:no-underline hover:bg-muted/70">
                          <div className="flex items-center gap-2">
                            <Factory className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium text-sm">{principalName}</span>
                            <span className="text-xs text-muted-foreground ml-auto mr-2">
                              {principalTotalOpps}{" "}
                              {principalTotalOpps === 1 ? "opportunity" : "opportunities"} across{" "}
                              {customerNames.length}{" "}
                              {customerNames.length === 1 ? "customer" : "customers"}
                            </span>
                          </div>
                        </AccordionTrigger>

                        <AccordionContent className="px-3 pb-2">
                          {/* Level 3: Customers */}
                          <Accordion type="multiple" className="space-y-1 mt-1">
                            {customerNames.map((customerName) => {
                              const customerOpportunities = customerGroups[customerName];

                              return (
                                <AccordionItem
                                  key={customerName}
                                  value={customerName}
                                  className="border border-border rounded-md bg-muted/30"
                                >
                                  <AccordionTrigger className="px-3 py-2 hover:no-underline hover:bg-muted/50">
                                    <div className="flex items-center gap-2">
                                      <Building2 className="w-4 h-4 text-muted-foreground" />
                                      <span className="font-medium text-sm">{customerName}</span>
                                      <Badge variant="secondary" className="text-xs">
                                        {customerOpportunities.length}
                                      </Badge>
                                    </div>
                                  </AccordionTrigger>

                                  <AccordionContent className="px-3 pb-2">
                                    {/* Level 4: Opportunity Items */}
                                    <div className="space-y-1 mt-1">
                                      {customerOpportunities.map((opp) => (
                                        <div
                                          key={opp.id}
                                          className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
                                          role="button"
                                          tabIndex={0}
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            openSlideOver(opp.id as number, "view");
                                          }}
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === " ") {
                                              e.preventDefault();
                                              openSlideOver(opp.id as number, "view");
                                            }
                                          }}
                                        >
                                          <div className="flex-1 text-sm text-primary hover:underline flex items-center gap-2">
                                            {opp.name}
                                            <ExternalLink className="w-3 h-3" />
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <Badge
                                              variant={
                                                opp.stage === "closed_won"
                                                  ? "default"
                                                  : opp.stage === "closed_lost"
                                                    ? "destructive"
                                                    : "secondary"
                                              }
                                              className="text-xs"
                                            >
                                              {opp.stage?.replace(/_/g, " ")}
                                            </Badge>
                                            {opp.priority && (
                                              <Badge
                                                variant={
                                                  opp.priority === "critical"
                                                    ? "destructive"
                                                    : opp.priority === "high"
                                                      ? "default"
                                                      : "outline"
                                                }
                                                className={
                                                  opp.priority === "high"
                                                    ? "border-transparent bg-warning text-warning-foreground"
                                                    : "text-xs"
                                                }
                                              >
                                                {opp.priority}
                                              </Badge>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              );
                            })}
                          </Accordion>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
};
