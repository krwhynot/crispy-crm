import * as React from "react";
import type { ResourceProps } from "react-admin";
import { CheckSquare } from "lucide-react";
import type { Task } from "../types";

const TaskList = React.lazy(() => import("./TaskList"));
const TaskShow = React.lazy(() => import("./TaskShow"));
const TaskEdit = React.lazy(() => import("./TaskEdit"));
const TaskCreate = React.lazy(() => import("./TaskCreate"));

const resource: ResourceProps = {
  name: "tasks",
  list: TaskList,
  show: TaskShow,
  edit: TaskEdit,
  create: TaskCreate,
  icon: CheckSquare,
  options: {
    label: "Tasks",
  },
  recordRepresentation: (record: Task) => record?.title || `Task #${record?.id}`,
};

export default resource;
