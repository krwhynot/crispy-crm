/**
 * Organization Info Card Component
 *
 * Displays the 3 key organizations for an opportunity:
 * - Customer Organization (who is buying)
 * - Principal Organization (brand/manufacturer) ⭐ MOST IMPORTANT
 * - Distributor Organization (optional middleman)
 *
 * Features prominent display of principal with star icon and tooltip.
 */

import * as React from "react";
import { ReferenceField } from "@/components/admin/reference-field";
import { TextField } from "@/components/admin/text-field";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Building2, Star, Users, TruckIcon } from "lucide-react";
import type { Opportunity } from "../types";

interface OrganizationInfoCardProps {
  opportunity: Opportunity;
}

export const OrganizationInfoCard: React.FC<OrganizationInfoCardProps> = ({ opportunity }) => {
  return (
    <Card className="bg-muted/30 border border-border">
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Building2 className="w-4 h-4" />
          Organizations
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Customer Organization */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide">
              <Users className="w-3.5 h-3.5" />
              <span>Customer</span>
            </div>
            <ReferenceField source="customer_organization_id" reference="organizations" link="show">
              <TextField
                source="name"
                className="text-sm font-medium text-foreground hover:underline cursor-pointer"
              />
            </ReferenceField>
            <span className="text-xs text-muted-foreground">Who is buying</span>
          </div>

          {/* Principal Organization ⭐ MOST IMPORTANT */}
          {opportunity.principal_organization_id && (
            <div className="flex flex-col gap-2 bg-[var(--brand-50)] dark:bg-[var(--brand-950)] p-3 rounded-lg border-2 border-[var(--brand-200)] dark:border-[var(--brand-800)]">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wide">
                      <Star className="w-3.5 h-3.5 text-[var(--brand-600)] fill-[var(--brand-600)]" />
                      <span className="font-bold text-[var(--brand-700)]">Principal</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-semibold">⭐ MOST IMPORTANT</p>
                    <p className="text-xs mt-1">
                      The brand/manufacturer this opportunity represents
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <ReferenceField
                source="principal_organization_id"
                reference="organizations"
                link="show"
              >
                <TextField
                  source="name"
                  className="text-sm font-bold text-[var(--brand-800)] dark:text-[var(--brand-200)] hover:underline cursor-pointer"
                />
              </ReferenceField>
              <span className="text-xs text-[var(--brand-600)] dark:text-[var(--brand-400)] font-medium">
                Brand/Manufacturer
              </span>
            </div>
          )}

          {/* Distributor Organization (optional) */}
          {opportunity.distributor_organization_id && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide">
                <TruckIcon className="w-3.5 h-3.5" />
                <span>Distributor</span>
              </div>
              <ReferenceField
                source="distributor_organization_id"
                reference="organizations"
                link="show"
              >
                <TextField
                  source="name"
                  className="text-sm font-medium text-foreground hover:underline cursor-pointer"
                />
              </ReferenceField>
              <span className="text-xs text-muted-foreground">Distribution partner</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
