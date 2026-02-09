import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { ActivityNoteForm } from "../ActivityNoteForm";
import { useDataProvider, useGetList, useRefresh } from "ra-core";
import { useQueryClient } from "@tanstack/react-query";
import { useSafeNotify } from "@/atomic-crm/hooks/useSafeNotify";
import { usePipelineConfig } from "../../root/ConfigurationContext";
import { mockUseGetListReturn } from "@/tests/utils/typed-mocks";
import type { Opportunity, Contact } from "../../types";

// Mock dependencies
vi.mock("ra-core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("ra-core")>();
  return {
    ...actual,
    useDataProvider: vi.fn(),
    useGetList: vi.fn(),
    useRefresh: vi.fn(),
  };
});

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();
  return {
    ...actual,
    useQueryClient: vi.fn(),
  };
});

vi.mock("@/atomic-crm/hooks/useSafeNotify");
vi.mock("../../root/ConfigurationContext");

// Test wrapper
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
};

describe("ActivityNoteForm - Quick Add Type Filtering", () => {
  const mockDataProvider = {
    create: vi.fn(),
    update: vi.fn(),
  };

  const mockQueryClient = {
    invalidateQueries: vi.fn(),
  };

  const mockNotify = {
    success: vi.fn(),
    actionError: vi.fn(),
    warning: vi.fn(),
  };

  const testOpportunity: Opportunity = {
    id: 123,
    name: "Test Opportunity",
    stage: "initial_outreach",
    customer_organization_id: 456,
    principal_id: 1,
    sales_rep_id: 10,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  };

  const testContacts: Contact[] = [
    {
      id: 1,
      first_name: "John",
      last_name: "Doe",
      email: "john@example.com",
      organization_id: 456,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
  ];

  const opportunityStages = [
    { value: "new_lead", label: "New Lead" },
    { value: "initial_outreach", label: "Initial Outreach" },
    { value: "closed_won", label: "Closed Won" },
  ];

  beforeEach(() => {
    vi.resetAllMocks();

    (useDataProvider as ReturnType<typeof vi.fn>).mockReturnValue(mockDataProvider);
    (useRefresh as ReturnType<typeof vi.fn>).mockReturnValue(vi.fn());
    (useQueryClient as ReturnType<typeof vi.fn>).mockReturnValue(mockQueryClient);
    (useSafeNotify as ReturnType<typeof vi.fn>).mockReturnValue(mockNotify);
    (usePipelineConfig as ReturnType<typeof vi.fn>).mockReturnValue({ opportunityStages });

    (useGetList as ReturnType<typeof vi.fn>).mockReturnValue(
      mockUseGetListReturn<Contact>({
        data: testContacts,
        total: 1,
        isPending: false,
      })
    );
  });

  it("should NOT show Sample type in Quick Add dropdown (WG-001)", async () => {
    render(
      <TestWrapper>
        <ActivityNoteForm opportunity={testOpportunity} />
      </TestWrapper>
    );

    const typeSelect = screen.getByRole("combobox", { name: /type/i });
    expect(typeSelect).toBeInTheDocument();

    await userEvent.click(typeSelect);

    await waitFor(() => {
      expect(screen.queryByText("Sample")).not.toBeInTheDocument();
    });
  });

  it("should NOT show Administrative type in Quick Add dropdown", async () => {
    render(
      <TestWrapper>
        <ActivityNoteForm opportunity={testOpportunity} />
      </TestWrapper>
    );

    const typeSelect = screen.getByRole("combobox", { name: /type/i });
    await userEvent.click(typeSelect);

    await waitFor(() => {
      expect(screen.queryByText("Administrative")).not.toBeInTheDocument();
    });
  });

  it("should NOT show Other type in Quick Add dropdown", async () => {
    render(
      <TestWrapper>
        <ActivityNoteForm opportunity={testOpportunity} />
      </TestWrapper>
    );

    const typeSelect = screen.getByRole("combobox", { name: /type/i });
    await userEvent.click(typeSelect);

    await waitFor(() => {
      expect(screen.queryByText("Other")).not.toBeInTheDocument();
    });
  });

  it("should show standard interaction types (Call, Email, Meeting, etc.)", async () => {
    render(
      <TestWrapper>
        <ActivityNoteForm opportunity={testOpportunity} />
      </TestWrapper>
    );

    const typeSelect = screen.getByRole("combobox", { name: /type/i });
    await userEvent.click(typeSelect);

    await waitFor(() => {
      const options = screen.getAllByRole("option");
      const optionTexts = options.map((opt) => opt.textContent);

      expect(optionTexts).toContain("Call");
      expect(optionTexts).toContain("Email");
      expect(optionTexts).toContain("Meeting");
      expect(optionTexts).toContain("Demo");
      expect(optionTexts).toContain("Note");
    });
  });

  it("should successfully create a Call activity (validation passes)", async () => {
    mockDataProvider.create.mockResolvedValue({
      data: {
        id: 999,
        type: "call",
        subject: "Test call",
      },
    });

    render(
      <TestWrapper>
        <ActivityNoteForm opportunity={testOpportunity} />
      </TestWrapper>
    );

    const typeSelect = screen.getByRole("combobox", { name: /type/i });
    await userEvent.click(typeSelect);

    const callOption = screen.getAllByRole("option").find((opt) => opt.textContent === "Call");
    expect(callOption).toBeDefined();
    await userEvent.click(callOption!);

    const subjectInput = screen.getByRole("textbox", { name: /subject/i });
    await userEvent.type(subjectInput, "Discussed product features");

    const submitButton = screen.getByRole("button", { name: /add activity/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockDataProvider.create).toHaveBeenCalledWith("activities", {
        data: expect.objectContaining({
          activity_type: "activity",
          type: "call",
          subject: "Discussed product features",
          opportunity_id: 123,
          organization_id: 456,
        }),
      });
    });

    expect(mockNotify.success).toHaveBeenCalled();
  });

  it("should successfully create an Email activity (validation passes)", async () => {
    mockDataProvider.create.mockResolvedValue({
      data: {
        id: 1000,
        type: "email",
        subject: "Follow-up email",
      },
    });

    render(
      <TestWrapper>
        <ActivityNoteForm opportunity={testOpportunity} />
      </TestWrapper>
    );

    const typeSelect = screen.getByRole("combobox", { name: /type/i });
    await userEvent.click(typeSelect);

    const emailOption = screen.getAllByRole("option").find((opt) => opt.textContent === "Email");
    expect(emailOption).toBeDefined();
    await userEvent.click(emailOption!);

    const subjectInput = screen.getByRole("textbox", { name: /subject/i });
    await userEvent.type(subjectInput, "Sent pricing information");

    const submitButton = screen.getByRole("button", { name: /add activity/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockDataProvider.create).toHaveBeenCalledWith("activities", {
        data: expect.objectContaining({
          type: "email",
          subject: "Sent pricing information",
        }),
      });
    });
  });

  it("should invalidate correct query keys after successful creation", async () => {
    mockDataProvider.create.mockResolvedValue({
      data: { id: 999, type: "call", subject: "Test" },
    });

    render(
      <TestWrapper>
        <ActivityNoteForm opportunity={testOpportunity} />
      </TestWrapper>
    );

    const typeSelect = screen.getByRole("combobox", { name: /type/i });
    await userEvent.click(typeSelect);

    const callOption = screen.getAllByRole("option").find((opt) => opt.textContent === "Call");
    expect(callOption).toBeDefined();
    await userEvent.click(callOption!);

    const subjectInput = screen.getByRole("textbox", { name: /subject/i });
    await userEvent.type(subjectInput, "Test call");

    const submitButton = screen.getByRole("button", { name: /add activity/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: expect.arrayContaining(["activities"]),
      });
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: expect.arrayContaining(["opportunities"]),
      });
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: expect.arrayContaining(["entity_timeline"]),
      });
    });
  });
});
