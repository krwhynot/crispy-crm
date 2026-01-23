import { useState, useEffect } from "react";
import { z } from "zod";
import type { OpportunityStageValue } from "../types";
import { OPPORTUNITY_STAGES } from "./constants";
import { getStorageItem, setStorageItem } from "../utils/secureStorage";
import { opportunityStageSchema } from "@/atomic-crm/validation/opportunities/opportunities-core";

const COLLAPSED_KEY = "opportunity.kanban.collapsed_stages";
const VISIBLE_KEY = "opportunity.kanban.visible_stages";

// Schema for validating stored stage preferences - uses canonical stage schema
const opportunityStageArraySchema = z.array(opportunityStageSchema);

export function useColumnPreferences() {
  const allStages = OPPORTUNITY_STAGES.map((s) => s.value);

  const [collapsedStages, setCollapsedStages] = useState<OpportunityStageValue[]>(() => {
    return (
      getStorageItem<OpportunityStageValue[]>(COLLAPSED_KEY, {
        type: "local",
        schema: opportunityStageArraySchema,
      }) ?? []
    );
  });

  const [visibleStages, setVisibleStages] = useState<OpportunityStageValue[]>(() => {
    return (
      getStorageItem<OpportunityStageValue[]>(VISIBLE_KEY, {
        type: "local",
        schema: opportunityStageArraySchema,
      }) ?? allStages
    );
  });

  useEffect(() => {
    setStorageItem(COLLAPSED_KEY, collapsedStages, { type: "local" });
  }, [collapsedStages]);

  useEffect(() => {
    setStorageItem(VISIBLE_KEY, visibleStages, { type: "local" });
  }, [visibleStages]);

  const toggleCollapse = (stage: OpportunityStageValue) => {
    setCollapsedStages((prev) =>
      prev.includes(stage) ? prev.filter((s) => s !== stage) : [...prev, stage]
    );
  };

  const toggleVisibility = (stage: OpportunityStageValue) => {
    setVisibleStages((prev) =>
      prev.includes(stage) ? prev.filter((s) => s !== stage) : [...prev, stage]
    );
  };

  const collapseAll = () => {
    setCollapsedStages(allStages);
  };

  const expandAll = () => {
    setCollapsedStages([]);
  };

  /**
   * Reset all column preferences to defaults
   * Fixes corrupted localStorage state that may hide columns or cards
   */
  const resetPreferences = () => {
    setCollapsedStages([]);
    setVisibleStages(allStages);
  };

  return {
    collapsedStages,
    visibleStages,
    toggleCollapse,
    toggleVisibility,
    collapseAll,
    expandAll,
    resetPreferences,
  };
}
