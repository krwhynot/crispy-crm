/**
 * Contact type options for email and phone fields.
 * Aligned with personalInfoTypeSchema in the validation layer (contacts-communication.ts)
 */
export type ContactType = "work" | "home" | "other";

// Mutable array for React Admin SelectInput compatibility
export const CONTACT_TYPE_OPTIONS: Array<{ id: ContactType }> = [
  { id: "work" },
  { id: "home" },
  { id: "other" },
];
