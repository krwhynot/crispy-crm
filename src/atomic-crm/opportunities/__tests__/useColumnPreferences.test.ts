import { renderHook, act } from "@testing-library/react";
import { useColumnPreferences } from "../useColumnPreferences";
import { describe, it, expect, beforeEach } from "vitest";

describe("useColumnPreferences", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("initializes with all columns visible and expanded", () => {
    const { result } = renderHook(() => useColumnPreferences());

    expect(result.current.collapsedStages).toEqual([]);
    expect(result.current.visibleStages).toEqual([
      "new_lead",
      "initial_outreach",
      "sample_visit_offered",
      "feedback_logged",
      "demo_scheduled",
      "closed_won",
      "closed_lost",
    ]);
  });

  it("toggles column collapse state", () => {
    const { result } = renderHook(() => useColumnPreferences());

    act(() => {
      result.current.toggleCollapse("new_lead");
    });

    expect(result.current.collapsedStages).toContain("new_lead");
  });

  it("persists preferences to localStorage", () => {
    const { result } = renderHook(() => useColumnPreferences());

    act(() => {
      result.current.toggleCollapse("new_lead");
    });

    const stored = localStorage.getItem("opportunity.kanban.collapsed_stages");
    expect(stored).toBe(JSON.stringify(["new_lead"]));
  });
});
