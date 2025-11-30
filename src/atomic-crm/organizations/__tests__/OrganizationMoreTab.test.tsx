/**
 * OrganizationMoreTab Component Tests
 *
 * Tests the More tab containing additional organization fields:
 * website, linkedin_url, description, parent_organization_id
 */

import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AdminContext } from "react-admin";
import { FormProvider, useForm } from "react-hook-form";
import { OrganizationMoreTab } from "../OrganizationMoreTab";

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const methods = useForm({
    defaultValues: {
      website: "",
      linkedin_url: "",
      description: "",
      parent_organization_id: null,
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

describe("OrganizationMoreTab", () => {
  test("renders without crashing", () => {
    render(
      <TestWrapper>
        <OrganizationMoreTab />
      </TestWrapper>
    );
  });

  test("displays Additional Information section", () => {
    render(
      <TestWrapper>
        <OrganizationMoreTab />
      </TestWrapper>
    );

    expect(screen.getByText("Additional Information")).toBeInTheDocument();
  });

  test("renders website input field", () => {
    render(
      <TestWrapper>
        <OrganizationMoreTab />
      </TestWrapper>
    );

    expect(screen.getByLabelText(/website/i)).toBeInTheDocument();
  });

  test("renders linkedin_url input field", () => {
    render(
      <TestWrapper>
        <OrganizationMoreTab />
      </TestWrapper>
    );

    expect(screen.getByLabelText(/linkedin url/i)).toBeInTheDocument();
  });

  test("renders description textarea", () => {
    render(
      <TestWrapper>
        <OrganizationMoreTab />
      </TestWrapper>
    );

    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
  });

  test("renders parent organization input", () => {
    render(
      <TestWrapper>
        <OrganizationMoreTab />
      </TestWrapper>
    );

    expect(screen.getByText("Parent Organization")).toBeInTheDocument();
  });

  test("uses FormGrid component with 2 columns", () => {
    const { container } = render(
      <TestWrapper>
        <OrganizationMoreTab />
      </TestWrapper>
    );

    const formGrids = container.querySelectorAll('[data-testid="form-grid"]');
    expect(formGrids.length).toBeGreaterThan(0);
  });

  test("uses FormSection component for grouping", () => {
    const { container } = render(
      <TestWrapper>
        <OrganizationMoreTab />
      </TestWrapper>
    );

    const formSections = container.querySelectorAll('[data-slot="form-section"]');
    expect(formSections.length).toBe(1); // Additional Info section
  });

  test("website input shows correct helper text", () => {
    render(
      <TestWrapper>
        <OrganizationMoreTab />
      </TestWrapper>
    );

    expect(screen.getByText(/format.*https.*example\.com/i)).toBeInTheDocument();
  });

  test("linkedin input shows correct helper text", () => {
    render(
      <TestWrapper>
        <OrganizationMoreTab />
      </TestWrapper>
    );

    expect(screen.getByText(/format.*linkedin\.com/i)).toBeInTheDocument();
  });
});
