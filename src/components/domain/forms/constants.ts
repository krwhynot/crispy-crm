/**
 * Contact type options for email and phone fields.
 * Aligned with personalInfoTypeSchema in src/atomic-crm/validation/contacts-communication.ts
 */
export const CONTACT_TYPE_OPTIONS = [
  { id: "work" },
  { id: "home" },
  { id: "other" },
] as const;

export type ContactType = (typeof CONTACT_TYPE_OPTIONS)[number]["id"];
