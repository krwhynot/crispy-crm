/**
 * Smoke test for TagList component
 *
 * Verifies TagList renders with UnifiedListPageLayout after migration.
 */

import { describe, test, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { TagList } from "../TagList";

// Mock UnifiedListPageLayout to verify it's in the tree
vi.mock("@/components/layouts/UnifiedListPageLayout", () => ({
  UnifiedListPageLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="unified-list-page-layout">{children}</div>
  ),
}));

// Mock PremiumDatagrid to avoid full MUI rendering
vi.mock("@/components/ra-wrappers/PremiumDatagrid", () => ({
  PremiumDatagrid: ({ children }: { children: React.ReactNode }) => (
    <table data-testid="premium-datagrid">
      <tbody>
        <tr>{children}</tr>
      </tbody>
    </table>
  ),
}));

describe("TagList", () => {
  test("renders with UnifiedListPageLayout", async () => {
    renderWithAdminContext(<TagList />, {
      resources: ["tags"],
      resource: "tags",
    });

    await waitFor(() => {
      expect(screen.getByTestId("unified-list-page-layout")).toBeInTheDocument();
    });
  });
});
