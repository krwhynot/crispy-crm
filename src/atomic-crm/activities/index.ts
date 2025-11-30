import * as React from "react";
import type { ActivityRecord } from "../types";

const ActivityList = React.lazy(() => import("./ActivityList"));
const ActivityCreate = React.lazy(() => import("./ActivityCreate"));

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

export default {
  list: ActivityList,
  create: ActivityCreate,
  recordRepresentation: (record: ActivityRecord) =>
    `${record?.type || "Activity"} - ${record?.activity_date ? new Date(record.activity_date).toLocaleDateString() : "Unknown date"}`,
};
