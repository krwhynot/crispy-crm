/**
 * Tests for note validation schemas
 * Focus: Core validation rules and schema behavior
 */

import { describe, it, expect } from "vitest";
import {
  contactNoteSchema,
  opportunityNoteSchema,
  organizationNoteSchema,
  validateCreateContactNote,
  validateCreateOpportunityNote,
  validateCreateOrganizationNote,
  validateAttachment,
  validateAttachments,
} from "../../notes";
import { z } from "zod";

describe("Note Validation Schemas", () => {
  describe("Attachment validation", () => {
    const validAttachment = {
      src: "https://example.com/uploads/document.pdf",
      title: "Important Document",
      type: "application/pdf",
      size: 1024000,
    };

    it("should accept valid attachment data", () => {
      const result = validateAttachment(validAttachment);
      expect(result.src).toBe("https://example.com/uploads/document.pdf");
      expect(result.title).toBe("Important Document");
    });

    it("should reject invalid URL", () => {
      const invalidData = { ...validAttachment, src: "not-a-url" };
      expect(() => validateAttachment(invalidData)).toThrow(z.ZodError);
    });

    it("should reject empty title", () => {
      const invalidData = { ...validAttachment, title: "" };
      expect(() => validateAttachment(invalidData)).toThrow(z.ZodError);
    });

    it("should handle optional fields", () => {
      const minimalAttachment = {
        src: "https://example.com/file.pdf",
        title: "File",
      };

      const result = validateAttachment(minimalAttachment);
      expect(result.type).toBeUndefined();
      expect(result.size).toBeUndefined();
    });

    it("should validate multiple attachments", () => {
      const attachments = [
        { src: "https://example.com/file1.pdf", title: "File 1" },
        { src: "https://example.com/file2.jpg", title: "File 2" },
      ];

      const result = validateAttachments(attachments);
      expect(result).toHaveLength(2);
    });
  });

  describe("contactNoteSchema", () => {
    const validContactNote = {
      text: "Called customer about renewal",
      date: "2024-01-15T10:00:00Z",
      contact_id: "contact-123",
      sales_id: "user-456",
    };

    it("should accept valid contact note", () => {
      const result = contactNoteSchema.parse(validContactNote);
      expect(result.text).toBe("Called customer about renewal");
      expect(result.contact_id).toBe("contact-123");
    });

    it("should reject empty text", () => {
      const invalidData = { ...validContactNote, text: "" };
      expect(() => contactNoteSchema.parse(invalidData)).toThrow(z.ZodError);
    });

    it("should reject empty date", () => {
      const invalidData = { ...validContactNote, date: "" };
      expect(() => contactNoteSchema.parse(invalidData)).toThrow(z.ZodError);
    });

    it("should require contact_id", () => {
      const withoutContactId = {
        text: "Note without contact",
        date: "2024-01-15T10:00:00Z",
        sales_id: "user-456",
      };

      expect(() => contactNoteSchema.parse(withoutContactId)).toThrow(z.ZodError);
    });

    it("should require sales_id", () => {
      const withoutSalesId = {
        text: "Note without sales",
        date: "2024-01-15T10:00:00Z",
        contact_id: "contact-123",
      };

      expect(() => contactNoteSchema.parse(withoutSalesId)).toThrow(z.ZodError);
    });

    it("should accept both string and number IDs", () => {
      const withNumberIds = {
        text: "Note with number IDs",
        date: "2024-01-15T10:00:00Z",
        contact_id: 123,
        sales_id: 456,
      };

      expect(() => contactNoteSchema.parse(withNumberIds)).not.toThrow();
    });

    it("should handle attachments", () => {
      const noteWithAttachments = {
        ...validContactNote,
        attachments: [
          { src: "https://example.com/doc.pdf", title: "Document" },
          { src: "https://example.com/img.jpg", title: "Image" },
        ],
      };

      const result = contactNoteSchema.parse(noteWithAttachments);
      expect(result.attachments).toHaveLength(2);
    });
  });

  describe("opportunityNoteSchema", () => {
    const validOpportunityNote = {
      text: "Discussed pricing options",
      date: "2024-01-15T10:00:00Z",
      opportunity_id: "opp-123",
      sales_id: "user-456",
    };

    it("should accept valid opportunity note", () => {
      const result = opportunityNoteSchema.parse(validOpportunityNote);
      expect(result.opportunity_id).toBe("opp-123");
      expect(result.text).toBe("Discussed pricing options");
    });

    it("should require opportunity_id", () => {
      const withoutOpportunityId = {
        text: "Note without opportunity",
        date: "2024-01-15T10:00:00Z",
        sales_id: "user-456",
      };

      expect(() => opportunityNoteSchema.parse(withoutOpportunityId)).toThrow(z.ZodError);
    });

    it("should not require status field", () => {
      // Notes don't have a status field (removed during migration)
      expect(() => opportunityNoteSchema.parse(validOpportunityNote)).not.toThrow();
    });

    it("should handle attachments", () => {
      const noteWithAttachments = {
        ...validOpportunityNote,
        attachments: [{ src: "https://example.com/proposal.pdf", title: "Proposal" }],
      };

      const result = opportunityNoteSchema.parse(noteWithAttachments);
      expect(result.attachments).toHaveLength(1);
    });
  });

  describe("Validation Functions", () => {
    describe("validateCreateContactNote", () => {
      it("should validate and return parsed data", () => {
        const validData = {
          text: "Customer call notes",
          date: "2024-01-15T10:00:00Z",
          contact_id: "contact-123",
          sales_id: "user-456",
        };

        const result = validateCreateContactNote(validData);
        expect(result.text).toBe("Customer call notes");
        expect(result.contact_id).toBe("contact-123");
      });

      it("should throw for invalid creation data", () => {
        const invalidData = {
          text: "",
          date: "2024-01-15T10:00:00Z",
          contact_id: "contact-123",
          sales_id: "user-456",
        };

        expect(() => validateCreateContactNote(invalidData)).toThrow(z.ZodError);
      });
    });

    describe("validateCreateOpportunityNote", () => {
      it("should validate and return parsed data", () => {
        const validData = {
          text: "Opportunity discussion",
          date: "2024-01-15T10:00:00Z",
          opportunity_id: "opp-123",
          sales_id: "user-456",
        };

        const result = validateCreateOpportunityNote(validData);
        expect(result.text).toBe("Opportunity discussion");
        expect(result.opportunity_id).toBe("opp-123");
      });
    });
  });
});
