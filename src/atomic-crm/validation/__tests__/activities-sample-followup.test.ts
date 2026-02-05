/**
 * Tests for WG-001: Sample follow-up enforcement in activities validation
 * Per PRD 4.4: "Samples require follow-up activities"
 *
 * Active workflow statuses (require follow-up):
 * - sent
 * - received
 * - feedback_pending
 *
 * Completed workflow status (no follow-up required):
 * - feedback_received
 */

import { describe, it, expect } from "vitest";
import { activitiesSchema } from "../activities";

describe("WG-001: Sample Follow-up Enforcement", () => {
  const baseActivity = {
    subject: "Sample delivery to client",
    activity_date: new Date().toISOString(),
    contact_id: 1,
  };

  describe("activitiesSchema", () => {
    describe("should FAIL when type='sample' with active status and follow_up_required=false", () => {
      const activeStatuses = ["sent", "received", "feedback_pending"] as const;

      activeStatuses.forEach((status) => {
        it(`fails for status '${status}' when follow_up_required is false`, () => {
          const data = {
            ...baseActivity,
            activity_type: "activity" as const,
            type: "sample" as const,
            sample_status: status,
            follow_up_required: false,
          };

          const result = activitiesSchema.safeParse(data);
          expect(result.success).toBe(false);
          if (!result.success) {
            const followUpError = result.error.issues.find((issue) =>
              issue.path.includes("follow_up_required")
            );
            expect(followUpError).toBeDefined();
            expect(followUpError?.message).toContain("Sample activities require follow-up");
          }
        });
      });
    });

    describe("should FAIL when type='sample' with active status but follow_up_date is null", () => {
      const activeStatuses = ["sent", "received", "feedback_pending"] as const;

      activeStatuses.forEach((status) => {
        it(`fails for status '${status}' when follow_up_date is missing`, () => {
          const data = {
            ...baseActivity,
            activity_type: "activity" as const,
            type: "sample" as const,
            sample_status: status,
            follow_up_required: true,
            follow_up_date: null,
          };

          const result = activitiesSchema.safeParse(data);
          expect(result.success).toBe(false);
          if (!result.success) {
            const dateError = result.error.issues.find((issue) =>
              issue.path.includes("follow_up_date")
            );
            expect(dateError).toBeDefined();
            expect(dateError?.message).toContain("Follow-up date is required");
          }
        });
      });
    });

    describe("should PASS when type='sample' with active status and follow-up properly configured", () => {
      const activeStatuses = ["sent", "received", "feedback_pending"] as const;
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      activeStatuses.forEach((status) => {
        it(`passes for status '${status}' with follow_up_required=true and follow_up_date set`, () => {
          const data = {
            ...baseActivity,
            activity_type: "activity" as const,
            type: "sample" as const,
            sample_status: status,
            follow_up_required: true,
            follow_up_date: futureDate.toISOString(),
          };

          const result = activitiesSchema.safeParse(data);
          expect(result.success).toBe(true);
        });
      });
    });

    it("should PASS when status='feedback_received' without follow-up (workflow complete)", () => {
      const data = {
        ...baseActivity,
        activity_type: "activity" as const,
        type: "sample" as const,
        sample_status: "feedback_received" as const,
        follow_up_required: false,
      };

      const result = activitiesSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should PASS for non-sample types without follow-up", () => {
      const nonSampleTypes = [
        "call",
        "email",
        "meeting",
        "demo",
        "proposal",
        "follow_up",
        "trade_show",
        "site_visit",
        "contract_review",
        "check_in",
        "social",
        "note",
      ] as const;

      nonSampleTypes.forEach((type) => {
        const data = {
          ...baseActivity,
          activity_type: "activity" as const,
          type,
          follow_up_required: false,
        };

        const result = activitiesSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });
  });

  // engagementsSchema and interactionsSchema were removed in simplify-activity-types migration.
  // Sample follow-up enforcement is now tested via activitiesSchema above.
});
