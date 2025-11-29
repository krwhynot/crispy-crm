/**
 * Levenshtein Distance Utility
 *
 * Implements fuzzy string matching using the Levenshtein algorithm to detect
 * similar opportunity names. Used to warn users when creating opportunities
 * with names similar to existing ones.
 *
 * Per Engineering Constitution P1: Fail-fast - returns results immediately
 * without complex retry logic or circuit breakers.
 */

/**
 * Calculate the Levenshtein distance between two strings.
 *
 * The Levenshtein distance is the minimum number of single-character edits
 * (insertions, deletions, or substitutions) required to transform one string
 * into another.
 *
 * @param a - First string to compare
 * @param b - Second string to compare
 * @returns The edit distance between the two strings (0 = identical)
 *
 * @example
 * ```typescript
 * levenshteinDistance("kitten", "sitting") // 3
 * levenshteinDistance("hello", "hello") // 0
 * levenshteinDistance("ABC Corp", "ABC Corp") // 0
 * levenshteinDistance("ABC Corp", "ABC Crop") // 1
 * ```
 */
export function levenshteinDistance(a: string, b: string): number {
  // Normalize strings: lowercase and trim for case-insensitive comparison
  const str1 = a.toLowerCase().trim();
  const str2 = b.toLowerCase().trim();

  // Early exit for identical strings
  if (str1 === str2) return 0;

  // Early exit for empty strings
  if (str1.length === 0) return str2.length;
  if (str2.length === 0) return str1.length;

  // Create distance matrix using Wagner-Fischer algorithm
  // Space optimization: only keep two rows at a time
  const len1 = str1.length;
  const len2 = str2.length;

  // Initialize previous row (representing distances from empty string to str2)
  let prevRow = Array.from({ length: len2 + 1 }, (_, i) => i);
  let currRow = new Array(len2 + 1);

  for (let i = 1; i <= len1; i++) {
    // First element is distance from str1[0..i] to empty string
    currRow[0] = i;

    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;

      currRow[j] = Math.min(
        prevRow[j] + 1, // Deletion
        currRow[j - 1] + 1, // Insertion
        prevRow[j - 1] + cost // Substitution
      );
    }

    // Swap rows for next iteration
    [prevRow, currRow] = [currRow, prevRow];
  }

  // Result is in prevRow after the last swap
  return prevRow[len2];
}

/**
 * Information about a similar opportunity match
 */
export interface SimilarOpportunity {
  id: string | number;
  name: string;
  distance: number;
  stage: string;
  customer_organization_name?: string;
  principal_organization_name?: string;
}

/**
 * Parameters for finding similar opportunities
 */
export interface FindSimilarParams {
  /** The name to check for similarities */
  name: string;
  /** Maximum Levenshtein distance to consider as "similar" (default: 3) */
  threshold?: number;
  /** Optional: Exclude this opportunity ID from results (for edit mode) */
  excludeId?: string | number;
}

/**
 * Result of similarity check
 */
export interface SimilarityCheckResult {
  /** Whether any similar opportunities were found */
  hasSimilar: boolean;
  /** List of similar opportunities, sorted by distance (closest first) */
  matches: SimilarOpportunity[];
}

/**
 * Find opportunities with names similar to the provided name.
 *
 * Uses Levenshtein distance algorithm to identify near-matches that might
 * indicate duplicate entries. Default threshold of 3 catches:
 * - Typos: "ABC Corp" vs "ABC Crop" (distance: 1)
 * - Plural variations: "Widget" vs "Widgets" (distance: 1)
 * - Minor differences: "ABC Corp - Q1" vs "ABC Corp - Q2" (distance: 1)
 * - Small additions: "ABC Corp" vs "ABC Corp Inc" (distance: 4, above threshold)
 *
 * @param opportunities - Array of existing opportunities to check against
 * @param params - Search parameters including name and threshold
 * @returns Object containing whether similar items exist and the matches
 *
 * @example
 * ```typescript
 * const result = findSimilarOpportunities(existingOpps, {
 *   name: "ABC Corp - Widget Deal",
 *   threshold: 3,
 * });
 *
 * if (result.hasSimilar) {
 *   // Show warning dialog with result.matches
 * }
 * ```
 */
export function findSimilarOpportunities(
  opportunities: Array<{
    id: string | number;
    name: string;
    stage: string;
    customer_organization_name?: string;
    principal_organization_name?: string;
  }>,
  params: FindSimilarParams
): SimilarityCheckResult {
  const { name, threshold = 3, excludeId } = params;

  // Validate input
  if (!name || name.trim().length === 0) {
    return { hasSimilar: false, matches: [] };
  }

  const normalizedName = name.toLowerCase().trim();

  // Filter and map opportunities
  const matches: SimilarOpportunity[] = opportunities
    .filter((opp) => {
      // Exclude the current opportunity if editing
      if (excludeId !== undefined && opp.id === excludeId) {
        return false;
      }
      // Skip opportunities without names
      if (!opp.name || opp.name.trim().length === 0) {
        return false;
      }
      return true;
    })
    .map((opp) => ({
      id: opp.id,
      name: opp.name,
      distance: levenshteinDistance(normalizedName, opp.name),
      stage: opp.stage,
      customer_organization_name: opp.customer_organization_name,
      principal_organization_name: opp.principal_organization_name,
    }))
    .filter((match) => match.distance <= threshold && match.distance > 0) // Exclude exact matches (distance 0)
    .sort((a, b) => a.distance - b.distance); // Sort by distance (closest first)

  return {
    hasSimilar: matches.length > 0,
    matches,
  };
}

/**
 * Check if a name is "too similar" to any existing opportunity.
 *
 * Convenience function that returns just a boolean, useful for validation.
 *
 * @param opportunities - Array of existing opportunities
 * @param name - Name to check
 * @param threshold - Maximum distance to consider similar (default: 3)
 * @returns true if similar opportunities exist
 */
export function hasSimilarOpportunity(
  opportunities: Array<{ id: string | number; name: string; stage: string }>,
  name: string,
  threshold = 3
): boolean {
  return findSimilarOpportunities(opportunities, { name, threshold }).hasSimilar;
}
