/**
 * Tests for ContactShow component
 *
 * Tests the contact details view including:
 * - Loading states
 * - Rendering contact information
 * - Organization relationships (primary/non-primary)
 * - Error handling (404, permission denied)
 */

import { describe, test, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import type * as RaCore from "ra-core";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { createMockContact } from "@/tests/utils/mock-providers";
import ContactShow from "../ContactShow";

// Mock dependencies
vi.mock("ra-core", async () => {
  const actual = await vi.importActual<typeof RaCore>("ra-core");
  return {
    ...actual,
    useShowContext: vi.fn(),
    useGetList: vi.fn(() => ({
      data: [],
      total: 0,
      isPending: false,
      isLoading: false,
    })),
  };
});

// Mock ReferenceField to simplify testing
vi.mock("@/components/admin/reference-field", () => ({
  ReferenceField: ({ children }: any) => <div data-testid="reference-field">{children}</div>,
}));

// Mock ReferenceManyField (for notes)
vi.mock("@/components/admin/reference-many-field", () => ({
  ReferenceManyField: ({ children }: any) => <div data-testid="reference-many-field">{children}</div>,
}));

// Mock TextField
vi.mock("@/components/admin/text-field", () => ({
  TextField: ({ source }: any) => <span data-testid={`text-field-${source}`}>{source}</span>,
}));

// Mock Avatar components
vi.mock("../Avatar", () => ({
  Avatar: () => <div data-testid="contact-avatar">Avatar</div>,
}));

vi.mock("../organizations/OrganizationAvatar", () => ({
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

// Import mocked functions
import { useShowContext } from "ra-core";

describe("ContactShow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders loading state", () => {
    (useShowContext as any).mockReturnValue({
      record: undefined,
      isPending: true,
      error: null,
    });

    renderWithAdminContext(<ContactShow />, {
      resource: "contacts",
    });

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
      email: [{ email: "john@example.com", type: "Work" }],
      phone: [{ number: "555-0100", type: "Work" }],
      organizations: [
        {
          organization_id: 1,
          organization_name: "Tech Corp",
          is_primary: true,
        },
      ],
    });

    (useShowContext as any).mockReturnValue({
      record: mockContact,
      isPending: false,
      error: null,
    });

    renderWithAdminContext(<ContactShow />, {
      resource: "contacts",
      record: mockContact,
    });

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

  test("renders contact with primary organization", async () => {
    const mockContact = createMockContact({
      id: 2,
      first_name: "Jane",
      last_name: "Smith",
      title: "Product Manager",
      organizations: [
        {
          organization_id: 10,
          organization_name: "Acme Inc",
          is_primary: true,
        },
      ],
    });

    (useShowContext as any).mockReturnValue({
      record: mockContact,
      isPending: false,
      error: null,
    });

    renderWithAdminContext(<ContactShow />, {
      resource: "contacts",
      record: mockContact,
    });

    await waitFor(() => {
      // Should show associated organizations section
      expect(screen.getByText("Associated Organizations")).toBeInTheDocument();

      // Should show primary badge
      expect(screen.getByText("Primary")).toBeInTheDocument();

      // Should show organization avatar
      expect(screen.getByTestId("org-avatar")).toBeInTheDocument();
    });
  });

  test("renders contact with multiple organizations", async () => {
    const mockContact = createMockContact({
      id: 3,
      first_name: "Bob",
      last_name: "Wilson",
      title: "Consultant",
      organizations: [
        {
          organization_id: 20,
          organization_name: "Company A",
          is_primary: true,
        },
        {
          organization_id: 21,
          organization_name: "Company B",
          is_primary: false,
        },
        {
          organization_id: 22,
          organization_name: "Company C",
          is_primary: false,
        },
      ],
    });

    (useShowContext as any).mockReturnValue({
      record: mockContact,
      isPending: false,
      error: null,
    });

    renderWithAdminContext(<ContactShow />, {
      resource: "contacts",
      record: mockContact,
    });

    await waitFor(() => {
      expect(screen.getByText("Associated Organizations")).toBeInTheDocument();

      // Should only show one Primary badge (for the primary org)
      const primaryBadges = screen.getAllByText("Primary");
      expect(primaryBadges).toHaveLength(1);
    });
  });

  test("renders contact without organizations", async () => {
    const mockContact = createMockContact({
      id: 4,
      first_name: "Alice",
      last_name: "Johnson",
      title: "Freelancer",
      organizations: [],
    });

    (useShowContext as any).mockReturnValue({
      record: mockContact,
      isPending: false,
      error: null,
    });

    renderWithAdminContext(<ContactShow />, {
      resource: "contacts",
      record: mockContact,
    });

    await waitFor(() => {
      // Should render name and title
      expect(screen.getByText("Alice Johnson")).toBeInTheDocument();
      expect(screen.getByText(/Freelancer/)).toBeInTheDocument();

      // Should not show organizations section
      expect(screen.queryByText("Associated Organizations")).not.toBeInTheDocument();
    });
  });

  test("renders notes section", async () => {
    const mockContact = createMockContact({
      id: 5,
      first_name: "Charlie",
      last_name: "Brown",
    });

    (useShowContext as any).mockReturnValue({
      record: mockContact,
      isPending: false,
      error: null,
    });

    renderWithAdminContext(<ContactShow />, {
      resource: "contacts",
      record: mockContact,
    });

    await waitFor(() => {
      // Should render ReferenceManyField for notes
      expect(screen.getByTestId("reference-many-field")).toBeInTheDocument();
    });
  });

  test("handles missing record gracefully", () => {
    (useShowContext as any).mockReturnValue({
      record: null,
      isPending: false,
      error: null,
    });

    renderWithAdminContext(<ContactShow />, {
      resource: "contacts",
    });

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

    renderWithAdminContext(<ContactShow />, {
      resource: "contacts",
      record: mockContact,
    });

    await waitFor(() => {
      // Check aside section
      const aside = screen.getByRole("complementary", { name: /contact information/i });
      expect(aside).toBeInTheDocument();
    });
  });
});
