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
import type { ProductDistributor } from "../../../validation/productDistributors";

// Import all validation schemas
import { validateContactForm, validateUpdateContact } from "../../../validation/contacts";
import {
  validateOrganizationForSubmission,
  validateUpdateOrganization,
} from "../../../validation/organizations";
import {
  validateCreateOpportunity,
  validateUpdateOpportunity,
  validateCloseOpportunity,
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
import {
  validateProductFormWithDistributors,
  validateProductUpdateWithDistributors,
} from "../../../validation/products";
import { validateCreateTag, validateUpdateTag } from "../../../validation/tags";
import { validateSalesForm } from "../../../validation/sales";
import {
  validateActivitiesForm,
  validateUpdateActivities,
  validateEngagementsForm,
  validateUpdateEngagements,
  validateInteractionsForm,
  validateUpdateInteractions,
} from "../../../validation/activities";
import { validateCreateSegment, validateUpdateSegment } from "../../../validation/segments";
import {
  validateCreateProductDistributor,
  validateUpdateProductDistributor,
} from "../../../validation/productDistributors";
import {
  validateCreateOrganizationDistributor,
  validateOrganizationDistributor,
} from "../../../validation/organizationDistributors";
import type { OrganizationDistributor } from "../../../validation/organizationDistributors";
import { validateCreateFavorite, validateUpdateFavorite } from "../../../validation/favorites";
import type { Favorite } from "../../../validation/favorites";
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
  product_distributors: ProductDistributor;
  organization_distributors: OrganizationDistributor;
  sales: Sale;
  activities: ActivityRecord;
  engagements: ActivityRecord;
  interactions: ActivityRecord;
  segments: Segment;
  user_favorites: Favorite;
}

/**
 * ValidationService handles all Zod validation at API boundaries
 * Following Engineering Constitution principle #5: Zod at API boundary only
 *
 * This service consolidates all validation logic previously scattered
 * in the monolithic unifiedDataProvider (was ~100 lines)
 *
 * NOTE: Notes resources are registered under BOTH camelCase and snake_case keys
 * because composedDataProvider uses snake_case (contact_notes) but some legacy
 * code may use camelCase (contactNotes). This prevents silent validation bypass.
 * See: docs/PROVIDER_AUDIT_REPORT.md [CRITICAL-001]
 */
export class ValidationService {
  private validationRegistry: Record<string, ValidationHandlers<unknown>>;

  constructor() {
    // Shared validators - defined once, used for both casing variants
    const contactNotesValidators: ValidationHandlers<unknown> = {
      create: async (data: unknown) => {
        validateCreateContactNote(data);
      },
      update: async (data: unknown) => {
        validateUpdateContactNote(data);
      },
    };

    const opportunityNotesValidators: ValidationHandlers<unknown> = {
      create: async (data: unknown) => {
        validateCreateOpportunityNote(data);
      },
      update: async (data: unknown) => {
        validateUpdateOpportunityNote(data);
      },
    };

    const organizationNotesValidators: ValidationHandlers<unknown> = {
      create: async (data: unknown) => {
        validateCreateOrganizationNote(data);
      },
      update: async (data: unknown) => {
        validateUpdateOrganizationNote(data);
      },
    };

    this.validationRegistry = {
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
        // FIX: Use validators that allow distributor fields
        // These fields are handled by productsHandler before DB write
        // Original validators still exist for use cases without distributors
        create: async (data: unknown) => validateProductFormWithDistributors(data),
        update: async (data: unknown) => validateProductUpdateWithDistributors(data),
      },
      product_distributors: {
        create: async (data: unknown) => validateCreateProductDistributor(data),
        update: async (data: unknown) => validateUpdateProductDistributor(data),
      },
      organization_distributors: {
        create: async (data: unknown) => validateCreateOrganizationDistributor(data),
        update: async (data: unknown) => validateOrganizationDistributor(data),
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
      // Notes resources - registered under BOTH camelCase and snake_case
      // camelCase (legacy compatibility)
      contactNotes: contactNotesValidators,
      opportunityNotes: opportunityNotesValidators,
      organizationNotes: organizationNotesValidators,
      // snake_case (actual resource names from composedDataProvider)
      contact_notes: contactNotesValidators,
      opportunity_notes: opportunityNotesValidators,
      organization_notes: organizationNotesValidators,

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
        // Use partial schema for updates - allows PATCH-style partial updates
        // Critical for soft-delete (beforeDelete → update with only deleted_at)
        update: async (data: unknown) => validateUpdateActivities(data),
      },
      engagements: {
        create: async (data: unknown) => validateEngagementsForm(data),
        // Use partial schema for updates
        update: async (data: unknown) => validateUpdateEngagements(data),
      },
      interactions: {
        create: async (data: unknown) => validateInteractionsForm(data),
        // Use partial schema for updates
        update: async (data: unknown) => validateUpdateInteractions(data),
      },
      segments: {
        create: async (data: unknown) => {
          validateCreateSegment(data);
        },
        update: async (data: unknown) => {
          validateUpdateSegment(data);
        },
      },
      user_favorites: {
        create: async (data: unknown) => {
          validateCreateFavorite(data);
        },
        update: async (data: unknown) => {
          validateUpdateFavorite(data);
        },
      },
    };
  }

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
   * Validate opportunity close action (WG-002)
   * Enforces win/loss reason requirements when closing opportunities.
   * This is a dedicated method because close is a special operation
   * distinct from regular create/update validation.
   *
   * @param data The close opportunity data (id, stage, win_reason/loss_reason)
   * @throws ZodError if validation fails (missing required reason)
   */
  async validateCloseOpportunity(data: unknown): Promise<void> {
    await validateCloseOpportunity(data);
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
