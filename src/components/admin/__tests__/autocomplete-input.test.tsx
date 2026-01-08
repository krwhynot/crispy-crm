/**
 * Tests for AutocompleteInput component
 *
 * Tests the integration of shadcn/ui Command with React Admin's useInput hook,
 * including choice handling, create suggestion support, reference mode, and accessibility.
 */

import { describe, test, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AutocompleteInput } from "../autocomplete-input";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { SaveContextProvider } from "ra-core";
import { ReferenceInput } from "@/components/admin/reference-input";
import { useForm } from "react-hook-form";
import { Form } from "../form";
import React from "react";

const FormWrapper = ({
  children,
  defaultValues = {},
  onSubmit = vi.fn(),
}: {
  children: React.ReactNode;
  defaultValues?: any;
  onSubmit?: (data: any) => void;
}) => {
  const saveContext = {
    save: onSubmit,
    saving: false,
    mutationMode: "pessimistic" as const,
  };

  const form = useForm({
    defaultValues,
    mode: "onChange",
  });

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

describe("AutocompleteInput", () => {
  beforeAll(() => {
    vi.setConfig({ testTimeout: 15000 });
  });

  const mockChoices = [
    { id: "new_lead", name: "New Lead" },
    { id: "initial_outreach", name: "Initial Outreach" },
    { id: "sample_visit_offered", name: "Sample/Visit Offered" },
    { id: "closed_won", name: "Closed Won" },
    { id: "closed_lost", name: "Closed Lost" },
  ];

  describe("Choice Handling", () => {
    test("renders choices correctly when popover is open", async () => {
      const user = userEvent.setup();

      renderWithAdminContext(
        <FormWrapper>
          <AutocompleteInput source="stage" label="Stage" choices={mockChoices} />
        </FormWrapper>,
        { resource: "opportunities" }
      );

      const trigger = screen.getByRole("combobox");
      await user.click(trigger);

      await waitFor(
        () => {
          mockChoices.forEach((choice) => {
            expect(screen.getByText(choice.name)).toBeInTheDocument();
          });
        },
        { timeout: 5000 }
      );
    });

    test("filters choices based on search input", async () => {
      const user = userEvent.setup();

      renderWithAdminContext(
        <FormWrapper>
          <AutocompleteInput source="stage" label="Stage" choices={mockChoices} />
        </FormWrapper>,
        { resource: "opportunities" }
      );

      const trigger = screen.getByRole("combobox");
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText("New Lead")).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText("Search...");
      await user.type(searchInput, "closed");

      await waitFor(() => {
        expect(screen.getByText("Closed Won")).toBeInTheDocument();
        expect(screen.getByText("Closed Lost")).toBeInTheDocument();
        expect(screen.queryByText("New Lead")).not.toBeInTheDocument();
      });
    });

    test("allows clearing selection when not required", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();

      renderWithAdminContext(
        <FormWrapper defaultValues={{ stage: "new_lead" }} onSubmit={onSubmit}>
          <AutocompleteInput source="stage" label="Stage" choices={mockChoices} />
        </FormWrapper>,
        { resource: "opportunities" }
      );

      const trigger = screen.getByRole("combobox");
      expect(trigger).toHaveTextContent("New Lead");

      await user.click(trigger);

      await waitFor(() => {
        const options = screen.getAllByRole("option");
        expect(options.length).toBeGreaterThan(0);
      });

      const newLeadOption = screen.getByRole("option", { name: /New Lead/i });
      await user.click(newLeadOption);

      await waitFor(() => {
        const updatedTrigger = screen.getByRole("combobox");
        expect(updatedTrigger).toHaveTextContent("Search");
      });

      const submitButton = screen.getByText("Submit");
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            stage: null,
          }),
          expect.anything()
        );
      });
    });

    test("prevents clearing when required", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();

      renderWithAdminContext(
        <FormWrapper defaultValues={{ stage: "new_lead" }} onSubmit={onSubmit}>
          <AutocompleteInput source="stage" label="Stage" choices={mockChoices} isRequired={true} />
        </FormWrapper>,
        { resource: "opportunities" }
      );

      const trigger = screen.getByRole("combobox");
      expect(trigger).toHaveTextContent("New Lead");

      await user.click(trigger);

      await waitFor(() => {
        const options = screen.getAllByRole("option");
        expect(options.length).toBeGreaterThan(0);
      });

      const newLeadOption = screen.getByRole("option", { name: /New Lead/i });
      await user.click(newLeadOption);

      await waitFor(() => {
        const updatedTrigger = screen.getByRole("combobox");
        expect(updatedTrigger).toHaveTextContent("New Lead");
      });
    });

    test("selects and updates form value", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();

      renderWithAdminContext(
        <FormWrapper onSubmit={onSubmit}>
          <AutocompleteInput source="stage" label="Stage" choices={mockChoices} />
        </FormWrapper>,
        { resource: "opportunities" }
      );

      const trigger = screen.getByRole("combobox");
      await user.click(trigger);

      await waitFor(() => {
        const options = screen.getAllByRole("option");
        expect(options.length).toBeGreaterThan(0);
      });

      const closedWonOption = screen.getByRole("option", { name: /Closed Won/i });
      await user.click(closedWonOption);

      await waitFor(() => {
        const updatedTrigger = screen.getByRole("combobox");
        expect(updatedTrigger).toHaveTextContent("Closed Won");
      });

      const submitButton = screen.getByText("Submit");
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            stage: "closed_won",
          }),
          expect.anything()
        );
      });
    });
  });

  describe("Create Suggestion", () => {
    test("shows create option when onCreate provided and filter has value", async () => {
      const user = userEvent.setup();
      const onCreate = vi.fn().mockResolvedValue({ id: "custom_stage", name: "Custom Stage" });

      renderWithAdminContext(
        <FormWrapper>
          <AutocompleteInput
            source="stage"
            label="Stage"
            choices={mockChoices}
            onCreate={onCreate}
          />
        </FormWrapper>,
        { resource: "opportunities" }
      );

      const trigger = screen.getByRole("combobox");
      await user.click(trigger);

      await waitFor(() => {
        const options = screen.getAllByRole("option");
        expect(options.length).toBeGreaterThan(0);
      });

      const searchInput = screen.getByPlaceholderText("Search...");
      await user.type(searchInput, "Custom Stage");

      await waitFor(() => {
        expect(screen.getByText("Create")).toBeInTheDocument();
      });
    });

    test("calls onCreate with input value", async () => {
      const user = userEvent.setup();
      const onCreate = vi.fn().mockResolvedValue({ id: "new_custom", name: "New Custom" });

      renderWithAdminContext(
        <FormWrapper>
          <AutocompleteInput
            source="stage"
            label="Stage"
            choices={mockChoices}
            onCreate={onCreate}
          />
        </FormWrapper>,
        { resource: "opportunities" }
      );

      const trigger = screen.getByRole("combobox");
      await user.click(trigger);

      const searchInput = screen.getByPlaceholderText("Search...");
      await user.type(searchInput, "New Custom");

      await waitFor(() => {
        expect(screen.getByText("Create")).toBeInTheDocument();
      });

      const createOption = screen.getByRole("option", { name: /Create/i });
      await user.click(createOption);

      await waitFor(() => {
        expect(onCreate).toHaveBeenCalledWith("New Custom");
      });
    });

    test("shows createLabel when provided without filter", async () => {
      const user = userEvent.setup();
      const onCreate = vi.fn();

      renderWithAdminContext(
        <FormWrapper>
          <AutocompleteInput
            source="stage"
            label="Stage"
            choices={mockChoices}
            onCreate={onCreate}
            createLabel="Add new stage"
          />
        </FormWrapper>,
        { resource: "opportunities" }
      );

      const trigger = screen.getByRole("combobox");
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText("Add new stage")).toBeInTheDocument();
      });
    });
  });

  describe("Reference Mode", () => {
    test("uses ReferenceInput when reference prop provided", async () => {
      const user = userEvent.setup();
      const mockDataProvider = {
        getList: vi.fn().mockResolvedValue({
          data: [
            { id: 1, name: "Contact 1" },
            { id: 2, name: "Contact 2" },
            { id: 3, name: "Contact 3" },
          ],
          total: 3,
        }),
      };

      renderWithAdminContext(
        <FormWrapper>
          <ReferenceInput source="contact_id" reference="contacts">
            <AutocompleteInput label="Contact" />
          </ReferenceInput>
        </FormWrapper>,
        {
          resource: "opportunities",
          dataProvider: mockDataProvider,
        }
      );

      await waitFor(() => {
        expect(mockDataProvider.getList).toHaveBeenCalledWith("contacts", expect.any(Object));
      });

      const trigger = await screen.findByRole("combobox");
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText("Contact 1")).toBeInTheDocument();
        expect(screen.getByText("Contact 2")).toBeInTheDocument();
        expect(screen.getByText("Contact 3")).toBeInTheDocument();
      });
    });

    test("passes props through to child in reference mode", async () => {
      const mockDataProvider = {
        getList: vi.fn().mockResolvedValue({
          data: [{ id: 1, name: "Test Contact" }],
          total: 1,
        }),
      };

      renderWithAdminContext(
        <FormWrapper>
          <ReferenceInput source="contact_id" reference="contacts">
            <AutocompleteInput label="Custom Label" placeholder="Select contact..." />
          </ReferenceInput>
        </FormWrapper>,
        {
          resource: "opportunities",
          dataProvider: mockDataProvider,
        }
      );

      await waitFor(() => {
        expect(mockDataProvider.getList).toHaveBeenCalled();
      });

      expect(screen.getByText("Custom Label")).toBeInTheDocument();

      const trigger = screen.getByRole("combobox");
      expect(trigger).toHaveTextContent("Select contact...");
    });

    test("applies filterToQuery in reference mode for search", async () => {
      const user = userEvent.setup();
      const customFilterToQuery = vi.fn((search: string) => ({ name: search }));
      const mockDataProvider = {
        getList: vi.fn().mockResolvedValue({
          data: [{ id: 1, name: "Test Contact" }],
          total: 1,
        }),
      };

      renderWithAdminContext(
        <FormWrapper>
          <ReferenceInput source="contact_id" reference="contacts">
            <AutocompleteInput label="Contact" filterToQuery={customFilterToQuery} />
          </ReferenceInput>
        </FormWrapper>,
        {
          resource: "opportunities",
          dataProvider: mockDataProvider,
        }
      );

      const trigger = await screen.findByRole("combobox");
      await user.click(trigger);

      const searchInput = screen.getByPlaceholderText("Search...");
      await user.type(searchInput, "John");

      await waitFor(() => {
        expect(customFilterToQuery).toHaveBeenCalledWith("John");
      });
    });
  });

  describe("Accessibility", () => {
    test("supports aria-label on combobox", async () => {
      renderWithAdminContext(
        <FormWrapper>
          <AutocompleteInput source="stage" label="Stage" choices={mockChoices} />
        </FormWrapper>,
        { resource: "opportunities" }
      );

      const trigger = screen.getByRole("combobox");
      expect(trigger).toHaveAttribute("aria-label", "Search");
    });

    test("aria-label reflects selected value", async () => {
      renderWithAdminContext(
        <FormWrapper defaultValues={{ stage: "new_lead" }}>
          <AutocompleteInput source="stage" label="Stage" choices={mockChoices} />
        </FormWrapper>,
        { resource: "opportunities" }
      );

      const trigger = screen.getByRole("combobox");
      expect(trigger).toHaveAttribute("aria-label", "New Lead");
    });

    test("supports custom placeholder for aria-label", async () => {
      renderWithAdminContext(
        <FormWrapper>
          <AutocompleteInput
            source="stage"
            label="Stage"
            choices={mockChoices}
            placeholder="Select a stage..."
          />
        </FormWrapper>,
        { resource: "opportunities" }
      );

      const trigger = screen.getByRole("combobox");
      expect(trigger).toHaveAttribute("aria-label", "Select a stage...");
    });

    test("has aria-expanded attribute", async () => {
      const user = userEvent.setup();

      renderWithAdminContext(
        <FormWrapper>
          <AutocompleteInput source="stage" label="Stage" choices={mockChoices} />
        </FormWrapper>,
        { resource: "opportunities" }
      );

      const trigger = screen.getByRole("combobox");
      expect(trigger).toHaveAttribute("aria-expanded", "false");

      await user.click(trigger);

      await waitFor(() => {
        expect(trigger).toHaveAttribute("aria-expanded", "true");
      });
    });

    test("form field has proper structure for error association", async () => {
      renderWithAdminContext(
        <FormWrapper>
          <AutocompleteInput source="stage" label="Stage" choices={mockChoices} />
        </FormWrapper>,
        { resource: "opportunities" }
      );

      const formField = document.querySelector('[data-slot="form-item"]');
      expect(formField).toBeInTheDocument();
    });
  });

  describe("Custom Props", () => {
    test("handles custom optionText and optionValue", async () => {
      const user = userEvent.setup();
      const customChoices = [
        { value: "opt1", label: "Option One" },
        { value: "opt2", label: "Option Two" },
        { value: "opt3", label: "Option Three" },
      ];

      renderWithAdminContext(
        <FormWrapper>
          <AutocompleteInput
            source="custom_field"
            label="Custom Field"
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
        expect(screen.getByText("Option One")).toBeInTheDocument();
        expect(screen.getByText("Option Two")).toBeInTheDocument();
        expect(screen.getByText("Option Three")).toBeInTheDocument();
      });
    });

    test("handles custom inputText as function", async () => {
      const inputTextFn = vi.fn((option: any) => (option ? `Selected: ${option.name}` : ""));

      renderWithAdminContext(
        <FormWrapper defaultValues={{ stage: "new_lead" }}>
          <AutocompleteInput
            source="stage"
            label="Stage"
            choices={mockChoices}
            inputText={inputTextFn}
          />
        </FormWrapper>,
        { resource: "opportunities" }
      );

      await waitFor(() => {
        const trigger = screen.getByRole("combobox");
        expect(trigger).toHaveTextContent("Selected: New Lead");
      });
    });

    test("applies custom className", () => {
      renderWithAdminContext(
        <FormWrapper>
          <AutocompleteInput
            source="stage"
            label="Stage"
            choices={mockChoices}
            className="custom-autocomplete-class"
          />
        </FormWrapper>,
        { resource: "opportunities" }
      );

      const formField = document.querySelector('[data-slot="form-item"]');
      expect(formField).toHaveClass("custom-autocomplete-class");
    });

    test("displays helper text when provided", () => {
      renderWithAdminContext(
        <FormWrapper>
          <AutocompleteInput
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

    test("hides label when label is false", () => {
      renderWithAdminContext(
        <FormWrapper>
          <AutocompleteInput source="stage" label={false} choices={mockChoices} />
        </FormWrapper>,
        { resource: "opportunities" }
      );

      expect(screen.queryByText("Stage")).not.toBeInTheDocument();
    });
  });

  describe("Popover Behavior", () => {
    test("closes popover after selection", async () => {
      const user = userEvent.setup();

      renderWithAdminContext(
        <FormWrapper>
          <AutocompleteInput source="stage" label="Stage" choices={mockChoices} />
        </FormWrapper>,
        { resource: "opportunities" }
      );

      const trigger = screen.getByRole("combobox");
      await user.click(trigger);

      await waitFor(() => {
        const options = screen.getAllByRole("option");
        expect(options.length).toBeGreaterThan(0);
      });

      expect(trigger).toHaveAttribute("aria-expanded", "true");

      const newLeadOption = screen.getByRole("option", { name: /New Lead/i });
      await user.click(newLeadOption);

      await waitFor(() => {
        expect(trigger).toHaveAttribute("aria-expanded", "false");
      });
    });

    test("closes popover and updates value after selection with filter", async () => {
      const user = userEvent.setup();

      renderWithAdminContext(
        <FormWrapper>
          <AutocompleteInput source="stage" label="Stage" choices={mockChoices} />
        </FormWrapper>,
        { resource: "opportunities" }
      );

      const trigger = screen.getByRole("combobox");
      await user.click(trigger);

      const searchInput = screen.getByPlaceholderText("Search...");
      await user.type(searchInput, "closed");

      await waitFor(() => {
        expect(screen.queryByRole("option", { name: /New Lead/i })).not.toBeInTheDocument();
        expect(screen.getByRole("option", { name: /Closed Won/i })).toBeInTheDocument();
      });

      const closedWonOption = screen.getByRole("option", { name: /Closed Won/i });
      await user.click(closedWonOption);

      await waitFor(() => {
        expect(trigger).toHaveAttribute("aria-expanded", "false");
        expect(trigger).toHaveTextContent("Closed Won");
      });
    });
  });
});
