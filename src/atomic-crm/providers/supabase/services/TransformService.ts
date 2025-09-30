import type {
  RAFile,
  Contact,
  ContactNote,
  OpportunityNote,
  Organization,
  Sale
} from "../../../types";
import { processContactAvatar, processOrganizationLogo } from "../../../utils/avatar.utils";
import type { StorageService } from "./StorageService";

// Union type for all transformable data types
type TransformableData =
  | Partial<Contact>
  | Partial<ContactNote>
  | Partial<OpportunityNote>
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

  private transformerRegistry: Record<string, {
    transform?: TransformerFunction<TransformableData>;
  }> = {
    contactNotes: {
      transform: async (data: TransformableData) => {
        const noteData = data as Partial<ContactNote>;
        if (noteData.attachments && Array.isArray(noteData.attachments)) {
          // Upload all attachments in parallel for better performance
          const uploadPromises = noteData.attachments
            .filter(attachment => attachment && typeof attachment === 'object')
            .map(attachment => this.storageService.uploadToBucket(attachment as RAFile));

          await Promise.all(uploadPromises);
        }
        return noteData;
      }
    },
    opportunityNotes: {
      transform: async (data: TransformableData) => {
        const noteData = data as Partial<OpportunityNote>;
        if (noteData.attachments && Array.isArray(noteData.attachments)) {
          // Upload all attachments in parallel for better performance
          const uploadPromises = noteData.attachments
            .filter(attachment => attachment && typeof attachment === 'object')
            .map(attachment => this.storageService.uploadToBucket(attachment as RAFile));

          await Promise.all(uploadPromises);
        }
        return noteData;
      }
    },
    sales: {
      transform: async (data: TransformableData) => {
        const saleData = data as Partial<Sale>;
        if (saleData.avatar && typeof saleData.avatar === 'object') {
          await this.storageService.uploadToBucket(saleData.avatar as RAFile);
        }
        return saleData;
      }
    },
    contacts: {
      transform: async (data: TransformableData) => {
        const contactData = data as Partial<Contact>;
        // Process avatar (upload if needed, delete old if changed)
        const processedData = await processContactAvatar(contactData);

        // Remove organizations field - it's a junction table relationship, not a column
        const { organizations, ...cleanedData } = processedData as any;

        // Combine first_name and last_name into name field (required by database)
        if (cleanedData.first_name || cleanedData.last_name) {
          cleanedData.name = `${cleanedData.first_name || ''} ${cleanedData.last_name || ''}`.trim();
        }

        // Add timestamp for create operations
        if (!cleanedData.id) {
          // Use type assertion since created_at is a database field that might not be in type definition
          (cleanedData as Record<string, unknown>).created_at = new Date().toISOString();
        }

        return cleanedData;
      }
    },
    organizations: {
      transform: async (data: TransformableData) => {
        const orgData = data as Partial<Organization>;
        // Process logo (upload if needed)
        const processedData = await processOrganizationLogo(orgData);

        // Handle raw file uploads for logos
        if (processedData.logo &&
            typeof processedData.logo === 'object' &&
            (processedData.logo as RAFile).rawFile instanceof File) {
          await this.storageService.uploadToBucket(processedData.logo as RAFile);
        }

        // Add timestamp for create operations
        if (!processedData.id) {
          // Use type assertion since created_at is a database field that might not be in type definition
          (processedData as Record<string, unknown>).created_at = new Date().toISOString();
        }

        return processedData;
      }
    },
  };

  /**
   * Transform data for a specific resource
   * @param resource The resource being transformed
   * @param data The data to transform
   * @returns The transformed data
   */
  async transform<T extends TransformableData>(
    resource: string,
    data: T
  ): Promise<T> {
    const transformer = this.transformerRegistry[resource];

    if (!transformer?.transform) {
      // No transformation configured for this resource
      return data;
    }

    return transformer.transform(data) as Promise<T>;
  }
}