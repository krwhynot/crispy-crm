/**
 * useProductFilteredOpportunityIds -- Fetches opportunity IDs linked to a product
 * via the opportunity_products junction table.
 *
 * When a product filter is active, reports need to scope down to only those
 * opportunities that carry the selected product. This hook fetches all junction
 * rows for the given product and returns the linked opportunity IDs.
 *
 * Safety cap: Stops at MAX_PRODUCT_OPPORTUNITY_IDS to prevent runaway pagination.
 * Sentinel: Returns [-1] when product is selected but has zero linked opportunities,
 * preventing dataProviderUtils from dropping empty arrays.
 */

import { useQuery } from "@tanstack/react-query";
import { useDataProvider } from "ra-core";
import { Alert, AlertDescription } from "@/components/ui/alert";

const MAX_PRODUCT_OPPORTUNITY_IDS = 2000;

export interface ProductFilterResult {
  opportunityIds: number[] | null;
  isLoading: boolean;
  hasNoLinks: boolean;
  isTruncated: boolean;
}

interface OpportunityProductRow {
  id: number;
  opportunity_id: number;
  product_id: number;
}

export function useProductFilteredOpportunityIds(productId: number | null): ProductFilterResult {
  const dataProvider = useDataProvider();

  const { data, isLoading } = useQuery({
    queryKey: ["opportunity_products", "by_product", productId],
    enabled: productId != null,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const allIds: number[] = [];
      const perPage = 500;
      let page = 1;

      while (true) {
        const { data: rows, total } = await dataProvider.getList<OpportunityProductRow>(
          "opportunity_products",
          {
            pagination: { page, perPage },
            sort: { field: "id", order: "ASC" },
            filter: { product_id: productId },
          }
        );

        for (const row of rows) {
          allIds.push(row.opportunity_id);
        }

        // Break condition 1 (primary): less than a full page = end of data
        if (rows.length < perPage) break;
        // Break condition 2 (secondary): total known and reached
        if (total != null && allIds.length >= total) break;
        // Break condition 3 (safety cap)
        if (allIds.length >= MAX_PRODUCT_OPPORTUNITY_IDS) break;

        page++;
      }

      return {
        ids: [...new Set(allIds)],
        isTruncated: allIds.length >= MAX_PRODUCT_OPPORTUNITY_IDS,
      };
    },
  });

  if (productId == null) {
    return { opportunityIds: null, isLoading: false, hasNoLinks: false, isTruncated: false };
  }

  if (isLoading) {
    return { opportunityIds: null, isLoading: true, hasNoLinks: false, isTruncated: false };
  }

  const ids = data?.ids ?? [];
  const isTruncated = data?.isTruncated ?? false;

  // Sentinel [-1] when product selected but 0 junction rows found
  // Prevents dataProviderUtils.ts:196 from dropping empty arrays
  if (ids.length === 0) {
    return { opportunityIds: [-1], isLoading: false, hasNoLinks: true, isTruncated: false };
  }

  return { opportunityIds: ids, isLoading: false, hasNoLinks: false, isTruncated };
}

/**
 * Shared truncation alert -- used by all report tabs to prevent message/style drift.
 */
export function ProductTruncationAlert({ isTruncated }: { isTruncated: boolean }) {
  if (!isTruncated) return null;

  return (
    <Alert>
      <AlertDescription>
        {"Product filter limited to first 2,000 linked opportunities. Some results may be excluded. Narrow filters for complete data."}
      </AlertDescription>
    </Alert>
  );
}
