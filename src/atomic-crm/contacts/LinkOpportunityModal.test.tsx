import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LinkOpportunityModal } from "./LinkOpportunityModal";
import { vi } from "vitest";
import type * as ReactAdmin from "react-admin";

const mockCreate = vi.fn();
const mockNotify = vi.fn();
const mockDataProvider = {
  create: vi.fn().mockResolvedValue({ data: { id: 1 } }),
  getOne: vi.fn().mockResolvedValue({ data: { id: 1 } }),
};
const mockQueryClient = {
  invalidateQueries: vi.fn(),
};

// Mock ra-core hooks that use QueryClient
vi.mock("ra-core", async () => {
  const actual = await vi.importActual("ra-core");
  return {
    ...actual,
    useDataProvider: () => mockDataProvider,
  };
});

// Mock @tanstack/react-query
vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => mockQueryClient,
}));

// Mock react-admin hooks - use importOriginal to preserve all exports
vi.mock("react-admin", async (importOriginal) => {
  const actual = await importOriginal<typeof ReactAdmin>();
  return {
    ...actual,
    useCreate: () => [mockCreate, { isLoading: false }],
    useNotify: () => mockNotify,
    Form: ({ children, onSubmit }: any) => (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          // Simulate form data being passed to onSubmit handler
          onSubmit({ opportunity_id: 10 });
        }}
      >
        {children}
      </form>
    ),
    ReferenceInput: ({ children }: any) => <div>{children}</div>,
  };
});

// Mock AutocompleteInput component
vi.mock("@/components/ra-wrappers/autocomplete-input", () => ({
  AutocompleteInput: ({ label }: any) => <div data-testid="autocomplete">{label}</div>,
}));

describe("LinkOpportunityModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders when open", () => {
    render(
      <LinkOpportunityModal
        open={true}
        contactName="Jane Doe"
        contactId={1}
        linkedOpportunityIds={[]}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    expect(screen.getByText(/Link Opportunity to Jane Doe/i)).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(
      <LinkOpportunityModal
        open={false}
        contactName="Jane Doe"
        contactId={1}
        linkedOpportunityIds={[]}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    expect(screen.queryByText(/Link Opportunity to Jane Doe/i)).not.toBeInTheDocument();
  });

  it("prevents linking duplicate opportunities", async () => {
    const onClose = vi.fn();
    const onSuccess = vi.fn();

    render(
      <LinkOpportunityModal
        open={true}
        contactName="Jane Doe"
        contactId={1}
        linkedOpportunityIds={[10, 11]}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );

    // Simulate form submission with opportunity 10 (already linked)
    const submitButton = screen.getByRole("button", { name: /Link Opportunity/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockNotify).toHaveBeenCalledWith(
        "This contact is already linked to that opportunity",
        { type: "warning" }
      );
    });

    expect(mockCreate).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
