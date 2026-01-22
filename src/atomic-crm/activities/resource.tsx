import * as React from "react";
import type { ActivityRecord } from "../types";
import { parseDateSafely } from "@/lib/date-utils";
import { ResourceErrorBoundary } from "@/components/ResourceErrorBoundary";

/**
 * Activities Resource Configuration
 *
 * Provides lazy-loaded, error-boundary-wrapped views for the activities module.
 * This follows the established resource.tsx pattern used by other modules.
 *
 * Part of P2-13 fix: Add error boundaries to feature modules
 */

const ActivityListLazy = React.lazy(() => import("./ActivityList"));
const ActivityCreateLazy = React.lazy(() => import("./ActivityCreate"));
const ActivityEditLazy = React.lazy(() =>
  import("./ActivityEdit").then((module) => ({ default: module.ActivityEdit }))
);
const ActivityShowLazy = React.lazy(() => import("./ActivityShow"));

// Wrap lazy components with resource-specific error boundaries
export const ActivityListView = () => (
  <ResourceErrorBoundary resource="activities" page="list">
    <ActivityListLazy />
  </ResourceErrorBoundary>
);

export const ActivityCreateView = () => (
  <ResourceErrorBoundary resource="activities" page="create">
    <ActivityCreateLazy />
  </ResourceErrorBoundary>
);

export const ActivityEditView = () => (
  <ResourceErrorBoundary resource="activities" page="edit">
    <ActivityEditLazy />
  </ResourceErrorBoundary>
);

export const ActivityShowView = () => (
  <ResourceErrorBoundary resource="activities" page="show">
    <ActivityShowLazy />
  </ResourceErrorBoundary>
);

const activityRecordRepresentation = (record: ActivityRecord) =>
  `${record?.type || "Activity"} - ${
    record?.activity_date
      ? parseDateSafely(record.activity_date)?.toLocaleDateString() || "Unknown date"
      : "Unknown date"
  }`;

// React Admin resource configuration
export default {
  list: ActivityListView,
  create: ActivityCreateView,
  edit: ActivityEditView,
  show: ActivityShowView,
  recordRepresentation: activityRecordRepresentation,
};
