// es-toolkit: Deep object equality comparison
import { isEqual } from "es-toolkit";
import { useListContext, useUpdate, useNotify, useRefresh } from "ra-core";
import { useEffect, useState, useCallback } from "react";
import {
  DragDropContext,
  type DropResult,
  type DragStart,
  type DragUpdate,
  type ResponderProvided,
} from "@hello-pangea/dnd";

import type { Opportunity } from "../../types";
import { OpportunityColumn } from "./OpportunityColumn";
import { OPPORTUNITY_STAGES_LEGACY, getOpportunityStageLabel } from "../constants/stageConstants";
import type { OpportunitiesByStage } from "../constants/stages";
import { getOpportunitiesByStage } from "../constants/stages";
import { useColumnPreferences } from "../hooks/useColumnPreferences";
import { ColumnCustomizationMenu } from "./ColumnCustomizationMenu";
import { CloseOpportunityModal } from "../components/CloseOpportunityModal";
import type { CloseOpportunityInput } from "@/atomic-crm/validation/opportunities";

interface OpportunityListContentProps {
  openSlideOver: (id: number, mode?: "view" | "edit") => void;
  /** Currently open slide-over ID (to close on delete) */
  slideOverId?: number | null;
  /** Callback to close the slide-over */
  closeSlideOver?: () => void;
}

/**
 * State for pending close modal - stores drag data while modal is open
 */
interface PendingCloseData {
  opportunityId: string;
  opportunityName: string;
  targetStage: "closed_won" | "closed_lost";
  sourceStage: string;
  previousState: OpportunitiesByStage;
  draggedItem: Opportunity;
}

export const OpportunityListContent = ({
  openSlideOver,
  slideOverId,
  closeSlideOver,
}: OpportunityListContentProps) => {
  const allOpportunityStages = OPPORTUNITY_STAGES_LEGACY;

  const { data: unorderedOpportunities, isPending, filterValues } = useListContext<Opportunity>();

  const [update] = useUpdate();
  const notify = useNotify();
  const refresh = useRefresh();

  // State for CloseOpportunityModal
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [pendingCloseData, setPendingCloseData] = useState<PendingCloseData | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  const {
    collapsedStages,
    visibleStages: userVisibleStages,
    toggleCollapse,
    toggleVisibility,
    collapseAll,
    expandAll,
  } = useColumnPreferences();

  // Filter stages based on active filter and user preferences
  const visibleStages =
    filterValues?.stage && Array.isArray(filterValues.stage) && filterValues.stage.length > 0
      ? allOpportunityStages.filter(
          (stage) =>
            filterValues.stage.includes(stage.value) && userVisibleStages.includes(stage.value)
        )
      : allOpportunityStages.filter((stage) => userVisibleStages.includes(stage.value));

  const [opportunitiesByStage, setOpportunitiesByStage] = useState<OpportunitiesByStage>(
    getOpportunitiesByStage([], allOpportunityStages)
  );

  useEffect(() => {
    if (unorderedOpportunities) {
      const newOpportunitiesByStage = getOpportunitiesByStage(
        unorderedOpportunities,
        allOpportunityStages
      );
      if (!isEqual(newOpportunitiesByStage, opportunitiesByStage)) {
        setOpportunitiesByStage(newOpportunitiesByStage);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unorderedOpportunities]);

  /**
   * Perform the actual stage update after modal confirmation (or for non-close stages)
   */
  const performStageUpdate = useCallback(
    (
      opportunityId: string,
      newStage: string,
      previousState: OpportunitiesByStage,
      draggedItem: Opportunity,
      additionalData?: Partial<CloseOpportunityInput>
    ) => {
      update(
        "opportunities",
        {
          id: opportunityId,
          data: { stage: newStage, ...additionalData },
          previousData: draggedItem,
        },
        {
          onSuccess: () => {
            notify(`Moved to ${getOpportunityStageLabel(newStage)}`, {
              type: "success",
            });
          },
          onError: () => {
            notify("Error: Could not move opportunity. Reverting.", {
              type: "warning",
            });
            setOpportunitiesByStage(previousState);
          },
        }
      );
    },
    [update, notify]
  );

  /**
   * Handle confirmation from CloseOpportunityModal
   */
  const handleCloseConfirm = useCallback(
    (data: CloseOpportunityInput) => {
      if (!pendingCloseData) return;

      setIsClosing(true);

      performStageUpdate(
        pendingCloseData.opportunityId,
        pendingCloseData.targetStage,
        pendingCloseData.previousState,
        pendingCloseData.draggedItem,
        {
          win_reason: data.win_reason,
          loss_reason: data.loss_reason,
          close_reason_notes: data.close_reason_notes,
        }
      );

      setIsClosing(false);
      setShowCloseModal(false);
      setPendingCloseData(null);
    },
    [pendingCloseData, performStageUpdate]
  );

  /**
   * Handle modal cancel - revert to previous state
   */
  const handleCloseCancel = useCallback(
    (open: boolean) => {
      if (!open && pendingCloseData) {
        // Modal was closed/cancelled - revert the optimistic update
        setOpportunitiesByStage(pendingCloseData.previousState);
        notify("Stage change cancelled", { type: "info" });
      }
      setShowCloseModal(open);
      if (!open) {
        setPendingCloseData(null);
      }
    },
    [pendingCloseData, notify]
  );

  /**
   * Handle opportunity deletion - optimistically remove from local state
   * This ensures the card is immediately removed from the Kanban board
   * without waiting for a full data refresh.
   *
   * Also closes the slide-over if the deleted opportunity was being viewed
   * to prevent stale popovers from appearing.
   */
  const handleDeleteOpportunity = useCallback(
    (opportunityId: number) => {
      // Close slide-over if viewing the deleted opportunity
      if (slideOverId === opportunityId && closeSlideOver) {
        closeSlideOver();
      }

      setOpportunitiesByStage((prevState) => {
        const newState = { ...prevState };
        // Find and remove the opportunity from whichever stage it's in
        for (const stage of Object.keys(newState)) {
          const stageOpps = newState[stage];
          const filteredOpps = stageOpps.filter((opp) => opp.id !== opportunityId);
          if (filteredOpps.length !== stageOpps.length) {
            newState[stage] = filteredOpps;
            break; // Found and removed, no need to check other stages
          }
        }
        return newState;
      });
      // Also trigger a refresh to ensure data consistency
      refresh();
    },
    [refresh, slideOverId, closeSlideOver]
  );

  const handleDragStart = useCallback(
    (start: DragStart, provided: ResponderProvided) => {
      const sourceStage = start.source.droppableId;
      const draggedItem = opportunitiesByStage[sourceStage]?.find(
        (opp) => opp.id.toString() === start.draggableId
      );

      if (draggedItem) {
        const stageName = getOpportunityStageLabel(sourceStage);
        provided.announce(`Picked up ${draggedItem.name}. Currently in ${stageName} stage.`);
      }
    },
    [opportunitiesByStage]
  );

  const handleDragUpdate = useCallback((update: DragUpdate, provided: ResponderProvided) => {
    if (update.destination) {
      const stageName = getOpportunityStageLabel(update.destination.droppableId);
      provided.announce(`Moving to ${stageName} stage, position ${update.destination.index + 1}`);
    }
  }, []);

  const handleDragEnd = (result: DropResult, provided: ResponderProvided) => {
    const { destination, source, draggableId } = result;

    // Dropped outside a valid droppable
    if (!destination) {
      provided.announce("Drag cancelled. Returned to original position.");
      return;
    }

    // Dropped in the same position
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      provided.announce("Dropped in original position.");
      return;
    }

    const sourceColId = source.droppableId;
    const destColId = destination.droppableId;

    // Store previous state for rollback on API error
    const previousState = opportunitiesByStage;

    const sourceCol = previousState[sourceColId];
    const destCol = previousState[destColId];
    const draggedItem = sourceCol.find((opp) => opp.id.toString() === draggableId);

    if (!draggedItem) {
      return;
    }

    // --- Optimistic UI Update ---
    const newOpportunitiesByStage = { ...previousState };

    // Remove item from the source column
    const newSourceCol = Array.from(sourceCol);
    newSourceCol.splice(source.index, 1);
    newOpportunitiesByStage[sourceColId] = newSourceCol;

    // Add item to the destination column
    // Note: If moving in the same column, newSourceCol already has the item removed.
    const newDestCol = sourceColId === destColId ? newSourceCol : Array.from(destCol);
    newDestCol.splice(destination.index, 0, { ...draggedItem, stage: destColId });
    newOpportunitiesByStage[destColId] = newDestCol;

    setOpportunitiesByStage(newOpportunitiesByStage);
    // --- End Optimistic UI Update ---

    // Announce successful drop
    const stageName = getOpportunityStageLabel(destColId);
    provided.announce(`Dropped in ${stageName} stage at position ${destination.index + 1}`);

    // Check if dropping into a closed stage - show modal to collect reason
    if (destColId === "closed_won" || destColId === "closed_lost") {
      setPendingCloseData({
        opportunityId: draggableId,
        opportunityName: draggedItem.name,
        targetStage: destColId,
        sourceStage: sourceColId,
        previousState,
        draggedItem,
      });
      setShowCloseModal(true);
      return; // Don't call update yet - wait for modal confirmation
    }

    // --- API Call for non-close stages ---
    performStageUpdate(draggableId, destColId, previousState, draggedItem);
  };

  if (isPending) return null;

  // Use flex column with min-h-0 and flex-1 to fill remaining height
  // Kanban board: horizontal scroll for columns, each column scrolls vertically for cards
  return (
    <div className="flex min-h-0 flex-1 flex-col h-full">
      <DragDropContext
        onDragStart={handleDragStart}
        onDragUpdate={handleDragUpdate}
        onDragEnd={handleDragEnd}
      >
        {/* Tighter layout: reduced padding p-3, smaller gap-3 between columns */}
        <div
          className="flex min-h-0 flex-1 gap-3 overflow-x-auto overflow-y-hidden p-3 bg-muted rounded-2xl border border-border shadow-inner"
          data-testid="kanban-board"
          data-tutorial="opp-kanban-board"
          role="region"
          aria-label="Opportunities pipeline board"
        >
          {visibleStages.map((stage) => (
            <OpportunityColumn
              stage={stage.value}
              opportunities={opportunitiesByStage[stage.value]}
              key={stage.value}
              isCollapsed={collapsedStages.includes(stage.value)}
              onToggleCollapse={() => toggleCollapse(stage.value)}
              openSlideOver={openSlideOver}
              onDeleteOpportunity={handleDeleteOpportunity}
            />
          ))}
          {/* Settings button at end of columns - scroll right to access */}
          <div className="flex items-start pt-1 shrink-0">
            <ColumnCustomizationMenu
              visibleStages={userVisibleStages}
              toggleVisibility={toggleVisibility}
              collapseAll={collapseAll}
              expandAll={expandAll}
            />
          </div>
        </div>
      </DragDropContext>

      {/* CloseOpportunityModal - shown when dragging to closed_won or closed_lost */}
      {pendingCloseData && (
        <CloseOpportunityModal
          open={showCloseModal}
          onOpenChange={handleCloseCancel}
          opportunityId={pendingCloseData.opportunityId}
          opportunityName={pendingCloseData.opportunityName}
          targetStage={pendingCloseData.targetStage}
          onConfirm={handleCloseConfirm}
          isSubmitting={isClosing}
        />
      )}
    </div>
  );
};
