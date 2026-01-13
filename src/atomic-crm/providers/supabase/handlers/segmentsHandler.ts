/**
 * Segments Handler - Composed DataProvider
 *
 * Handles the segments resource using SegmentsService for fixed Playbook categories.
 * Segments are predefined constants - create operations delegate to getOrCreateSegment()
 * which looks up by name (no dynamic creation).
 *
 * Composition:
 * 1. customHandler → Segments-specific logic (create, getOne, getList, getMany)
 * 2. withErrorLogging → Structured error handling (OUTERMOST)
 *
 * Note: No withValidation needed (segments are fixed constants, not user input).
 * Note: No withLifecycleCallbacks needed (segments don't need lifecycle hooks).
 *
 * Engineering Constitution: Service Layer for business logic
 */

import { z } from "zod";
import type { DataProvider, CreateParams, RaRecord } from "react-admin";
import { SegmentsService } from "../../../services/segments.service";
import type { Segment } from "../../../validation/segments";
import { withErrorLogging } from "../wrappers";
import type { ExtendedDataProvider } from "../extensions/types";

/**
 * Schema for validating segment create data
 * Validates the minimal required shape for segment lookup
 */
const segmentCreateDataSchema = z.object({ name: z.string().optional() }).passthrough();

/**
 * Type guard to ensure segment has required id for RaRecord compatibility
 */
function hasRequiredId(segment: Segment): segment is Segment & { id: string } {
  return typeof segment.id === "string";
}

/**
 * Type guard to validate segment record shape from unknown data
 * Used to replace unsafe double-casts (as unknown as RecordType)
 *
 * Validates minimal RaRecord requirements: id (string) and name (string)
 * Engineering Constitution: Fail-fast with explicit type checking
 */
export function isSegmentRecord(value: unknown): value is Segment & { id: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    "id" in value &&
    typeof (value as Record<string, unknown>).id === "string" &&
    "name" in value &&
    typeof (value as Record<string, unknown>).name === "string"
  );
}

/**
 * Assert and cast a validated segment to RecordType
 * Replaces double-casts with single generic cast after validation
 *
 * @throws Error if segment fails type guard validation
 */
function assertSegmentRecord<RecordType extends RaRecord>(
  segment: Segment & { id: string },
  context: string
): RecordType {
  if (!isSegmentRecord(segment)) {
    throw new Error(`Invalid segment data in ${context}`);
  }
  // Single cast is safe after type guard validation
  return segment as RecordType;
}

/**
 * Assert and cast an array of validated segments to RecordType[]
 * Replaces double-casts with single generic cast after validation
 *
 * @throws Error if any segment fails type guard validation
 */
function assertSegmentRecordArray<RecordType extends RaRecord>(
  segments: Array<Segment & { id: string }>,
  context: string
): RecordType[] {
  for (const segment of segments) {
    if (!isSegmentRecord(segment)) {
      throw new Error(`Invalid segment data in ${context}`);
    }
  }
  // Single cast is safe after type guard validation
  return segments as RecordType[];
}

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
  // NOTE: We cast to ExtendedDataProvider because the provider WILL be extended
  // by the time these methods are actually called. The runtime assertion was
  // removed because it runs at initialization time before extensions are added.
  const segmentsService = new SegmentsService(baseProvider as ExtendedDataProvider);

  /**
   * Custom segments handler with segment-specific logic
   *
   * This handler is defined FIRST, then wrapped with withErrorLogging.
   * This ensures all custom logic is INSIDE the "safety bubble" of error logging.
   */
  const customHandler: DataProvider = {
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
        const data = segmentCreateDataSchema.parse(params.data);
        const name = data.name || "Unknown";

        // Delegate to service - returns existing category or default
        const segment = await segmentsService.getOrCreateSegment(name);

        // Return in React Admin format - service always returns segment with id
        if (!hasRequiredId(segment)) {
          throw new Error("Segment missing required id field");
        }
        // Type-safe: runtime guard ensures segment has required id
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

        if (!hasRequiredId(segment)) {
          throw new Error("Segment missing required id field");
        }
        // Type-safe: runtime guard ensures segment has required id
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
        // Categories always have id and name - shape matches RaRecord requirements
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
          .filter((s): s is Segment & { id: string } => s !== undefined && hasRequiredId(s));

        // Type-safe: runtime filter ensures all segments have required id
        return { data: segments as unknown as RecordType[] };
      }

      return baseProvider.getMany<RecordType>(resource, params);
    },
  };

  /**
   * Wrap the custom handler with error logging
   *
   * withErrorLogging is the ONLY wrapper needed for segments:
   * - No withValidation (segments are fixed constants, not user input)
   * - No withLifecycleCallbacks (segments don't need lifecycle hooks)
   *
   * This ensures ALL errors from segment operations are properly caught and logged.
   */
  return withErrorLogging(customHandler);
}
