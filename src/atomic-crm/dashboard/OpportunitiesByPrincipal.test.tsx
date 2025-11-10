import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { OpportunitiesByPrincipal } from "./OpportunitiesByPrincipal";
import { useGetList } from "ra-core";
import { BrowserRouter } from "react-router-dom";

// Mock react-admin hooks
vi.mock("ra-core", async () => {
  const actual = await vi.importActual("ra-core");
  return {
    ...actual,
    useGetList: vi.fn(),
  };
});

const mockUseGetList = useGetList as ReturnType<typeof vi.fn>;

const MockRouter = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe("OpportunitiesByPrincipal", () => {
  it("renders loading state", () => {
    mockUseGetList.mockReturnValue({
      data: undefined,
      isPending: true,
      error: null,
      refetch: vi.fn(),
    });

    render(
      <MockRouter>
        <OpportunitiesByPrincipal />
      </MockRouter>
    );

    expect(screen.getByText("Opportunities by Principal")).toBeInTheDocument();
  });

  it("renders empty state when no opportunities", () => {
    mockUseGetList.mockReturnValue({
      data: [],
      isPending: false,
      error: null,
      refetch: vi.fn(),
    });

    render(
      <MockRouter>
        <OpportunitiesByPrincipal />
      </MockRouter>
    );

    expect(screen.getByText("No active opportunities")).toBeInTheDocument();
  });

  it("groups opportunities by principal and sorts by count", () => {
    const mockOpportunities = [
      {
        id: 1,
        principal_organization_id: "101",
        principal_organization_name: "Fishpeople",
        status: "active",
      },
      {
        id: 2,
        principal_organization_id: "101",
        principal_organization_name: "Fishpeople",
        status: "active",
      },
      {
        id: 3,
        principal_organization_id: "101",
        principal_organization_name: "Fishpeople",
        status: "active",
      },
      {
        id: 4,
        principal_organization_id: "102",
        principal_organization_name: "Ballyhoo Foods",
        status: "active",
      },
      {
        id: 5,
        principal_organization_id: "102",
        principal_organization_name: "Ballyhoo Foods",
        status: "active",
      },
      {
        id: 6,
        principal_organization_id: null,
        principal_organization_name: "Other",
        status: "active",
      },
    ];

    mockUseGetList.mockReturnValue({
      data: mockOpportunities,
      isPending: false,
      error: null,
      refetch: vi.fn(),
    });

    render(
      <MockRouter>
        <OpportunitiesByPrincipal />
      </MockRouter>
    );

    // Verify principals are rendered
    expect(screen.getByText("Fishpeople")).toBeInTheDocument();
    expect(screen.getByText("Ballyhoo Foods")).toBeInTheDocument();
    expect(screen.getByText("Other")).toBeInTheDocument();

    // Verify counts
    expect(screen.getByText("3 opportunities")).toBeInTheDocument();
    expect(screen.getByText("2 opportunities")).toBeInTheDocument();
    expect(screen.getByText("1 opportunity")).toBeInTheDocument();

    // Verify total count
    expect(screen.getByText("6 total opportunities")).toBeInTheDocument();
  });

  it("displays star icon to indicate importance", () => {
    mockUseGetList.mockReturnValue({
      data: [],
      isPending: false,
      error: null,
      refetch: vi.fn(),
    });

    const { container } = render(
      <MockRouter>
        <OpportunitiesByPrincipal />
      </MockRouter>
    );

    // Star icon should be present (lucide-react Star component)
    const starIcon = container.querySelector('svg[class*="lucide-star"]');
    expect(starIcon).toBeInTheDocument();
  });

  it("renders error state", () => {
    const mockError = new Error("Failed to fetch opportunities");
    mockUseGetList.mockReturnValue({
      data: undefined,
      isPending: false,
      error: mockError,
      refetch: vi.fn(),
    });

    render(
      <MockRouter>
        <OpportunitiesByPrincipal />
      </MockRouter>
    );

    expect(screen.getByText("Unable to load")).toBeInTheDocument();
    expect(screen.getByText("Retry")).toBeInTheDocument();
  });

  it("handles opportunities with null principal as 'Other'", () => {
    const mockOpportunities = [
      {
        id: 1,
        principal_organization_id: null,
        principal_organization_name: "Other",
        status: "active",
      },
      {
        id: 2,
        principal_organization_id: null,
        principal_organization_name: "Other",
        status: "active",
      },
    ];

    mockUseGetList.mockReturnValue({
      data: mockOpportunities,
      isPending: false,
      error: null,
      refetch: vi.fn(),
    });

    render(
      <MockRouter>
        <OpportunitiesByPrincipal />
      </MockRouter>
    );

    expect(screen.getByText("Other")).toBeInTheDocument();
    expect(screen.getByText("2 opportunities")).toBeInTheDocument();
  });
});
