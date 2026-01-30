import * as React from "react";
import type { Task } from "./types";
import { ResourceErrorBoundary } from "@/components/ResourceErrorBoundary";
import { Loading } from "@/components/ra-wrappers/loading";

const TaskListLazy = React.lazy(() => import("./TaskList"));
const TaskEditLazy = React.lazy(() => import("./TaskEdit"));
const TaskCreateLazy = React.lazy(() => import("./TaskCreate"));

// Wrap lazy components with resource-specific error boundaries
export const TaskListView = () => (
  <ResourceErrorBoundary resource="tasks" page="list">
    <React.Suspense fallback={<Loading />}>
      <TaskListLazy />
    </React.Suspense>
  </ResourceErrorBoundary>
);

export const TaskEditView = () => (
  <ResourceErrorBoundary resource="tasks" page="edit">
    <React.Suspense fallback={<Loading />}>
      <TaskEditLazy />
    </React.Suspense>
  </ResourceErrorBoundary>
);

export const TaskCreateView = () => (
  <ResourceErrorBoundary resource="tasks" page="create">
    <React.Suspense fallback={<Loading />}>
      <TaskCreateLazy />
    </React.Suspense>
  </ResourceErrorBoundary>
);

const taskRecordRepresentation = (record: Task) => record?.title || `Task #${record?.id}`;

export default {
  list: TaskListView,
  edit: TaskEditView,
  create: TaskCreateView,
  recordRepresentation: taskRecordRepresentation,
};
