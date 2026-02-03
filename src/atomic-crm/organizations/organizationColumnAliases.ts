/**
 * Column Alias Registry for Organization CSV Import
 * Maps common CSV header variations to Organization schema fields
 *
 * Based on data/organizations.csv structure:
 * Headers: "PRIORITY-FOCUS (A-D)", "Organizations", "SEGMENT", "DISTRIBUTOR",
 *          "PHONE", "STREET ADDRESS", "CITY", "STATE", "Zip Code", "NOTES", "LINKEDIN"
 */

/**
 * Registry mapping Organization schema field names to common CSV header variations
 * All variations are normalized (lowercase, trimmed) for comparison
 */
export const ORGANIZATION_COLUMN_ALIASES: Record<string, string[]> = {
  // Organization name field (primary identifier)
  name: [
    "name",
    "organization",
    "organizations",
    "organisation",
    "organisations",
    "company",
    "company name",
    "company_name",
    "business",
    "business name",
    "business_name",
    "org",
    "org name",
    "org_name",
    "organization name",
    "organization_name",
    "customer",
    "customer name",
    "account",
    "account name",
    "vendor",
    "vendor name",
  ],

  // Priority field (A, B, C, D)
  priority: [
    "priority",
    "priority-focus",
    "priority focus",
    "priority a-d",
    "priority (a-d)",
    "priority-focus (a-d)",
    "priority-focus (a-d) a-highest",
    "priority level",
    "priority_level",
    "tier",
    "ranking",
    "importance",
  ],

  // Segment/Industry field
  segment_id: [
    "segment",
    "segment_id",
    "industry",
    "sector",
    "vertical",
    "market",
    "category",
    "type",
    "business type",
    "business_type",
  ],

  // Phone field
  phone: [
    "phone",
    "phone number",
    "phone_number",
    "phonenumber",
    "telephone",
    "tel",
    "contact number",
    "contact_number",
    "office phone",
    "office_phone",
    "business phone",
    "business_phone",
    "main phone",
    "main_phone",
  ],

  // Address field
  address: [
    "address",
    "street address",
    "street_address",
    "streetaddress",
    "street",
    "address line 1",
    "address_line_1",
    "address1",
    "physical address",
    "physical_address",
    "mailing address",
    "mailing_address",
    "location",
  ],

  // City field
  city: ["city", "town", "municipality", "locality"],

  // State field
  state: ["state", "state abbr", "state_abbr", "stateabbr", "province", "region", "territory"],

  // Postal code field
  postal_code: [
    "postal_code",
    "postal code",
    "zip",
    "zip code",
    "zip_code",
    "zipcode",
    "postcode",
    "post code",
    "post_code",
  ],

  // LinkedIn URL field
  linkedin_url: [
    "linkedin",
    "linkedin_url",
    "linkedin url",
    "linkedin profile",
    "linkedin_profile",
    "linkedin link",
    "linkedin_link",
    "linkedin page",
    "linkedin_page",
    "li url",
    "li_url",
    "social media",
    "social_media",
  ],

  // Notes/Description field
  description: [
    "notes",
    "note",
    "description",
    "comments",
    "comment",
    "remarks",
    "remark",
    "memo",
    "memos",
    "details",
    "detail",
    "additional info",
    "additional_info",
    "additional information",
    "observations",
    "observation",
  ],

  // Website field
  website: [
    "website",
    "web site",
    "web_site",
    "url",
    "web",
    "homepage",
    "home page",
    "home_page",
    "site",
    "web address",
    "web_address",
    "company website",
    "company_website",
  ],

  // Organization type field
  organization_type: [
    "organization_type",
    "organization type",
    "org type",
    "org_type",
    "type",
    "category",
    "classification",
    "customer type",
    "customer_type",
    "account type",
    "account_type",
  ],

  // Distributor field (if mapped to a specific field in your schema)
  // If this is a relationship to another organization, you might handle it differently
  distributor: [
    "distributor",
    "distributor name",
    "distributor_name",
    "dist",
    "dist name",
    "distribution partner",
    "distribution_partner",
  ],

  // Sales rep field (if applicable)
  sales_id: [
    "sales",
    "sales_id",
    "sales rep",
    "sales_rep",
    "salesrep",
    "account manager",
    "account_manager",
    "primary acct manager",
    "primary acct. manager",
    "secondary acct manager",
    "secondary acct. manager",
    "rep",
    "representative",
    "assigned to",
    "assigned_to",
    "owner",
  ],
};

/**
 * Normalize a header string for comparison
 * - Converts to lowercase
 * - Trims whitespace
 * - Removes parentheses and their contents (e.g., "(DropDown)", "(Required)")
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
      // Remove parentheses and everything inside them (e.g., "(DropDown)" -> "")
      .replace(/\([^)]*\)/g, " ")
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
for (const [fieldName, aliases] of Object.entries(ORGANIZATION_COLUMN_ALIASES)) {
  for (const alias of aliases) {
    const normalized = normalizeHeader(alias);
    // The first alias for a given normalized form wins.
    if (normalized && !NORMALIZED_ALIAS_MAP.has(normalized)) {
      NORMALIZED_ALIAS_MAP.set(normalized, fieldName);
    }
  }
}

// --- End Optimizations ---

/**
 * Find the canonical Organization schema field name for a user-provided header
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
 * Transform CSV headers to their canonical Organization schema field names
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

    // Try to find canonical field
    mappings[header] = findCanonicalField(header);
  }

  return mappings;
}

/**
 * Get all available Organization schema fields for dropdown selection
 * Returns an array of field names that can be mapped to CSV columns
 */
export function getAvailableFields(): string[] {
  // Extract all unique field names from ORGANIZATION_COLUMN_ALIASES
  const fieldNames = Object.keys(ORGANIZATION_COLUMN_ALIASES);

  // Sort alphabetically for better UX
  return fieldNames.toSorted();
}

/**
 * Get available fields with display names for dropdown options
 * Returns an array of {value, label} objects
 */
export function getAvailableFieldsWithLabels(): Array<{ value: string; label: string }> {
  const fields = getAvailableFields();

  return fields.map((field) => ({
    value: field,
    label: field.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
  }));
}
