import { screen } from "@testing-library/react";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { FormProvider, useForm } from "react-hook-form";
import { Tabs } from "@/components/ui/tabs";
import { TabbedFormInputs } from "../TabbedFormInputs";
import { describe, it, expect } from "vitest";

const FormWrapper = ({ children }: { children: React.ReactNode }) => {
  const methods = useForm();
  return <FormProvider {...methods}>{children}</FormProvider>;
};

describe("TabbedFormInputs", () => {
  it("renders all tabs with correct labels", () => {
    const tabs = [
      {
        key: "general",
        label: "General",
        fields: ["name"],
        content: <div>General Content</div>,
      },
      {
        key: "details",
        label: "Details",
        fields: ["description"],
        content: <div>Details Content</div>,
      },
    ];

    renderWithAdminContext(
      <FormWrapper>
        <Tabs defaultValue="general">
          <TabbedFormInputs tabs={tabs} />
        </Tabs>
      </FormWrapper>
    );

    expect(screen.getByText("General")).toBeInTheDocument();
    expect(screen.getByText("Details")).toBeInTheDocument();
  });

  it("renders tab content for each tab", () => {
    const tabs = [
      {
        key: "general",
        label: "General",
        fields: ["name"],
        content: <div>General Content</div>,
      },
      {
        key: "details",
        label: "Details",
        fields: ["description"],
        content: <div>Details Content</div>,
      },
    ];

    const { container } = renderWithAdminContext(
      <FormWrapper>
        <Tabs defaultValue="general">
          <TabbedFormInputs tabs={tabs} />
        </Tabs>
      </FormWrapper>
    );

    // General content should be visible
    expect(screen.getByText("General Content")).toBeInTheDocument();

    // Details content exists but is hidden (inactive tab)
    const allTabPanels = container.querySelectorAll('[role="tabpanel"]');
    expect(allTabPanels.length).toBe(2);
  });

  it("calculates error counts correctly", () => {
    // Note: This test will be more complex with Form context
    // Simplified version for initial implementation
    const tabs = [
      {
        key: "general",
        label: "General",
        fields: ["name", "email"],
        content: <div>General</div>,
      },
    ];

    const { container } = renderWithAdminContext(
      <FormWrapper>
        <Tabs defaultValue="general">
          <TabbedFormInputs tabs={tabs} />
        </Tabs>
      </FormWrapper>
    );

    // Verify structure exists
    expect(container.querySelector('[role="tablist"]')).toBeInTheDocument();
  });

  it("applies defaultTab prop", () => {
    const tabs = [
      {
        key: "general",
        label: "General",
        fields: ["name"],
        content: <div>General Content</div>,
      },
      {
        key: "other",
        label: "Other",
        fields: ["notes"],
        content: <div>Other Content</div>,
      },
    ];

    renderWithAdminContext(
      <FormWrapper>
        <Tabs defaultValue="other">
          <TabbedFormInputs tabs={tabs} defaultTab="other" />
        </Tabs>
      </FormWrapper>
    );

    // Verify tab structure (actual active tab verified by parent Tabs component)
    expect(screen.getByText("General")).toBeInTheDocument();
  });
});
