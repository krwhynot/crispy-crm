import { Link } from "react-router-dom";

import { ReferenceField } from "@/components/admin/reference-field";
import { OrganizationAvatar } from "../organizations/OrganizationAvatar";
import { RelativeDate } from "../misc/RelativeDate";
import { SaleName } from "../sales/SaleName";
import type { ActivityOrganizationCreated } from "../types";
import { useActivityLogContext } from "./ActivityLogContext";

type ActivityLogOrganizationCreatedProps = {
  activity: ActivityOrganizationCreated;
};

export function ActivityLogOrganizationCreated({
  activity,
}: ActivityLogOrganizationCreatedProps) {
  const context = useActivityLogContext();
  const { organization } = activity;
  return (
    <div className="p-0">
      <div className="flex flex-row space-x-1 items-center w-full">
        <OrganizationAvatar width={20} height={20} record={organization} />

        <div className="text-sm text-muted-foreground flex-grow">
          <span className="text-muted-foreground text-sm inline-flex">
            <ReferenceField
              source="sales_id"
              reference="sales"
              record={activity}
            >
              <SaleName />
            </ReferenceField>
          </span>
          &nbsp;added organization &nbsp;
          <Link to={`/organizations/${organization.id}/show`}>
            {organization.name}
          </Link>
          {context === "all" && (
            <>
              <RelativeDate date={activity.date} />
            </>
          )}
        </div>
        {context === "organization" && (
          <span className="text-muted-foreground text-sm">
            <RelativeDate date={activity.date} />
          </span>
        )}
      </div>
    </div>
  );
}
