/**
 * Filter Registry Completeness Test
 *
 * Ensures all soft-delete resources have deleted_at in their filter registries.
 * This prevents filtering bugs where deleted_at cannot be filtered in junction tables.
 *
 * Root Cause (Finding #3):
 * - 6 junction tables had deleted_at columns but no filter registries
 * - Only opportunity_contacts had partial registry (missing deleted_at)
 *
 * This test enforces:
 * 1. All SOFT_DELETE_RESOURCES must have a filter registry
 * 2. All registered soft-delete resources must include deleted_at field
 */

import { describe, it, expect } from "vitest";
import { SOFT_DELETE_RESOURCES } from "../resources";
import { filterableFields } from "../filters";

describe("Filter Registry Completeness", () => {
  describe("Soft Delete Resources", () => {
    it("should have filter registries for all soft-delete resources", () => {
      const missingRegistries: string[] = [];

      for (const resource of SOFT_DELETE_RESOURCES) {
        if (!filterableFields[resource as keyof typeof filterableFields]) {
          missingRegistries.push(resource);
        }
      }

      if (missingRegistries.length > 0) {
        throw new Error(
          `Missing filter registries for soft-delete resources: ${missingRegistries.join(", ")}\n` +
            `Add registries to appropriate filter files in src/atomic-crm/providers/supabase/filters/`
        );
      }

      // All soft-delete resources should have registries
      expect(missingRegistries).toHaveLength(0);
    });

    it("should include deleted_at field in all soft-delete resource registries", () => {
      const missingDeletedAt: string[] = [];

      for (const resource of SOFT_DELETE_RESOURCES) {
        const fields = filterableFields[resource as keyof typeof filterableFields];

        if (fields && !fields.includes("deleted_at")) {
          missingDeletedAt.push(resource);
        }
      }

      if (missingDeletedAt.length > 0) {
        throw new Error(
          `Soft-delete resources missing deleted_at in filter registry: ${missingDeletedAt.join(", ")}\n` +
            `Add "deleted_at" to the field arrays for these resources.`
        );
      }

      // All soft-delete resources must have deleted_at in their filter registry
      expect(missingDeletedAt).toHaveLength(0);
    });
  });

  describe("Junction Tables Coverage", () => {
    it("should have complete registries for all junction tables", () => {
      const junctionTables = [
        "opportunity_participants",
        "opportunity_contacts",
        "opportunity_products",
        "contact_preferred_principals",
        "organization_distributors",
        "distributor_principal_authorizations",
        "interaction_participants",
      ];

      const missingJunctionRegistries: string[] = [];

      for (const table of junctionTables) {
        if (!filterableFields[table as keyof typeof filterableFields]) {
          missingJunctionRegistries.push(table);
        }
      }

      if (missingJunctionRegistries.length > 0) {
        throw new Error(
          `Missing filter registries for junction tables: ${missingJunctionRegistries.join(", ")}\n` +
            `Junction tables require filter registries for relationship filtering.`
        );
      }

      expect(missingJunctionRegistries).toHaveLength(0);
    });

    it("should include standard junction table fields", () => {
      const junctionTables = [
        "opportunity_participants",
        "opportunity_contacts",
        "opportunity_products",
        "contact_preferred_principals",
        "organization_distributors",
        "distributor_principal_authorizations",
        "interaction_participants",
      ];

      const commonFields = ["id", "created_at"];
      const missingCommonFields: Array<{ table: string; field: string }> = [];

      for (const table of junctionTables) {
        const fields = filterableFields[table as keyof typeof filterableFields];

        if (fields) {
          for (const commonField of commonFields) {
            if (!fields.includes(commonField)) {
              missingCommonFields.push({ table, field: commonField });
            }
          }
        }
      }

      if (missingCommonFields.length > 0) {
        const errorMsg = missingCommonFields
          .map(({ table, field }) => `  - ${table}: missing ${field}`)
          .join("\n");

        throw new Error(
          `Junction tables missing common fields:\n${errorMsg}\n` +
            `All junction tables should have id and created_at fields.`
        );
      }

      expect(missingCommonFields).toHaveLength(0);
    });
  });

  describe("STI Pattern: tasks → activities filter coverage", () => {
    // tasksHandler forwards getList("tasks", ...) to activitiesHandler.getList("activities", ...).
    // withValidation inside activitiesHandler validates filters against the "activities"
    // registry. Any task filter field that is a real activities column but missing from
    // the activities list will cause HttpError 400 at runtime.
    // See: Sentry 7219630052 (due_date@lt invalid for activities)

    // Fields that task-domain code actively uses as filters AND are real activities columns.
    // "title" is excluded: tasksHandler maps title↔subject (task alias, not a DB column).
    const TASK_FILTER_FIELDS_ROUTED_TO_ACTIVITIES = [
      "due_date", // useKPIMetrics, TaskListFilter
      "completed_at", // useMyPerformance
      "completed", // useKPIMetrics, TaskListFilter
      "sales_id", // useKPIMetrics, useMyPerformance, TaskListFilter
      "type", // Task type filtering
      "contact_id", // Task relationship filtering
      "opportunity_id", // Task relationship filtering
    ];

    it("activities filter list should include task filter fields used in STI routing", () => {
      const activitiesFields = filterableFields["activities"];
      expect(activitiesFields).toBeDefined();

      const missingFields = TASK_FILTER_FIELDS_ROUTED_TO_ACTIVITIES.filter(
        (field) => !activitiesFields!.includes(field)
      );

      if (missingFields.length > 0) {
        throw new Error(
          `Task filter fields missing from activities registry (STI routing breaks): [${missingFields.join(", ")}]\n` +
            `tasksHandler forwards to activitiesHandler which validates against "activities" filter list.\n` +
            `Add these fields to the activities array in filters/activities.ts`
        );
      }

      expect(missingFields).toHaveLength(0);
    });
  });
});
