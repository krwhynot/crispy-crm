/* eslint-disable react-refresh/only-export-components -- React Admin resource config requires mixed exports */

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
