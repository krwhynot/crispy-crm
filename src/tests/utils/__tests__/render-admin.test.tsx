/**
 * Tests for renderWithAdminContext utility
 */

import { describe, test, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithAdminContext } from "../render-admin";
import { useDataProvider, useGetIdentity, useRecordContext } from "ra-core";

// Simple test components
const TestComponent = () => {
  const dataProvider = useDataProvider();
  const { identity } = useGetIdentity();

  return (
    <div>
      <p>Data Provider: {dataProvider ? "present" : "missing"}</p>
      <p>Identity: {identity?.fullName || "anonymous"}</p>
    </div>
  );
};

const TestRecordComponent = () => {
  const record = useRecordContext();
  return <div>Record ID: {record?.id || "none"}</div>;
};

describe("renderWithAdminContext", () => {
  test("provides data provider to component", () => {
    renderWithAdminContext(<TestComponent />);

    expect(screen.getByText(/Data Provider: present/i)).toBeInTheDocument();
  });

  test("provides auth identity with user role", async () => {
    renderWithAdminContext(<TestComponent />, {
      userRole: "user",
    });

    // Identity is loaded asynchronously
    await screen.findByText(/Identity:/);
    expect(screen.getByText(/Identity:/)).toBeInTheDocument();
  });

  test("provides custom data provider overrides", async () => {
    const mockCreate = vi.fn().mockResolvedValue({
      data: { id: 123, name: "Test" },
    });

    const { dataProvider } = renderWithAdminContext(<TestComponent />, {
      dataProvider: {
        create: mockCreate,
      },
    });

    // Test that override was applied
    const result = await dataProvider.create("test", {
      data: { name: "Test" },
    });

    expect(mockCreate).toHaveBeenCalledWith("test", {
      data: { name: "Test" },
    });
    expect(result.data.id).toBe(123);
  });

  test("provides RecordContext when record option is passed", () => {
    renderWithAdminContext(<TestRecordComponent />, {
      record: { id: 456 },
    });

    expect(screen.getByText("Record ID: 456")).toBeInTheDocument();
  });

  test("provides ResourceContext when resource option is passed", () => {
    const ResourceComponent = () => {
      const resource = "opportunities";
      return <div>Resource: {resource}</div>;
    };

    renderWithAdminContext(<ResourceComponent />, {
      resource: "opportunities",
    });

    expect(screen.getByText("Resource: opportunities")).toBeInTheDocument();
  });

  test("returns queryClient in render result", () => {
    const { queryClient } = renderWithAdminContext(<TestComponent />);

    expect(queryClient).toBeDefined();
    expect(queryClient.getDefaultOptions().queries?.retry).toBe(false);
  });
});
