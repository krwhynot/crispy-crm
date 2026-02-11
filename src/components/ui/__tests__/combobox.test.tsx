import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import userEvent from "@testing-library/user-event";
import { Combobox, MultiSelectCombobox, type ComboboxOption } from "../combobox";

const defaultOptions: ComboboxOption[] = [
  { value: "chicago", label: "Chicago" },
  { value: "los-angeles", label: "Los Angeles" },
  { value: "new-york", label: "New York" },
];

describe("Combobox", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe("Basic Functionality", () => {
    it("renders with placeholder when no value selected", () => {
      renderWithAdminContext(<Combobox options={defaultOptions} placeholder="Select city..." />);
      expect(screen.getByRole("combobox")).toHaveTextContent("Select city...");
    });

    it("displays selected option label", () => {
      renderWithAdminContext(<Combobox options={defaultOptions} value="chicago" placeholder="Select city..." />);
      expect(screen.getByRole("combobox")).toHaveTextContent("Chicago");
    });

    it("opens popover on click", async () => {
      renderWithAdminContext(<Combobox options={defaultOptions} />);
      await user.click(screen.getByRole("combobox"));
      expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument();
    });

    it("calls onValueChange when option is selected", async () => {
      const mockOnChange = vi.fn();
      renderWithAdminContext(<Combobox options={defaultOptions} onValueChange={mockOnChange} />);

      await user.click(screen.getByRole("combobox"));
      await user.click(screen.getByText("Chicago"));

      expect(mockOnChange).toHaveBeenCalledWith("chicago");
    });

    it("filters options based on search input", async () => {
      renderWithAdminContext(<Combobox options={defaultOptions} />);

      await user.click(screen.getByRole("combobox"));
      await user.type(screen.getByPlaceholderText("Search..."), "chi");

      // Chicago should be visible, others filtered
      expect(screen.getByText("Chicago")).toBeInTheDocument();
    });

    it("shows empty state when no matches found", async () => {
      renderWithAdminContext(<Combobox options={defaultOptions} emptyText="No cities found." />);

      await user.click(screen.getByRole("combobox"));
      await user.type(screen.getByPlaceholderText("Search..."), "xyz");

      expect(screen.getByText("No cities found.")).toBeInTheDocument();
    });

    it("is disabled when disabled prop is true", async () => {
      renderWithAdminContext(<Combobox options={defaultOptions} disabled />);
      expect(screen.getByRole("combobox")).toBeDisabled();
    });

    it("deselects option when same option is selected again", async () => {
      const mockOnChange = vi.fn();
      renderWithAdminContext(<Combobox options={defaultOptions} value="chicago" onValueChange={mockOnChange} />);

      await user.click(screen.getByRole("combobox"));
      // Use role="option" to specifically target the dropdown item, not the trigger button
      await user.click(screen.getByRole("option", { name: /Chicago/ }));

      expect(mockOnChange).toHaveBeenCalledWith("");
    });
  });

  describe("Creatable Functionality", () => {
    it("shows 'Create' option when creatable=true and search value doesn't match any option", async () => {
      renderWithAdminContext(<Combobox options={defaultOptions} creatable />);

      await user.click(screen.getByRole("combobox"));
      await user.type(screen.getByPlaceholderText("Search..."), "Boston");

      expect(screen.getByText('Create "Boston"')).toBeInTheDocument();
    });

    it("does NOT show 'Create' option when creatable=false", async () => {
      renderWithAdminContext(<Combobox options={defaultOptions} creatable={false} />);

      await user.click(screen.getByRole("combobox"));
      await user.type(screen.getByPlaceholderText("Search..."), "Boston");

      expect(screen.queryByText(/Create "Boston"/)).not.toBeInTheDocument();
    });

    it("does NOT show 'Create' option when search matches existing option (case-insensitive)", async () => {
      renderWithAdminContext(<Combobox options={defaultOptions} creatable />);

      await user.click(screen.getByRole("combobox"));
      await user.type(screen.getByPlaceholderText("Search..."), "CHICAGO");

      // Should NOT show Create option since "CHICAGO" matches "Chicago"
      expect(screen.queryByText(/Create "CHICAGO"/)).not.toBeInTheDocument();
      // But Chicago option should still be visible
      expect(screen.getByText("Chicago")).toBeInTheDocument();
    });

    it("does NOT show 'Create' option when search is empty", async () => {
      renderWithAdminContext(<Combobox options={defaultOptions} creatable />);

      await user.click(screen.getByRole("combobox"));
      // Don't type anything - just open the popover

      expect(screen.queryByText(/Create "/)).not.toBeInTheDocument();
    });

    it("does NOT show 'Create' option when search is only whitespace", async () => {
      renderWithAdminContext(<Combobox options={defaultOptions} creatable />);

      await user.click(screen.getByRole("combobox"));
      await user.type(screen.getByPlaceholderText("Search..."), "   ");

      expect(screen.queryByText(/Create "/)).not.toBeInTheDocument();
    });

    it("calls onValueChange with the typed value when 'Create' option is selected", async () => {
      const mockOnChange = vi.fn();
      renderWithAdminContext(<Combobox options={defaultOptions} creatable onValueChange={mockOnChange} />);

      await user.click(screen.getByRole("combobox"));
      await user.type(screen.getByPlaceholderText("Search..."), "Boston");
      await user.click(screen.getByText('Create "Boston"'));

      expect(mockOnChange).toHaveBeenCalledWith("Boston");
    });

    it("closes popover and clears search after selecting 'Create' option", async () => {
      const mockOnChange = vi.fn();
      renderWithAdminContext(<Combobox options={defaultOptions} creatable onValueChange={mockOnChange} />);

      await user.click(screen.getByRole("combobox"));
      await user.type(screen.getByPlaceholderText("Search..."), "Boston");
      await user.click(screen.getByText('Create "Boston"'));

      // Popover should be closed
      await waitFor(() => {
        expect(screen.queryByPlaceholderText("Search...")).not.toBeInTheDocument();
      });
    });

    it("shows 'Create' option for partial match that isn't exact", async () => {
      renderWithAdminContext(<Combobox options={defaultOptions} creatable />);

      await user.click(screen.getByRole("combobox"));
      await user.type(screen.getByPlaceholderText("Search..."), "Chi");

      // "Chi" is partial match but not exact - should show Create option
      expect(screen.getByText('Create "Chi"')).toBeInTheDocument();
      // And also show the Chicago option
      expect(screen.getByText("Chicago")).toBeInTheDocument();
    });

    it("works with empty options array", async () => {
      const mockOnChange = vi.fn();
      renderWithAdminContext(<Combobox options={[]} creatable onValueChange={mockOnChange} />);

      await user.click(screen.getByRole("combobox"));
      await user.type(screen.getByPlaceholderText("Search..."), "NewCity");
      await user.click(screen.getByText('Create "NewCity"'));

      expect(mockOnChange).toHaveBeenCalledWith("NewCity");
    });
  });

  describe("Accessibility", () => {
    it("has correct ARIA attributes", () => {
      renderWithAdminContext(<Combobox options={defaultOptions} id="city-select" />);
      const combobox = screen.getByRole("combobox");
      expect(combobox).toHaveAttribute("id", "city-select");
      expect(combobox).toHaveAttribute("aria-expanded", "false");
    });

    it("updates aria-expanded when opened", async () => {
      renderWithAdminContext(<Combobox options={defaultOptions} />);
      const combobox = screen.getByRole("combobox");

      await user.click(combobox);
      expect(combobox).toHaveAttribute("aria-expanded", "true");
    });
  });
});

describe("MultiSelectCombobox", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe("Basic Functionality", () => {
    it("renders with placeholder when no value selected", () => {
      renderWithAdminContext(<MultiSelectCombobox options={defaultOptions} placeholder="Select cities..." />);
      expect(screen.getByRole("combobox")).toHaveTextContent("Select cities...");
    });

    it("displays single selected option label", () => {
      renderWithAdminContext(
        <MultiSelectCombobox
          options={defaultOptions}
          value={["chicago"]}
          placeholder="Select cities..."
        />
      );
      expect(screen.getByRole("combobox")).toHaveTextContent("Chicago");
    });

    it("displays count when multiple options selected", () => {
      renderWithAdminContext(
        <MultiSelectCombobox
          options={defaultOptions}
          value={["chicago", "new-york"]}
          placeholder="Select cities..."
        />
      );
      expect(screen.getByRole("combobox")).toHaveTextContent("2 selected");
    });

    it("toggles option selection", async () => {
      const mockOnChange = vi.fn();
      renderWithAdminContext(
        <MultiSelectCombobox
          options={defaultOptions}
          value={["chicago"]}
          onValueChange={mockOnChange}
        />
      );

      await user.click(screen.getByRole("combobox"));

      // Select New York (adds to selection)
      await user.click(screen.getByText("New York"));
      expect(mockOnChange).toHaveBeenCalledWith(["chicago", "new-york"]);
    });

    it("removes option when clicked again", async () => {
      const mockOnChange = vi.fn();
      renderWithAdminContext(
        <MultiSelectCombobox
          options={defaultOptions}
          value={["chicago", "new-york"]}
          onValueChange={mockOnChange}
        />
      );

      await user.click(screen.getByRole("combobox"));

      // Deselect Chicago
      await user.click(screen.getByText("Chicago"));
      expect(mockOnChange).toHaveBeenCalledWith(["new-york"]);
    });
  });
});
