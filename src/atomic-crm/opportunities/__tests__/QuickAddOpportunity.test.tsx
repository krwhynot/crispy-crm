import { render, screen, fireEvent } from "@testing-library/react";
import { QuickAddOpportunity } from "../kanban/QuickAddOpportunity";
import { describe, it, expect, vi } from "vitest";
import type * as ReactAdmin from "react-admin";

// Mock react-admin - use importOriginal to preserve all exports
vi.mock("react-admin", async (importOriginal) => {
  const actual = await importOriginal<typeof ReactAdmin>();
  return {
    ...actual,
    useCreate: () => [vi.fn().mockResolvedValue({ data: { id: 1 } }), { isLoading: false }],
    useDataProvider: () => ({
      create: vi.fn().mockResolvedValue({ data: { id: 1 } }),
    }),
    useNotify: () => vi.fn(),
    useRefresh: () => vi.fn(),
    useGetIdentity: () => ({ identity: { id: 1 }, isLoading: false }),
    useGetList: () => ({
      data: [
        { id: 1, name: "Acme Corp" },
        { id: 2, name: "TechStart Inc" },
      ],
      isLoading: false,
    }),
  };
});

describe("QuickAddOpportunity", () => {
  it("renders button to open modal", () => {
    render(<QuickAddOpportunity stage="new_lead" />);

    expect(screen.getByText("+ New Opportunity")).toBeInTheDocument();
  });

  it("opens modal on button click", () => {
    render(<QuickAddOpportunity stage="new_lead" />);

    fireEvent.click(screen.getByText("+ New Opportunity"));

    expect(screen.getByText("Create Opportunity")).toBeInTheDocument();
    expect(screen.getByLabelText(/Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Customer/)).toBeInTheDocument();
  });

  it("pre-fills stage field with column stage", () => {
    render(<QuickAddOpportunity stage="demo_scheduled" />);

    fireEvent.click(screen.getByText("+ New Opportunity"));

    const stageInput = screen.getByDisplayValue("Demo Scheduled");
    expect(stageInput).toBeInTheDocument();
  });
});
