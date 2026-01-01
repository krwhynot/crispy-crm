import * as React from "react";
import { render } from "@testing-library/react";
import type { RenderOptions } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import { FormProgressProvider } from "../FormProgressProvider";
import { FormWizard } from "../FormWizard";
import type { WizardStepConfig } from "../wizard-types";

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
      <FormProgressProvider initialProgress={initialProgress}>{children}</FormProgressProvider>
    </FormProvider>
  );
}

interface RenderWithFormOptions extends Omit<RenderOptions, "wrapper"> {
  defaultValues?: Record<string, unknown>;
  initialProgress?: number;
}

export function renderWithForm(ui: React.ReactElement, options?: RenderWithFormOptions) {
  const { defaultValues, initialProgress, ...renderOptions } = options ?? {};

  return render(ui, {
    wrapper: ({ children }) => (
      <TestFormWrapper defaultValues={defaultValues} initialProgress={initialProgress}>
        {children}
      </TestFormWrapper>
    ),
    ...renderOptions,
  });
}

// Wizard-specific test wrapper
interface TestWizardWrapperProps {
  children: React.ReactNode;
  defaultValues?: Record<string, unknown>;
  steps?: WizardStepConfig[];
  onSubmit?: (data: unknown) => void | Promise<void>;
}

const DEFAULT_TEST_STEPS: WizardStepConfig[] = [
  { id: "step1", title: "Step 1", fields: ["field1"] },
  { id: "step2", title: "Step 2", fields: ["field2"] },
  { id: "step3", title: "Step 3", fields: [] },
];

export function TestWizardWrapper({
  children,
  defaultValues = {},
  steps = DEFAULT_TEST_STEPS,
  onSubmit = () => {},
}: TestWizardWrapperProps) {
  const methods = useForm({ defaultValues, mode: "onBlur" });

  return (
    <FormProvider {...methods}>
      <FormProgressProvider>
        <FormWizard steps={steps} onSubmit={onSubmit}>
          {children}
        </FormWizard>
      </FormProgressProvider>
    </FormProvider>
  );
}

interface RenderWithWizardOptions extends Omit<RenderOptions, "wrapper"> {
  defaultValues?: Record<string, unknown>;
  steps?: WizardStepConfig[];
  onSubmit?: (data: unknown) => void | Promise<void>;
}

export function renderWithWizard(ui: React.ReactElement, options?: RenderWithWizardOptions) {
  const { defaultValues, steps, onSubmit, ...renderOptions } = options ?? {};

  return render(ui, {
    wrapper: ({ children }) => (
      <TestWizardWrapper defaultValues={defaultValues} steps={steps} onSubmit={onSubmit}>
        {children}
      </TestWizardWrapper>
    ),
    ...renderOptions,
  });
}

export * from "@testing-library/react";
export { renderWithForm as render };
export { DEFAULT_TEST_STEPS };
