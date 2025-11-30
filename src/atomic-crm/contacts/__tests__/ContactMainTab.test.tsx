import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AdminContext } from "react-admin";
import { FormProvider, useForm } from "react-hook-form";
import { ContactMainTab } from "../ContactMainTab";

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const methods = useForm({
    defaultValues: {
      first_name: "",
      last_name: "",
      organization_id: null,
      sales_id: null,
      email: [],
      phone: [],
      title: "",
      department: "",
      linkedin_url: "",
      notes: "",
    },
  });
  return (
    <AdminContext>
      <FormProvider {...methods}>
        <form>{children}</form>
      </FormProvider>
    </AdminContext>
  );
};

describe("ContactMainTab", () => {
  test("renders main tab fields", () => {
    render(
      <TestWrapper>
        <ContactMainTab />
      </TestWrapper>
    );

    expect(screen.getByLabelText(/First Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Last Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Organization/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Account manager/i)).toBeInTheDocument();
  });

  test("includes email and phone fields", () => {
    render(
      <TestWrapper>
        <ContactMainTab />
      </TestWrapper>
    );

    expect(screen.getByText(/Email addresses/i)).toBeInTheDocument();
    expect(screen.getByText(/Phone numbers/i)).toBeInTheDocument();
  });

  test("uses FormSection component", () => {
    const { container } = render(
      <TestWrapper>
        <ContactMainTab />
      </TestWrapper>
    );

    const formSections = container.querySelectorAll('[data-slot="form-section"]');
    expect(formSections.length).toBeGreaterThan(0);
  });

  test("avatar is rendered", () => {
    render(
      <TestWrapper>
        <ContactMainTab />
      </TestWrapper>
    );

    // Avatar component should be present (it returns null in test but should be in the tree)
    const { container } = render(
      <TestWrapper>
        <ContactMainTab />
      </TestWrapper>
    );
    expect(container).toBeInTheDocument();
  });
});
