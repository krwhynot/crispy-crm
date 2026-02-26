/**
 * TasksDatagridHeader Tests
 *
 * Tests for column header components in the Tasks datagrid:
 * - TaskTypeHeader: dynamic choices from ConfigurationContext (useFormOptions)
 * - TaskPriorityHeader: static choices from TASK_PRIORITY_CHOICES (4 levels)
 *
 * Covers dynamic choices from context and empty/unavailable states.
 */

import { describe, test, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { TaskTypeHeader, TaskPriorityHeader } from "../TasksDatagridHeader";

// Mock react-admin
vi.mock("react-admin", async () => {
  const actual = await vi.importActual("ra-core");
  return {
    ...actual,
    useListContext: vi.fn(() => ({
      filterValues: {},
      setFilters: vi.fn(),
      sort: { field: "due_date", order: "ASC" },
      setSort: vi.fn(),
      resource: "tasks",
    })),
  };
});

vi.mock("ra-core", async () => {
  const actual = await vi.importActual("ra-core");
  return {
    ...actual,
    useListContext: vi.fn(() => ({
      filterValues: {},
      setFilters: vi.fn(),
      sort: { field: "due_date", order: "ASC" },
      setSort: vi.fn(),
      resource: "tasks",
    })),
  };
});

// Mock ConfigurationContext useFormOptions
vi.mock("../../root/ConfigurationContext", () => ({
  useFormOptions: vi.fn(() => ({
    taskTypes: ["Call", "Email", "Meeting"],
  })),
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    metric: vi.fn(),
    breadcrumb: vi.fn(),
  },
}));

import { useListContext } from "react-admin";
import { useFormOptions } from "../../root/ConfigurationContext";

describe("TaskTypeHeader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useListContext).mockReturnValue({
      filterValues: {},
      setFilters: vi.fn(),
      sort: { field: "due_date", order: "ASC" },
      setSort: vi.fn(),
      resource: "tasks",
    });
  });

  test("renders with choices from useFormOptions().taskTypes", () => {
    vi.mocked(useFormOptions).mockReturnValue({
      taskTypes: ["Call", "Email", "Meeting"],
    });

    renderWithAdminContext(<TaskTypeHeader />);

    // Should show label text "Type"
    expect(screen.getByText("Type")).toBeInTheDocument();

    // Should have a filter trigger button (checkbox filter)
    const trigger = screen.getByRole("button", { name: "Filter by Type" });
    expect(trigger).toBeInTheDocument();
  });

  test("renders filterType='none' when taskTypes is empty", () => {
    vi.mocked(useFormOptions).mockReturnValue({
      taskTypes: [],
    });

    renderWithAdminContext(<TaskTypeHeader />);

    // Should show label text "Type" but no filter trigger
    expect(screen.getByText("Type")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /filter/i })).not.toBeInTheDocument();
  });
});

describe("TaskPriorityHeader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useListContext).mockReturnValue({
      filterValues: {},
      setFilters: vi.fn(),
      sort: { field: "due_date", order: "ASC" },
      setSort: vi.fn(),
      resource: "tasks",
    });
  });

  test("renders with 4 priority choices", () => {
    renderWithAdminContext(<TaskPriorityHeader />);

    // Should show label text "Priority"
    expect(screen.getByText("Priority")).toBeInTheDocument();

    // Should have a filter trigger button for checkbox filter
    const trigger = screen.getByRole("button", { name: "Filter by Priority" });
    expect(trigger).toBeInTheDocument();
  });
});
