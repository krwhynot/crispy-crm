/**
 * Unit Tests for UpdateOpportunityStep
 *
 * Feature: Dashboard Quick Actions
 * Design: docs/plans/2025-11-10-dashboard-quick-actions-design.md
 *
 * Tests cover:
 * 1. Opportunity data loading
 * 2. Current stage display
 * 3. Stage selection and validation
 * 4. Update and Skip functionality
 * 5. Error handling
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UpdateOpportunityStep } from "../UpdateOpportunityStep";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { createMockDataProvider } from "@/tests/utils/mock-providers";

// Mock the data provider
const mockDataProvider = createMockDataProvider();

// Mock spies for tracking calls
const getOneSpy = vi.spyOn(mockDataProvider, "getOne");

// Test utility: Wrap component in required providers with QueryClient
const renderWithProviders = (ui: React.ReactElement) => {
  return renderWithAdminContext(ui, {
    dataProvider: mockDataProvider,
  });
};

// Mock opportunity data - use valid stage values from stageConstants.ts
const mockOpportunity = {
  id: 2,
  name: "Restaurant ABC - $5,000",
  stage: "new_lead",
  principal_organization_id: 100,
  customer_organization_id: 200,
};

describe("UpdateOpportunityStep", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getOneSpy.mockClear();
  });

  describe("Data Loading", () => {
    it("shows loading state while fetching opportunity", () => {
      getOneSpy.mockReturnValue(new Promise(() => {})); // Never resolves

      const onUpdate = vi.fn();
      const onSkip = vi.fn();

      renderWithProviders(
        <UpdateOpportunityStep opportunityId={2} onUpdate={onUpdate} onSkip={onSkip} />
      );

      expect(screen.getByText(/Loading opportunity.../i)).toBeInTheDocument();
    });

    it("displays opportunity information when loaded", async () => {
      getOneSpy.mockResolvedValueOnce({
        data: mockOpportunity,
      });

      const onUpdate = vi.fn();
      const onSkip = vi.fn();

      renderWithProviders(
        <UpdateOpportunityStep opportunityId={2} onUpdate={onUpdate} onSkip={onSkip} />
      );

      await waitFor(() => {
        expect(screen.getByText(/Restaurant ABC - \$5,000/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/Current Stage:/i)).toBeInTheDocument();
      expect(screen.getByText(/New Lead/i)).toBeInTheDocument();
    });

    it("shows error state when fetch fails", async () => {
      // Suppress console.error for this test since we're intentionally testing error state
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      // Create a custom data provider that rejects getOne
      const errorDataProvider = createMockDataProvider({
        getOne: async () => {
          throw new Error("Network error");
        },
      });

      const onUpdate = vi.fn();
      const onSkip = vi.fn();

      renderWithAdminContext(
        <UpdateOpportunityStep opportunityId={2} onUpdate={onUpdate} onSkip={onSkip} />,
        { dataProvider: errorDataProvider }
      );

      // Wait for error message to appear (React Admin's useGetOne handles the state transition)
      await waitFor(
        () => {
          expect(screen.getByText(/Unable to load opportunity details/i)).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // Should show "Continue Anyway" button
      expect(screen.getByRole("button", { name: /Continue Anyway/i })).toBeInTheDocument();

      consoleErrorSpy.mockRestore();
    });

    it('calls onSkip when "Continue Anyway" is clicked in error state', async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      // Create a custom data provider that rejects getOne
      const errorDataProvider = createMockDataProvider({
        getOne: async () => {
          throw new Error("Network error");
        },
      });

      const onUpdate = vi.fn();
      const onSkip = vi.fn();

      renderWithAdminContext(
        <UpdateOpportunityStep opportunityId={2} onUpdate={onUpdate} onSkip={onSkip} />,
        { dataProvider: errorDataProvider }
      );

      // Wait for error button to appear
      const continueButton = await screen.findByRole(
        "button",
        { name: /Continue Anyway/i },
        { timeout: 3000 }
      );

      await user.click(continueButton);

      expect(onSkip).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe("Stage Selection", () => {
    it("shows stage selector dropdown", async () => {
      getOneSpy.mockResolvedValueOnce({
        data: mockOpportunity,
      });

      const onUpdate = vi.fn();
      const onSkip = vi.fn();

      renderWithProviders(
        <UpdateOpportunityStep opportunityId={2} onUpdate={onUpdate} onSkip={onSkip} />
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/Move to Stage \(optional\)/i)).toBeInTheDocument();
      });
    });

    it("disables current stage in dropdown", async () => {
      const user = userEvent.setup();
      getOneSpy.mockResolvedValueOnce({
        data: { ...mockOpportunity, stage: "new_lead" },
      });

      const onUpdate = vi.fn();
      const onSkip = vi.fn();

      renderWithProviders(
        <UpdateOpportunityStep opportunityId={2} onUpdate={onUpdate} onSkip={onSkip} />
      );

      // Wait for initial data to load
      const stageSelect = await screen.findByLabelText(/Move to Stage \(optional\)/i);

      // Open dropdown
      await user.click(stageSelect);

      // Current stage should show "(current)" indicator
      // Radix portals take a moment to render
      const currentIndicator = await screen.findByText(/\(current\)/i, {}, { timeout: 3000 });
      expect(currentIndicator).toBeInTheDocument();
    });

    it("excludes closed stages from selection", async () => {
      const user = userEvent.setup();
      getOneSpy.mockResolvedValueOnce({
        data: mockOpportunity,
      });

      const onUpdate = vi.fn();
      const onSkip = vi.fn();

      renderWithProviders(
        <UpdateOpportunityStep opportunityId={2} onUpdate={onUpdate} onSkip={onSkip} />
      );

      // Wait for initial data to load
      const stageSelect = await screen.findByLabelText(/Move to Stage \(optional\)/i);

      // Open dropdown
      await user.click(stageSelect);

      // "Closed Won" and "Closed Lost" should not be in the list
      await waitFor(() => {
        expect(screen.queryByRole("option", { name: /Closed Won/i })).not.toBeInTheDocument();
        expect(screen.queryByRole("option", { name: /Closed Lost/i })).not.toBeInTheDocument();
      });
    });

    it("shows stage transition indicator when stage is selected", async () => {
      const user = userEvent.setup();
      getOneSpy.mockResolvedValueOnce({
        data: { ...mockOpportunity, stage: "new_lead" },
      });

      const onUpdate = vi.fn();
      const onSkip = vi.fn();

      renderWithProviders(
        <UpdateOpportunityStep opportunityId={2} onUpdate={onUpdate} onSkip={onSkip} />
      );

      // Wait for initial data to load
      const stageSelect = await screen.findByLabelText(/Move to Stage \(optional\)/i);

      // Open the dropdown
      await user.click(stageSelect);

      // Find the "Initial Outreach" option (a valid next stage from new_lead)
      // findByRole will wait for it to appear
      const outreachOption = await screen.findByRole("option", { name: /Initial Outreach/i });
      await user.click(outreachOption);

      // Now, assert that the indicator text appears showing the transition
      await waitFor(() => {
        expect(screen.getByText(/Will move from New Lead/i)).toBeInTheDocument();
      });
    });
  });

  describe("Update Functionality", () => {
    it("calls onSkip when no stage is selected and button clicked", async () => {
      const user = userEvent.setup();
      getOneSpy.mockResolvedValueOnce({
        data: mockOpportunity,
      });

      const onUpdate = vi.fn();
      const onSkip = vi.fn();

      renderWithProviders(
        <UpdateOpportunityStep opportunityId={2} onUpdate={onUpdate} onSkip={onSkip} />
      );

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Keep Stage & Close/i })).toBeInTheDocument();
      });

      // Click "Keep Stage & Close" (no stage selected) - should call onSkip
      await user.click(screen.getByRole("button", { name: /Keep Stage & Close/i }));

      expect(onSkip).toHaveBeenCalled();
      expect(onUpdate).not.toHaveBeenCalled();
    });

    it("calls onUpdate with selected stage", async () => {
      const user = userEvent.setup();
      getOneSpy.mockResolvedValueOnce({
        data: { ...mockOpportunity, stage: "new_lead" },
      });

      const onUpdate = vi.fn();
      const onSkip = vi.fn();

      renderWithProviders(
        <UpdateOpportunityStep opportunityId={2} onUpdate={onUpdate} onSkip={onSkip} />
      );

      // Wait for initial data to load
      const stageSelect = await screen.findByLabelText(/Move to Stage \(optional\)/i);

      // Open dropdown and select Initial Outreach stage
      await user.click(stageSelect);

      const outreachOption = await screen.findByRole("option", { name: /Initial Outreach/i });
      await user.click(outreachOption);

      // Click Update & Close
      const updateButton = await screen.findByRole("button", { name: /Update & Close/i });
      await user.click(updateButton);

      expect(onUpdate).toHaveBeenCalledWith("initial_outreach");
    });

    it("disables buttons while submitting", async () => {
      const user = userEvent.setup();
      getOneSpy.mockResolvedValueOnce({
        data: { ...mockOpportunity, stage: "new_lead" },
      });

      // onUpdate that never resolves (simulating pending API call)
      const onUpdate = vi.fn(() => new Promise(() => {}));
      const onSkip = vi.fn();

      renderWithProviders(
        <UpdateOpportunityStep opportunityId={2} onUpdate={onUpdate} onSkip={onSkip} />
      );

      // Wait for initial data to load
      const stageSelect = await screen.findByLabelText(/Move to Stage \(optional\)/i);

      // Select a stage to trigger update flow (not skip flow)
      await user.click(stageSelect);
      const outreachOption = await screen.findByRole("option", { name: /Initial Outreach/i });
      await user.click(outreachOption);

      // Now click the Update button (text should be "Update & Close")
      const updateButton = await screen.findByRole("button", { name: /Update & Close/i });
      await user.click(updateButton);

      // After the click, wait for the UI to reflect the "submitting" state
      await waitFor(() => {
        const submittingButton = screen.getByRole("button", { name: /Updating.../i });
        expect(submittingButton).toBeDisabled();
        expect(screen.getByRole("button", { name: /Skip/i })).toBeDisabled();
      });
    });
  });

  describe("Skip Functionality", () => {
    it("calls onSkip when Skip button is clicked", async () => {
      const user = userEvent.setup();
      getOneSpy.mockResolvedValueOnce({
        data: mockOpportunity,
      });

      const onUpdate = vi.fn();
      const onSkip = vi.fn();

      renderWithProviders(
        <UpdateOpportunityStep opportunityId={2} onUpdate={onUpdate} onSkip={onSkip} />
      );

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Skip/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /Skip/i }));

      expect(onSkip).toHaveBeenCalled();
    });
  });

  describe("Help Text", () => {
    it("shows hint that step is optional", async () => {
      getOneSpy.mockResolvedValueOnce({
        data: mockOpportunity,
      });

      const onUpdate = vi.fn();
      const onSkip = vi.fn();

      renderWithProviders(
        <UpdateOpportunityStep opportunityId={2} onUpdate={onUpdate} onSkip={onSkip} />
      );

      await waitFor(() => {
        expect(screen.getByText(/This step is optional/i)).toBeInTheDocument();
      });
    });

    it("shows hint to leave blank when no stage is selected", async () => {
      getOneSpy.mockResolvedValueOnce({
        data: mockOpportunity,
      });

      const onUpdate = vi.fn();
      const onSkip = vi.fn();

      renderWithProviders(
        <UpdateOpportunityStep opportunityId={2} onUpdate={onUpdate} onSkip={onSkip} />
      );

      await waitFor(() => {
        expect(screen.getByText(/Leave blank to keep current stage/i)).toBeInTheDocument();
      });
    });
  });
});
