/**
 * MCP-Specific Test Setup
 *
 * Configures tests for cloud database connectivity with:
 * - Connection retry logic with exponential backoff
 * - Test data namespacing with unique prefixes
 * - Emergency cleanup mechanisms for orphaned test data
 * - Connection pooling optimization
 * - Service role RLS bypass for administrative operations
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, afterAll } from "vitest";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.development" });

// Validate cloud database configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Validate that cloud URLs are configured (not localhost)
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "Missing required environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be configured",
  );
}

if (SUPABASE_URL.includes("127.0.0.1") || SUPABASE_URL.includes("localhost")) {
  throw new Error(
    "Cloud database URL required for MCP tests. Remove localhost URLs from environment configuration.",
  );
}

if (!SUPABASE_SERVICE_KEY) {
  console.warn(
    "SUPABASE_SERVICE_ROLE_KEY not configured - some tests may fail",
  );
}

// Connection configuration for cloud database
const connectionConfig = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  global: {
    headers: {
      "x-application-name": "atomic-crm-tests",
    },
  },
  db: {
    schema: "public",
  },
  // Connection pooling configuration
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
};

// Test data namespacing
export function generateTestPrefix(): string {
  const env = process.env.NODE_ENV || "development";
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `test_${env}_${timestamp}_${random}`;
}

// Exponential backoff retry configuration
interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  factor: number;
}

const defaultRetryConfig: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 100, // Start with 100ms
  maxDelay: 2000, // Max 2 seconds
  factor: 2,
};

// Retry wrapper with exponential backoff
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = defaultRetryConfig,
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (attempt === config.maxAttempts) {
        break;
      }

      const delay = Math.min(
        config.baseDelay * Math.pow(config.factor, attempt - 1),
        config.maxDelay,
      );

      console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms:`, error);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

// Create Supabase clients
export const supabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  connectionConfig,
);
export const serviceClient = SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, connectionConfig)
  : null;

// Connection health check
export async function checkConnection(): Promise<void> {
  const healthCheck = async () => {
    const { error } = await supabaseClient
      .from("init_state")
      .select("is_initialized")
      .limit(1);

    if (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }
  };

  await withRetry(healthCheck);
}

// Test data cleanup registry
const cleanupRegistry = new Set<() => Promise<void>>();

export function registerCleanup(cleanup: () => Promise<void>): void {
  cleanupRegistry.add(cleanup);
}

// Emergency cleanup for orphaned test data
export async function emergencyCleanup(): Promise<void> {
  if (!serviceClient) {
    console.warn("Service client not available - skipping emergency cleanup");
    return;
  }

  const tables = [
    "opportunities",
    "contacts",
    "organizations",
    "tasks",
    "opportunity_items",
    "contact_organizations",
  ];

  // Clean up test data based on naming convention
  const testPattern = "test_%";

  for (const table of tables) {
    try {
      const { error } = await serviceClient
        .from(table)
        .delete()
        .like("name", testPattern);

      if (error && !error.message.includes('column "name" does not exist')) {
        console.warn(`Emergency cleanup failed for ${table}:`, error);
      }
    } catch (error) {
      console.warn(`Emergency cleanup error for ${table}:`, error);
    }
  }
}

// Cleanup all registered cleanup functions
export async function runAllCleanups(): Promise<void> {
  const promises = Array.from(cleanupRegistry).map(async (cleanup) => {
    try {
      await cleanup();
    } catch (error) {
      console.error("Cleanup failed:", error);
    }
  });

  await Promise.allSettled(promises);
  cleanupRegistry.clear();
}

// Test data creation helpers with namespacing
export interface TestDataTracker {
  organizations: number[];
  contacts: number[];
  opportunities: number[];
  tasks: number[];
}

export function createTestDataTracker(): TestDataTracker {
  return {
    organizations: [],
    contacts: [],
    opportunities: [],
    tasks: [],
  };
}

// Cleanup helper with service role RLS bypass
export async function cleanupTestData(
  tracker: TestDataTracker,
  client?: SupabaseClient<any, "public", any>,
): Promise<void> {
  const cleanupClient = client || serviceClient || supabaseClient;
  const cleanup = async () => {
    // Clean up in dependency order (children first)
    if (tracker.opportunities.length > 0) {
      await cleanupClient
        .from("opportunities")
        .delete()
        .in("id", tracker.opportunities);
    }

    if (tracker.tasks.length > 0) {
      await cleanupClient.from("tasks").delete().in("id", tracker.tasks);
    }

    if (tracker.contacts.length > 0) {
      await cleanupClient.from("contacts").delete().in("id", tracker.contacts);
    }

    if (tracker.organizations.length > 0) {
      await cleanupClient
        .from("organizations")
        .delete()
        .in("id", tracker.organizations);
    }
  };

  await withRetry(cleanup);
}

// Global test setup
beforeEach(async () => {
  // Verify connection before each test
  await checkConnection();
});

// Global test teardown
afterAll(async () => {
  // Run all registered cleanups
  await runAllCleanups();

  // Emergency cleanup as failsafe
  await emergencyCleanup();
});

// Export for use in tests
export { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY };
