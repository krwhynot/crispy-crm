import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useUpdate, useDelete, useNotify, useRefresh, useRecordContext } from "react-admin";
import { CloseOpportunityModal } from "../components/CloseOpportunityModal";
import type { CloseOpportunityInput } from "@/atomic-crm/validation/opportunities";
import type { Opportunity } from "../../types";

interface OpportunityCardActionsProps {
  opportunityId: number;
  onDelete?: (opportunityId: number) => void;
}

export function OpportunityCardActions({ opportunityId }: OpportunityCardActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    // Always cleanup, even if component unmounts while closed
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/opportunities/${opportunityId}/show`);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/opportunities/${opportunityId}`);
  };

  /**
   * Open the close modal with the specified target stage
   */
  const handleOpenCloseModal = useCallback(
    (e: React.MouseEvent, targetStage: "closed_won" | "closed_lost") => {
      e.stopPropagation();
      setCloseTargetStage(targetStage);
      setShowCloseModal(true);
      setIsOpen(false);
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

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this opportunity?")) {
      try {
        await deleteOne("opportunities", { id: opportunityId, previousData: {} });
        notify("Opportunity deleted", { type: "success" });
        refresh();
      } catch {
        notify("Error deleting opportunity", { type: "error" });
      }
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef} data-action-button>
      <button
        type="button"
        aria-label="Actions menu"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        onMouseDown={(e) => e.stopPropagation()} // Prevent drag
        className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded hover:bg-muted transition-colors touch-manipulation"
      >
        <svg className="w-5 h-5 text-muted-foreground" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-popover border border-border rounded-md shadow-lg z-50">
          <div className="py-1">
            <button
              onClick={handleViewDetails}
              className="w-full px-4 py-2 text-left text-sm hover:bg-accent transition-colors"
            >
              View Details
            </button>
            <button
              onClick={handleEdit}
              className="w-full px-4 py-2 text-left text-sm hover:bg-accent transition-colors"
            >
              Edit
            </button>
            <hr className="my-1 border-border" />
            <button
              onClick={(e) => handleOpenCloseModal(e, "closed_won")}
              className="w-full px-4 py-2 text-left text-sm text-success-strong hover:bg-accent transition-colors"
            >
              Mark as Won
            </button>
            <button
              onClick={(e) => handleOpenCloseModal(e, "closed_lost")}
              className="w-full px-4 py-2 text-left text-sm text-destructive hover:bg-accent transition-colors"
            >
              Mark as Lost
            </button>
            <hr className="my-1 border-border" />
            <button
              onClick={handleDelete}
              className="w-full px-4 py-2 text-left text-sm text-destructive hover:bg-accent transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      )}

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
