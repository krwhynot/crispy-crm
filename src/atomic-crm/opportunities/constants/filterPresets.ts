/**
 * Filter Presets for Opportunities List
 *
 * Defines quick-access filter presets that can be applied as one-click shortcuts
 * in the opportunities list toolbar.
 */

import { addDays } from "date-fns";
import { STAGE } from "./stageConstants";

export interface FilterPreset {
  id: string;
  label: string;
  description: string;
  icon?: string; // lucide-react icon name
  filters: Record<string, any>;
}

/**
 * Get filter preset configurations
 * @param userId - Current user ID for "My Opportunities" filter
 */
export const getFilterPresets = (userId?: string): FilterPreset[] => {
  const today = new Date();
  const thirtyDaysFromNow = addDays(today, 30);

  return [
    {
      id: "my-opportunities",
      label: "My Opportunities",
      description: "Opportunities I manage",
      icon: "User",
      filters: {
        opportunity_owner_id: userId,
      },
    },
    {
      id: "closing-this-month",
      label: "Closing This Month",
      description: "Opportunities with expected close date within 30 days",
      icon: "Calendar",
      filters: {
        estimated_close_date_gte: today.toISOString().split("T")[0],
        estimated_close_date_lte: thirtyDaysFromNow.toISOString().split("T")[0],
      },
    },
    {
      id: "high-priority",
      label: "High Priority",
      description: "Critical and high priority opportunities",
      icon: "AlertCircle",
      filters: {
        priority: ["high", "critical"],
      },
    },
    {
      id: "needs-action",
      label: "Needs Action",
      description: "Opportunities with overdue or upcoming actions",
      icon: "Flag",
      filters: {
        next_action_date_lte: today.toISOString().split("T")[0],
      },
    },
    {
      id: "recent-wins",
      label: "Recent Wins",
      description: "Opportunities closed won in the last 30 days",
      icon: "Trophy",
      filters: {
        stage: STAGE.CLOSED_WON,
        updated_at_gte: addDays(today, -30).toISOString().split("T")[0],
      },
    },
  ];
};
