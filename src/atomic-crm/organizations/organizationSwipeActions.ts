import { ClipboardList, Eye } from "lucide-react";
import type { SwipeActionsConfig, SwipeAction } from "@/components/admin/swipe-actions";
import type { Organization } from "../types";

interface OrganizationSwipeActionsParams {
  openSlideOver: (id: number, mode: "view" | "edit") => void;
  openQuickLogDialog: (context: { organizationId: number }) => void;
}

export function createOrganizationSwipeActions({
  openSlideOver,
  openQuickLogDialog,
}: OrganizationSwipeActionsParams): SwipeActionsConfig<Organization> {
  return {
    getActions: (): SwipeAction[] => [
      { id: "log-activity", label: "Log Activity", icon: ClipboardList },
      { id: "view", label: "View", icon: Eye },
    ],

    onAction: (actionId: string, record: Organization) => {
      switch (actionId) {
        case "log-activity":
          openQuickLogDialog({
            organizationId: Number(record.id),
          });
          break;
        case "view":
          openSlideOver(Number(record.id), "view");
          break;
      }
    },
  };
}
