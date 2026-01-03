import { ClipboardList, Phone, Eye } from "lucide-react";
import type { SwipeActionsConfig, SwipeAction } from "@/components/admin/swipe-actions";
import type { Contact } from "../types";

interface ContactSwipeActionsParams {
  openSlideOver: (id: number, mode: "view" | "edit") => void;
  openQuickLogDialog: (context: { contactId: number; organizationId?: number }) => void;
}

export function createContactSwipeActions({
  openSlideOver,
  openQuickLogDialog,
}: ContactSwipeActionsParams): SwipeActionsConfig<Contact> {
  return {
    getActions: (record: Contact): SwipeAction[] => {
      const actions: SwipeAction[] = [
        { id: "log-activity", label: "Log Activity", icon: ClipboardList },
        { id: "view", label: "View", icon: Eye },
      ];

      // Insert "Call" button if phone exists (between Log and View)
      if (record.phone && record.phone.length > 0) {
        actions.splice(1, 0, { id: "call", label: "Call", icon: Phone });
      }

      return actions;
    },

    onAction: (actionId: string, record: Contact) => {
      switch (actionId) {
        case "log-activity":
          openQuickLogDialog({
            contactId: Number(record.id),
            organizationId: record.organization_id ? Number(record.organization_id) : undefined,
          });
          break;
        case "call":
          if (record.phone?.[0]?.value) {
            window.location.href = `tel:${record.phone[0].value}`;
          }
          break;
        case "view":
          openSlideOver(Number(record.id), "view");
          break;
      }
    },
  };
}
