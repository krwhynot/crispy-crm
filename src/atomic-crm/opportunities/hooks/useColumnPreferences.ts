import { useState, useEffect } from "react";
import type { OpportunityStageValue } from "../types";
import { OPPORTUNITY_STAGES } from "./stageConstants";

const COLLAPSED_KEY = "opportunity.kanban.collapsed_stages";
const VISIBLE_KEY = "opportunity.kanban.visible_stages";

export function useColumnPreferences() {
  const allStages = OPPORTUNITY_STAGES.map((s) => s.value);

  const [collapsedStages, setCollapsedStages] = useState<OpportunityStageValue[]>(() => {
    const stored = localStorage.getItem(COLLAPSED_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  const [visibleStages, setVisibleStages] = useState<OpportunityStageValue[]>(() => {
    const stored = localStorage.getItem(VISIBLE_KEY);
    return stored ? JSON.parse(stored) : allStages;
  });

  useEffect(() => {
    localStorage.setItem(COLLAPSED_KEY, JSON.stringify(collapsedStages));
  }, [collapsedStages]);

  useEffect(() => {
    localStorage.setItem(VISIBLE_KEY, JSON.stringify(visibleStages));
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

  return {
    collapsedStages,
    visibleStages,
    toggleCollapse,
    toggleVisibility,
    collapseAll,
    expandAll,
  };
}
