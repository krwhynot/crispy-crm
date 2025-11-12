import { render, screen } from "@testing-library/react";
import { PipelineSummary, calculatePipelineMetrics } from "../PipelineSummary";
import { TestMemoryRouter } from "ra-core";
import { describe, it, expect, vi } from "vitest";

// Mock React Admin hooks
const mockGetList = vi.fn();
const mockGetIdentity = vi.fn();

vi.mock("react-admin", async () => {
  const actual = await vi.importActual("react-admin");
  return {
    ...actual,
    useGetList: () => mockGetList(),
    useGetIdentity: () => mockGetIdentity(),
  };
});

describe("PipelineSummary", () => {
  it("renders widget title", () => {
    mockGetIdentity.mockReturnValue({ identity: { id: 1 } });
    mockGetList.mockReturnValue({
      data: [],
      isPending: false,
      error: null,
    });

    render(
      <TestMemoryRouter>
        <PipelineSummary />
      </TestMemoryRouter>
    );

    expect(screen.getByText(/PIPELINE SUMMARY/i)).toBeInTheDocument();
  });

  it("shows loading state while fetching opportunities", () => {
    mockGetIdentity.mockReturnValue({ identity: { id: 1 } });
    mockGetList.mockReturnValue({
      data: undefined,
      isPending: true,
      error: null,
    });

    render(
      <TestMemoryRouter>
        <PipelineSummary />
      </TestMemoryRouter>
    );

    expect(screen.getByText(/Loading pipeline/i)).toBeInTheDocument();
  });

  it("shows empty state when no opportunities", () => {
    mockGetIdentity.mockReturnValue({ identity: { id: 1 } });
    mockGetList.mockReturnValue({
      data: [],
      isPending: false,
      error: null,
    });

    render(
      <TestMemoryRouter>
        <PipelineSummary />
      </TestMemoryRouter>
    );

    expect(screen.getByText(/No active opportunities/i)).toBeInTheDocument();
  });
});
