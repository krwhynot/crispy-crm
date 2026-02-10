/* eslint-disable no-restricted-syntax -- This test uses minimal wrappers to isolate component logic without full React Admin context */
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { FormProvider, useForm } from "react-hook-form";
import ActivitySinglePage from "../ActivitySinglePage";
import { INTERACTION_TYPE_OPTIONS } from "@/atomic-crm/validation/activities";

// Mock ReferenceInput to avoid React Admin dependencies
vi.mock("@/components/ra-wrappers/reference-input", () => ({
  ReferenceInput: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Test wrapper with form context
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const FormWrapper = () => {
    const methods = useForm({
      defaultValues: {
        type: "call",
        subject: "",
        activity_date: new Date().toISOString().split("T")[0],
      },
    });

    return (
      <FormProvider {...methods}>
        <form>{children}</form>
      </FormProvider>
    );
  };

  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <FormWrapper />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe("ActivitySinglePage - Sample Type Availability", () => {
  it("should show Sample type in full Activity form (not Quick Add)", async () => {
    render(
      <TestWrapper>
        <ActivitySinglePage />
      </TestWrapper>
    );

    const typeSelect = screen.getByRole("combobox", { name: /interaction type/i });
    expect(typeSelect).toBeInTheDocument();

    await userEvent.click(typeSelect);

    await waitFor(() => {
      expect(screen.getByText("Sample")).toBeInTheDocument();
    });
  });

  it("should show all interaction types including Sample, Administrative, and Other", async () => {
    render(
      <TestWrapper>
        <ActivitySinglePage />
      </TestWrapper>
    );

    const typeSelect = screen.getByRole("combobox", { name: /interaction type/i });
    await userEvent.click(typeSelect);

    await waitFor(() => {
      expect(screen.getByText("Sample")).toBeInTheDocument();
      expect(screen.getByText("Administrative")).toBeInTheDocument();
      expect(screen.getByText("Other")).toBeInTheDocument();
    });
  });

  it("should show sample_status field when Sample type is selected", async () => {
    render(
      <TestWrapper>
        <ActivitySinglePage />
      </TestWrapper>
    );

    const typeSelect = screen.getByRole("combobox", { name: /interaction type/i });
    await userEvent.click(typeSelect);
    await userEvent.click(screen.getByText("Sample"));

    await waitFor(() => {
      expect(screen.getByText(/sample status/i)).toBeInTheDocument();
    });
  });

  it("should verify INTERACTION_TYPE_OPTIONS includes all 15 types", () => {
    expect(INTERACTION_TYPE_OPTIONS).toHaveLength(15);

    const typeValues = INTERACTION_TYPE_OPTIONS.map((opt) => opt.value);

    expect(typeValues).toContain("sample");
    expect(typeValues).toContain("administrative");
    expect(typeValues).toContain("other");
    expect(typeValues).toContain("call");
    expect(typeValues).toContain("email");
    expect(typeValues).toContain("meeting");
  });
});
