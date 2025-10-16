/**
 * Tests for SelectInput component
 *
 * Tests the integration of shadcn/ui Select with React Admin's useInput hook,
 * including choices rendering, reference mode, and the Radix bug workaround.
 */

import { describe, test, expect, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SelectInput } from "../select-input";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import {
  required,
  ReferenceInput,
  Form as RaForm,
  CreateBase
} from "ra-core";
import React from "react";

// Wrapper component to provide all necessary contexts for testing
// Use CreateBase and React Admin's Form to set up all contexts properly
const FormWrapper = ({
  children,
  defaultValues = {},
  onSubmit = vi.fn(),
  resource = "test"
}: {
  children: React.ReactNode;
  defaultValues?: any;
  onSubmit?: (data: any) => void;
  resource?: string;
}) => {
  return (
    <CreateBase resource={resource} record={defaultValues}>
      <RaForm defaultValues={defaultValues} onSubmit={onSubmit}>
        {children}
        <button type="submit">Submit</button>
      </RaForm>
    </CreateBase>
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
      <FormWrapper resource="opportunities">
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

    // Check all choices are rendered
    await waitFor(() => {
      mockChoices.forEach(choice => {
        expect(screen.getByText(choice.name)).toBeInTheDocument();
      });
    });
  });

  test("selects and updates form value", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    renderWithAdminContext(
      <FormWrapper resource="opportunities" onSubmit={onSubmit}>
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
      const option = screen.getByText("Qualified");
      expect(option).toBeInTheDocument();
    });

    const option = screen.getByText("Qualified");
    await user.click(option);

    // Submit form and check value
    const submitButton = screen.getByText("Submit");
    await user.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          stage: "qualified"
        })
      );
    });
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
      <FormWrapper resource="opportunities">
        <ReferenceInput source="contact_id" reference="contacts">
          <SelectInput label="Contact" />
        </ReferenceInput>
      </FormWrapper>,
      {
        resource: "opportunities",
        dataProvider: mockDataProvider
      },
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
      expect(screen.getByText("Contact 1")).toBeInTheDocument();
      expect(screen.getByText("Contact 2")).toBeInTheDocument();
      expect(screen.getByText("Contact 3")).toBeInTheDocument();
    });
  });

  test("handles Radix bug workaround with key-based remounting", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    const { rerender } = renderWithAdminContext(
      <FormWrapper resource="opportunities" defaultValues={{ stage: "lead" }} onSubmit={onSubmit}>
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
      <FormWrapper resource="opportunities" defaultValues={{ stage: "qualified" }} onSubmit={onSubmit}>
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

    renderWithAdminContext(
      <FormWrapper resource="opportunities">
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

    await waitFor(() => {
      expect(screen.getByText("Stage is required")).toBeInTheDocument();
    });
  });

  test("handles empty value and empty text", async () => {
    const user = userEvent.setup();

    renderWithAdminContext(
      <FormWrapper resource="opportunities">
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
    const option = await screen.findByText("Lead");
    await user.click(option);

    await waitFor(() => {
      expect(trigger).toHaveTextContent("Lead");
    });

    // Click the clear button (X icon)
    const clearButton = screen.getByRole("button");
    await user.click(clearButton);

    await waitFor(() => {
      expect(trigger).toHaveTextContent("-- Select Stage --");
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
      <FormWrapper resource="opportunities">
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
      const qualifiedOption = screen.getByText("Qualified").closest('[role="option"]');
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
      <FormWrapper resource="opportunities">
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
      expect(screen.getByText("First Option")).toBeInTheDocument();
      expect(screen.getByText("Second Option")).toBeInTheDocument();
      expect(screen.getByText("Third Option")).toBeInTheDocument();
    });
  });

  test("shows loading skeleton while choices are loading", () => {
    renderWithAdminContext(
      <FormWrapper resource="opportunities">
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
      <FormWrapper resource="opportunities">
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
      },
    );

    const trigger = screen.getByRole("combobox");
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText("Pending")).toBeInTheDocument();
      expect(screen.getByText("Approved")).toBeInTheDocument();
      expect(screen.getByText("Rejected")).toBeInTheDocument();
    });
  });

  test("handles onChange callback", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    renderWithAdminContext(
      <FormWrapper resource="opportunities">
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

    const option = await screen.findByText("Proposal");
    await user.click(option);

    await waitFor(() => {
      expect(handleChange).toHaveBeenCalledWith("proposal");
    });
  });

  test("applies custom className", () => {
    renderWithAdminContext(
      <FormWrapper resource="opportunities">
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
      <FormWrapper resource="opportunities">
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
        <FormWrapper resource="opportunities">
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
      <FormWrapper resource="opportunities" defaultValues={{ stage: "lead" }} onSubmit={onSubmit}>
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

    // Click the clear button
    const clearButton = screen.getByRole("button");
    await user.click(clearButton);

    // Submit and verify empty value
    const submitButton = screen.getByText("Submit");
    await user.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          stage: ""
        })
      );
    });
  });
});