import { render, screen } from "@testing-library/react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { TabPanel } from "../TabPanel";
import { describe, it, expect } from "vitest";

describe("TabPanel", () => {
  it("renders children correctly", () => {
    render(
      <Tabs defaultValue="test">
        <TabPanel value="test">
          <div>Test Content</div>
        </TabPanel>
      </Tabs>
    );
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("applies consistent styling classes", () => {
    const { container } = render(
      <Tabs defaultValue="test">
        <TabPanel value="test">
          <div>Test Content</div>
        </TabPanel>
      </Tabs>
    );
    const content = container.querySelector('[role="tabpanel"]');
    expect(content?.className).toContain("rounded-lg");
    expect(content?.className).toContain("border");
    expect(content?.className).toContain("p-6");
  });

  it("applies semantic color variables", () => {
    const { container } = render(
      <Tabs defaultValue="test">
        <TabPanel value="test">
          <div>Test Content</div>
        </TabPanel>
      </Tabs>
    );
    const content = container.querySelector('[role="tabpanel"]');
    expect(content?.className).toContain("border-[color:var(--border-subtle)]");
    expect(content?.className).toContain("bg-[color:var(--bg-secondary)]");
  });

  it("passes className prop through", () => {
    const { container } = render(
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
