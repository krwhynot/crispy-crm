// src/atomic-crm/reports/components/EmptyState.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TrendingUp } from "lucide-react";
import { EmptyState } from "./EmptyState";

describe("EmptyState", () => {
  it("renders title and description", () => {
    render(<EmptyState title="No Data Found" description="Try adjusting your filters." />);

    expect(screen.getByRole("heading", { name: "No Data Found" })).toBeInTheDocument();
    expect(screen.getByText("Try adjusting your filters.")).toBeInTheDocument();
  });

  it("renders icon when provided", () => {
    render(
      <EmptyState
        title="No Data Found"
        description="Try adjusting your filters."
        icon={TrendingUp}
      />
    );

    // Icon should be aria-hidden
    const svg = document.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  it("does not render icon when not provided", () => {
    render(<EmptyState title="No Data Found" description="Try adjusting your filters." />);

    const svg = document.querySelector("svg");
    expect(svg).not.toBeInTheDocument();
  });

  it("renders action button when provided", () => {
    render(
      <EmptyState
        title="No Data Found"
        description="Try adjusting your filters."
        action={{
          label: "Create New",
          onClick: vi.fn(),
        }}
      />
    );

    expect(screen.getByRole("button", { name: "Create New" })).toBeInTheDocument();
  });

  it("does not render action button when not provided", () => {
    render(<EmptyState title="No Data Found" description="Try adjusting your filters." />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("calls action onClick when button is clicked", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    render(
      <EmptyState
        title="No Data Found"
        description="Try adjusting your filters."
        action={{
          label: "Create New",
          onClick,
        }}
      />
    );

    await user.click(screen.getByRole("button", { name: "Create New" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
