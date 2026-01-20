import { useMemo } from "react";
import { useListContext } from "ra-core";
import { Factory, TrendingUp, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Opportunity } from "../types";
import { getStageStatus, type StageStatus } from "./constants/stageThresholds";
import { getOpportunityStageLabel, STAGE } from "./constants/stageConstants";
import { parseDateSafely } from "@/lib/date-utils";

/**
 * Principal Grouped List View
 *
 * Industry Standard: Microsoft Dynamics 365 Sales (2024 Wave 2)
 * "Group opportunities dynamically based on critical factors such as account name"
 * https://learn.microsoft.com/en-us/dynamics365/release-plan/2024wave2/sales
 *
 * Design: Horizontal Kanban columns grouped by Principal
 * - Each column = one Principal (McCRUM, SWAP, etc.)
 * - Column header: Principal name + count + win rate
 * - Cards sorted: Red status first → Earlier stages → Most days since activity
 *
 * Answers: "What is the ONE thing I need to do this week for each principal?"
 */

interface PrincipalGroupedListProps {
  openSlideOver: (id: number, mode?: "view" | "edit") => void;
}

/**
 * Grouped opportunities by principal
 */
type PrincipalGroupedData = Record<string, Opportunity[]>;

/**
 * Principal metrics for column header
 */
interface PrincipalMetrics {
  total: number;
  winRate: number | null;
  closedWon: number;
  closedLost: number;
  activeCount: number;
}

/**
 * Calculate win rate and counts for a principal
 */
function calculateMetrics(opportunities: Opportunity[]): PrincipalMetrics {
  const closedWon = opportunities.filter((o) => o.stage === STAGE.CLOSED_WON).length;
  const closedLost = opportunities.filter((o) => o.stage === STAGE.CLOSED_LOST).length;
  const totalClosed = closedWon + closedLost;
  const activeCount = opportunities.filter(
    (o) => o.stage !== STAGE.CLOSED_WON && o.stage !== STAGE.CLOSED_LOST
  ).length;

  return {
    total: opportunities.length,
    closedWon,
    closedLost,
    activeCount,
    winRate: totalClosed > 0 ? Math.round((closedWon / totalClosed) * 100) : null,
  };
}

/**
 * Get status priority for sorting (red first)
 */
function getStatusPriority(status: StageStatus): number {
  switch (status) {
    case "rotting":
      return 0;
    case "expired":
      return 1;
    case "warning":
      return 2;
    case "healthy":
      return 3;
    case "closed":
      return 4;
  }
}

/**
 * Stage order for secondary sort
 */
const STAGE_ORDER: Record<string, number> = {
  new_lead: 0,
  initial_outreach: 1,
  sample_visit_offered: 2,
  feedback_logged: 3,
  demo_scheduled: 4,
  closed_won: 5,
  closed_lost: 6,
};

/**
 * Sort opportunities: Red status first → Earlier stages → Most days since activity
 */
function sortOpportunities(opportunities: Opportunity[]): Opportunity[] {
  return [...opportunities].sort((a, b) => {
    // Get status for each
    const aDate = a.estimated_close_date ? parseDateSafely(a.estimated_close_date) : null;
    const bDate = b.estimated_close_date ? parseDateSafely(b.estimated_close_date) : null;
    const aStatus = getStageStatus(a.stage || "", a.days_in_stage || 0, aDate);
    const bStatus = getStageStatus(b.stage || "", b.days_in_stage || 0, bDate);

    // Primary: Status priority (red first)
    const statusDiff = getStatusPriority(aStatus) - getStatusPriority(bStatus);
    if (statusDiff !== 0) return statusDiff;

    // Secondary: Stage order (earlier stages first for active)
    const aOrder = STAGE_ORDER[a.stage || ""] ?? 99;
    const bOrder = STAGE_ORDER[b.stage || ""] ?? 99;
    if (aOrder !== bOrder) return aOrder - bOrder;

    // Tertiary: Days since last activity (most days first - needs attention)
    const aDays = a.days_since_last_activity ?? 0;
    const bDays = b.days_since_last_activity ?? 0;
    return bDays - aDays;
  });
}

export const PrincipalGroupedList = ({ openSlideOver }: PrincipalGroupedListProps) => {
  const { data: opportunities, isPending } = useListContext<Opportunity>();

  // Group opportunities by principal
  const groupedData = useMemo((): PrincipalGroupedData => {
    if (!opportunities) return {};

    const groups: PrincipalGroupedData = {};

    opportunities.forEach((opp) => {
      const principalKey = opp.principal_organization_name || "No Principal";
      if (!groups[principalKey]) {
        groups[principalKey] = [];
      }
      groups[principalKey].push(opp);
    });

    // Sort opportunities within each group
    Object.keys(groups).forEach((key) => {
      groups[key] = sortOpportunities(groups[key]);
    });

    return groups;
  }, [opportunities]);

  // Sort principals alphabetically
  const principalNames = Object.keys(groupedData).sort();

  if (isPending) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading principals...</div>
      </div>
    );
  }

  if (principalNames.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <Factory className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No opportunities found</h3>
          <p className="text-sm text-muted-foreground">
            Create opportunities to see them grouped by principal.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col h-full">
      {/* Horizontal scrolling container for principal columns */}
      <div
        className="flex min-h-0 flex-1 gap-3 overflow-x-auto overflow-y-hidden p-3 bg-muted rounded-2xl border border-border shadow-inner"
        role="region"
        aria-label="Opportunities grouped by principal"
      >
        {principalNames.map((principalName) => {
          const principalOpps = groupedData[principalName];
          const metrics = calculateMetrics(principalOpps);
          // Only show active (non-closed) opportunities in the column
          const activeOpps = principalOpps.filter(
            (o) => o.stage !== STAGE.CLOSED_WON && o.stage !== STAGE.CLOSED_LOST
          );

          return (
            <PrincipalColumn
              key={principalName}
              principalName={principalName}
              opportunities={activeOpps}
              metrics={metrics}
              openSlideOver={openSlideOver}
            />
          );
        })}
      </div>
    </div>
  );
};

/**
 * Principal Column - Kanban-style column for one principal
 */
interface PrincipalColumnProps {
  principalName: string;
  opportunities: Opportunity[];
  metrics: PrincipalMetrics;
  openSlideOver: (id: number, mode?: "view" | "edit") => void;
}

const PrincipalColumn = ({
  principalName,
  opportunities,
  metrics,
  openSlideOver,
}: PrincipalColumnProps) => {
  // Generate slug for color variable (matching OpportunityCard pattern)
  const principalSlug = principalName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return (
    <div
      className="flex flex-col bg-card rounded-lg border border-border shadow-sm min-w-[280px] max-w-[320px] shrink-0"
      style={{
        borderTopColor: `var(--principal-${principalSlug}, var(--primary))`,
        borderTopWidth: "3px",
      }}
    >
      {/* Column Header - Principal name + metrics (Dynamics 365 pattern) */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-base truncate flex-1">{principalName}</h3>
          <Badge variant="secondary" className="ml-2 shrink-0">
            {metrics.activeCount}
          </Badge>
        </div>
        {/* Win rate metric */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {metrics.winRate !== null ? (
            <>
              {metrics.winRate >= 50 ? (
                <TrendingUp className="w-3 h-3 text-success" />
              ) : (
                <TrendingDown className="w-3 h-3 text-destructive" />
              )}
              <span>
                {metrics.winRate}% win rate ({metrics.closedWon}W / {metrics.closedLost}L)
              </span>
            </>
          ) : (
            <span>No closed deals yet</span>
          )}
        </div>
      </div>

      {/* Scrollable card list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {opportunities.length === 0 ? (
          <div className="text-center py-4 text-sm text-muted-foreground">
            No active opportunities
          </div>
        ) : (
          opportunities.map((opp) => (
            <PrincipalOpportunityCard
              key={opp.id}
              opportunity={opp}
              openSlideOver={openSlideOver}
            />
          ))
        )}
      </div>
    </div>
  );
};

/**
 * Simplified Opportunity Card for Principal View
 *
 * Shows: Distributor, Operator, Stage + status indicator
 * (Principal is already shown in column header)
 */
interface PrincipalOpportunityCardProps {
  opportunity: Opportunity;
  openSlideOver: (id: number, mode?: "view" | "edit") => void;
}

const PrincipalOpportunityCard = ({
  opportunity,
  openSlideOver,
}: PrincipalOpportunityCardProps) => {
  const expectedCloseDate = opportunity.estimated_close_date
    ? parseDateSafely(opportunity.estimated_close_date)
    : null;
  const stageStatus = getStageStatus(
    opportunity.stage || "",
    opportunity.days_in_stage || 0,
    expectedCloseDate
  );
  const daysSinceLastActivity = opportunity.days_since_last_activity ?? null;

  // Status dot color
  const statusColorClass = {
    rotting: "bg-destructive",
    expired: "bg-destructive",
    warning: "bg-warning",
    healthy: "bg-success",
    closed: "bg-muted-foreground",
  }[stageStatus];

  const handleClick = () => {
    openSlideOver(opportunity.id as number, "view");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className="bg-background rounded-md border border-border p-2 space-y-1 hover:shadow-md cursor-pointer transition-shadow"
    >
      {/* Distributor */}
      <p className="text-sm font-medium truncate">
        {opportunity.distributor_organization_name || "No Distributor"}
      </p>

      {/* Operator (Customer) */}
      <p className="text-xs text-muted-foreground truncate">
        {opportunity.customer_organization_name || "No Operator"}
      </p>

      {/* Stage + Status + Days */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className={`inline-block w-2 h-2 rounded-full ${statusColorClass}`} />
          <span className="text-xs text-muted-foreground">
            {getOpportunityStageLabel(opportunity.stage || "")}
          </span>
        </div>
        {/* Days since last activity */}
        <span className="text-xs text-muted-foreground">
          {daysSinceLastActivity !== null ? `${daysSinceLastActivity}d` : "—"}
        </span>
      </div>

      {/* Past due badge if expired */}
      {stageStatus === "expired" && (
        <span className="inline-block text-[10px] bg-destructive/10 text-destructive px-1.5 py-0.5 rounded font-medium">
          Past due
        </span>
      )}
    </div>
  );
};
