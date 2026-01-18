/**
 * Levenshtein Types
 *
 * Type definitions for fuzzy string matching results. The actual similarity
 * matching logic has been moved to server-side PostgreSQL using pg_trgm.
 *
 * Per Engineering Constitution P1: Types are kept as Single Source of Truth
 * for the SimilarOpportunitiesDialog component.
 */

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
