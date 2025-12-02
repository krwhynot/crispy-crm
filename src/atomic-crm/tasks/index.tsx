import * as React from "react";
import type { Task } from "../types";
import { ResourceErrorBoundary } from "@/components/ResourceErrorBoundary";

const TaskListLazy = React.lazy(() => import("./TaskList"));
const TaskEditLazy = React.lazy(() => import("./TaskEdit"));
const TaskCreateLazy = React.lazy(() => import("./TaskCreate"));

// Wrap lazy components with resource-specific error boundaries
const TaskList = () => (
  <ResourceErrorBoundary resource="tasks" page="list">
    <TaskListLazy />
  </ResourceErrorBoundary>
);

const TaskEdit = () => (
  <ResourceErrorBoundary resource="tasks" page="edit">
    <TaskEditLazy />
  </ResourceErrorBoundary>
);

const TaskCreate = () => (
  <ResourceErrorBoundary resource="tasks" page="create">
    <TaskCreateLazy />
  </ResourceErrorBoundary>
);

export default {
  list: TaskList,
  edit: TaskEdit,
  create: TaskCreate,
  recordRepresentation: (record: Task) => record?.title || `Task #${record?.id}`,
};
