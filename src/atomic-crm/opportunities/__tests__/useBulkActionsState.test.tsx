import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useBulkActionsState } from "../useBulkActionsState";
import type { Opportunity } from "@/atomic-crm/types";
import { createMockOpportunity } from "@/tests/utils/mock-providers";
import { createMockDataProvider } from "@/tests/utils/typed-mocks";

// Mock React Admin hooks
vi.mock("ra-core", () => ({
  useDataProvider: vi.fn(),
  useNotify: vi.fn(),
  useRefresh: vi.fn(),
}));

// Mock tanstack-query's useQueryClient
vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  return {
    ...actual,
    useQueryClient: vi.fn(),
  };
});

// Import mocked modules
import { useDataProvider, useNotify, useRefresh } from "ra-core";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Typed mock data provider for bulk actions tests
 * Only includes methods used by useBulkActionsState hook
 */
interface MockBulkActionsDataProvider extends Pick<DataProvider, "update" | "deleteMany"> {
  update: ReturnType<typeof vi.fn>;
  deleteMany: ReturnType<typeof vi.fn>;
}

describe("useBulkActionsState - Parallel Execution", () => {
  let mockDataProvider: MockBulkActionsDataProvider;
  let mockNotify: ReturnType<typeof vi.fn>;
  let mockRefresh: ReturnType<typeof vi.fn>;
  let queryClient: QueryClient;
  let mockOnUnselectItems: ReturnType<typeof vi.fn>;

  const mockOpportunities: Opportunity[] = [
    createMockOpportunity({ id: 1, name: "Opp 1", stage: "new_lead" }) as Opportunity,
    createMockOpportunity({ id: 2, name: "Opp 2", stage: "new_lead" }) as Opportunity,
    createMockOpportunity({ id: 3, name: "Opp 3", stage: "new_lead" }) as Opportunity,
    createMockOpportunity({ id: 4, name: "Opp 4", stage: "new_lead" }) as Opportunity,
    createMockOpportunity({ id: 5, name: "Opp 5", stage: "new_lead" }) as Opportunity,
  ];

  beforeEach(() => {
    vi.resetAllMocks();

    // Setup mocks
    mockNotify = vi.fn();
    mockRefresh = vi.fn();
    mockOnUnselectItems = vi.fn();
    mockDataProvider = {
      update: vi.fn(),
      deleteMany: vi.fn(),
    };

    vi.mocked(useDataProvider).mockReturnValue(mockDataProvider as unknown as DataProvider);
    vi.mocked(useNotify).mockReturnValue(mockNotify);
    vi.mocked(useRefresh).mockReturnValue(mockRefresh);

    // Create fresh query client for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    vi.mocked(useQueryClient).mockReturnValue(queryClient);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // Wrapper component for providing QueryClient context
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  test("should execute bulk updates in parallel, not sequentially", async () => {
    // Mock dataProvider.update to take 100ms each
    const updateDelay = 100;
    mockDataProvider.update.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve({ data: {} }), updateDelay);
        })
    );

    const { result } = renderHook(
      () =>
        useBulkActionsState({
          selectedIds: [1, 2, 3, 4, 5],
          opportunities: mockOpportunities,
          onUnselectItems: mockOnUnselectItems,
          resource: "opportunities",
        }),
      { wrapper }
    );

    // Open dialog and select stage
    act(() => {
      result.current.handleOpenDialog("change_stage");
      result.current.setSelectedStage("initial_outreach");
    });

    // Record start time
    const startTime = Date.now();

    // Execute bulk action
    await act(async () => {
      await result.current.handleExecuteBulkAction();
    });

    // Record end time
    const endTime = Date.now();
    const duration = endTime - startTime;

    // If sequential: ~500ms (5 updates × 100ms each)
    // If parallel: ~100ms (all 5 updates run concurrently)
    // Assert duration is closer to parallel execution (< 250ms threshold)
    expect(duration).toBeLessThan(250);

    // Verify all 5 updates were called
    expect(mockDataProvider.update).toHaveBeenCalledTimes(5);

    // Verify success notification
    expect(mockNotify).toHaveBeenCalledWith("Successfully updated 5 opportunities", {
      type: "success",
    });
  });

  test("should fail fast if any update fails - report error but continue processing others", async () => {
    // Mock: first update succeeds, second fails, third succeeds
    mockDataProvider.update
      .mockResolvedValueOnce({ data: {} }) // id 1 succeeds
      .mockRejectedValueOnce(new Error("Database constraint violation")) // id 2 fails
      .mockResolvedValueOnce({ data: {} }); // id 3 succeeds

    const { result } = renderHook(
      () =>
        useBulkActionsState({
          selectedIds: [1, 2, 3],
          opportunities: mockOpportunities.slice(0, 3),
          onUnselectItems: mockOnUnselectItems,
          resource: "opportunities",
        }),
      { wrapper }
    );

    // Open dialog and select stage
    act(() => {
      result.current.handleOpenDialog("change_stage");
      result.current.setSelectedStage("initial_outreach");
    });

    // Execute bulk action
    await act(async () => {
      await result.current.handleExecuteBulkAction();
    });

    // Verify all 3 updates were attempted
    expect(mockDataProvider.update).toHaveBeenCalledTimes(3);

    // Verify both success and failure notifications
    expect(mockNotify).toHaveBeenCalledWith("Successfully updated 2 opportunities", {
      type: "success",
    });
    expect(mockNotify).toHaveBeenCalledWith("Failed to update 1 opportunity", {
      type: "error",
    });
  });

  test("should handle complete failure - all updates fail", async () => {
    // Mock all updates to fail
    mockDataProvider.update.mockRejectedValue(new Error("Network timeout"));

    const { result } = renderHook(
      () =>
        useBulkActionsState({
          selectedIds: [1, 2, 3],
          opportunities: mockOpportunities.slice(0, 3),
          onUnselectItems: mockOnUnselectItems,
          resource: "opportunities",
        }),
      { wrapper }
    );

    // Open dialog and select stage
    act(() => {
      result.current.handleOpenDialog("change_stage");
      result.current.setSelectedStage("initial_outreach");
    });

    // Execute bulk action
    await act(async () => {
      await result.current.handleExecuteBulkAction();
    });

    // Verify all 3 updates were attempted
    expect(mockDataProvider.update).toHaveBeenCalledTimes(3);

    // Verify only failure notification (no success)
    expect(mockNotify).toHaveBeenCalledWith("Failed to update 3 opportunities", {
      type: "error",
    });

    // Should NOT show success notification
    expect(mockNotify).not.toHaveBeenCalledWith(
      expect.stringContaining("Successfully updated"),
      expect.any(Object)
    );
  });

  test("should pass correct update data for each bulk action type", async () => {
    mockDataProvider.update.mockResolvedValue({ data: {} });

    // Test change_stage
    const { result: stageResult } = renderHook(
      () =>
        useBulkActionsState({
          selectedIds: [1],
          opportunities: mockOpportunities.slice(0, 1),
          onUnselectItems: mockOnUnselectItems,
        }),
      { wrapper }
    );

    act(() => {
      stageResult.current.handleOpenDialog("change_stage");
      stageResult.current.setSelectedStage("demo_scheduled");
    });

    await act(async () => {
      await stageResult.current.handleExecuteBulkAction();
    });

    expect(mockDataProvider.update).toHaveBeenCalledWith("opportunities", {
      id: 1,
      data: { stage: "demo_scheduled", stage_manual: true },
      previousData: mockOpportunities[0],
    });

    vi.resetAllMocks();
    vi.mocked(useDataProvider).mockReturnValue(mockDataProvider as unknown as DataProvider);
    vi.mocked(useNotify).mockReturnValue(mockNotify);
    vi.mocked(useRefresh).mockReturnValue(mockRefresh);
    vi.mocked(useQueryClient).mockReturnValue(queryClient);
    mockDataProvider.update.mockResolvedValue({ data: {} });

    // Test change_status
    const { result: statusResult } = renderHook(
      () =>
        useBulkActionsState({
          selectedIds: [2],
          opportunities: mockOpportunities.slice(1, 2),
          onUnselectItems: mockOnUnselectItems,
        }),
      { wrapper }
    );

    act(() => {
      statusResult.current.handleOpenDialog("change_status");
      statusResult.current.setSelectedStatus("active");
    });

    await act(async () => {
      await statusResult.current.handleExecuteBulkAction();
    });

    expect(mockDataProvider.update).toHaveBeenCalledWith("opportunities", {
      id: 2,
      data: { status: "active", stage_manual: true },
      previousData: mockOpportunities[1],
    });

    vi.resetAllMocks();
    vi.mocked(useDataProvider).mockReturnValue(mockDataProvider as unknown as DataProvider);
    vi.mocked(useNotify).mockReturnValue(mockNotify);
    vi.mocked(useRefresh).mockReturnValue(mockRefresh);
    vi.mocked(useQueryClient).mockReturnValue(queryClient);
    mockDataProvider.update.mockResolvedValue({ data: {} });

    // Test assign_owner
    const { result: ownerResult } = renderHook(
      () =>
        useBulkActionsState({
          selectedIds: [3],
          opportunities: mockOpportunities.slice(2, 3),
          onUnselectItems: mockOnUnselectItems,
        }),
      { wrapper }
    );

    act(() => {
      ownerResult.current.handleOpenDialog("assign_owner");
      ownerResult.current.setSelectedOwner("42");
    });

    await act(async () => {
      await ownerResult.current.handleExecuteBulkAction();
    });

    expect(mockDataProvider.update).toHaveBeenCalledWith("opportunities", {
      id: 3,
      data: { opportunity_owner_id: 42 },
      previousData: mockOpportunities[2],
    });
  });
});
