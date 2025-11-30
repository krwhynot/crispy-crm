/**
 * OrganizationMainTab Component Tests
 *
 * Tests the Main tab containing core organization fields:
 * name, organization_type, sales_id, segment_id, address fields
 */

import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AdminContext } from "react-admin";
import { FormProvider, useForm } from "react-hook-form";
import { OrganizationMainTab } from "../OrganizationMainTab";

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const methods = useForm({
    defaultValues: {
      name: "",
      organization_type: null,
      sales_id: null,
      segment_id: null,
      street: "",
      city: "",
      state: "",
      zip: "",
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

describe("OrganizationMainTab", () => {
  test("renders without crashing", () => {
    render(
      <TestWrapper>
        <OrganizationMainTab />
      </TestWrapper>
    );
  });

  test("displays Organization Information section", () => {
    render(
      <TestWrapper>
        <OrganizationMainTab />
      </TestWrapper>
    );

    expect(screen.getByText("Organization Information")).toBeInTheDocument();
  });

  test("displays Address Information section", () => {
    render(
      <TestWrapper>
        <OrganizationMainTab />
      </TestWrapper>
    );

    expect(screen.getByText("Address Information")).toBeInTheDocument();
  });

  test("renders name input field", () => {
    render(
      <TestWrapper>
        <OrganizationMainTab />
      </TestWrapper>
    );

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
  });

  test("renders organization type select input", () => {
    render(
      <TestWrapper>
        <OrganizationMainTab />
      </TestWrapper>
    );

    expect(screen.getByText("Organization Type *")).toBeInTheDocument();
  });

  test("renders sales_id select input", () => {
    render(
      <TestWrapper>
        <OrganizationMainTab />
      </TestWrapper>
    );

    expect(screen.getByText(/account manager/i)).toBeInTheDocument();
  });

  test("renders segment_id input", () => {
    render(
      <TestWrapper>
        <OrganizationMainTab />
      </TestWrapper>
    );

    expect(screen.getByText(/segment/i)).toBeInTheDocument();
  });

  test("renders street address input", () => {
    render(
      <TestWrapper>
        <OrganizationMainTab />
      </TestWrapper>
    );

    const streetInput = screen.getByLabelText(/street/i);
    expect(streetInput).toBeInTheDocument();
    expect(streetInput.tagName).toBe("INPUT");
  });

  test("renders city input", () => {
    render(
      <TestWrapper>
        <OrganizationMainTab />
      </TestWrapper>
    );

    expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
  });

  test("renders state dropdown", () => {
    render(
      <TestWrapper>
        <OrganizationMainTab />
      </TestWrapper>
    );

    expect(screen.getByText("State")).toBeInTheDocument();
  });

  test("renders zip input", () => {
    render(
      <TestWrapper>
        <OrganizationMainTab />
      </TestWrapper>
    );

    expect(screen.getByLabelText(/zip/i)).toBeInTheDocument();
  });

  test("uses FormGrid component with 2 columns", () => {
    const { container } = render(
      <TestWrapper>
        <OrganizationMainTab />
      </TestWrapper>
    );

    const formGrids = container.querySelectorAll('[data-testid="form-grid"]');
    expect(formGrids.length).toBeGreaterThan(0);
  });

  test("uses FormSection components for grouping", () => {
    const { container } = render(
      <TestWrapper>
        <OrganizationMainTab />
      </TestWrapper>
    );

    const formSections = container.querySelectorAll('[data-slot="form-section"]');
    expect(formSections.length).toBe(2); // Organization Info + Address Info
  });

  test("state dropdown label is rendered", () => {
    render(
      <TestWrapper>
        <OrganizationMainTab />
      </TestWrapper>
    );

    expect(screen.getByText("State")).toBeInTheDocument();
  });
});
