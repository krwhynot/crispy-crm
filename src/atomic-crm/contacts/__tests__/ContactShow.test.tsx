/**
 * Tests for ContactShow component
 *
 * Tests the contact details view including:
 * - Loading states
 * - Rendering contact information
 * - Single organization relationship (per PRD - one contact = one org)
 * - Error handling (404, permission denied)
 */

import { describe, test, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { Routes, Route } from "react-router-dom";
import type { ReactNode } from "react";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { createMockContact } from "@/tests/utils/mock-providers";
import { mockUseShowContextReturn } from "@/tests/utils/typed-mocks";
import ContactShow from "../ContactShow";

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
    useGetList: vi.fn(() => ({
      data: [],
      total: 0,
      isPending: false,
      isLoading: false,
    })),
  };
});

// Mock ReferenceField to simplify testing
vi.mock("@/components/ra-wrappers/reference-field", () => ({
  ReferenceField: ({ children }: { children: ReactNode }) => (
    <div data-testid="reference-field">{children}</div>
  ),
}));

// Mock ReferenceManyField (for notes)
vi.mock("@/components/ra-wrappers/reference-many-field", () => ({
  ReferenceManyField: ({ children }: { children: ReactNode }) => (
    <div data-testid="reference-many-field">{children}</div>
  ),
}));

// Mock TextField
vi.mock("@/components/ra-wrappers/text-field", () => ({
  TextField: ({ source }: { source: string }) => (
    <span data-testid={`text-field-${source}`}>{source}</span>
  ),
}));

// Mock Avatar components
vi.mock("../Avatar", () => ({
  Avatar: () => <div data-testid="contact-avatar">Avatar</div>,
}));

vi.mock("../../organizations/OrganizationAvatar", () => ({
  OrganizationAvatar: () => <div data-testid="org-avatar">OrgAvatar</div>,
}));

// Mock ContactAside
vi.mock("../ContactAside", () => ({
  ContactAside: () => <div data-testid="contact-aside">Contact Aside</div>,
}));

// Mock Notes components
vi.mock("../notes", () => ({
  NoteCreate: () => <div data-testid="note-create">Create Note</div>,
  NotesIterator: () => <div data-testid="notes-iterator">Notes List</div>,
}));

// Mock ActivitiesTab
vi.mock("../ActivitiesTab", () => ({
  ActivitiesTab: () => <div data-testid="activities-tab">Activities</div>,
}));

// Mock OpportunitiesTab
vi.mock("../OpportunitiesTab", () => ({
  OpportunitiesTab: () => <div data-testid="opportunities-tab">Opportunities</div>,
}));

// Import mocked functions
import { useShowContext } from "ra-core";

describe("ContactShow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders loading state", () => {
    vi.mocked(useShowContext).mockReturnValue(mockUseShowContextReturn({ isPending: true }));

    renderWithAdminContext(
      <Routes>
        <Route path="/contacts/:id/show" element={<ContactShow />} />
      </Routes>,
      {
        resource: "contacts",
        initialEntries: ["/contacts/1/show"],
      }
    );

    // When isPending is true, the component returns null
    expect(screen.queryByRole("main")).not.toBeInTheDocument();
  });

  test("renders with valid contact data", async () => {
    const mockContact = createMockContact({
      id: 1,
      first_name: "John",
      last_name: "Doe",
      title: "Senior Engineer",
      department: "Engineering",
      email: [{ value: "john@example.com", type: "work" }],
      phone: [{ value: "555-0100", type: "work" }],
      organization_id: 1,
    });

    vi.mocked(useShowContext).mockReturnValue(mockUseShowContextReturn({ record: mockContact }));

    renderWithAdminContext(
      <Routes>
        <Route path="/contacts/:id/show" element={<ContactShow />} />
      </Routes>,
      {
        resource: "contacts",
        record: mockContact,
        initialEntries: ["/contacts/1/show"],
      }
    );

    await waitFor(() => {
      // Check main content area
      expect(screen.getByRole("main", { name: /contact details/i })).toBeInTheDocument();

      // Check contact name
      expect(screen.getByText("John Doe")).toBeInTheDocument();

      // Check title and department
      expect(screen.getByText(/Senior Engineer/)).toBeInTheDocument();
      expect(screen.getByText(/Engineering/)).toBeInTheDocument();

      // Check avatar rendered
      expect(screen.getByTestId("contact-avatar")).toBeInTheDocument();

      // Check aside rendered
      expect(screen.getByTestId("contact-aside")).toBeInTheDocument();
    });
  });

  test("renders contact with organization", async () => {
    const mockContact = createMockContact({
      id: 2,
      first_name: "Jane",
      last_name: "Smith",
      title: "Product Manager",
      organization_id: 10,
    });

    vi.mocked(useShowContext).mockReturnValue(mockUseShowContextReturn({ record: mockContact }));

    renderWithAdminContext(
      <Routes>
        <Route path="/contacts/:id/show" element={<ContactShow />} />
      </Routes>,
      {
        resource: "contacts",
        record: mockContact,
        initialEntries: ["/contacts/1/show"],
      }
    );

    await waitFor(() => {
      // Should show organization section (singular, not plural)
      expect(screen.getByText("Organization")).toBeInTheDocument();

      // Should show organization avatar in header
      expect(screen.getByTestId("org-avatar")).toBeInTheDocument();
    });
  });

  test("renders contact without organization", async () => {
    const mockContact = createMockContact({
      id: 4,
      first_name: "Alice",
      last_name: "Johnson",
      title: "Freelancer",
      organization_id: null,
    });

    vi.mocked(useShowContext).mockReturnValue(mockUseShowContextReturn({ record: mockContact }));

    renderWithAdminContext(
      <Routes>
        <Route path="/contacts/:id/show" element={<ContactShow />} />
      </Routes>,
      {
        resource: "contacts",
        record: mockContact,
        initialEntries: ["/contacts/1/show"],
      }
    );

    await waitFor(() => {
      // Should render name and title
      expect(screen.getByText("Alice Johnson")).toBeInTheDocument();
      expect(screen.getByText(/Freelancer/)).toBeInTheDocument();

      // Should not show organization section when no org assigned
      expect(screen.queryByText("Organization")).not.toBeInTheDocument();
    });
  });

  test("renders notes section", async () => {
    const mockContact = createMockContact({
      id: 5,
      first_name: "Charlie",
      last_name: "Brown",
    });

    vi.mocked(useShowContext).mockReturnValue(mockUseShowContextReturn({ record: mockContact }));

    renderWithAdminContext(
      <Routes>
        <Route path="/contacts/:id/show" element={<ContactShow />} />
      </Routes>,
      {
        resource: "contacts",
        record: mockContact,
        initialEntries: ["/contacts/1/show"],
      }
    );

    await waitFor(() => {
      // Notes section is now in a tab - check for tabs structure
      expect(screen.getByRole("tab", { name: /notes/i })).toBeInTheDocument();
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
        <Route path="/contacts/:id/show" element={<ContactShow />} />
      </Routes>,
      {
        resource: "contacts",
        initialEntries: ["/contacts/1/show"],
      }
    );

    // When record is null, component returns null
    expect(screen.queryByRole("main")).not.toBeInTheDocument();
  });

  test("renders complementary aside section", async () => {
    const mockContact = createMockContact({
      id: 6,
      first_name: "David",
      last_name: "Miller",
    });

    (useShowContext as any).mockReturnValue({
      record: mockContact,
      isPending: false,
      error: null,
    });

    renderWithAdminContext(
      <Routes>
        <Route path="/contacts/:id/show" element={<ContactShow />} />
      </Routes>,
      {
        resource: "contacts",
        record: mockContact,
        initialEntries: ["/contacts/1/show"],
      }
    );

    await waitFor(() => {
      // Check aside section
      const aside = screen.getByRole("complementary", { name: /contact information/i });
      expect(aside).toBeInTheDocument();
    });
  });

  test("renders Opportunities tab", async () => {
    const mockContact = createMockContact({
      id: 7,
      first_name: "Test",
      last_name: "User",
    });

    (useShowContext as any).mockReturnValue({
      record: mockContact,
      isPending: false,
      error: null,
    });

    renderWithAdminContext(
      <Routes>
        <Route path="/contacts/:id/show" element={<ContactShow />} />
      </Routes>,
      {
        resource: "contacts",
        record: mockContact,
        initialEntries: ["/contacts/1/show"],
      }
    );

    await waitFor(() => {
      // Check that Opportunities tab trigger exists
      expect(screen.getByRole("tab", { name: /opportunities/i })).toBeInTheDocument();
    });
  });
});
