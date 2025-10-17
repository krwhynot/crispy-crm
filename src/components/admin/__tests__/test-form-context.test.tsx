import React from "react";
import { describe, test, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { Form as RaForm, SaveContextProvider } from "ra-core";
import { useFormContext, useForm } from "react-hook-form";
import { Form } from "../form";

const TestComponent = () => {
  let contextStatus = "No context";
  try {
    const context = useFormContext();
    if (context) {
      contextStatus = "Has context";
    }
  } catch (e) {
    contextStatus = "Error getting context";
  }
  return <div data-testid="context-status">{contextStatus}</div>;
};

describe("React Admin Form FormProvider", () => {
  test("provides FormProvider context", () => {
    const saveContext = {
      save: () => {},
      saving: false,
      mutationMode: "pessimistic" as const
    };

    renderWithAdminContext(
      <SaveContextProvider value={saveContext}>
        <Form defaultValues={{}} onSubmit={() => {}}>
          <TestComponent />
        </Form>
      </SaveContextProvider>
    );

    const status = screen.getByTestId("context-status");
    expect(status).toHaveTextContent("Has context");
  });
});