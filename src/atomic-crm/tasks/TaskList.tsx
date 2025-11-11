import { useState, useMemo } from "react";
import { useGetList, useGetIdentity, useListContext, downloadCSV, type Exporter } from "ra-core";
import jsonExport from "jsonexport/dist";
import { ChevronDown, ChevronRight } from "lucide-react";

import { CreateButton } from "@/components/admin/create-button";
import { ExportButton } from "@/components/admin/export-button";
import { List } from "@/components/admin/list";
import { SortButton } from "@/components/admin/sort-button";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FloatingCreateButton } from "@/components/admin/FloatingCreateButton";
import { TopToolbar } from "../layout/TopToolbar";
import { useFilterCleanup } from "../hooks/useFilterCleanup";
import { Task } from "./Task";
import { TaskListFilter } from "./TaskListFilter";
import type { Task as TTask, Opportunity, Organization } from "../types";

/**
 * TaskList Component
 *
 * Displays all tasks grouped by principal (organization) by default.
 * Helps answer: "What's my ONE thing to do this week for each principal?"
 *
 * Features:
 * - Group by principal (default) or flat list
 * - Filter by principal, due date, status, priority
 * - Inline task completion
 * - Export to CSV
 *
 * Design Pattern: Pipedrive-inspired task management
 * Ref: docs/plans/[tasks implementation plan]
 */

export default function TaskList() {
  const { identity } = useGetIdentity();

  // Clean up stale filters
  useFilterCleanup("tasks");

  if (!identity) return null;

  return (
    <List
      title="Tasks"
      actions={<TaskListActions />}
      perPage={100}
      sort={{ field: "due_date", order: "ASC" }}
      exporter={exporter}
    >
      <TaskListLayout />
      <FloatingCreateButton />
    </List>
  );
}

const TaskListActions = () => (
  <TopToolbar>
    <SortButton fields={["due_date", "priority", "created_at"]} />
    <ExportButton exporter={exporter} />
    <CreateButton />
  </TopToolbar>
);

const TaskListLayout = () => {
  const { data: tasks, isPending, filterValues } = useListContext<TTask>();
  const { identity } = useGetIdentity();
  const [showCompleted, setShowCompleted] = useState(false);

  const hasFilters = filterValues && Object.keys(filterValues).length > 0;

  if (!identity || isPending) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading tasks...</p>
      </div>
    );
  }

  if (!tasks?.length && !hasFilters) {
    return <TaskListEmpty />;
  }

  return (
    <div className="flex flex-row gap-6">
      <aside aria-label="Filter tasks" className="w-64">
        <TaskListFilter />
        <div className="mt-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
              className="rounded"
            />
            Show completed tasks
          </label>
        </div>
      </aside>
      <main role="main" aria-label="Tasks list" className="flex-1">
        <TaskListContent tasks={tasks} showCompleted={showCompleted} />
      </main>
    </div>
  );
};

interface TaskListContentProps {
  tasks: TTask[];
  showCompleted: boolean;
}

function TaskListContent({ tasks, showCompleted }: TaskListContentProps) {
  // Fetch opportunities to get principal data
  const opportunityIds = useMemo(
    () =>
      Array.from(
        new Set(tasks.filter((t) => t.opportunity_id).map((t) => t.opportunity_id as number))
      ),
    [tasks]
  );

  const { data: opportunities } = useGetList<Opportunity>("opportunities", {
    pagination: { page: 1, perPage: 1000 },
    filter: { id: opportunityIds },
  });

  // Fetch organizations (principals)
  const orgIds = useMemo(
    () =>
      Array.from(
        new Set(
          (opportunities || [])
            .filter((opp) => opp.organization_id)
            .map((opp) => opp.organization_id as number)
        )
      ),
    [opportunities]
  );

  const { data: organizations } = useGetList<Organization>("organizations", {
    pagination: { page: 1, perPage: 1000 },
    filter: { id: orgIds },
  });

  // Create lookup maps
  const oppMap = useMemo(
    () => new Map(opportunities?.map((opp) => [opp.id, opp]) || []),
    [opportunities]
  );

  const orgMap = useMemo(
    () => new Map(organizations?.map((org) => [org.id, org]) || []),
    [organizations]
  );

  // Group tasks by principal
  const groupedTasks = useMemo(() => {
    const groups = new Map<string, { principal: string; principalId?: number; tasks: TTask[] }>();

    // Filter tasks based on showCompleted
    const filteredTasks = tasks.filter((task) => showCompleted || !task.completed_at);

    filteredTasks.forEach((task) => {
      let principalName = "No Principal";
      let principalId: number | undefined;

      if (task.opportunity_id) {
        const opp = oppMap.get(task.opportunity_id as number);
        if (opp?.organization_id) {
          const org = orgMap.get(opp.organization_id as number);
          if (org) {
            principalName = org.name;
            principalId = org.id as number;
          }
        }
      }

      if (!groups.has(principalName)) {
        groups.set(principalName, { principal: principalName, principalId, tasks: [] });
      }
      groups.get(principalName)!.tasks.push(task);
    });

    // Sort groups: principals with tasks first, then alphabetically
    return Array.from(groups.values()).sort((a, b) => {
      if (a.principal === "No Principal") return 1;
      if (b.principal === "No Principal") return -1;
      return a.principal.localeCompare(b.principal);
    });
  }, [tasks, oppMap, orgMap, showCompleted]);

  if (groupedTasks.length === 0) {
    return (
      <Card className="p-8">
        <p className="text-muted-foreground text-center">
          {showCompleted
            ? "No tasks found"
            : "No incomplete tasks. Toggle 'Show completed tasks' to see completed tasks."}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {groupedTasks.map((group) => (
        <TaskGroup key={group.principal} group={group} />
      ))}
    </div>
  );
}

interface TaskGroupProps {
  group: {
    principal: string;
    principalId?: number;
    tasks: TTask[];
  };
}

function TaskGroup({ group }: TaskGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const incompleteTasks = group.tasks.filter((t) => !t.completed_at);
  const completedTasks = group.tasks.filter((t) => t.completed_at);

  return (
    <Card className="overflow-hidden">
      <Button
        variant="ghost"
        className="w-full justify-between p-4 h-auto hover:bg-muted/50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          <span className="font-semibold text-lg">{group.principal}</span>
          <span className="text-sm text-muted-foreground">
            ({incompleteTasks.length} task{incompleteTasks.length !== 1 ? "s" : ""})
          </span>
        </div>
        {incompleteTasks.length > 0 && (
          <div className="px-2 py-1 bg-primary text-primary-foreground rounded text-xs font-medium">
            {incompleteTasks.length} pending
          </div>
        )}
      </Button>

      {isExpanded && (
        <div className="p-4 space-y-2 border-t">
          {incompleteTasks.length === 0 && completedTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tasks for this principal</p>
          ) : (
            <>
              {incompleteTasks.map((task) => (
                <Task key={task.id} task={task} />
              ))}
              {completedTasks.length > 0 && (
                <>
                  <div className="pt-2 mt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-2">
                      Completed ({completedTasks.length})
                    </p>
                  </div>
                  {completedTasks.map((task) => (
                    <Task key={task.id} task={task} />
                  ))}
                </>
              )}
            </>
          )}
        </div>
      )}
    </Card>
  );
}

function TaskListEmpty() {
  return (
    <Card className="p-12">
      <div className="text-center space-y-4">
        <h3 className="text-xl font-semibold">No tasks yet</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Create your first task to start tracking your work with principals and distributors. Tasks
          help you answer: "What's the ONE thing I need to do this week?"
        </p>
        <div className="pt-4">
          <CreateButton label="Create your first task" />
        </div>
      </div>
    </Card>
  );
}

const exporter: Exporter<TTask> = async (records, fetchRelatedRecords) => {
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
