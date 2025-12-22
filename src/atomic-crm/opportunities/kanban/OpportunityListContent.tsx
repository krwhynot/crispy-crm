// es-toolkit: Deep object equality comparison
import { isEqual } from "es-toolkit";
import { useListContext, useUpdate, useNotify, useRefresh } from "ra-core";
import { useEffect, useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  pointerWithin,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
  type CollisionDetection,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";

import type { Opportunity } from "../../types";
import { OpportunityColumn } from "./OpportunityColumn";
import { OPPORTUNITY_STAGES_LEGACY, getOpportunityStageLabel } from "../constants/stageConstants";
import type { OpportunitiesByStage } from "../constants/stages";
import { getOpportunitiesByStage } from "../constants/stages";
import { useColumnPreferences } from "../hooks/useColumnPreferences";
import { ColumnCustomizationMenu } from "./ColumnCustomizationMenu";
import { CloseOpportunityModal } from "../components/CloseOpportunityModal";
import type { CloseOpportunityInput } from "@/atomic-crm/validation/opportunities";
import { OpportunityCard } from "./OpportunityCard";

interface OpportunityListContentProps {
  openSlideOver: (id: number, mode?: "view" | "edit") => void;
  /** Currently open slide-over ID (to close on delete) */
  slideOverId?: number | null;
  /** Callback to close the slide-over */
  closeSlideOver?: () => void;
}

/**
 * Custom collision detection that prioritizes pointer position.
 *
 * 1. First tries `pointerWithin` - checks if pointer is inside a droppable
 * 2. Falls back to `rectIntersection` - checks if dragged element overlaps droppables
 * 3. Finally falls back to `closestCorners` for keyboard navigation
 *
 * This solves issues where `closestCorners` alone fails to detect collisions
 * in nested scrollable containers.
 */
const customCollisionDetection: CollisionDetection = (args) => {
  // First, check if pointer is directly within a droppable
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) {
    return pointerCollisions;
  }

  // Fall back to rectangle intersection (more tolerant)
  const rectCollisions = rectIntersection(args);
  if (rectCollisions.length > 0) {
    return rectCollisions;
  }

  // Final fallback to closestCorners (useful for keyboard navigation)
  return closestCorners(args);
};

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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const [activeId, setActiveId] = useState<string | null>(null);
  // NOTE: activeOpportunity moved after opportunitiesByStage declaration to avoid TDZ error

  const {
    collapsedStages,
    visibleStages: userVisibleStages,
    toggleCollapse,
    toggleVisibility,
    collapseAll,
    expandAll,
    resetPreferences,
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

  // Find active opportunity for DragOverlay (must be after opportunitiesByStage declaration)
  const activeOpportunity = activeId
    ? Object.values(opportunitiesByStage).flat().find(o => String(o.id) === activeId)
    : null;

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

  /**
   * Handle new opportunity creation - optimistically add to local state
   * This ensures the card appears immediately in the Kanban board
   * without waiting for the full data refresh to complete.
   *
   * The refresh() call in QuickAddOpportunity will eventually sync with
   * server data (including computed fields like principal_organization_name).
   */
  const handleOpportunityCreated = useCallback(
    (opportunity: Opportunity) => {
      setOpportunitiesByStage((prevState) => {
        const stage = opportunity.stage;
        if (!stage || !prevState[stage]) {
          // If stage is invalid or not in our stages, don't add
          // (will be picked up on refresh)
          console.warn(`[Kanban] New opportunity has invalid stage: ${stage}`);
          return prevState;
        }

        const newState = { ...prevState };
        // Add new opportunity at the START of the stage array (newest first)
        // The refresh will later apply proper sorting
        newState[stage] = [opportunity, ...prevState[stage]];
        return newState;
      });
    },
    []
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragOver = useCallback((_event: DragOverEvent) => {}, []);

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    setActiveId(null);

    // Dropped outside a valid droppable
    if (!over) {
      return;
    }

    const draggableId = String(active.id);

    // Find source stage by searching opportunitiesByStage
    let sourceColId: string | null = null;
    let sourceIndex = -1;
    for (const [stageId, opportunities] of Object.entries(opportunitiesByStage)) {
      const index = opportunities.findIndex((opp) => String(opp.id) === draggableId);
      if (index !== -1) {
        sourceColId = stageId;
        sourceIndex = index;
        break;
      }
    }

    if (!sourceColId || sourceIndex === -1) {
      return;
    }

    // Determine destination from over.id (could be stage ID or opportunity ID)
    let destColId: string | null = null;
    let destIndex = 0;

    // Check if over.id is a stage ID
    if (opportunitiesByStage[String(over.id)]) {
      destColId = String(over.id);
      destIndex = opportunitiesByStage[destColId].length; // Add to end
    } else {
      // over.id is an opportunity ID - find which stage it's in
      for (const [stageId, opportunities] of Object.entries(opportunitiesByStage)) {
        const index = opportunities.findIndex((opp) => String(opp.id) === String(over.id));
        if (index !== -1) {
          destColId = stageId;
          destIndex = index;
          break;
        }
      }
    }

    if (!destColId) {
      return;
    }

    // Dropped in the same position
    if (destColId === sourceColId && destIndex === sourceIndex) {
      return;
    }

    // Store previous state for rollback on API error
    const previousState = opportunitiesByStage;

    const sourceCol = previousState[sourceColId];
    const destCol = previousState[destColId];
    const draggedItem = sourceCol.find((opp) => String(opp.id) === draggableId);

    if (!draggedItem) {
      return;
    }

    // --- Optimistic UI Update ---
    const newOpportunitiesByStage = { ...previousState };

    // Remove item from the source column
    const newSourceCol = Array.from(sourceCol);
    newSourceCol.splice(sourceIndex, 1);
    newOpportunitiesByStage[sourceColId] = newSourceCol;

    // Add item to the destination column
    // Note: If moving in the same column, newSourceCol already has the item removed.
    const newDestCol = sourceColId === destColId ? newSourceCol : Array.from(destCol);
    newDestCol.splice(destIndex, 0, { ...draggedItem, stage: destColId });
    newOpportunitiesByStage[destColId] = newDestCol;

    setOpportunitiesByStage(newOpportunitiesByStage);
    // --- End Optimistic UI Update ---

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
  }, [opportunitiesByStage, performStageUpdate]);

  const announcements = {
    onDragStart: ({ active }: { active: { id: string | number } }) => {
      const opp = Object.values(opportunitiesByStage).flat()
        .find(o => String(o.id) === String(active.id));
      const stageName = getOpportunityStageLabel(opp?.stage || '');
      return `Picked up ${opp?.name || 'opportunity'}. Currently in ${stageName} stage.`;
    },
    onDragOver: ({ over }: { over: { id: string | number } | null }) => {
      if (over) {
        const stageName = getOpportunityStageLabel(String(over.id));
        return `Moving to ${stageName} stage.`;
      }
      return `No longer over a droppable area.`;
    },
    onDragEnd: ({ over }: { over: { id: string | number } | null }) => {
      if (over) {
        const stageName = getOpportunityStageLabel(String(over.id));
        return `Dropped in ${stageName} stage.`;
      }
      return `Drag cancelled.`;
    },
    onDragCancel: () => `Dragging was cancelled.`,
  };

  if (isPending) return null;

  return (
    <div className="flex min-h-0 flex-1 flex-col h-full">
      <DndContext
        sensors={sensors}
        collisionDetection={customCollisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
        accessibility={{ announcements }}
      >
        {/* Tighter layout: reduced padding p-3, smaller gap-3 between columns */}
        {/* pb-5 ensures horizontal scrollbar isn't clipped by parent overflow-hidden containers */}
        <div
          className="flex min-h-0 flex-1 gap-3 overflow-x-auto overflow-y-hidden p-3 pb-5 bg-muted rounded-2xl border border-border shadow-inner"
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
              onOpportunityCreated={handleOpportunityCreated}
            />
          ))}
          {/* Settings button at end of columns - scroll right to access */}
          <div className="flex items-start pt-1 shrink-0">
            <ColumnCustomizationMenu
              visibleStages={userVisibleStages}
              toggleVisibility={toggleVisibility}
              collapseAll={collapseAll}
              expandAll={expandAll}
              resetPreferences={resetPreferences}
            />
          </div>
        </div>

        <DragOverlay>
          {activeOpportunity ? (
            <OpportunityCard
              opportunity={activeOpportunity}
              isDragOverlay
              openSlideOver={openSlideOver}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

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
