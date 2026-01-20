import { ReferenceField } from "@/components/ra-wrappers/reference-field";

import type { RaRecord } from "ra-core";
import { OrganizationAvatar } from "../organizations/OrganizationAvatar";
import { RelativeDate } from "@/components/ui";
import { SaleName } from "../sales/SaleName";
import type { ActivityOpportunityNoteCreated } from "../types";
import { useActivityLogContext } from "./ActivityLogContext";
import { ActivityLogNote } from "./ActivityLogNote";

interface ActivityLogOpportunityNoteCreatedProps {
  activity: RaRecord & ActivityOpportunityNoteCreated;
}

export function ActivityLogOpportunityNoteCreated({
  activity,
}: ActivityLogOpportunityNoteCreatedProps) {
  const context = useActivityLogContext();
  const { opportunityNote } = activity;
  return (
    <ActivityLogNote
      header={
        <div className="flex flex-row items-center gap-2 flex-grow">
          <ReferenceField
            source="opportunity_id"
            reference="opportunities"
            record={opportunityNote}
            link={false}
          >
            <ReferenceField
              source="customer_organization_id"
              reference="organizations"
              link={false}
            >
              <OrganizationAvatar width={20} height={20} />
            </ReferenceField>
          </ReferenceField>

          <span className="text-sm text-muted-foreground flex-grow">
            <ReferenceField source="sales_id" reference="sales" record={activity} link={false}>
              <SaleName />
            </ReferenceField>{" "}
            added a note about opportunity{" "}
            <ReferenceField
              source="opportunity_id"
              reference="opportunities"
              record={opportunityNote}
              link="show"
            />
            {context !== "company" && (
              <>
                {" at "}
                <ReferenceField
                  source="opportunity_id"
                  reference="opportunities"
                  record={opportunityNote}
                  link={false}
                >
                  <ReferenceField
                    source="customer_organization_id"
                    reference="organizations"
                    link="show"
                  />
                </ReferenceField>{" "}
              </>
            )}
          </span>

          {context === "company" && (
            <span className="text-muted-foreground text-sm">
              <RelativeDate date={activity.date} />
            </span>
          )}
        </div>
      }
      text={opportunityNote.text}
    />
  );
}
