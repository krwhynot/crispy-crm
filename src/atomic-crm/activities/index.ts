import * as React from "react";
import type { Activity } from "../types";

const ActivityCreate = React.lazy(() => import("./ActivityCreate"));

export default {
  create: ActivityCreate,
  recordRepresentation: (record: Activity) =>
    `${record?.type || "Activity"} - ${record?.date ? new Date(record.date).toLocaleDateString() : "Unknown date"}`,
};
