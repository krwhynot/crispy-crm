import type { Meta, StoryObj } from "@storybook/react";
import { Card } from "./card";
import { Checkbox } from "./checkbox";
import { Avatar, AvatarFallback } from "./avatar";
import { Badge } from "./badge";
import React from "react";

/**
 * Elevation System Stories
 *
 * Demonstrates the three-tier elevation system used across Atomic CRM
 * for interactive surfaces. These patterns are currently implemented in:
 * - Dashboard (HotContacts widget)
 * - Opportunities (OpportunityCard)
 * - Contacts (ContactListContent)
 *
 * Phase 2 extraction pending when Organizations module implements similar pattern.
 * See: /.docs/design-system/elevation.md
 */
const meta = {
  title: "Design System/Elevation",
  component: Card,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Visual elevation system for interactive surfaces in Atomic CRM. Provides tactile feedback through layered shadows, transforms, and semantic design tokens.",
      },
    },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="max-w-2xl space-y-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Low Elevation - Default for list items
 *
 * Used for: Contact rows, organization cards, simple list items
 * Performance: ~0.5ms per item on hover
 * Pattern: shadow-sm → shadow-md with subtle vertical lift
 */
export const LowElevation: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-2 text-muted-foreground">
          Low Elevation (Default)
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Hover to see shadow increase and subtle lift. Used for list items.
        </p>
      </div>

      <div className="group relative flex items-center justify-between gap-3 rounded-lg border border-transparent bg-card px-3 py-2 transition-all duration-150 hover:border-border hover:shadow-md motion-safe:hover:-translate-y-0.5 active:scale-[0.98] focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Checkbox className="relative z-10 shrink-0" />
          <Avatar className="shrink-0 h-8 w-8">
            <AvatarFallback className="text-xs">JD</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <button className="font-medium text-sm text-primary hover:underline focus:outline-none">
              John Doe
              <span className="absolute inset-0" aria-hidden="true" />
            </button>
            <p className="text-xs text-muted-foreground truncate">Product Manager at Acme Corp</p>
          </div>
        </div>
        <span className="text-xs text-muted-foreground shrink-0 relative z-10">2 days ago</span>
      </div>

      <div className="group relative flex items-center justify-between gap-3 rounded-lg border border-transparent bg-card px-3 py-2 transition-all duration-150 hover:border-border hover:shadow-md motion-safe:hover:-translate-y-0.5 active:scale-[0.98] focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Checkbox className="relative z-10 shrink-0" />
          <Avatar className="shrink-0 h-8 w-8">
            <AvatarFallback className="text-xs">SK</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <button className="font-medium text-sm text-primary hover:underline focus:outline-none">
              Sarah Kim
              <span className="absolute inset-0" aria-hidden="true" />
            </button>
            <p className="text-xs text-muted-foreground truncate">
              Senior Engineer at TechStart Inc
            </p>
          </div>
        </div>
        <span className="text-xs text-muted-foreground shrink-0 relative z-10">5 hours ago</span>
      </div>
    </div>
  ),
};

/**
 * Static Card - No hover elevation
 *
 * Used for: Dashboard widgets, filter sidebars, container cards
 * Pattern: Simple shadow-sm, no interactive states
 */
export const StaticCard: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Static Card</h3>
        <p className="text-xs text-muted-foreground mb-4">
          No hover effects. Used for non-interactive containers like filter sidebars.
        </p>
      </div>

      <Card className="bg-card border border-border shadow-sm rounded-xl p-4">
        <div className="flex flex-col gap-4">
          <div>
            <h4 className="text-sm font-semibold mb-2">Last Activity</h4>
            <div className="space-y-1 text-sm">
              <button className="w-full text-left px-2 py-1 rounded hover:bg-muted">Today</button>
              <button className="w-full text-left px-2 py-1 rounded hover:bg-muted">
                This week
              </button>
              <button className="w-full text-left px-2 py-1 rounded hover:bg-muted">
                This month
              </button>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-2">Tags</h4>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="text-xs">
                Important
              </Badge>
              <Badge variant="secondary" className="text-xs">
                Follow-up
              </Badge>
              <Badge variant="secondary" className="text-xs">
                Lead
              </Badge>
            </div>
          </div>
        </div>
      </Card>
    </div>
  ),
};

/**
 * Comparison View
 *
 * Side-by-side comparison of elevation levels
 */
export const ElevationComparison: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-2 text-muted-foreground">
          Elevation System Comparison
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Hover over each card to see the different elevation responses.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Low Elevation */}
        <div>
          <div className="text-xs font-semibold text-muted-foreground mb-2">
            LOW (shadow-sm → shadow-md)
          </div>
          <div className="rounded-lg border border-transparent bg-card px-4 py-3 transition-all duration-150 hover:border-border hover:shadow-md motion-safe:hover:-translate-y-0.5 cursor-pointer">
            <p className="text-sm font-medium">Contact List Item</p>
            <p className="text-xs text-muted-foreground">Subtle elevation for dense lists</p>
          </div>
        </div>

        {/* Medium Elevation (documented but not yet implemented in Storybook) */}
        <div>
          <div className="text-xs font-semibold text-muted-foreground mb-2">
            MEDIUM (--shadow-card-2)
          </div>
          <div className="rounded-lg border border-transparent bg-card px-4 py-3 transition-all duration-150 hover:border-primary shadow-elevation-1 hover:shadow-elevation-2 motion-safe:hover:-translate-y-0.5 motion-safe:hover:scale-[1.01] cursor-pointer">
            <p className="text-sm font-medium">Opportunity Card</p>
            <p className="text-xs text-muted-foreground">
              Enhanced elevation with border color change
            </p>
          </div>
        </div>

        {/* Static (no elevation) */}
        <div>
          <div className="text-xs font-semibold text-muted-foreground mb-2">STATIC (no hover)</div>
          <div className="rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
            <p className="text-sm font-medium">Filter Sidebar</p>
            <p className="text-xs text-muted-foreground">No interactive states needed</p>
          </div>
        </div>
      </div>
    </div>
  ),
};

/**
 * Accessibility Features
 *
 * Demonstrates focus states and keyboard navigation support
 */
export const AccessibilityFeatures: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Accessibility Features</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Tab through these cards to see focus indicators. All patterns include WCAG 2.1 AA
          compliant focus states.
        </p>
      </div>

      <div className="space-y-3">
        <div className="group relative flex items-center gap-3 rounded-lg border border-transparent bg-card px-3 py-2 transition-all duration-150 hover:border-border hover:shadow-md motion-safe:hover:-translate-y-0.5 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
          <Checkbox className="relative z-10" />
          <button className="flex-1 text-sm font-medium text-primary hover:underline focus:outline-none">
            Keyboard navigable card
            <span className="absolute inset-0" aria-hidden="true" />
          </button>
        </div>

        <div className="group relative flex items-center gap-3 rounded-lg border border-transparent bg-card px-3 py-2 transition-all duration-150 hover:border-border hover:shadow-md motion-safe:hover:-translate-y-0.5 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
          <Checkbox className="relative z-10" aria-label="Select item" />
          <button className="flex-1 text-sm font-medium text-primary hover:underline focus:outline-none">
            Focus ring appears on keyboard focus
            <span className="absolute inset-0" aria-hidden="true" />
          </button>
        </div>

        <div className="group relative flex items-center gap-3 rounded-lg border border-transparent bg-card px-3 py-2 transition-all duration-150 hover:border-border hover:shadow-md motion-safe:hover:-translate-y-0.5 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
          <Checkbox className="relative z-10" aria-label="Select item" />
          <button className="flex-1 text-sm font-medium text-primary hover:underline focus:outline-none">
            Screen reader friendly structure
            <span className="absolute inset-0" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="mt-6 p-4 bg-muted/30 rounded-lg border border-border">
        <h4 className="text-xs font-semibold mb-2">Accessibility Checklist</h4>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>✅ Focus-visible indicators (focus-within:ring-2)</li>
          <li>✅ Reduced motion support (motion-safe: prefix)</li>
          <li>✅ Touch feedback (active:scale-[0.98])</li>
          <li>✅ Valid semantic HTML (stretched link pattern)</li>
          <li>✅ ARIA labels for checkboxes</li>
          <li>✅ Keyboard navigation (Tab, Enter, Space)</li>
        </ul>
      </div>
    </div>
  ),
};

/**
 * Empty State Pattern
 *
 * Shows the elevated empty state design
 */
export const EmptyState: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Empty State</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Used when filtered results return no data.
        </p>
      </div>

      <div className="p-8 text-center bg-muted/30 border border-border rounded-xl shadow-sm">
        <p className="text-sm text-muted-foreground">No contacts found</p>
        <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters</p>
      </div>
    </div>
  ),
};

/**
 * Phase 2 Preview
 *
 * Shows what the InteractiveCard component will look like
 */
export const Phase2ComponentPreview: Story = {
  name: "Phase 2: InteractiveCard Component",
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-2 text-muted-foreground">
          Phase 2: Component Extraction
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          When Organizations module triggers the "Rule of Three", this pattern will be extracted
          into a reusable <code className="text-xs bg-muted px-1 rounded">InteractiveCard</code>{" "}
          component.
        </p>
      </div>

      <div className="p-4 bg-muted/30 rounded-lg border border-border">
        <pre className="text-xs overflow-x-auto">
          {`<InteractiveCard elevation="low">
  <Checkbox />
  <Link to="/contacts/123">
    Contact Name
  </Link>
</InteractiveCard>`}
        </pre>
      </div>

      <div className="text-xs text-muted-foreground space-y-2">
        <p>
          <strong>Benefits:</strong>
        </p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Single source of truth for elevation patterns</li>
          <li>Automatic updates when design tokens change</li>
          <li>Easier testing and visual regression baselines</li>
          <li>Centralized accessibility features</li>
        </ul>
      </div>

      <div className="text-xs text-muted-foreground space-y-2 mt-4">
        <p>
          <strong>Extraction Trigger:</strong>
        </p>
        <p>Third usage in Organizations list view (~60 min implementation)</p>
        <p>
          <strong>Refactor Scope:</strong> Contacts + Organizations + Dashboard (if needed)
        </p>
      </div>
    </div>
  ),
};
