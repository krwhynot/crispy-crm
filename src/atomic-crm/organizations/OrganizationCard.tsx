import { DollarSign, Star, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useCreatePath, useListContext, useRecordContext } from "ra-core";
import { ReferenceManyField } from "@/components/admin/reference-many-field";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { Avatar as ContactAvatar } from "../contacts/Avatar";
import type { Company } from "../types";
import { OrganizationAvatar } from "./OrganizationAvatar";

export const OrganizationCard = (props: { record?: Company }) => {
  const createPath = useCreatePath();
  const record = useRecordContext<Company>(props);
  if (!record) return null;

  const organizationTypeLabels: Record<string, string> = {
    customer: "Customer",
    prospect: "Prospect",
    vendor: "Vendor",
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
      className="no-underline"
    >
      <Card className="h-[200px] flex flex-col justify-between p-4 hover:bg-muted">
        <div className="flex flex-col items-center gap-1">
          <OrganizationAvatar />
          <div className="text-center mt-1">
            <h6 className="text-sm font-medium">{record.name}</h6>
            <p className="text-xs text-muted-foreground">{record.industry}</p>
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
          <div className="flex items-center">
            {record.nb_contacts ? (
              <ReferenceManyField reference="contacts" target="organization_id">
                <AvatarGroupIterator />
              </ReferenceManyField>
            ) : null}
          </div>
          {record.nb_opportunities ? (
            <div className="flex items-center ml-2 gap-0.5">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {record.nb_opportunities}
              </span>
              <span className="text-xs text-muted-foreground">
                {record.nb_opportunities
                  ? record.nb_opportunities > 1
                    ? "opportunities"
                    : "opportunity"
                  : "opportunity"}
              </span>
            </div>
          ) : null}
        </div>
      </Card>
    </Link>
  );
};

const AvatarGroupIterator = () => {
  const { data, total, error, isPending } = useListContext();
  if (isPending || error) return null;

  const MAX_AVATARS = 3;
  return (
    <div className="*:data-[slot=avatar]:ring-background flex -space-x-0.5 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:grayscale">
      {data.slice(0, MAX_AVATARS).map((record: any) => (
        <ContactAvatar
          key={record.id}
          record={record}
          width={25}
          height={25}
          title={`${record.first_name} ${record.last_name}`}
        />
      ))}
      {total > MAX_AVATARS && (
        <span
          className="relative flex size-8 shrink-0 overflow-hidden rounded-full w-[25px] h-[25px]"
          data-slot="avatar"
        >
          <span className="bg-muted flex size-full items-center justify-center rounded-full text-[10px]">
            +{total - MAX_AVATARS}
          </span>
        </span>
      )}
    </div>
  );
};
