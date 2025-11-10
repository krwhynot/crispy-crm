import * as React from "react";
import type { Task } from "../types";

const TaskList = React.lazy(() => import("./TaskList"));
const TaskShow = React.lazy(() => import("./TaskShow"));
const TaskEdit = React.lazy(() => import("./TaskEdit"));
const TaskCreate = React.lazy(() => import("./TaskCreate"));

export default {
  list: TaskList,
  show: TaskShow,
  edit: TaskEdit,
  create: TaskCreate,
  recordRepresentation: (record: Task) => record?.title || `Task #${record?.id}`,
};
