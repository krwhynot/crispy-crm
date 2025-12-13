import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TutorialProvider, useTutorial } from "../TutorialProvider";
import { MemoryRouter } from "react-router-dom";
import { driver as driverMock } from "driver.js";

// Mock driver.js - the mock function must be defined inside the factory
vi.mock("driver.js", () => {
  const mockDrive = vi.fn();
  const mockDestroy = vi.fn();
  const mockDriverInstance = {
    drive: mockDrive,
    destroy: mockDestroy,
    isActive: vi.fn(() => false),
    moveNext: vi.fn(),
    movePrevious: vi.fn(),
  };
  const mockDriverFn = vi.fn(() => mockDriverInstance);

  return {
    driver: mockDriverFn,
  };
});

// Mock steps module to return test steps
vi.mock("../steps", () => ({
  getChapterSteps: vi.fn(() => [
    {
      element: '[data-tutorial="test"]',
      popover: { title: "Chapter Step", description: "Chapter description" },
    },
  ]),
}));

// Mock waitForElement to resolve immediately in tests
vi.mock("../waitForElement", () => ({
  waitForElement: vi.fn().mockResolvedValue(document.createElement("div")),
}));

// Test component that uses the context
function TestConsumer() {
  const { startTutorial, stopTutorial, isActive } = useTutorial();

  return (
    <div>
      <span data-testid="is-active">{isActive ? "active" : "inactive"}</span>
      <button onClick={() => startTutorial()}>Start</button>
      <button onClick={() => startTutorial("contacts")}>Start Contacts</button>
      <button onClick={() => stopTutorial()}>Stop</button>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <MemoryRouter>
      <TutorialProvider>
        <TestConsumer />
      </TutorialProvider>
    </MemoryRouter>
  );
}

describe("TutorialProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should provide tutorial context to children", () => {
    renderWithProvider();

    expect(screen.getByTestId("is-active")).toHaveTextContent("inactive");
  });

  it("should start tutorial when startTutorial is called", async () => {
    renderWithProvider();

    fireEvent.click(screen.getByText("Start"));

    // Wait for async startTutorial to complete
    await waitFor(() => {
      expect(driverMock).toHaveBeenCalled();
    });
  });

  it("should start specific chapter when chapter is provided", async () => {
    renderWithProvider();

    fireEvent.click(screen.getByText("Start Contacts"));

    // Wait for async startTutorial to complete
    await waitFor(() => {
      expect(driverMock).toHaveBeenCalled();
    });
  });

  it("should throw error when useTutorial is used outside provider", () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      render(<TestConsumer />);
    }).toThrow("useTutorial must be used within TutorialProvider");

    consoleSpy.mockRestore();
  });
});
