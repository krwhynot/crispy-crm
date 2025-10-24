/**
 * Format a name from parts, returning "--" if no valid name exists
 */
export function formatName(firstName?: string | null, lastName?: string | null): string {
  const first = firstName?.trim();
  const last = lastName?.trim();

  if (!first && !last) {
    return '--';
  }

  if (first && last) {
    return `${first} ${last}`;
  }

  return first || last || '--';
}

/**
 * Format a full name, returning "--" if null/empty
 */
export function formatFullName(name?: string | null): string {
  const trimmed = name?.trim();
  return trimmed || '--';
}
