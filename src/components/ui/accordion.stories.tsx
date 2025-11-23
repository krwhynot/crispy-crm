import type { Meta, StoryObj } from "@storybook/react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./accordion";
import React from "react";
import { Button } from "./button";

const meta = {
  title: "UI/Accordion",
  component: Accordion,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: "select",
      options: ["single", "multiple"],
      description: "Determines whether one or multiple items can be opened at the same time",
    },
    disabled: {
      control: "boolean",
      description: "Disables the accordion",
    },
    collapsible: {
      control: "boolean",
      description: 'When type is "single", allows closing all items',
    },
    defaultValue: {
      control: "text",
      description: "The default open item(s)",
    },
  },
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

// Single item expanded
export const Single: Story = {
  render: () => (
    <Accordion type="single" collapsible className="w-[450px]">
      <AccordionItem value="item-1">
        <AccordionTrigger>Is it accessible?</AccordionTrigger>
        <AccordionContent>
          Yes. It adheres to the WAI-ARIA design pattern, ensuring proper keyboard navigation and
          screen reader support.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Is it styled?</AccordionTrigger>
        <AccordionContent>
          Yes. It comes with default styles that matches the other components' aesthetic. You can
          customize it using CSS-in-JS or traditional CSS.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Is it animated?</AccordionTrigger>
        <AccordionContent>
          Yes. It's animated by default, with smooth expand and collapse transitions. The animation
          can be customized or disabled if needed.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

// Multiple items expanded
export const Multiple: Story = {
  render: () => (
    <Accordion type="multiple" defaultValue={["item-1", "item-3"]} className="w-[450px]">
      <AccordionItem value="item-1">
        <AccordionTrigger>Multiple Selection Mode</AccordionTrigger>
        <AccordionContent>
          This accordion allows multiple items to be expanded at the same time. Click on any trigger
          to expand or collapse its content.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Independent Items</AccordionTrigger>
        <AccordionContent>
          Each item operates independently. Opening one doesn't affect the others. This is useful
          for FAQs where users might want to see multiple answers.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Default Expanded</AccordionTrigger>
        <AccordionContent>
          This item and the first one are expanded by default using the defaultValue prop. You can
          set any combination of items to be initially open.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

// Single with default value
export const SingleWithDefault: Story = {
  render: () => (
    <Accordion type="single" collapsible defaultValue="item-2" className="w-[450px]">
      <AccordionItem value="item-1">
        <AccordionTrigger>First Section</AccordionTrigger>
        <AccordionContent>This section is collapsed by default.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Second Section (Default Open)</AccordionTrigger>
        <AccordionContent>
          This section is expanded by default because its value matches the defaultValue prop. Only
          one item can be open at a time in single mode.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Third Section</AccordionTrigger>
        <AccordionContent>
          Opening this section will automatically close the currently open section.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

// Non-collapsible single
export const NonCollapsible: Story = {
  render: () => (
    <div className="w-[450px] space-y-4">
      <p className="text-sm text-muted-foreground">
        This accordion always keeps one item open (collapsible=false)
      </p>
      <Accordion type="single" defaultValue="item-1" className="w-full">
        <AccordionItem value="item-1">
          <AccordionTrigger>Always One Open</AccordionTrigger>
          <AccordionContent>
            In non-collapsible mode, at least one item must always remain open. Try clicking this
            trigger - it won't collapse.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Switch Between Items</AccordionTrigger>
          <AccordionContent>
            You can switch between items, but you cannot close all items. This ensures that some
            content is always visible.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-3">
          <AccordionTrigger>Guaranteed Visibility</AccordionTrigger>
          <AccordionContent>
            This pattern is useful when you want to ensure users always see some information, like
            in stepped forms or guided tutorials.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  ),
};

// Long content with scrolling
export const LongContent: Story = {
  render: () => (
    <Accordion type="single" collapsible className="w-[500px]">
      <AccordionItem value="item-1">
        <AccordionTrigger>Short Content</AccordionTrigger>
        <AccordionContent>
          This item has a small amount of content that fits easily within the view.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Long Content Section</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4">
            <p>
              This section contains a large amount of content to demonstrate how the accordion
              handles longer text and maintains proper spacing.
            </p>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
              incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
              exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
            </p>
            <p>
              Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat
              nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui
              officia deserunt mollit anim id est laborum.
            </p>
            <ul className="list-inside list-disc space-y-1">
              <li>First point with detailed explanation</li>
              <li>Second point with additional context</li>
              <li>Third point for comprehensive coverage</li>
              <li>Fourth point to demonstrate list handling</li>
            </ul>
            <p>
              The accordion smoothly animates to accommodate content of any length, ensuring a
              pleasant user experience regardless of the amount of information.
            </p>
          </div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Another Short Section</AccordionTrigger>
        <AccordionContent>
          Back to shorter content to show the contrast in animation behavior.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

// Nested accordions
export const Nested: Story = {
  render: () => (
    <Accordion type="single" collapsible className="w-[500px]">
      <AccordionItem value="item-1">
        <AccordionTrigger>Main Category 1</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2">
            <p className="mb-3 text-sm">This section contains a nested accordion:</p>
            <Accordion type="single" collapsible className="ml-4">
              <AccordionItem value="nested-1">
                <AccordionTrigger>Subcategory 1.1</AccordionTrigger>
                <AccordionContent>Nested content for subcategory 1.1</AccordionContent>
              </AccordionItem>
              <AccordionItem value="nested-2">
                <AccordionTrigger>Subcategory 1.2</AccordionTrigger>
                <AccordionContent>Nested content for subcategory 1.2</AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Main Category 2</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2">
            <p className="mb-3 text-sm">Another nested accordion structure:</p>
            <Accordion type="multiple" className="ml-4">
              <AccordionItem value="nested-3">
                <AccordionTrigger>Subcategory 2.1</AccordionTrigger>
                <AccordionContent>
                  This nested accordion allows multiple items open
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="nested-4">
                <AccordionTrigger>Subcategory 2.2</AccordionTrigger>
                <AccordionContent>
                  Both nested items can be expanded simultaneously
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

// Animation states showcase
const AnimationStatesComponent = () => {
  const [openItems, setOpenItems] = React.useState<string[]>([]);

  return (
    <div className="w-[450px] space-y-4">
      <div className="rounded-lg border bg-secondary/10 p-3">
        <p className="text-sm font-medium">Animation States Monitor</p>
        <p className="text-xs text-muted-foreground">
          Open items: {openItems.length > 0 ? openItems.join(", ") : "None"}
        </p>
      </div>

      <Accordion type="multiple" value={openItems} onValueChange={setOpenItems} className="w-full">
        <AccordionItem value="item-1">
          <AccordionTrigger>
            Item 1 {openItems.includes("item-1") ? "(Expanded)" : "(Collapsed)"}
          </AccordionTrigger>
          <AccordionContent>
            Watch the smooth animation as this content expands. The chevron icon rotates 180
            degrees.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>
            Item 2 {openItems.includes("item-2") ? "(Expanded)" : "(Collapsed)"}
          </AccordionTrigger>
          <AccordionContent>
            The accordion uses CSS animations for smooth transitions. Both opening and closing are
            animated.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-3">
          <AccordionTrigger>
            Item 3 {openItems.includes("item-3") ? "(Expanded)" : "(Collapsed)"}
          </AccordionTrigger>
          <AccordionContent>
            Multiple items can animate simultaneously without interference.
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setOpenItems(["item-1", "item-2", "item-3"])}
        >
          Expand All
        </Button>
        <Button size="sm" variant="outline" onClick={() => setOpenItems([])}>
          Collapse All
        </Button>
      </div>
    </div>
  );
};

export const AnimationStates: Story = {
  render: () => <AnimationStatesComponent />,
};

// FAQ Example
export const FAQExample: Story = {
  render: () => (
    <div className="w-[600px]">
      <h2 className="mb-6 text-2xl font-bold">Frequently Asked Questions</h2>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="pricing">
          <AccordionTrigger>What are your pricing plans?</AccordionTrigger>
          <AccordionContent>
            We offer three pricing tiers:
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>Starter: $9/month for individuals</li>
              <li>Professional: $29/month for small teams</li>
              <li>Enterprise: Custom pricing for large organizations</li>
            </ul>
            All plans include a 14-day free trial with no credit card required.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="features">
          <AccordionTrigger>What features are included?</AccordionTrigger>
          <AccordionContent>
            All plans include core features such as:
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>Unlimited projects</li>
              <li>Real-time collaboration</li>
              <li>Cloud storage and backups</li>
              <li>Mobile app access</li>
              <li>24/7 customer support</li>
            </ul>
            Higher tiers unlock additional features like advanced analytics and API access.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="cancel">
          <AccordionTrigger>Can I cancel anytime?</AccordionTrigger>
          <AccordionContent>
            Yes, you can cancel your subscription at any time. There are no long-term contracts or
            cancellation fees. Your service will continue until the end of your current billing
            period.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="support">
          <AccordionTrigger>How do I get support?</AccordionTrigger>
          <AccordionContent>
            We offer multiple support channels:
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>Email support for all plans (response within 24 hours)</li>
              <li>Live chat for Professional and Enterprise plans</li>
              <li>Phone support for Enterprise plans</li>
              <li>Comprehensive documentation and tutorials</li>
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  ),
};

// Settings Panel Example
export const SettingsPanel: Story = {
  render: () => (
    <div className="w-[500px]">
      <h3 className="mb-4 text-lg font-semibold">Application Settings</h3>
      <Accordion type="multiple" defaultValue={["general"]} className="w-full">
        <AccordionItem value="general">
          <AccordionTrigger>General Settings</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              <div>
                <label htmlFor="language-select" className="text-sm font-medium">
                  Language
                </label>
                <select
                  id="language-select"
                  className="mt-1 w-full rounded border bg-background px-3 py-1"
                >
                  <option>English</option>
                  <option>Spanish</option>
                  <option>French</option>
                </select>
              </div>
              <div>
                <label htmlFor="theme-select" className="text-sm font-medium">
                  Theme
                </label>
                <select
                  id="theme-select"
                  className="mt-1 w-full rounded border bg-background px-3 py-1"
                >
                  <option>Light</option>
                  <option>Dark</option>
                  <option>System</option>
                </select>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="notifications">
          <AccordionTrigger>Notification Preferences</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input type="checkbox" defaultChecked />
                <span className="text-sm">Email notifications</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="checkbox" defaultChecked />
                <span className="text-sm">Push notifications</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="checkbox" />
                <span className="text-sm">SMS notifications</span>
              </label>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="privacy">
          <AccordionTrigger>Privacy & Security</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium">Two-factor authentication</p>
                <Button size="sm" variant="outline" className="mt-1">
                  Enable 2FA
                </Button>
              </div>
              <div>
                <p className="text-sm font-medium">Data sharing</p>
                <label className="mt-1 flex items-center space-x-2">
                  <input type="checkbox" />
                  <span className="text-sm">Share usage analytics</span>
                </label>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  ),
};

// Responsive accordion
export const Responsive: Story = {
  render: () => (
    <div className="w-full max-w-[700px]">
      <p className="mb-4 text-sm text-muted-foreground">
        This accordion adapts to different screen sizes
      </p>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-left">Responsive Design Principles</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              <p className="text-sm">
                This accordion automatically adjusts to the available width. On mobile devices, the
                trigger text will wrap if needed.
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded border p-2">
                  <p className="text-xs font-medium">Mobile</p>
                  <p className="text-xs text-muted-foreground">Full width</p>
                </div>
                <div className="rounded border p-2">
                  <p className="text-xs font-medium">Desktop</p>
                  <p className="text-xs text-muted-foreground">Constrained width</p>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger className="text-left">
            Long Title That Might Wrap on Smaller Screens for Better Readability
          </AccordionTrigger>
          <AccordionContent>
            The trigger text wraps naturally while maintaining proper alignment with the chevron
            icon.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-3">
          <AccordionTrigger>Touch-Friendly Targets</AccordionTrigger>
          <AccordionContent>
            The trigger areas are large enough for comfortable touch interaction on mobile devices,
            meeting accessibility guidelines.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  ),
};

// Semantic color showcase
export const SemanticColors: Story = {
  render: () => (
    <div className="w-[500px] space-y-4">
      <div className="rounded-lg border bg-background p-4">
        <h3 className="mb-3 font-semibold">Default Theme</h3>
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>Border Color (--border)</AccordionTrigger>
            <AccordionContent>
              The bottom border uses the semantic --border color variable, ensuring consistency
              across light and dark themes.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Text Colors (--foreground)</AccordionTrigger>
            <AccordionContent>
              Text uses --foreground for primary content and --muted-foreground for secondary
              content, maintaining proper contrast ratios.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <div className="rounded-lg border bg-secondary p-4">
        <h3 className="mb-3 font-semibold text-secondary-foreground">Secondary Background</h3>
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>Adaptive Styling</AccordionTrigger>
            <AccordionContent>
              The accordion adapts to different background colors while maintaining readability and
              visual hierarchy.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <div className="rounded-lg border border-primary bg-primary/5 p-4">
        <h3 className="mb-3 font-semibold text-primary">Primary Accent</h3>
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger className="hover:text-primary">Hover States</AccordionTrigger>
            <AccordionContent>
              Custom hover states can use semantic colors like --primary for interactive feedback.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <div className="rounded-lg border border-destructive bg-destructive/5 p-4">
        <h3 className="mb-3 font-semibold text-destructive">Warning Section</h3>
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger className="hover:text-destructive">
              Destructive Context
            </AccordionTrigger>
            <AccordionContent className="text-destructive/80">
              Important warnings or destructive actions can use the --destructive semantic color for
              emphasis.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  ),
};
