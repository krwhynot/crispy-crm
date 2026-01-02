import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OpportunityCardActions } from "../kanban/OpportunityCardActions";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import type * as ReactAdmin from "react-admin";

const mockRecord = {
  id: 1,
  name: "Test Opportunity",
};

// Mock React Admin hooks - use importOriginal to preserve all exports
vi.mock("react-admin", async (importOriginal) => {
  const actual = await importOriginal<typeof ReactAdmin>();
  return {
    ...actual,
    useUpdate: () => [vi.fn()],
    useDelete: () => [vi.fn()],
    useNotify: () => vi.fn(),
    useRefresh: () => vi.fn(),
    useRecordContext: () => mockRecord,
  };
});

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe("OpportunityCardActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders trigger button with correct attributes", () => {
    renderWithRouter(<OpportunityCardActions opportunityId={1} />);

    const button = screen.getByRole("button", { name: /actions/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveAttribute("aria-haspopup", "menu");
  });

  it("opens dropdown menu on click", async () => {
    const user = userEvent.setup();
    renderWithRouter(<OpportunityCardActions opportunityId={1} />);

    const button = screen.getByRole("button", { name: /actions/i });
    await user.click(button);

    // Radix DropdownMenu renders in a portal, so we query the whole document
    expect(await screen.findByRole("menu")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /view details/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /mark as won/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /delete/i })).toBeInTheDocument();
  });

  it("has correct touch target size for mobile", () => {
    renderWithRouter(<OpportunityCardActions opportunityId={1} />);

    const button = screen.getByRole("button", { name: /actions/i });
    // Button should have 44px minimum touch target
    expect(button).toHaveClass("min-h-[44px]");
    expect(button).toHaveClass("min-w-[44px]");
  });
});
