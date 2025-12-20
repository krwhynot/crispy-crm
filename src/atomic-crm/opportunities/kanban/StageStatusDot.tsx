import React from "react";
import type { StageStatus } from "../constants/stageThresholds";

interface StageStatusDotProps {
  /** Status derived from getStageStatus() */
  status: StageStatus;
  /** Number of days in current stage */
  daysInStage: number;
}

/**
 * StageStatusDot - Visual indicator for opportunity stage health
 *
 * Replaces ActivityPulseDot with stage-duration-based status:
 * - Red (destructive): Rotting or expired close date
 * - Yellow (warning): 75%+ of threshold
 * - Green (success): Healthy
 * - Gray (muted): Closed stages
 *
 * PRD Reference: Pipeline PRD "Status Indicator Logic" table
 */
export function StageStatusDot({ status, daysInStage }: StageStatusDotProps) {
  const { colorClass, label } = getStatusConfig(status, daysInStage);

  return (
    <span
      role="status"
      aria-label={label}
      className="inline-flex items-center gap-1.5 text-xs"
    >
      <span
        data-testid="status-dot"
        className={`inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 ${colorClass}`}
      />
      <span className="text-muted-foreground">
        {daysInStage} {daysInStage === 1 ? "day" : "days"}
      </span>
    </span>
  );
}

function getStatusConfig(
  status: StageStatus,
  daysInStage: number
): { colorClass: string; label: string } {
  const dayText = `${daysInStage} ${daysInStage === 1 ? "day" : "days"} in stage`;

  switch (status) {
    case "rotting":
      return {
        colorClass: "bg-destructive",
        label: `${dayText} - needs attention`,
      };
    case "expired":
      return {
        colorClass: "bg-destructive",
        label: `${dayText} - close date passed`,
      };
    case "warning":
      return {
        colorClass: "bg-warning",
        label: `${dayText} - approaching threshold`,
      };
    case "healthy":
      return {
        colorClass: "bg-success",
        label: `${dayText} - on track`,
      };
    case "closed":
      return {
        colorClass: "bg-muted-foreground",
        label: `${dayText} - closed`,
      };
  }
}
