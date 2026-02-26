/**
 * Tests for SearchInput component
 *
 * Tests placeholder handling, type="search" attribute, and aria-label computation.
 * Mocks TextInput to avoid needing full React Admin form context.
 */

import { describe, test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock TextInput to a simple stub that renders an <input> with forwarded props
vi.mock("@/components/ra-wrappers/text-input", () => ({
  TextInput: ({
    source: _source,
    helperText: _helperText,
    alwaysOn: _alwaysOn,
    ...rest
  }: Record<string, unknown>) => <input data-testid="text-input" {...rest} />,
}));

// Mock ra-core to provide useTranslate
vi.mock("ra-core", () => ({
  useTranslate:
    () =>
    (key: string): string =>
      key === "ra.action.search" ? "Search" : key,
}));

// Mock lucide-react Search icon
vi.mock("lucide-react", () => ({
  Search: (props: Record<string, unknown>) => <span data-testid="search-icon" {...props} />,
}));

// Import after mocks are set up
import { SearchInput } from "../search-input";

describe("SearchInput", () => {
  test("renders caller placeholder when provided (not overridden by i18n)", () => {
    // eslint-disable-next-line no-restricted-syntax -- Using bare render with mocked ra-core for isolation
    render(<SearchInput source="q" placeholder="Find contacts..." />);

    const input = screen.getByTestId("text-input");
    expect(input).toHaveAttribute("placeholder", "Find contacts...");
  });

  test("falls back to translated placeholder when omitted", () => {
    // eslint-disable-next-line no-restricted-syntax -- Using bare render with mocked ra-core for isolation
    render(<SearchInput source="q" />);

    const input = screen.getByTestId("text-input");
    // useTranslate mock returns "Search" for "ra.action.search"
    expect(input).toHaveAttribute("placeholder", "Search");
  });

  test("renders with type='search' on the DOM input", () => {
    // eslint-disable-next-line no-restricted-syntax -- Using bare render with mocked ra-core for isolation
    render(<SearchInput source="q" />);

    const input = screen.getByTestId("text-input");
    expect(input).toHaveAttribute("type", "search");
  });

  test("has aria-label matching effective placeholder when no explicit aria-label passed", () => {
    // eslint-disable-next-line no-restricted-syntax -- Using bare render with mocked ra-core for isolation
    render(<SearchInput source="q" placeholder="Search organizations..." />);

    const input = screen.getByTestId("text-input");
    expect(input).toHaveAttribute("aria-label", "Search organizations...");
  });

  test("preserves explicit caller aria-label over placeholder fallback", () => {
    // eslint-disable-next-line no-restricted-syntax -- Using bare render with mocked ra-core for isolation
    render(
      <SearchInput source="q" placeholder="Search organizations..." aria-label="Custom search" />
    );

    const input = screen.getByTestId("text-input");
    expect(input).toHaveAttribute("aria-label", "Custom search");
  });

  test("falls back to i18n translation when aria-label is whitespace-only", () => {
    // eslint-disable-next-line no-restricted-syntax -- Using bare render with mocked ra-core for isolation
    render(<SearchInput source="q" aria-label="   " />);

    const input = screen.getByTestId("text-input");
    // Whitespace aria-label is rejected, falls back to placeholder, then i18n
    expect(input).toHaveAttribute("aria-label", "Search");
  });

  test("throws when label prop is provided", () => {
    expect(() => {
      // eslint-disable-next-line no-restricted-syntax -- Using bare render with mocked ra-core for isolation
      render(<SearchInput source="q" label="Name" />);
    }).toThrow("<SearchInput> isn't designed to be used with a label prop");
  });
});
