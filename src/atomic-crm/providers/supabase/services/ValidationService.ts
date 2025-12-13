import { HttpError } from "react-admin";
import type { DataProviderMethod } from "../types";
import type {
  Contact,
  Opportunity,
  ContactNote,
  OpportunityNote,
  Task,
  Tag,
  Organization,
  Sale,
  ActivityRecord,
} from "../../../types";
import type { ProductFormData } from "../../../validation/products";
import type { Segment } from "../../../validation/segments";

// Import all validation schemas
import { validateContactForm, validateUpdateContact } from "../../../validation/contacts";
import { validateOrganizationForSubmission, validateUpdateOrganization } from "../../../validation/organizations";
import {
  validateCreateOpportunity,
  validateUpdateOpportunity,
} from "../../../validation/opportunities";
import {
  validateCreateContactNote,
  validateUpdateContactNote,
  validateCreateOpportunityNote,
  validateUpdateOpportunityNote,
  validateCreateOrganizationNote,
  validateUpdateOrganizationNote,
} from "../../../validation/notes";
import type { OrganizationNote } from "../../../validation/notes";
import { validateTaskForSubmission } from "../../../validation/task";
import { validateProductForm, validateProductUpdate } from "../../../validation/products";
import { validateCreateTag, validateUpdateTag } from "../../../validation/tags";
import { validateSalesForm } from "../../../validation/sales";
import {
  validateActivitiesForm,
  validateEngagementsForm,
  validateInteractionsForm,
} from "../../../validation/activities";
import { validateCreateSegment, validateUpdateSegment } from "../../../validation/segments";
import { filterableFields, isValidFilterField } from "../filterRegistry";
import { DEV } from "@/lib/devLogger";

// Type for validation functions
type ValidationFunction<T = unknown> = (data: T) => Promise<void> | void;

interface ValidationHandlers<T = unknown> {
  create?: ValidationFunction<Partial<T>>;
  update?: ValidationFunction<Partial<T>>;
}

// Resource type map for type safety
interface ResourceTypeMap {
  contacts: Contact;
  organizations: Organization;
  opportunities: Opportunity;
  contactNotes: ContactNote;
  opportunityNotes: OpportunityNote;
  organizationNotes: OrganizationNote;
  tasks: Task;
  tags: Tag;
  products: ProductFormData;
  sales: Sale;
  activities: ActivityRecord;
  engagements: ActivityRecord;
  interactions: ActivityRecord;
  segments: Segment;
}

/**
 * ValidationService handles all Zod validation at API boundaries
 * Following Engineering Constitution principle #5: Zod at API boundary only
 *
 * This service consolidates all validation logic previously scattered
 * in the monolithic unifiedDataProvider (was ~100 lines)
 */
export class ValidationService {
  private validationRegistry: Record<string, ValidationHandlers<unknown>> = {
    contacts: {
      create: async (data: unknown) => validateContactForm(data),
      update: async (data: unknown) => validateUpdateContact(data),
    },
    organizations: {
      create: async (data: unknown) => validateOrganizationForSubmission(data),
      update: async (data: unknown) => validateUpdateOrganization(data),
    },
    opportunities: {
      create: async (data: unknown) => validateCreateOpportunity(data),
      update: async (data: unknown) => validateUpdateOpportunity(data),
    },
    products: {
      create: async (data: unknown) => validateProductForm(data),
      update: async (data: unknown) => validateProductUpdate(data),
    },
    tags: {
      create: async (data: unknown) => {
        // validateCreateTag returns parsed data, but we only need validation
        validateCreateTag(data);
      },
      update: async (data: unknown) => {
        // validateUpdateTag returns parsed data, but we only need validation
        validateUpdateTag(data);
      },
    },
    contactNotes: {
      create: async (data: unknown) => {
        validateCreateContactNote(data);
      },
      update: async (data: unknown) => {
        validateUpdateContactNote(data);
      },
    },
    opportunityNotes: {
      create: async (data: unknown) => {
        validateCreateOpportunityNote(data);
      },
      update: async (data: unknown) => {
        validateUpdateOpportunityNote(data);
      },
    },
    organizationNotes: {
      create: async (data: unknown) => {
        validateCreateOrganizationNote(data);
      },
      update: async (data: unknown) => {
        validateUpdateOrganizationNote(data);
      },
    },
    tasks: {
      create: async (data: unknown) => {
        await validateTaskForSubmission(data, false);
      },
      update: async (data: unknown) => {
        await validateTaskForSubmission(data, true);
      },
    },
    sales: {
      create: async (data: unknown) => validateSalesForm(data),
      // INTENTIONALLY NO UPDATE VALIDATION - Edge Function handles it
      // Bug fix (2025-12-12): updateSalesSchema (and salesSchema.partial()) rejects
      // empty strings like avatar_url: "" because .url() validator runs on any string.
      // The data flow is: form → unifiedDataProvider → salesService → Edge Function.
      // salesService.salesUpdate() filters out empty strings with truthy checks.
      // Edge Function /users PATCH does final Zod validation.
      // Duplicate validation here was causing 400 errors before salesService could filter.
      // update: undefined (intentionally omitted)
    },
    activities: {
      create: async (data: unknown) => validateActivitiesForm(data),
      update: async (data: unknown) => validateActivitiesForm(data),
    },
    engagements: {
      create: async (data: unknown) => validateEngagementsForm(data),
      update: async (data: unknown) => validateEngagementsForm(data),
    },
    interactions: {
      create: async (data: unknown) => validateInteractionsForm(data),
      update: async (data: unknown) => validateInteractionsForm(data),
    },
    segments: {
      create: async (data: unknown) => {
        validateCreateSegment(data);
      },
      update: async (data: unknown) => {
        validateUpdateSegment(data);
      },
    },
  };

  /**
   * Validate data for a specific resource and method
   * @param resource The resource being validated
   * @param method The data provider method (create, update, etc.)
   * @param data The data to validate
   * @throws ZodError if validation fails
   */
  async validate<K extends keyof ResourceTypeMap>(
    resource: K | string,
    method: DataProviderMethod,
    data: K extends keyof ResourceTypeMap ? Partial<ResourceTypeMap[K]> : unknown
  ): Promise<void> {
    const validator = this.validationRegistry[resource];

    if (!validator) {
      // No validation configured for this resource
      return;
    }

    if (method === "create" && validator.create) {
      await validator.create(data);
    } else if (method === "update" && validator.update) {
      await validator.update(data);
    }
    // Other methods (getList, getOne, delete) typically don't need validation
  }

  /**
   * Check if a resource has validation configured
   * @param resource The resource to check
   * @returns true if validation is configured for this resource
   */
  hasValidation(resource: string): boolean {
    return !!this.validationRegistry[resource];
  }

  /**
   * Validates and cleans filter parameters for a given resource.
   * Removes invalid filter fields that reference non-existent database columns.
   *
   * This prevents 400 errors from stale cached filters (e.g., after schema migrations)
   * and is called in unifiedDataProvider.getList() before API calls.
   *
   * @param resource The resource name (e.g., 'contacts', 'organizations')
   * @param filters The filter object from React Admin (e.g., { status: 'active', last_seen@gte: '2024-01-01' })
   * @returns The validated filter object (unchanged if all fields are valid)
   * @throws {HttpError} 400 error if any filter fields are invalid (fail-fast principle)
   */
  validateFilters(resource: string, filters: Record<string, any>): Record<string, any> {
    const allowedFields = filterableFields[resource];

    if (!allowedFields) {
      // No filter config = allow all (backward compatible for unconfigured resources)
      // But log warning in dev to encourage adding filter registry
      if (DEV) {
        console.warn(
          `[ValidationService] No filterable fields defined for resource: "${resource}". ` +
            `Allowing all filters. Consider adding this resource to filterRegistry.ts`
        );
      }
      return filters;
    }

    const invalidFilters: string[] = [];
    const validFilters: Record<string, any> = {};

    for (const filterKey in filters) {
      if (Object.prototype.hasOwnProperty.call(filters, filterKey)) {
        if (isValidFilterField(resource, filterKey)) {
          // Valid filter - keep it
          validFilters[filterKey] = filters[filterKey];
        } else {
          // Track invalid filter for error reporting
          invalidFilters.push(filterKey);
        }
      }
    }

    if (invalidFilters.length > 0) {
      // FAIL-FAST: Throw error instead of silently dropping invalid filters
      const errorMessage =
        `Invalid filter field(s) for "${resource}": [${invalidFilters.join(", ")}]. ` +
        `Allowed fields: [${allowedFields.join(", ")}]. ` +
        `If these fields should be filterable, add them to filterRegistry.ts`;

      if (DEV) {
        console.error("[ValidationService] Filter validation failed:", {
          resource,
          invalidFilters,
          allowedFields,
          submittedFilters: filters,
        });
      }

      throw new HttpError(errorMessage, 400, {
        resource,
        invalidFilters,
        allowedFields,
      });
    }

    return validFilters;
  }
}
