import * as React from "react";
import type { ActivityRecord } from "../types";
import { ResourceErrorBoundary } from "@/components/ResourceErrorBoundary";

const ActivityListLazy = React.lazy(() => import("./ActivityList"));
const ActivityCreateLazy = React.lazy(() => import("./ActivityCreate"));
const ActivityEditLazy = React.lazy(() => import("./ActivityEdit"));

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

const ActivityEdit = () => (
  <ResourceErrorBoundary resource="activities" page="edit">
    <ActivityEditLazy />
  </ResourceErrorBoundary>
);

// Export wrapped view components for direct imports
export { ActivityList, ActivityCreate, ActivityEdit };

// Export shared form inputs
export { ActivityInputs } from "./ActivityInputs";

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

// Export shared components
export { ActivityTimelineEntry } from "./components/ActivityTimelineEntry";

// Export shared constants
export { ACTIVITY_PAGE_SIZE } from "./constants";

import { parseDateSafely } from "@/lib/date-utils";

// Resource configuration for React Admin
export const activityResource = {
  name: "activities",
  list: ActivityList,
  create: ActivityCreate,
  edit: ActivityEdit,
};

export default {
  list: ActivityList,
  create: ActivityCreate,
  edit: ActivityEdit,
  recordRepresentation: (record: ActivityRecord) =>
    `${record?.type || "Activity"} - ${record?.activity_date ? parseDateSafely(record.activity_date)?.toLocaleDateString() || "Unknown date" : "Unknown date"}`,
};
