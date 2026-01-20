import { describe, test, expect } from "vitest";
import { render } from "@testing-library/react";
import { FormLoadingSkeleton } from "../FormLoadingSkeleton";

describe("FormLoadingSkeleton", () => {
  test("renders default 4 rows", () => {
    render(<FormLoadingSkeleton />);

    // Each row has 2 skeleton fields (for 2-column layout)
    const skeletons = document.querySelectorAll('[data-slot="skeleton"]');
    // 4 rows × 2 columns × 2 elements (label + input) = 16 skeletons
    expect(skeletons.length).toBeGreaterThanOrEqual(8);
  });

  test("renders specified number of rows", () => {
    render(<FormLoadingSkeleton rows={2} />);

    // 2 rows × 2 columns = 4 field groups minimum
    const fieldGroups = document.querySelectorAll(".space-y-2");
    expect(fieldGroups.length).toBeGreaterThanOrEqual(4);
  });

  test("renders single column when twoColumn is false", () => {
    render(<FormLoadingSkeleton rows={2} twoColumn={false} />);

    // Should NOT have grid-cols-2
    const grids = document.querySelectorAll(".grid-cols-2");
    expect(grids.length).toBe(0);
  });

  test("wraps in Card component", () => {
    render(<FormLoadingSkeleton />);

    // Card provides the container styling
    expect(document.querySelector("[data-slot='card']")).toBeInTheDocument();
  });

  test("applies semantic spacing classes", () => {
    render(<FormLoadingSkeleton />);

    // Uses design system spacing
    expect(document.querySelector(".space-y-6")).toBeInTheDocument();
    expect(document.querySelector(".p-6")).toBeInTheDocument();
  });
});
