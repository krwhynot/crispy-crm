/**
 * Column Alias Registry for CSV Import
 * Maps common CSV header variations to ContactImportSchema fields
 *
 * IMPORTANT: Maps to ContactImportSchema fields (email_work, phone_home, etc.)
 * NOT database JSONB fields (email, phone arrays)
 */

import { FULL_NAME_SPLIT_MARKER } from "./csvConstants";

/**
 * Registry mapping ContactImportSchema field names to common CSV header variations
 * All variations are normalized (lowercase, trimmed) for comparison
 */
export const COLUMN_ALIASES: Record<string, string[]> = {
  // Core identity fields
  first_name: [
    "first_name",
    "first name",
    "first",
    "firstname",
    "fname",
    "given name",
    "given_name",
    "givenname",
    "forename",
    "christian name",
    "christian_name",
    "prenom",
    "vorname",
  ],

  last_name: [
    "last_name",
    "last name",
    "last",
    "lastname",
    "lname",
    "surname",
    "family name",
    "family_name",
    "familyname",
    "nom",
    "nachname",
    "apellido",
  ],

  // Organization field (most critical - many variations in real-world CSVs)
  organization_name: [
    "organization_name",
    "organization name",
    "organization",
    "organisations",
    "organizations",
    "organizations (dropdown)",
    "organisation",
    "company",
    "company name",
    "company_name",
    "companyname",
    "business",
    "business name",
    "business_name",
    "org",
    "org name",
    "org_name",
    "employer",
    "enterprise",
    "firm",
    "client",
    "client name",
    "client_name",
    "customer",
    "customer name",
    "account",
    "account name",
    "vendor",
    "vendor name",
  ],

  // Organization role field
  organization_role: [
    "organization_role",
    "organization role",
    "role",
    "job role",
    "job_role",
    "position",
    "position (dropdown)",
    "title",
    "job title",
    "job_title",
    "jobtitle",
    "designation",
    "function",
    "responsibility",
  ],

  // Email fields - separate work/home/other for ContactImportSchema
  email_work: [
    "email_work",
    "email work",
    "work email",
    "work_email",
    "workemail",
    "business email",
    "business_email",
    "businessemail",
    "professional email",
    "office email",
    "office_email",
    "company email",
    "corporate email",
    "email", // Default email maps to work
    "e-mail",
    "e mail",
    "email address",
    "email_address",
    "emailaddress",
    "mail",
    "email_primary",
    "primary email",
    "primary_email",
  ],

  email_home: [
    "email_home",
    "email home",
    "home email",
    "home_email",
    "homeemail",
    "personal email",
    "personal_email",
    "personalemail",
    "private email",
    "private_email",
    "email personal",
    "email_personal",
    "secondary email",
    "secondary_email",
    "email_secondary",
  ],

  email_other: [
    "email_other",
    "email other",
    "other email",
    "other_email",
    "otheremail",
    "alternate email",
    "alternate_email",
    "alternative email",
    "additional email",
    "additional_email",
    "backup email",
    "email_alternate",
    "email alternate",
    "email_additional",
    "tertiary email",
    "email_tertiary",
  ],

  // Phone fields - separate work/home/other for ContactImportSchema
  phone_work: [
    "phone_work",
    "phone work",
    "work phone",
    "work_phone",
    "workphone",
    "business phone",
    "business_phone",
    "businessphone",
    "office phone",
    "office_phone",
    "officephone",
    "company phone",
    "desk phone",
    "phone", // Default phone maps to work
    "phone number",
    "phone_number",
    "phonenumber",
    "telephone",
    "tel",
    "mobile",
    "mobile phone",
    "mobile_phone",
    "cell",
    "cell phone",
    "cellphone",
    "contact number",
    "contact_number",
    "primary phone",
    "phone_primary",
  ],

  phone_home: [
    "phone_home",
    "phone home",
    "home phone",
    "home_phone",
    "homephone",
    "personal phone",
    "personal_phone",
    "personalphone",
    "private phone",
    "private_phone",
    "residential phone",
    "house phone",
    "phone personal",
    "phone_personal",
    "secondary phone",
    "phone_secondary",
  ],

  phone_other: [
    "phone_other",
    "phone other",
    "other phone",
    "other_phone",
    "otherphone",
    "alternate phone",
    "alternate_phone",
    "alternative phone",
    "additional phone",
    "additional_phone",
    "backup phone",
    "fax",
    "fax number",
    "phone_alternate",
    "phone alternate",
    "phone_additional",
    "tertiary phone",
    "phone_tertiary",
  ],

  // Professional info
  title: [
    "title",
    "job title",
    "job_title",
    "jobtitle",
    "position title",
    "position_title",
    "professional title",
    "role title",
    "designation",
    "job position",
    "job_position",
    "work title",
  ],

  // Gender field
  gender: ["gender", "sex", "gender identity", "gender_identity", "m/f", "male/female", "pronouns"],

  // Avatar/photo field
  avatar: [
    "avatar",
    "photo",
    "picture",
    "profile picture",
    "profile_picture",
    "profile photo",
    "profile_photo",
    "headshot",
    "image",
    "image url",
    "image_url",
    "photo url",
    "photo_url",
    "avatar url",
    "avatar_url",
  ],

  // Date fields
  first_seen: [
    "first_seen",
    "first seen",
    "date added",
    "date_added",
    "dateadded",
    "created",
    "created date",
    "created_date",
    "creation date",
    "added on",
    "added_on",
    "first contact",
    "first_contact",
    "initial contact",
  ],

  last_seen: [
    "last_seen",
    "last seen",
    "last contact",
    "last_contact",
    "last contacted",
    "last_contacted",
    "last activity",
    "last_activity",
    "last interaction",
    "last_interaction",
    "recent contact",
    "updated",
    "updated date",
    "modified",
    "modified date",
  ],

  // Tags field
  tags: [
    "tags",
    "tag",
    "categories",
    "category",
    "labels",
    "label",
    "groups",
    "group",
    "segments",
    "segment",
    "keywords",
    "keyword",
    "classifications",
  ],

  // Social media
  linkedin_url: [
    "linkedin_url",
    "linkedin url",
    "linkedin",
    "linkedin profile",
    "linkedin_profile",
    "linkedin link",
    "linkedin_link",
    "social media",
    "social_media",
    "linkedin address",
    "li url",
    "li_url",
  ],

  // Notes field
  notes: [
    "notes",
    "note",
    "comments",
    "comment",
    "description",
    "remarks",
    "remark",
    "memo",
    "memos",
    "additional info",
    "additional_info",
    "additional information",
    "details",
    "detail",
    "observations",
    "observation",
  ],
};

/**
 * Special patterns for detecting full name columns that need to be split
 * These columns contain both first and last name in a single field
 */
export const FULL_NAME_PATTERNS: string[] = [
  "full name",
  "fullname",
  "full_name",
  "name",
  "contact name",
  "contact_name",
  "contactname",
  "person name",
  "person_name",
  "full name (first, last)",
  "full name (first,last)",
  "full name (first last)",
  "complete name",
  "complete_name",
  "whole name",
  "display name",
  "display_name",
  "customer name",
  "client name",
  "user name",
  "username",
  "contact",
  "person",
];

/**
 * Normalize a header string for comparison
 * - Converts to lowercase
 * - Trims whitespace
 * - Removes special characters (keeping spaces, underscores, hyphens)
 * - Collapses multiple spaces
 */
export function normalizeHeader(header: string): string {
  if (!header || typeof header !== "string") {
    return "";
  }

  return (
    header
      .toLowerCase()
      .trim()
      // Remove special characters except spaces, underscores, hyphens
      .replace(/[^a-z0-9\s_-]/g, " ")
      // Collapse multiple spaces to single space
      .replace(/\s+/g, " ")
      .trim()
  );
}

// --- Performance Optimizations: Pre-computed lookup tables ---

/**
 * Pre-computed reverse map from a normalized alias to its canonical field name.
 * This avoids re-calculating normalization and iterating the alias list on every lookup.
 * @private
 */
const NORMALIZED_ALIAS_MAP: Map<string, string> = new Map();
for (const [fieldName, aliases] of Object.entries(COLUMN_ALIASES)) {
  for (const alias of aliases) {
    const normalized = normalizeHeader(alias);
    // The first alias for a given normalized form wins.
    if (normalized && !NORMALIZED_ALIAS_MAP.has(normalized)) {
      NORMALIZED_ALIAS_MAP.set(normalized, fieldName);
    }
  }
}

/**
 * Pre-computed set of normalized full name patterns for O(1) lookups.
 * @private
 */
const NORMALIZED_FULL_NAME_PATTERNS: Set<string> = new Set(
  FULL_NAME_PATTERNS.map((p) => normalizeHeader(p)).filter(Boolean)
);

// --- End Optimizations ---

/**
 * Find the canonical ContactImportSchema field name for a user-provided header
 * Returns null if no match is found
 */
export function findCanonicalField(userHeader: string): string | null {
  if (!userHeader || typeof userHeader !== "string") {
    return null;
  }

  const normalized = normalizeHeader(userHeader);
  if (!normalized) {
    return null;
  }

  return NORMALIZED_ALIAS_MAP.get(normalized) || null;
}

/**
 * Check if a header represents a full name column that needs to be split
 */
export function isFullNameColumn(header: string): boolean {
  if (!header || typeof header !== "string") {
    return false;
  }

  const normalized = normalizeHeader(header);
  return NORMALIZED_FULL_NAME_PATTERNS.has(normalized);
}

/**
 * Get all unrecognized headers from a CSV that don't map to any ContactImportSchema field
 * Useful for showing warnings to users about unmapped columns
 */
export function getUnmappedHeaders(headers: string[]): string[] {
  if (!Array.isArray(headers)) {
    return [];
  }

  return headers.filter((header) => {
    // Skip empty headers
    if (!header || typeof header !== "string") {
      return false;
    }

    // Check if it maps to a known field
    const canonicalField = findCanonicalField(header);

    // Check if it's a full name column (these are special-handled)
    const isFullName = isFullNameColumn(header);

    // If it doesn't map to any field and isn't a full name, it's unmapped
    return !canonicalField && !isFullName;
  });
}

/**
 * Transform CSV headers to their canonical ContactImportSchema field names
 * Returns an object mapping original headers to canonical field names
 * Headers that don't match are mapped to null
 */
export function mapHeadersToFields(headers: string[]): Record<string, string | null> {
  if (!Array.isArray(headers)) {
    return {};
  }

  const mappings: Record<string, string | null> = {};

  for (const header of headers) {
    if (!header || typeof header !== "string") {
      continue;
    }

    // Check if it's a full name column
    if (isFullNameColumn(header)) {
      // Full name columns will be handled specially during import
      // Map to both first_name and last_name with a special marker
      mappings[header] = FULL_NAME_SPLIT_MARKER;
    } else {
      // Try to find canonical field
      mappings[header] = findCanonicalField(header);
    }
  }

  return mappings;
}

/**
 * Get a human-readable description of how a header will be mapped
 * Useful for preview displays
 */
export function getHeaderMappingDescription(header: string): string {
  if (!header || typeof header !== "string") {
    return "(ignored - empty header)";
  }

  if (isFullNameColumn(header)) {
    return "first_name + last_name (will be split)";
  }

  const canonical = findCanonicalField(header);
  if (canonical) {
    return canonical;
  }

  return "(ignored - no matching field)";
}

/**
 * Validate that all required ContactImportSchema fields have mappings
 * Returns an array of missing required fields
 */
export function validateRequiredMappings(mappings: Record<string, string | null>): string[] {
  const requiredFields = ["first_name", "last_name", "organization_name"];
  const mappedFields = new Set(Object.values(mappings).filter(Boolean));

  // Check if we have a full name column (which provides first_name + last_name)
  const hasFullName = Object.values(mappings).includes(FULL_NAME_SPLIT_MARKER);

  const missingFields: string[] = [];

  for (const field of requiredFields) {
    // If it's first_name or last_name and we have a full name column, it's covered
    if ((field === "first_name" || field === "last_name") && hasFullName) {
      continue;
    }

    // Otherwise check if the field is mapped
    if (!mappedFields.has(field)) {
      missingFields.push(field);
    }
  }

  return missingFields;
}

/**
 * Get all available ContactImportSchema fields for dropdown selection
 * Returns an array of field names that can be mapped to CSV columns
 */
export function getAvailableFields(): string[] {
  // Extract all unique field names from COLUMN_ALIASES
  const fieldNames = Object.keys(COLUMN_ALIASES);

  // Sort alphabetically for better UX
  return fieldNames.toSorted();
}

/**
 * Get available fields with display names for dropdown options
 * Returns an array of {value, label} objects
 */
export function getAvailableFieldsWithLabels(): Array<{ value: string; label: string }> {
  const fields = getAvailableFields();

  return [
    // Special option for full name splitting
    {
      value: FULL_NAME_SPLIT_MARKER,
      label: "Full Name (will be split into first + last)",
    },
    // All other fields
    ...fields.map((field) => ({
      value: field,
      label: field.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    })),
  ];
}
