/**
 * Tests for FormGrid component
 *
 * Tests the grid layout component for forms with 2-column and 4-column variants
 */

import React from "react";
import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FormGrid } from "../FormGrid";

describe("FormGrid", () => {
  test("renders children correctly", () => {
    render(
      <FormGrid>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
      </FormGrid>
    );

    expect(screen.getByTestId("child-1")).toBeInTheDocument();
    expect(screen.getByTestId("child-2")).toBeInTheDocument();
  });

  test("applies 2-column grid by default", () => {
    render(
      <FormGrid>
        <div>Child 1</div>
      </FormGrid>
    );

    const grid = document.querySelector('[data-testid="form-grid"]');
    expect(grid).toHaveClass("grid");
    expect(grid).toHaveClass("grid-cols-1");
    expect(grid).toHaveClass("md:grid-cols-2");
    expect(grid).toHaveClass("gap-x-6");
    expect(grid).toHaveClass("gap-y-5");
  });

  test("applies 4-column grid when columns={4}", () => {
    render(
      <FormGrid columns={4}>
        <div>Child 1</div>
      </FormGrid>
    );

    const grid = document.querySelector('[data-testid="form-grid"]');
    expect(grid).toHaveClass("grid");
    expect(grid).toHaveClass("grid-cols-1");
    expect(grid).toHaveClass("md:grid-cols-4");
    expect(grid).toHaveClass("gap-x-6");
    expect(grid).toHaveClass("gap-y-5");
  });

  test("applies gap utilities consistently", () => {
    render(
      <FormGrid>
        <div>Child</div>
      </FormGrid>
    );

    const grid = document.querySelector('[data-testid="form-grid"]');
    expect(grid).toHaveClass("gap-x-6");
    expect(grid).toHaveClass("gap-y-5");
  });

  test("supports custom className", () => {
    render(
      <FormGrid className="custom-class another-class">
        <div>Child</div>
      </FormGrid>
    );

    const grid = document.querySelector('[data-testid="form-grid"]');
    expect(grid).toHaveClass("custom-class");
    expect(grid).toHaveClass("another-class");
    expect(grid).toHaveClass("grid");
  });

  test("merges custom className with default classes", () => {
    render(
      <FormGrid columns={4} className="border p-4">
        <div>Child</div>
      </FormGrid>
    );

    const grid = document.querySelector('[data-testid="form-grid"]');
    expect(grid).toHaveClass("grid");
    expect(grid).toHaveClass("md:grid-cols-4");
    expect(grid).toHaveClass("border");
    expect(grid).toHaveClass("p-4");
  });
});
