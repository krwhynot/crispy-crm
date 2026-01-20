import { describe, test, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormProvider, useForm } from "react-hook-form";
import { SaveButtonGroup } from "../SaveButtonGroup";

interface TestFormData {
  name: string;
}

const FormWrapper = ({
  children,
  onSubmit,
  defaultValues = { name: "test" },
}: {
  children: React.ReactNode;
  onSubmit: (data: TestFormData) => void;
  defaultValues?: TestFormData;
}) => {
  const methods = useForm<TestFormData>({ defaultValues });
  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>{children}</form>
    </FormProvider>
  );
};

describe("SaveButtonGroup", () => {
  test("renders primary Save button", () => {
    const onSave = vi.fn();
    const onSaveAndNew = vi.fn();

    render(
      <FormWrapper onSubmit={onSave}>
        <SaveButtonGroup onSave={onSave} onSaveAndNew={onSaveAndNew} />
      </FormWrapper>
    );

    const saveButton = screen.getByRole("button", { name: /^save$/i });
    expect(saveButton).toBeInTheDocument();
    expect(saveButton).toHaveAttribute("type", "button");
  });

  test("primary Save button calls onSave with form data", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const onSaveAndNew = vi.fn();

    render(
      <FormWrapper onSubmit={onSave} defaultValues={{ name: "John Doe" }}>
        <SaveButtonGroup onSave={onSave} onSaveAndNew={onSaveAndNew} />
      </FormWrapper>
    );

    const saveButton = screen.getByRole("button", { name: /^save$/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({ name: "John Doe" });
      expect(onSave).toHaveBeenCalledTimes(1);
      expect(onSaveAndNew).not.toHaveBeenCalled();
    });
  });

  test("dropdown 'Save + Create Another' calls onSaveAndNew", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const onSaveAndNew = vi.fn();

    render(
      <FormWrapper onSubmit={onSave} defaultValues={{ name: "Jane Smith" }}>
        <SaveButtonGroup onSave={onSave} onSaveAndNew={onSaveAndNew} />
      </FormWrapper>
    );

    const dropdownTrigger = screen.getByLabelText(/more save options/i);
    await user.click(dropdownTrigger);

    const saveAndNewOption = await screen.findByRole("menuitem", {
      name: /save \+ create another/i,
    });
    await user.click(saveAndNewOption);

    await waitFor(() => {
      expect(onSaveAndNew).toHaveBeenCalledWith({ name: "Jane Smith" });
      expect(onSaveAndNew).toHaveBeenCalledTimes(1);
      expect(onSave).not.toHaveBeenCalled();
    });
  });

  test("dropdown 'Save' option calls onSave", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const onSaveAndNew = vi.fn();

    render(
      <FormWrapper onSubmit={onSave} defaultValues={{ name: "Test User" }}>
        <SaveButtonGroup onSave={onSave} onSaveAndNew={onSaveAndNew} />
      </FormWrapper>
    );

    const dropdownTrigger = screen.getByLabelText(/more save options/i);
    await user.click(dropdownTrigger);

    const saveOption = await screen.findByRole("menuitem", { name: /^save$/i });
    await user.click(saveOption);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({ name: "Test User" });
      expect(onSave).toHaveBeenCalledTimes(1);
      expect(onSaveAndNew).not.toHaveBeenCalled();
    });
  });

  test("buttons are disabled when isSubmitting is true", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn(() => new Promise((resolve) => setTimeout(resolve, 1000)));
    const onSaveAndNew = vi.fn();

    render(
      <FormWrapper onSubmit={onSave}>
        <SaveButtonGroup onSave={onSave} onSaveAndNew={onSaveAndNew} />
      </FormWrapper>
    );

    const saveButton = screen.getByRole("button", { name: /^save$/i });
    const dropdownTrigger = screen.getByLabelText(/more save options/i);

    await user.click(saveButton);

    await waitFor(() => {
      expect(saveButton).toBeDisabled();
      expect(dropdownTrigger).toBeDisabled();
    });
  });

  test("validation failure does not call handlers", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const onSaveAndNew = vi.fn();

    const FormWrapperWithValidation = ({ children }: { children: React.ReactNode }) => {
      const methods = useForm<TestFormData>({
        defaultValues: { name: "" },
        mode: "onSubmit",
      });

      return (
        <FormProvider {...methods}>
          <form
            onSubmit={methods.handleSubmit(
              onSave,
              () => {} // Error handler
            )}
          >
            {children}
            <input {...methods.register("name", { required: "Name is required" })} />
          </form>
        </FormProvider>
      );
    };

    render(
      <FormWrapperWithValidation>
        <SaveButtonGroup onSave={onSave} onSaveAndNew={onSaveAndNew} />
      </FormWrapperWithValidation>
    );

    const saveButton = screen.getByRole("button", { name: /^save$/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(onSave).not.toHaveBeenCalled();
      expect(onSaveAndNew).not.toHaveBeenCalled();
    });
  });
});
