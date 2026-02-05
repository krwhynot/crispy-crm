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
    getList: async <RecordType extends Record<string, unknown> = Record<string, unknown>>(
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

    getOne: async <RecordType extends Record<string, unknown> = Record<string, unknown>>(
      resource: string,
      params: GetOneParams
    ) => {
      return {
        data: { id: params.id } as unknown as RecordType,
      };
    },

    getMany: async <RecordType extends Record<string, unknown> = Record<string, unknown>>(
      resource: string,
      params: GetManyParams
    ) => {
      return {
        data: params.ids.map((id) => ({ id })) as unknown as RecordType[],
      };
    },

    getManyReference: async <RecordType extends Record<string, unknown> = Record<string, unknown>>(
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

    create: async <RecordType extends Record<string, unknown> = Record<string, unknown>>(
      resource: string,
      params: CreateParams
    ) => {
      // Simulate pessimistic mode delay
      await new Promise((resolve) => setTimeout(resolve, 100));

      return {
        data: {
          ...params.data,
          id: faker.number.int({ min: 1, max: 10000 }),
        } as unknown as RecordType,
      };
    },

    update: async <RecordType extends Record<string, unknown> = Record<string, unknown>>(
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

    delete: async <RecordType extends Record<string, unknown> = Record<string, unknown>>(
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

    // Custom method for atomic activity + task creation (QuickLogForm)
    logActivityWithTask: async (_params: unknown) => {
      return {
        success: true,
        activity_id: 1,
        task_id: null,
      };
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
    login: async (_params: { username: string; password: string }) => {
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
    checkError: async (_error: unknown) => {
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
 * Mock Opportunity type for test factories
 */
interface MockOpportunity {
  id: number;
  name: string;
  stage: string;
  status: string;
  priority: string;
  probability: number;
  expected_closing_date: string;
  customer_organization_id: number;
  contact_ids: number[];
  opportunity_owner_id: number;
  account_manager_id: number;
  index: number;
  products: unknown[];
  created_at: string;
  updated_at: string;
  deleted_at: null | string;
}

/**
 * Mock Contact type for test factories
 */
interface MockContact {
  id: number;
  first_name: string;
  last_name: string;
  email: Array<{ value: string; type: "work" | "home" | "other" }>;
  phone: Array<{ value: string; type: "work" | "home" | "other" }>;
  title: string;
  organization_id: number;
  department: string;
  company_name: string;
  avatar: string;
  tags: unknown[];
  first_seen: string;
  last_seen: string;
  created_at: string;
  updated_at: string;
  deleted_at: null | string;
}

/**
 * Mock Organization type for test factories
 */
interface MockOrganization {
  id: number;
  name: string;
  website: string;
  linkedin_url: string;
  segment_id: string;
  priority: string;
  parent_organization_id: null | number;
  context_links: unknown[];
  created_at: string;
  updated_at: string;
  deleted_at: null | string;
}

/**
 * Mock Product type for test factories
 */
interface MockProduct {
  id: number;
  name: string;
  sku: string;
  category: string;
  description: string;
  status: string;
  certifications: unknown[];
  allergens: unknown[];
  image_urls: unknown[];
  created_at: string;
  updated_at: string;
}

/**
 * Mock Task type for test factories
 */
interface MockTask {
  id: number;
  title: string;
  description: string;
  task_type: string;
  status: string;
  priority: string;
  due_date: string;
  sales_id: number;
  contact_id: number;
  opportunity_id: number;
  created_at: string;
  updated_at: string;
}

/**
 * Mock Activity type for test factories
 * Matches the Activities schema from src/atomic-crm/validation/activities.ts
 */
interface MockActivity {
  id: number;
  activity_type: "activity" | "task";
  type: string; // interaction type: call, email, meeting, demo, sample, etc.
  subject: string;
  description: string | null;
  activity_date: string;
  duration_minutes: number | null;
  contact_id: number | null;
  organization_id: number | null;
  opportunity_id: number | null;
  follow_up_required: boolean;
  follow_up_date: string | null;
  follow_up_notes: string | null;
  outcome: string | null;
  sentiment: "positive" | "neutral" | "negative" | null;
  sample_status: "sent" | "received" | "feedback_pending" | "feedback_received" | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/**
 * Create a mock opportunity record
 */
export const createMockOpportunity = (overrides?: Partial<MockOpportunity>): MockOpportunity => ({
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
export const createMockContact = (overrides?: Partial<MockContact>): MockContact => ({
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
export const createMockOrganization = (
  overrides?: Partial<MockOrganization>
): MockOrganization => ({
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
export const createMockProduct = (overrides?: Partial<MockProduct>): MockProduct => ({
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
export const createMockTask = (overrides?: Partial<MockTask>): MockTask => ({
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
 * Create a mock activity record
 * Matches the Activities schema for activity/sample activities
 */
export const createMockActivity = (overrides?: Partial<MockActivity>): MockActivity => ({
  id: faker.number.int({ min: 1, max: 10000 }),
  activity_type: "activity" as const,
  type: faker.helpers.arrayElement([
    "call",
    "email",
    "meeting",
    "demo",
    "proposal",
    "follow_up",
    "trade_show",
    "site_visit",
    "sample",
    "note",
  ]),
  subject: faker.company.catchPhrase(),
  description: faker.lorem.paragraph(),
  activity_date: faker.date.recent().toISOString().split("T")[0],
  duration_minutes: faker.helpers.arrayElement([15, 30, 45, 60, 90, null]),
  contact_id: faker.number.int({ min: 1, max: 100 }),
  organization_id: faker.number.int({ min: 1, max: 100 }),
  opportunity_id: faker.helpers.arrayElement([faker.number.int({ min: 1, max: 100 }), null]),
  follow_up_required: faker.datatype.boolean(),
  follow_up_date: faker.helpers.arrayElement([
    faker.date.future().toISOString().split("T")[0],
    null,
  ]),
  follow_up_notes: faker.helpers.arrayElement([faker.lorem.sentence(), null]),
  outcome: faker.helpers.arrayElement([faker.lorem.sentence(), null]),
  sentiment: faker.helpers.arrayElement(["positive", "neutral", "negative", null] as const),
  sample_status: null, // Only set for sample activities
  created_by: faker.number.int({ min: 1, max: 20 }),
  created_at: faker.date.past().toISOString(),
  updated_at: faker.date.recent().toISOString(),
  deleted_at: null,
  ...overrides,
});

/**
 * Create a sample activity (special case with sample workflow fields)
 */
export const createMockSampleActivity = (overrides?: Partial<MockActivity>): MockActivity => ({
  ...createMockActivity({
    type: "sample",
    sample_status: faker.helpers.arrayElement([
      "sent",
      "received",
      "feedback_pending",
      "feedback_received",
    ] as const),
    follow_up_required: true,
    follow_up_date: faker.date.future().toISOString().split("T")[0],
  }),
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
export const createRejectedDataProvider = (
  method: keyof DataProvider,
  error: unknown
): DataProvider => {
  const provider = createMockDataProvider();
  return {
    ...provider,
    [method]: async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      throw error;
    },
  };
};
