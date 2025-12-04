/**
 * Tests for note API boundary integration
 * Focus: API payload validation, type coercion, and security
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  contactNoteSchema,
  validateCreateContactNote,
  validateCreateOpportunityNote,
} from "../../notes";

describe("Note API Boundary Integration", () => {
  it("should reject unrecognized fields at creation boundary (z.strictObject security)", () => {
    // z.strictObject() prevents mass assignment attacks by rejecting unknown keys
    const apiPayload = {
      text: "API created note",
      date: "2024-01-15T10:00:00Z",
      contact_id: "contact-123",
      sales_id: "user-456",
      malicious_field: "should be rejected",
    };

    expect(() => validateCreateContactNote(apiPayload)).toThrow(z.ZodError);
  });

  it("should handle type coercion at boundary", () => {
    const apiPayload = {
      text: "Coerced note",
      date: "2024-01-15T10:00:00Z",
      contact_id: 123, // Number instead of string
      sales_id: 456, // Number instead of string
    };

    const result = contactNoteSchema.parse(apiPayload);
    expect(result.contact_id).toBe(123);
    expect(result.sales_id).toBe(456);
  });

  it("should handle attachment payload", () => {
    const uploadPayload = {
      text: "Note with upload",
      date: "2024-01-15T10:00:00Z",
      opportunity_id: "opp-123",
      sales_id: "user-456",
      attachments: [
        {
          src: "https://storage.example.com/upload-123.pdf",
          title: "Uploaded Document",
          type: "application/pdf",
          size: 2048000,
        },
      ],
    };

    const result = validateCreateOpportunityNote(uploadPayload);
    expect(result.attachments).toHaveLength(1);
    expect(result.attachments?.[0].title).toBe("Uploaded Document");
  });
});
