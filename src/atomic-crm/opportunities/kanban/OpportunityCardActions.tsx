import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useUpdate, useDelete, useNotify, useRefresh, useRecordContext } from "react-admin";
import { MoreVertical, Eye, Pencil, Trophy, XCircle, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CloseOpportunityModal } from "../components/CloseOpportunityModal";
import type { CloseOpportunityInput } from "@/atomic-crm/validation/opportunities";
import type { Opportunity } from "../../types";

interface OpportunityCardActionsProps {
  opportunityId: number;
  onDelete?: (opportunityId: number) => void;
}

export function OpportunityCardActions({ opportunityId, onDelete }: OpportunityCardActionsProps) {
  const navigate = useNavigate();
  const [update] = useUpdate();
  const [deleteOne] = useDelete();
  const notify = useNotify();
  const refresh = useRefresh();
  const record = useRecordContext<Opportunity>();

  // State for CloseOpportunityModal
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeTargetStage, setCloseTargetStage] = useState<"closed_won" | "closed_lost">(
    "closed_won"
  );
  const [isClosing, setIsClosing] = useState(false);

  const handleViewDetails = useCallback(() => {
    navigate(`/opportunities/${opportunityId}/show`);
  }, [navigate, opportunityId]);

  const handleEdit = useCallback(() => {
    navigate(`/opportunities/${opportunityId}`);
  }, [navigate, opportunityId]);

  /**
   * Open the close modal with the specified target stage
   */
  const handleOpenCloseModal = useCallback(
    (targetStage: "closed_won" | "closed_lost") => {
      setCloseTargetStage(targetStage);
      setShowCloseModal(true);
    },
    []
  );

  /**
   * Handle confirmation from CloseOpportunityModal
   */
  const handleCloseConfirm = useCallback(
    async (data: CloseOpportunityInput) => {
      setIsClosing(true);
      try {
        await update("opportunities", {
          id: opportunityId,
          data: {
            stage: closeTargetStage,
            win_reason: data.win_reason,
            loss_reason: data.loss_reason,
            close_reason_notes: data.close_reason_notes,
          },
          previousData: record || {},
        });
        notify(
          closeTargetStage === "closed_won"
            ? "Opportunity marked as won"
            : "Opportunity marked as lost",
          { type: "success" }
        );
        refresh();
        setShowCloseModal(false);
      } catch {
        notify("Error updating opportunity", { type: "error" });
      } finally {
        setIsClosing(false);
      }
    },
    [opportunityId, closeTargetStage, update, notify, refresh, record]
  );

  /**
   * Handle modal open state change (for cancel/close)
   */
  const handleCloseModalOpenChange = useCallback((open: boolean) => {
    setShowCloseModal(open);
  }, []);

  const handleDelete = useCallback(async () => {
    if (window.confirm("Are you sure you want to delete this opportunity?")) {
      try {
        await deleteOne("opportunities", { id: opportunityId, previousData: {} });
        notify("Opportunity deleted", { type: "success" });
        // Optimistically remove from local state if callback provided (Kanban)
        // Otherwise fall back to refresh (other contexts like List view)
        if (onDelete) {
          onDelete(opportunityId);
        } else {
          refresh();
        }
      } catch {
        notify("Error deleting opportunity", { type: "error" });
      }
    }
  }, [deleteOne, opportunityId, notify, onDelete, refresh]);

  return (
    <div data-action-button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Actions menu"
            onMouseDown={(e) => e.stopPropagation()} // Prevent drag
            onClick={(e) => e.stopPropagation()} // Prevent card click
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded hover:bg-muted transition-colors touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <MoreVertical className="w-5 h-5 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={handleViewDetails}>
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => handleOpenCloseModal("closed_won")}
            className="text-success-strong focus:text-success-strong"
          >
            <Trophy className="mr-2 h-4 w-4" />
            Mark as Won
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleOpenCloseModal("closed_lost")}
            variant="destructive"
          >
            <XCircle className="mr-2 h-4 w-4" />
            Mark as Lost
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleDelete} variant="destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* CloseOpportunityModal - shown when clicking Mark as Won/Lost */}
      <CloseOpportunityModal
        open={showCloseModal}
        onOpenChange={handleCloseModalOpenChange}
        opportunityId={opportunityId}
        opportunityName={record?.name || "Opportunity"}
        targetStage={closeTargetStage}
        onConfirm={handleCloseConfirm}
        isSubmitting={isClosing}
      />
    </div>
  );
}
