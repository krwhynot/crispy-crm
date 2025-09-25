import { Fragment, useState } from "react";
import { Separator } from "@/components/ui/separator";

import {
  COMPANY_CREATED,
  CONTACT_CREATED,
  CONTACT_NOTE_CREATED,
  OPPORTUNITY_CREATED,
  OPPORTUNITY_NOTE_CREATED,
} from "../consts";
import type { Activity } from "../types";
import { ActivityLogCompanyCreated } from "./ActivityLogCompanyCreated";
import { ActivityLogContactCreated } from "./ActivityLogContactCreated";
import { ActivityLogContactNoteCreated } from "./ActivityLogContactNoteCreated";
import { ActivityLogOpportunityCreated } from "./ActivityLogOpportunityCreated";
import { ActivityLogOpportunityNoteCreated } from "./ActivityLogOpportunityNoteCreated";

type ActivityLogIteratorProps = {
  activities: Activity[];
  pageSize: number;
};

export function ActivityLogIterator({
  activities,
  pageSize,
}: ActivityLogIteratorProps) {
  const [activitiesDisplayed, setActivityDisplayed] = useState(pageSize);

  const filteredActivities = activities.slice(0, activitiesDisplayed);

  return (
    <div className="space-y-4">
      {filteredActivities.map((activity, index) => (
        <Fragment key={index}>
          <ActivityItem key={activity.id} activity={activity} />
          <Separator />
        </Fragment>
      ))}

      {activitiesDisplayed < activities.length && (
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setActivityDisplayed(
              (activitiesDisplayed) => activitiesDisplayed + pageSize,
            );
          }}
          className="flex w-full justify-center text-sm underline hover:no-underline"
        >
          Load more activity
        </a>
      )}
    </div>
  );
}

function ActivityItem({ activity }: { activity: Activity }) {
  if (activity.type === COMPANY_CREATED) {
    return <ActivityLogCompanyCreated activity={activity} />;
  }

  if (activity.type === CONTACT_CREATED) {
    return <ActivityLogContactCreated activity={activity} />;
  }

  if (activity.type === CONTACT_NOTE_CREATED) {
    return <ActivityLogContactNoteCreated activity={activity} />;
  }

  if (activity.type === OPPORTUNITY_CREATED) {
    return <ActivityLogOpportunityCreated activity={activity} />;
  }

  if (activity.type === OPPORTUNITY_NOTE_CREATED) {
    return <ActivityLogOpportunityNoteCreated activity={activity} />;
  }

  return null;
}
