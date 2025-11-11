import { useEffect, useState } from "react";
import { useDataProvider } from "ra-core";

/**
 * Custom hook to fetch and cache sales person names
 * Handles batch fetching for performance optimization
 */
export const useSalesNames = (salesIds: string[] | undefined) => {
  const dataProvider = useDataProvider();
  const [salesMap, setSalesMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Create a stable key for dependency array
  const salesIdsKey = salesIds?.join(",") || "";

  useEffect(() => {
    if (!salesIds || salesIds.length === 0) {
      return;
    }

    const fetchSalesNames = async () => {
      // Only fetch IDs we don't already have cached
      const idsToFetch = salesIds.filter((id) => !salesMap[id]);

      if (idsToFetch.length === 0) {
        return;
      }

      setLoading(true);
      try {
        const { data } = await dataProvider.getMany("sales", {
          ids: idsToFetch,
        });

        const newMap = data.reduce((acc: Record<string, string>, sale: any) => {
          acc[String(sale.id)] = `${sale.first_name} ${sale.last_name}`;
          return acc;
        }, {});

        setSalesMap((prev) => ({ ...prev, ...newMap }));
      } catch (error) {
        console.error("Failed to fetch sales names:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSalesNames();
  }, [salesIdsKey, salesIds, salesMap, dataProvider]);

  /**
   * Get sales person name by ID with fallback
   */
  const getSalesName = (id: string): string => {
    return salesMap[id] || `Sales #${id}`;
  };

  return {
    salesMap,
    getSalesName,
    loading,
  };
};
