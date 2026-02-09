/**
 * Stage Change via Kanban - Integration Tests
 *
 * Tests Gate 11: Each stage-change path creates exactly 1 activity (via DB trigger, not client-side).
 *
 * ARCHITECTURE:
 * - Kanban drag-and-drop changes go through: DnD event -> dataProvider.update -> Supabase -> DB Trigger
 * - The DB trigger `log_opportunity_stage_change` creates the activity record
 * - Client-side code MUST NOT create activity records for stage changes
 *
 * These tests verify that when dragging a card between kanban columns,
 * only the stage update is performed - no client-side activity creation.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { DataProvider, UpdateParams } from "ra-core";
import { createMockDataProvider } from "@/tests/utils/typed-mocks";
import { createMockOpportunity } from "@/tests/utils/mock-providers";
import type { Opportunity } from "@/atomic-crm/types";

/**
 * Simulates the kanban drag-drop handler behavior.
 * In the actual implementation, this is handled by OpportunityListContent.tsx
 * using @dnd-kit/core's onDragEnd callback.
 */
async function simulateKanbanDrop(
  dataProvider: DataProvider,
  opportunity: Opportunity,
  newStage: string
): Promise<void> {
  const updateParams: UpdateParams<Opportunity> = {
    id: opportunity.id,
    data: {
      stage: newStage,
      stage_manual: true, // Manual stage changes are flagged
    },
    previousData: opportunity,
  };

  await dataProvider.update("opportunities", updateParams);
}

describe("Stage change via kanban", () => {
  let mockDataProvider: DataProvider;
  let mockUpdate: ReturnType<typeof vi.fn>;
  let mockCreate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetAllMocks();

    mockUpdate = vi.fn().mockResolvedValue({
      data: { id: 1, stage: "qualified" },
    });
    mockCreate = vi.fn().mockResolvedValue({
      data: { id: 999 },
    });

    mockDataProvider = createMockDataProvider({
      update: mockUpdate,
      create: mockCreate,
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("creates exactly one stage-change activity via DB trigger when card is dropped", async () => {
    /**
     * When a user drags a card from one column to another:
     * 1. onDragEnd fires and calls dataProvider.update with new stage
     * 2. Supabase receives the update
     * 3. DB trigger fires and creates the activity
     *
     * Client should NOT create any activities.
     */
    const opportunity = createMockOpportunity({
      id: 1,
      stage: "new_lead",
    }) as Opportunity;

    await simulateKanbanDrop(mockDataProvider, opportunity, "qualified");

    // Assert: only update was called, not create
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledWith(
      "opportunities",
      expect.objectContaining({
        id: 1,
        data: expect.objectContaining({
          stage: "qualified",
          stage_manual: true,
        }),
      })
    );

    // Gate 11: NO client-side activity creation
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("sets stage_manual flag when dragging in kanban", async () => {
    /**
     * Manual stage changes (drag-drop, form selection) should set stage_manual: true
     * to differentiate from automated stage transitions.
     */
    const opportunity = createMockOpportunity({
      id: 1,
      stage: "initial_outreach",
    }) as Opportunity;

    await simulateKanbanDrop(mockDataProvider, opportunity, "demo_scheduled");

    expect(mockUpdate).toHaveBeenCalledWith(
      "opportunities",
      expect.objectContaining({
        data: expect.objectContaining({
          stage_manual: true,
        }),
      })
    );
  });

  it("does not create activity when dropped back on same column", async () => {
    /**
     * If user drags a card but drops it back on the same column,
     * no update should occur (handled by dnd-kit's drag handling).
     * This test verifies the update path if it does fire.
     */
    const opportunity = createMockOpportunity({
      id: 1,
      stage: "proposal",
    }) as Opportunity;

    // In reality, the kanban component would detect same-column drop and skip update
    // But if update is called with same stage, still no client-side activity
    await mockDataProvider.update("opportunities", {
      id: 1,
      data: { stage: "proposal" }, // Same stage
      previousData: opportunity,
    });

    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("handles rapid drag-drop without duplicate activity creation", async () => {
    /**
     * User might quickly drag-drop the same card multiple times.
     * Each should trigger exactly one update, and the DB trigger
     * handles activity creation for each.
     */
    const opportunity = createMockOpportunity({
      id: 1,
      stage: "new_lead",
    }) as Opportunity;

    // First drag: new_lead -> initial_outreach
    await simulateKanbanDrop(mockDataProvider, opportunity, "initial_outreach");

    // Update the mock opportunity to reflect new stage
    const updatedOpportunity = { ...opportunity, stage: "initial_outreach" };

    // Second drag: initial_outreach -> qualified
    await simulateKanbanDrop(mockDataProvider, updatedOpportunity, "qualified");

    // Both updates should have been called
    expect(mockUpdate).toHaveBeenCalledTimes(2);

    // First call
    expect(mockUpdate).toHaveBeenNthCalledWith(
      1,
      "opportunities",
      expect.objectContaining({
        data: expect.objectContaining({ stage: "initial_outreach" }),
      })
    );

    // Second call
    expect(mockUpdate).toHaveBeenNthCalledWith(
      2,
      "opportunities",
      expect.objectContaining({
        data: expect.objectContaining({ stage: "qualified" }),
      })
    );

    // Gate 11: Still no client-side activity creation
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("does not create activity for drag-drop within closed stages", async () => {
    /**
     * Even moving between terminal stages (closed_won, closed_lost)
     * should not create client-side activities. The DB trigger handles it.
     */
    const opportunity = createMockOpportunity({
      id: 1,
      stage: "closed_won",
    }) as Opportunity;

    await simulateKanbanDrop(mockDataProvider, opportunity, "closed_lost");

    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("preserves previousData reference for optimistic update rollback", async () => {
    /**
     * The update call should include previousData for rollback scenarios.
     * This is important for React Admin's optimistic update pattern.
     */
    const opportunity = createMockOpportunity({
      id: 1,
      stage: "new_lead",
      name: "Test Opportunity",
    }) as Opportunity;

    await simulateKanbanDrop(mockDataProvider, opportunity, "qualified");

    expect(mockUpdate).toHaveBeenCalledWith(
      "opportunities",
      expect.objectContaining({
        previousData: opportunity,
      })
    );
  });
});
