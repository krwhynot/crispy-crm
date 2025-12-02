import React from "react";
import { useUpdate, useNotify, downloadCSV, type Exporter } from "ra-core";
import jsonExport from "jsonexport/dist";

import { FunctionField } from "react-admin";
import { List } from "@/components/admin/list";
import { StandardListLayout } from "@/components/layouts/StandardListLayout";
import { PremiumDatagrid } from "@/components/admin/PremiumDatagrid";
import { TextField } from "@/components/admin/text-field";
import { DateField } from "@/components/admin/date-field";
import { ReferenceField } from "@/components/admin/reference-field";
import { Badge } from "@/components/ui/badge";
import { PriorityBadge } from "@/components/ui/priority-badge";
import { useSlideOverState } from "@/hooks/useSlideOverState";
import { useFilterCleanup } from "../hooks/useFilterCleanup";
import { useListKeyboardNavigation } from "@/hooks/useListKeyboardNavigation";
import { FloatingCreateButton } from "@/components/admin/FloatingCreateButton";
import { TaskListFilter } from "./TaskListFilter";
import { TaskSlideOver } from "./TaskSlideOver";
import { SaleName } from "../sales/SaleName";
import { contactOptionText } from "../contacts/ContactOption";
import type { Task, Opportunity, Organization } from "../types";

/**
 * TaskList Component
 *
 * Displays all tasks in a StandardListLayout with PremiumDatagrid.
 *
 * Features:
 * - Inline completion checkbox (prevents row click)
 * - Row click opens slide-over (not full page)
 * - Filter by principal, due date, status, priority, type
 * - Export to CSV
 * - Deep linking via ?view=:id
 *
 * Design Pattern: Unified design system (StandardListLayout + PremiumDatagrid)
 */
export default function TaskList() {
  const { slideOverId, isOpen, mode, openSlideOver, closeSlideOver, toggleMode } =
    useSlideOverState();

  // Clean up stale cached filters from localStorage
  useFilterCleanup("tasks");

  // Keyboard navigation for list rows
  const { focusedIndex } = useListKeyboardNavigation({
    onSelect: (id) => openSlideOver(Number(id), "edit"),
    enabled: !isOpen,
  });

  return (
    <>
      <List
        title="Tasks"
        perPage={100}
        sort={{ field: "due_date", order: "ASC" }}
        exporter={exporter}
      >
        <StandardListLayout resource="tasks" filterComponent={<TaskListFilter />}>
          <PremiumDatagrid
            onRowClick={(id) => openSlideOver(Number(id), "edit")}
            focusedIndex={focusedIndex}
          >
            {/* Inline completion checkbox - CRITICAL: prevent row click */}
            <FunctionField
              label="Done"
              render={(record: Task) => <CompletionCheckbox task={record} />}
            />

            <TextField source="title" label="Title" />

            <DateField source="due_date" label="Due Date" />

            <FunctionField
              label="Priority"
              render={(record: Task) =>
                record.priority && <PriorityBadge priority={record.priority} />
              }
            />

            <FunctionField
              label="Type"
              render={(record: Task) => record.type && <Badge variant="outline">{record.type}</Badge>}
              cellClassName="hidden lg:table-cell"
              headerClassName="hidden lg:table-cell"
            />

            <ReferenceField
              source="sales_id"
              reference="sales"
              label="Assigned To"
              link={false}
              cellClassName="hidden lg:table-cell"
              headerClassName="hidden lg:table-cell"
            >
              <SaleName />
            </ReferenceField>

            <ReferenceField
              source="contact_id"
              reference="contacts_summary"
              label="Contact"
              link={false}
              cellClassName="hidden lg:table-cell"
              headerClassName="hidden lg:table-cell"
            >
              <TextField source={contactOptionText} />
            </ReferenceField>

            <ReferenceField
              source="opportunity_id"
              reference="opportunities"
              label="Opportunity"
              link={false}
              cellClassName="hidden lg:table-cell"
              headerClassName="hidden lg:table-cell"
            >
              <TextField source="title" />
            </ReferenceField>
          </PremiumDatagrid>
        </StandardListLayout>
        <FloatingCreateButton />
      </List>

      <TaskSlideOver
        recordId={slideOverId}
        isOpen={isOpen}
        mode={mode}
        onClose={closeSlideOver}
        onModeToggle={toggleMode}
      />
    </>
  );
}

// Inline completion checkbox component - prevents row click propagation
// Memoized to prevent re-renders when other rows update
const CompletionCheckbox = React.memo(function CompletionCheckbox({ task }: { task: Task }) {
  const [update] = useUpdate();
  const notify = useNotify();

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
      notify(checked ? "Task completed" : "Task reopened", { type: "success" });
    } catch (error) {
      notify("Error updating task", { type: "error" });
      console.error("Completion toggle error:", error);
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

// CSV exporter
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
        console.error("Export error:", err);
        return;
      }
      downloadCSV(csv, "tasks");
    }
  );
};
