import { useState, useCallback } from "react";
import { useNotify, useRefresh, useDataProvider } from "ra-core";
import type { Opportunity } from "../types";

export type BulkAction = "change_stage" | "change_status" | "assign_owner" | "archive" | null;

export interface UseBulkActionsStateOptions {
  selectedIds: (string | number)[];
  opportunities: Opportunity[];
  onUnselectItems: () => void;
  resource?: string;
}

export interface UseBulkActionsStateResult {
  activeAction: BulkAction;
  setActiveAction: (action: BulkAction) => void;

  selectedStage: string;
  setSelectedStage: (stage: string) => void;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
  selectedOwner: string;
  setSelectedOwner: (owner: string) => void;

  isProcessing: boolean;

  handleOpenDialog: (action: BulkAction) => void;
  handleCloseDialog: () => void;
  handleExecuteBulkAction: () => Promise<void>;
  handleBulkArchive: () => Promise<void>;
  canExecute: () => boolean;
}

export function useBulkActionsState({
  selectedIds,
  opportunities,
  onUnselectItems,
  resource = "opportunities",
}: UseBulkActionsStateOptions): UseBulkActionsStateResult {
  const [activeAction, setActiveAction] = useState<BulkAction>(null);
  const [selectedStage, setSelectedStage] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedOwner, setSelectedOwner] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  const notify = useNotify();
  const refresh = useRefresh();
  const dataProvider = useDataProvider();

  const handleOpenDialog = useCallback((action: BulkAction) => {
    setActiveAction(action);
    setSelectedStage("");
    setSelectedStatus("");
    setSelectedOwner("");
  }, []);

  const handleCloseDialog = useCallback(() => {
    setActiveAction(null);
    setSelectedStage("");
    setSelectedStatus("");
    setSelectedOwner("");
  }, []);

  const handleExecuteBulkAction = useCallback(async () => {
    if (!activeAction) return;

    setIsProcessing(true);
    let successCount = 0;
    let failureCount = 0;

    try {
      let updateData: Partial<Opportunity> = {};

      if (activeAction === "change_stage" && selectedStage) {
        updateData = { stage: selectedStage as any, stage_manual: true };
      } else if (activeAction === "change_status" && selectedStatus) {
        updateData = { status: selectedStatus as any, status_manual: true };
      } else if (activeAction === "assign_owner" && selectedOwner) {
        updateData = { opportunity_owner_id: parseInt(selectedOwner) };
      }

      for (const id of selectedIds) {
        try {
          await dataProvider.update(resource, {
            id,
            data: updateData,
            previousData: opportunities.find((opp) => opp.id === id),
          });
          successCount++;
        } catch (error) {
          console.error(`Failed to update opportunity ${id}:`, error);
          failureCount++;
        }
      }

      if (successCount > 0) {
        notify(
          `Successfully updated ${successCount} opportunit${successCount === 1 ? "y" : "ies"}`,
          {
            type: "success",
          }
        );
      }
      if (failureCount > 0) {
        notify(`Failed to update ${failureCount} opportunit${failureCount === 1 ? "y" : "ies"}`, {
          type: "error",
        });
      }

      refresh();
      onUnselectItems();
      handleCloseDialog();
    } catch (error) {
      notify("Bulk action failed", { type: "error" });
      console.error("Bulk action error:", error);
    } finally {
      setIsProcessing(false);
    }
  }, [
    activeAction,
    selectedStage,
    selectedStatus,
    selectedOwner,
    selectedIds,
    resource,
    dataProvider,
    opportunities,
    notify,
    refresh,
    onUnselectItems,
    handleCloseDialog,
  ]);

  const handleBulkArchive = useCallback(async () => {
    setIsProcessing(true);

    try {
      console.log(`[BulkArchive] Archiving ${selectedIds.length} opportunities:`, selectedIds);

      await dataProvider.deleteMany(resource, { ids: selectedIds });

      notify(
        `Successfully archived ${selectedIds.length} opportunit${selectedIds.length === 1 ? "y" : "ies"}`,
        { type: "success" }
      );

      refresh();
      onUnselectItems();
      handleCloseDialog();
    } catch (error) {
      console.error("[BulkArchive] Failed to archive opportunities:", error);
      notify(
        `Failed to archive opportunities: ${error instanceof Error ? error.message : "Unknown error"}`,
        { type: "error" }
      );
    } finally {
      setIsProcessing(false);
    }
  }, [selectedIds, resource, dataProvider, notify, refresh, onUnselectItems, handleCloseDialog]);

  const canExecute = useCallback(() => {
    if (activeAction === "change_stage") return !!selectedStage;
    if (activeAction === "change_status") return !!selectedStatus;
    if (activeAction === "assign_owner") return !!selectedOwner;
    return false;
  }, [activeAction, selectedStage, selectedStatus, selectedOwner]);

  return {
    activeAction,
    setActiveAction,
    selectedStage,
    setSelectedStage,
    selectedStatus,
    setSelectedStatus,
    selectedOwner,
    setSelectedOwner,
    isProcessing,
    handleOpenDialog,
    handleCloseDialog,
    handleExecuteBulkAction,
    handleBulkArchive,
    canExecute,
  };
}
