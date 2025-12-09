import * as React from "react";
import { ResourceErrorBoundary } from "@/components/ResourceErrorBoundary";

const NotificationsListLazy = React.lazy(() => import("./NotificationsList"));

const NotificationsListView = () => (
  <ResourceErrorBoundary resource="notifications" page="list">
    <NotificationsListLazy />
  </ResourceErrorBoundary>
);

export { NotificationsListView };

export default {
  list: NotificationsListView,
  recordRepresentation: (record: { message: string }) => record.message,
};
