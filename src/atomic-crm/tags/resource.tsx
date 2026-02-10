import * as React from "react";
import type { Tag } from "../types";
import { ResourceErrorBoundary } from "@/components/ResourceErrorBoundary";
import { Loading } from "@/components/ra-wrappers/loading";

const TagListLazy = React.lazy(() => import("./TagList"));
const TagEditLazy = React.lazy(() => import("./TagEdit"));
const TagCreateLazy = React.lazy(() => import("./TagCreate"));

// Wrap lazy components with resource-specific error boundaries
export const TagListView = () => (
  <ResourceErrorBoundary resource="tags" page="list">
    <React.Suspense fallback={<Loading />}>
      <TagListLazy />
    </React.Suspense>
  </ResourceErrorBoundary>
);

export const TagEditView = () => (
  <ResourceErrorBoundary resource="tags" page="edit">
    <React.Suspense fallback={<Loading />}>
      <TagEditLazy />
    </React.Suspense>
  </ResourceErrorBoundary>
);

export const TagCreateView = () => (
  <ResourceErrorBoundary resource="tags" page="create">
    <React.Suspense fallback={<Loading />}>
      <TagCreateLazy />
    </React.Suspense>
  </ResourceErrorBoundary>
);

const tagRecordRepresentation = (record: Tag) => record?.name || `Tag #${record?.id}`;

export default {
  list: TagListView,
  edit: TagEditView,
  create: TagCreateView,
  recordRepresentation: tagRecordRepresentation,
};
