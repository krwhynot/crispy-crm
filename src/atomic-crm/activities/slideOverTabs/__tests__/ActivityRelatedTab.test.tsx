/**
 * Tests for ActivityRelatedTab component
 *
 * Tests the related entities tab for activities including:
 * - Empty state when no relationships exist
 * - Contact card rendering with name and click navigation
 * - Organization card rendering with name and click navigation
 * - Opportunity card rendering with name, stage badge, and click navigation
 * - Multiple relationships display
 * - isActiveTab optimization (returns null when false)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import * as reactAdmin from "react-admin";
import { mockUseGetOneReturn } from "@/tests/utils/typed-mocks";
import {
  createMockActivity,
  createMockContact,
  createMockOrganization,
  createMockOpportunity,
} from "@/tests/utils/mock-providers";

import { ActivityRelatedTab } from "../ActivityRelatedTab";
import type { ActivityRecord, Contact, Organization, Opportunity } from "../../../types";

// Mock react-admin hooks
vi.mock("react-admin", async () => {
  const actual = await vi.importActual("react-admin");
  return {
    ...actual,
    useGetOne: vi.fn(),
  };
});

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("ActivityRelatedTab", () => {
  // Mock data using typed factory functions
  const mockContactData = createMockContact({
    id: 10,
    first_name: "John",
    last_name: "Doe",
    title: "Sales Manager",
    email: [],
    phone: [],
    first_seen: "2024-01-01",
    last_seen: "2024-01-15",
  }) as Contact;

  const mockOrganizationData = createMockOrganization({
    id: 20,
    name: "Acme Corp",
  }) as Organization & { organization_type: string };
  // Add organization_type for component display
  (mockOrganizationData as Organization & { organization_type: string }).organization_type =
    "distributor";

  const mockOpportunityData = createMockOpportunity({
    id: 30,
    name: "Big Deal",
    customer_organization_id: 1,
    contact_ids: [],
    stage: "demo_scheduled",
    status: "active",
    priority: "high",
  }) as Opportunity;

  const createTestActivity = (overrides: Partial<ActivityRecord> = {}): ActivityRecord =>
    createMockActivity({
      id: 1,
      activity_type: "interaction",
      type: "call",
      subject: "Test Activity",
      activity_date: "2024-01-15",
      created_at: "2024-01-15T10:00:00Z",
      ...overrides,
    }) as ActivityRecord;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Empty State", () => {
    it("shows empty state when no relationships exist", () => {
      const activity = createTestActivity({
        contact_id: null,
        organization_id: null,
        opportunity_id: null,
      });

      renderWithAdminContext(
        <ActivityRelatedTab record={activity} mode="view" isActiveTab={true} />
      );

      expect(screen.getByText("No linked entities")).toBeInTheDocument();
    });

    it("empty state has correct title and description", () => {
      const activity = createTestActivity({
        contact_id: null,
        organization_id: null,
        opportunity_id: null,
      });

      renderWithAdminContext(
        <ActivityRelatedTab record={activity} mode="view" isActiveTab={true} />
      );

      expect(screen.getByText("No linked entities")).toBeInTheDocument();
      expect(
        screen.getByText(
          "This activity is not linked to any contact, organization, or opportunity."
        )
      ).toBeInTheDocument();
    });
  });

  describe("Contact Card Rendering", () => {
    beforeEach(() => {
      vi.mocked(reactAdmin.useGetOne).mockImplementation((resource: string) => {
        if (resource === "contacts") {
          return mockUseGetOneReturn<Contact>({ data: mockContactData, isLoading: false });
        }
        return mockUseGetOneReturn({ data: undefined, isLoading: false });
      });
    });

    it("renders contact card when contact_id is present", async () => {
      const activity = createTestActivity({ contact_id: 10 });

      renderWithAdminContext(
        <ActivityRelatedTab record={activity} mode="view" isActiveTab={true} />
      );

      await waitFor(() => {
        expect(screen.getByText("Contact")).toBeInTheDocument();
      });
    });

    it("shows contact name correctly", async () => {
      const activity = createTestActivity({ contact_id: 10 });

      renderWithAdminContext(
        <ActivityRelatedTab record={activity} mode="view" isActiveTab={true} />
      );

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });
    });

    it("shows contact title as subtitle", async () => {
      const activity = createTestActivity({ contact_id: 10 });

      renderWithAdminContext(
        <ActivityRelatedTab record={activity} mode="view" isActiveTab={true} />
      );

      await waitFor(() => {
        expect(screen.getByText("Sales Manager")).toBeInTheDocument();
      });
    });

    it("contact card is clickable and navigates correctly", async () => {
      const user = userEvent.setup();
      const activity = createTestActivity({ contact_id: 10 });

      renderWithAdminContext(
        <ActivityRelatedTab record={activity} mode="view" isActiveTab={true} />
      );

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      const contactButton = screen.getByRole("button", { name: "John Doe" });
      await user.click(contactButton);

      expect(mockNavigate).toHaveBeenCalledWith("/contacts?view=10");
    });

    it("shows Unknown Contact when contact has no names", async () => {
      const contactWithNoNames = createMockContact({
        ...mockContactData,
        first_name: "",
        last_name: "",
      }) as Contact;
      vi.mocked(reactAdmin.useGetOne).mockImplementation((resource: string) => {
        if (resource === "contacts") {
          return mockUseGetOneReturn<Contact>({
            data: contactWithNoNames,
            isLoading: false,
          });
        }
        return mockUseGetOneReturn({ data: undefined, isLoading: false });
      });

      const activity = createTestActivity({ contact_id: 10 });

      renderWithAdminContext(
        <ActivityRelatedTab record={activity} mode="view" isActiveTab={true} />
      );

      await waitFor(() => {
        expect(screen.getByText("Unknown Contact")).toBeInTheDocument();
      });
    });
  });

  describe("Organization Card Rendering", () => {
    beforeEach(() => {
      vi.mocked(reactAdmin.useGetOne).mockImplementation((resource: string) => {
        if (resource === "organizations") {
          return mockUseGetOneReturn<Organization>({
            data: mockOrganizationData,
            isLoading: false,
          });
        }
        return mockUseGetOneReturn({ data: undefined, isLoading: false });
      });
    });

    it("renders organization card when organization_id is present", async () => {
      const activity = createTestActivity({ organization_id: 20 });

      renderWithAdminContext(
        <ActivityRelatedTab record={activity} mode="view" isActiveTab={true} />
      );

      await waitFor(() => {
        expect(screen.getByText("Organization")).toBeInTheDocument();
      });
    });

    it("shows organization name correctly", async () => {
      const activity = createTestActivity({ organization_id: 20 });

      renderWithAdminContext(
        <ActivityRelatedTab record={activity} mode="view" isActiveTab={true} />
      );

      await waitFor(() => {
        expect(screen.getByText("Acme Corp")).toBeInTheDocument();
      });
    });

    it("shows organization type as subtitle", async () => {
      const activity = createTestActivity({ organization_id: 20 });

      renderWithAdminContext(
        <ActivityRelatedTab record={activity} mode="view" isActiveTab={true} />
      );

      await waitFor(() => {
        expect(screen.getByText("distributor")).toBeInTheDocument();
      });
    });

    it("organization card is clickable and navigates correctly", async () => {
      const user = userEvent.setup();
      const activity = createTestActivity({ organization_id: 20 });

      renderWithAdminContext(
        <ActivityRelatedTab record={activity} mode="view" isActiveTab={true} />
      );

      await waitFor(() => {
        expect(screen.getByText("Acme Corp")).toBeInTheDocument();
      });

      const orgButton = screen.getByRole("button", { name: "Acme Corp" });
      await user.click(orgButton);

      expect(mockNavigate).toHaveBeenCalledWith("/organizations?view=20");
    });
  });

  describe("Opportunity Card Rendering", () => {
    beforeEach(() => {
      vi.mocked(reactAdmin.useGetOne).mockImplementation((resource: string) => {
        if (resource === "opportunities") {
          return mockUseGetOneReturn<Opportunity>({ data: mockOpportunityData, isLoading: false });
        }
        return mockUseGetOneReturn({ data: undefined, isLoading: false });
      });
    });

    it("renders opportunity card when opportunity_id is present", async () => {
      const activity = createTestActivity({ opportunity_id: 30 });

      renderWithAdminContext(
        <ActivityRelatedTab record={activity} mode="view" isActiveTab={true} />
      );

      await waitFor(() => {
        expect(screen.getByText("Opportunity")).toBeInTheDocument();
      });
    });

    it("shows opportunity name correctly", async () => {
      const activity = createTestActivity({ opportunity_id: 30 });

      renderWithAdminContext(
        <ActivityRelatedTab record={activity} mode="view" isActiveTab={true} />
      );

      await waitFor(() => {
        expect(screen.getByText("Big Deal")).toBeInTheDocument();
      });
    });

    it("shows opportunity stage badge", async () => {
      const activity = createTestActivity({ opportunity_id: 30 });

      renderWithAdminContext(
        <ActivityRelatedTab record={activity} mode="view" isActiveTab={true} />
      );

      await waitFor(() => {
        expect(screen.getByText("Demo Scheduled")).toBeInTheDocument();
      });
    });

    it("opportunity card is clickable and navigates correctly", async () => {
      const user = userEvent.setup();
      const activity = createTestActivity({ opportunity_id: 30 });

      renderWithAdminContext(
        <ActivityRelatedTab record={activity} mode="view" isActiveTab={true} />
      );

      await waitFor(() => {
        expect(screen.getByText("Big Deal")).toBeInTheDocument();
      });

      const oppButton = screen.getByRole("button", { name: "Big Deal" });
      await user.click(oppButton);

      expect(mockNavigate).toHaveBeenCalledWith("/opportunities?view=30");
    });
  });

  describe("Multiple Relationships", () => {
    beforeEach(() => {
      vi.mocked(reactAdmin.useGetOne).mockImplementation((resource: string, _params: unknown) => {
        if (resource === "contacts") {
          return { data: mockContact, isLoading: false } as any;
        }
        if (resource === "organizations") {
          return { data: mockOrganization, isLoading: false } as any;
        }
        if (resource === "opportunities") {
          return { data: mockOpportunity, isLoading: false } as any;
        }
        return { data: undefined, isLoading: false } as any;
      });
    });

    it("renders all relationship cards when multiple exist", async () => {
      const activity = createMockActivity({
        contact_id: 10,
        organization_id: 20,
        opportunity_id: 30,
      });

      renderWithAdminContext(
        <ActivityRelatedTab record={activity} mode="view" isActiveTab={true} />
      );

      await waitFor(() => {
        expect(screen.getByText("Contact")).toBeInTheDocument();
        expect(screen.getByText("Organization")).toBeInTheDocument();
        expect(screen.getByText("Opportunity")).toBeInTheDocument();
      });
    });

    it("cards appear in correct order (contact, organization, opportunity)", async () => {
      const activity = createMockActivity({
        contact_id: 10,
        organization_id: 20,
        opportunity_id: 30,
      });

      renderWithAdminContext(
        <ActivityRelatedTab record={activity} mode="view" isActiveTab={true} />
      );

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.getByText("Acme Corp")).toBeInTheDocument();
        expect(screen.getByText("Big Deal")).toBeInTheDocument();
      });

      // Check DOM order by getting all card labels
      const labels = screen.getAllByText(/^(Contact|Organization|Opportunity)$/);
      expect(labels[0]).toHaveTextContent("Contact");
      expect(labels[1]).toHaveTextContent("Organization");
      expect(labels[2]).toHaveTextContent("Opportunity");
    });

    it("renders only present relationships", async () => {
      const activity = createMockActivity({
        contact_id: 10,
        organization_id: undefined,
        opportunity_id: 30,
      });

      renderWithAdminContext(
        <ActivityRelatedTab record={activity} mode="view" isActiveTab={true} />
      );

      await waitFor(() => {
        expect(screen.getByText("Contact")).toBeInTheDocument();
        expect(screen.queryByText("Organization")).not.toBeInTheDocument();
        expect(screen.getByText("Opportunity")).toBeInTheDocument();
      });
    });
  });

  describe("isActiveTab Optimization", () => {
    it("returns null when isActiveTab is false", () => {
      const activity = createMockActivity({
        contact_id: 10,
        organization_id: 20,
        opportunity_id: 30,
      });

      const { container } = renderWithAdminContext(
        <ActivityRelatedTab record={activity} mode="view" isActiveTab={false} />
      );

      // Component should render nothing
      expect(container.firstChild).toBeNull();
    });

    it("renders content when isActiveTab is true", () => {
      vi.mocked(reactAdmin.useGetOne).mockImplementation(() => {
        return { data: mockContact, isLoading: false } as any;
      });

      const activity = createMockActivity({ contact_id: 10 });

      const { container } = renderWithAdminContext(
        <ActivityRelatedTab record={activity} mode="view" isActiveTab={true} />
      );

      expect(container.firstChild).not.toBeNull();
    });
  });

  describe("Loading States", () => {
    it("shows loading skeleton while fetching contact", () => {
      vi.mocked(reactAdmin.useGetOne).mockImplementation((resource: string) => {
        if (resource === "contacts") {
          return { data: undefined, isLoading: true } as any;
        }
        return { data: undefined, isLoading: false } as any;
      });

      const activity = createMockActivity({ contact_id: 10 });

      renderWithAdminContext(
        <ActivityRelatedTab record={activity} mode="view" isActiveTab={true} />
      );

      // Should show skeleton (Card with Skeleton children)
      expect(document.querySelector("[class*='animate-pulse']")).toBeInTheDocument();
    });

    it("does not render card when entity is not found", async () => {
      vi.mocked(reactAdmin.useGetOne).mockImplementation(() => {
        return { data: null, isLoading: false } as any;
      });

      const activity = createMockActivity({ contact_id: 10 });

      renderWithAdminContext(
        <ActivityRelatedTab record={activity} mode="view" isActiveTab={true} />
      );

      // Wait a tick for render
      await waitFor(() => {
        // Should not render a contact card since data is null
        expect(screen.queryByText("Contact")).not.toBeInTheDocument();
      });
    });
  });

  describe("Section Label", () => {
    it("shows Related Entities section label when relationships exist", async () => {
      vi.mocked(reactAdmin.useGetOne).mockImplementation(() => {
        return { data: mockContact, isLoading: false } as any;
      });

      const activity = createMockActivity({ contact_id: 10 });

      renderWithAdminContext(
        <ActivityRelatedTab record={activity} mode="view" isActiveTab={true} />
      );

      await waitFor(() => {
        expect(screen.getByText("Related Entities")).toBeInTheDocument();
      });
    });
  });
});
