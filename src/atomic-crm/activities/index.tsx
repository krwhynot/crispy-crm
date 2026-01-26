/* eslint-disable react-refresh/only-export-components -- React Admin resource config requires mixed exports */

/**
 * Activities Module Entry Point
 *
 * Re-exports components for external use and provides error-boundary-wrapped
 * resource configuration via resource.tsx.
 *
 * Part of P2-13 fix: Add error boundaries to feature modules
 */

// Standard feature exports (raw components for testing/embedding)
export { default as ActivityList } from "./ActivityList";
export { ActivityEdit } from "./ActivityEdit";
export { default as ActivityShow } from "./ActivityShow";

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
export { ActivityTimelineEntry } from "./ActivityTimelineEntry";

// Export slide-over component
export { ActivitySlideOver } from "./ActivitySlideOver";

// Export shared constants
export { ACTIVITY_PAGE_SIZE } from "./constants";

// Export wrapped views (with error boundaries)
export { ActivityListView, ActivityEditView, ActivityShowView } from "./resource";

// React Admin resource configuration (with error boundaries)
export { default } from "./resource";
