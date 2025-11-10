import isEqual from "lodash/isEqual";
import { useListContext, useUpdate, useNotify, useRefresh } from "ra-core";
import { useEffect, useState } from "react";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";

import type { Opportunity } from "../types";
import { OpportunityColumn } from "./OpportunityColumn";
import { OPPORTUNITY_STAGES_LEGACY, getOpportunityStageLabel } from "./stageConstants";
import type { OpportunitiesByStage } from "./stages";
import { getOpportunitiesByStage } from "./stages";
import { useColumnPreferences } from "./useColumnPreferences";
import { ColumnCustomizationMenu } from "./ColumnCustomizationMenu";

export const OpportunityListContent = () => {
  const allOpportunityStages = OPPORTUNITY_STAGES_LEGACY;

  const {
    data: unorderedOpportunities,
    isPending,
    filterValues,
  } = useListContext<Opportunity>();

  const [update] = useUpdate();
  const notify = useNotify();
  const refresh = useRefresh();

  const {
    collapsedStages,
    visibleStages: userVisibleStages,
    toggleCollapse,
    toggleVisibility,
    collapseAll,
    expandAll,
  } = useColumnPreferences();

  // Filter stages based on active filter and user preferences
  const visibleStages = filterValues?.stage && Array.isArray(filterValues.stage) && filterValues.stage.length > 0
    ? allOpportunityStages.filter((stage) =>
        filterValues.stage.includes(stage.value) && userVisibleStages.includes(stage.value)
      )
    : allOpportunityStages.filter((stage) => userVisibleStages.includes(stage.value));

  const [opportunitiesByStage, setOpportunitiesByStage] =
    useState<OpportunitiesByStage>(
      getOpportunitiesByStage([], allOpportunityStages),
    );

  useEffect(() => {
    if (unorderedOpportunities) {
      const newOpportunitiesByStage = getOpportunitiesByStage(
        unorderedOpportunities,
        allOpportunityStages,
      );
      if (!isEqual(newOpportunitiesByStage, opportunitiesByStage)) {
        setOpportunitiesByStage(newOpportunitiesByStage);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unorderedOpportunities]);

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    console.log("🎯 Drag ended:", {
      draggableId,
      source: source.droppableId,
      destination: destination?.droppableId,
      result
    });

    // Dropped outside a valid droppable
    if (!destination) {
      console.log("❌ No destination - dropped outside");
      return;
    }

    // Dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
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
      console.error("Could not find dragged opportunity to move.");
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

    // --- API Call ---
    // Note: ra-supabase requires previousData to calculate diffs
    update(
      "opportunities",
      {
        id: draggableId,
        data: { stage: destColId },
        previousData: draggedItem,
      },
      {
        onSuccess: () => {
          notify(`Moved to ${getOpportunityStageLabel(destColId)}`, {
            type: "success",
          });
          // Refresh to sync with any server-side changes
          refresh();
        },
        onError: () => {
          notify("Error: Could not move opportunity. Reverting.", {
            type: "warning",
          });
          // Rollback UI on error
          setOpportunitiesByStage(previousState);
        },
      },
    );
  };

  if (isPending) return null;

  return (
    <>
      <div className="flex justify-end mb-4">
        <ColumnCustomizationMenu
          visibleStages={userVisibleStages}
          toggleVisibility={toggleVisibility}
          collapseAll={collapseAll}
          expandAll={expandAll}
        />
      </div>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto p-6 bg-muted rounded-3xl border border-[var(--border)] shadow-inner" data-testid="kanban-board">
          {visibleStages.map((stage) => (
            <OpportunityColumn
              stage={stage.value}
              opportunities={opportunitiesByStage[stage.value]}
              key={stage.value}
              isCollapsed={collapsedStages.includes(stage.value)}
              onToggleCollapse={() => toggleCollapse(stage.value)}
            />
          ))}
        </div>
      </DragDropContext>
    </>
  );
};
