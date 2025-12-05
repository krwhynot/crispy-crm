import React from "react";

interface ActivityPulseDotProps {
  daysSinceLastActivity: number | null | undefined;
}

/**
 * Activity Pulse Dot - Visual indicator for opportunity engagement recency
 *
 * Color coding (per design doc):
 * - Green (success): <7 days since last activity
 * - Yellow (warning): 7-14 days since last activity
 * - Red (destructive): >14 days since last activity
 * - Gray (muted): No activity recorded
 */
export function ActivityPulseDot({ daysSinceLastActivity }: ActivityPulseDotProps) {
  const { colorClass, label } = getActivityPulseConfig(daysSinceLastActivity);

  return (
    <span
      role="status"
      aria-label={label}
      className={`
        inline-block w-2.5 h-2.5 rounded-full flex-shrink-0
        ${colorClass}
      `}
    />
  );
}

function getActivityPulseConfig(days: number | null | undefined): {
  colorClass: string;
  label: string;
} {
  if (days === null || days === undefined) {
    return {
      colorClass: "bg-muted-foreground",
      label: "No activity recorded",
    };
  }

  if (days < 7) {
    return {
      colorClass: "bg-success",
      label: `Last activity ${days} days ago`,
    };
  }

  if (days <= 14) {
    return {
      colorClass: "bg-warning",
      label: `Last activity ${days} days ago`,
    };
  }

  return {
    colorClass: "bg-destructive",
    label: `Last activity ${days} days ago`,
  };
}
