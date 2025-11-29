import * as React from "react";
import type { ActivityRecord } from "../types";

const ActivityList = React.lazy(() => import("./ActivityList"));
const ActivityCreate = React.lazy(() => import("./ActivityCreate"));

export default {
  list: ActivityList,
  create: ActivityCreate,
  recordRepresentation: (record: ActivityRecord) =>
    `${record?.type || "Activity"} - ${record?.activity_date ? new Date(record.activity_date).toLocaleDateString() : "Unknown date"}`,
};
