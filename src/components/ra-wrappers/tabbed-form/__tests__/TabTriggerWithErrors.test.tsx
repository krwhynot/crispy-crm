import { screen } from "@testing-library/react";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { Tabs, TabsList } from "@/components/ui/tabs";
import { TabTriggerWithErrors } from "../TabTriggerWithErrors";
import { describe, it, expect } from "vitest";

describe("TabTriggerWithErrors", () => {
  it("renders label without error badge when errorCount is 0", () => {
    renderWithAdminContext(
      <Tabs defaultValue="general">
        <TabsList>
          <TabTriggerWithErrors value="general" label="General" errorCount={0} />
        </TabsList>
      </Tabs>
    );
    expect(screen.getByText("General")).toBeInTheDocument();
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("renders label with error badge when errorCount > 0", () => {
    renderWithAdminContext(
      <Tabs defaultValue="general">
        <TabsList>
          <TabTriggerWithErrors value="general" label="General" errorCount={2} />
        </TabsList>
      </Tabs>
    );
    expect(screen.getByText("General")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("applies correct aria-label with error count", () => {
    const { container } = renderWithAdminContext(
      <Tabs defaultValue="general">
        <TabsList>
          <TabTriggerWithErrors value="general" label="General" errorCount={2} />
        </TabsList>
      </Tabs>
    );
    const button = container.querySelector("button");
    expect(button?.getAttribute("aria-label")).toBe("General tab, 2 errors");
  });

  it("applies correct aria-label without errors", () => {
    const { container } = renderWithAdminContext(
      <Tabs defaultValue="general">
        <TabsList>
          <TabTriggerWithErrors value="general" label="General" errorCount={0} />
        </TabsList>
      </Tabs>
    );
    const button = container.querySelector("button");
    expect(button?.getAttribute("aria-label")).toBe("General tab");
  });
});
