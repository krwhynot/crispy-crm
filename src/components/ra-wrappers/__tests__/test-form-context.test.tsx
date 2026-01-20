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
  } catch {
    contextStatus = "Error getting context";
  }
  return <div data-testid="context-status">{contextStatus}</div>;
};

// FormWrapper that provides both React Admin Form context and React Hook Form FormProvider
const FormWrapper = ({ children }: { children: React.ReactNode }) => {
  const saveContext = {
    save: () => {},
    saving: false,
    mutationMode: "pessimistic" as const,
  };

  const methods = useForm({ defaultValues: {} });

  return (
    <SaveContextProvider value={saveContext}>
      <RaForm defaultValues={{}} onSubmit={() => {}}>
        <Form {...methods}>{children}</Form>
      </RaForm>
    </SaveContextProvider>
  );
};

describe("React Admin Form FormProvider", () => {
  test("provides FormProvider context", () => {
    renderWithAdminContext(
      <FormWrapper>
        <TestComponent />
      </FormWrapper>
    );

    const status = screen.getByTestId("context-status");
    expect(status).toHaveTextContent("Has context");
  });
});
