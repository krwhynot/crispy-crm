/**
 * Tests for note edge cases and error handling
 * Focus: Business rules, attachment validation, and error messages
 */

import { describe, it, expect } from "vitest";
import {
  contactNoteSchema,
  opportunityNoteSchema,
  validateAttachmentSize,
  validateAttachmentType,
} from "../../notes";
import { z } from "zod";

describe("Note Edge Cases and Error Handling", () => {
  describe("validateAttachmentSize", () => {
    it("should accept valid file sizes", () => {
      expect(validateAttachmentSize(5 * 1024 * 1024)).toBeUndefined(); // 5MB
      expect(validateAttachmentSize(10 * 1024 * 1024)).toBeUndefined(); // 10MB exactly
      expect(validateAttachmentSize(1024)).toBeUndefined(); // 1KB
    });

    it("should reject files over default limit", () => {
      const result = validateAttachmentSize(11 * 1024 * 1024); // 11MB
      expect(result).toBe("File size must be less than 10MB");
    });

    it("should respect custom size limits", () => {
      expect(validateAttachmentSize(4 * 1024 * 1024, 5)).toBeUndefined(); // 4MB with 5MB limit
      expect(validateAttachmentSize(6 * 1024 * 1024, 5)).toBe("File size must be less than 5MB");
    });
  });

  describe("validateAttachmentType", () => {
    it("should accept valid file types", () => {
      expect(validateAttachmentType("document.pdf")).toBeUndefined();
      expect(validateAttachmentType("image.jpg")).toBeUndefined();
      expect(validateAttachmentType("file.docx")).toBeUndefined();
      expect(validateAttachmentType("photo.png")).toBeUndefined();
    });

    it("should reject invalid file types", () => {
      const result = validateAttachmentType("script.exe");
      expect(result).toContain("File type .exe is not allowed");
    });

    it("should handle case-insensitive extensions", () => {
      expect(validateAttachmentType("Document.PDF")).toBeUndefined();
      expect(validateAttachmentType("IMAGE.JPG")).toBeUndefined();
    });

    it("should respect custom allowed extensions", () => {
      const customAllowed = [".pdf", ".txt"];
      expect(validateAttachmentType("file.pdf", customAllowed)).toBeUndefined();
      expect(validateAttachmentType("file.jpg", customAllowed)).toContain(
        "File type .jpg is not allowed"
      );
    });
  });

  describe("Business Rules", () => {
    it("should enforce required fields for contact notes", () => {
      const incompleteNote = {
        text: "Note",
        // Missing other required fields
      };

      expect(() => contactNoteSchema.parse(incompleteNote)).toThrow(z.ZodError);
    });

    it("should enforce required fields for opportunity notes", () => {
      const incompleteNote = {
        text: "Note",
        date: "2024-01-15",
        // Missing opportunity_id and sales_id
      };

      expect(() => opportunityNoteSchema.parse(incompleteNote)).toThrow(z.ZodError);
    });

    it("should validate attachment URLs", () => {
      const noteWithInvalidAttachment = {
        text: "Note",
        date: "2024-01-15",
        contact_id: "c-1",
        sales_id: "u-1",
        attachments: [{ src: "not-a-url", title: "Invalid" }],
      };

      expect(() => contactNoteSchema.parse(noteWithInvalidAttachment)).toThrow(z.ZodError);
    });
  });

  describe("Error Message Formatting", () => {
    it("should provide clear error messages", () => {
      const testCases = [
        {
          data: {
            text: "",
            date: "2024-01-15",
            contact_id: "c-1",
            sales_id: "u-1",
          },
          expectedError: "Note text is required",
        },
        {
          data: {
            text: "Note",
            date: "",
            contact_id: "c-1",
            sales_id: "u-1",
          },
          expectedError: "Invalid input: expected date, received Date",
        },
        {
          data: {
            text: "Note",
            date: "2024-01-15",
            contact_id: "",
            sales_id: "u-1",
          },
          expectedError: "Contact ID is required",
        },
        {
          data: {
            text: "Note",
            date: "2024-01-15",
            contact_id: "c-1",
            sales_id: "",
          },
          expectedError: "Sales ID is required",
        },
      ];

      testCases.forEach(({ data, expectedError }) => {
        try {
          contactNoteSchema.parse(data);
          expect.fail("Should have thrown error");
        } catch (error) {
          if (error instanceof z.ZodError) {
            expect(error.issues).toBeDefined();
            expect(error.issues.length).toBeGreaterThan(0);
            const message = error.issues[0]?.message;
            expect(message).toBe(expectedError);
          } else {
            throw error;
          }
        }
      });
    });
  });
});
