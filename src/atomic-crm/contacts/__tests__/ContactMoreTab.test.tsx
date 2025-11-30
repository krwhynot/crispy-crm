import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AdminContext } from "react-admin";
import { FormProvider, useForm } from "react-hook-form";
import { ContactMoreTab } from "../ContactMoreTab";

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

describe("ContactMoreTab", () => {
  test("renders more tab fields", () => {
    render(
      <TestWrapper>
        <ContactMoreTab />
      </TestWrapper>
    );

    expect(screen.getByLabelText(/Title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Department/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/LinkedIn URL/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Notes/i)).toBeInTheDocument();
  });

  test("uses FormSection component", () => {
    const { container } = render(
      <TestWrapper>
        <ContactMoreTab />
      </TestWrapper>
    );

    const formSections = container.querySelectorAll('[data-slot="form-section"]');
    expect(formSections.length).toBeGreaterThan(0);
  });

  test("notes field is multiline", () => {
    render(
      <TestWrapper>
        <ContactMoreTab />
      </TestWrapper>
    );

    const notesField = screen.getByLabelText(/Notes/i);
    expect(notesField.tagName).toBe("TEXTAREA");
  });
});
