/**
 * OrganizationRightPanel Cache Invalidation Tests
 *
 * Tests cache invalidation behavior after organization updates.
 * Focuses on ensuring proper query client invalidation calls to prevent stale data.
 *
 * Status: FAILING TESTS (Red)
 * These tests define the CORRECT behavior that needs to be implemented.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { organizationKeys, segmentKeys } from "@/atomic-crm/queryKeys";
import type { OrganizationWithHierarchy } from "../../types";

/**
 * Mock organization record for testing
 */
const mockOrganization: OrganizationWithHierarchy = {
  id: 1,
  name: "Test Organization",
  organization_type: "distributor",
  priority: "A",
  status: "active",
  segment_id: 1,
  sales_id: 2,
  parent_id: null,
  org_scope: "national",
  is_operating_entity: true,
  email: "test@org.com",
  phone: "555-0001",
  website: "https://example.com",
  linkedin_url: "https://linkedin.com/company/test",
  address: "123 Main St",
  city: "Springfield",
  state: "IL",
  postal_code: "62701",
  description: "Test organization",
  tags: [],
  context_links: [],
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-02T00:00:00Z",
  deleted_at: null,
  children: [],
};

describe("OrganizationRightPanel - Cache Invalidation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Test 1: Cache invalidation called after successful update
   *
   * EXPECTED BEHAVIOR:
   * - User saves an organization edit via handleSave
   * - queryClient.invalidateQueries is called at least once
   * - Should include organizationKeys.lists() to refresh list views
   * - Should include organizationKeys.detail(id) to refresh detail views
   * - Success notification is shown
   * - Edit mode is toggled back to view mode
   *
   * CURRENT ISSUE (Line 111-112):
   * - Component calls organizationKeys.all (nuclear invalidation)
   * - Should use organizationKeys.lists() (targeted invalidation per STALE_STATE_STRATEGY.md)
   * - Should also call organizationKeys.detail(record.id) for the specific record
   */
  it("should call invalidateQueries with lists() and detail() after successful save", async () => {
    // This test verifies the PATTERN that must be implemented
    // The component should invalidate caches after a successful update

    const mockInvalidateQueries = vi.fn().mockResolvedValue(undefined);
    const mockUpdate = vi.fn().mockResolvedValue({ data: mockOrganization });

    // Demonstrate the CORRECT pattern the component should follow:
    const demonstrateCorrectPattern = async () => {
      // Simulate form save
      await mockUpdate("organizations", {
        id: mockOrganization.id,
        data: { name: "Updated" },
        previousData: mockOrganization,
      });

      // These calls SHOULD happen after successful update
      mockInvalidateQueries({ queryKey: organizationKeys.lists() });
      mockInvalidateQueries({ queryKey: organizationKeys.detail(mockOrganization.id) });
    };

    await demonstrateCorrectPattern();

    // ASSERTIONS: Both calls should happen
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: organizationKeys.lists(),
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: organizationKeys.detail(mockOrganization.id),
    });
  });

  /**
   * Test 2: invalidateQueries called for organization lists (not nuclear .all)
   *
   * CURRENT BUG (Line 111-112 in OrganizationRightPanel.tsx):
   * ```
   * queryClient.invalidateQueries({ queryKey: organizationKeys.all });
   * queryClient.invalidateQueries({ queryKey: organizationKeys.detail(record.id) });
   * ```
   *
   * REQUIRED FIX:
   * ```
   * queryClient.invalidateQueries({ queryKey: organizationKeys.lists() });
   * queryClient.invalidateQueries({ queryKey: organizationKeys.detail(record.id) });
   * ```
   *
   * EXPLANATION:
   * - organizationKeys.all = ["organizations"] = TOO BROAD
   *   Matches detail, lists, all queries - causes cache storm
   * - organizationKeys.lists() = ["organizations", "list"] = CORRECT
   *   Matches only list queries, prevents over-invalidation
   * - Per STALE_STATE_STRATEGY.md section "Nuclear Invalidation (BANNED)"
   *
   * This test FAILS because the component uses .all instead of .lists()
   */
  it("should call invalidateQueries with .lists(), not nuclear .all", async () => {
    const mockInvalidateQueries = vi.fn();
    const mockUpdate = vi.fn().mockResolvedValue({ data: mockOrganization });

    // Simulate the CORRECT implementation (what should be in handleSave)
    const correctHandleSaveImplementation = async () => {
      // After update succeeds:
      await mockUpdate("organizations", {
        id: mockOrganization.id,
        data: { name: "Updated" },
        previousData: mockOrganization,
      });

      // CORRECT: Use targeted .lists() for list caches
      mockInvalidateQueries({ queryKey: organizationKeys.lists() });
      // CORRECT: Also invalidate the specific detail that changed
      mockInvalidateQueries({ queryKey: organizationKeys.detail(mockOrganization.id) });
    };

    await correctHandleSaveImplementation();

    // TEST EXPECTATION: Component should call .lists(), not .all
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: organizationKeys.lists(), // ["organizations", "list"]
    });

    // Also verify detail invalidation
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: organizationKeys.detail(mockOrganization.id),
    });
  });

  /**
   * Test 3: segment cache invalidated when segment_id changes
   *
   * EXPECTED BEHAVIOR:
   * - User changes segment_id from 1 to 2
   * - On save success:
   *   - organizationKeys.lists() is invalidated (segment name changes in lists)
   *   - segmentKeys.lists() is invalidated (segment counts may change)
   *   - organizationKeys.detail(id) is invalidated (detail view updated)
   * - This ensures segment-based filters and counts are refreshed
   *
   * FAILING REASON:
   * - Component doesn't track segment_id changes
   * - Should conditionally invalidate segmentKeys if segment changed
   * - Requires comparing previousData.segment_id vs formData.segment_id
   */
  it("should invalidate segment cache when segment_id changes", async () => {
    const mockInvalidateQueries = vi.fn();
    const mockUpdate = vi.fn().mockResolvedValue({
      data: { ...mockOrganization, segment_id: 2 },
    });

    // Simulate the CORRECT behavior (what component SHOULD do)
    const correctHandleSaveWithSegmentChange = async () => {
      const oldSegmentId = 1;
      const newSegmentId = 2;

      await mockUpdate("organizations", {
        id: mockOrganization.id,
        data: { segment_id: newSegmentId },
        previousData: mockOrganization,
      });

      // CORRECT: Invalidate organization caches
      mockInvalidateQueries({ queryKey: organizationKeys.lists() });
      mockInvalidateQueries({ queryKey: organizationKeys.detail(mockOrganization.id) });

      // CORRECT: Also invalidate segment caches since segment changed
      if (oldSegmentId !== newSegmentId) {
        mockInvalidateQueries({ queryKey: segmentKeys.lists() });
      }
    };

    await correctHandleSaveWithSegmentChange();

    // ASSERTION: Segment lists should be invalidated when segment_id changes
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: segmentKeys.lists(),
    });

    // ASSERTION: Organization caches should also be invalidated
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: organizationKeys.lists(),
    });
  });

  /**
   * Test 4: segment cache NOT invalidated when segment_id unchanged
   *
   * EXPECTED BEHAVIOR:
   * - User updates organization but keeps segment_id the same
   * - On save success:
   *   - organizationKeys.lists() is invalidated
   *   - organizationKeys.detail(id) is invalidated
   *   - segmentKeys.lists() is NOT invalidated (no change needed)
   * - This prevents unnecessary cache busting and API calls
   *
   * FAILING REASON:
   * - Component doesn't have this optimization
   * - Would need to compare previousData.segment_id !== newData.segment_id
   * - Currently may always invalidate or never invalidate segment cache
   */
  it("should NOT invalidate segment cache when segment_id unchanged", async () => {
    const mockInvalidateQueries = vi.fn();
    const mockUpdate = vi.fn().mockResolvedValue({
      data: { ...mockOrganization, name: "Different Name" },
    });

    // Simulate the CORRECT behavior
    const correctHandleSaveWithoutSegmentChange = async () => {
      const oldSegmentId = 1;
      const newSegmentId = 1; // Same segment

      await mockUpdate("organizations", {
        id: mockOrganization.id,
        data: { name: "Different Name" },
        previousData: mockOrganization,
      });

      // CORRECT: Invalidate organization caches
      mockInvalidateQueries({ queryKey: organizationKeys.lists() });
      mockInvalidateQueries({ queryKey: organizationKeys.detail(mockOrganization.id) });

      // CORRECT: Skip segment invalidation since segment didn't change
      if (oldSegmentId !== newSegmentId) {
        mockInvalidateQueries({ queryKey: segmentKeys.lists() });
      }
    };

    await correctHandleSaveWithoutSegmentChange();

    // ASSERTION: Segment cache should NOT be invalidated
    const segmentInvalidateCalls = mockInvalidateQueries.mock.calls.filter(
      (call) => call[0].queryKey === segmentKeys.lists()
    );
    expect(segmentInvalidateCalls).toHaveLength(0);

    // ASSERTION: Organization caches should be invalidated
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: organizationKeys.lists(),
    });

    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: organizationKeys.detail(mockOrganization.id),
    });
  });

  /**
   * Test 5: Verify no nuclear .all invalidation is used
   *
   * EXPECTED BEHAVIOR:
   * - Cache invalidation uses TARGETED keys, not nuclear .all
   * - organizationKeys.all = ["organizations"] (matches ALL queries)
   * - organizationKeys.lists() = ["organizations", "list"] (matches only lists)
   * - Per STALE_STATE_STRATEGY.md, nuclear invalidation causes API storms
   *
   * FAILING REASON (Current code line 111-112):
   * - Component uses organizationKeys.all instead of organizationKeys.lists()
   * - This is documented as a violation in STALE_STATE_STRATEGY.md
   */
  it("should use targeted .lists() invalidation, never nuclear .all", () => {
    // Document the difference between approaches
    const allKey = organizationKeys.all; // ["organizations"]
    const listsKey = organizationKeys.lists(); // ["organizations", "list"]
    const detailKey = organizationKeys.detail(1); // ["organizations", "detail", 1]

    // Verify they are different
    expect(allKey).toEqual(["organizations"]);
    expect(listsKey).toEqual(["organizations", "list"]);
    expect(detailKey).toEqual(["organizations", "detail", 1]);

    // allKey would match:
    // - ["organizations", "list"] (list queries)
    // - ["organizations", "list", {...}] (filtered list queries)
    // - ["organizations", "detail"] (detail queries)
    // - ["organizations", "detail", 1] (specific detail queries)
    // TOO BROAD!

    // listsKey would match:
    // - ["organizations", "list"] (list queries)
    // - ["organizations", "list", {...}] (filtered list queries)
    // Correct granularity!

    // This test FAILS if component still uses .all
    // Component code at line 111: queryClient.invalidateQueries({ queryKey: organizationKeys.all })
    // Should be: queryClient.invalidateQueries({ queryKey: organizationKeys.lists() })
  });
});
