import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Archive, ArchiveRestore } from "lucide-react";
import { useDataProvider, useNotify, useRedirect, useUpdate } from "react-admin";

import { opportunityKeys } from "../../queryKeys";

import { Button } from "@/components/ui/button";
import { OpportunitiesService } from "../../services";
import type { Opportunity } from "../../types";
import { TOUCH_TARGET_MIN_HEIGHT } from "../constants";

export interface ArchiveActionsProps {
  record?: Opportunity;
}

export const ArchiveButton = ({ record }: ArchiveActionsProps) => {
  const [update] = useUpdate();
  const redirect = useRedirect();
  const notify = useNotify();
  const queryClient = useQueryClient();

  if (!record) return null;

  const handleClick = () => {
    update(
      "opportunities",
      {
        id: record.id,
        data: { deleted_at: new Date().toISOString() },
        previousData: record,
      },
      {
        onSuccess: () => {
          redirect("list", "opportunities");
          notify("Opportunity archived", { type: "info", undoable: false });
          refresh();
        },
        onError: () => {
          notify("Error: opportunity not archived", { type: "error" });
        },
      }
    );
  };

  return (
    <Button
      onClick={handleClick}
      size="sm"
      variant="outline"
      className={`flex items-center gap-2 ${TOUCH_TARGET_MIN_HEIGHT}`}
    >
      <Archive className="w-4 h-4" />
      Archive
    </Button>
  );
};

export const UnarchiveButton = ({ record }: ArchiveActionsProps) => {
  const dataProvider = useDataProvider();
  const redirect = useRedirect();
  const notify = useNotify();
  const refresh = useRefresh();

  // Create service instance for mutation (React Hooks must be called unconditionally)
  const opportunitiesService = new OpportunitiesService(dataProvider);

  const { mutate } = useMutation({
    mutationFn: () => {
      if (!record) throw new Error("No record to unarchive");
      return opportunitiesService.unarchiveOpportunity(record);
    },
    onSuccess: () => {
      redirect("list", "opportunities");
      notify("Opportunity unarchived", {
        type: "info",
        undoable: false,
      });
      refresh();
    },
    onError: () => {
      notify("Error: opportunity not unarchived", { type: "error" });
    },
  });

  if (!record) return null;

  const handleClick = () => {
    mutate();
  };

  return (
    <Button
      onClick={handleClick}
      size="sm"
      variant="outline"
      className={`flex items-center gap-2 ${TOUCH_TARGET_MIN_HEIGHT}`}
    >
      <ArchiveRestore className="w-4 h-4" />
      Send back to the board
    </Button>
  );
};
