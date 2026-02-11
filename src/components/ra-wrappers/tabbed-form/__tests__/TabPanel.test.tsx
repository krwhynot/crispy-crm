import { screen } from "@testing-library/react";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { Tabs } from "@/components/ui/tabs";
import { TabPanel } from "../TabPanel";
import { describe, it, expect } from "vitest";

describe("TabPanel", () => {
  it("renders children correctly", () => {
    renderWithAdminContext(
      <Tabs defaultValue="test">
        <TabPanel value="test">
          <div>Test Content</div>
        </TabPanel>
      </Tabs>
    );
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("applies consistent styling classes", () => {
    const { container } = renderWithAdminContext(
      <Tabs defaultValue="test">
        <TabPanel value="test">
          <div>Test Content</div>
        </TabPanel>
      </Tabs>
    );
    const content = container.querySelector('[role="tabpanel"]');
    expect(content?.className).toContain("rounded-b-lg");
    expect(content?.className).toContain("border");
    expect(content?.className).toContain("p-3");
  });

  it("applies semantic color variables", () => {
    const { container } = renderWithAdminContext(
      <Tabs defaultValue="test">
        <TabPanel value="test">
          <div>Test Content</div>
        </TabPanel>
      </Tabs>
    );
    const content = container.querySelector('[role="tabpanel"]');
    expect(content?.className).toContain("border-border");
    expect(content?.className).toContain("bg-background");
  });

  it("passes className prop through", () => {
    const { container } = renderWithAdminContext(
      <Tabs defaultValue="test">
        <TabPanel value="test" className="custom-class">
          <div>Test Content</div>
        </TabPanel>
      </Tabs>
    );
    const content = container.querySelector('[role="tabpanel"]');
    expect(content?.className).toContain("custom-class");
  });
});
