/**
 * Note validation schemas and functions
 *
 * Implements Zod validation for contact and opportunity notes
 * following Core Principle #3: Single point validation at API boundaries
 */

import { z } from "zod";

/**
 * Attachment validation schema
 * Validates file attachments for notes
 */
const attachmentSchema = z.object({
  src: z.string().url("Invalid attachment URL"),
  title: z.string().min(1, "Attachment title is required"),
  type: z.string().optional(),
  size: z.number().positive().optional(),
});

/**
 * Base note schema with common fields
 */
export const baseNoteSchema = z.object({
  // Required fields
  text: z.string().min(1, "Note text is required"),
  date: z.string().min(1, "Date is required"),
  sales_id: z.union([
    z.string().min(1, "Sales ID is required"),
    z.number().min(1, "Sales ID is required"),
  ]),

  // Optional fields
  attachments: z.array(attachmentSchema).optional(),

  // ID only present on updates
  id: z.union([z.string(), z.number()]).optional(),

  // Timestamps (automatically managed by database)
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

/**
 * Contact note specific schema
 */
export const contactNoteSchema = baseNoteSchema.extend({
  contact_id: z.union([
    z.string().min(1, "Contact ID is required"),
    z.number().min(1, "Contact ID is required"),
  ]),
});

/**
 * Opportunity note specific schema
 */
export const opportunityNoteSchema = baseNoteSchema.extend({
  opportunity_id: z.union([
    z.string().min(1, "Opportunity ID is required"),
    z.number().min(1, "Opportunity ID is required"),
  ]),
});

/**
 * Organization note specific schema
 * Added for organization-level notes (CRM relationship tracking)
 */
export const organizationNoteSchema = baseNoteSchema.extend({
  organization_id: z.union([
    z.string().min(1, "Organization ID is required"),
    z.number().min(1, "Organization ID is required"),
  ]),
});

/**
 * Schema for creating a contact note
 */
export const createContactNoteSchema = contactNoteSchema.omit({ id: true });

/**
 * Schema for updating a contact note
 */
export const updateContactNoteSchema = contactNoteSchema.partial().required({ id: true });

/**
 * Schema for creating an opportunity note
 */
export const createOpportunityNoteSchema = opportunityNoteSchema.omit({
  id: true,
});

/**
 * Schema for updating an opportunity note
 */
export const updateOpportunityNoteSchema = opportunityNoteSchema.partial().required({ id: true });

/**
 * Schema for creating an organization note
 */
export const createOrganizationNoteSchema = organizationNoteSchema.omit({ id: true });

/**
 * Schema for updating an organization note
 */
export const updateOrganizationNoteSchema = organizationNoteSchema.partial().required({ id: true });

/**
 * Inferred types from schemas
 */
export type Attachment = z.infer<typeof attachmentSchema>;
export type ContactNote = z.infer<typeof contactNoteSchema>;
export type OpportunityNote = z.infer<typeof opportunityNoteSchema>;
export type OrganizationNote = z.infer<typeof organizationNoteSchema>;
export type CreateContactNoteInput = z.infer<typeof createContactNoteSchema>;
export type UpdateContactNoteInput = z.infer<typeof updateContactNoteSchema>;
export type CreateOpportunityNoteInput = z.infer<typeof createOpportunityNoteSchema>;
export type UpdateOpportunityNoteInput = z.infer<typeof updateOpportunityNoteSchema>;
export type CreateOrganizationNoteInput = z.infer<typeof createOrganizationNoteSchema>;
export type UpdateOrganizationNoteInput = z.infer<typeof updateOrganizationNoteSchema>;

/**
 * Validate contact note creation data
 * @param data - Note data to validate
 * @returns Validated note data
 * @throws Zod validation error if data is invalid
 */
export function validateCreateContactNote(data: unknown): CreateContactNoteInput {
  return createContactNoteSchema.parse(data);
}

/**
 * Validate contact note update data
 * @param data - Note data to validate
 * @returns Validated note data
 * @throws Zod validation error if data is invalid
 */
export function validateUpdateContactNote(data: unknown): UpdateContactNoteInput {
  return updateContactNoteSchema.parse(data);
}

/**
 * Validate opportunity note creation data
 * @param data - Note data to validate
 * @returns Validated note data
 * @throws Zod validation error if data is invalid
 */
export function validateCreateOpportunityNote(data: unknown): CreateOpportunityNoteInput {
  return createOpportunityNoteSchema.parse(data);
}

/**
 * Validate opportunity note update data
 * @param data - Note data to validate
 * @returns Validated note data
 * @throws Zod validation error if data is invalid
 */
export function validateUpdateOpportunityNote(data: unknown): UpdateOpportunityNoteInput {
  return updateOpportunityNoteSchema.parse(data);
}

/**
 * Validate organization note creation data
 * @param data - Note data to validate
 * @returns Validated note data
 * @throws Zod validation error if data is invalid
 */
export function validateCreateOrganizationNote(data: unknown): CreateOrganizationNoteInput {
  return createOrganizationNoteSchema.parse(data);
}

/**
 * Validate organization note update data
 * @param data - Note data to validate
 * @returns Validated note data
 * @throws Zod validation error if data is invalid
 */
export function validateUpdateOrganizationNote(data: unknown): UpdateOrganizationNoteInput {
  return updateOrganizationNoteSchema.parse(data);
}

/**
 * Validate attachment data
 * @param attachment - Attachment data to validate
 * @returns Validated attachment data
 * @throws Zod validation error if data is invalid
 */
export function validateAttachment(attachment: unknown): Attachment {
  return attachmentSchema.parse(attachment);
}

/**
 * Validate multiple attachments
 * @param attachments - Array of attachments to validate
 * @returns Validated attachments array
 * @throws Zod validation error if any attachment is invalid
 */
export function validateAttachments(attachments: unknown[]): Attachment[] {
  return z.array(attachmentSchema).parse(attachments);
}

/**
 * Validate and transform contact note for submission
 * @param data - Note data to validate and transform
 * @returns Transformed note data ready for database
 */
export function validateContactNoteForSubmission(data: unknown): ContactNote {
  const validated = contactNoteSchema.parse(data);

  // Transform date to ISO format with milliseconds
  if (validated.date) {
    validated.date = transformNoteDate(validated.date);
  }

  return validated;
}

/**
 * Validate and transform opportunity note for submission
 * @param data - Note data to validate and transform
 * @returns Transformed note data ready for database
 */
export function validateOpportunityNoteForSubmission(data: unknown): OpportunityNote {
  const validated = opportunityNoteSchema.parse(data);

  // Transform date to ISO format with milliseconds
  if (validated.date) {
    validated.date = transformNoteDate(validated.date);
  }

  return validated;
}

/**
 * Validate and transform organization note for submission
 * @param data - Note data to validate and transform
 * @returns Transformed note data ready for database
 */
export function validateOrganizationNoteForSubmission(data: unknown): OrganizationNote {
  const validated = organizationNoteSchema.parse(data);

  // Transform date to ISO format with milliseconds
  if (validated.date) {
    validated.date = transformNoteDate(validated.date);
  }

  return validated;
}

/**
 * Check if a note has attachments
 * @param note - Note to check
 * @returns True if note has attachments
 */
export function noteHasAttachments(
  note: ContactNote | OpportunityNote | OrganizationNote
): boolean {
  return Array.isArray(note.attachments) && note.attachments.length > 0;
}

/**
 * Validate note attachment file size
 * @param sizeInBytes - File size in bytes
 * @param maxSizeMB - Maximum allowed size in MB (default 10MB)
 * @returns Error message if too large, undefined if valid
 */
export function validateAttachmentSize(
  sizeInBytes: number,
  maxSizeMB: number = 10
): string | undefined {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  if (sizeInBytes > maxSizeBytes) {
    return `File size must be less than ${maxSizeMB}MB`;
  }

  return undefined;
}

/**
 * Validate note attachment file type
 * @param fileName - Name of the file
 * @param allowedExtensions - Array of allowed file extensions
 * @returns Error message if invalid type, undefined if valid
 */
export function validateAttachmentType(
  fileName: string,
  allowedExtensions: string[] = [".pdf", ".doc", ".docx", ".txt", ".png", ".jpg", ".jpeg"]
): string | undefined {
  const fileExtension = fileName.toLowerCase().substring(fileName.lastIndexOf("."));

  if (!allowedExtensions.includes(fileExtension)) {
    return `File type ${fileExtension} is not allowed. Allowed types: ${allowedExtensions.join(", ")}`;
  }

  return undefined;
}

/**
 * Get the current date in ISO format for note timestamps
 * @returns Current date/time in ISO string format
 */
export function getCurrentDate(): string {
  return new Date().toISOString();
}

/**
 * Format date for datetime-local input (YYYY-MM-DDTHH:MM)
 * @param date - Optional date to format, defaults to now
 * @returns Formatted date string for datetime-local input
 */
export function formatDateForInput(date?: Date | string): string {
  const d = date ? new Date(date) : new Date();
  return d.toISOString().slice(0, 16);
}

/**
 * Transform note date to ISO format with milliseconds
 * @param date - Date string to transform
 * @returns Date in ISO format with milliseconds
 */
export function transformNoteDate(date: string): string {
  return new Date(date).toISOString();
}

/**
 * Get current note date in format YYYY-MM-DDTHH:MM
 * @returns Current date/time formatted for input
 */
export function getCurrentNoteDate(): string {
  return formatDateForInput(new Date());
}
