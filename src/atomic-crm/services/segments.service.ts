import {
  PLAYBOOK_CATEGORIES,
  PLAYBOOK_CATEGORY_IDS,
  PLAYBOOK_CATEGORY_CHOICES,
  type PlaybookCategory,
  type Segment,
  isValidPlaybookCategory,
  getSegmentTypeForOrganization,
} from "../validation/segments";
import {
  type SegmentType,
  OPERATOR_SEGMENT_CHOICES,
  OPERATOR_SEGMENT_PARENT_CHOICES,
} from "../validation/operatorSegments";
import type { OrganizationType } from "../validation/organizations";
import type { ExtendedDataProvider } from "../providers/supabase/extensions/types";

/**
 * Segments service handles business logic for Playbook category management
 *
 * With fixed Playbook categories, this service provides:
 * - Category lookup by name
 * - Category lookup by ID
 * - Validation helpers
 *
 * NO dynamic segment creation - categories are fixed in the database
 */
export class SegmentsService {
  constructor(private dataProvider: ExtendedDataProvider) {}

  /**
   * Get segment by name (case-insensitive)
   * Returns the matching Playbook category or undefined
   *
   * @param name Category name to find
   * @returns Segment object or undefined if not found
   */
  getSegmentByName(name: string): Segment | undefined {
    const normalizedName = name.trim();

    // Check if it's a valid Playbook category
    const matchedCategory = PLAYBOOK_CATEGORIES.find(
      (cat) => cat.toLowerCase() === normalizedName.toLowerCase()
    );

    if (!matchedCategory) {
      console.warn(`[SegmentsService] Unknown category: ${name}`);
      return undefined;
    }

    return {
      id: PLAYBOOK_CATEGORY_IDS[matchedCategory],
      name: matchedCategory,
    };
  }

  /**
   * Get segment by ID
   * Returns the matching Playbook category or undefined
   *
   * @param id Category UUID to find
   * @returns Segment object or undefined if not found
   */
  getSegmentById(id: string): Segment | undefined {
    const entry = Object.entries(PLAYBOOK_CATEGORY_IDS).find(([, uuid]) => uuid === id);

    if (!entry) {
      console.warn(`[SegmentsService] Unknown category ID: ${id}`);
      return undefined;
    }

    return {
      id,
      name: entry[0] as PlaybookCategory,
    };
  }

  /**
   * Get all Playbook categories
   * @returns Array of all segment choices (for dropdowns)
   */
  getAllCategories(): typeof PLAYBOOK_CATEGORY_CHOICES {
    return PLAYBOOK_CATEGORY_CHOICES;
  }

  /**
   * Validate if a string is a valid Playbook category
   * @param value String to validate
   * @returns True if valid category name
   */
  isValidCategory(value: string): boolean {
    return isValidPlaybookCategory(value);
  }

  /**
   * Get the default category (Unknown)
   * Use when no category is specified
   */
  getDefaultCategory(): Segment {
    return {
      id: PLAYBOOK_CATEGORY_IDS["Unknown"],
      name: "Unknown",
    };
  }

  /**
   * @deprecated Use getSegmentByName instead
   * Legacy method for backward compatibility - now just looks up by name
   * DOES NOT create new segments (categories are fixed)
   */
  async getOrCreateSegment(name: string): Promise<Segment> {
    const segment = this.getSegmentByName(name);

    if (!segment) {
      console.warn(
        `[SegmentsService] Category "${name}" not found, returning Unknown. ` +
          `Valid categories: ${PLAYBOOK_CATEGORIES.join(", ")}`
      );
      return this.getDefaultCategory();
    }

    return segment;
  }

  /**
   * Get all segment choices filtered by type
   * @param type - 'playbook' for distributors, 'operator' for customers
   */
  getSegmentsByType(type: SegmentType): Array<{ id: string; name: string }> {
    if (type === "playbook") {
      return PLAYBOOK_CATEGORY_CHOICES;
    }
    return OPERATOR_SEGMENT_CHOICES;
  }

  /**
   * Get parent-level segment choices (for filter toggles)
   */
  getParentSegmentsByType(type: SegmentType): Array<{ id: string; name: string }> {
    if (type === "playbook") {
      return PLAYBOOK_CATEGORY_CHOICES; // All playbook are top-level
    }
    return OPERATOR_SEGMENT_PARENT_CHOICES;
  }

  /**
   * Determine which segment type to use based on organization type
   */
  getSegmentTypeForOrganization(orgType: OrganizationType): SegmentType {
    return getSegmentTypeForOrganization(orgType);
  }

  /**
   * Get appropriate segment choices for a given organization type
   * This is a convenience method combining type lookup and choices
   */
  getSegmentChoicesForOrganization(orgType: OrganizationType): Array<{ id: string; name: string }> {
    const segmentType = this.getSegmentTypeForOrganization(orgType);
    return this.getSegmentsByType(segmentType);
  }

  /**
   * Get operator segment by UUID
   */
  getOperatorSegmentById(id: string): { id: string; name: string } | undefined {
    return OPERATOR_SEGMENT_CHOICES.find((s) => s.id === id);
  }

  /**
   * Get operator segment by name (case-insensitive)
   */
  getOperatorSegmentByName(name: string): { id: string; name: string } | undefined {
    const normalizedName = name.toLowerCase().trim();
    return OPERATOR_SEGMENT_CHOICES.find(
      (s) => s.name.toLowerCase().trim() === normalizedName
    );
  }
}
