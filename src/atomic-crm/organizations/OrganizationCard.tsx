import { DollarSign, Star, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useCreatePath, useRecordContext } from "ra-core";
import { ReferenceField } from "@/components/admin/reference-field";
import { TextField } from "@/components/admin/text-field";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import type { Company } from "../types";
import { OrganizationAvatar } from "./OrganizationAvatar";

export const OrganizationCard = (props: { record?: Company }) => {
  const createPath = useCreatePath();
  const record = useRecordContext<Company>(props);
  if (!record) return null;

  const organizationTypeLabels: Record<string, string> = {
    customer: "Customer",
    prospect: "Prospect",
    partner: "Partner",
    principal: "Principal",
    distributor: "Distributor",
    unknown: "Unknown",
  };

  const priorityColors: Record<string, string> = {
    A: "destructive",
    B: "default",
    C: "secondary",
    D: "outline",
  };

  return (
    <Link
      to={createPath({
        resource: "organizations",
        id: record.id,
        type: "show",
      })}
      className="no-underline group"
    >
      <Card className="h-[200px] flex flex-col justify-between p-4
                       bg-card border border-border rounded-xl
                       shadow-sm hover:shadow-md
                       transition-shadow duration-200
                       motion-safe:hover:-translate-y-0.5 motion-safe:hover:scale-[1.01]
                       hover:border-primary/20">
        <div className="flex flex-col items-center gap-1">
          <OrganizationAvatar />
          <div className="text-center mt-1">
            <h6 className="text-sm font-medium group-hover:text-foreground transition-colors">{record.name}</h6>
            {record.segment_id && (
              <ReferenceField source="segment_id" reference="segments" link={false}>
                <TextField source="name" className="text-xs text-[color:var(--text-subtle)]" />
              </ReferenceField>
            )}
            <div className="flex gap-1 mt-1 justify-center flex-wrap">
              {record.organization_type &&
                record.organization_type !== "unknown" && (
                  <Badge variant="secondary" className="text-xs px-1 py-0">
                    <Building2 className="w-3 h-3 mr-0.5" />
                    {organizationTypeLabels[record.organization_type] ||
                      record.organization_type}
                  </Badge>
                )}
              {record.priority && (
                <Badge
                  variant={priorityColors[record.priority] as any}
                  className="text-xs px-1 py-0"
                >
                  <Star className="w-3 h-3 mr-0.5" />
                  {record.priority}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-row w-full justify-between gap-2">
          {record.nb_contacts ? (
            <div className="flex items-center gap-0.5">
              <Building2 className="w-4 h-4 text-[color:var(--text-subtle)]" />
              <span className="text-sm font-medium">
                {record.nb_contacts}
              </span>
              <span className="text-xs text-[color:var(--text-subtle)]">
                {record.nb_contacts > 1 ? "contacts" : "contact"}
              </span>
            </div>
          ) : null}
          {record.nb_opportunities ? (
            <div className="flex items-center gap-0.5">
              <DollarSign className="w-4 h-4 text-[color:var(--text-subtle)]" />
              <span className="text-sm font-medium">
                {record.nb_opportunities}
              </span>
              <span className="text-xs text-[color:var(--text-subtle)]">
                {record.nb_opportunities > 1 ? "opportunities" : "opportunity"}
              </span>
            </div>
          ) : null}
        </div>
      </Card>
    </Link>
  );
};
