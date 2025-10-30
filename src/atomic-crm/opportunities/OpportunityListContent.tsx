import isEqual from "lodash/isEqual";
import { useListContext, useUpdate, useNotify, useRefresh } from "ra-core";
import { useEffect, useState } from "react";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";

import type { Opportunity } from "../types";
import { OpportunityColumn } from "./OpportunityColumn";
import { OPPORTUNITY_STAGES_LEGACY, getOpportunityStageLabel } from "./stageConstants";
import type { OpportunitiesByStage } from "./stages";
import { getOpportunitiesByStage } from "./stages";

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

  // Filter stages based on active filter
  const visibleStages = filterValues?.stage && Array.isArray(filterValues.stage) && filterValues.stage.length > 0
    ? allOpportunityStages.filter((stage) => filterValues.stage.includes(stage.value))
    : allOpportunityStages;

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

  const handleDragEnd = async (result: DropResult) => {
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

    // Update the opportunity stage
    const opportunityId = draggableId;
    const newStage = destination.droppableId;

    try {
      await update(
        "opportunities",
        {
          id: opportunityId,
          data: { stage: newStage },
        },
        {
          onSuccess: () => {
            notify(`Moved to ${getOpportunityStageLabel(newStage)}`, {
              type: "success",
            });
            refresh();
          },
          onError: () => {
            notify("Error moving opportunity", { type: "error" });
          },
        },
      );
    } catch {
      notify("Error moving opportunity", { type: "error" });
    }
  };

  if (isPending) return null;

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto p-6 bg-muted rounded-3xl border border-[var(--border)] shadow-inner">
        {visibleStages.map((stage) => (
          <OpportunityColumn
            stage={stage.value}
            opportunities={opportunitiesByStage[stage.value]}
            key={stage.value}
          />
        ))}
      </div>
    </DragDropContext>
  );
};
