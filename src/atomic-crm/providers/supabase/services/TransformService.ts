import type {
  RAFile,
  Contact,
  ContactNote,
  OpportunityNote,
  OrganizationNote,
  Opportunity,
  Organization,
  Sale,
} from "../../../types";
import { processContactAvatar, processOrganizationLogo } from "../../../utils/avatar.utils";
import type { StorageService } from "./StorageService";

// Union type for all transformable data types
type TransformableData =
  | Partial<Contact>
  | Partial<ContactNote>
  | Partial<OpportunityNote>
  | Partial<OrganizationNote>
  | Partial<Opportunity>
  | Partial<Organization>
  | Partial<Sale>;

// Generic transformer function type
type TransformerFunction<T = TransformableData> = (data: T) => Promise<T>;

/**
 * Fields to strip BEFORE Zod validation (from opportunities_summary view + system fields)
 *
 * SECURITY: Uses explicit denylist. z.strictObject() remains as final security gate.
 * If a new bad field appears, validation fails safely (caught by strictObject).
 *
 * Source: opportunities_summary view definition + database schema
 */
const OPPORTUNITY_FIELDS_TO_STRIP = [
  // View JOIN fields (organization names from LEFT JOINs)
  "principal_organization_name",
  "customer_organization_name",
  "distributor_organization_name",
  // Computed aggregations (calculated in view CTEs)
  "nb_interactions",
  "last_interaction_date",
  "days_in_stage",
  "days_since_last_activity",
  "pending_task_count",
  "overdue_task_count",
  // Next task computed fields (from tasks subquery in view)
  "next_task_id",
  "next_task_title",
  "next_task_due_date",
  "next_task_priority",
  // System/trigger fields (managed by PostgreSQL, not user input)
  "search_tsv",
  "stage_changed_at",
  "created_by",
  "updated_by",
  "index",
  // Internal state fields (not in UI schema, managed by system)
  "status",
  "actual_close_date",
  "founding_interaction_id",
  "stage_manual",
  "status_manual",
  "competition",
  // Metadata (managed by DB triggers, not form fields)
  "created_at",
  "updated_at",
  "deleted_at",
  // Legacy/view fields
  "products", // View field - UI uses products_to_sync for sync
  "total_value",
  "participant_count",
  "contact_count",
  "product_count",
  "version", // Managed by DB for optimistic locking
  // Owner/assignment fields (set programmatically, not via edit form)
  "opportunity_owner_id",
] as const;

/**
 * TransformService handles data mutations and transformations
 * Following Engineering Constitution principle #1: Single responsibility
 *
 * This service consolidates all transformation logic previously scattered
 * in the monolithic unifiedDataProvider (was ~150 lines)
 */
export class TransformService {
  constructor(private storageService: StorageService) {}

  private transformerRegistry: Record<
    string,
    {
      transform?: TransformerFunction<TransformableData>;
    }
  > = {
    contactNotes: {
      transform: async (data: TransformableData) => {
        const noteData = data as Partial<ContactNote>;
        if (noteData.attachments && Array.isArray(noteData.attachments)) {
          // Upload all attachments in parallel for better performance
          const uploadPromises = noteData.attachments
            .filter((attachment) => attachment && typeof attachment === "object")
            .map((attachment) => this.storageService.uploadToBucket(attachment as RAFile));

          try {
            await Promise.all(uploadPromises);
          } catch (error) {
            console.error('Contact note attachment upload failed:', error);
            throw error; // Fail-fast: re-throw for caller to handle
          }
        }
        return noteData;
      },
    },
    opportunityNotes: {
      transform: async (data: TransformableData) => {
        const noteData = data as Partial<OpportunityNote>;
        if (noteData.attachments && Array.isArray(noteData.attachments)) {
          // Upload all attachments in parallel for better performance
          const uploadPromises = noteData.attachments
            .filter((attachment) => attachment && typeof attachment === "object")
            .map((attachment) => this.storageService.uploadToBucket(attachment as RAFile));

          try {
            await Promise.all(uploadPromises);
          } catch (error) {
            console.error('Opportunity note attachment upload failed:', error);
            throw error; // Fail-fast: re-throw for caller to handle
          }
        }
        return noteData;
      },
    },
    organizationNotes: {
      transform: async (data: TransformableData) => {
        const noteData = data as Partial<OrganizationNote>;
        if (noteData.attachments && Array.isArray(noteData.attachments)) {
          // Upload all attachments in parallel for better performance
          const uploadPromises = noteData.attachments
            .filter((attachment) => attachment && typeof attachment === "object")
            .map((attachment) => this.storageService.uploadToBucket(attachment as RAFile));

          try {
            await Promise.all(uploadPromises);
          } catch (error) {
            console.error('Organization note attachment upload failed:', error);
            throw error; // Fail-fast: re-throw for caller to handle
          }
        }
        return noteData;
      },
    },
    sales: {
      transform: async (data: TransformableData) => {
        const saleData = data as Partial<Sale>;
        if (saleData.avatar && typeof saleData.avatar === "object") {
          await this.storageService.uploadToBucket(saleData.avatar as RAFile);
        }
        return saleData;
      },
    },
    contacts: {
      transform: async (data: TransformableData) => {
        const contactData = data as Partial<Contact>;
        // Process avatar (upload if needed, delete old if changed)
        const processedData = await processContactAvatar(contactData);

        // Extract organizations for junction table sync (similar to opportunities/products pattern)
        // Type-safe destructuring with unknown record to handle dynamic fields
        // Also strip quickCreate flag - not a database column (used for validation bypass)
        const processedDataWithDynamicFields = processedData as Partial<Contact> & Record<string, unknown>;
        const { organizations, quickCreate: _quickCreate, ...cleanedData } = processedDataWithDynamicFields;

        // Combine first_name and last_name into name field (required by database)
        if (cleanedData.first_name || cleanedData.last_name) {
          (cleanedData as Record<string, unknown>).name =
            `${cleanedData.first_name || ""} ${cleanedData.last_name || ""}`.trim();
        }

        // Add timestamp for create operations
        if (!cleanedData.id) {
          // Use type assertion since created_at is a database field that might not be in type definition
          (cleanedData as Record<string, unknown>).created_at = new Date().toISOString();
        }

        // Preserve organizations for sync (rename to avoid column error, handled by data provider)
        if (organizations !== undefined) {
          (cleanedData as Record<string, unknown>).organizations_to_sync = organizations;
        }

        return cleanedData;
      },
    },
    opportunities: {
      transform: async (data: TransformableData) => {
        const opportunityData = data as Partial<Opportunity>;

        // Extract BOTH possible field names for products to prevent schema cache errors
        // - 'products' is the legacy field name (may come from some forms)
        // - 'products_to_sync' is sent directly by current OpportunityCreate form (ArrayInput source)
        // Destructuring both removes them from cleanedData, preventing PostgREST column errors
        // Type-safe destructuring with unknown record to handle dynamic fields
        const opportunityDataWithDynamicFields = opportunityData as Partial<Opportunity> & Record<string, unknown>;
        const { products, products_to_sync, ...cleanedData } = opportunityDataWithDynamicFields;

        // Determine which products array to use (prefer products_to_sync if present)
        const productsArray = products_to_sync ?? products;

        // Preserve products for service layer sync
        // Service layer will extract and delete this before database operations
        if (productsArray !== undefined && Array.isArray(productsArray)) {
          (cleanedData as Record<string, unknown>).products_to_sync = productsArray;
        }

        // Add timestamp for create operations
        if (!cleanedData.id) {
          // Use type assertion since created_at is a database field that might not be in type definition
          (cleanedData as Record<string, unknown>).created_at = new Date().toISOString();
        }

        return cleanedData;
      },
    },
    organizations: {
      transform: async (data: TransformableData) => {
        const orgData = data as Partial<Organization>;
        // Process logo (upload if needed)
        const processedData = await processOrganizationLogo(orgData);

        // Handle raw file uploads for logos
        if (
          processedData.logo &&
          typeof processedData.logo === "object" &&
          (processedData.logo as RAFile).rawFile instanceof File
        ) {
          await this.storageService.uploadToBucket(processedData.logo as RAFile);
        }

        // Add timestamp for create operations
        if (!processedData.id) {
          // Use type assertion since created_at is a database field that might not be in type definition
          (processedData as Record<string, unknown>).created_at = new Date().toISOString();
        }

        return processedData;
      },
    },
  };

  /**
   * Check if a resource has a transformer configured
   * @param resource The resource to check
   * @returns True if the resource has a transformer
   */
  hasTransform(resource: string): boolean {
    return (
      resource in this.transformerRegistry &&
      this.transformerRegistry[resource]?.transform !== undefined
    );
  }

  /**
   * Transform data for a specific resource
   * @param resource The resource being transformed
   * @param data The data to transform
   * @returns The transformed data
   */
  async transform<T extends TransformableData>(resource: string, data: T): Promise<T> {
    const transformer = this.transformerRegistry[resource];

    if (!transformer?.transform) {
      // No transformation configured for this resource
      return data;
    }

    return transformer.transform(data) as Promise<T>;
  }

  /**
   * Transform data BEFORE Zod validation (strips non-schema fields)
   *
   * SECURITY: Uses explicit denylist to preserve schema integrity.
   * z.strictObject() remains as the final security gate - this just removes
   * known view/computed fields that would cause validation to fail.
   *
   * @param resource The resource being validated
   * @param data The data to transform before validation
   * @returns Data with non-schema fields stripped
   */
  transformForValidation(resource: string, data: Record<string, unknown>): Record<string, unknown> {
    if (resource === "opportunities") {
      return this.transformOpportunityForValidation(data);
    }
    // No pre-validation transform needed for other resources (yet)
    return data;
  }

  /**
   * Strip non-schema fields from opportunity data before Zod validation
   *
   * Handles three categories:
   * 1. View/computed fields (from opportunities_summary view)
   * 2. React Admin internal tracking IDs in array items
   * 3. contact_ids normalization (objects → plain numbers)
   *
   * @param data Opportunity data from form submission
   * @returns Cleaned data ready for Zod validation
   */
  private transformOpportunityForValidation(data: Record<string, unknown>): Record<string, unknown> {
    const cleaned = { ...data };

    // 1. Strip view/system fields by explicit denylist
    for (const field of OPPORTUNITY_FIELDS_TO_STRIP) {
      delete cleaned[field];
    }

    // 2. Strip internal `id` from products_to_sync array items
    // React Admin's SimpleFormIterator adds tracking IDs like "@@ra-generated-1"
    // Schema expects: { product_id_reference, notes } - no id field
    if (Array.isArray(cleaned.products_to_sync)) {
      cleaned.products_to_sync = (cleaned.products_to_sync as Array<Record<string, unknown>>).map(
        (item) => {
          if (item && typeof item === "object") {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { id, ...rest } = item;
            return rest;
          }
          return item;
        }
      );
    }

    // 3. Normalize contact_ids (objects → plain numbers)
    // Some components may pass { id: 123 } instead of just 123
    if (Array.isArray(cleaned.contact_ids)) {
      cleaned.contact_ids = (cleaned.contact_ids as Array<unknown>).map((item) => {
        if (item && typeof item === "object" && "id" in item) {
          return (item as { id: number }).id;
        }
        return item;
      });
    }

    return cleaned;
  }
}
