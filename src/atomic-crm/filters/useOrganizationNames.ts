import { useEffect, useState } from "react";
import { useDataProvider } from "ra-core";

/**
 * Custom hook to fetch and cache organization names
 * Handles batch fetching for performance optimization
 */
export const useOrganizationNames = (organizationIds: string[] | undefined) => {
  const dataProvider = useDataProvider();
  const [organizationMap, setOrganizationMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!organizationIds || organizationIds.length === 0) {
      return;
    }

    const fetchOrganizationNames = async () => {
      // Only fetch IDs we don't already have cached
      const idsToFetch = organizationIds.filter(id => !organizationMap[id]);

      if (idsToFetch.length === 0) {
        return;
      }

      setLoading(true);
      try {
        const { data } = await dataProvider.getMany('organizations', {
          ids: idsToFetch,
        });

        const newMap = data.reduce((acc: Record<string, string>, org: any) => {
          acc[org.id] = org.name;
          return acc;
        }, {});

        setOrganizationMap(prev => ({ ...prev, ...newMap }));
      } catch (error) {
        console.error('Failed to fetch organization names:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizationNames();
  }, [organizationIds?.join(',')]); // Re-run when IDs change

  /**
   * Get organization name by ID with fallback
   */
  const getOrganizationName = (id: string): string => {
    return organizationMap[id] || `Organization #${id}`;
  };

  return {
    organizationMap,
    getOrganizationName,
    loading,
  };
};