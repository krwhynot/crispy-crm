import { describe, test, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { Form, SaveContextProvider, useRecordContext } from "ra-core";
import { useFormContext } from "react-hook-form";
import React from "react";

const TestComponent = () => {
  const form = useFormContext();
  const record = useRecordContext();
  return (
    <div>
      <div data-testid="form-status">{form ? "Form Found" : "No Form"}</div>
      <div data-testid="record-status">{record ? "Record Found" : "No Record"}</div>
    </div>
  );
};

describe("Test React Admin Form", () => {
  test("provides FormProvider", () => {
    const saveContext = {
      save: vi.fn(),
      saving: false,
      mutationMode: "pessimistic" as const
    };

    const record = { id: 1, name: "Test" };

    renderWithAdminContext(
      <SaveContextProvider value={saveContext}>
        <Form defaultValues={record}>
          <TestComponent />
        </Form>
      </SaveContextProvider>,
      { record }
    );

    // The Form component from ra-core should provide FormProvider context
    expect(screen.getByTestId("form-status")).toHaveTextContent("Form Found");
    expect(screen.getByTestId("record-status")).toHaveTextContent("Record Found");
  });
});
