import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Archive, ArchiveRestore } from "lucide-react";
import { useDataProvider, useNotify, useRedirect } from "react-admin";

import { opportunityKeys } from "../queryKeys";

import { AdminButton } from "@/components/admin/AdminButton";
import { OpportunitiesService } from "../services";
import type { ExtendedDataProvider } from "../providers/supabase/extensions/types";
import type { Opportunity } from "../types";
import { TOUCH_TARGET_MIN_HEIGHT } from "./constants";

export interface ArchiveActionsProps {
  record?: Opportunity;
}

export const ArchiveButton = ({ record }: ArchiveActionsProps) => {
  const dataProvider = useDataProvider();
  const redirect = useRedirect();
  const notify = useNotify();
  const queryClient = useQueryClient();

  // Create service instance for mutation (React Hooks must be called unconditionally)
  const opportunitiesService = new OpportunitiesService(dataProvider as ExtendedDataProvider);

  const { mutate, isPending } = useMutation({
    mutationFn: () => {
      if (!record) throw new Error("No record to archive");
      return opportunitiesService.archiveOpportunity(record);
    },
    onSuccess: () => {
      redirect("list", "opportunities");
      notify("Opportunity archived", { type: "info", undoable: false });
      queryClient.invalidateQueries({ queryKey: opportunityKeys.all });
    },
    onError: () => {
      notify("Error: opportunity not archived", { type: "error" });
    },
  });

  if (!record) return null;

  const handleClick = () => {
    mutate();
  };

  return (
    <AdminButton
      onClick={handleClick}
      size="sm"
      variant="outline"
      disabled={isPending}
      className={`flex items-center gap-2 ${TOUCH_TARGET_MIN_HEIGHT}`}
    >
      <Archive className="w-4 h-4" />
      {isPending ? "Archiving..." : "Archive"}
    </AdminButton>
  );
};

export const UnarchiveButton = ({ record }: ArchiveActionsProps) => {
  const dataProvider = useDataProvider();
  const redirect = useRedirect();
  const notify = useNotify();
  const queryClient = useQueryClient();

  // Create service instance for mutation (React Hooks must be called unconditionally)
  const opportunitiesService = new OpportunitiesService(dataProvider as ExtendedDataProvider);

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
      queryClient.invalidateQueries({ queryKey: opportunityKeys.all });
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
    <AdminButton
      onClick={handleClick}
      size="sm"
      variant="outline"
      className={`flex items-center gap-2 ${TOUCH_TARGET_MIN_HEIGHT}`}
    >
      <ArchiveRestore className="w-4 h-4" />
      Send back to the board
    </AdminButton>
  );
};
