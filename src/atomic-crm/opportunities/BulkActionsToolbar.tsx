import { useGetList } from "ra-core";
import { Button } from "@/components/ui/button";
import { useBulkActionsState } from "./useBulkActionsState";
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
import {
  CheckCircle2,
  XCircle,
  Layers,
  CircleDot,
  UserPlus,
  Download,
  Archive,
  AlertTriangle,
} from "lucide-react";
import type { Opportunity } from "../types";
import {
  OPPORTUNITY_STAGES,
  getOpportunityStageLabel,
  getOpportunityStageColor,
} from "./constants";
import { useExportOpportunities } from "./useExportOpportunities";

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

export const BulkActionsToolbar = ({
  selectedIds,
  opportunities,
  onUnselectItems,
}: BulkActionsToolbarProps) => {
  const {
    activeAction,
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
  } = useBulkActionsState({
    selectedIds,
    opportunities,
    onUnselectItems,
  });
  const { exportToCSV } = useExportOpportunities();

  // Fetch sales list for owner assignment
  const { data: salesList } = useGetList("sales", {
    pagination: { page: 1, perPage: 100 },
    sort: { field: "last_name", order: "ASC" },
  });

  // Get selected opportunities
  const selectedOpportunities = opportunities.filter((opp) => selectedIds.includes(opp.id));

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
          onClick={() => handleOpenDialog("change_stage")}
          className="h-11 gap-2 touch-manipulation"
        >
          <Layers className="h-4 w-4" />
          Change Stage
        </Button>

        <Button
          variant="outline"
          onClick={() => handleOpenDialog("change_status")}
          className="h-11 gap-2 touch-manipulation"
        >
          <CircleDot className="h-4 w-4" />
          Change Status
        </Button>

        <Button
          variant="outline"
          onClick={() => handleOpenDialog("assign_owner")}
          className="h-11 gap-2 touch-manipulation"
        >
          <UserPlus className="h-4 w-4" />
          Assign Owner
        </Button>

        {/* Destructive actions - right side */}
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="default"
            onClick={handleExport}
            className="h-11 gap-2 touch-manipulation"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button
            variant="destructive"
            onClick={() => handleOpenDialog("archive")}
            className="h-11 gap-2 touch-manipulation"
          >
            <Archive className="h-4 w-4" />
            Archive Selected
          </Button>
        </div>
      </div>

      {/* Change Stage Dialog */}
      <Dialog
        open={activeAction === "change_stage"}
        onOpenChange={(open) => !open && handleCloseDialog()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Stage</DialogTitle>
            <DialogDescription>
              Update the stage for {selectedIds.length} selected opportunit
              {selectedIds.length === 1 ? "y" : "ies"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Show affected opportunities */}
            <div className="rounded-lg border border-border bg-muted/50 p-3 max-h-40 overflow-y-auto">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Affected opportunities:
              </p>
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
              <label htmlFor="bulk-stage-select" className="text-sm font-medium">
                New Stage
              </label>
              <Select value={selectedStage} onValueChange={setSelectedStage}>
                <SelectTrigger id="bulk-stage-select">
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
      <Dialog
        open={activeAction === "change_status"}
        onOpenChange={(open) => !open && handleCloseDialog()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Status</DialogTitle>
            <DialogDescription>
              Update the status for {selectedIds.length} selected opportunit
              {selectedIds.length === 1 ? "y" : "ies"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Show affected opportunities */}
            <div className="rounded-lg border border-border bg-muted/50 p-3 max-h-40 overflow-y-auto">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Affected opportunities:
              </p>
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
              <label htmlFor="bulk-status-select" className="text-sm font-medium">
                New Status
              </label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger id="bulk-status-select">
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
      <Dialog
        open={activeAction === "assign_owner"}
        onOpenChange={(open) => !open && handleCloseDialog()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Owner</DialogTitle>
            <DialogDescription>
              Assign an owner to {selectedIds.length} selected opportunit
              {selectedIds.length === 1 ? "y" : "ies"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Show affected opportunities */}
            <div className="rounded-lg border border-border bg-muted/50 p-3 max-h-40 overflow-y-auto">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Affected opportunities:
              </p>
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
              <label htmlFor="bulk-owner-select" className="text-sm font-medium">
                New Owner
              </label>
              <Select value={selectedOwner} onValueChange={setSelectedOwner}>
                <SelectTrigger id="bulk-owner-select">
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

      {/* Archive Confirmation Dialog */}
      <Dialog
        open={activeAction === "archive"}
        onOpenChange={(open) => !open && handleCloseDialog()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Archive Opportunities
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to archive {selectedIds.length} opportunit
              {selectedIds.length === 1 ? "y" : "ies"}? Archived opportunities can be restored
              later.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Warning message */}
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3">
              <p className="text-sm text-destructive">
                <strong>Note:</strong> Archived opportunities will be hidden from the main list but
                remain in the database. You can view and restore them from the archived view.
              </p>
            </div>

            {/* Show affected opportunities */}
            <div className="rounded-lg border border-border bg-muted/50 p-3 max-h-40 overflow-y-auto">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Opportunities to archive:
              </p>
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
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog} disabled={isProcessing}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBulkArchive} disabled={isProcessing}>
              {isProcessing
                ? "Archiving..."
                : `Archive ${selectedIds.length} Opportunit${selectedIds.length === 1 ? "y" : "ies"}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
