// src/atomic-crm/reports/components/FilterChip.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FilterChip } from "./FilterChip";

describe("FilterChip", () => {
  const defaultProps = {
    label: "Date Range",
    value: "Last 7 Days",
    onRemove: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders label and value", () => {
    render(<FilterChip {...defaultProps} />);

    expect(screen.getByText("Date Range:")).toBeInTheDocument();
    expect(screen.getByText("Last 7 Days")).toBeInTheDocument();
  });

  it("calls onRemove when remove button is clicked", async () => {
    const onRemove = vi.fn();
    const user = userEvent.setup();

    render(<FilterChip {...defaultProps} onRemove={onRemove} />);

    const removeButton = screen.getByRole("button", {
      name: /remove date range filter/i,
    });
    await user.click(removeButton);

    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("calls onRemove when Enter key is pressed on remove button", () => {
    const onRemove = vi.fn();

    render(<FilterChip {...defaultProps} onRemove={onRemove} />);

    const removeButton = screen.getByRole("button", {
      name: /remove date range filter/i,
    });
    fireEvent.keyDown(removeButton, { key: "Enter" });

    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("calls onRemove when Space key is pressed on remove button", () => {
    const onRemove = vi.fn();

    render(<FilterChip {...defaultProps} onRemove={onRemove} />);

    const removeButton = screen.getByRole("button", {
      name: /remove date range filter/i,
    });
    fireEvent.keyDown(removeButton, { key: " " });

    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("has correct ARIA attributes", () => {
    render(<FilterChip {...defaultProps} />);

    // Container has role="listitem"
    const listItem = screen.getByRole("listitem");
    expect(listItem).toBeInTheDocument();

    // Remove button has descriptive aria-label
    const removeButton = screen.getByRole("button", {
      name: /remove date range filter/i,
    });
    expect(removeButton).toHaveAttribute("aria-label", "Remove Date Range filter");
  });
});
