import { useEffect, useRef } from "react";
import { useRecordContext, useResourceContext, useGetRecordRepresentation } from "react-admin";
import { useRecentItems } from "../hooks/useRecentItems";

/**
 * Invisible component that tracks record views for recent items navigation.
 * Drop into any Show/Edit component to automatically track when records are viewed.
 *
 * @example
 * ```tsx
 * <Show>
 *   <TrackRecordView />
 *   <SimpleShowLayout>...</SimpleShowLayout>
 * </Show>
 * ```
 */
export const TrackRecordView = () => {
  const record = useRecordContext();
  const resource = useResourceContext();
  const getRecordRepresentation = useGetRecordRepresentation(resource);
  const { addRecentItem } = useRecentItems();

  // Ref to track if we've already recorded this view (prevents React 18 strict mode double-fire)
  const hasTracked = useRef<string | null>(null);

  useEffect(() => {
    if (!record?.id || !resource) return;

    // Build unique key to prevent duplicate tracking
    const trackingKey = `${resource}-${record.id}`;
    if (hasTracked.current === trackingKey) return;

    const title = getRecordRepresentation(record) || `${resource} #${record.id}`;

    addRecentItem({
      id: record.id,
      resource,
      title,
    });

    hasTracked.current = trackingKey;
  }, [record?.id, resource, getRecordRepresentation, addRecentItem]);

  return null; // Invisible
};
