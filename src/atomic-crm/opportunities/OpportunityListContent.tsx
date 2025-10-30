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

  if (isPending) return null;

  return (
    <div className="flex gap-4 overflow-x-auto p-6 bg-muted rounded-3xl border border-[var(--border)] shadow-inner">
      {visibleStages.map((stage) => (
        <OpportunityColumn
          stage={stage.value}
          opportunities={opportunitiesByStage[stage.value]}
          key={stage.value}
        />
      ))}
    </div>
  );
};
