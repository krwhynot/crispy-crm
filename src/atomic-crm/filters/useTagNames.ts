import { useEffect, useState } from "react";
import { useDataProvider } from "ra-core";

/**
 * Custom hook to fetch and cache tag names
 * Handles batch fetching for performance optimization
 *
 * Note: Tags in opportunities table are stored as text[] (tag names),
 * not IDs. However, this hook will be needed for contacts which use
 * bigint[] (tag IDs). For opportunities, tag values ARE the display names.
 */
export const useTagNames = (tagIds: string[] | undefined) => {
  const dataProvider = useDataProvider();
  const [tagMap, setTagMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Create a stable key for dependency array
  const tagIdsKey = tagIds?.join(',') || '';

  useEffect(() => {
    if (!tagIds || tagIds.length === 0) {
      return;
    }

    const fetchTagNames = async () => {
      // Only fetch IDs we don't already have cached
      const idsToFetch = tagIds.filter(id => !tagMap[id]);

      if (idsToFetch.length === 0) {
        return;
      }

      setLoading(true);
      try {
        const { data } = await dataProvider.getMany('tags', {
          ids: idsToFetch,
        });

        const newMap = data.reduce((acc: Record<string, string>, tag: any) => {
          acc[String(tag.id)] = tag.name;
          return acc;
        }, {});

        setTagMap(prev => ({ ...prev, ...newMap }));
      } catch (error) {
        console.error('Failed to fetch tag names:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTagNames();
  }, [tagIdsKey, tagIds, tagMap, dataProvider]);

  /**
   * Get tag name by ID with fallback
   */
  const getTagName = (id: string): string => {
    return tagMap[id] || `Tag #${id}`;
  };

  return {
    tagMap,
    getTagName,
    loading,
  };
};
