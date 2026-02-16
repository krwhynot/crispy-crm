import { memo } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { PrincipalPipelineRow, Momentum } from "./types";

interface PipelineTableRowProps {
  row: PrincipalPipelineRow;
  onRowClick: (row: PrincipalPipelineRow) => void;
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
export const PipelineTableRow = memo(function PipelineTableRow({
  row,
  onRowClick,
}: PipelineTableRowProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onRowClick(row);
    }
  };

  return (
    <TableRow
      className="h-9 table-row-premium cursor-pointer relative hover:bg-[var(--divider-warm)]/10"
      onClick={() => onRowClick(row)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`View opportunities for ${row.name}. Pipeline momentum: ${row.momentum}`}
    >
      {/* Principal name with decay indicator */}
      <TableCell className="font-medium relative px-3 py-1.5">
        <div
          className={`absolute left-0 top-0 bottom-0 w-1.5 ${getDecayIndicatorColor(row.momentum)}`}
          aria-hidden="true"
        />
        <span className="pl-2">{row.name}</span>
      </TableCell>

      {/* Pipeline count */}
      <TableCell className="text-right px-3 py-1.5">
        <div className="font-semibold">{row.totalPipeline}</div>
      </TableCell>

      {/* This week activity with inline trend arrow */}
      <TableCell className="text-center px-3 py-1.5">
        <div className="inline-flex items-center gap-0.5">
          {row.activeThisWeek > 0 ? (
            <Badge variant="success">{row.activeThisWeek}</Badge>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
          {row.activeThisWeek > row.activeLastWeek && (
            <span className="text-xs text-[color:var(--olive-base)]" aria-label="Trending up">
              &#x25B2;
            </span>
          )}
          {row.activeThisWeek < row.activeLastWeek && (
            <span className="text-xs text-[color:var(--clay-base)]" aria-label="Trending down">
              &#x25BC;
            </span>
          )}
        </div>
      </TableCell>

      {/* Last week activity - hidden on mobile to save space */}
      <TableCell className="text-center hidden lg:table-cell px-3 py-1.5">
        {row.activeLastWeek > 0 ? (
          <Badge variant="secondary">{row.activeLastWeek}</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>

      {/* Subtle chevron indicator */}
      <TableCell className="w-8 text-right px-2 py-1.5">
        <span className="text-muted-foreground/50 text-sm" aria-hidden="true">
          &rsaquo;
        </span>
      </TableCell>
    </TableRow>
  );
});
