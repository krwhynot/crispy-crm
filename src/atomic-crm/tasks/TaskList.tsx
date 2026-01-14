import React, { useState } from "react";
import {
  useUpdate,
  useNotify,
  useGetIdentity,
  useListContext,
  downloadCSV,
  type Exporter,
} from "ra-core";
import { useQueryClient } from "@tanstack/react-query";
import jsonExport from "jsonexport/dist";

import { FunctionField } from "react-admin";
import { TruncatedText } from "@/components/ui/truncated-text";
import { List } from "@/components/admin/list";
import { ListPagination } from "@/components/admin/list-pagination";
import { StandardListLayout } from "@/components/layouts/StandardListLayout";
import { PremiumDatagrid } from "@/components/admin/PremiumDatagrid";
import { BulkActionsToolbar } from "@/components/admin/bulk-actions-toolbar";
import { TextField } from "@/components/admin/text-field";
import { DateField } from "@/components/admin/date-field";
import { ReferenceField } from "@/components/admin/reference-field";
import { Badge } from "@/components/ui/badge";
import { PriorityBadge } from "@/components/ui/priority-badge";
import { FilterableBadge } from "@/components/admin/FilterableBadge";
import { TaskListSkeleton } from "@/components/ui/list-skeleton";
import { useSlideOverState } from "@/hooks/useSlideOverState";
import { useFilterCleanup } from "../hooks/useFilterCleanup";
import { useListKeyboardNavigation } from "@/hooks/useListKeyboardNavigation";
import { FloatingCreateButton } from "@/components/admin/FloatingCreateButton";
import { COLUMN_VISIBILITY } from "../utils/listPatterns";
import { TaskListFilter } from "./TaskListFilter";
import { TaskSlideOver } from "./TaskSlideOver";
import { TaskEmpty } from "./TaskEmpty";
import { SaleName } from "../sales/SaleName";
import { contactOptionText } from "../contacts/ContactOption";
import { TASK_FILTER_CONFIG } from "./taskFilterConfig";
import { PageTutorialTrigger } from "../tutorial";
import { TaskTitleHeader, TaskPriorityHeader, TaskTypeHeader } from "./TasksDatagridHeader";
import { TopToolbar } from "../layout/TopToolbar";
import { ListSearchBar } from "@/components/admin/ListSearchBar";
import { TaskActionMenu } from "./components/TaskActionMenu";
import { SortButton } from "@/components/admin/sort-button";
import { ExportButton } from "@/components/admin/export-button";
import { TaskCompletionDialog } from "./components/TaskCompletionDialog";
import type { Task, Opportunity, Organization } from "../types";

/**
 * TaskListActions - TopToolbar actions for Tasks list
 *
 * Includes SortButton + ExportButton following ContactList pattern.
 * perPage=100 is intentional - shows all open/overdue tasks at once.
 */
const TaskListActions = () => (
  <TopToolbar>
    <SortButton fields={["title", "due_date", "priority", "type"]} data-testid="task-sort-btn" />
    <ExportButton data-testid="task-export-btn" />
  </TopToolbar>
);

/**
 * TaskList - Standard list page for Task records
 *
 * Follows ContactList reference pattern:
 * - Identity-aware rendering with skeleton loading
 * - Keyboard navigation with slide-over integration
 * - BulkActionsToolbar for selection operations
 * - Responsive columns using COLUMN_VISIBILITY semantic presets
 *
 * Special features:
 * - Inline completion checkbox (prevents row click propagation)
 * - Edit mode by default in slide-over (tasks are action items)
 */
export default function TaskList() {
  const { data: identity, isPending: isIdentityPending } = useGetIdentity();
  const { slideOverId, isOpen, mode, openSlideOver, closeSlideOver, toggleMode } =
    useSlideOverState();

  // Clean up stale cached filters from localStorage
  useFilterCleanup("tasks");

  if (isIdentityPending) {
    return <TaskListSkeleton />;
  }
  if (!identity) {
    return null;
  }

  return (
    <>
      <div data-tutorial="tasks-list">
        <List
          title={false}
          actions={<TaskListActions />}
          perPage={100}
          sort={{ field: "due_date", order: "ASC" }}
          exporter={exporter}
          pagination={<ListPagination rowsPerPageOptions={[25, 50, 100]} />}
        >
          <TaskListLayout openSlideOver={openSlideOver} isSlideOverOpen={isOpen} />
          <FloatingCreateButton />
        </List>
      </div>

      <TaskSlideOver
        recordId={slideOverId}
        isOpen={isOpen}
        mode={mode}
        onClose={closeSlideOver}
        onModeToggle={toggleMode}
      />
      <PageTutorialTrigger chapter="tasks" position="bottom-left" />
    </>
  );
}

/**
 * TaskListLayout - Handles loading, empty states, and datagrid rendering
 */
const TaskListLayout = ({
  openSlideOver,
  isSlideOverOpen,
}: {
  openSlideOver: (id: number, mode: "view" | "edit") => void;
  isSlideOverOpen: boolean;
}) => {
  const { data, isPending, filterValues } = useListContext();

  // Keyboard navigation for list rows
  // Disabled when slide-over is open to prevent conflicts
  const { focusedIndex } = useListKeyboardNavigation({
    onSelect: (id) => openSlideOver(Number(id), "view"),
    enabled: !isSlideOverOpen,
  });

  const hasFilters = filterValues && Object.keys(filterValues).length > 0;

  // Show skeleton during initial load
  if (isPending) {
    return (
      <StandardListLayout resource="tasks" filterComponent={<TaskListFilter />}>
        <TaskListSkeleton />
      </StandardListLayout>
    );
  }

  if (!data?.length && !hasFilters) {
    return <TaskEmpty />;
  }

  return (
    <>
      <StandardListLayout resource="tasks" filterComponent={<TaskListFilter />}>
        <ListSearchBar placeholder="Search tasks..." filterConfig={TASK_FILTER_CONFIG} />
        <PremiumDatagrid
          onRowClick={(id) => openSlideOver(Number(id), "view")}
          focusedIndex={focusedIndex}
        >
          {/* Column 1: Completion - Inline checkbox (non-sortable) - always visible */}
          <FunctionField
            label="Done"
            sortable={false}
            render={(record: Task) => <CompletionCheckbox task={record} />}
            {...COLUMN_VISIBILITY.alwaysVisible}
          />

          {/* Column 2: Title - Primary identifier (sortable) - always visible */}
          <FunctionField
            label={<TaskTitleHeader />}
            sortBy="title"
            render={(record: Task) => (
              <TruncatedText className="max-w-[250px]">{record.title}</TruncatedText>
            )}
            {...COLUMN_VISIBILITY.alwaysVisible}
          />

          {/* Column 3: Due Date - Time-sensitive field (sortable) - always visible */}
          <DateField
            source="due_date"
            label="Due Date"
            sortable
            {...COLUMN_VISIBILITY.alwaysVisible}
          />

          {/* Column 4: Priority - Visual indicator (sortable) - always visible */}
          <FunctionField
            label={<TaskPriorityHeader />}
            sortBy="priority"
            render={(record: Task) =>
              record.priority && (
                <FilterableBadge source="priority" value={record.priority}>
                  <PriorityBadge priority={record.priority} />
                </FilterableBadge>
              )
            }
            {...COLUMN_VISIBILITY.alwaysVisible}
          />

          {/* Column 5: Type - Classification badge (sortable) - hidden on tablet/mobile */}
          <FunctionField
            label={<TaskTypeHeader />}
            sortBy="type"
            render={(record: Task) =>
              record.type && (
                <FilterableBadge source="type" value={record.type}>
                  <Badge variant="outline">{record.type}</Badge>
                </FilterableBadge>
              )
            }
            {...COLUMN_VISIBILITY.desktopOnly}
          />

          {/* Column 6: Assigned To - Sales reference (sortable) - hidden on tablet/mobile */}
          <ReferenceField
            source="sales_id"
            reference="sales"
            label="Assigned To"
            link={false}
            sortable
            {...COLUMN_VISIBILITY.desktopOnly}
          >
            <SaleName />
          </ReferenceField>

          {/* Column 7: Contact - Contact reference (non-sortable) - hidden until large desktop */}
          <ReferenceField
            source="contact_id"
            reference="contacts_summary"
            label="Contact"
            link={false}
            sortable={false}
            {...COLUMN_VISIBILITY.largeDesktopOnly}
          >
            <TextField source={contactOptionText} />
          </ReferenceField>

          {/* Column 8: Opportunity - Opportunity reference (non-sortable) - hidden until large desktop */}
          <ReferenceField
            source="opportunity_id"
            reference="opportunities"
            label="Opportunity"
            link={false}
            sortable={false}
            {...COLUMN_VISIBILITY.largeDesktopOnly}
          >
            <TextField source="title" />
          </ReferenceField>

          {/* Column 9: Actions - Row action menu (non-sortable) - always visible */}
          <FunctionField
            label=""
            sortable={false}
            cellClassName="w-16 text-right"
            render={(record: Task) => (
              <TaskActionMenu
                task={record}
                onView={(id) => openSlideOver(id, "view")}
                onEdit={(id) => openSlideOver(id, "edit")}
                useInternalHandlers
              />
            )}
            {...COLUMN_VISIBILITY.alwaysVisible}
          />
        </PremiumDatagrid>
      </StandardListLayout>
      <BulkActionsToolbar />
    </>
  );
};

/**
 * CompletionCheckbox - Inline task completion toggle
 *
 * CRITICAL: Prevents row click propagation to allow independent checkbox interaction.
 * Memoized to prevent re-renders when other rows update.
 */
const CompletionCheckbox = React.memo(function CompletionCheckbox({ task }: { task: Task }) {
  const [update] = useUpdate();
  const notify = useNotify();
  const queryClient = useQueryClient();

  const handleToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Prevent row click
    e.stopPropagation();

    const checked = e.target.checked;

    try {
      await update("tasks", {
        id: task.id,
        data: {
          completed: checked,
          completed_at: checked ? new Date().toISOString() : null,
        },
        previousData: task,
      });

      queryClient.invalidateQueries({ queryKey: ["tasks"] });

      notify(checked ? "Task completed" : "Task reopened", { type: "success" });
    } catch (error: unknown) {
      notify("Error updating task", { type: "error" });
      throw new Error(`Failed to update task ${task.id}: ${error}`);
    }
  };

  return (
    <label className="flex items-center justify-center h-11 w-11 cursor-pointer">
      <input
        type="checkbox"
        checked={task.completed || false}
        onChange={handleToggle}
        onClick={(e) => e.stopPropagation()}
        className="h-4 w-4 rounded border-input focus:ring-2 focus:ring-primary focus:ring-offset-2"
        aria-label={
          task.completed ? `Mark "${task.title}" as incomplete` : `Mark "${task.title}" as complete`
        }
      />
    </label>
  );
});

/**
 * CSV exporter for Task records
 */
const exporter: Exporter<Task> = async (records, fetchRelatedRecords) => {
  const opportunities = await fetchRelatedRecords<Opportunity>(
    records,
    "opportunity_id",
    "opportunities"
  );

  const organizationIds = Array.from(
    new Set(
      opportunities.filter((opp) => opp.organization_id).map((opp) => opp.organization_id as number)
    )
  );

  const organizations =
    organizationIds.length > 0
      ? await fetchRelatedRecords<Organization>(
          organizationIds.map((id) => ({ id, organization_id: id })),
          "organization_id",
          "organizations"
        )
      : [];

  const oppMap = new Map(opportunities.map((opp) => [opp.id, opp]));
  const orgMap = new Map(organizations.map((org) => [org.id, org]));

  const dataForExport = records.map((task) => {
    const opp = task.opportunity_id ? oppMap.get(task.opportunity_id as number) : null;
    const org = opp?.organization_id ? orgMap.get(opp.organization_id as number) : null;

    return {
      id: task.id,
      title: task.title,
      description: task.description,
      type: task.type,
      priority: task.priority,
      due_date: task.due_date,
      completed: task.completed ? "Yes" : "No",
      completed_at: task.completed_at || "",
      principal: org?.name || "",
      opportunity_id: task.opportunity_id || "",
      contact_id: task.contact_id || "",
      created_at: task.created_at,
    };
  });

  jsonExport(
    dataForExport,
    {
      headers: [
        "id",
        "title",
        "description",
        "type",
        "priority",
        "due_date",
        "completed",
        "completed_at",
        "principal",
        "opportunity_id",
        "contact_id",
        "created_at",
      ],
    },
    (err, csv) => {
      if (err) {
        throw new Error(`CSV export failed: ${err.message}`);
      }
      downloadCSV(csv, "tasks");
    }
  );
};
