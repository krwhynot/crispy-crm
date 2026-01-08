/**
 * Format a name from parts, returning "--" if no valid name exists
 * Sanitizes "null" strings that may have been stored in the database
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
 * Format a full name, returning "--" if null/empty
 */
export function formatFullName(name?: string | null): string {
  const trimmed = name?.trim();
  return trimmed || "--";
}
