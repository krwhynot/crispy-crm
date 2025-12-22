/* eslint-disable react-refresh/only-export-components -- React Admin resource config requires mixed exports */
import type { ActivityRecord } from "../types";
import { parseDateSafely } from "@/lib/date-utils";

// Standard feature exports
export { default as ActivityList } from './ActivityList';
export { default as ActivityCreate } from './ActivityCreate';
export { ActivityEdit } from './ActivityEdit';

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

// Re-import for default export
import ActivityList from './ActivityList';
import ActivityCreate from './ActivityCreate';
import { ActivityEdit } from './ActivityEdit';

// React Admin resource configuration
export default {
  list: ActivityList,
  create: ActivityCreate,
  edit: ActivityEdit,
  recordRepresentation: (record: ActivityRecord) =>
    `${record?.type || "Activity"} - ${record?.activity_date ? parseDateSafely(record.activity_date)?.toLocaleDateString() || "Unknown date" : "Unknown date"}`,
};
