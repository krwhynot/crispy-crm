/**
 * Segments Handler - Composed DataProvider
 *
 * Handles the segments resource using SegmentsService for fixed Playbook categories.
 * Segments are predefined constants - create operations delegate to getOrCreateSegment()
 * which looks up by name (no dynamic creation).
 *
 * Composition:
 * 1. Base provider → Raw Supabase operations for reads
 * 2. Custom create → Delegates to SegmentsService.getOrCreateSegment()
 *
 * Engineering Constitution: Service Layer for business logic
 */

import type { DataProvider, CreateParams, RaRecord } from "react-admin";
import { SegmentsService } from "../../../services/segments.service";
import type { ExtendedDataProvider } from "../extensions/types";
import type { Segment } from "../../../validation/segments";

/**
 * Create a composed DataProvider for segments
 *
 * The segments resource is unique:
 * - Read operations pass through to base provider
 * - Create operations delegate to SegmentsService which looks up fixed categories
 *
 * @param baseProvider - The raw Supabase DataProvider (must support RPC)
 * @returns DataProvider with segment-specific create behavior
 */
export function createSegmentsHandler(baseProvider: DataProvider): DataProvider {
  // Create service instance with extended provider
  const segmentsService = new SegmentsService(baseProvider as ExtendedDataProvider);

  return {
    ...baseProvider,

    /**
     * Intercept create for segments
     *
     * Segments are fixed Playbook categories. Instead of creating new records,
     * we look up existing categories by name via SegmentsService.
     *
     * @param resource - Resource name (should be "segments")
     * @param params - Create params with { data: { name: string } }
     * @returns Existing segment matching the name, or default "Unknown" category
     */
    create: async <RecordType extends RaRecord = RaRecord>(
      resource: string,
      params: CreateParams<RecordType>
    ) => {
      // Only intercept segments resource
      if (resource === "segments") {
        const data = params.data as unknown as { name?: string };
        const name = data.name || "Unknown";

        // Delegate to service - returns existing category or default
        const segment = await segmentsService.getOrCreateSegment(name);

        // Return in React Admin format
        return { data: segment as unknown as RecordType };
      }

      // Not segments - delegate to base provider
      return baseProvider.create<RecordType>(resource, params);
    },

    /**
     * getOne for segments
     * Looks up by ID using the service
     */
    getOne: async <RecordType extends RaRecord = RaRecord>(
      resource: string,
      params: Parameters<DataProvider["getOne"]>[1]
    ) => {
      if (resource === "segments") {
        const segment = segmentsService.getSegmentById(String(params.id));

        if (!segment) {
          throw new Error(`Segment not found: ${params.id}`);
        }

        return { data: segment as unknown as RecordType };
      }

      return baseProvider.getOne<RecordType>(resource, params);
    },

    /**
     * getList for segments
     * Returns all fixed Playbook categories
     */
    getList: async <RecordType extends RaRecord = RaRecord>(
      resource: string,
      _params: Parameters<DataProvider["getList"]>[1]
    ) => {
      if (resource === "segments") {
        const categories = segmentsService.getAllCategories();
        const data = categories.map((cat) => ({
          id: cat.id,
          name: cat.name,
        })) as unknown as RecordType[];

        return {
          data,
          total: data.length,
        };
      }

      return baseProvider.getList<RecordType>(resource, _params);
    },

    /**
     * getMany for segments
     * Looks up multiple segments by ID
     */
    getMany: async <RecordType extends RaRecord = RaRecord>(
      resource: string,
      params: Parameters<DataProvider["getMany"]>[1]
    ) => {
      if (resource === "segments") {
        const segments = params.ids
          .map((id) => segmentsService.getSegmentById(String(id)))
          .filter((s): s is Segment => s !== undefined);

        return { data: segments as unknown as RecordType[] };
      }

      return baseProvider.getMany<RecordType>(resource, params);
    },
  };
}
