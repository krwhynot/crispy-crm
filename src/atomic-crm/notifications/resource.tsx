import * as React from "react";
import { ResourceErrorBoundary } from "@/components/ResourceErrorBoundary";
import { Loading } from "@/components/ra-wrappers/loading";

const NotificationsListLazy = React.lazy(() => import("./NotificationsList"));

const NotificationsListView = () => (
  <ResourceErrorBoundary resource="notifications" page="list">
    <React.Suspense fallback={<Loading />}>
      <NotificationsListLazy />
    </React.Suspense>
  </ResourceErrorBoundary>
);

export { NotificationsListView };

export default {
  list: NotificationsListView,
  recordRepresentation: (record: { message: string }) => record.message,
};
