/**
 * Pure business logic for CSV contact import
 * Shared between application code and test scripts
 */

import type { ContactImportSchema, DataQualityDecisions } from "./contactImport.types";
import { importContactSchema } from "../validation/contacts";

/**
 * A consistent utility to check if a contact record is an organization-only entry.
 * An org-only entry has an organization name but lacks both first and last names.
 * @param contact The contact data to check.
 * @returns True if the contact is an organization-only entry.
 */
export function isOrganizationOnlyEntry(contact: Partial<ContactImportSchema>): boolean {
  const hasOrgName = contact.organization_name && String(contact.organization_name).trim();
  const hasFirstName = contact.first_name && String(contact.first_name).trim();
  const hasLastName = contact.last_name && String(contact.last_name).trim();

  return !!(hasOrgName && !hasFirstName && !hasLastName);
}

/**
 * Checks if a contact has a name but lacks any contact information (email or phone).
 * @param contact The contact data to check.
 * @returns True if the contact has a name but no contact info.
 */
export function isContactWithoutContactInfo(contact: Partial<ContactImportSchema>): boolean {
  const hasFirstName = contact.first_name && String(contact.first_name).trim();
  const hasLastName = contact.last_name && String(contact.last_name).trim();
  const hasName = hasFirstName || hasLastName;

  const hasEmail =
    (contact.email_work && String(contact.email_work).trim()) ||
    (contact.email_home && String(contact.email_home).trim()) ||
    (contact.email_other && String(contact.email_other).trim());

  const hasPhone =
    (contact.phone_work && String(contact.phone_work).trim()) ||
    (contact.phone_home && String(contact.phone_home).trim()) ||
    (contact.phone_other && String(contact.phone_other).trim());

  return !!(hasName && !hasEmail && !hasPhone);
}

/**
 * Applies data quality transformations to a set of contacts based on user decisions.
 * Currently handles auto-filling placeholder contacts for organization-only entries.
 *
 * @param contacts The array of contacts to transform.
 * @param decisions The user's data quality choices.
 * @returns An object containing the transformed contacts and metadata about the transformation.
 */
export function applyDataQualityTransformations(
  contacts: ContactImportSchema[],
  decisions: DataQualityDecisions = {
    importOrganizationsWithoutContacts: false,
    importContactsWithoutContactInfo: false,
  }
) {
  const autoFilledContacts = new Set<number>();

  const transformedContacts = contacts.map((contact, index) => {
    const transformed = { ...contact };

    // Auto-fill placeholder contact if the user approved this action.
    if (isOrganizationOnlyEntry(transformed) && decisions.importOrganizationsWithoutContacts) {
      transformed.first_name = "General";
      transformed.last_name = "Contact";
      autoFilledContacts.add(index);
    }

    return transformed;
  });

  return {
    transformedContacts,
    autoFilledCount: autoFilledContacts.size,
    wasAutoFilled: (index: number) => autoFilledContacts.has(index),
  };
}

/**
 * Validates a batch of contacts that have already been transformed.
 *
 * @param contacts The transformed contacts to validate.
 * @returns An object containing successfully validated data and detailed errors.
 */
export function validateTransformedContacts(contacts: ContactImportSchema[]) {
  const validationResults = contacts.map((contact, index) => {
    const result = importContactSchema.safeParse(contact);
    return {
      index,
      contact,
      success: result.success,
      error: result.success ? null : result.error,
    };
  });

  const successful: Array<ContactImportSchema & { originalIndex: number }> = [];
  const failed: Array<{
    originalIndex: number;
    data: ContactImportSchema;
    errors: Array<{ field: string; message: string }>;
  }> = [];

  for (const r of validationResults) {
    if (r.success) {
      successful.push({ ...r.contact, originalIndex: r.index });
    } else {
      failed.push({
        originalIndex: r.index,
        data: r.contact,
        errors: r.error!.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }
  }

  return { successful, failed };
}
