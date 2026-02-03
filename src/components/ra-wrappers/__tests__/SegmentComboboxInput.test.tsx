/**
 * Tests for SegmentComboboxInput component
 *
 * Tests conditional segment selection based on organization type:
 * - Distributors/Principals: 9 fixed Playbook categories
 * - Customers/Prospects/Unknown: Operator segments
 *
 * Verifies required field validation and form integration.
 */

import { describe, test, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SegmentComboboxInput } from "../SegmentComboboxInput";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { SaveContextProvider } from "ra-core";
import { useForm } from "react-hook-form";
import { Form } from "../form";
import React from "react";

// FormWrapper that provides both React Admin Form context and React Hook Form FormProvider
const FormWrapper = ({
  children,
  defaultValues = {},
  onSubmit = vi.fn(),
}: {
  children: React.ReactNode;
  defaultValues?: Record<string, unknown>;
  onSubmit?: (data: Record<string, unknown>) => void;
}) => {
  const saveContext = {
    save: onSubmit,
    saving: false,
    mutationMode: "pessimistic" as const,
  };

  const form = useForm({
    defaultValues,
    mode: "onSubmit",
  });

  // Reset form when defaultValues change - using JSON.stringify for deep comparison
  React.useEffect(() => {
    form.reset(defaultValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(defaultValues)]);

  return (
    <SaveContextProvider value={saveContext}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {children}
          <button type="submit">Submit</button>
        </form>
      </Form>
    </SaveContextProvider>
  );
};

describe("SegmentComboboxInput", () => {
  test("marks segment as required with visual indicator", () => {
    renderWithAdminContext(
      <FormWrapper defaultValues={{ organization_type: "distributor" }}>
        <SegmentComboboxInput source="segment_id" />
      </FormWrapper>,
      { resource: "organizations" }
    );

    // Check for required indicator (asterisk) in label
    const label = screen.getByText("Category");
    expect(label).toBeInTheDocument();

    // Required fields show asterisk via aria-hidden span
    const labelElement = label.closest("label");
    expect(labelElement).toBeInTheDocument();
    const asterisk = labelElement?.querySelector('[aria-hidden="true"]');
    expect(asterisk).toBeInTheDocument();
    expect(asterisk).toHaveTextContent("*");
  });

  test("shows validation error when form submitted without selection", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    renderWithAdminContext(
      <FormWrapper defaultValues={{ organization_type: "customer" }} onSubmit={onSubmit}>
        <SegmentComboboxInput source="segment_id" />
      </FormWrapper>,
      { resource: "organizations" }
    );

    // Submit form without selecting segment
    const submitButton = screen.getByText("Submit");
    await user.click(submitButton);

    // Wait for validation to trigger and prevent submission
    await waitFor(() => {
      // Verify form was not submitted due to validation
      expect(onSubmit).not.toHaveBeenCalled();
    });

    // Verify aria-invalid is set on the form control
    const formControl = document.querySelector('[data-slot="form-control"]');
    expect(formControl).toHaveAttribute("aria-invalid", "true");
  });

  test("allows submission when valid segment selected", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    renderWithAdminContext(
      <FormWrapper defaultValues={{ organization_type: "distributor" }} onSubmit={onSubmit}>
        <SegmentComboboxInput source="segment_id" />
      </FormWrapper>,
      { resource: "organizations" }
    );

    // Open select and choose Playbook category
    const trigger = screen.getByRole("combobox");
    await user.click(trigger);

    await waitFor(() => {
      const option = screen.getByRole("option", { name: "Major Broadline" });
      expect(option).toBeInTheDocument();
    });

    const option = screen.getByRole("option", { name: "Major Broadline" });
    await user.click(option);

    // Wait for selection to be reflected
    await waitFor(() => {
      const updatedTrigger = screen.getByRole("combobox");
      expect(updatedTrigger).toHaveTextContent("Major Broadline");
    });

    // Submit form
    const submitButton = screen.getByText("Submit");
    await user.click(submitButton);

    // Verify submission succeeded with valid segment_id
    await waitFor(
      () => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            segment_id: "22222222-2222-4222-8222-000000000001", // Major Broadline UUID
            organization_type: "distributor",
          }),
          expect.anything() // React Admin Form passes event as second parameter
        );
      },
      { timeout: 3000 }
    );
  });

  test("shows Playbook categories for distributors", async () => {
    const user = userEvent.setup();

    renderWithAdminContext(
      <FormWrapper defaultValues={{ organization_type: "distributor" }}>
        <SegmentComboboxInput source="segment_id" />
      </FormWrapper>,
      { resource: "organizations" }
    );

    const trigger = screen.getByRole("combobox");
    expect(trigger).toHaveTextContent("Select category...");

    await user.click(trigger);

    // Verify only distributor-specific categories are displayed (Major Broadline and Specialty/Regional only)
    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Major Broadline" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "Specialty/Regional" })).toBeInTheDocument();
    });
  });

  test("shows Operator segments for customers", async () => {
    const user = userEvent.setup();

    renderWithAdminContext(
      <FormWrapper defaultValues={{ organization_type: "customer" }}>
        <SegmentComboboxInput source="segment_id" />
      </FormWrapper>,
      { resource: "organizations" }
    );

    const trigger = screen.getByRole("combobox");
    expect(trigger).toHaveTextContent("Select category...");

    await user.click(trigger);

    // Verify Operator segments are displayed
    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Full-Service Restaurant" })).toBeInTheDocument();
      expect(
        screen.getByRole("option", { name: "Limited-Service Restaurant" })
      ).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "Healthcare" })).toBeInTheDocument();
    });
  });

  test("shows Playbook categories for principals", async () => {
    const user = userEvent.setup();

    renderWithAdminContext(
      <FormWrapper defaultValues={{ organization_type: "principal" }}>
        <SegmentComboboxInput source="segment_id" />
      </FormWrapper>,
      { resource: "organizations" }
    );

    const trigger = screen.getByRole("combobox");
    expect(trigger).toHaveTextContent("Select category...");

    await user.click(trigger);

    // Verify only Principal/Manufacturer category is displayed (principals get this segment only)
    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Principal/Manufacturer" })).toBeInTheDocument();
    });
  });

  test("shows Operator segments for prospects", async () => {
    const user = userEvent.setup();

    renderWithAdminContext(
      <FormWrapper defaultValues={{ organization_type: "prospect" }}>
        <SegmentComboboxInput source="segment_id" />
      </FormWrapper>,
      { resource: "organizations" }
    );

    const trigger = screen.getByRole("combobox");
    expect(trigger).toHaveTextContent("Select category...");

    await user.click(trigger);

    // Verify Operator segments are displayed (same as customers)
    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Full-Service Restaurant" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "Education - K-12" })).toBeInTheDocument();
    });
  });

  test("switches segment choices when organization_type changes", async () => {
    const user = userEvent.setup();

    const { rerender } = renderWithAdminContext(
      <FormWrapper defaultValues={{ organization_type: "distributor" }}>
        <SegmentComboboxInput source="segment_id" />
      </FormWrapper>,
      { resource: "organizations" }
    );

    // Initially shows Playbook category placeholder
    const trigger = screen.getByRole("combobox");
    expect(trigger).toHaveTextContent("Select category...");

    // Verify Playbook categories available by checking hidden select element
    const hiddenSelect = document.querySelector("select[aria-hidden='true']");
    expect(hiddenSelect).toBeInTheDocument();
    expect(hiddenSelect?.textContent).toContain("Major Broadline");

    // Change organization_type to customer
    rerender(
      <FormWrapper defaultValues={{ organization_type: "customer" }}>
        <SegmentComboboxInput source="segment_id" />
      </FormWrapper>
    );

    // Wait for component to re-render (placeholder stays the same: "Select category...")
    await waitFor(() => {
      const updatedTrigger = screen.getByRole("combobox");
      expect(updatedTrigger).toHaveTextContent("Select category...");
    });

    // Verify Operator segments now available in hidden select
    await waitFor(() => {
      const updatedSelect = document.querySelector("select[aria-hidden='true']");
      expect(updatedSelect?.textContent).toContain("Full-Service Restaurant");
      expect(updatedSelect?.textContent).not.toContain("Major Broadline");
    });
  });

  test("rejects invalid segment_id that doesn't exist in choices", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    renderWithAdminContext(
      <FormWrapper
        defaultValues={{
          organization_type: "distributor",
          segment_id: "00000000-0000-0000-0000-000000000000", // Invalid UUID
        }}
        onSubmit={onSubmit}
      >
        <SegmentComboboxInput source="segment_id" />
      </FormWrapper>,
      { resource: "organizations" }
    );

    // Submit form with invalid segment_id
    const submitButton = screen.getByText("Submit");
    await user.click(submitButton);

    // Verify validation error prevents submission
    await waitFor(() => {
      expect(onSubmit).not.toHaveBeenCalled();
    });

    // Verify error message displayed
    await waitFor(() => {
      const errorMessage = screen.getByText(/not valid for this organization type/i);
      expect(errorMessage).toBeInTheDocument();
    });
  });

  test("rejects Operator segment when organization is distributor", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    renderWithAdminContext(
      <FormWrapper
        defaultValues={{
          organization_type: "distributor",
          segment_id: "33333333-3333-4333-8333-000000000001", // Full-Service Restaurant (Operator)
        }}
        onSubmit={onSubmit}
      >
        <SegmentComboboxInput source="segment_id" />
      </FormWrapper>,
      { resource: "organizations" }
    );

    // Submit form with wrong segment type
    const submitButton = screen.getByText("Submit");
    await user.click(submitButton);

    // Verify validation blocks submission
    await waitFor(() => {
      expect(onSubmit).not.toHaveBeenCalled();
    });

    // Verify custom validation error
    await waitFor(() => {
      const errorMessage = screen.getByText(/not valid for this organization type/i);
      expect(errorMessage).toBeInTheDocument();
    });
  });

  test("rejects Playbook category when organization is customer", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    renderWithAdminContext(
      <FormWrapper
        defaultValues={{
          organization_type: "customer",
          segment_id: "22222222-2222-4222-8222-000000000001", // Major Broadline (Playbook)
        }}
        onSubmit={onSubmit}
      >
        <SegmentComboboxInput source="segment_id" />
      </FormWrapper>,
      { resource: "organizations" }
    );

    // Submit form with wrong segment type
    const submitButton = screen.getByText("Submit");
    await user.click(submitButton);

    // Verify validation prevents submission
    await waitFor(() => {
      expect(onSubmit).not.toHaveBeenCalled();
    });

    // Verify error displayed
    await waitFor(() => {
      const errorMessage = screen.getByText(/not valid for this organization type/i);
      expect(errorMessage).toBeInTheDocument();
    });
  });
});
