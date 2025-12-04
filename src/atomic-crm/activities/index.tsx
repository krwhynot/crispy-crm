import * as React from "react";
import type { ActivityRecord } from "../types";
import { ResourceErrorBoundary } from "@/components/ResourceErrorBoundary";

const ActivityListLazy = React.lazy(() => import("./ActivityList"));
const ActivityCreateLazy = React.lazy(() => import("./ActivityCreate"));

// Wrap lazy components with resource-specific error boundaries
const ActivityList = () => (
  <ResourceErrorBoundary resource="activities" page="list">
    <ActivityListLazy />
  </ResourceErrorBoundary>
);

const ActivityCreate = () => (
  <ResourceErrorBoundary resource="activities" page="create">
    <ActivityCreateLazy />
  </ResourceErrorBoundary>
);

// Export the reusable dialog component and its types
export {
  QuickLogActivityDialog,
  type QuickLogActivityDialogProps,
  type QuickLogActivityDialogConfig,
  type ActivityEntityContext,
  type ActivityTypePreset,
} from "./QuickLogActivityDialog";

// Export the task-completion specific dialog
export { QuickLogActivity } from "./QuickLogActivity";

import { parseDateSafely } from "@/lib/date-utils";

export default {
  list: ActivityList,
  create: ActivityCreate,
  recordRepresentation: (record: ActivityRecord) =>
    `${record?.type || "Activity"} - ${record?.activity_date ? parseDateSafely(record.activity_date)?.toLocaleDateString() || "Unknown date" : "Unknown date"}`,
};
