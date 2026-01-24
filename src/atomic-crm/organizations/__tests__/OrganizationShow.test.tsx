/**
 * Tests for OrganizationShow component
 *
 * Tests the organization details view including:
 * - Loading states
 * - Tab navigation (Activity, Contacts, Opportunities)
 * - Rendering organization information
 * - Contact and opportunity counts
 * - Error handling
 */

import { describe, test, expect, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { screen, waitFor } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { mockUseShowContextReturn } from "@/tests/utils/typed-mocks";
import { createMockOrganization } from "@/tests/utils/mock-providers";
import OrganizationShow from "../OrganizationShow";

// Mock dependencies
vi.mock("ra-core", async () => {
  const actual = await vi.importActual("ra-core");
  return {
    ...actual,
    useShowContext: vi.fn(),
    useListContext: vi.fn(() => ({
      data: [],
      total: 0,
      isPending: false,
      isLoading: false,
      error: null,
    })),
    useRecordContext: vi.fn(),
  };
});

// Mock ReferenceManyField
vi.mock("@/components/ra-wrappers/reference-many-field", () => ({
  ReferenceManyField: ({ children }: { children: ReactNode }) => (
    <div data-testid="reference-many-field">{children}</div>
  ),
}));

// Mock SortButton
vi.mock("@/components/ra-wrappers/sort-button", () => ({
  SortButton: () => <button data-testid="sort-button">Sort</button>,
}));

// Mock Avatar components
vi.mock("../contacts/Avatar", () => ({
  Avatar: () => <div data-testid="contact-avatar">Avatar</div>,
}));

vi.mock("../OrganizationAvatar", () => ({
  OrganizationAvatar: () => <div data-testid="org-avatar">OrgAvatar</div>,
}));

// Mock OrganizationAside
vi.mock("../OrganizationAside", () => ({
  OrganizationAside: () => <div data-testid="org-aside">Organization Aside</div>,
}));

// Mock ActivityLog
vi.mock("../activity/ActivityLog", () => ({
  ActivityLog: () => <div data-testid="activity-log">Activity Log</div>,
}));

// Mock TagsList
vi.mock("../contacts/TagsList", () => ({
  TagsList: () => <div data-testid="tags-list">Tags</div>,
}));

// Mock Status
vi.mock("../misc/Status", () => ({
  Status: ({ status }: { status: string }) => (
    <span data-testid={`status-${status}`}>{status}</span>
  ),
}));

// Mock ConfigurationContext
vi.mock("../root/ConfigurationContext", () => ({
  useConfigurationContext: vi.fn(() => ({
    opportunityStages: [
      { value: "lead", label: "Lead" },
      { value: "qualified", label: "Qualified" },
      { value: "proposal", label: "Proposal" },
    ],
  })),
}));

// Mock findOpportunityLabel
vi.mock("../opportunities/opportunity", () => ({
  findOpportunityLabel: (stages: Array<{ value: string; label: string }>, value: string) => {
    const stage = stages.find((s) => s.value === value);
    return stage?.label || value;
  },
}));

// Mock formatName utility
vi.mock("../utils/formatName", () => ({
  formatName: (first: string, last: string) => `${first} ${last}`,
}));

// Import mocked functions
import { useShowContext } from "ra-core";

describe("OrganizationShow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders loading state", () => {
    vi.mocked(useShowContext).mockReturnValue(
      mockUseShowContextReturn({
        record: undefined,
        isPending: true,
        error: null,
      })
    );

    renderWithAdminContext(
      <Routes>
        <Route path="/organizations/:id/show" element={<OrganizationShow />} />
      </Routes>,
      {
        resource: "organizations",
        initialEntries: ["/organizations/1/show"],
      }
    );

    // When isPending is true, the component returns null
    expect(screen.queryByRole("main")).not.toBeInTheDocument();
  });

  test("renders with valid organization data", async () => {
    const mockOrg = createMockOrganization({
      id: 1,
      name: "Tech Corp",
      nb_contacts: 5,
      nb_opportunities: 3,
    });

    (useShowContext as any).mockReturnValue({
      record: mockOrg,
      isPending: false,
      error: null,
    });

    renderWithAdminContext(
      <Routes>
        <Route path="/organizations/:id/show" element={<OrganizationShow />} />
      </Routes>,
      {
        resource: "organizations",
        record: mockOrg,
        initialEntries: ["/organizations/1/show"],
      }
    );

    await waitFor(() => {
      // Check main content area
      expect(screen.getByRole("main", { name: /organization details/i })).toBeInTheDocument();

      // Check organization name
      expect(screen.getByText("Tech Corp")).toBeInTheDocument();

      // Check tabs
      expect(screen.getByRole("tab", { name: /activity/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /5 contacts/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /3 opportunities/i })).toBeInTheDocument();

      // Check aside
      expect(screen.getByTestId("org-aside")).toBeInTheDocument();
    });
  });

  test("displays correct contact count labels", async () => {
    const testCases = [
      { nb_contacts: 0, expected: "No Contacts" },
      { nb_contacts: 1, expected: "1 Contact" },
      { nb_contacts: 5, expected: "5 Contacts" },
    ];

    for (const { nb_contacts, expected } of testCases) {
      const mockOrg = createMockOrganization({
        id: 1,
        name: "Test Org",
        nb_contacts,
        nb_opportunities: 0,
      });

      (useShowContext as any).mockReturnValue({
        record: mockOrg,
        isPending: false,
        error: null,
      });

      const { unmount } = renderWithAdminContext(
        <Routes>
          <Route path="/organizations/:id/show" element={<OrganizationShow />} />
        </Routes>,
        {
          resource: "organizations",
          record: mockOrg,
          initialEntries: ["/organizations/1/show"],
        }
      );

      await waitFor(() => {
        expect(screen.getByRole("tab", { name: new RegExp(expected, "i") })).toBeInTheDocument();
      });

      unmount();
      vi.clearAllMocks();
    }
  });

  test("displays correct opportunity count labels", async () => {
    const testCases = [
      { nb_opportunities: 0, expected: "No Opportunities" },
      { nb_opportunities: 1, expected: "1 opportunity" },
      { nb_opportunities: 10, expected: "10 opportunities" },
    ];

    for (const { nb_opportunities, expected } of testCases) {
      const mockOrg = createMockOrganization({
        id: 1,
        name: "Test Org",
        nb_contacts: 0,
        nb_opportunities,
      });

      (useShowContext as any).mockReturnValue({
        record: mockOrg,
        isPending: false,
        error: null,
      });

      const { unmount } = renderWithAdminContext(
        <Routes>
          <Route path="/organizations/:id/show" element={<OrganizationShow />} />
        </Routes>,
        {
          resource: "organizations",
          record: mockOrg,
          initialEntries: ["/organizations/1/show"],
        }
      );

      await waitFor(() => {
        expect(screen.getByRole("tab", { name: new RegExp(expected, "i") })).toBeInTheDocument();
      });

      unmount();
      vi.clearAllMocks();
    }
  });

  test("renders activity tab by default", async () => {
    const mockOrg = createMockOrganization({
      id: 1,
      name: "Activity Test Org",
      nb_contacts: 2,
      nb_opportunities: 1,
    });

    (useShowContext as any).mockReturnValue({
      record: mockOrg,
      isPending: false,
      error: null,
    });

    renderWithAdminContext(
      <Routes>
        <Route path="/organizations/:id/show" element={<OrganizationShow />} />
      </Routes>,
      {
        resource: "organizations",
        record: mockOrg,
        initialEntries: ["/organizations/1/show"],
      }
    );

    await waitFor(() => {
      // Activity tab should be selected by default
      expect(screen.getByTestId("activity-log")).toBeInTheDocument();
    });
  });

  test("renders organization avatar", async () => {
    const mockOrg = createMockOrganization({
      id: 1,
      name: "Avatar Test Org",
    });

    (useShowContext as any).mockReturnValue({
      record: mockOrg,
      isPending: false,
      error: null,
    });

    renderWithAdminContext(
      <Routes>
        <Route path="/organizations/:id/show" element={<OrganizationShow />} />
      </Routes>,
      {
        resource: "organizations",
        record: mockOrg,
        initialEntries: ["/organizations/1/show"],
      }
    );

    await waitFor(() => {
      expect(screen.getByTestId("org-avatar")).toBeInTheDocument();
    });
  });

  test("handles missing record gracefully", () => {
    (useShowContext as any).mockReturnValue({
      record: null,
      isPending: false,
      error: null,
    });

    renderWithAdminContext(
      <Routes>
        <Route path="/organizations/:id/show" element={<OrganizationShow />} />
      </Routes>,
      {
        resource: "organizations",
        initialEntries: ["/organizations/1/show"],
      }
    );

    // When record is null, component returns null
    expect(screen.queryByRole("main")).not.toBeInTheDocument();
  });

  test("renders complementary aside section", async () => {
    const mockOrg = createMockOrganization({
      id: 1,
      name: "Aside Test Org",
    });

    (useShowContext as any).mockReturnValue({
      record: mockOrg,
      isPending: false,
      error: null,
    });

    renderWithAdminContext(
      <Routes>
        <Route path="/organizations/:id/show" element={<OrganizationShow />} />
      </Routes>,
      {
        resource: "organizations",
        record: mockOrg,
        initialEntries: ["/organizations/1/show"],
      }
    );

    await waitFor(() => {
      // Check aside section
      const aside = screen.getByRole("complementary", { name: /organization information/i });
      expect(aside).toBeInTheDocument();
    });
  });

  test("renders tabs with correct structure", async () => {
    const mockOrg = createMockOrganization({
      id: 1,
      name: "Tabs Test Org",
      nb_contacts: 3,
      nb_opportunities: 2,
    });

    (useShowContext as any).mockReturnValue({
      record: mockOrg,
      isPending: false,
      error: null,
    });

    renderWithAdminContext(
      <Routes>
        <Route path="/organizations/:id/show" element={<OrganizationShow />} />
      </Routes>,
      {
        resource: "organizations",
        record: mockOrg,
        initialEntries: ["/organizations/1/show"],
      }
    );

    await waitFor(() => {
      // Check all three tabs are present
      expect(screen.getByRole("tab", { name: /activity/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /3 contacts/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /2 opportunities/i })).toBeInTheDocument();
    });
  });
});
