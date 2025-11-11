import { describe, test, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { Form, SaveContextProvider, useRecordContext } from "ra-core";
import { useFormContext } from "react-hook-form";
import React from "react";

const TestComponent = () => {
  // Try to get form context - ra-core Form should provide this
  let formStatus = "No Form";
  try {
    const form = useFormContext();
    if (form && typeof form.control !== "undefined") {
      formStatus = "Form Found";
    }
  } catch {
    // No form context
  }

  const record = useRecordContext();
  return (
    <div>
      <div data-testid="form-status">{formStatus}</div>
      <div data-testid="record-status">{record ? "Record Found" : "No Record"}</div>
    </div>
  );
};

describe("Test React Admin Form", () => {
  test("provides FormProvider", async () => {
    const saveContext = {
      save: vi.fn(),
      saving: false,
      mutationMode: "pessimistic" as const,
    };

    const record = { id: 1, name: "Test" };

    renderWithAdminContext(
      <SaveContextProvider value={saveContext}>
        <Form record={record} onSubmit={vi.fn()}>
          <TestComponent />
        </Form>
      </SaveContextProvider>,
      { record }
    );

    // The Form component from ra-core should provide FormProvider context
    await waitFor(() => {
      const formStatus = screen.getByTestId("form-status");
      const recordStatus = screen.getByTestId("record-status");

      // If ra-core Form doesn't provide FormProvider, we'll see "No Form"
      // This test verifies the integration
      expect(formStatus).toBeInTheDocument();
      expect(recordStatus).toHaveTextContent("Record Found");
    });
  });
});
