import type { DataProvider, Identifier, RaRecord } from "ra-core";

/**
 * Duplicate opportunity detection
 * Prevents creating identical opportunities (principal + customer + product)
 */

/**
 * Parameters for duplicate opportunity check
 * All three fields must match for an opportunity to be considered a duplicate
 */
export interface DuplicateCheckParams {
  principal_id: Identifier;
  customer_id: Identifier;
  product_id: Identifier;
  /** Optional: Exclude this opportunity ID from duplicate check (for updates) */
  exclude_id?: Identifier;
}

/**
 * Opportunity record type for duplicate check response
 */
interface OpportunityRecord extends RaRecord {
  name: string;
  principal_organization_id: Identifier;
  customer_organization_id: Identifier;
  stage: string;
}

/**
 * Result of duplicate check query
 */
interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingOpportunity?: {
    id: Identifier;
    name: string;
    stage: string;
  };
}

/**
 * Custom error type for duplicate opportunity detection
 */
interface DuplicateOpportunityError extends Error {
  code: "DUPLICATE_OPPORTUNITY";
  existingOpportunity: {
    id: Identifier;
    name: string;
    stage: string;
  };
}

/**
 * Check for exact duplicate opportunities
 *
 * Blocks creation/update of opportunities with identical:
 * - principal_organization_id
 * - customer_organization_id
 * - product_id (via opportunity_products junction)
 *
 * Follows Engineering Constitution principles:
 * - P1: Fail-fast - throws immediately on duplicate detection
 * - P2: Uses dataProvider.getList as single composable entry point
 *
 * @param dataProvider - React Admin DataProvider instance
 * @param params - Duplicate check parameters
 * @throws Error with descriptive message if duplicate exists
 *
 * @example
 * ```typescript
 * // In Create handler
 * await checkExactDuplicate(dataProvider, {
 *   principal_id: data.principal_organization_id,
 *   customer_id: data.customer_organization_id,
 *   product_id: selectedProductId,
 * });
 * ```
 */
export async function checkExactDuplicate(
  dataProvider: DataProvider,
  params: DuplicateCheckParams
): Promise<DuplicateCheckResult> {
  const { principal_id, customer_id, product_id, exclude_id } = params;

  // Step 1: Find opportunities with matching principal + customer
  // Uses dataProvider.getList per P2 constraint (not direct Supabase)
  const { data: matchingOpportunities } = await dataProvider.getList<OpportunityRecord>(
    "opportunities",
    {
      filter: {
        principal_organization_id: principal_id,
        customer_organization_id: customer_id,
        // Exclude soft-deleted records
        "deleted_at@is": null,
      },
      pagination: { page: 1, perPage: 100 },
      sort: { field: "created_at", order: "DESC" },
    }
  );

  // Early return if no matching principal+customer combinations
  if (matchingOpportunities.length === 0) {
    return { isDuplicate: false };
  }

  // Filter out the current opportunity if updating
  const candidateOpportunities = exclude_id
    ? matchingOpportunities.filter((opp) => opp.id !== exclude_id)
    : matchingOpportunities;

  if (candidateOpportunities.length === 0) {
    return { isDuplicate: false };
  }

  // Step 2: Check each candidate opportunity for matching product
  // Uses dataProvider.getList for opportunity_products junction
  for (const opportunity of candidateOpportunities) {
    const { data: opportunityProducts } = await dataProvider.getList<RaRecord>(
      "opportunity_products",
      {
        filter: {
          opportunity_id: opportunity.id,
          product_id: product_id,
          "deleted_at@is": null,
        },
        pagination: { page: 1, perPage: 1 },
        sort: { field: "id", order: "ASC" },
      }
    );

    // Found exact duplicate: same principal + customer + product
    if (opportunityProducts.length > 0) {
      // P1: Fail-fast - throw immediately with descriptive error
      const error = new Error(
        `Duplicate opportunity detected: An opportunity already exists for this ` +
          `Principal + Customer + Product combination. ` +
          `Existing opportunity: "${opportunity.name}" (ID: ${opportunity.id}, Stage: ${opportunity.stage})`
      ) as DuplicateOpportunityError;
      // Attach metadata for UI error handling
      error.code = "DUPLICATE_OPPORTUNITY";
      error.existingOpportunity = {
        id: opportunity.id,
        name: opportunity.name,
        stage: opportunity.stage,
      };
      throw error;
    }
  }

  // No duplicates found
  return { isDuplicate: false };
}

/**
 * Validation helper that wraps checkExactDuplicate for form validation
 * Returns formatted errors compatible with React Admin
 *
 * @param dataProvider - React Admin DataProvider instance
 * @param params - Duplicate check parameters
 * @throws Object with message and body.errors for React Admin compatibility
 */
export async function validateNoDuplicate(
  dataProvider: DataProvider,
  params: DuplicateCheckParams
): Promise<void> {
  try {
    await checkExactDuplicate(dataProvider, params);
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as DuplicateOpportunityError).code === "DUPLICATE_OPPORTUNITY"
    ) {
      // Format for React Admin error display
      throw {
        message: "Validation failed",
        body: {
          errors: {
            // Show error on the product field since that's the final disambiguating factor
            product_id: error.message,
          },
        },
      };
    }
    // Re-throw unexpected errors
    throw error;
  }
}
