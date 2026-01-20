import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useForm, FormProvider } from "react-hook-form";
import type { ActivityLogInput } from "@/atomic-crm/validation/activities";

// Mock Popover components for simpler testing
vi.mock("@/components/ui/popover", () => ({
  Popover: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="popover">{children}</div>
  ),
  PopoverTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => (
    <div data-testid="popover-trigger">{children}</div>
  ),
  PopoverContent: ({ children, align }: { children: React.ReactNode; align?: string }) => (
    <div data-testid="popover-content" data-align={align}>
      {children}
    </div>
  ),
}));

// Mock Calendar component
const mockOnSelect = vi.fn();
vi.mock("@/components/ui/calendar", () => ({
  Calendar: ({
    mode,
    selected,
    onSelect,
    disabled,
    initialFocus,
  }: {
    mode: string;
    selected?: Date;
    onSelect: (date: Date | undefined) => void;
    disabled?: (date: Date) => boolean;
    initialFocus?: boolean;
  }) => {
    // Store onSelect for test access
    mockOnSelect.mockImplementation(onSelect);

    return (
      <div
        data-testid="calendar"
        data-mode={mode}
        data-initial-focus={initialFocus}
        data-has-disabled={typeof disabled === "function"}
      >
        <button data-testid="calendar-select-date" onClick={() => onSelect(new Date("2025-01-15"))}>
          Select Jan 15
        </button>
        <button
          data-testid="calendar-select-future"
          onClick={() => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 5);
            if (disabled && disabled(futureDate)) {
              return; // Don't select if disabled
            }
            onSelect(futureDate);
          }}
        >
          Select Future Date
        </button>
      </div>
    );
  },
}));

// Import component AFTER mocks are set up
import { ActivityDateSection } from "../ActivityDateSection";

// Test wrapper that provides form context
function TestWrapper({
  children,
  defaultValues,
}: {
  children: React.ReactNode;
  defaultValues?: Partial<ActivityLogInput>;
}) {
  const methods = useForm<ActivityLogInput>({
    defaultValues: {
      date: undefined,
      activityType: "Call",
      outcome: "Connected",
      notes: "",
      ...defaultValues,
    },
  });

  return <FormProvider {...methods}>{children}</FormProvider>;
}

// Wrapper component that exposes form methods for testing
function TestWrapperWithControl({
  defaultValues,
  onDateChange,
}: {
  defaultValues?: Partial<ActivityLogInput>;
  onDateChange?: (date: Date | undefined) => void;
}) {
  const methods = useForm<ActivityLogInput>({
    defaultValues: {
      date: undefined,
      activityType: "Call",
      outcome: "Connected",
      notes: "",
      ...defaultValues,
    },
  });

  // Track date changes
  const dateValue = methods.watch("date");

  // Notify parent of date changes
  if (onDateChange && dateValue) {
    onDateChange(dateValue);
  }

  return (
    <FormProvider {...methods}>
      <ActivityDateSection control={methods.control} />
      <div data-testid="form-date-value">{dateValue ? dateValue.toISOString() : "no-date"}</div>
    </FormProvider>
  );
}

describe("ActivityDateSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders FormLabel 'Activity Date'", () => {
      render(<TestWrapperWithControl />);

      expect(screen.getByText("Activity Date")).toBeInTheDocument();
    });

    it("has h-11 class on button (44px touch target)", () => {
      render(<TestWrapperWithControl />);

      // Get the trigger button (inside popover-trigger, not the calendar mock buttons)
      const triggerContainer = screen.getByTestId("popover-trigger");
      const button = triggerContainer.querySelector("button");
      expect(button).toHaveClass("h-11");
    });

    it("uses text-muted-foreground when no date selected", () => {
      render(<TestWrapperWithControl defaultValues={{ date: undefined }} />);

      const triggerContainer = screen.getByTestId("popover-trigger");
      const button = triggerContainer.querySelector("button");
      expect(button).toHaveClass("text-muted-foreground");
    });

    it("does not use text-muted-foreground when date is selected", () => {
      render(<TestWrapperWithControl defaultValues={{ date: new Date("2025-01-10") }} />);

      const triggerContainer = screen.getByTestId("popover-trigger");
      const button = triggerContainer.querySelector("button");
      expect(button).not.toHaveClass("text-muted-foreground");
    });

    it("shows 'Select date' placeholder when no date selected", () => {
      render(<TestWrapperWithControl defaultValues={{ date: undefined }} />);

      expect(screen.getByText("Select date")).toBeInTheDocument();
    });
  });

  describe("Calendar Configuration", () => {
    it("disables future dates", () => {
      render(<TestWrapperWithControl />);

      const calendar = screen.getByTestId("calendar");
      expect(calendar).toHaveAttribute("data-has-disabled", "true");
    });

    it("uses single selection mode", () => {
      render(<TestWrapperWithControl />);

      const calendar = screen.getByTestId("calendar");
      expect(calendar).toHaveAttribute("data-mode", "single");
    });

    it("has initialFocus set", () => {
      render(<TestWrapperWithControl />);

      const calendar = screen.getByTestId("calendar");
      expect(calendar).toHaveAttribute("data-initial-focus", "true");
    });
  });

  describe("Date Selection", () => {
    it("calls field.onChange when date selected", async () => {
      const onDateChange = vi.fn();
      render(<TestWrapperWithControl onDateChange={onDateChange} />);

      const selectButton = screen.getByTestId("calendar-select-date");
      fireEvent.click(selectButton);

      await waitFor(() => {
        const dateValue = screen.getByTestId("form-date-value");
        expect(dateValue.textContent).toContain("2025-01-15");
      });
    });
  });

  describe("Date Formatting", () => {
    it("displays formatted date with date-fns PPP format", () => {
      render(<TestWrapperWithControl defaultValues={{ date: new Date("2025-01-15") }} />);

      // PPP format is like "January 15th, 2025"
      expect(screen.getByText(/January 15/)).toBeInTheDocument();
    });

    it("displays calendar icon", () => {
      render(<TestWrapperWithControl />);

      // The CalendarIcon should be present in the trigger button
      const triggerContainer = screen.getByTestId("popover-trigger");
      const button = triggerContainer.querySelector("button");
      const svg = button?.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has FormMessage for error display", () => {
      const { container } = render(<TestWrapperWithControl />);

      // FormMessage component should be present (even if empty when no errors)
      // The FormMessage renders with a specific data attribute or className
      const formItem = container.querySelector(".flex.flex-col");
      expect(formItem).toBeInTheDocument();
    });

    it("button has proper width class for touch targets", () => {
      render(<TestWrapperWithControl />);

      const triggerContainer = screen.getByTestId("popover-trigger");
      const button = triggerContainer.querySelector("button");
      expect(button).toHaveClass("w-full");
    });
  });

  describe("Styling", () => {
    it("uses semantic Tailwind colors (no hardcoded hex)", () => {
      const { container } = render(<TestWrapperWithControl />);

      // Check that no inline styles with hex colors exist
      const allElements = container.querySelectorAll("*");
      allElements.forEach((el) => {
        const style = el.getAttribute("style") || "";
        expect(style).not.toMatch(/#[0-9a-fA-F]{3,8}/);
      });
    });

    it("button has justify-start and text-left classes", () => {
      render(<TestWrapperWithControl />);

      const triggerContainer = screen.getByTestId("popover-trigger");
      const button = triggerContainer.querySelector("button");
      expect(button).toHaveClass("justify-start");
      expect(button).toHaveClass("text-left");
    });

    it("button has font-normal class", () => {
      render(<TestWrapperWithControl />);

      const triggerContainer = screen.getByTestId("popover-trigger");
      const button = triggerContainer.querySelector("button");
      expect(button).toHaveClass("font-normal");
    });
  });
});
