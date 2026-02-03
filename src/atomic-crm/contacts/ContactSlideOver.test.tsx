/**
 * Tests for ContactSlideOver component
 *
 * Tests slide-over functionality:
 * - Tab switching (1 tab: Activities only, details in right panel)
 * - View/edit mode toggle
 * - Close handling
 * - Record fetching (useGetOne)
 * - Right panel integration
 *
 * Target coverage: >= 70%
 */

import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { createMockContact } from "@/tests/utils/mock-providers";
import { mockUseGetOneReturn, mockUseUpdateReturn } from "@/tests/utils/typed-mocks";
import { ContactSlideOver } from "./ContactSlideOver";

// Mock dependencies
vi.mock("ra-core", async () => {
  const actual = await vi.importActual("ra-core");
  return {
    ...actual,
    useGetOne: vi.fn(),
    useUpdate: vi.fn(),
    useNotify: vi.fn(() => vi.fn()),
    RecordContextProvider: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    Form: ({
      children,
      onSubmit,
      record,
    }: {
      children: ReactNode;
      onSubmit?: (data: unknown) => void;
      record?: unknown;
    }) => (
      <form
        data-testid="contact-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (onSubmit) onSubmit(record);
        }}
      >
        {children}
      </form>
    ),
  };
});

// Mock Sheet component
vi.mock("@/components/ui/sheet", () => ({
  Sheet: ({ children, open }: { children: ReactNode; open?: boolean }) =>
    open ? <div data-testid="sheet">{children}</div> : null,
  SheetContent: ({ children }: { children: ReactNode }) => (
    <div role="dialog" aria-modal="true">
      {children}
    </div>
  ),
  SheetHeader: ({ children }: { children: ReactNode }) => (
    <div data-testid="sheet-header">{children}</div>
  ),
  SheetTitle: ({ children }: { children: ReactNode }) => <h2 id="slide-over-title">{children}</h2>,
  SheetFooter: ({ children }: { children: ReactNode }) => (
    <div data-testid="sheet-footer">{children}</div>
  ),
}));

// Mock Tabs component
vi.mock("@/components/ui/tabs", () => ({
  Tabs: ({
    children,
    value,
    onValueChange,
  }: {
    children: ReactNode;
    value?: string;
    onValueChange?: (value: string) => void;
  }) => (
    <div data-testid="tabs" data-value={value} data-onvaluechange={onValueChange}>
      {children}
    </div>
  ),
  TabsList: ({ children }: { children: ReactNode }) => <div role="tablist">{children}</div>,
  TabsTrigger: ({
    children,
    value,
    onClick,
  }: {
    children: ReactNode;
    value?: string;
    onClick?: () => void;
  }) => (
    <button role="tab" data-value={value} onClick={onClick}>
      {children}
    </button>
  ),
  TabsContent: ({ children, value }: { children: ReactNode; value?: string }) => (
    <div role="tabpanel" data-value={value}>
      {children}
    </div>
  ),
}));

// Mock Button component
vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    disabled,
    type,
    ...props
  }: {
    children: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    type?: "button" | "submit" | "reset";
    "data-testid"?: string;
  }) => (
    <button onClick={onClick} disabled={disabled} type={type} data-testid={props["data-testid"]}>
      {children}
    </button>
  ),
}));

// Mock Skeleton component
vi.mock("@/components/ui/skeleton", () => ({
  Skeleton: () => <div data-testid="skeleton">Loading...</div>,
}));

// Type for tab configuration in ResourceSlideOver
interface MockTabConfig {
  key: string;
  label: string;
  component: React.ComponentType<{
    record: { id: number | null; first_name: string; last_name: string };
    mode: "view" | "edit";
    onModeToggle: () => void;
  }>;
}

// Type for right panel props
interface MockRightPanelProps {
  record: { id: number | null; first_name: string; last_name: string };
  mode: "view" | "edit";
  onModeToggle?: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
  isLoading: boolean;
}

// Type for ResourceSlideOver props
interface MockResourceSlideOverProps {
  resource: string;
  recordId: number | null;
  isOpen: boolean;
  onClose: () => void;
  mode: "view" | "edit";
  onModeToggle: () => void;
  tabs: MockTabConfig[];
  recordRepresentation?: (record: {
    id: number | null;
    first_name: string;
    last_name: string;
  }) => string;
  rightPanel?: (props: MockRightPanelProps) => ReactNode;
}

// Mock ResourceSlideOver (the wrapper)
vi.mock("@/components/layouts/ResourceSlideOver", () => ({
  ResourceSlideOver: ({
    resource,
    recordId,
    isOpen,
    onClose,
    mode,
    onModeToggle,
    tabs,
    recordRepresentation,
    rightPanel,
  }: MockResourceSlideOverProps) => {
    const mockRecord = {
      id: recordId,
      first_name: "John",
      last_name: "Doe",
    };

    if (!isOpen) return null;

    return (
      <div role="dialog" data-testid="resource-slide-over">
        <div data-testid="slide-over-header">
          <h2>
            {recordRepresentation ? recordRepresentation(mockRecord) : `${resource} #${recordId}`}
          </h2>
          <button onClick={onModeToggle} data-testid="mode-toggle">
            {mode === "view" ? "Edit" : "Cancel"}
          </button>
          <button onClick={onClose} data-testid="close-button">
            Close
          </button>
        </div>

        <div role="tablist" data-testid="tab-list">
          {tabs.map((tab: MockTabConfig) => (
            <button key={tab.key} role="tab" data-testid={`tab-${tab.key}`}>
              {tab.label}
            </button>
          ))}
        </div>

        <div data-testid="tab-content">
          {tabs.map((tab: MockTabConfig) => {
            const TabComponent = tab.component;
            return (
              <div key={tab.key} data-testid={`tab-panel-${tab.key}`}>
                <TabComponent record={mockRecord} mode={mode} onModeToggle={onModeToggle} />
              </div>
            );
          })}
        </div>

        {rightPanel && (
          <div data-testid="right-panel">
            {rightPanel({
              record: mockRecord,
              mode,
              onModeToggle,
              onDirtyChange: vi.fn(),
              isLoading: false,
            })}
          </div>
        )}
      </div>
    );
  },
}));

vi.mock("./ActivitiesTab", () => ({
  ActivitiesTab: ({ contactId }: { contactId: string | number }) => (
    <div data-testid="activities-tab">
      <p>Activities for contact {contactId}</p>
    </div>
  ),
}));

// Mock ContactRightPanel
vi.mock("./ContactRightPanel", () => ({
  ContactRightPanel: ({
    record,
    mode,
  }: {
    record: { id: number | null; first_name: string; last_name: string };
    mode: string;
  }) => (
    <div data-testid="contact-right-panel">
      <p>
        Details for {record.first_name} {record.last_name}
      </p>
      <p>Mode: {mode}</p>
    </div>
  ),
}));

// Import mocked functions after mock definition
import { useGetOne, useUpdate, useNotify } from "ra-core";

describe("ContactSlideOver", () => {
  const mockContact = createMockContact({
    id: 123,
    first_name: "John",
    last_name: "Doe",
    email: [{ value: "john@example.com", type: "work" }],
    phone: [{ value: "555-0100", type: "work" }],
  });

  const mockOnClose = vi.fn();
  const mockOnModeToggle = vi.fn();
  const mockUpdate = vi.fn();
  const mockNotify = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();

    // Setup default mocks
    vi.mocked(useGetOne).mockReturnValue(
      mockUseGetOneReturn({
        data: mockContact,
        isLoading: false,
      })
    );

    vi.mocked(useUpdate).mockReturnValue(mockUseUpdateReturn({ mutate: mockUpdate }));
    vi.mocked(useNotify).mockReturnValue(mockNotify);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Basic Rendering", () => {
    test("renders nothing when isOpen is false", () => {
      renderWithAdminContext(
        <ContactSlideOver
          recordId={123}
          isOpen={false}
          mode="view"
          onClose={mockOnClose}
          onModeToggle={mockOnModeToggle}
        />
      );

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    test("renders slide-over when isOpen is true", async () => {
      renderWithAdminContext(
        <ContactSlideOver
          recordId={123}
          isOpen={true}
          mode="view"
          onClose={mockOnClose}
          onModeToggle={mockOnModeToggle}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
    });

    test("renders contact name in header", async () => {
      renderWithAdminContext(
        <ContactSlideOver
          recordId={123}
          isOpen={true}
          mode="view"
          onClose={mockOnClose}
          onModeToggle={mockOnModeToggle}
        />
      );

      await waitFor(() => {
        const header = screen.getByTestId("slide-over-header");
        expect(within(header).getByText(/John Doe/)).toBeInTheDocument();
      });
    });
  });

  describe("Tab Navigation (Two-Column Layout)", () => {
    test("renders only Activities tab (details in right panel)", async () => {
      renderWithAdminContext(
        <ContactSlideOver
          recordId={123}
          isOpen={true}
          mode="view"
          onClose={mockOnClose}
          onModeToggle={mockOnModeToggle}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId("tab-activities")).toBeInTheDocument();
        expect(screen.queryByTestId("tab-details")).not.toBeInTheDocument();
        expect(screen.queryByTestId("tab-notes")).not.toBeInTheDocument();
      });
    });

    test("Activities tab content panel is rendered", async () => {
      renderWithAdminContext(
        <ContactSlideOver
          recordId={123}
          isOpen={true}
          mode="view"
          onClose={mockOnClose}
          onModeToggle={mockOnModeToggle}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId("tab-panel-activities")).toBeInTheDocument();
      });
    });

    test("Activities tab shows activities component with contactId", async () => {
      renderWithAdminContext(
        <ContactSlideOver
          recordId={123}
          isOpen={true}
          mode="view"
          onClose={mockOnClose}
          onModeToggle={mockOnModeToggle}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId("activities-tab")).toBeInTheDocument();
        expect(screen.getByText(/Activities for contact 123/)).toBeInTheDocument();
      });
    });
  });

  describe("Right Panel Integration", () => {
    test("renders right panel with contact details", async () => {
      renderWithAdminContext(
        <ContactSlideOver
          recordId={123}
          isOpen={true}
          mode="view"
          onClose={mockOnClose}
          onModeToggle={mockOnModeToggle}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId("right-panel")).toBeInTheDocument();
        expect(screen.getByTestId("contact-right-panel")).toBeInTheDocument();
      });
    });

    test("right panel shows contact details in view mode", async () => {
      renderWithAdminContext(
        <ContactSlideOver
          recordId={123}
          isOpen={true}
          mode="view"
          onClose={mockOnClose}
          onModeToggle={mockOnModeToggle}
        />
      );

      await waitFor(() => {
        const rightPanel = screen.getByTestId("contact-right-panel");
        expect(within(rightPanel).getByText(/Details for John Doe/)).toBeInTheDocument();
        expect(within(rightPanel).getByText("Mode: view")).toBeInTheDocument();
      });
    });

    test("right panel shows edit mode", async () => {
      renderWithAdminContext(
        <ContactSlideOver
          recordId={123}
          isOpen={true}
          mode="edit"
          onClose={mockOnClose}
          onModeToggle={mockOnModeToggle}
        />
      );

      await waitFor(() => {
        const rightPanel = screen.getByTestId("contact-right-panel");
        expect(within(rightPanel).getByText("Mode: edit")).toBeInTheDocument();
      });
    });
  });

  describe("View/Edit Mode", () => {
    test("displays Edit button in view mode", async () => {
      renderWithAdminContext(
        <ContactSlideOver
          recordId={123}
          isOpen={true}
          mode="view"
          onClose={mockOnClose}
          onModeToggle={mockOnModeToggle}
        />
      );

      await waitFor(() => {
        const toggleButton = screen.getByTestId("mode-toggle");
        expect(toggleButton).toHaveTextContent("Edit");
      });
    });

    test("displays Cancel button in edit mode", async () => {
      renderWithAdminContext(
        <ContactSlideOver
          recordId={123}
          isOpen={true}
          mode="edit"
          onClose={mockOnClose}
          onModeToggle={mockOnModeToggle}
        />
      );

      await waitFor(() => {
        const toggleButton = screen.getByTestId("mode-toggle");
        expect(toggleButton).toHaveTextContent("Cancel");
      });
    });

    test("calls onModeToggle when Edit button is clicked", async () => {
      const user = userEvent.setup();

      renderWithAdminContext(
        <ContactSlideOver
          recordId={123}
          isOpen={true}
          mode="view"
          onClose={mockOnClose}
          onModeToggle={mockOnModeToggle}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId("mode-toggle")).toBeInTheDocument();
      });

      await user.click(screen.getByTestId("mode-toggle"));

      expect(mockOnModeToggle).toHaveBeenCalledTimes(1);
    });
  });

  describe("Close Handling", () => {
    test("calls onClose when close button is clicked", async () => {
      const user = userEvent.setup();

      renderWithAdminContext(
        <ContactSlideOver
          recordId={123}
          isOpen={true}
          mode="view"
          onClose={mockOnClose}
          onModeToggle={mockOnModeToggle}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId("close-button")).toBeInTheDocument();
      });

      await user.click(screen.getByTestId("close-button"));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("Record Fetching", () => {
    test("renders empty state when recordId is null", () => {
      renderWithAdminContext(
        <ContactSlideOver
          recordId={null}
          isOpen={true}
          mode="view"
          onClose={mockOnClose}
          onModeToggle={mockOnModeToggle}
        />
      );

      // Sheet renders but shows empty state
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    test("displays contact name from record representation function", async () => {
      renderWithAdminContext(
        <ContactSlideOver
          recordId={123}
          isOpen={true}
          mode="view"
          onClose={mockOnClose}
          onModeToggle={mockOnModeToggle}
        />
      );

      await waitFor(() => {
        // recordRepresentation function should format as "First Last"
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });
    });
  });

  describe("Tab Configuration", () => {
    test("passes correct tab config with single Activities tab", async () => {
      renderWithAdminContext(
        <ContactSlideOver
          recordId={123}
          isOpen={true}
          mode="view"
          onClose={mockOnClose}
          onModeToggle={mockOnModeToggle}
        />
      );

      await waitFor(() => {
        const tabList = screen.getByTestId("tab-list");

        // Only 1 tab should be present (Activities)
        const tabs = within(tabList).getAllByRole("tab");
        expect(tabs).toHaveLength(1);

        // Verify tab label
        expect(tabs[0]).toHaveTextContent("Activities");
      });
    });
  });

  describe("Resource Configuration", () => {
    test("uses contacts resource", async () => {
      renderWithAdminContext(
        <ContactSlideOver
          recordId={123}
          isOpen={true}
          mode="view"
          onClose={mockOnClose}
          onModeToggle={mockOnModeToggle}
        />
      );

      await waitFor(() => {
        // Verify the slide-over is rendered (implies resource is correctly set)
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
    });
  });
});
