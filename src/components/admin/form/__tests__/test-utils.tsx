import * as React from "react";
import { render, RenderOptions } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import { FormProgressProvider } from "../FormProgressProvider";

interface TestWrapperProps {
  children: React.ReactNode;
  defaultValues?: Record<string, unknown>;
  initialProgress?: number;
}

export function TestFormWrapper({
  children,
  defaultValues = {},
  initialProgress = 10,
}: TestWrapperProps) {
  const methods = useForm({ defaultValues, mode: "onBlur" });

  return (
    <FormProvider {...methods}>
      <FormProgressProvider initialProgress={initialProgress}>
        {children}
      </FormProgressProvider>
    </FormProvider>
  );
}

interface RenderWithFormOptions extends Omit<RenderOptions, "wrapper"> {
  defaultValues?: Record<string, unknown>;
  initialProgress?: number;
}

export function renderWithForm(
  ui: React.ReactElement,
  options?: RenderWithFormOptions
) {
  const { defaultValues, initialProgress, ...renderOptions } = options ?? {};

  return render(ui, {
    wrapper: ({ children }) => (
      <TestFormWrapper
        defaultValues={defaultValues}
        initialProgress={initialProgress}
      >
        {children}
      </TestFormWrapper>
    ),
    ...renderOptions,
  });
}

export * from "@testing-library/react";
export { renderWithForm as render };
