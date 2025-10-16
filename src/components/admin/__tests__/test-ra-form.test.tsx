import { describe, test, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { Form, SaveContextProvider } from "ra-core";
import { useFormContext } from "react-hook-form";
import React from "react";

const TestComponent = () => {
  const form = useFormContext();
  return <div data-testid="form-status">{form ? "Form Found" : "No Form"}</div>;
};

describe("Test React Admin Form", () => {
  test("provides FormProvider", () => {
    const saveContext = {
      save: vi.fn(),
      saving: false,
      mutationMode: "pessimistic" as const
    };

    renderWithAdminContext(
      <SaveContextProvider value={saveContext}>
        <Form defaultValues={{}}>
          <TestComponent />
        </Form>
      </SaveContextProvider>
    );

    expect(screen.getByTestId("form-status")).toHaveTextContent("Form Found");
  });
});
