import React from "react";
import type { StageStatus } from "../constants";

interface StageStatusDotProps {
  /** Status derived from getStageStatus() */
  status: StageStatus;
  /** Days since last activity - primary display value (user requirement F) */
  daysSinceLastActivity: number | null;
  /** Number of days in current stage - kept for aria-label context */
  daysInStage?: number;
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
export function StageStatusDot({
  status,
  daysSinceLastActivity,
  daysInStage,
}: StageStatusDotProps) {
  // Override to warning when no activity recorded - signals attention needed
  const effectiveStatus = daysSinceLastActivity === null ? "warning" : status;
  const { colorClass, label } = getStatusConfig(
    effectiveStatus,
    daysInStage ?? 0,
    daysSinceLastActivity === null
  );

  // Display "X days" for last activity, "No activity" when null
  const displayText =
    daysSinceLastActivity !== null
      ? `${daysSinceLastActivity} ${daysSinceLastActivity === 1 ? "day" : "days"}`
      : "No activity";

  return (
    <span
      role="status"
      aria-label={`Last activity: ${displayText}. ${label}`}
      className="inline-flex items-center gap-1.5 text-xs"
    >
      <span
        data-testid="status-dot"
        className={`inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 ${colorClass}`}
      />
      <span className="text-muted-foreground">{displayText}</span>
    </span>
  );
}

function getStatusConfig(
  status: StageStatus,
  daysInStage: number,
  noActivityRecorded = false
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
        label: noActivityRecorded
          ? "No activity recorded - needs attention"
          : `${dayText} - approaching threshold`,
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
