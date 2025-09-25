/**
 * Tests for note validation schemas
 * Validates business rules for contact and opportunity notes, attachments, and API boundary integration
 */

import { describe, it, expect } from 'vitest';
import {
  contactNoteSchema,
  opportunityNoteSchema,
  createContactNoteSchema,
  updateContactNoteSchema,
  createOpportunityNoteSchema,
  updateOpportunityNoteSchema,
  validateCreateContactNote,
  validateUpdateContactNote,
  validateCreateOpportunityNote,
  validateUpdateOpportunityNote,
  validateAttachment,
  validateAttachments,
  validateContactNoteForSubmission,
  validateOpportunityNoteForSubmission,
  transformNoteDate,
  getCurrentNoteDate,
  noteHasAttachments,
  validateAttachmentSize,
  validateAttachmentType,
  type Attachment,
  type ContactNote,
  type OpportunityNote,
} from '../notes';
import { z } from 'zod';

describe('Note Validation Schemas', () => {
  describe('Attachment validation', () => {
    const validAttachment = {
      src: 'https://example.com/uploads/document.pdf',
      title: 'Important Document',
      type: 'application/pdf',
      size: 1024000,
    };

    it('should accept valid attachment data', () => {
      const result = validateAttachment(validAttachment);
      expect(result.src).toBe('https://example.com/uploads/document.pdf');
      expect(result.title).toBe('Important Document');
    });

    it('should reject invalid URL', () => {
      const invalidData = { ...validAttachment, src: 'not-a-url' };
      expect(() => validateAttachment(invalidData)).toThrow(z.ZodError);
    });

    it('should reject empty title', () => {
      const invalidData = { ...validAttachment, title: '' };
      expect(() => validateAttachment(invalidData)).toThrow(z.ZodError);
    });

    it('should handle optional fields', () => {
      const minimalAttachment = {
        src: 'https://example.com/file.pdf',
        title: 'File',
      };

      const result = validateAttachment(minimalAttachment);
      expect(result.type).toBeUndefined();
      expect(result.size).toBeUndefined();
    });

    it('should validate multiple attachments', () => {
      const attachments = [
        { src: 'https://example.com/file1.pdf', title: 'File 1' },
        { src: 'https://example.com/file2.jpg', title: 'File 2' },
      ];

      const result = validateAttachments(attachments);
      expect(result).toHaveLength(2);
    });
  });

  describe('contactNoteSchema', () => {
    const validContactNote = {
      text: 'Called customer about renewal',
      date: '2024-01-15T10:00:00Z',
      contact_id: 'contact-123',
      sales_id: 'user-456',
      status: 'completed',
    };

    it('should accept valid contact note', () => {
      const result = contactNoteSchema.parse(validContactNote);
      expect(result.text).toBe('Called customer about renewal');
      expect(result.contact_id).toBe('contact-123');
      expect(result.status).toBe('completed');
    });

    it('should reject empty text', () => {
      const invalidData = { ...validContactNote, text: '' };
      expect(() => contactNoteSchema.parse(invalidData)).toThrow(z.ZodError);
    });

    it('should reject empty date', () => {
      const invalidData = { ...validContactNote, date: '' };
      expect(() => contactNoteSchema.parse(invalidData)).toThrow(z.ZodError);
    });

    it('should require contact_id', () => {
      const withoutContactId = {
        text: 'Note without contact',
        date: '2024-01-15T10:00:00Z',
        sales_id: 'user-456',
        status: 'completed',
      };

      expect(() => contactNoteSchema.parse(withoutContactId)).toThrow(z.ZodError);
    });

    it('should require status', () => {
      const withoutStatus = {
        text: 'Note without status',
        date: '2024-01-15T10:00:00Z',
        contact_id: 'contact-123',
        sales_id: 'user-456',
      };

      expect(() => contactNoteSchema.parse(withoutStatus)).toThrow(z.ZodError);
    });

    it('should require sales_id', () => {
      const withoutSalesId = {
        text: 'Note without sales',
        date: '2024-01-15T10:00:00Z',
        contact_id: 'contact-123',
        status: 'completed',
      };

      expect(() => contactNoteSchema.parse(withoutSalesId)).toThrow(z.ZodError);
    });

    it('should accept both string and number IDs', () => {
      const withNumberIds = {
        text: 'Note with number IDs',
        date: '2024-01-15T10:00:00Z',
        contact_id: 123,
        sales_id: 456,
        status: 'completed',
      };

      expect(() => contactNoteSchema.parse(withNumberIds)).not.toThrow();
    });

    it('should handle attachments', () => {
      const noteWithAttachments = {
        ...validContactNote,
        attachments: [
          { src: 'https://example.com/doc.pdf', title: 'Document' },
          { src: 'https://example.com/img.jpg', title: 'Image' },
        ],
      };

      const result = contactNoteSchema.parse(noteWithAttachments);
      expect(result.attachments).toHaveLength(2);
    });
  });

  describe('opportunityNoteSchema', () => {
    const validOpportunityNote = {
      text: 'Discussed pricing options',
      date: '2024-01-15T10:00:00Z',
      opportunity_id: 'opp-123',
      sales_id: 'user-456',
    };

    it('should accept valid opportunity note', () => {
      const result = opportunityNoteSchema.parse(validOpportunityNote);
      expect(result.opportunity_id).toBe('opp-123');
      expect(result.text).toBe('Discussed pricing options');
    });

    it('should require opportunity_id', () => {
      const withoutOpportunityId = {
        text: 'Note without opportunity',
        date: '2024-01-15T10:00:00Z',
        sales_id: 'user-456',
      };

      expect(() => opportunityNoteSchema.parse(withoutOpportunityId)).toThrow(z.ZodError);
    });

    it('should not require status field', () => {
      // Unlike contact notes, opportunity notes don't have a status field
      expect(() => opportunityNoteSchema.parse(validOpportunityNote)).not.toThrow();
    });

    it('should handle attachments', () => {
      const noteWithAttachments = {
        ...validOpportunityNote,
        attachments: [
          { src: 'https://example.com/proposal.pdf', title: 'Proposal' },
        ],
      };

      const result = opportunityNoteSchema.parse(noteWithAttachments);
      expect(result.attachments).toHaveLength(1);
    });
  });

  describe('Create Schemas', () => {
    describe('createContactNoteSchema', () => {
      it('should require essential fields for creation', () => {
        const validCreate = {
          text: 'New contact note',
          date: '2024-01-15T10:00:00Z',
          contact_id: 'contact-123',
          sales_id: 'user-456',
          status: 'pending',
        };

        expect(() => createContactNoteSchema.parse(validCreate)).not.toThrow();
      });

      it('should not allow id on creation', () => {
        const dataWithId = {
          id: 'should-not-be-here',
          text: 'New note',
          date: '2024-01-15T10:00:00Z',
          contact_id: 'contact-123',
          sales_id: 'user-456',
          status: 'pending',
        };

        const result = createContactNoteSchema.parse(dataWithId);
        expect('id' in result).toBe(false);
      });

      it('should handle attachments on creation', () => {
        const createWithAttachments = {
          text: 'Note with files',
          date: '2024-01-15T10:00:00Z',
          contact_id: 'contact-123',
          sales_id: 'user-456',
          status: 'completed',
          attachments: [
            { src: 'https://example.com/contract.pdf', title: 'Contract' },
          ],
        };

        const result = createContactNoteSchema.parse(createWithAttachments);
        expect(result.attachments).toHaveLength(1);
      });
    });

    describe('createOpportunityNoteSchema', () => {
      it('should require essential fields for creation', () => {
        const validCreate = {
          text: 'New opportunity note',
          date: '2024-01-15T10:00:00Z',
          opportunity_id: 'opp-123',
          sales_id: 'user-456',
        };

        expect(() => createOpportunityNoteSchema.parse(validCreate)).not.toThrow();
      });

      it('should not require status field', () => {
        const createData = {
          text: 'Opportunity update',
          date: '2024-01-15T10:00:00Z',
          opportunity_id: 'opp-123',
          sales_id: 'user-456',
        };

        expect(() => createOpportunityNoteSchema.parse(createData)).not.toThrow();
      });
    });
  });

  describe('Update Schemas', () => {
    describe('updateContactNoteSchema', () => {
      it('should require id for updates', () => {
        const validUpdate = {
          id: 'note-123',
          text: 'Updated text',
        };

        expect(() => updateContactNoteSchema.parse(validUpdate)).not.toThrow();
      });

      it('should reject updates without id', () => {
        const invalidUpdate = {
          text: 'Updated text',
        };

        expect(() => updateContactNoteSchema.parse(invalidUpdate)).toThrow(z.ZodError);
      });

      it('should allow partial updates', () => {
        expect(() => updateContactNoteSchema.parse({ id: 'n-1', text: 'New text' })).not.toThrow();
        expect(() => updateContactNoteSchema.parse({ id: 'n-1', date: '2024-01-20T10:00:00Z' })).not.toThrow();
        expect(() => updateContactNoteSchema.parse({ id: 'n-1', status: 'completed' })).not.toThrow();
        expect(() => updateContactNoteSchema.parse({ id: 'n-1' })).not.toThrow(); // Just id
      });
    });

    describe('updateOpportunityNoteSchema', () => {
      it('should require id for updates', () => {
        const validUpdate = {
          id: 'note-123',
          text: 'Updated opportunity note',
        };

        expect(() => updateOpportunityNoteSchema.parse(validUpdate)).not.toThrow();
      });

      it('should allow updating attachments', () => {
        const updateWithAttachments = {
          id: 'note-123',
          attachments: [
            { src: 'https://example.com/updated.pdf', title: 'Updated Document' },
          ],
        };

        expect(() => updateOpportunityNoteSchema.parse(updateWithAttachments)).not.toThrow();
      });
    });
  });

  describe('Validation Functions', () => {
    describe('validateCreateContactNote', () => {
      it('should validate and return parsed data', () => {
        const validData = {
          text: 'Customer call notes',
          date: '2024-01-15T10:00:00Z',
          contact_id: 'contact-123',
          sales_id: 'user-456',
          status: 'completed',
        };

        const result = validateCreateContactNote(validData);
        expect(result.text).toBe('Customer call notes');
        expect(result.contact_id).toBe('contact-123');
      });

      it('should throw for invalid creation data', () => {
        const invalidData = {
          text: '',
          date: '2024-01-15T10:00:00Z',
          contact_id: 'contact-123',
          sales_id: 'user-456',
          status: 'completed',
        };

        expect(() => validateCreateContactNote(invalidData)).toThrow(z.ZodError);
      });
    });

    describe('validateCreateOpportunityNote', () => {
      it('should validate and return parsed data', () => {
        const validData = {
          text: 'Opportunity discussion',
          date: '2024-01-15T10:00:00Z',
          opportunity_id: 'opp-123',
          sales_id: 'user-456',
        };

        const result = validateCreateOpportunityNote(validData);
        expect(result.text).toBe('Opportunity discussion');
        expect(result.opportunity_id).toBe('opp-123');
      });
    });

    describe('validateContactNoteForSubmission', () => {
      it('should validate and transform date', () => {
        const inputData = {
          text: 'Note for submission',
          date: '2024-01-15T10:00:00',
          contact_id: 'contact-123',
          sales_id: 'user-456',
          status: 'completed',
        };

        const result = validateContactNoteForSubmission(inputData);
        expect(result.text).toBe('Note for submission');
        expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      });
    });

    describe('validateOpportunityNoteForSubmission', () => {
      it('should validate and transform date', () => {
        const inputData = {
          text: 'Opportunity note for submission',
          date: '2024-01-15T10:00:00',
          opportunity_id: 'opp-123',
          sales_id: 'user-456',
        };

        const result = validateOpportunityNoteForSubmission(inputData);
        expect(result.text).toBe('Opportunity note for submission');
        expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      });
    });
  });

  describe('Helper Functions', () => {
    describe('transformNoteDate', () => {
      it('should transform dates to ISO format', () => {
        const testCases = [
          { input: '2024-01-15T10:00:00', expected: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/ },
          { input: '2024-01-15T10:00:00Z', expected: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/ },
          { input: '2024-01-15', expected: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/ },
        ];

        testCases.forEach(({ input, expected }) => {
          const result = transformNoteDate(input);
          expect(result).toMatch(expected);
        });
      });
    });

    describe('getCurrentNoteDate', () => {
      it('should return current date in expected format', () => {
        const result = getCurrentNoteDate();
        expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
      });
    });

    describe('noteHasAttachments', () => {
      it('should detect notes with attachments', () => {
        const noteWithAttachments: ContactNote = {
          text: 'Note',
          date: '2024-01-15',
          contact_id: 'c-1',
          sales_id: 'u-1',
          status: 'completed',
          attachments: [{ src: 'https://example.com/file.pdf', title: 'File' }],
        };

        expect(noteHasAttachments(noteWithAttachments)).toBe(true);
      });

      it('should detect notes without attachments', () => {
        const noteWithoutAttachments: ContactNote = {
          text: 'Note',
          date: '2024-01-15',
          contact_id: 'c-1',
          sales_id: 'u-1',
          status: 'completed',
        };

        expect(noteHasAttachments(noteWithoutAttachments)).toBe(false);
      });

      it('should handle empty attachment arrays', () => {
        const noteWithEmptyAttachments: ContactNote = {
          text: 'Note',
          date: '2024-01-15',
          contact_id: 'c-1',
          sales_id: 'u-1',
          status: 'completed',
          attachments: [],
        };

        expect(noteHasAttachments(noteWithEmptyAttachments)).toBe(false);
      });
    });

    describe('validateAttachmentSize', () => {
      it('should accept valid file sizes', () => {
        expect(validateAttachmentSize(5 * 1024 * 1024)).toBeUndefined(); // 5MB
        expect(validateAttachmentSize(10 * 1024 * 1024)).toBeUndefined(); // 10MB exactly
        expect(validateAttachmentSize(1024)).toBeUndefined(); // 1KB
      });

      it('should reject files over default limit', () => {
        const result = validateAttachmentSize(11 * 1024 * 1024); // 11MB
        expect(result).toBe('File size must be less than 10MB');
      });

      it('should respect custom size limits', () => {
        expect(validateAttachmentSize(4 * 1024 * 1024, 5)).toBeUndefined(); // 4MB with 5MB limit
        expect(validateAttachmentSize(6 * 1024 * 1024, 5)).toBe('File size must be less than 5MB');
      });
    });

    describe('validateAttachmentType', () => {
      it('should accept valid file types', () => {
        expect(validateAttachmentType('document.pdf')).toBeUndefined();
        expect(validateAttachmentType('image.jpg')).toBeUndefined();
        expect(validateAttachmentType('file.docx')).toBeUndefined();
        expect(validateAttachmentType('photo.png')).toBeUndefined();
      });

      it('should reject invalid file types', () => {
        const result = validateAttachmentType('script.exe');
        expect(result).toContain('File type .exe is not allowed');
      });

      it('should handle case-insensitive extensions', () => {
        expect(validateAttachmentType('Document.PDF')).toBeUndefined();
        expect(validateAttachmentType('IMAGE.JPG')).toBeUndefined();
      });

      it('should respect custom allowed extensions', () => {
        const customAllowed = ['.pdf', '.txt'];
        expect(validateAttachmentType('file.pdf', customAllowed)).toBeUndefined();
        expect(validateAttachmentType('file.jpg', customAllowed)).toContain('File type .jpg is not allowed');
      });
    });
  });

  describe('Business Rules', () => {
    it('should enforce required fields for contact notes', () => {
      const incompleteNote = {
        text: 'Note',
        // Missing other required fields
      };

      expect(() => contactNoteSchema.parse(incompleteNote)).toThrow(z.ZodError);
    });

    it('should enforce required fields for opportunity notes', () => {
      const incompleteNote = {
        text: 'Note',
        date: '2024-01-15',
        // Missing opportunity_id and sales_id
      };

      expect(() => opportunityNoteSchema.parse(incompleteNote)).toThrow(z.ZodError);
    });

    it('should validate attachment URLs', () => {
      const noteWithInvalidAttachment = {
        text: 'Note',
        date: '2024-01-15',
        contact_id: 'c-1',
        sales_id: 'u-1',
        status: 'completed',
        attachments: [
          { src: 'not-a-url', title: 'Invalid' }
        ],
      };

      expect(() => contactNoteSchema.parse(noteWithInvalidAttachment)).toThrow(z.ZodError);
    });
  });

  describe('Error Message Formatting', () => {
    it('should provide clear error messages', () => {
      const testCases = [
        {
          data: { text: '', date: '2024-01-15', contact_id: 'c-1', sales_id: 'u-1', status: 'done' },
          expectedError: 'Note text is required',
        },
        {
          data: { text: 'Note', date: '', contact_id: 'c-1', sales_id: 'u-1', status: 'done' },
          expectedError: 'Date is required',
        },
        {
          data: { text: 'Note', date: '2024-01-15', contact_id: '', sales_id: 'u-1', status: 'done' },
          expectedError: 'Contact ID is required',
        },
        {
          data: { text: 'Note', date: '2024-01-15', contact_id: 'c-1', sales_id: '', status: 'done' },
          expectedError: 'Sales ID is required',
        },
        {
          data: { text: 'Note', date: '2024-01-15', contact_id: 'c-1', sales_id: 'u-1', status: '' },
          expectedError: 'Status is required',
        },
      ];

      testCases.forEach(({ data, expectedError }) => {
        try {
          contactNoteSchema.parse(data);
          expect.fail('Should have thrown error');
        } catch (error) {
          if (error instanceof z.ZodError) {
            const message = error.errors[0].message;
            expect(message).toBe(expectedError);
          }
        }
      });
    });
  });

  describe('API Boundary Integration', () => {
    it('should validate at creation boundary', () => {
      const apiPayload = {
        text: 'API created note',
        date: '2024-01-15T10:00:00Z',
        contact_id: 'contact-123',
        sales_id: 'user-456',
        status: 'completed',
        malicious_field: 'should be stripped',
      };

      const result = validateCreateContactNote(apiPayload);
      expect(result.text).toBe('API created note');
      expect('malicious_field' in result).toBe(false);
    });

    it('should handle type coercion at boundary', () => {
      const apiPayload = {
        text: 'Coerced note',
        date: '2024-01-15T10:00:00Z',
        contact_id: 123, // Number instead of string
        sales_id: 456, // Number instead of string
        status: 'completed',
      };

      const result = contactNoteSchema.parse(apiPayload);
      expect(result.contact_id).toBe(123);
      expect(result.sales_id).toBe(456);
    });

    it('should handle attachment payload', () => {
      const uploadPayload = {
        text: 'Note with upload',
        date: '2024-01-15T10:00:00Z',
        opportunity_id: 'opp-123',
        sales_id: 'user-456',
        attachments: [
          {
            src: 'https://storage.example.com/upload-123.pdf',
            title: 'Uploaded Document',
            type: 'application/pdf',
            size: 2048000,
          },
        ],
      };

      const result = validateCreateOpportunityNote(uploadPayload);
      expect(result.attachments).toHaveLength(1);
      expect(result.attachments?.[0].title).toBe('Uploaded Document');
    });
  });
});