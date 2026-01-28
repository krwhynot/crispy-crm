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
    const label = screen.getByText("Playbook Category");
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

    // Wait for validation error to appear (via FormError component with role="alert")
    await waitFor(() => {
      const errorElement = document.querySelector('[role="alert"]');
      expect(errorElement).toBeInTheDocument();
      expect(errorElement).toHaveTextContent("Segment is required");
    });

    // Verify form was not submitted
    expect(onSubmit).not.toHaveBeenCalled();
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
    expect(trigger).toHaveTextContent("Select playbook category...");

    await user.click(trigger);

    // Verify Playbook categories are displayed
    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Major Broadline" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "Specialty/Regional" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "GPO" })).toBeInTheDocument();
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
    expect(trigger).toHaveTextContent("Select operator segment...");

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
    expect(trigger).toHaveTextContent("Select playbook category...");

    await user.click(trigger);

    // Verify Playbook categories are displayed (same as distributors)
    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Major Broadline" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "University" })).toBeInTheDocument();
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
    expect(trigger).toHaveTextContent("Select operator segment...");

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
    let trigger = screen.getByRole("combobox");
    expect(trigger).toHaveTextContent("Select playbook category...");

    // Verify Playbook categories available
    await user.click(trigger);
    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Major Broadline" })).toBeInTheDocument();
    });

    // Close dropdown by clicking outside
    await user.keyboard("{Escape}");

    // Change organization_type to customer
    rerender(
      <FormWrapper defaultValues={{ organization_type: "customer" }}>
        <SegmentComboboxInput source="segment_id" />
      </FormWrapper>
    );

    // Wait for component to re-render with new choices
    await waitFor(() => {
      trigger = screen.getByRole("combobox");
      expect(trigger).toHaveTextContent("Select operator segment...");
    });

    // Open dropdown with new organization type
    await user.click(trigger);

    // Now shows Operator segments
    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Full-Service Restaurant" })).toBeInTheDocument();
      expect(screen.queryByRole("option", { name: "Major Broadline" })).not.toBeInTheDocument();
    });
  });
});
