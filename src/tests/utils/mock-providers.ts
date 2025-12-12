/**
 * Mock Data Providers and Test Data Factories
 *
 * Provides mock implementations of React Admin data provider and auth provider
 * for component testing, plus factory functions for generating test data.
 */

import type {
  DataProvider,
  AuthProvider,
  GetListParams,
  GetOneParams,
  GetManyParams,
  GetManyReferenceParams,
  UpdateParams,
  UpdateManyParams,
  CreateParams,
  DeleteParams,
  DeleteManyParams,
} from "ra-core";
import { faker } from "@faker-js/faker";

/**
 * Default mock data provider implementing all CRUD methods
 * Returns resolved promises with mock data
 */
export const createMockDataProvider = (overrides?: Partial<DataProvider>): DataProvider => {
  const defaultProvider: DataProvider = {
    getList: async <RecordType extends Record<string, any> = any>(
      _resource: string,
      _params: GetListParams
    ) => {
      // Simulate pessimistic mode delay
      await new Promise((resolve) => setTimeout(resolve, 100));

      return {
        data: [] as RecordType[],
        total: 0,
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
    },

    getOne: async <RecordType extends Record<string, any> = any>(
      resource: string,
      params: GetOneParams
    ) => {
      return {
        data: { id: params.id } as RecordType,
      };
    },

    getMany: async <RecordType extends Record<string, any> = any>(
      resource: string,
      params: GetManyParams
    ) => {
      return {
        data: params.ids.map((id) => ({ id })) as RecordType[],
      };
    },

    getManyReference: async <RecordType extends Record<string, any> = any>(
      _resource: string,
      _params: GetManyReferenceParams
    ) => {
      return {
        data: [] as RecordType[],
        total: 0,
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
    },

    create: async <RecordType extends Record<string, any> = any>(
      resource: string,
      params: CreateParams
    ) => {
      // Simulate pessimistic mode delay
      await new Promise((resolve) => setTimeout(resolve, 100));

      return {
        data: {
          ...params.data,
          id: faker.number.int({ min: 1, max: 10000 }),
        } as RecordType,
      };
    },

    update: async <RecordType extends Record<string, any> = any>(
      resource: string,
      params: UpdateParams
    ) => {
      // Simulate pessimistic mode delay
      await new Promise((resolve) => setTimeout(resolve, 100));

      return {
        data: { ...params.previousData, ...params.data } as RecordType,
      };
    },

    updateMany: async (resource: string, params: UpdateManyParams) => {
      return {
        data: params.ids,
      };
    },

    delete: async <RecordType extends Record<string, any> = any>(
      resource: string,
      params: DeleteParams
    ) => {
      return {
        data: params.previousData as RecordType,
      };
    },

    deleteMany: async (resource: string, params: DeleteManyParams) => {
      return {
        data: params.ids,
      };
    },

    // RPC method for calling database functions (e.g., get_activity_log)
    rpc: async (_functionName: string, _params?: Record<string, any>) => {
      // Default: return empty array for activity logs and other RPC calls
      // Tests can override this method to return specific data
      return [];
    },
  };

  // Merge overrides with defaults
  return {
    ...defaultProvider,
    ...overrides,
  };
};

/**
 * Mock auth provider with configurable role (admin/user)
 */
export const createMockAuthProvider = (options?: {
  role?: "admin" | "user";
  isAuthenticated?: boolean;
}): AuthProvider => {
  const { role = "user", isAuthenticated = true } = options || {};

  return {
    login: async (_params: any) => {
      return Promise.resolve();
    },
    logout: async () => {
      return Promise.resolve();
    },
    checkAuth: async () => {
      if (!isAuthenticated) {
        return Promise.reject();
      }
      return Promise.resolve();
    },
    checkError: async (_error: any) => {
      return Promise.resolve();
    },
    getPermissions: async () => {
      return Promise.resolve(role === "admin" ? ["admin"] : ["user"]);
    },
    getIdentity: async () => {
      return Promise.resolve({
        id: faker.number.int({ min: 1, max: 1000 }),
        fullName: faker.person.fullName(),
        avatar: faker.image.avatar(),
        administrator: role === "admin",
      });
    },
  };
};

/**
 * Test Data Factory Functions
 */

/**
 * Create a mock opportunity record
 */
export const createMockOpportunity = (overrides?: any) => ({
  id: faker.number.int({ min: 1, max: 10000 }),
  name: faker.company.catchPhrase(),
  stage: faker.helpers.arrayElement([
    "lead",
    "qualified",
    "proposal",
    "negotiation",
    "closed_won",
    "closed_lost",
  ]),
  // Required fields per Opportunity type (src/atomic-crm/types.ts:228-232)
  status: faker.helpers.arrayElement(["active", "on_hold", "nurturing", "stalled", "expired"]),
  priority: faker.helpers.arrayElement(["low", "medium", "high", "critical"]),
  probability: faker.number.int({ min: 0, max: 100 }),
  expected_closing_date: faker.date.future().toISOString().split("T")[0],
  customer_organization_id: faker.number.int({ min: 1, max: 100 }),
  contact_ids: [faker.number.int({ min: 1, max: 100 })],
  opportunity_owner_id: faker.number.int({ min: 1, max: 20 }),
  account_manager_id: faker.number.int({ min: 1, max: 20 }),
  index: faker.number.int({ min: 0, max: 100 }),
  products: [],
  created_at: faker.date.past().toISOString(),
  updated_at: faker.date.recent().toISOString(),
  deleted_at: null,
  ...overrides,
});

/**
 * Create a mock contact record
 * Note: Contacts have a single organization_id (not array) per PRD
 */
export const createMockContact = (overrides?: any) => ({
  id: faker.number.int({ min: 1, max: 10000 }),
  first_name: faker.person.firstName(),
  last_name: faker.person.lastName(),
  email: [
    {
      value: faker.internet.email(),
      type: faker.helpers.arrayElement(["work", "home", "other"] as const),
    },
  ],
  phone: [
    {
      value: faker.phone.number(),
      type: faker.helpers.arrayElement(["work", "home", "other"] as const),
    },
  ],
  title: faker.person.jobTitle(),
  organization_id: faker.number.int({ min: 1, max: 100 }),
  department: faker.commerce.department(),
  company_name: faker.company.name(),
  avatar: faker.image.avatar(),
  tags: [],
  first_seen: faker.date.past().toISOString(),
  last_seen: faker.date.recent().toISOString(),
  created_at: faker.date.past().toISOString(),
  updated_at: faker.date.recent().toISOString(),
  deleted_at: null,
  ...overrides,
});

/**
 * Create a mock organization record
 */
export const createMockOrganization = (overrides?: any) => ({
  id: faker.number.int({ min: 1, max: 10000 }),
  name: faker.company.name(),
  website: faker.internet.url(),
  linkedin_url: `https://linkedin.com/company/${faker.helpers.slugify(faker.company.name())}`,
  segment_id: faker.helpers.arrayElement([
    "562062be-c15b-417f-b2a1-d4a643d69d52", // Unknown
    "7ff800ed-22b9-46b1-acd3-f4180fe9fe55", // Health Care
    "c596adaa-94b1-4145-b1fc-c54dffdcca1f", // restaurant
  ]),
  priority: faker.helpers.arrayElement(["A", "B", "C", "D"]),
  parent_organization_id: null,
  context_links: [],
  created_at: faker.date.past().toISOString(),
  updated_at: faker.date.recent().toISOString(),
  deleted_at: null,
  ...overrides,
});

/**
 * Create a mock product record
 */
export const createMockProduct = (overrides?: any) => ({
  id: faker.number.int({ min: 1, max: 10000 }),
  name: faker.commerce.productName(),
  sku: faker.commerce.isbn(),
  category: faker.commerce.department(),
  description: faker.commerce.productDescription(),
  status: "active",
  certifications: [],
  allergens: [],
  image_urls: [],
  created_at: faker.date.past().toISOString(),
  updated_at: faker.date.recent().toISOString(),
  ...overrides,
});

/**
 * Create a mock task record
 */
export const createMockTask = (overrides?: any) => ({
  id: faker.number.int({ min: 1, max: 10000 }),
  title: faker.lorem.sentence(),
  description: faker.lorem.paragraph(),
  task_type: faker.helpers.arrayElement([
    "Call",
    "Email",
    "Meeting",
    "Follow-up",
    "Demo",
    "Proposal",
    "Other",
  ]),
  status: faker.helpers.arrayElement(["pending", "in_progress", "completed", "cancelled"]),
  priority: faker.helpers.arrayElement(["low", "medium", "high"]),
  due_date: faker.date.future().toISOString().split("T")[0],
  sales_id: faker.number.int({ min: 1, max: 20 }),
  contact_id: faker.number.int({ min: 1, max: 100 }),
  opportunity_id: faker.number.int({ min: 1, max: 100 }),
  created_at: faker.date.past().toISOString(),
  updated_at: faker.date.recent().toISOString(),
  ...overrides,
});

/**
 * JSONB Array Factory Functions
 */

/**
 * Create an email array in JSONB format for contacts
 * @param emails Array of email objects with optional type
 * @returns JSONB-formatted email array matching Zod schema: { value, type: "work" | "home" | "other" }
 */
export const createEmailArray = (emails: { value: string; type?: "work" | "home" | "other" }[]) =>
  emails.map(({ value, type = "work" }) => ({ value, type }));

/**
 * Create a phone array in JSONB format for contacts
 * @param phones Array of phone objects with optional type
 * @returns JSONB-formatted phone array matching Zod schema: { value, type: "work" | "home" | "other" }
 */
export const createPhoneArray = (phones: { value: string; type?: "work" | "home" | "other" }[]) =>
  phones.map(({ value, type = "work" }) => ({ value, type }));

/**
 * API Error Simulation Helpers
 */

/**
 * Create a 500 server error response
 */
export const createServerError = (message = "Internal server error") => ({
  message,
  status: 500,
});

/**
 * Create an RLS policy violation error
 */
export const createRLSViolationError = (field?: string) => ({
  message: "RLS policy violation",
  errors: field
    ? {
        [field]: "You do not have permission to perform this action",
      }
    : { _error: "You do not have permission to perform this action" },
});

/**
 * Create a network timeout error
 */
export const createNetworkError = () => new Error("Network request failed: timeout");

/**
 * Create a validation error with field-specific messages
 */
export const createValidationError = (
  errors: Record<string, string>,
  message = "Validation failed"
) => ({
  message,
  errors,
});

/**
 * Create a rejected data provider method (for testing error states)
 */
export const createRejectedDataProvider = (method: keyof DataProvider, error: any) => {
  const provider = createMockDataProvider();
  return {
    ...provider,
    [method]: async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      throw error;
    },
  };
};
