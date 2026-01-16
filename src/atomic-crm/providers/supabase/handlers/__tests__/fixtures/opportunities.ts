/**
 * Test fixtures for opportunities handler tests
 *
 * Purpose: Centralize test data factories to reduce test churn when schema changes.
 * When required fields are added (WG-001/002/003), update factories here instead of 8+ test cases.
 *
 * Pattern: Factory functions return complete valid objects with sensible defaults.
 * Tests override only the fields relevant to their specific assertion.
 */

import type {
  Opportunity,
  OpportunityStageValue,
  OpportunityPriority,
} from "@/atomic-crm/validation/opportunities";

/**
 * Shape for products_to_sync array items (API boundary shape)
 * Matches createOpportunitySchema.products_to_sync definition
 */
export interface ProductToSync {
  product_id_reference?: string | number;
  notes?: string | null;
}

/**
 * Shape for product items from the view (previousData.products)
 * Matches the JSONB structure returned by opportunities_summary view
 */
export interface ViewProductItem {
  id?: number;
  product_id_reference?: string | number;
  product_name?: string;
  product_category?: string;
  principal_name?: string;
  notes?: string | null;
}

/**
 * Create opportunity input data shape (for create operations)
 * Extends Opportunity but allows products_to_sync virtual field
 */
export interface CreateOpportunityData {
  name: string;
  customer_organization_id: string | number;
  principal_organization_id: string | number;
  estimated_close_date?: string | Date;
  stage: OpportunityStageValue;
  priority: OpportunityPriority;
  contact_ids?: number[];
  products_to_sync?: ProductToSync[];
  distributor_organization_id?: string | number | null;
  account_manager_id?: string | number | null;
  description?: string | null;
}

/**
 * Update opportunity data shape (for update operations)
 * Partial opportunity with required id
 */
export interface UpdateOpportunityData {
  id: number | string;
  name?: string;
  stage?: OpportunityStageValue;
  priority?: OpportunityPriority;
  products_to_sync?: ProductToSync[];
  contact_ids?: number[];
  [key: string]: unknown;
}

/**
 * Creates a mock opportunity record (database/view shape)
 *
 * Use for: getOne results, previousData in updates, assertion targets
 *
 * @param overrides - Partial opportunity to merge with defaults
 * @returns Complete opportunity matching Opportunity type
 */
export function createMockOpportunity(
  overrides: Partial<Opportunity> = {}
): Opportunity {
  return {
    id: 123,
    name: "Test Opportunity",
    customer_organization_id: "1",
    principal_organization_id: "2",
    estimated_close_date: new Date("2026-02-01"),
    stage: "new_lead",
    priority: "medium",
    contact_ids: [1],
    ...overrides,
  } as Opportunity;
}

/**
 * Creates mock opportunity input data for create operations
 *
 * Use for: handler.create() data parameter
 * Satisfies: createOpportunitySchema requirements (WG-001/002/003)
 *
 * @param overrides - Partial data to merge with defaults
 * @returns Complete create input data
 */
export function createMockOpportunityData(
  overrides: Partial<CreateOpportunityData> = {}
): CreateOpportunityData {
  return {
    name: "Test Opportunity",
    customer_organization_id: "1",
    principal_organization_id: "2",
    estimated_close_date: "2026-02-01",
    stage: "new_lead",
    priority: "medium",
    contact_ids: [1],
    ...overrides,
  };
}

/**
 * Creates mock opportunity update data
 *
 * Use for: handler.update() data parameter
 * Note: Updates can be partial, but id is always required
 *
 * @param overrides - Partial data to merge with defaults
 * @returns Update data with required id
 */
export function createMockUpdateData(
  overrides: Partial<UpdateOpportunityData> = {}
): UpdateOpportunityData {
  return {
    id: 123,
    name: "Updated Opportunity",
    ...overrides,
  };
}

/**
 * Creates a mock product for products_to_sync array (API input shape)
 *
 * Use for: create/update with product sync
 * Shape: Matches createOpportunitySchema.products_to_sync item
 *
 * @param overrides - Partial product to merge with defaults
 * @returns Product item for products_to_sync array
 */
export function createMockProduct(
  overrides: Partial<ProductToSync> = {}
): ProductToSync {
  return {
    product_id_reference: "101",
    ...overrides,
  };
}

/**
 * Creates a mock product from view (previousData shape)
 *
 * Use for: previousData.products array in update operations
 * Shape: Matches JSONB structure from opportunities_summary view
 *
 * @param overrides - Partial product to merge with defaults
 * @returns Product item matching view structure
 */
export function createMockViewProduct(
  overrides: Partial<ViewProductItem> = {}
): ViewProductItem {
  return {
    id: 1,
    product_id_reference: "101",
    product_name: "Product A",
    ...overrides,
  };
}

/**
 * Creates mock data with all computed/view fields for stripping tests
 *
 * Use for: Testing stripComputedFields callback
 * Contains: All TYPED_COMPUTED_FIELDS and VIEW_ONLY_FIELDS
 *
 * @param overrides - Additional fields to include
 * @returns Data with all computed fields populated
 */
export function createMockOpportunityWithComputedFields(
  overrides: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    id: 1,
    name: "Test Opportunity",
    stage: "new_lead",
    // TYPED_COMPUTED_FIELDS (from Opportunity type)
    principal_organization_name: "Acme Corp",
    customer_organization_name: "Customer Inc",
    distributor_organization_name: "Distributor LLC",
    days_in_stage: 5,
    days_since_last_activity: 2,
    pending_task_count: 3,
    overdue_task_count: 1,
    nb_interactions: 10,
    last_interaction_date: "2026-01-01",
    next_task_id: 42,
    next_task_title: "Follow up",
    next_task_due_date: "2026-01-10",
    next_task_priority: "high",
    stage_changed_at: "2026-01-01",
    created_by: "user-123",
    status: "active",
    actual_close_date: null,
    founding_interaction_id: 1,
    stage_manual: false,
    status_manual: false,
    competition: null,
    ...overrides,
  };
}

/**
 * Creates mock data with view-only fields for stripping tests
 *
 * Use for: Testing VIEW_ONLY_FIELDS stripping
 * Contains: Fields from view that don't exist on Opportunity type
 *
 * @param overrides - Additional fields to include
 * @returns Data with view-only fields populated
 */
export function createMockOpportunityWithViewOnlyFields(
  overrides: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    id: 1,
    name: "Test Opportunity",
    // VIEW_ONLY_FIELDS (not on Opportunity type)
    search_tsv: "tsvector_value",
    updated_by: "user-789",
    index: 0,
    total_value: 50000,
    participant_count: 3,
    contact_count: 2,
    product_count: 5,
    last_activity_date: "2026-01-05",
    ...overrides,
  };
}

/**
 * Creates mock data with all editable fields for preservation tests
 *
 * Use for: Testing that editable fields are NOT stripped
 *
 * @returns Data with all editable fields populated
 */
export function createMockEditableOpportunity(): Record<string, unknown> {
  return {
    id: 1,
    name: "Test Opportunity",
    description: "A description",
    stage: "initial_outreach",
    priority: "high",
    estimated_close_date: "2026-03-01",
    customer_organization_id: 10,
    principal_organization_id: 20,
    distributor_organization_id: 30,
    account_manager_id: "mgr-123",
    contact_ids: [1, 2, 3],
    campaign: "Q1 Campaign",
    related_opportunity_id: 99,
    tags: ["enterprise", "priority"],
    next_action: "Schedule demo",
    next_action_date: "2026-01-15",
    decision_criteria: "Budget approval",
    lead_source: "referral",
    notes: "Important notes here",
  };
}
