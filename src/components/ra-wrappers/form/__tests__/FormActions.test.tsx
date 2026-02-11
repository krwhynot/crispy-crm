import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { useForm, FormProvider } from "react-hook-form";
import { FormActions } from "../FormActions";
import React from "react";

const FormWrapper = ({
  children,
  onSubmit,
  validation,
}: {
  children: React.ReactNode;
  onSubmit: (data: Record<string, unknown>) => void;
  validation?: Record<string, unknown>;
}) => {
  const methods = useForm({
    defaultValues: { name: "test" },
    mode: "onSubmit",
  });
  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        {validation && <input {...methods.register("name", validation)} data-testid="name-input" />}
        {children}
      </form>
    </FormProvider>
  );
};

describe("FormActions", () => {
  it("renders Cancel and Save buttons", () => {
    const onCancel = vi.fn();
    const onSubmit = vi.fn();

    renderWithAdminContext(
      <FormWrapper onSubmit={onSubmit}>
        <FormActions onCancel={onCancel} />
      </FormWrapper>
    );

    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
  });

  it("Save button triggers form submit with validation", async () => {
    const onCancel = vi.fn();
    const onSubmit = vi.fn();
    const validation = { required: "Name is required" };

    renderWithAdminContext(
      <FormWrapper onSubmit={onSubmit} validation={validation}>
        <FormActions onCancel={onCancel} />
      </FormWrapper>
    );

    const saveButton = screen.getByRole("button", { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
  });

  it("Save button does NOT call handler when validation fails", async () => {
    const onCancel = vi.fn();
    const onSubmit = vi.fn();
    const validation = { required: "Name is required" };

    renderWithAdminContext(
      <FormWrapper onSubmit={onSubmit} validation={validation}>
        <FormActions onCancel={onCancel} />
      </FormWrapper>
    );

    const nameInput = screen.getByTestId("name-input");
    fireEvent.change(nameInput, { target: { value: "" } });

    const saveButton = screen.getByRole("button", { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  it("Cancel button calls onCancel", () => {
    const onCancel = vi.fn();
    const onSubmit = vi.fn();

    renderWithAdminContext(
      <FormWrapper onSubmit={onSubmit}>
        <FormActions onCancel={onCancel} />
      </FormWrapper>
    );

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("Delete button (optional) calls onDelete when provided", () => {
    const onCancel = vi.fn();
    const onDelete = vi.fn();
    const onSubmit = vi.fn();

    renderWithAdminContext(
      <FormWrapper onSubmit={onSubmit}>
        <FormActions onCancel={onCancel} onDelete={onDelete} />
      </FormWrapper>
    );

    const deleteButton = screen.getByRole("button", { name: /delete/i });
    fireEvent.click(deleteButton);

    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("does not render Delete button when onDelete is not provided", () => {
    const onCancel = vi.fn();
    const onSubmit = vi.fn();

    renderWithAdminContext(
      <FormWrapper onSubmit={onSubmit}>
        <FormActions onCancel={onCancel} />
      </FormWrapper>
    );

    expect(screen.queryByRole("button", { name: /delete/i })).not.toBeInTheDocument();
  });

  it("renders SaveButtonGroup when showSaveAndNew=true and both handlers provided", () => {
    const onCancel = vi.fn();
    const onSave = vi.fn();
    const onSaveAndNew = vi.fn();
    const onSubmit = vi.fn();

    renderWithAdminContext(
      <FormWrapper onSubmit={onSubmit}>
        <FormActions
          onCancel={onCancel}
          onSave={onSave}
          onSaveAndNew={onSaveAndNew}
          showSaveAndNew={true}
        />
      </FormWrapper>
    );

    const saveButtonGroup = screen
      .getByRole("button", { name: /more save options/i })
      .closest('[data-slot="save-button-group"]');
    expect(saveButtonGroup).toBeInTheDocument();
  });

  it("applies Fitts Law layout: Delete far left, Cancel/Save right-aligned", () => {
    const onCancel = vi.fn();
    const onDelete = vi.fn();
    const onSubmit = vi.fn();

    const { container } = renderWithAdminContext(
      <FormWrapper onSubmit={onSubmit}>
        <FormActions onCancel={onCancel} onDelete={onDelete} />
      </FormWrapper>
    );

    const actionsWrapper = container.querySelector('[data-slot="form-actions"]');
    expect(actionsWrapper).toHaveClass("justify-between");

    const deleteButton = screen.getByRole("button", { name: /delete/i });
    expect(deleteButton.parentElement).toHaveClass("flex-shrink-0");
  });
});
