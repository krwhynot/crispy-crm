/**
 * useExactDuplicateCheck
 *
 * Fire-and-forget hook that checks for exact duplicate opportunities
 * (same principal + customer + product) and shows a toast warning.
 *
 * Per Q9 business logic policy: warn-only, never block save.
 * Wraps checkExactDuplicate from validation layer.
 */

import { useCallback } from "react";
import { useDataProvider } from "ra-core";
import type { Identifier } from "ra-core";
import { checkExactDuplicate } from "../validation/opportunities";
import { useSafeNotify } from "../hooks/useSafeNotify";
import { logger } from "@/lib/logger";

interface DuplicateCheckError extends Error {
  code?: string;
  existingOpportunity?: {
    id: Identifier;
    name: string;
    stage: string;
  };
}

interface ExactDuplicateCheckParams {
  principal_id: Identifier;
  customer_id: Identifier;
  product_ids: Identifier[];
}

/**
 * Returns a fire-and-forget function that checks for duplicate opportunities.
 * Shows a toast warning if a duplicate is found, but never blocks save.
 */
export function useExactDuplicateCheck() {
  const dataProvider = useDataProvider();
  const { warning } = useSafeNotify();

  const checkForDuplicate = useCallback(
    (params: ExactDuplicateCheckParams) => {
      const { principal_id, customer_id, product_ids } = params;

      // Fire-and-forget: run async check without blocking caller
      void (async () => {
        for (const product_id of product_ids) {
          try {
            await checkExactDuplicate(dataProvider, {
              principal_id,
              customer_id,
              product_id,
            });
          } catch (err: unknown) {
            const dupError = err as DuplicateCheckError;
            if (dupError.code === "DUPLICATE_OPPORTUNITY" && dupError.existingOpportunity) {
              warning(
                `Possible duplicate: "${dupError.existingOpportunity.name}" ` +
                  `(Stage: ${dupError.existingOpportunity.stage}) has the same ` +
                  `Principal + Customer + Product combination.`
              );
              return; // Show first match only
            }
            // Non-duplicate errors: log and continue silently
            logger.warn("Duplicate check failed for product", {
              product_id,
              error: err instanceof Error ? err.message : String(err),
              operation: "useExactDuplicateCheck",
            });
          }
        }
      })();
    },
    [dataProvider, warning]
  );

  return { checkForDuplicate };
}
