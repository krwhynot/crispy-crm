import * as React from "react";

const NotificationsList = React.lazy(() => import("./NotificationsList"));

export default {
  list: NotificationsList,
  recordRepresentation: (record: { message: string }) => record.message,
};
