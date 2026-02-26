/**
 * CheckboxColumnFilter Stop-Propagation Tests
 *
 * Tests that the CheckboxColumnFilter trigger button correctly stops
 * event propagation to parent elements, preventing unintended sort
 * or row-click behavior in datagrid headers.
 */

import { describe, test, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { CheckboxColumnFilter } from "../CheckboxColumnFilter";

// Mock react-admin to provide useListContext
vi.mock("react-admin", async () => {
  const actual = await vi.importActual("ra-core");
  return {
    ...actual,
    useListContext: vi.fn(() => ({
      filterValues: {},
      setFilters: vi.fn(),
      sort: { field: "name", order: "ASC" },
      setSort: vi.fn(),
      resource: "test",
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
      sort: { field: "name", order: "ASC" },
      setSort: vi.fn(),
      resource: "test",
    })),
  };
});

import { useListContext } from "react-admin";

describe("CheckboxColumnFilter stop-propagation", () => {
  const choices = [
    { id: "a", name: "A" },
    { id: "b", name: "B" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useListContext).mockReturnValue({
      filterValues: {},
      setFilters: vi.fn(),
      sort: { field: "name", order: "ASC" },
      setSort: vi.fn(),
      resource: "test",
    });
  });

  test("trigger click does not propagate to parent", () => {
    const parentClickSpy = vi.fn();

    renderWithAdminContext(
      // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
      <div onClick={parentClickSpy}>
        <CheckboxColumnFilter source="status" label="Status" choices={choices} />
      </div>
    );

    const trigger = screen.getByRole("button", { name: "Filter by Status" });
    fireEvent.click(trigger);

    expect(parentClickSpy).not.toHaveBeenCalled();
  });

  test("trigger keyboard event (Enter) does not propagate to parent", () => {
    const parentKeyDownSpy = vi.fn();

    renderWithAdminContext(
      // eslint-disable-next-line jsx-a11y/no-static-element-interactions
      <div onKeyDown={parentKeyDownSpy}>
        <CheckboxColumnFilter source="status" label="Status" choices={choices} />
      </div>
    );

    const trigger = screen.getByRole("button", { name: "Filter by Status" });
    fireEvent.keyDown(trigger, { key: "Enter", code: "Enter" });

    expect(parentKeyDownSpy).not.toHaveBeenCalled();
  });

  test("trigger keyboard event (Space) does not propagate to parent", () => {
    const parentKeyDownSpy = vi.fn();

    renderWithAdminContext(
      // eslint-disable-next-line jsx-a11y/no-static-element-interactions
      <div onKeyDown={parentKeyDownSpy}>
        <CheckboxColumnFilter source="status" label="Status" choices={choices} />
      </div>
    );

    const trigger = screen.getByRole("button", { name: "Filter by Status" });
    fireEvent.keyDown(trigger, { key: " ", code: "Space" });

    expect(parentKeyDownSpy).not.toHaveBeenCalled();
  });
});
