import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm, FormProvider } from "react-hook-form";
import { createFormResolver } from "@/lib/zodErrorFormatting";
import { z } from "zod";
import { NotesSection } from "../NotesSection";

/**
 * Test schema for NotesSection - minimal schema for testing notes field
 * Uses the same shape as ActivityLogInput for the notes field
 */
const testSchema = z.object({
  notes: z.string().trim().min(1, "Notes are required"),
});

type TestFormData = z.infer<typeof testSchema>;

/**
 * Test wrapper component that provides form context
 * Mimics how NotesSection is used in QuickLogForm
 */
function TestWrapper({
  defaultValues = { notes: "" },
  onSubmit = vi.fn(),
}: {
  defaultValues?: Partial<TestFormData>;
  onSubmit?: (data: TestFormData) => void;
}) {
  const form = useForm<TestFormData>({
    resolver: createFormResolver(testSchema),
    defaultValues: {
      notes: "",
      ...defaultValues,
    },
    mode: "onSubmit",
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <NotesSection control={form.control} />
        <button type="submit">Submit</button>
      </form>
    </FormProvider>
  );
}

describe("NotesSection", () => {
  it("renders FormLabel 'Notes'", () => {
    render(<TestWrapper />);

    expect(screen.getByText("Notes")).toBeInTheDocument();
  });

  it("renders Textarea with placeholder", () => {
    render(<TestWrapper />);

    const textarea = screen.getByPlaceholderText("Summary of the interaction...");
    expect(textarea).toBeInTheDocument();
    expect(textarea.tagName).toBe("TEXTAREA");
  });

  it("has aria-invalid when fieldState.invalid", async () => {
    const user = userEvent.setup();
    render(<TestWrapper />);

    const textarea = screen.getByPlaceholderText("Summary of the interaction...");

    // Submit without filling notes to trigger validation error
    await user.click(screen.getByRole("button", { name: /submit/i }));

    // After validation error, aria-invalid should be true
    expect(textarea).toHaveAttribute("aria-invalid", "true");
  });

  it("has aria-describedby linking to error", async () => {
    const user = userEvent.setup();
    render(<TestWrapper />);

    const textarea = screen.getByPlaceholderText("Summary of the interaction...");

    // Submit without filling notes to trigger validation error
    await user.click(screen.getByRole("button", { name: /submit/i }));

    // aria-describedby should include the error message id
    const describedBy = textarea.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(describedBy).toContain("notes-error");
  });

  it("FormMessage has role='alert'", async () => {
    const user = userEvent.setup();
    render(<TestWrapper />);

    // Submit without filling notes to trigger validation error
    await user.click(screen.getByRole("button", { name: /submit/i }));

    // Error message should have role="alert"
    const errorMessage = screen.getByRole("alert");
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveTextContent("Notes are required");
  });

  it("accepts user input", async () => {
    const user = userEvent.setup();
    render(<TestWrapper />);

    const textarea = screen.getByPlaceholderText("Summary of the interaction...");
    await user.type(textarea, "Test notes content");

    expect(textarea).toHaveValue("Test notes content");
  });

  it("has min-h-24 class for proper height", () => {
    render(<TestWrapper />);

    const textarea = screen.getByPlaceholderText("Summary of the interaction...");
    expect(textarea).toHaveClass("min-h-24");
  });

  it("clears aria-invalid when valid input is provided", async () => {
    const user = userEvent.setup();
    render(<TestWrapper />);

    const textarea = screen.getByPlaceholderText("Summary of the interaction...");

    // First trigger validation error
    await user.click(screen.getByRole("button", { name: /submit/i }));
    expect(textarea).toHaveAttribute("aria-invalid", "true");

    // Then provide valid input and submit again
    await user.type(textarea, "Valid notes content");
    await user.click(screen.getByRole("button", { name: /submit/i }));

    // aria-invalid should be false when valid
    expect(textarea).toHaveAttribute("aria-invalid", "false");
  });
});
