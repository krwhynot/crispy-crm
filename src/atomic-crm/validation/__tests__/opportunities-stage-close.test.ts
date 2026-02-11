/**
 * Tests for WG-002: Win/Loss Reason Bypass in Stage-Only Updates
 *
 * Ensures that Kanban drag-drop operations to closed stages (closed_won/closed_lost)
 * properly enforce win_reason/loss_reason requirements.
 *
 * The bug: isStageOnlyUpdate logic was allowing bypass of win/loss validation
 * when dragging opportunities to closed stages without providing reasons.
 */

import { describe, it, expect } from "vitest";
import { updateOpportunitySchema } from "../opportunities/opportunities-operations";

describe("WG-002: Stage Close Validation (opportunities-operations.ts)", () => {
  describe("Stage-only updates to closed_won", () => {
    it("FAILS when stage=closed_won without win_reason (Kanban drag)", () => {
      const kanbanDragToWon = {
        id: 123,
        stage: "closed_won",
        contact_ids: [1],
      };

      const result = updateOpportunitySchema.safeParse(kanbanDragToWon);
      expect(result.success).toBe(false);
      if (!result.success) {
        const winReasonError = result.error.issues.find((i) => i.path[0] === "win_reason");
        expect(winReasonError).toBeDefined();
        expect(winReasonError?.message).toBe("Win reason is required when closing as won");
      }
    });

    it("PASSES when stage=closed_won WITH win_reason", () => {
      const kanbanDragWithReason = {
        id: 123,
        stage: "closed_won",
        win_reason: "relationship",
        actual_close_date: new Date().toISOString(),
        contact_ids: [1],
      };

      const result = updateOpportunitySchema.safeParse(kanbanDragWithReason);
      expect(result.success).toBe(true);
    });
  });

  describe("Stage-only updates to closed_lost", () => {
    it("FAILS when stage=closed_lost without loss_reason (Kanban drag)", () => {
      const kanbanDragToLost = {
        id: 123,
        stage: "closed_lost",
        contact_ids: [1],
      };

      const result = updateOpportunitySchema.safeParse(kanbanDragToLost);
      expect(result.success).toBe(false);
      if (!result.success) {
        const lossReasonError = result.error.issues.find((i) => i.path[0] === "loss_reason");
        expect(lossReasonError).toBeDefined();
        expect(lossReasonError?.message).toBe("Loss reason is required when closing as lost");
      }
    });

    it("PASSES when stage=closed_lost WITH loss_reason", () => {
      const kanbanDragWithReason = {
        id: 123,
        stage: "closed_lost",
        loss_reason: "price_too_high",
        actual_close_date: new Date().toISOString(),
        contact_ids: [1],
      };

      const result = updateOpportunitySchema.safeParse(kanbanDragWithReason);
      expect(result.success).toBe(true);
    });
  });

  describe("Other reason requires notes", () => {
    it("FAILS when win_reason=other without close_reason_notes", () => {
      const updateWithOtherReason = {
        id: 123,
        stage: "closed_won",
        win_reason: "other",
        contact_ids: [1],
      };

      const result = updateOpportunitySchema.safeParse(updateWithOtherReason);
      expect(result.success).toBe(false);
      if (!result.success) {
        const notesError = result.error.issues.find((i) => i.path[0] === "close_reason_notes");
        expect(notesError).toBeDefined();
        expect(notesError?.message).toBe(
          "Please specify the reason in notes when selecting 'Other'"
        );
      }
    });

    it("FAILS when loss_reason=other without close_reason_notes", () => {
      const updateWithOtherReason = {
        id: 123,
        stage: "closed_lost",
        loss_reason: "other",
        contact_ids: [1],
      };

      const result = updateOpportunitySchema.safeParse(updateWithOtherReason);
      expect(result.success).toBe(false);
      if (!result.success) {
        const notesError = result.error.issues.find((i) => i.path[0] === "close_reason_notes");
        expect(notesError).toBeDefined();
        expect(notesError?.message).toBe(
          "Please specify the reason in notes when selecting 'Other'"
        );
      }
    });

    it("PASSES when reason=other WITH close_reason_notes", () => {
      const updateWithOtherAndNotes = {
        id: 123,
        stage: "closed_won",
        win_reason: "other",
        close_reason_notes: "Custom reason explained here",
        actual_close_date: new Date().toISOString(),
        contact_ids: [1],
      };

      const result = updateOpportunitySchema.safeParse(updateWithOtherAndNotes);
      expect(result.success).toBe(true);
    });
  });

  describe("Non-closed stage updates (normal Kanban)", () => {
    it("PASSES for stage-only update to non-closed stage", () => {
      const kanbanDragToActive = {
        id: 123,
        stage: "demo_scheduled",
        contact_ids: [1],
      };

      const result = updateOpportunitySchema.safeParse(kanbanDragToActive);
      expect(result.success).toBe(true);
    });

    it("PASSES for stage-only update from new_lead to initial_outreach", () => {
      const normalDrag = {
        id: 456,
        stage: "initial_outreach",
        contact_ids: [2, 3],
      };

      const result = updateOpportunitySchema.safeParse(normalDrag);
      expect(result.success).toBe(true);
    });

    it("PASSES for stage-only update to feedback_logged", () => {
      const normalDrag = {
        id: 789,
        stage: "feedback_logged",
        contact_ids: [],
      };

      const result = updateOpportunitySchema.safeParse(normalDrag);
      expect(result.success).toBe(true);
    });
  });
});
