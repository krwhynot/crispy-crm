/**
 * Test Data Fixtures for E2E Tests
 *
 * This file documents known entity relationships from the seed data
 * that can be used reliably in E2E tests. These are real database records
 * with proper foreign key relationships.
 *
 * IMPORTANT: These IDs and names must match the production seed data.
 * If seed data changes, these fixtures must be updated.
 *
 * Data Discovery Query (run against cloud DB to verify):
 * ```sql
 * SELECT opp.id, opp.name, opp.customer_organization_id,
 *        cust_org.name as customer_org_name,
 *        c.id as contact_id, c.first_name, c.last_name
 * FROM opportunities opp
 * JOIN organizations cust_org ON opp.customer_organization_id = cust_org.id
 * JOIN contacts c ON c.organization_id = cust_org.id
 * WHERE c.first_name IS NOT NULL AND c.last_name IS NOT NULL
 * ORDER BY opp.id LIMIT 10;
 * ```
 */

/**
 * Known valid opportunity-organization-contact relationships
 * Each entry represents a valid combination for Activity form testing
 */
export const TEST_RELATIONSHIPS = {
  /**
   * Opportunity: "Kelly Beattie @ CAMP BLODGETT"
   * - Opportunity ID: 89
   * - Customer Organization: "CAMP BLODGETT" (ID: 1429)
   * - Valid Contact: "Brian Paul" (ID: 910, belongs to org 1429)
   */
  campBlodgett: {
    opportunity: {
      id: 89,
      name: "Kelly Beattie @ CAMP BLODGETT",
      searchText: "CAMP BLODGETT", // Text to search in combobox
    },
    organization: {
      id: 1429,
      name: "CAMP BLODGETT",
      searchText: "CAMP BLODGETT",
    },
    contact: {
      id: 910,
      firstName: "Brian",
      lastName: "Paul",
      fullName: "Brian Paul",
      searchText: "Brian Paul",
    },
  },

  /**
   * Opportunity: "Ryan Wabeke @ Gun Lake Casino"
   * - Opportunity ID: 154
   * - Customer Organization: "Gun Lake Casino" (ID: 1576)
   * - Valid Contact: "Nick Hancotte" (ID: 1189, belongs to org 1576)
   */
  gunLakeCasino: {
    opportunity: {
      id: 154,
      name: "Ryan Wabeke @ Gun Lake Casino",
      searchText: "Gun Lake",
    },
    organization: {
      id: 1576,
      name: "Gun Lake Casino",
      searchText: "Gun Lake",
    },
    contact: {
      id: 1189,
      firstName: "Nick",
      lastName: "Hancotte",
      fullName: "Nick Hancotte",
      searchText: "Nick",
    },
  },

  /**
   * Opportunity: "Ernie Mason @ MICHINDOH CONFERENCE CENTER"
   * - Opportunity ID: 230
   * - Customer Organization: "MICHINDOH CONFERENCE CENTER" (ID: 1286)
   * - Valid Contact: "Ernie Mason" (ID: 801, belongs to org 1286)
   */
  michindoh: {
    opportunity: {
      id: 230,
      name: "Ernie Mason @ MICHINDOH CONFERENCE CENTER",
      searchText: "MICHINDOH",
    },
    organization: {
      id: 1286,
      name: "MICHINDOH CONFERENCE CENTER",
      searchText: "MICHINDOH",
    },
    contact: {
      id: 801,
      firstName: "Ernie",
      lastName: "Mason",
      fullName: "Ernie Mason",
      searchText: "Ernie",
    },
  },

  /**
   * Opportunity: "Mellisa Spinella @ MORRISON LAKE GOLF CLUB"
   * - Opportunity ID: 235
   * - Customer Organization: "MORRISON LAKE GOLF CLUB" (ID: 1402)
   * - Valid Contact: "Mellisa Spinella" (ID: 981, belongs to org 1402)
   */
  morrisonLake: {
    opportunity: {
      id: 235,
      name: "Mellisa Spinella @ MORRISON LAKE GOLF CLUB",
      searchText: "MORRISON LAKE",
    },
    organization: {
      id: 1402,
      name: "MORRISON LAKE GOLF CLUB",
      searchText: "MORRISON LAKE",
    },
    contact: {
      id: 981,
      firstName: "Mellisa",
      lastName: "Spinella",
      fullName: "Mellisa Spinella",
      searchText: "Mellisa",
    },
  },
} as const;

/**
 * Default test relationship to use when any valid relationship will do
 */
export const DEFAULT_TEST_RELATIONSHIP = TEST_RELATIONSHIPS.gunLakeCasino;

/**
 * Organizations that can be used for Contact creation tests
 * These are customer-type organizations from the seed data
 */
export const TEST_ORGANIZATIONS = {
  gunLakeCasino: {
    id: 1576,
    name: "Gun Lake Casino",
    type: "customer",
    searchText: "Gun Lake",
  },
  campBlodgett: {
    id: 1429,
    name: "CAMP BLODGETT",
    type: "customer",
    searchText: "CAMP BLODGETT",
  },
  michindoh: {
    id: 1286,
    name: "MICHINDOH CONFERENCE CENTER",
    type: "customer",
    searchText: "MICHINDOH",
  },
  aAndW: {
    id: 12,
    name: "A&W",
    type: "customer",
    searchText: "A&W",
  },
} as const;

/**
 * Default organization for contact tests
 */
export const DEFAULT_TEST_ORGANIZATION = TEST_ORGANIZATIONS.gunLakeCasino;

/**
 * Activity types available in the system
 */
export const ACTIVITY_TYPES = [
  "call",
  "email",
  "sample",
  "meeting",
  "demo",
  "proposal",
  "follow_up",
  "trade_show",
  "site_visit",
  "contract_review",
  "check_in",
  "social",
  "note",
] as const;

/**
 * Generate a unique test subject with timestamp
 */
export function generateTestSubject(prefix: string = "E2E Test"): string {
  return `${prefix} ${Date.now()}`;
}

/**
 * Generate unique test contact data
 */
export function generateTestContact(overrides?: {
  firstName?: string;
  lastName?: string;
}) {
  const timestamp = Date.now();
  return {
    firstName: overrides?.firstName ?? `TestFirst${timestamp}`,
    lastName: overrides?.lastName ?? `TestLast${timestamp}`,
    email: `test${timestamp}@example.com`,
  };
}
