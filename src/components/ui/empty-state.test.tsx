import { screen } from "@testing-library/react";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import userEvent from "@testing-library/user-event";
import { TrendingUp } from "lucide-react";
import { EmptyState } from "./empty-state";

describe("EmptyState", () => {
  it("renders title and description", () => {
    renderWithAdminContext(<EmptyState title="No Data Found" description="Try adjusting your filters." />);

    expect(screen.getByRole("heading", { name: "No Data Found" })).toBeInTheDocument();
    expect(screen.getByText("Try adjusting your filters.")).toBeInTheDocument();
  });

  it("renders icon when provided", () => {
    renderWithAdminContext(
      <EmptyState
        title="No Data Found"
        description="Try adjusting your filters."
        icon={TrendingUp}
      />
    );

    const svg = document.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  it("does not render icon when not provided", () => {
    renderWithAdminContext(<EmptyState title="No Data Found" description="Try adjusting your filters." />);

    const svg = document.querySelector("svg");
    expect(svg).not.toBeInTheDocument();
  });

  it("renders action button when provided (single action prop)", () => {
    renderWithAdminContext(
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

  it("renders action buttons when provided (actions array)", () => {
    renderWithAdminContext(
      <EmptyState
        title="No Data Found"
        description="Try adjusting your filters."
        actions={[
          { label: "Primary Action", onClick: vi.fn() },
          { label: "Secondary Action", onClick: vi.fn(), variant: "outline" },
        ]}
      />
    );

    expect(screen.getByRole("button", { name: "Primary Action" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Secondary Action" })).toBeInTheDocument();
  });

  it("does not render action button when not provided", () => {
    renderWithAdminContext(<EmptyState title="No Data Found" description="Try adjusting your filters." />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("calls action onClick when button is clicked", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    renderWithAdminContext(
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

  it("renders image when provided", () => {
    renderWithAdminContext(
      <EmptyState
        title="No Data Found"
        description="Try adjusting your filters."
        image="./test.svg"
      />
    );

    const img = screen.getByRole("img", { name: "No Data Found" });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "./test.svg");
  });

  it("renders children when provided", () => {
    renderWithAdminContext(
      <EmptyState title="No Data Found" description="Try adjusting your filters.">
        <div data-testid="custom-child">Custom Content</div>
      </EmptyState>
    );

    expect(screen.getByTestId("custom-child")).toBeInTheDocument();
  });

  it("renders card variant correctly", () => {
    const { container } = renderWithAdminContext(
      <EmptyState
        variant="card"
        title="No Data Found"
        description="Try adjusting your filters."
        icon={TrendingUp}
      />
    );

    expect(container.querySelector("[data-slot='card']")).toBeInTheDocument();
  });

  it("renders fullscreen variant correctly", () => {
    const { container } = renderWithAdminContext(
      <EmptyState
        variant="fullscreen"
        title="No Data Found"
        description="Try adjusting your filters."
      />
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass("min-h-[calc(100dvh-4rem)]");
  });

  it("applies custom className", () => {
    const { container } = renderWithAdminContext(
      <EmptyState
        title="No Data Found"
        description="Try adjusting your filters."
        className="custom-class"
      />
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass("custom-class");
  });

  it("applies data-tutorial attribute", () => {
    const { container } = renderWithAdminContext(
      <EmptyState
        title="No Data Found"
        description="Try adjusting your filters."
        data-tutorial="empty-state-tutorial"
      />
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveAttribute("data-tutorial", "empty-state-tutorial");
  });
});
