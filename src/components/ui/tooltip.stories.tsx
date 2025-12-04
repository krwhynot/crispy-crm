import type { Meta, StoryObj } from "@storybook/react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";
import { Button } from "./button";
import { Input } from "./input";
import {
  Plus,
  Settings,
  HelpCircle,
  Info,
  Copy,
  Download,
  Share,
  Trash,
  Edit,
  Save,
  X,
} from "lucide-react";
import React from "react";

const meta = {
  title: "UI/Tooltip",
  component: Tooltip,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A popup that displays information related to an element when the element receives keyboard focus or the mouse hovers over it.",
      },
    },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="flex min-h-[200px] w-full items-center justify-center">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic tooltip
export const Default: Story = {
  render: () => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Hover me</Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Add to library</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
};

// Different positions
export const Positions: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-8">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Top</Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>Tooltip on top</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Right</Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Tooltip on right</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Bottom</Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Tooltip on bottom</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Left</Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Tooltip on left</p>
        </TooltipContent>
      </Tooltip>
    </div>
  ),
};

// With icons
export const WithIcons: Story = {
  render: () => (
    <div className="flex gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon">
            <Plus className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Create new item</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon">
            <Edit className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Edit item</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon">
            <Copy className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Copy to clipboard</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon">
            <Share className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Share</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon">
            <Download className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Download</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon">
            <Trash className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Delete item</p>
        </TooltipContent>
      </Tooltip>
    </div>
  ),
};

// With delay
export const WithDelay: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground mb-2">No delay (instant)</p>
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline">Instant tooltip</Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Shows immediately</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div>
        <p className="text-sm text-muted-foreground mb-2">200ms delay</p>
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline">Quick delay</Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Shows after 200ms</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div>
        <p className="text-sm text-muted-foreground mb-2">500ms delay</p>
        <TooltipProvider delayDuration={500}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline">Medium delay</Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Shows after 500ms</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div>
        <p className="text-sm text-muted-foreground mb-2">1000ms delay</p>
        <TooltipProvider delayDuration={1000}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline">Long delay</Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Shows after 1 second</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  ),
};

// Keyboard shortcuts in tooltips
export const WithKeyboardShortcuts: Story = {
  render: () => (
    <div className="flex gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="icon">
            <Save className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Save (⌘S)</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="icon">
            <Copy className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Copy (⌘C)</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="icon">
            <X className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Close (Esc)</p>
        </TooltipContent>
      </Tooltip>
    </div>
  ),
};

// Long content
export const LongContent: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline">
          <Info className="mr-2 size-4" />
          More info
        </Button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p>
          This is a longer tooltip with more detailed information that wraps to multiple lines when
          needed.
        </p>
      </TooltipContent>
    </Tooltip>
  ),
};

// On disabled elements
export const OnDisabledElements: Story = {
  render: () => (
    <div className="space-y-4">
      <Tooltip>
        <TooltipTrigger asChild>
          <span tabIndex={0} role="button">
            <Button disabled>Disabled button</Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>This action is currently unavailable</p>
        </TooltipContent>
      </Tooltip>

      <p className="text-sm text-muted-foreground">
        Note: Disabled elements don't trigger events, so we wrap them in a span
      </p>
    </div>
  ),
};

// Multiple tooltips
export const MultipleTooltips: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm">
              First
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>First tooltip</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm">
              Second
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Second tooltip</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm">
              Third
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Third tooltip</p>
          </TooltipContent>
        </Tooltip>
      </div>
      <p className="text-sm text-muted-foreground">
        Each button has its own tooltip that shows on hover
      </p>
    </div>
  ),
};

// With form fields
export const WithFormFields: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input placeholder="Enter email" className="w-64" />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon">
              <HelpCircle className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>We'll never share your email with anyone</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="flex items-center gap-2">
        <Input type="password" placeholder="Enter password" className="w-64" />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon">
              <HelpCircle className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Password must be at least 8 characters</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  ),
};

// Status indicators
export const StatusIndicators: Story = {
  render: () => (
    <div className="flex gap-4">
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="h-3 w-3 rounded-full bg-success cursor-help" />
        </TooltipTrigger>
        <TooltipContent>
          <p>Online - All systems operational</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <div className="h-3 w-3 rounded-full bg-warning cursor-help" />
        </TooltipTrigger>
        <TooltipContent>
          <p>Warning - Minor issues detected</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <div className="h-3 w-3 rounded-full bg-destructive cursor-help" />
        </TooltipTrigger>
        <TooltipContent>
          <p>Error - System offline</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <div className="h-3 w-3 rounded-full bg-muted-foreground cursor-help" />
        </TooltipTrigger>
        <TooltipContent>
          <p>Unknown status</p>
        </TooltipContent>
      </Tooltip>
    </div>
  ),
};

// Keyboard and focus demo
export const KeyboardFocus: Story = {
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Tab through elements to see tooltips on focus (keyboard navigation)
      </p>
      <div className="flex gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline">First (Tab here)</Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Shows on focus and hover</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline">Second</Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Tab to navigate</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline">Third</Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Accessible via keyboard</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  ),
};

// Complex example with toolbar
export const Toolbar: Story = {
  render: () => (
    <div className="border rounded-lg p-2 inline-flex gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon">
            <Settings className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Settings</p>
        </TooltipContent>
      </Tooltip>

      <div className="w-px bg-border mx-1" />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon">
            <Plus className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Add item</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon">
            <Edit className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Edit</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon">
            <Copy className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Duplicate</p>
        </TooltipContent>
      </Tooltip>

      <div className="w-px bg-border mx-1" />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon">
            <Trash className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Delete</p>
        </TooltipContent>
      </Tooltip>
    </div>
  ),
};
