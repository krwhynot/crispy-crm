import * as React from "react";
import { ResourceErrorBoundary } from "@/components/ResourceErrorBoundary";

const NotificationsListLazy = React.lazy(() => import("./NotificationsList"));

// Wrap lazy component with resource-specific error boundary
const NotificationsList = () => (
  <ResourceErrorBoundary resource="notifications" page="list">
    <NotificationsListLazy />
  </ResourceErrorBoundary>
);

export default {
  list: NotificationsList,
  recordRepresentation: (record: { message: string }) => record.message,
};
