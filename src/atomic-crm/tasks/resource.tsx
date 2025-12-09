import * as React from "react";
import type { Task } from "../types";
import { ResourceErrorBoundary } from "@/components/ResourceErrorBoundary";

const TaskListLazy = React.lazy(() => import("./TaskList"));
const TaskEditLazy = React.lazy(() => import("./TaskEdit"));
const TaskCreateLazy = React.lazy(() => import("./TaskCreate"));

// Wrap lazy components with resource-specific error boundaries
export const TaskListView = () => (
  <ResourceErrorBoundary resource="tasks" page="list">
    <TaskListLazy />
  </ResourceErrorBoundary>
);

export const TaskEditView = () => (
  <ResourceErrorBoundary resource="tasks" page="edit">
    <TaskEditLazy />
  </ResourceErrorBoundary>
);

export const TaskCreateView = () => (
  <ResourceErrorBoundary resource="tasks" page="create">
    <TaskCreateLazy />
  </ResourceErrorBoundary>
);

export const taskRecordRepresentation = (record: Task) =>
  record?.title || `Task #${record?.id}`;

export default {
  list: TaskListView,
  edit: TaskEditView,
  create: TaskCreateView,
  recordRepresentation: taskRecordRepresentation,
};
