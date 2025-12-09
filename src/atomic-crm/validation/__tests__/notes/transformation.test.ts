/**
 * Tests for note data transformation utilities
 * Focus: Date transformations, schema updates, and data formatting
 */

import { describe, it, expect } from "vitest";
import {
  createContactNoteSchema,
  updateContactNoteSchema,
  createOpportunityNoteSchema,
  updateOpportunityNoteSchema,
  validateContactNoteForSubmission,
  validateOpportunityNoteForSubmission,
  transformNoteDate,
  getCurrentNoteDate,
  noteHasAttachments,
} from "../../notes";
import { z } from "zod";

describe("Note Transformation Utilities", () => {
  describe("Create Schemas", () => {
    describe("createContactNoteSchema", () => {
      it("should require essential fields for creation", () => {
        const validCreate = {
          text: "New contact note",
          date: "2024-01-15T10:00:00Z",
          contact_id: "contact-123",
          sales_id: "user-456",
        };

        expect(() => createContactNoteSchema.parse(validCreate)).not.toThrow();
      });

      it("should reject id field on creation (z.strictObject security)", () => {
        // z.strictObject() rejects the 'id' field on creation schema
        // because createContactNoteSchema omits it, making it an unrecognized key
        const dataWithId = {
          id: "should-not-be-here",
          text: "New note",
          date: "2024-01-15T10:00:00Z",
          contact_id: "contact-123",
          sales_id: "user-456",
        };

        expect(() => createContactNoteSchema.parse(dataWithId)).toThrow(z.ZodError);
      });

      it("should handle attachments on creation", () => {
        const createWithAttachments = {
          text: "Note with files",
          date: "2024-01-15T10:00:00Z",
          contact_id: "contact-123",
          sales_id: "user-456",
          attachments: [{ src: "https://example.com/contract.pdf", title: "Contract" }],
        };

        const result = createContactNoteSchema.parse(createWithAttachments);
        expect(result.attachments).toHaveLength(1);
      });
    });

    describe("createOpportunityNoteSchema", () => {
      it("should require essential fields for creation", () => {
        const validCreate = {
          text: "New opportunity note",
          date: "2024-01-15T10:00:00Z",
          opportunity_id: "opp-123",
          sales_id: "user-456",
        };

        expect(() => createOpportunityNoteSchema.parse(validCreate)).not.toThrow();
      });

      it("should not require status field", () => {
        const createData = {
          text: "Opportunity update",
          date: "2024-01-15T10:00:00Z",
          opportunity_id: "opp-123",
          sales_id: "user-456",
        };

        expect(() => createOpportunityNoteSchema.parse(createData)).not.toThrow();
      });
    });
  });

  describe("Update Schemas", () => {
    describe("updateContactNoteSchema", () => {
      it("should require id for updates", () => {
        const validUpdate = {
          id: "note-123",
          text: "Updated text",
        };

        expect(() => updateContactNoteSchema.parse(validUpdate)).not.toThrow();
      });

      it("should reject updates without id", () => {
        const invalidUpdate = {
          text: "Updated text",
        };

        expect(() => updateContactNoteSchema.parse(invalidUpdate)).toThrow(z.ZodError);
      });

      it("should allow partial updates with valid fields only", () => {
        expect(() => updateContactNoteSchema.parse({ id: "n-1", text: "New text" })).not.toThrow();
        expect(() =>
          updateContactNoteSchema.parse({
            id: "n-1",
            date: "2024-01-20T10:00:00Z",
          })
        ).not.toThrow();
        expect(() => updateContactNoteSchema.parse({ id: "n-1" })).not.toThrow();
      });

      it("should reject unrecognized fields in partial updates (z.strictObject security)", () => {
        // z.strictObject() prevents adding arbitrary fields even in partial updates
        expect(() => updateContactNoteSchema.parse({ id: "n-1", status: "completed" })).toThrow(
          z.ZodError
        );
      });
    });

    describe("updateOpportunityNoteSchema", () => {
      it("should require id for updates", () => {
        const validUpdate = {
          id: "note-123",
          text: "Updated opportunity note",
        };

        expect(() => updateOpportunityNoteSchema.parse(validUpdate)).not.toThrow();
      });

      it("should allow updating attachments", () => {
        const updateWithAttachments = {
          id: "note-123",
          attachments: [
            {
              src: "https://example.com/updated.pdf",
              title: "Updated Document",
            },
          ],
        };

        expect(() => updateOpportunityNoteSchema.parse(updateWithAttachments)).not.toThrow();
      });
    });
  });

  describe("Submission Validation", () => {
    describe("validateContactNoteForSubmission", () => {
      it("should validate and transform date", () => {
        const inputData = {
          text: "Note for submission",
          date: "2024-01-15T10:00:00",
          contact_id: "contact-123",
          sales_id: "user-456",
        };

        const result = validateContactNoteForSubmission(inputData);
        expect(result.text).toBe("Note for submission");
        expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      });
    });

    describe("validateOpportunityNoteForSubmission", () => {
      it("should validate and transform date", () => {
        const inputData = {
          text: "Opportunity note for submission",
          date: "2024-01-15T10:00:00",
          opportunity_id: "opp-123",
          sales_id: "user-456",
        };

        const result = validateOpportunityNoteForSubmission(inputData);
        expect(result.text).toBe("Opportunity note for submission");
        expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      });
    });
  });

  describe("Helper Functions", () => {
    describe("transformNoteDate", () => {
      it("should transform dates to ISO format", () => {
        const testCases = [
          {
            input: "2024-01-15T10:00:00",
            expected: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
          },
          {
            input: "2024-01-15T10:00:00Z",
            expected: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
          },
          {
            input: "2024-01-15",
            expected: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
          },
        ];

        testCases.forEach(({ input, expected }) => {
          const result = transformNoteDate(input);
          expect(result).toMatch(expected);
        });
      });
    });

    describe("getCurrentNoteDate", () => {
      it("should return current date in expected format", () => {
        const result = getCurrentNoteDate();
        expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
      });
    });

    describe("noteHasAttachments", () => {
      it("should detect notes with attachments", () => {
        const noteWithAttachments: ContactNote = {
          text: "Note",
          date: "2024-01-15",
          contact_id: "c-1",
          sales_id: "u-1",
          attachments: [{ src: "https://example.com/file.pdf", title: "File" }],
        };

        expect(noteHasAttachments(noteWithAttachments)).toBe(true);
      });

      it("should detect notes without attachments", () => {
        const noteWithoutAttachments: ContactNote = {
          text: "Note",
          date: "2024-01-15",
          contact_id: "c-1",
          sales_id: "u-1",
        };

        expect(noteHasAttachments(noteWithoutAttachments)).toBe(false);
      });

      it("should handle empty attachment arrays", () => {
        const noteWithEmptyAttachments: ContactNote = {
          text: "Note",
          date: "2024-01-15",
          contact_id: "c-1",
          sales_id: "u-1",
          attachments: [],
        };

        expect(noteHasAttachments(noteWithEmptyAttachments)).toBe(false);
      });
    });
  });
});
