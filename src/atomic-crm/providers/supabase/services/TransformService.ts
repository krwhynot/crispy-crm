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
        const { organizations, ...cleanedData } = processedData as any;

        // Combine first_name and last_name into name field (required by database)
        if (cleanedData.first_name || cleanedData.last_name) {
          cleanedData.name =
            `${cleanedData.first_name || ""} ${cleanedData.last_name || ""}`.trim();
        }

        // Add timestamp for create operations
        if (!cleanedData.id) {
          // Use type assertion since created_at is a database field that might not be in type definition
          (cleanedData as Record<string, unknown>).created_at = new Date().toISOString();
        }

        // Preserve organizations for sync (rename to avoid column error, handled by data provider)
        if (organizations) {
          (cleanedData as any).organizations_to_sync = organizations;
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
        const { products, products_to_sync, ...cleanedData } = opportunityData as any;

        // Determine which products array to use (prefer products_to_sync if present)
        const productsArray = products_to_sync ?? products;

        // Preserve products for service layer sync
        // Service layer will extract and delete this before database operations
        if (productsArray && Array.isArray(productsArray)) {
          (cleanedData as any).products_to_sync = productsArray;
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
}
