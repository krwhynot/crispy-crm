/**
 * exportHelpers.ts - CSV export utility functions
 */
import type { EmailAndType, PhoneNumberAndType } from "../types";

// Lowercase to match Zod schema (personalInfoTypeSchema)
export type EmailType = "work" | "home" | "other";
export type PhoneType = "work" | "home" | "other";

export function extractEmailByType(
  emails: EmailAndType[] | undefined,
  type: EmailType
): string | undefined {
  return emails?.find((e) => e.type === type)?.email;
}

export function extractPhoneByType(
  phones: PhoneNumberAndType[] | undefined,
  type: PhoneType
): string | undefined {
  return phones?.find((p) => p.type === type)?.number;
}

export function flattenEmailsForExport(emails: EmailAndType[] | undefined): {
  email_work?: string;
  email_home?: string;
  email_other?: string;
} {
  return {
    email_work: extractEmailByType(emails, "Work"),
    email_home: extractEmailByType(emails, "Home"),
    email_other: extractEmailByType(emails, "Other"),
  };
}

export function flattenPhonesForExport(phones: PhoneNumberAndType[] | undefined): {
  phone_work?: string;
  phone_home?: string;
  phone_other?: string;
} {
  return {
    phone_work: extractPhoneByType(phones, "Work"),
    phone_home: extractPhoneByType(phones, "Home"),
    phone_other: extractPhoneByType(phones, "Other"),
  };
}
