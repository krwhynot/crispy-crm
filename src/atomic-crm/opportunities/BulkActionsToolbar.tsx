import { useState } from "react";
import { useNotify, useRefresh, useDataProvider, useGetList } from "ra-core";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Layers, CircleDot, UserPlus, Download } from "lucide-react";
import type { Opportunity } from "../types";
import { OPPORTUNITY_STAGES, getOpportunityStageLabel, getOpportunityStageColor } from "./stageConstants";
import { useExportOpportunities } from "./hooks/useExportOpportunities";

type BulkAction = "change_stage" | "change_status" | "assign_owner" | null;

interface BulkActionsToolbarProps {
  selectedIds: (string | number)[];
  opportunities: Opportunity[];
  onUnselectItems: () => void;
}

const STATUS_OPTIONS = [
  { value: "active", label: "Active", icon: CheckCircle2, variant: "default" as const },
  { value: "on_hold", label: "On Hold", icon: CircleDot, variant: "secondary" as const },
  { value: "nurturing", label: "Nurturing", icon: CircleDot, variant: "secondary" as const },
  { value: "stalled", label: "Stalled", icon: XCircle, variant: "outline" as const },
  { value: "expired", label: "Expired", icon: XCircle, variant: "destructive" as const },
];

export const BulkActionsToolbar = ({ selectedIds, opportunities, onUnselectItems }: BulkActionsToolbarProps) => {
  const [activeAction, setActiveAction] = useState<BulkAction>(null);
  const [selectedStage, setSelectedStage] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedOwner, setSelectedOwner] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  const notify = useNotify();
  const refresh = useRefresh();
  const dataProvider = useDataProvider();
  const { exportToCSV } = useExportOpportunities();

  // Fetch sales list for owner assignment
  const { data: salesList } = useGetList("sales", {
    pagination: { page: 1, perPage: 100 },
    sort: { field: "last_name", order: "ASC" },
  });

  // Get selected opportunities
  const selectedOpportunities = opportunities.filter((opp) => selectedIds.includes(opp.id));

  const handleOpenDialog = (action: BulkAction) => {
    setActiveAction(action);
    setSelectedStage("");
    setSelectedStatus("");
    setSelectedOwner("");
  };

  const handleCloseDialog = () => {
    setActiveAction(null);
    setSelectedStage("");
    setSelectedStatus("");
    setSelectedOwner("");
  };

  const handleExecuteBulkAction = async () => {
    if (!activeAction) return;

    setIsProcessing(true);
    let successCount = 0;
    let failureCount = 0;

    try {
      // Determine what field to update based on action
      let updateData: Partial<Opportunity> = {};

      if (activeAction === "change_stage" && selectedStage) {
        updateData = { stage: selectedStage as any, stage_manual: true };
      } else if (activeAction === "change_status" && selectedStatus) {
        updateData = { status: selectedStatus as any, status_manual: true };
      } else if (activeAction === "assign_owner" && selectedOwner) {
        updateData = { opportunity_owner_id: parseInt(selectedOwner) };
      }

      // Execute bulk update for each selected opportunity
      for (const id of selectedIds) {
        try {
          await dataProvider.update("opportunities", {
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

      // Show results
      if (successCount > 0) {
        notify(`Successfully updated ${successCount} opportunit${successCount === 1 ? 'y' : 'ies'}`, {
          type: "success",
        });
      }
      if (failureCount > 0) {
        notify(`Failed to update ${failureCount} opportunit${failureCount === 1 ? 'y' : 'ies'}`, {
          type: "error",
        });
      }

      // Refresh list and clear selection
      refresh();
      onUnselectItems();
      handleCloseDialog();
    } catch (error) {
      notify("Bulk action failed", { type: "error" });
      console.error("Bulk action error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const canExecute = () => {
    if (activeAction === "change_stage") return !!selectedStage;
    if (activeAction === "change_status") return !!selectedStatus;
    if (activeAction === "assign_owner") return !!selectedOwner;
    return false;
  };

  const handleExport = () => {
    exportToCSV(selectedOpportunities);
  };

  if (selectedIds.length === 0) return null;

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/30 px-4 py-3">
        <span className="text-sm font-medium text-muted-foreground">Bulk Actions:</span>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handleOpenDialog("change_stage")}
          className="gap-2"
        >
          <Layers className="h-4 w-4" />
          Change Stage
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handleOpenDialog("change_status")}
          className="gap-2"
        >
          <CircleDot className="h-4 w-4" />
          Change Status
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handleOpenDialog("assign_owner")}
          className="gap-2"
        >
          <UserPlus className="h-4 w-4" />
          Assign Owner
        </Button>

        {/* Export button */}
        <div className="ml-auto">
          <Button
            variant="default"
            size="sm"
            onClick={handleExport}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Change Stage Dialog */}
      <Dialog open={activeAction === "change_stage"} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Stage</DialogTitle>
            <DialogDescription>
              Update the stage for {selectedIds.length} selected opportunit{selectedIds.length === 1 ? 'y' : 'ies'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Show affected opportunities */}
            <div className="rounded-lg border border-border bg-muted/50 p-3 max-h-40 overflow-y-auto">
              <p className="text-xs font-medium text-muted-foreground mb-2">Affected opportunities:</p>
              <div className="space-y-1">
                {selectedOpportunities.map((opp) => (
                  <div key={opp.id} className="text-sm flex items-center justify-between">
                    <span className="truncate">{opp.name}</span>
                    <Badge
                      className="ml-2 text-xs shrink-0"
                      style={{ backgroundColor: getOpportunityStageColor(opp.stage) }}
                    >
                      {getOpportunityStageLabel(opp.stage)}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Stage selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">New Stage</label>
              <Select value={selectedStage} onValueChange={setSelectedStage}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a stage" />
                </SelectTrigger>
                <SelectContent>
                  {OPPORTUNITY_STAGES.map((stage) => (
                    <SelectItem key={stage.value} value={stage.value}>
                      {stage.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog} disabled={isProcessing}>
              Cancel
            </Button>
            <Button onClick={handleExecuteBulkAction} disabled={!canExecute() || isProcessing}>
              {isProcessing ? "Updating..." : "Update Stage"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Status Dialog */}
      <Dialog open={activeAction === "change_status"} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Status</DialogTitle>
            <DialogDescription>
              Update the status for {selectedIds.length} selected opportunit{selectedIds.length === 1 ? 'y' : 'ies'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Show affected opportunities */}
            <div className="rounded-lg border border-border bg-muted/50 p-3 max-h-40 overflow-y-auto">
              <p className="text-xs font-medium text-muted-foreground mb-2">Affected opportunities:</p>
              <div className="space-y-1">
                {selectedOpportunities.map((opp) => (
                  <div key={opp.id} className="text-sm flex items-center justify-between">
                    <span className="truncate">{opp.name}</span>
                    <Badge variant="secondary" className="ml-2 text-xs shrink-0">
                      {opp.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Status selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">New Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog} disabled={isProcessing}>
              Cancel
            </Button>
            <Button onClick={handleExecuteBulkAction} disabled={!canExecute() || isProcessing}>
              {isProcessing ? "Updating..." : "Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Owner Dialog */}
      <Dialog open={activeAction === "assign_owner"} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Owner</DialogTitle>
            <DialogDescription>
              Assign an owner to {selectedIds.length} selected opportunit{selectedIds.length === 1 ? 'y' : 'ies'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Show affected opportunities */}
            <div className="rounded-lg border border-border bg-muted/50 p-3 max-h-40 overflow-y-auto">
              <p className="text-xs font-medium text-muted-foreground mb-2">Affected opportunities:</p>
              <div className="space-y-1">
                {selectedOpportunities.map((opp) => (
                  <div key={opp.id} className="text-sm">
                    {opp.name}
                  </div>
                ))}
              </div>
            </div>

            {/* Owner selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">New Owner</label>
              <Select value={selectedOwner} onValueChange={setSelectedOwner}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an owner" />
                </SelectTrigger>
                <SelectContent>
                  {salesList?.map((sales) => (
                    <SelectItem key={sales.id} value={String(sales.id)}>
                      {sales.first_name} {sales.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog} disabled={isProcessing}>
              Cancel
            </Button>
            <Button onClick={handleExecuteBulkAction} disabled={!canExecute() || isProcessing}>
              {isProcessing ? "Assigning..." : "Assign Owner"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
