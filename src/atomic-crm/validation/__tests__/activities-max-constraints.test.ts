/**
 * Tests for .max() constraints on activities validation schemas
 * Focus: DoS prevention via unbounded string limits
 */

import { describe, it, expect } from "vitest";
import {
  baseActivitiesSchema,
  activitiesSchema,
  activityNoteFormSchema,
} from "../activities/schemas";
import { z } from "zod";

describe("Activities .max() Constraints", () => {
  describe("subject field", () => {
    it("should accept subject at max length (255 chars)", () => {
      const validActivity = {
        subject: "a".repeat(255),
        activity_type: "interaction" as const,
        type: "call" as const,
        contact_id: 1,
        opportunity_id: 1,
      };
      expect(() => activitiesSchema.parse(validActivity)).not.toThrow();
    });

    it("should reject subject over max length (256 chars)", () => {
      const invalidActivity = {
        subject: "a".repeat(256),
        activity_type: "interaction" as const,
        type: "call" as const,
        contact_id: 1,
        opportunity_id: 1,
      };
      expect(() => activitiesSchema.parse(invalidActivity)).toThrow(z.ZodError);
    });
  });

  describe("description field", () => {
    it("should accept description at max length (10000 chars)", () => {
      const validActivity = {
        subject: "Test",
        description: "a".repeat(10000),
        activity_type: "interaction" as const,
        type: "call" as const,
        contact_id: 1,
        opportunity_id: 1,
      };
      expect(() => activitiesSchema.parse(validActivity)).not.toThrow();
    });

    it("should reject description over max length (10001 chars)", () => {
      const invalidActivity = {
        subject: "Test",
        description: "a".repeat(10001),
        activity_type: "interaction" as const,
        type: "call" as const,
        contact_id: 1,
        opportunity_id: 1,
      };
      expect(() => activitiesSchema.parse(invalidActivity)).toThrow(z.ZodError);
    });
  });

  describe("follow_up_notes field", () => {
    it("should accept follow_up_notes at max length (10000 chars)", () => {
      const validActivity = {
        subject: "Test",
        follow_up_notes: "a".repeat(10000),
        activity_type: "interaction" as const,
        type: "call" as const,
        contact_id: 1,
        opportunity_id: 1,
      };
      expect(() => activitiesSchema.parse(validActivity)).not.toThrow();
    });

    it("should reject follow_up_notes over max length (10001 chars)", () => {
      const invalidActivity = {
        subject: "Test",
        follow_up_notes: "a".repeat(10001),
        activity_type: "interaction" as const,
        type: "call" as const,
        contact_id: 1,
        opportunity_id: 1,
      };
      expect(() => activitiesSchema.parse(invalidActivity)).toThrow(z.ZodError);
    });
  });

  describe("outcome field", () => {
    it("should accept outcome at max length (2000 chars)", () => {
      const validActivity = {
        subject: "Test",
        outcome: "a".repeat(2000),
        activity_type: "interaction" as const,
        type: "call" as const,
        contact_id: 1,
        opportunity_id: 1,
      };
      expect(() => activitiesSchema.parse(validActivity)).not.toThrow();
    });

    it("should reject outcome over max length (2001 chars)", () => {
      const invalidActivity = {
        subject: "Test",
        outcome: "a".repeat(2001),
        activity_type: "interaction" as const,
        type: "call" as const,
        contact_id: 1,
        opportunity_id: 1,
      };
      expect(() => activitiesSchema.parse(invalidActivity)).toThrow(z.ZodError);
    });
  });

  describe("location field", () => {
    it("should accept location at max length (255 chars)", () => {
      const validActivity = {
        subject: "Test",
        location: "a".repeat(255),
        activity_type: "interaction" as const,
        type: "call" as const,
        contact_id: 1,
        opportunity_id: 1,
      };
      expect(() => activitiesSchema.parse(validActivity)).not.toThrow();
    });

    it("should reject location over max length (256 chars)", () => {
      const invalidActivity = {
        subject: "Test",
        location: "a".repeat(256),
        activity_type: "interaction" as const,
        type: "call" as const,
        contact_id: 1,
        opportunity_id: 1,
      };
      expect(() => activitiesSchema.parse(invalidActivity)).toThrow(z.ZodError);
    });
  });

  describe("attachments array", () => {
    it("should accept attachment paths at max length (2048 chars each)", () => {
      const validActivity = {
        subject: "Test",
        attachments: ["a".repeat(2048)],
        activity_type: "interaction" as const,
        type: "call" as const,
        contact_id: 1,
        opportunity_id: 1,
      };
      expect(() => activitiesSchema.parse(validActivity)).not.toThrow();
    });

    it("should reject attachment paths over max length (2049 chars)", () => {
      const invalidActivity = {
        subject: "Test",
        attachments: ["a".repeat(2049)],
        activity_type: "interaction" as const,
        type: "call" as const,
        contact_id: 1,
        opportunity_id: 1,
      };
      expect(() => activitiesSchema.parse(invalidActivity)).toThrow(z.ZodError);
    });

    it("should reject more than 20 attachments", () => {
      const invalidActivity = {
        subject: "Test",
        attachments: Array(21).fill("test.pdf"),
        activity_type: "interaction" as const,
        type: "call" as const,
        contact_id: 1,
        opportunity_id: 1,
      };
      expect(() => activitiesSchema.parse(invalidActivity)).toThrow(z.ZodError);
    });
  });

  describe("attendees array", () => {
    it("should accept attendee names at max length (255 chars each)", () => {
      const validActivity = {
        subject: "Test",
        attendees: ["a".repeat(255)],
        activity_type: "interaction" as const,
        type: "call" as const,
        contact_id: 1,
        opportunity_id: 1,
      };
      expect(() => activitiesSchema.parse(validActivity)).not.toThrow();
    });

    it("should reject attendee names over max length (256 chars)", () => {
      const invalidActivity = {
        subject: "Test",
        attendees: ["a".repeat(256)],
        activity_type: "interaction" as const,
        type: "call" as const,
        contact_id: 1,
        opportunity_id: 1,
      };
      expect(() => activitiesSchema.parse(invalidActivity)).toThrow(z.ZodError);
    });

    it("should reject more than 50 attendees", () => {
      const invalidActivity = {
        subject: "Test",
        attendees: Array(51).fill("John Doe"),
        activity_type: "interaction" as const,
        type: "call" as const,
        contact_id: 1,
        opportunity_id: 1,
      };
      expect(() => activitiesSchema.parse(invalidActivity)).toThrow(z.ZodError);
    });
  });

  describe("tags array", () => {
    it("should accept tag strings at max length (100 chars each)", () => {
      const validActivity = {
        subject: "Test",
        tags: ["a".repeat(100)],
        activity_type: "interaction" as const,
        type: "call" as const,
        contact_id: 1,
        opportunity_id: 1,
      };
      expect(() => activitiesSchema.parse(validActivity)).not.toThrow();
    });

    it("should reject tag strings over max length (101 chars)", () => {
      const invalidActivity = {
        subject: "Test",
        tags: ["a".repeat(101)],
        activity_type: "interaction" as const,
        type: "call" as const,
        contact_id: 1,
        opportunity_id: 1,
      };
      expect(() => activitiesSchema.parse(invalidActivity)).toThrow(z.ZodError);
    });

    it("should reject more than 20 tags", () => {
      const invalidActivity = {
        subject: "Test",
        tags: Array(21).fill("tag"),
        activity_type: "interaction" as const,
        type: "call" as const,
        contact_id: 1,
        opportunity_id: 1,
      };
      expect(() => activitiesSchema.parse(invalidActivity)).toThrow(z.ZodError);
    });
  });

  describe("id and entity reference fields (union)", () => {
    it("should accept string IDs at max length (50 chars)", () => {
      const validActivity = {
        id: "a".repeat(50),
        subject: "Test",
        contact_id: "a".repeat(50),
        organization_id: "a".repeat(50),
        opportunity_id: "a".repeat(50),
        created_by: "a".repeat(50),
        related_task_id: "a".repeat(50),
        activity_type: "interaction" as const,
        type: "call" as const,
      };
      expect(() => baseActivitiesSchema.parse(validActivity)).not.toThrow();
    });

    it("should reject string IDs over max length (51 chars)", () => {
      const invalidActivity = {
        subject: "Test",
        contact_id: "a".repeat(51),
        activity_type: "interaction" as const,
        type: "call" as const,
        organization_id: 1,
      };
      expect(() => baseActivitiesSchema.parse(invalidActivity)).toThrow(z.ZodError);
    });
  });

  describe("timestamp fields", () => {
    it("should accept timestamp fields at max length (50 chars)", () => {
      const validActivity = {
        subject: "Test",
        created_at: "2024-01-01T00:00:00.000Z",
        updated_at: "2024-01-01T00:00:00.000Z",
        deleted_at: "2024-01-01T00:00:00.000Z",
        activity_type: "interaction" as const,
        type: "call" as const,
        contact_id: 1,
        opportunity_id: 1,
      };
      expect(() => activitiesSchema.parse(validActivity)).not.toThrow();
    });

    it("should reject timestamp over max length (51 chars)", () => {
      const invalidActivity = {
        subject: "Test",
        created_at: "a".repeat(51),
        activity_type: "interaction" as const,
        type: "call" as const,
        contact_id: 1,
        opportunity_id: 1,
      };
      expect(() => activitiesSchema.parse(invalidActivity)).toThrow(z.ZodError);
    });
  });

  describe("activityNoteFormSchema", () => {
    it("should enforce max constraints on quick notes", () => {
      const validNote = {
        activity_date: new Date(),
        type: "call" as const,
        stage: "a".repeat(50),
        subject: "a".repeat(255),
      };
      expect(() => activityNoteFormSchema.parse(validNote)).not.toThrow();

      const invalidNote = {
        activity_date: new Date(),
        type: "call" as const,
        stage: "a".repeat(51),
        subject: "Test",
      };
      expect(() => activityNoteFormSchema.parse(invalidNote)).toThrow(z.ZodError);
    });
  });
});
