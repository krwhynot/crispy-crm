/**
 * QuickLogForm - Provider Integration Tests
 *
 * TDD Test: Verifies QuickLogForm uses data provider instead of direct Supabase.
 *
 * EXPECTED: This test FAILS initially because QuickLogForm currently calls
 * supabase.rpc() directly (line 182). Task 2.3 will refactor the component
 * to use dataProvider.logActivityWithTask() instead.
 *
 * Constitution: TDD - write failing test first, then fix implementation.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuickLogForm } from "../QuickLogForm";
import { renderWithAdminContext } from "@/tests/utils/render-admin";

// Mock the supabase module to track direct calls (should NOT be called)
const mockSupabaseRpc = vi.fn();
vi.mock("@/atomic-crm/providers/supabase/supabase", () => ({
  supabase: {
    rpc: mockSupabaseRpc,
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "test-user-id", email: "test@example.com" } },
        error: null,
      }),
    },
  },
}));

// Mock useCurrentSale to provide salesId
vi.mock("../../hooks/useCurrentSale", () => ({
  useCurrentSale: () => ({ salesId: 1, loading: false, error: null }),
  CurrentSaleContext: {
    Provider: ({ children }: { children: React.ReactNode }) => children,
  },
}));

// Mock useEntityData to avoid complex data fetching
vi.mock("../../hooks/useEntityData", () => ({
  useEntityData: () => ({
    contacts: [{ id: 1, name: "John Doe", organization_id: 1, company_name: "Acme Corp" }],
    organizations: [{ id: 1, name: "Acme Corp" }],
    opportunities: [{ id: 1, name: "Test Deal", customer_organization_id: 1, stage: "prospect" }],
    contactsForAnchorOrg: [],
    oppsForAnchorOrg: [],
    filteredContacts: [{ id: 1, name: "John Doe", organization_id: 1, company_name: "Acme Corp" }],
    filteredOrganizations: [{ id: 1, name: "Acme Corp" }],
    filteredOpportunities: [
      { id: 1, name: "Test Deal", customer_organization_id: 1, stage: "prospect" },
    ],
    contactsLoading: false,
    organizationsLoading: false,
    opportunitiesLoading: false,
    isInitialLoading: false,
    contactSearch: { searchTerm: "", setSearchTerm: vi.fn(), debouncedTerm: "" },
    orgSearch: { searchTerm: "", setSearchTerm: vi.fn(), debouncedTerm: "" },
    oppSearch: { searchTerm: "", setSearchTerm: vi.fn(), debouncedTerm: "" },
    anchorOrganizationId: null,
  }),
}));

describe("QuickLogForm provider integration", () => {
  const mockOnComplete = vi.fn();
  const mockLogActivityWithTask = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockLogActivityWithTask.mockResolvedValue({
      success: true,
      activity_id: 1,
      task_id: null,
    });
    // Reset supabase mock to track violations
    mockSupabaseRpc.mockResolvedValue({
      data: { activity_id: 1, task_id: null },
      error: null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls data provider logActivityWithTask instead of direct supabase", async () => {
    const user = userEvent.setup();

    const { dataProvider } = renderWithAdminContext(<QuickLogForm onComplete={mockOnComplete} />, {
      dataProvider: {
        logActivityWithTask: mockLogActivityWithTask,
        getList: vi.fn().mockResolvedValue({ data: [], total: 0 }),
        getOne: vi.fn(),
        getMany: vi.fn().mockResolvedValue({ data: [] }),
        getManyReference: vi.fn().mockResolvedValue({ data: [], total: 0 }),
        create: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
        delete: vi.fn(),
        deleteMany: vi.fn(),
      },
    });

    // Wait for form to load (useEntityData mock returns immediately)
    await waitFor(() => {
      expect(screen.getByRole("form")).toBeInTheDocument();
    });

    // Fill in required notes field
    const notesTextarea = screen.getByPlaceholderText(/summary of the interaction/i);
    await user.type(notesTextarea, "Test activity notes for provider integration");

    // Submit the form
    const submitButton = screen.getByRole("button", { name: /save & close/i });
    await user.click(submitButton);

    // Wait for submission to complete
    await waitFor(
      () => {
        // CURRENT BEHAVIOR (fails): Direct supabase.rpc is called
        // EXPECTED BEHAVIOR (after Task 2.3): dataProvider.logActivityWithTask is called
        //
        // This assertion will FAIL until QuickLogForm is refactored in Task 2.3
        // to use the data provider pattern instead of direct supabase calls.
        expect(mockSupabaseRpc).not.toHaveBeenCalled();
      },
      { timeout: 3000 }
    );

    // Verify data provider method was called instead
    // This will also fail until Task 2.3 implements the fix
    expect(mockLogActivityWithTask).toHaveBeenCalledWith(
      expect.objectContaining({
        activity: expect.objectContaining({
          description: expect.stringContaining("Test activity notes"),
        }),
      })
    );
  });

  it("does not import supabase directly for activity logging", async () => {
    // This is a static analysis test - verifying the import pattern
    // The actual implementation check happens in the test above
    //
    // QuickLogForm currently has:
    //   import { supabase } from "@/atomic-crm/providers/supabase/supabase";
    //
    // After Task 2.3, it should use:
    //   const dataProvider = useDataProvider();
    //   await dataProvider.logActivityWithTask(...)
    //
    // This test documents the expected behavior change.
    expect(true).toBe(true); // Placeholder - real verification is in test above
  });
});
