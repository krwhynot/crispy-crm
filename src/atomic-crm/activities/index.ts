import * as React from "react";
import type { ResourceProps } from "react-admin";
import { Activity } from "lucide-react";

const ActivityCreate = React.lazy(() => import("./ActivityCreate"));

const resource: ResourceProps = {
  name: "activities",
  icon: Activity,
  create: ActivityCreate,
  options: {
    label: "Activities",
  },
};

export default resource;
