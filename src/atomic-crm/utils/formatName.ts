/**
 * Format a name from parts, returning "--" if no valid name exists.
 * Sanitizes literal "null" strings that may have been stored in the database
 * from CSV imports with missing fields.
 *
 * Distinct from {@link formatFullName} in `formatters.ts` which does standard
 * name formatting WITHOUT null-string sanitization. Use this function when
 * displaying data that may originate from CSV imports or legacy records.
 * Use `formatFullName` for display-only contexts with clean data.
 */
export function formatName(firstName?: string | null, lastName?: string | null): string {
  // Sanitize: treat literal "null" string as empty (bad data cleanup)
  const first = firstName?.trim();
  const last = lastName?.trim();
  const sanitizedFirst = first && first.toLowerCase() !== "null" ? first : "";
  const sanitizedLast = last && last.toLowerCase() !== "null" ? last : "";

  if (!sanitizedFirst && !sanitizedLast) {
    return "--";
  }

  if (sanitizedFirst && sanitizedLast) {
    return `${sanitizedFirst} ${sanitizedLast}`;
  }

  return sanitizedFirst || sanitizedLast || "--";
}

/**
 * Formats a single name field (trims whitespace).
 *
 * @deprecated Prefer formatFullName(firstName, lastName) for contact names.
 * Use this only for single-field name formatting.
 */
export function formatSingleName(name?: string | null): string {
  const trimmed = name?.trim();
  return trimmed || "--";
}
