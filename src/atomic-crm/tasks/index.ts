import * as React from "react";
import type { Task } from "../types";

const TaskList = React.lazy(() => import("./TaskList"));
const TaskEdit = React.lazy(() => import("./TaskEdit"));
const TaskCreate = React.lazy(() => import("./TaskCreate"));

export default {
  list: TaskList,
  edit: TaskEdit,
  create: TaskCreate,
  recordRepresentation: (record: Task) => record?.title || `Task #${record?.id}`,
};
