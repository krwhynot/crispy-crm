import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, AlertCircle } from "lucide-react";
import type { PrincipalPipelineRow, Momentum } from "../types";

interface PipelineTableRowProps {
  row: PrincipalPipelineRow;
  onRowClick: (row: PrincipalPipelineRow) => void;
}

/**
 * Renders the momentum indicator icon based on pipeline health state.
 *
 * Icon mapping (from healthiest to most critical):
 * - increasing: green up arrow - actively engaged, growing pipeline
 * - steady: gray minus - stable but not growing
 * - decreasing: amber down arrow - attention needed
 * - stale: red alert - critical, needs immediate action
 */
function MomentumIcon({ momentum }: { momentum: Momentum }) {
  switch (momentum) {
    case "increasing":
      return <TrendingUp className="h-4 w-4 text-success" />;
    case "decreasing":
      return <TrendingDown className="h-4 w-4 text-warning" />;
    case "steady":
      return <Minus className="h-4 w-4 text-muted-foreground" />;
    case "stale":
      return <AlertCircle className="h-4 w-4 text-destructive" />;
  }
}

/**
 * Returns the semantic background color class for the decay indicator bar.
 * Maps momentum state to visual urgency using design system tokens.
 */
function getDecayIndicatorColor(momentum: Momentum): string {
  switch (momentum) {
    case "increasing":
      return "bg-success";
    case "steady":
      return "bg-muted-foreground/50";
    case "decreasing":
      return "bg-warning";
    case "stale":
      return "bg-destructive";
  }
}

/**
 * PipelineTableRow - Single row in the Principal Pipeline Table
 *
 * Displays principal pipeline metrics with:
 * - Leading edge decay indicator bar (4px colored bar showing health)
 * - Pipeline count and activity badges
 * - Momentum icon with label
 * - Next action preview
 *
 * Accessibility: Fully keyboard navigable (Enter/Space to activate)
 */
export function PipelineTableRow({ row, onRowClick }: PipelineTableRowProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onRowClick(row);
    }
  };

  return (
    <TableRow
      className="table-row-premium cursor-pointer relative h-11 min-h-[44px]"
      onClick={() => onRowClick(row)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`View opportunities for ${row.name}. Pipeline momentum: ${row.momentum}`}
    >
      {/* Principal name with decay indicator */}
      <TableCell className="font-medium relative">
        <div
          className={`absolute left-0 top-0 bottom-0 w-1 ${getDecayIndicatorColor(row.momentum)}`}
          aria-hidden="true"
        />
        <span className="pl-2">{row.name}</span>
      </TableCell>

      {/* Pipeline count */}
      <TableCell className="text-right">
        <div className="font-semibold">{row.totalPipeline}</div>
      </TableCell>

      {/* This week activity */}
      <TableCell className="text-center">
        {row.activeThisWeek > 0 ? (
          <Badge variant="default" className="bg-success">
            {row.activeThisWeek}
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>

      {/* Last week activity - hidden on mobile to save space */}
      <TableCell className="text-center hidden lg:table-cell">
        {row.activeLastWeek > 0 ? (
          <Badge variant="secondary">{row.activeLastWeek}</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>

      {/* Momentum indicator */}
      <TableCell>
        <div className="flex items-center gap-1">
          <MomentumIcon momentum={row.momentum} />
          <span className="text-sm capitalize">{row.momentum}</span>
        </div>
      </TableCell>

      {/* Next action - truncate with tooltip for long text */}
      <TableCell className="max-w-[200px] lg:max-w-[280px]">
        {row.nextAction ? (
          <span className="text-sm text-foreground block truncate" title={row.nextAction}>
            {row.nextAction}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground italic">No action scheduled</span>
        )}
      </TableCell>
    </TableRow>
  );
}
