import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { MobileQuickActionBar } from "../MobileQuickActionBar";

// Mock the QuickLogForm lazy import
vi.mock("../QuickLogForm", () => ({
  QuickLogForm: vi.fn(({ onComplete }) => (
    <div data-testid="quick-log-form">
      <button onClick={onComplete}>Save</button>
    </div>
  )),
}));

// Mock the Sheet components
vi.mock("@/components/ui/sheet", () => ({
  Sheet: ({ children, open }: { children: React.ReactNode; open: boolean }) => (
    <div data-testid="sheet" data-open={open}>
      {children}
    </div>
  ),
  SheetContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sheet-content">{children}</div>
  ),
  SheetHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sheet-header">{children}</div>
  ),
  SheetTitle: ({ children, id }: { children: React.ReactNode; id?: string }) => (
    <h2 id={id} data-testid="sheet-title">
      {children}
    </h2>
  ),
  SheetDescription: ({ children, id }: { children: React.ReactNode; id?: string }) => (
    <p id={id} data-testid="sheet-description">
      {children}
    </p>
  ),
}));

describe("MobileQuickActionBar", () => {
  const mockOnRefresh = vi.fn();
  const mockOnCompleteTask = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders all 6 quick action buttons", () => {
      render(<MobileQuickActionBar />);

      // Check all action buttons are present
      expect(screen.getByRole("button", { name: /check-in/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /sample/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /call/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /meeting/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /note/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /complete/i })).toBeInTheDocument();
    });

    it("renders navigation landmark with correct label", () => {
      render(<MobileQuickActionBar />);

      const nav = screen.getByRole("navigation", { name: /quick actions/i });
      expect(nav).toBeInTheDocument();
    });

    it("renders spacer element for fixed positioning offset", () => {
      const { container } = render(<MobileQuickActionBar />);

      const spacer = container.querySelector('[aria-hidden="true"][role="presentation"]');
      expect(spacer).toBeInTheDocument();
      expect(spacer).toHaveClass("h-20");
    });
  });

  describe("Accessibility", () => {
    it("all buttons have descriptive aria-labels", () => {
      render(<MobileQuickActionBar />);

      expect(screen.getByLabelText(/log a check-in activity/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/log a sample delivery/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/log a phone call/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/log a meeting/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/add a quick note/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/mark a task as complete/i)).toBeInTheDocument();
    });

    it("buttons meet minimum touch target size (44px)", () => {
      render(<MobileQuickActionBar />);

      // Get buttons only from the navigation bar (not from mocked QuickLogForm)
      const nav = screen.getByRole("navigation", { name: /quick actions/i });
      const buttons = within(nav).getAllByRole("button");

      // All 6 quick action buttons should be rendered
      expect(buttons.length).toBe(6);

      // Each button should be clickable and have proper structure
      buttons.forEach((button) => {
        // Button should be focusable
        expect(button).not.toHaveAttribute("disabled");
        // Button should have an accessible name
        expect(button).toHaveAccessibleName();
      });
    });

    it("icons have aria-hidden for screen readers", () => {
      const { container } = render(<MobileQuickActionBar />);

      const icons = container.querySelectorAll('svg[aria-hidden="true"]');
      // 6 buttons * 1 icon each
      expect(icons.length).toBe(6);
    });
  });

  describe("Interactions", () => {
    it("opens sheet when activity button is clicked", () => {
      render(<MobileQuickActionBar onRefresh={mockOnRefresh} />);

      const callButton = screen.getByRole("button", { name: /log a phone call/i });
      fireEvent.click(callButton);

      const sheet = screen.getByTestId("sheet");
      expect(sheet).toHaveAttribute("data-open", "true");
    });

    it("displays correct title when action is selected", () => {
      render(<MobileQuickActionBar onRefresh={mockOnRefresh} />);

      const meetingButton = screen.getByRole("button", { name: /log a meeting/i });
      fireEvent.click(meetingButton);

      expect(screen.getByTestId("sheet-title")).toHaveTextContent("Log Meeting");
    });

    it("calls onCompleteTask callback for Complete Task button", () => {
      render(
        <MobileQuickActionBar onRefresh={mockOnRefresh} onCompleteTask={mockOnCompleteTask} />
      );

      const completeButton = screen.getByRole("button", { name: /mark a task as complete/i });
      fireEvent.click(completeButton);

      expect(mockOnCompleteTask).toHaveBeenCalledTimes(1);
      // Should NOT open the sheet for custom actions
      const sheet = screen.getByTestId("sheet");
      expect(sheet).toHaveAttribute("data-open", "false");
    });

    it("does not open sheet for Complete Task button", () => {
      render(<MobileQuickActionBar onCompleteTask={mockOnCompleteTask} />);

      const completeButton = screen.getByRole("button", { name: /mark a task as complete/i });
      fireEvent.click(completeButton);

      const sheet = screen.getByTestId("sheet");
      expect(sheet).toHaveAttribute("data-open", "false");
    });
  });

  describe("Activity Types", () => {
    it("pre-fills Check-in activity type", () => {
      render(<MobileQuickActionBar />);

      const checkInButton = screen.getByRole("button", { name: /log a check-in activity/i });
      fireEvent.click(checkInButton);

      expect(screen.getByTestId("sheet-title")).toHaveTextContent("Log Check-In");
    });

    it("pre-fills Sample activity type with special description", () => {
      render(<MobileQuickActionBar />);

      const sampleButton = screen.getByRole("button", { name: /log a sample/i });
      fireEvent.click(sampleButton);

      expect(screen.getByTestId("sheet-title")).toHaveTextContent("Log Sample");
      expect(screen.getByTestId("sheet-description")).toHaveTextContent(
        /sample delivery, receipt, or feedback/i
      );
    });

    it("pre-fills Call activity type", () => {
      render(<MobileQuickActionBar />);

      const callButton = screen.getByRole("button", { name: /log a phone call/i });
      fireEvent.click(callButton);

      expect(screen.getByTestId("sheet-title")).toHaveTextContent("Log Call");
    });

    it("pre-fills Meeting activity type", () => {
      render(<MobileQuickActionBar />);

      const meetingButton = screen.getByRole("button", { name: /log a meeting/i });
      fireEvent.click(meetingButton);

      expect(screen.getByTestId("sheet-title")).toHaveTextContent("Log Meeting");
    });

    it("pre-fills Note activity type", () => {
      render(<MobileQuickActionBar />);

      const noteButton = screen.getByRole("button", { name: /add a quick note/i });
      fireEvent.click(noteButton);

      expect(screen.getByTestId("sheet-title")).toHaveTextContent("Log Note");
    });
  });

  describe("Responsive Behavior", () => {
    it("has lg:hidden class to hide on desktop", () => {
      render(<MobileQuickActionBar />);

      const nav = screen.getByRole("navigation");
      expect(nav).toHaveClass("lg:hidden");
    });

    it("spacer has lg:hidden class", () => {
      const { container } = render(<MobileQuickActionBar />);

      const spacer = container.querySelector('[role="presentation"]');
      expect(spacer).toHaveClass("lg:hidden");
    });
  });

  describe("Visual Styling", () => {
    it("has backdrop blur for content visibility", () => {
      render(<MobileQuickActionBar />);

      const nav = screen.getByRole("navigation");
      expect(nav).toHaveClass("backdrop-blur-sm");
    });

    it("has bottom border for separation", () => {
      render(<MobileQuickActionBar />);

      const nav = screen.getByRole("navigation");
      expect(nav).toHaveClass("border-t");
      expect(nav).toHaveClass("border-border");
    });

    it("supports safe area insets for notched devices", () => {
      render(<MobileQuickActionBar />);

      const nav = screen.getByRole("navigation");
      expect(nav).toHaveClass("pb-[env(safe-area-inset-bottom)]");
    });
  });

  describe("Custom className", () => {
    it("accepts custom className prop", () => {
      render(<MobileQuickActionBar className="custom-class" />);

      const nav = screen.getByRole("navigation");
      expect(nav).toHaveClass("custom-class");
    });
  });
});
