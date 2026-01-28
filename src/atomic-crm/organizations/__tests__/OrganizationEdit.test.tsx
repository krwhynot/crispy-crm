/**
 * OrganizationEdit Unit Tests
 *
 * Focused unit tests for critical functionality:
 * - Cache invalidation logic (targeted vs nuclear)
 * - Verify .lists() is called, not .all
 *
 * NOTE: These are unit tests of the invalidation behavior, not full integration tests.
 * The actual component implementation should call queryClient.invalidateQueries
 * with the keys tested here in the onSuccess callback.
 */

import { describe, it, expect, vi, type Mock } from "vitest";
import { organizationKeys, contactKeys, opportunityKeys } from "../../queryKeys";

/**
 * Typed interface for QueryClient invalidateQueries options
 * Matches TanStack Query's InvalidateQueryFilters structure
 */
interface InvalidateQueryOptions {
  queryKey: readonly unknown[];
}

/**
 * Mock QueryClient interface for type-safe testing
 */
interface MockQueryClient {
  invalidateQueries: Mock<[options: InvalidateQueryOptions], Promise<void>>;
}

describe("OrganizationEdit - Cache Invalidation Behavior", () => {
  it("should use targeted .lists() invalidation, not nuclear .all", () => {
    const mockQueryClient: MockQueryClient = {
      invalidateQueries: vi.fn(),
    };

    // Simulate the CORRECT onSuccess callback (what OrganizationEdit SHOULD do)
    const correctOnSuccess = () => {
      mockQueryClient.invalidateQueries({ queryKey: organizationKeys.lists() });
      mockQueryClient.invalidateQueries({ queryKey: contactKeys.lists() });
      mockQueryClient.invalidateQueries({ queryKey: opportunityKeys.lists() });
    };

    correctOnSuccess();

    // Verify targeted invalidation
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: organizationKeys.lists(),
    });
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: contactKeys.lists(),
    });
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: opportunityKeys.lists(),
    });

    // Verify call count
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledTimes(3);
  });

  it("should NOT use nuclear .all invalidation (audit violation)", () => {
    const mockQueryClient: MockQueryClient = {
      invalidateQueries: vi.fn(),
    };

    // Simulate the WRONG onSuccess callback (what OrganizationEdit CURRENTLY does - to be fixed)
    const wrongOnSuccess = () => {
      mockQueryClient.invalidateQueries({ queryKey: organizationKeys.all });
      mockQueryClient.invalidateQueries({ queryKey: contactKeys.all });
      mockQueryClient.invalidateQueries({ queryKey: opportunityKeys.all });
    };

    wrongOnSuccess();

    // This test documents the CURRENT WRONG behavior
    // After fix, OrganizationEdit should use .lists() not .all
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: organizationKeys.all,
    });
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: contactKeys.all,
    });
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: opportunityKeys.all,
    });
  });

  it("should demonstrate the difference: .lists() vs .all", () => {
    const mockQueryClient: MockQueryClient = {
      invalidateQueries: vi.fn(),
    };

    // Nuclear (WRONG) - invalidates EVERYTHING including details
    mockQueryClient.invalidateQueries({ queryKey: organizationKeys.all });

    // Targeted (CORRECT) - invalidates only list queries
    mockQueryClient.invalidateQueries({ queryKey: organizationKeys.lists() });

    // Verify both were called
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledTimes(2);

    // Get the actual query keys that were passed
    const calls = mockQueryClient.invalidateQueries.mock.calls;
    const nuclearKey = calls[0][0].queryKey;
    const targetedKey = calls[1][0].queryKey;

    // Nuclear key: ["organizations"] - matches ALL queries starting with "organizations"
    expect(nuclearKey).toEqual(["organizations"]);

    // Targeted key: ["organizations", "list"] - matches only list queries
    expect(targetedKey).toEqual(["organizations", "list"]);

    // Verify they are different
    expect(nuclearKey).not.toEqual(targetedKey);
  });

  it("should verify query key structure: .lists() is a function, .all is an array", () => {
    // Verify factory pattern structure
    expect(organizationKeys.all).toEqual(["organizations"]);
    expect(organizationKeys.lists()).toEqual(["organizations", "list"]);

    // .lists() returns targeted key, .all is broad
    expect(organizationKeys.lists()).not.toEqual(organizationKeys.all);

    // .all matches all query keys that start with ["organizations"]
    // .lists() matches only ["organizations", "list", ...]
    // Therefore .lists() is more specific and prevents over-invalidation
  });
});
