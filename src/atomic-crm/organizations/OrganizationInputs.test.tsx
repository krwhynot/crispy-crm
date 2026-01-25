/**
 * @vitest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import type { Company } from "../types";
import { vi } from "vitest";

// Mock useRecordContext from ra-core
vi.mock("ra-core", async () => {
  const actual = await vi.importActual("ra-core");
  return {
    ...actual,
    useRecordContext: vi.fn(() => ({ id: 1, name: "Test Org" })),
  };
});

// Import ra-core components after mock definition
import { CoreAdminContext as AdminContext, SaveContextProvider, Form as RaForm } from "ra-core";
import { Form, FormProgressProvider } from "@/components/ra-wrappers/form";
import { OrganizationInputs } from "./OrganizationInputs";

const mockDataProvider = {
  getList: vi.fn(),
  getOne: vi.fn(),
  getMany: vi.fn(),
  getManyReference: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  updateMany: vi.fn(),
  delete: vi.fn(),
  deleteMany: vi.fn(),
};

// Mock focused contexts (OrganizationInputs doesn't actually use config, but keep for consistency)
vi.mock("../contexts", () => ({
  useFormOptions: () => ({}),
  usePipelineConfig: () => ({}),
  useAppBranding: () => ({ title: "Crispy CRM" }),
}));

const MockFormWrapper = ({
  children,
  defaultValues = {},
}: {
  children: React.ReactNode;
  defaultValues?: any;
}) => {
  const saveContext = {
    save: vi.fn(),
    saving: false,
    mutationMode: "pessimistic" as const,
  };

  const form = useForm({
    defaultValues,
    mode: "onBlur",
  });

  return (
    <SaveContextProvider value={saveContext}>
      <FormProgressProvider initialProgress={10}>
        <RaForm defaultValues={defaultValues} onSubmit={vi.fn()}>
          <Form {...form}>{children}</Form>
        </RaForm>
      </FormProgressProvider>
    </SaveContextProvider>
  );
};

const TestWrapper = ({
  children,
  defaultValues,
}: {
  children: React.ReactNode;
  defaultValues?: Partial<Company>;
}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  // Merge with default name to prevent useRecordContext issues
  const mergedDefaults = { name: "Test Org", ...defaultValues };

  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AdminContext dataProvider={mockDataProvider}>
          <MockFormWrapper defaultValues={mergedDefaults}>{children}</MockFormWrapper>
        </AdminContext>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe("OrganizationInputs - Compact Form", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock segments data for SegmentComboboxInput
    mockDataProvider.getList.mockResolvedValue({
      data: [
        { id: 1, name: "Enterprise" },
        { id: 2, name: "SMB" },
        { id: 3, name: "Startup" },
      ],
      total: 3,
    });

    mockDataProvider.getMany.mockResolvedValue({
      data: [],
    });

    // Mock getOne for sales reference
    mockDataProvider.getOne.mockResolvedValue({
      data: { id: 1, first_name: "John", last_name: "Doe" },
    });
  });

  it("should render organization name field", async () => {
    render(
      <TestWrapper defaultValues={{ name: "Test Org" }}>
        <OrganizationInputs />
      </TestWrapper>
    );

    await waitFor(() => {
      // Check for field labels - getAllByText to handle multiple matches
      const nameLabels = screen.getAllByText(/organization name/i);
      expect(nameLabels.length).toBeGreaterThan(0);
    });
  });

  it("should render type field", async () => {
    render(
      <TestWrapper>
        <OrganizationInputs />
      </TestWrapper>
    );

    await waitFor(() => {
      // Check for type label
      const typeLabels = screen.getAllByText(/type/i);
      expect(typeLabels.length).toBeGreaterThan(0);
    });
  });

  it("should preserve form data on field change", async () => {
    render(
      <TestWrapper defaultValues={{ name: "Initial Name" }}>
        <OrganizationInputs />
      </TestWrapper>
    );

    // Find the name input field and verify initial value
    const nameInputs = screen.getAllByRole("textbox");
    const nameInput = nameInputs[0]; // First textbox should be the name field

    // Change the value
    fireEvent.change(nameInput, { target: { value: "Test Organization" } });

    // Verify the input value changed
    await waitFor(() => {
      expect(nameInput).toHaveValue("Test Organization");
    });
  });

  it("should have collapsible section for additional details", async () => {
    render(
      <TestWrapper>
        <OrganizationInputs />
      </TestWrapper>
    );

    await waitFor(() => {
      // Check for collapsible trigger
      const collapsibleTrigger = screen.getByRole("button", { name: /additional details/i });
      expect(collapsibleTrigger).toBeInTheDocument();
    });
  });

  it("should expand collapsible section when clicked", async () => {
    render(
      <TestWrapper>
        <OrganizationInputs />
      </TestWrapper>
    );

    // Find and click collapsible trigger
    const collapsibleTrigger = screen.getByRole("button", { name: /additional details/i });
    fireEvent.click(collapsibleTrigger);

    // Check for fields in the expanded section
    await waitFor(() => {
      expect(screen.getByText(/website/i)).toBeInTheDocument();
    });
  });

  it("should have responsive grid layout", async () => {
    const { container } = render(
      <TestWrapper>
        <OrganizationInputs />
      </TestWrapper>
    );

    await waitFor(() => {
      // Check for grid classes (CompactFormRow uses these)
      const grids = container.querySelectorAll(".grid");
      expect(grids.length).toBeGreaterThan(0);

      // Should have responsive grid columns
      const hasResponsiveGrid = Array.from(grids).some((grid) =>
        grid.classList.contains("md:grid-cols-2")
      );
      expect(hasResponsiveGrid).toBe(true);
    });
  });

  it("should render all visible fields", async () => {
    render(
      <TestWrapper>
        <OrganizationInputs />
      </TestWrapper>
    );

    await waitFor(() => {
      // Verify that the component renders input fields
      const textboxes = screen.getAllByRole("textbox");
      expect(textboxes.length).toBeGreaterThan(0);

      // Core visible fields: name, street, city, state, zip
      // Plus select inputs for type, account manager, segment
    });
  });

  it("should use 44px touch targets on collapsible trigger", async () => {
    render(
      <TestWrapper>
        <OrganizationInputs />
      </TestWrapper>
    );

    await waitFor(() => {
      const trigger = screen.getByRole("button", { name: /additional details/i });
      expect(trigger).toHaveClass("h-11");
    });
  });

  it("should display address fields", async () => {
    render(
      <TestWrapper>
        <OrganizationInputs />
      </TestWrapper>
    );

    await waitFor(() => {
      // Check for address-related input fields
      const textboxes = screen.getAllByRole("textbox");
      // Should have name, street, city, zip at minimum
      expect(textboxes.length).toBeGreaterThanOrEqual(4);
    });
  });
});
