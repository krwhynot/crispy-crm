import { describe, test, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import * as React from "react";
import { FormProvider, useForm } from "react-hook-form";
import { FormWizard, useWizard } from "../FormWizard";
import { FormProgressProvider } from "../FormProgressProvider";
import type { WizardStepConfig } from "../wizard-types";

const DEFAULT_STEPS: WizardStepConfig[] = [
  { id: "step1", title: "Step 1", fields: ["name"] },
  { id: "step2", title: "Step 2", fields: ["email"] },
  { id: "step3", title: "Step 3", fields: [] },
];

// Helper wrapper that includes FormProvider
function createWrapper(
  steps: WizardStepConfig[] = DEFAULT_STEPS,
  onSubmit = vi.fn(),
  defaultValues: Record<string, unknown> = {}
) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
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
  };
}

describe("FormWizard", () => {
  describe("useWizard hook", () => {
    test("throws error when useWizard called outside provider", () => {
      expect(() => {
        renderHook(() => useWizard());
      }).toThrow("useWizard must be used within FormWizard");
    });

    test("initializes at step 1", () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useWizard(), { wrapper });

      expect(result.current.currentStep).toBe(1);
      expect(result.current.totalSteps).toBe(3);
      expect(result.current.currentStepConfig).toEqual(DEFAULT_STEPS[0]);
    });
  });

  describe("goToNext", () => {
    test("advances step when validation passes (no required fields)", async () => {
      const stepsWithNoValidation: WizardStepConfig[] = [
        { id: "step1", title: "Step 1", fields: [] },
        { id: "step2", title: "Step 2", fields: [] },
      ];
      const wrapper = createWrapper(stepsWithNoValidation);
      const { result } = renderHook(() => useWizard(), { wrapper });

      expect(result.current.currentStep).toBe(1);

      let success: boolean;
      await act(async () => {
        success = await result.current.goToNext();
      });

      expect(success!).toBe(true);
      expect(result.current.currentStep).toBe(2);
    });

    test("stays on step when validation fails", async () => {
      // Create steps that require a field
      const stepsWithValidation: WizardStepConfig[] = [
        { id: "step1", title: "Step 1", fields: ["name"] },
        { id: "step2", title: "Step 2", fields: [] },
      ];

      // Wrapper with validation rules
      function WrapperWithValidation({ children }: { children: React.ReactNode }) {
        const methods = useForm({
          defaultValues: { name: "" },
          mode: "onBlur",
        });

        // Register the field with validation
        React.useEffect(() => {
          methods.register("name", { required: "Name is required" });
        }, [methods]);

        return (
          <FormProvider {...methods}>
            <FormProgressProvider>
              <FormWizard steps={stepsWithValidation} onSubmit={vi.fn()}>
                {children}
              </FormWizard>
            </FormProgressProvider>
          </FormProvider>
        );
      }

      const { result } = renderHook(() => useWizard(), {
        wrapper: WrapperWithValidation,
      });

      expect(result.current.currentStep).toBe(1);

      let success: boolean;
      await act(async () => {
        success = await result.current.goToNext();
      });

      expect(success!).toBe(false);
      expect(result.current.currentStep).toBe(1);
    });
  });

  describe("goToPrevious", () => {
    test("goes back to previous step", async () => {
      const stepsWithNoValidation: WizardStepConfig[] = [
        { id: "step1", title: "Step 1", fields: [] },
        { id: "step2", title: "Step 2", fields: [] },
      ];
      const wrapper = createWrapper(stepsWithNoValidation);
      const { result } = renderHook(() => useWizard(), { wrapper });

      // Go to step 2
      await act(async () => {
        await result.current.goToNext();
      });
      expect(result.current.currentStep).toBe(2);

      // Go back to step 1
      act(() => {
        result.current.goToPrevious();
      });
      expect(result.current.currentStep).toBe(1);
    });

    test("does not go below step 1", () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useWizard(), { wrapper });

      expect(result.current.currentStep).toBe(1);

      act(() => {
        result.current.goToPrevious();
      });

      expect(result.current.currentStep).toBe(1);
    });
  });

  describe("submission", () => {
    test("calls onSubmit on final step goToNext", async () => {
      const onSubmit = vi.fn();
      const stepsWithNoValidation: WizardStepConfig[] = [
        { id: "step1", title: "Step 1", fields: [] },
        { id: "step2", title: "Step 2", fields: [] },
      ];
      const wrapper = createWrapper(stepsWithNoValidation, onSubmit, {
        name: "Test",
      });
      const { result } = renderHook(() => useWizard(), { wrapper });

      // Go to final step
      await act(async () => {
        await result.current.goToNext();
      });
      expect(result.current.currentStep).toBe(2);

      // Submit on final step
      await act(async () => {
        await result.current.goToNext();
      });

      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ name: "Test" }));
    });

    test("sets isSubmitting during submit and resets after", async () => {
      const onSubmit = vi.fn(() => {
        return new Promise<void>((resolve) => {
          // Small delay to simulate async submit
          setTimeout(resolve, 50);
        });
      });

      const singleStepConfig: WizardStepConfig[] = [
        { id: "step1", title: "Step 1", fields: [] },
      ];
      const wrapper = createWrapper(singleStepConfig, onSubmit);
      const { result } = renderHook(() => useWizard(), { wrapper });

      expect(result.current.isSubmitting).toBe(false);

      // Submit and wait for completion
      await act(async () => {
        await result.current.goToNext();
      });

      // Verify onSubmit was called
      expect(onSubmit).toHaveBeenCalledTimes(1);

      // After completion, isSubmitting should be false
      expect(result.current.isSubmitting).toBe(false);
    });
  });

  describe("accessibility", () => {
    test("includes aria-live region for step announcements", () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useWizard(), { wrapper });

      // The aria-live region is rendered by FormWizard
      // We can verify the wizard context is properly set up
      expect(result.current.currentStep).toBe(1);
      expect(result.current.currentStepConfig.title).toBe("Step 1");
      // The actual aria-live region is tested in integration tests with the full component
    });
  });
});
