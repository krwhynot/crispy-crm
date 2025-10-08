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
  ActivityRecord
} from "../../../types";
import type { ProductFormData } from "../../../validation/products";
import type { Segment } from "../../../validation/segments";

// Import all validation schemas
import { validateContactForm, validateUpdateContact } from "../../../validation/contacts";
import { validateOrganizationForSubmission } from "../../../validation/organizations";
import { validateOpportunityForm } from "../../../validation/opportunities";
import {
  validateCreateContactNote,
  validateUpdateContactNote,
  validateCreateOpportunityNote,
  validateUpdateOpportunityNote
} from "../../../validation/notes";
import { validateTaskForSubmission } from "../../../validation/tasks";
import { validateProductForm } from "../../../validation/products";
import { validateCreateTag, validateUpdateTag } from "../../../validation/tags";
import { validateSalesForm } from "../../../validation/sales";
import {
  validateActivitiesForm,
  validateEngagementsForm,
  validateInteractionsForm
} from "../../../validation/activities";
import { validateCreateSegment, validateUpdateSegment } from "../../../validation/segments";
import { filterableFields, isValidFilterField } from "../filterRegistry";

// Type for validation functions
type ValidationFunction<T = unknown> = (data: T) => Promise<void> | void;

interface ValidationHandlers<T = unknown> {
  create?: ValidationFunction<Partial<T>>;
  update?: ValidationFunction<Partial<T>>;
}

// Resource type map for type safety
type ResourceTypeMap = {
  contacts: Contact;
  organizations: Organization;
  opportunities: Opportunity;
  contactNotes: ContactNote;
  opportunityNotes: OpportunityNote;
  tasks: Task;
  tags: Tag;
  products: ProductFormData;
  sales: Sale;
  activities: ActivityRecord;
  engagements: ActivityRecord;
  interactions: ActivityRecord;
  segments: Segment;
};

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
      update: async (data: unknown) => validateOrganizationForSubmission(data),
    },
    opportunities: {
      create: async (data: unknown) => validateOpportunityForm(data),
      update: async (data: unknown) => validateOpportunityForm(data),
    },
    products: {
      create: async (data: unknown) => validateProductForm(data),
      update: async (data: unknown) => validateProductForm(data),
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
      update: async (data: unknown) => validateSalesForm(data),
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
   * @returns A new filter object with invalid fields removed
   */
  validateFilters(resource: string, filters: Record<string, any>): Record<string, any> {
    const allowedFields = filterableFields[resource];

    if (!allowedFields) {
      console.warn(
        `[ValidationService] No filterable fields defined for resource: "${resource}". ` +
        `Skipping filter validation. Consider adding this resource to filterRegistry.ts`
      );
      return filters; // No validation possible, return as-is
    }

    const cleanedFilters: Record<string, any> = {};
    let modified = false;

    for (const filterKey in filters) {
      if (Object.prototype.hasOwnProperty.call(filters, filterKey)) {
        if (isValidFilterField(resource, filterKey)) {
          // Valid filter - keep it
          cleanedFilters[filterKey] = filters[filterKey];
        } else {
          // Invalid filter - log warning and remove it
          console.warn(
            `[ValidationService] Resource "${resource}" received invalid filter field: "${filterKey}". ` +
            `This field does not exist in the database schema. Removing it to prevent API errors. ` +
            `If this field should be filterable, add it to filterRegistry.ts`
          );
          modified = true;
        }
      }
    }

    if (modified) {
      console.info(
        `[ValidationService] Filters cleaned for resource "${resource}".`,
        `\nOriginal:`, filters,
        `\nCleaned:`, cleanedFilters
      );
    }

    return cleanedFilters;
  }
}