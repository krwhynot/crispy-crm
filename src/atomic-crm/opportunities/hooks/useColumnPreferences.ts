import { useState, useEffect } from "react";
import { z } from "zod";
import type { OpportunityStageValue } from "../types";
import { OPPORTUNITY_STAGES } from "../constants/stageConstants";
import { safeJsonParse } from "../../utils/safeJsonParse";

const COLLAPSED_KEY = "opportunity.kanban.collapsed_stages";
const VISIBLE_KEY = "opportunity.kanban.visible_stages";

// Schema for validating stored stage preferences
const opportunityStageArraySchema = z.array(
  z.enum([
    "new_lead",
    "initial_outreach",
    "sample_visit_offered",
    "feedback_logged",
    "demo_scheduled",
    "closed_won",
    "closed_lost",
  ])
);

export function useColumnPreferences() {
  const allStages = OPPORTUNITY_STAGES.map((s) => s.value);

  const [collapsedStages, setCollapsedStages] = useState<OpportunityStageValue[]>(() => {
    const stored = localStorage.getItem(COLLAPSED_KEY);
    return safeJsonParse(stored, opportunityStageArraySchema) ?? [];
  });

  const [visibleStages, setVisibleStages] = useState<OpportunityStageValue[]>(() => {
    const stored = localStorage.getItem(VISIBLE_KEY);
    return safeJsonParse(stored, opportunityStageArraySchema) ?? allStages;
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
