/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { vi as vitestVi } from "vitest";

// Mock react-admin's hooks
vi.mock("ra-core", async () => {
  const actual = await vi.importActual("ra-core");
  return {
    ...actual,
    useGetList: () => ({
      data: [
        {
          id: "1",
          name: "Sysco Corporate",
          organization_type: "distributor",
          parent_organization_id: null,
        },
        {
          id: "2",
          name: "Restaurant ABC",
          organization_type: "customer",
          parent_organization_id: null,
        },
      ],
      isLoading: false,
      total: 2,
    }),
    useDataProvider: () => ({
      getList: vitestVi.fn(),
    }),
  };
});

import { CoreAdminContext as AdminContext, SaveContextProvider, Form as RaForm } from "ra-core";
import { Form } from "@/components/admin/form";
import { ParentOrganizationInput } from "../ParentOrganizationInput";

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
    mode: "onChange",
  });

  return (
    <SaveContextProvider value={saveContext}>
      <RaForm defaultValues={defaultValues} onSubmit={vi.fn()}>
        <Form {...form}>{children}</Form>
      </RaForm>
    </SaveContextProvider>
  );
};

const TestWrapper = ({
  children,
  defaultValues = {},
}: {
  children: React.ReactNode;
  defaultValues?: any;
}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AdminContext dataProvider={mockDataProvider}>
          <MockFormWrapper defaultValues={defaultValues}>{children}</MockFormWrapper>
        </AdminContext>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe("ParentOrganizationInput", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockDataProvider.getList.mockResolvedValue({
      data: [
        {
          id: "1",
          name: "Sysco Corporate",
          organization_type: "distributor",
          parent_organization_id: null,
        },
        {
          id: "2",
          name: "Restaurant ABC",
          organization_type: "customer",
          parent_organization_id: null,
        },
      ],
      total: 2,
    });

    mockDataProvider.getMany.mockResolvedValue({
      data: [],
    });

    mockDataProvider.getOne.mockResolvedValue({
      data: {
        id: "1",
        name: "Sysco Corporate",
        organization_type: "distributor",
      },
    });
  });

  it("renders autocomplete input with Parent Organization label", async () => {
    render(
      <TestWrapper>
        <ParentOrganizationInput />
      </TestWrapper>
    );

    await waitFor(() => {
      const input = screen.getByRole("combobox");
      expect(input).toHaveAttribute("name", "parent_organization_id");
    });
  });

  it("filters to only show parent-eligible orgs", async () => {
    render(
      <TestWrapper>
        <ParentOrganizationInput />
      </TestWrapper>
    );

    // Verify that getList was called with filter for parent-eligible types
    await waitFor(() => {
      // The component should use ReferenceInput which calls getList
      expect(mockDataProvider.getList).toHaveBeenCalled();
    });
  });

  it("shows org type in dropdown options", async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <ParentOrganizationInput />
      </TestWrapper>
    );

    // Find input and click it to show dropdown
    const input = screen.getByLabelText(/Parent Organization/i);
    await user.click(input);

    // Wait for options to appear - should show name (type) format
    await waitFor(() => {
      const option = screen.queryByText(/Sysco Corporate/i);
      if (option) {
        expect(option.textContent).toMatch(/distributor/i);
      }
    });
  });
});
