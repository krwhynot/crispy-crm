import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { TutorialProvider, useTutorial } from "../TutorialProvider";
import { TutorialLauncher } from "../TutorialLauncher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AdminButton } from "@/components/admin/AdminButton";
import { driver as driverMock } from "driver.js";

// Mock driver.js - factory must be self-contained for hoisting
vi.mock("driver.js", () => ({
  driver: vi.fn(() => ({
    drive: vi.fn(),
    destroy: vi.fn(),
    isActive: vi.fn(() => false),
  })),
}));

// Mock waitForElement to resolve immediately in tests
vi.mock("../waitForElement", () => ({
  waitForElement: vi.fn().mockResolvedValue(document.createElement("div")),
}));

// Mock steps module to return test steps
vi.mock("../steps", () => ({
  getChapterSteps: vi.fn(() => [
    {
      element: '[data-tutorial="test"]',
      popover: { title: "Chapter Step", description: "Chapter description" },
    },
  ]),
}));

// Wrapper with tutorial provider
function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <TutorialProvider>
      <div>{children}</div>
    </TutorialProvider>
  );
}

// Wrapper for TutorialLauncher (needs parent DropdownMenu)
function TutorialLauncherWrapper() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <AdminButton>Open Menu</AdminButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <TutorialLauncher />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

describe("Tutorial Integration", () => {
  it("should render tutorial launcher in dropdown without crashing", () => {
    // The TutorialLauncher renders inside a dropdown submenu
    // We just verify it doesn't crash when rendered in a parent menu
    const { container } = renderWithAdminContext(
      <TestWrapper>
        <TutorialLauncherWrapper />
      </TestWrapper>
    );

    // Should render the trigger button
    expect(screen.getByText("Open Menu")).toBeInTheDocument();
    expect(container).toBeDefined();
  });

  it("should have access to tutorial context", () => {
    // Test consumer component
    function ContextChecker() {
      const { startTutorial, isActive, progress } = useTutorial();
      return (
        <div>
          <span data-testid="is-active">{isActive ? "yes" : "no"}</span>
          <span data-testid="completed-count">{progress.completedChapters.length}</span>
          <button onClick={() => startTutorial("contacts")}>Start</button>
        </div>
      );
    }

    renderWithAdminContext(
      <TestWrapper>
        <ContextChecker />
      </TestWrapper>
    );

    expect(screen.getByTestId("is-active")).toHaveTextContent("no");
    expect(screen.getByTestId("completed-count")).toHaveTextContent("0");
  });

  it("should start tutorial when button clicked", async () => {
    function ContextChecker() {
      const { startTutorial } = useTutorial();
      return <button onClick={() => startTutorial("contacts")}>Start</button>;
    }

    renderWithAdminContext(
      <TestWrapper>
        <ContextChecker />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText("Start"));

    // Wait for async startTutorial to complete and driver.js to be initialized
    await waitFor(() => {
      expect(driverMock).toHaveBeenCalled();
    });
  });
});
