import { List, Datagrid, TextField, FunctionField, useGetIdentity, useRefresh } from "react-admin";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { AlertCircle } from "lucide-react";
import type { RaRecord } from "react-admin";
import { useState, memo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { QuickCompleteTaskModal } from "./QuickCompleteTaskModal";
import type { Task } from "../types";

/**
 * Principal-Centric Dashboard Table
 *
 * Displays active principals with their opportunity metrics in a table format.
 * Replaces the widget-based dashboard with a focused, action-oriented view.
 *
 * PRD Reference: docs/prd/14-dashboard.md
 *
 * Columns (6):
 * 1. Principal - Organization name (clickable link)
 * 2. # Opps - Count of active opportunities
 * 3. Status - Color-coded indicator (Good/Warning/Urgent)
 * 4. Last Activity - Date + type
 * 5. Stuck - Warning icon + days if stuck 30+ days
 * 6. Next Action - Next incomplete task
 *
 * Data Source: dashboard_principal_summary view
 * Filtering: Current user's account_manager_id
 * Sorting: priority_score DESC (urgent principals first)
 */

interface DashboardPrincipalSummary extends RaRecord {
  id: number; // principal_organization_id aliased as id in view
  principal_name: string;
  account_manager_id: number;
  opportunity_count: number;
  last_activity_date: string | null;
  last_activity_type: string | null;
  days_since_last_activity: number | null;
  status_indicator: "good" | "warning" | "urgent";
  max_days_in_stage: number;
  is_stuck: boolean;
  next_action: string | null;
  next_action_task: Task | null; // Full task object for quick actions
  priority_score: number;
}

// Status indicator component with color coding
const StatusField = ({ record }: { record?: DashboardPrincipalSummary }) => {
  if (!record) return null;

  const statusConfig = {
    good: { label: "🟢 Good", className: "text-green-600" },
    warning: { label: "🟡 Warning", className: "text-yellow-600" },
    urgent: { label: "🔴 Urgent", className: "text-red-600" },
  };

  const config = statusConfig[record.status_indicator];

  return <span className={`font-medium ${config.className}`}>{config.label}</span>;
};

// Last activity field with date + type
const LastActivityField = ({ record }: { record?: DashboardPrincipalSummary }) => {
  if (!record || !record.last_activity_date) {
    return <span className="text-muted-foreground italic">No activity</span>;
  }

  const date = new Date(record.last_activity_date);
  const formattedDate = format(date, "MMM d, yyyy");
  const activityType = record.last_activity_type || "Activity";

  return (
    <div className="flex flex-col">
      <span className="font-medium">{formattedDate}</span>
      <span className="text-sm text-muted-foreground">{activityType}</span>
    </div>
  );
};

// Stuck indicator - shows warning icon + days if stuck
const StuckField = ({ record }: { record?: DashboardPrincipalSummary }) => {
  if (!record || !record.is_stuck) {
    return null;
  }

  return (
    <div className="flex items-center gap-1 text-orange-600">
      <AlertCircle className="h-4 w-4" />
      <span className="font-medium">{Math.floor(record.max_days_in_stage)} days</span>
    </div>
  );
};

// Next action field with checkbox for quick completion
const NextActionField = ({
  record,
  onTaskSelect,
}: {
  record?: DashboardPrincipalSummary;
  onTaskSelect: (task: Task) => void;
}) => {
  if (!record) return null;

  // Use the task object directly for checks and rendering
  const task = record.next_action_task;

  if (!task) {
    return <span className="text-muted-foreground italic">No pending tasks</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <Checkbox
        checked={false}
        onCheckedChange={() => onTaskSelect(task)}
        onClick={(e) => e.stopPropagation()}
        aria-label={`Complete task: ${record.next_action}`}
      />
      <span className="text-sm">{record.next_action}</span>
    </div>
  );
};

// Memoized grid component to prevent unnecessary re-renders when modal state changes
const DashboardGrid = memo(({ onTaskSelect }: { onTaskSelect: (task: Task) => void }) => {
  return (
    <Datagrid
      bulkActionButtons={false}
      isRowExpandable={() => false}
      rowClick={(id) => {
        // Navigate to organization detail page (id = principal_organization_id)
        return `/organizations/${id}/show`;
      }}
      sx={{
        "& .RaDatagrid-table": {
          borderCollapse: "separate",
          borderSpacing: 0,
        },
        "& .RaDatagrid-thead": {
          backgroundColor: "var(--secondary)",
        },
        "& .RaDatagrid-headerCell": {
          fontWeight: 600,
          padding: "12px 16px",
        },
        "& .RaDatagrid-rowCell": {
          padding: "12px 16px",
        },
        "& .RaDatagrid-row:hover": {
          backgroundColor: "var(--accent)",
          cursor: "pointer",
        },
      }}
    >
      {/* Column 1: Principal Name (clickable) */}
      <FunctionField
        label="Principal"
        render={(record: DashboardPrincipalSummary) => (
          <Link
            to={`/organizations/${record.id}/show`}
            className="font-medium text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {record.principal_name}
          </Link>
        )}
      />

      {/* Column 2: Opportunity Count */}
      <TextField source="opportunity_count" label="# Opps" textAlign="center" />

      {/* Column 3: Status Indicator */}
      <FunctionField
        label="Status"
        render={(record?: RaRecord) => <StatusField record={record as DashboardPrincipalSummary} />}
      />

      {/* Column 4: Last Activity */}
      <FunctionField
        label="Last Activity"
        render={(record?: RaRecord) => (
          <LastActivityField record={record as DashboardPrincipalSummary} />
        )}
      />

      {/* Column 5: Stuck Indicator */}
      <FunctionField
        label="Stuck"
        render={(record?: RaRecord) => <StuckField record={record as DashboardPrincipalSummary} />}
      />

      {/* Column 6: Next Action */}
      <FunctionField
        label="Next Action"
        render={(record?: RaRecord) => (
          <NextActionField
            record={record as DashboardPrincipalSummary}
            onTaskSelect={onTaskSelect}
          />
        )}
      />
    </Datagrid>
  );
});

export const PrincipalDashboardTable = () => {
  const { identity } = useGetIdentity();
  const salesId = identity?.id;
  const refresh = useRefresh();

  // State for quick action modal
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // If no identity yet, show nothing (loading handled by parent)
  if (!salesId) {
    return null;
  }

  return (
    <>
      <List
        resource="dashboard_principal_summary"
        filter={{ account_manager_id: salesId }}
        sort={{ field: "priority_score", order: "DESC" }}
        perPage={25}
        pagination={false}
        actions={false}
        sx={{
          "& .RaList-main": {
            boxShadow: "none",
          },
        }}
      >
        <DashboardGrid onTaskSelect={setSelectedTask} />
      </List>

      {/* Quick Complete Task Modal */}
      {selectedTask && (
        <QuickCompleteTaskModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onComplete={() => {
            setSelectedTask(null);
            refresh();
          }}
        />
      )}
    </>
  );
};
