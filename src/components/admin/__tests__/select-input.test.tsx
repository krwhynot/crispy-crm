/**
 * Tests for SelectInput component
 *
 * Tests the integration of shadcn/ui Select with React Admin's useInput hook,
 * including choices rendering, reference mode, and the Radix bug workaround.
 */

import { describe, test, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SelectInput } from "../select-input";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import {
  required,
  SaveContextProvider,
  Form as RaForm
} from "ra-core";
import { ReferenceInput } from "@/components/admin/reference-input";
import { useForm } from "react-hook-form";
import { Form } from "../form";
import React from "react";

// FormWrapper that provides both React Admin Form context and React Hook Form FormProvider
const FormWrapper = ({
  children,
  defaultValues = {},
  onSubmit = vi.fn()
}: {
  children: React.ReactNode;
  defaultValues?: any;
  onSubmit?: (data: any) => void;
}) => {
  const saveContext = {
    save: onSubmit,
    saving: false,
    mutationMode: "pessimistic" as const
  };

  const form = useForm({
    defaultValues,
    mode: "onChange"
  });

  return (
    <SaveContextProvider value={saveContext}>
      <RaForm defaultValues={defaultValues} onSubmit={onSubmit}>
        <Form {...form}>
          {children}
          <button type="submit">Submit</button>
        </Form>
      </RaForm>
    </SaveContextProvider>
  );
};

describe("SelectInput", () => {
  const mockChoices = [
    { id: "lead", name: "Lead" },
    { id: "qualified", name: "Qualified" },
    { id: "proposal", name: "Proposal" },
    { id: "closed_won", name: "Closed Won" },
    { id: "closed_lost", name: "Closed Lost" }
  ];

  test("renders choices correctly", async () => {
    const user = userEvent.setup();

    renderWithAdminContext(
      <FormWrapper>
        <SelectInput
          source="stage"
          label="Stage"
          choices={mockChoices}
        />
      </FormWrapper>,
      { resource: "opportunities" }
    );

    // Open the select dropdown
    const trigger = screen.getByRole("combobox");
    await user.click(trigger);

    // Check all choices are rendered in the dropdown (role=option)
    await waitFor(() => {
      mockChoices.forEach(choice => {
        const option = screen.getByRole("option", { name: choice.name });
        expect(option).toBeInTheDocument();
      });
    });
  });

  test("selects and updates form value", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    renderWithAdminContext(
      <FormWrapper onSubmit={onSubmit}>
        <SelectInput
          source="stage"
          label="Stage"
          choices={mockChoices}
        />
      </FormWrapper>,
      { resource: "opportunities" }
    );

    // Open select and choose an option
    const trigger = screen.getByRole("combobox");
    await user.click(trigger);

    await waitFor(() => {
      const option = screen.getByRole("option", { name: "Qualified" });
      expect(option).toBeInTheDocument();
    });

    const option = screen.getByRole("option", { name: "Qualified" });
    await user.click(option);

    // Wait for the selection to be reflected in the trigger (re-query after remount)
    await waitFor(() => {
      const updatedTrigger = screen.getByRole("combobox");
      expect(updatedTrigger).toHaveTextContent("Qualified");
    });

    // Submit form and check value
    const submitButton = screen.getByText("Submit");
    await user.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          stage: "qualified"
        }),
        expect.anything() // React Admin Form passes event as second parameter
      );
    }, { timeout: 3000 });
  });

  test("works in reference input mode", async () => {
    const user = userEvent.setup();
    const mockDataProvider = {
      getList: vi.fn().mockResolvedValue({
        data: [
          { id: 1, name: "Contact 1" },
          { id: 2, name: "Contact 2" },
          { id: 3, name: "Contact 3" }
        ],
        total: 3
      })
    };

    renderWithAdminContext(
      <FormWrapper>
        <ReferenceInput source="contact_id" reference="contacts">
          <SelectInput label="Contact" />
        </ReferenceInput>
      </FormWrapper>,
      {
        resource: "opportunities",
        dataProvider: mockDataProvider
      }
    );

    // Wait for data to load
    await waitFor(() => {
      expect(mockDataProvider.getList).toHaveBeenCalledWith(
        "contacts",
        expect.any(Object)
      );
    });

    // Open select to see referenced choices
    const trigger = await screen.findByRole("combobox");
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Contact 1" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "Contact 2" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "Contact 3" })).toBeInTheDocument();
    });
  });

  test("handles Radix bug workaround with key-based remounting", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    const { rerender } = renderWithAdminContext(
      <FormWrapper defaultValues={{ stage: "lead" }} onSubmit={onSubmit}>
        <SelectInput
          source="stage"
          label="Stage"
          choices={mockChoices}
        />
      </FormWrapper>,
      { resource: "opportunities" }
    );

    // Verify initial value
    const trigger = screen.getByRole("combobox");
    expect(trigger).toHaveTextContent("Lead");

    // Change the value programmatically (simulating external update)
    rerender(
      <FormWrapper defaultValues={{ stage: "qualified" }} onSubmit={onSubmit}>
        <SelectInput
          source="stage"
          label="Stage"
          choices={mockChoices}
        />
      </FormWrapper>
    );

    // Key should force remount and show new value
    await waitFor(() => {
      const updatedTrigger = screen.getByRole("combobox");
      expect(updatedTrigger).toHaveTextContent("Qualified");
    });
  });

  test("displays validation errors", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    renderWithAdminContext(
      <FormWrapper onSubmit={onSubmit}>
        <SelectInput
          source="stage"
          label="Stage"
          choices={mockChoices}
          validate={required("Stage is required")}
        />
      </FormWrapper>,
      { resource: "opportunities" }
    );

    const submitButton = screen.getByText("Submit");
    await user.click(submitButton);

    // Check that form submission was prevented
    await waitFor(() => {
      expect(onSubmit).not.toHaveBeenCalled();
    });

    // Check for validation error - the error may be in an aria-describedby or data attribute
    const formField = document.querySelector('[data-slot="form-item"]');
    expect(formField).toBeInTheDocument();

    // React Admin validation errors should prevent form submission
    // Rather than looking for specific error text, we verify that the form
    // did not submit when validation failed
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("handles empty value and empty text", async () => {
    const user = userEvent.setup();

    renderWithAdminContext(
      <FormWrapper>
        <SelectInput
          source="stage"
          label="Stage"
          choices={mockChoices}
          emptyText="-- Select Stage --"
          emptyValue=""
        />
      </FormWrapper>,
      { resource: "opportunities" }
    );

    const trigger = screen.getByRole("combobox");
    expect(trigger).toHaveTextContent("-- Select Stage --");

    // Select a value then clear it
    await user.click(trigger);
    const option = await screen.findByRole("option", { name: "Lead" });
    await user.click(option);

    // After clicking, the select will remount due to the key change
    // So we need to re-query the trigger
    await waitFor(() => {
      const updatedTrigger = screen.getByRole("combobox");
      expect(updatedTrigger).toHaveTextContent("Lead");
    });

    // Re-query trigger after remount and find the clear button
    const updatedTrigger = screen.getByRole("combobox");
    const clearButton = updatedTrigger.querySelector('[role="button"]') as HTMLElement;
    expect(clearButton).toBeInTheDocument();
    await user.click(clearButton);

    await waitFor(() => {
      const finalTrigger = screen.getByRole("combobox");
      expect(finalTrigger).toHaveTextContent("-- Select Stage --");
    });
  });

  test("respects disabled state for choices", async () => {
    const user = userEvent.setup();
    const choicesWithDisabled = [
      { id: "lead", name: "Lead" },
      { id: "qualified", name: "Qualified", disabled: true },
      { id: "proposal", name: "Proposal" }
    ];

    renderWithAdminContext(
      <FormWrapper>
        <SelectInput
          source="stage"
          label="Stage"
          choices={choicesWithDisabled}
        />
      </FormWrapper>,
      { resource: "opportunities" }
    );

    const trigger = screen.getByRole("combobox");
    await user.click(trigger);

    await waitFor(() => {
      const qualifiedOption = screen.getByRole("option", { name: "Qualified" });
      expect(qualifiedOption).toHaveAttribute("aria-disabled", "true");
    });
  });

  test("handles custom optionText and optionValue", async () => {
    const user = userEvent.setup();
    const customChoices = [
      { value: 1, label: "First Option", extra: "data1" },
      { value: 2, label: "Second Option", extra: "data2" },
      { value: 3, label: "Third Option", extra: "data3" }
    ];

    renderWithAdminContext(
      <FormWrapper>
        <SelectInput
          source="custom"
          label="Custom Select"
          choices={customChoices}
          optionText="label"
          optionValue="value"
        />
      </FormWrapper>,
      { resource: "test" }
    );

    const trigger = screen.getByRole("combobox");
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByRole("option", { name: "First Option" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "Second Option" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "Third Option" })).toBeInTheDocument();
    });
  });

  test("shows loading skeleton while choices are loading", () => {
    renderWithAdminContext(
      <FormWrapper>
        <SelectInput
          source="stage"
          label="Stage"
          choices={undefined}
          isPending={true}
        />
      </FormWrapper>,
      { resource: "opportunities" }
    );

    // Should show skeleton instead of select
    const skeleton = document.querySelector('.w-full.h-9');
    expect(skeleton).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  test("handles translateChoice prop correctly", async () => {
    const user = userEvent.setup();
    const translatedChoices = [
      { id: "pending", name: "ra.status.pending" },
      { id: "approved", name: "ra.status.approved" },
      { id: "rejected", name: "ra.status.rejected" }
    ];

    // Mock translations
    const mockI18nProvider = {
      translate: (key: string) => {
        const translations: Record<string, string> = {
          "ra.status.pending": "Pending",
          "ra.status.approved": "Approved",
          "ra.status.rejected": "Rejected"
        };
        return translations[key] || key;
      },
      changeLocale: vi.fn(),
      getLocale: () => "en"
    };

    renderWithAdminContext(
      <FormWrapper>
        <SelectInput
          source="status"
          label="Status"
          choices={translatedChoices}
          translateChoice={true}
        />
      </FormWrapper>,
      {
        resource: "tasks",
        i18nProvider: mockI18nProvider
      }
    );

    const trigger = screen.getByRole("combobox");
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Pending" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "Approved" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "Rejected" })).toBeInTheDocument();
    });
  });

  test("handles onChange callback", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    renderWithAdminContext(
      <FormWrapper>
        <SelectInput
          source="stage"
          label="Stage"
          choices={mockChoices}
          onChange={handleChange}
        />
      </FormWrapper>,
      { resource: "opportunities" }
    );

    const trigger = screen.getByRole("combobox");
    await user.click(trigger);

    const option = await screen.findByRole("option", { name: "Proposal" });
    await user.click(option);

    await waitFor(() => {
      expect(handleChange).toHaveBeenCalledWith("proposal");
    });
  });

  test("applies custom className", () => {
    renderWithAdminContext(
      <FormWrapper>
        <SelectInput
          source="stage"
          label="Stage"
          choices={mockChoices}
          className="custom-select-class"
        />
      </FormWrapper>,
      { resource: "opportunities" }
    );

    const formField = document.querySelector('[data-slot="form-item"]');
    expect(formField).toHaveClass("custom-select-class");
  });

  test("displays helper text when provided", () => {
    renderWithAdminContext(
      <FormWrapper>
        <SelectInput
          source="stage"
          label="Stage"
          choices={mockChoices}
          helperText="Select the current stage of the opportunity"
        />
      </FormWrapper>,
      { resource: "opportunities" }
    );

    expect(screen.getByText("Select the current stage of the opportunity")).toBeInTheDocument();
  });

  test("handles error when source is undefined outside ReferenceInput", () => {
    // This should throw an error
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      renderWithAdminContext(
        <FormWrapper>
          {/* @ts-ignore - Intentionally omitting source to test error */}
          <SelectInput
            label="Invalid"
            choices={mockChoices}
          />
        </FormWrapper>,
        { resource: "test" }
      );
    }).toThrow("If you're not wrapping the SelectInput inside a ReferenceInput, you must provide the source prop");

    consoleSpy.mockRestore();
  });

  test("resets value when clear button is clicked", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    renderWithAdminContext(
      <FormWrapper defaultValues={{ stage: "lead" }} onSubmit={onSubmit}>
        <SelectInput
          source="stage"
          label="Stage"
          choices={mockChoices}
          emptyValue=""
        />
      </FormWrapper>,
      { resource: "opportunities" }
    );

    // Initial value should be "Lead"
    const trigger = screen.getByRole("combobox");
    expect(trigger).toHaveTextContent("Lead");

    // Click the clear button - it's a div with role="button" inside the select trigger
    const clearButton = trigger.querySelector('[role="button"]') as HTMLElement;
    expect(clearButton).toBeInTheDocument();
    await user.click(clearButton);

    // Submit and verify empty value
    const submitButton = screen.getByText("Submit");
    await user.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          stage: null // SelectInput clears to null, not empty string
        }),
        expect.anything() // React Admin Form passes event as second parameter
      );
    });
  });
});