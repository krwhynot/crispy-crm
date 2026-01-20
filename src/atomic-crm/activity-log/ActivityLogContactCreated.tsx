import { Link } from "react-router-dom";

import { ReferenceField } from "@/components/ra-wrappers/reference-field";
import { Avatar } from "../contacts/Avatar";
import { RelativeDate } from "@/components/ui";
import { SaleName } from "../sales/SaleName";
import type { ActivityContactCreated } from "../types";
import { formatName } from "../utils/formatName";
import { useActivityLogContext } from "./ActivityLogContext";

interface ActivityLogContactCreatedProps {
  activity: ActivityContactCreated;
}

export function ActivityLogContactCreated({ activity }: ActivityLogContactCreatedProps) {
  const context = useActivityLogContext();
  const { contact } = activity;
  return (
    <div className="p-0">
      <div className="flex flex-row gap-2 items-center w-full">
        <Avatar width={20} height={20} record={contact} />
        <span className="text-muted-foreground text-sm flex-grow">
          <ReferenceField source="sales_id" reference="sales" record={activity}>
            <SaleName />
          </ReferenceField>{" "}
          added{" "}
          <Link to={`/contacts/${contact.id}/show`}>
            {formatName(contact.first_name, contact.last_name)}
          </Link>{" "}
          {context !== "company" && <>to organization {activity.customer_organization_id}</>}
        </span>
        {context === "company" && (
          <span className="text-muted-foreground text-sm">
            <RelativeDate date={activity.date} />
          </span>
        )}
      </div>
    </div>
  );
}
