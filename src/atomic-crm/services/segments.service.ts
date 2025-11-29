import type { DataProvider } from "ra-core";
import type { Segment } from "../validation/segments";
import { supabase } from "../providers/supabase/supabase";

/**
 * Segments service handles business logic for segment management
 * Follows Engineering Constitution principle #14: Service Layer orchestration for business ops
 */
export class SegmentsService {
  constructor(private dataProvider: DataProvider) {}

  /**
   * Get or create a segment by name
   * Uses RPC function for atomic get-or-create operation
   * Returns existing segment if found, creates new one if not
   *
   * @param name Segment name to find or create
   * @returns Promise resolving to the segment (existing or newly created)
   * @throws Error if RPC call fails
   */
  async getOrCreateSegment(name: string): Promise<Segment> {
    try {
      console.log("[SegmentsService] Getting or creating segment", { name });

      const { data, error } = await supabase.rpc("get_or_create_segment", {
        p_name: name,
      });

      if (error) {
        console.error("[SegmentsService] RPC get_or_create failed:", error);
        throw new Error(`Get or create segment failed: ${error.message}`);
      }

      // RPC returns array, extract first item
      if (!data || !Array.isArray(data) || data.length === 0) {
        throw new Error("Get or create segment returned empty result");
      }

      const segment = data[0] as Segment;
      console.log("[SegmentsService] Segment retrieved or created successfully", segment);
      return segment;
    } catch (error: any) {
      console.error("[SegmentsService] Failed to get or create segment", {
        name,
        error,
      });
      throw error;
    }
  }
}
