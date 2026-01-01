/**
 * Returns grammatically correct singular/plural text based on count.
 *
 * @param count - The number to check for pluralization
 * @param singular - The singular form of the word
 * @param plural - The plural form of the word
 * @param includeCount - Whether to prefix the result with the count (default: true)
 * @returns The grammatically correct string
 *
 * @example
 * pluralize(1, 'activity', 'activities') // => '1 activity'
 * pluralize(5, 'activity', 'activities') // => '5 activities'
 * pluralize(0, 'item', 'items') // => '0 items'
 * pluralize(1, 'person', 'people', false) // => 'person'
 */
export function pluralize(
  count: number,
  singular: string,
  plural: string,
  includeCount: boolean = true
): string {
  const word = count === 1 ? singular : plural;
  return includeCount ? `${count} ${word}` : word;
}
