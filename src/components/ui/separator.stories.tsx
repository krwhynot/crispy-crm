import type { Meta, StoryObj } from '@storybook/react';
import { Separator } from './separator';
import React from 'react';

const meta = {
  title: 'UI/Separator',
  component: Separator,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
      description: 'The orientation of the separator',
    },
    decorative: {
      control: 'boolean',
      description: 'Whether the separator is purely decorative (no semantic meaning)',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default horizontal separator
export const Horizontal: Story = {
  args: {
    orientation: 'horizontal',
  },
  render: (args) => (
    <div className="w-[400px]">
      <div className="space-y-1">
        <h4 className="text-sm font-medium leading-none">Radix Primitives</h4>
        <p className="text-sm text-[color:var(--text-subtle)]">
          An open-source UI component library.
        </p>
      </div>
      <Separator {...args} className="my-4" />
      <div className="flex h-5 items-center space-x-4 text-sm">
        <div>Blog</div>
        <Separator orientation="vertical" />
        <div>Docs</div>
        <Separator orientation="vertical" />
        <div>Source</div>
      </div>
    </div>
  ),
};

// Vertical separator
export const Vertical: Story = {
  args: {
    orientation: 'vertical',
  },
  render: (args) => (
    <div className="flex h-[200px] items-center">
      <div className="flex flex-col items-center">
        <span className="text-lg font-semibold">Section A</span>
        <span className="text-sm text-[color:var(--text-subtle)]">First section</span>
      </div>
      <Separator {...args} className="mx-4" />
      <div className="flex flex-col items-center">
        <span className="text-lg font-semibold">Section B</span>
        <span className="text-sm text-[color:var(--text-subtle)]">Second section</span>
      </div>
    </div>
  ),
};

// Multiple horizontal separators
export const MultipleHorizontal: Story = {
  render: () => (
    <div className="w-[400px] space-y-4">
      <div>
        <h3 className="mb-2 text-lg font-semibold">Account Settings</h3>
        <p className="text-sm text-[color:var(--text-subtle)]">
          Manage your account preferences and security settings.
        </p>
      </div>
      <Separator />
      <div>
        <h4 className="mb-1 text-sm font-medium">Email Preferences</h4>
        <p className="text-sm text-[color:var(--text-subtle)]">
          Configure how you receive email notifications.
        </p>
      </div>
      <Separator />
      <div>
        <h4 className="mb-1 text-sm font-medium">Privacy Settings</h4>
        <p className="text-sm text-[color:var(--text-subtle)]">
          Control who can see your profile information.
        </p>
      </div>
      <Separator />
      <div>
        <h4 className="mb-1 text-sm font-medium">Data Management</h4>
        <p className="text-sm text-[color:var(--text-subtle)]">
          Export or delete your personal data.
        </p>
      </div>
    </div>
  ),
};

// Navigation bar with vertical separators
export const NavigationBar: Story = {
  render: () => (
    <nav className="flex h-10 items-center rounded-lg border bg-background px-4">
      <button className="text-sm font-medium hover:text-primary">
        Home
      </button>
      <Separator orientation="vertical" className="mx-4" />
      <button className="text-sm font-medium hover:text-primary">
        Products
      </button>
      <Separator orientation="vertical" className="mx-4" />
      <button className="text-sm font-medium hover:text-primary">
        Services
      </button>
      <Separator orientation="vertical" className="mx-4" />
      <button className="text-sm font-medium hover:text-primary">
        About
      </button>
      <Separator orientation="vertical" className="mx-4" />
      <button className="text-sm font-medium hover:text-primary">
        Contact
      </button>
    </nav>
  ),
};

// Sidebar layout with separators
export const SidebarLayout: Story = {
  render: () => (
    <div className="flex h-[400px] w-[600px] rounded-lg border">
      <aside className="w-[200px] bg-secondary/10 p-4">
        <h3 className="mb-2 font-semibold">Sidebar</h3>
        <Separator className="mb-4" />
        <nav className="space-y-2">
          <div className="rounded px-2 py-1 hover:bg-accent">Dashboard</div>
          <div className="rounded px-2 py-1 hover:bg-accent">Analytics</div>
          <div className="rounded px-2 py-1 hover:bg-accent">Reports</div>
        </nav>
        <Separator className="my-4" />
        <nav className="space-y-2">
          <div className="rounded px-2 py-1 hover:bg-accent">Settings</div>
          <div className="rounded px-2 py-1 hover:bg-accent">Help</div>
        </nav>
      </aside>
      <Separator orientation="vertical" />
      <main className="flex-1 p-4">
        <h2 className="mb-2 text-lg font-semibold">Main Content</h2>
        <Separator className="mb-4" />
        <p className="text-sm text-[color:var(--text-subtle)]">
          This layout demonstrates the use of both horizontal and vertical separators
          to divide content areas.
        </p>
      </main>
    </div>
  ),
};

// Custom styled separators
export const CustomStyles: Story = {
  render: () => (
    <div className="w-[400px] space-y-6">
      <div>
        <p className="mb-2 text-sm text-[color:var(--text-subtle)]">Default separator</p>
        <Separator />
      </div>

      <div>
        <p className="mb-2 text-sm text-[color:var(--text-subtle)]">Thick separator</p>
        <Separator className="h-[2px]" />
      </div>

      <div>
        <p className="mb-2 text-sm text-[color:var(--text-subtle)]">Dotted separator</p>
        <Separator className="border-t-2 border-dotted" />
      </div>

      <div>
        <p className="mb-2 text-sm text-[color:var(--text-subtle)]">Dashed separator</p>
        <Separator className="border-t-2 border-dashed" />
      </div>

      <div>
        <p className="mb-2 text-sm text-[color:var(--text-subtle)]">Primary colored</p>
        <Separator className="bg-primary" />
      </div>

      <div>
        <p className="mb-2 text-sm text-[color:var(--text-subtle)]">Destructive colored</p>
        <Separator className="bg-destructive" />
      </div>
    </div>
  ),
};

// Card with separators
export const InCard: Story = {
  render: () => (
    <div className="w-[350px] rounded-lg border bg-card p-6">
      <div className="flex items-center space-x-4">
        <div className="size-12 rounded-full bg-primary/10" />
        <div className="flex-1 space-y-1">
          <h3 className="font-semibold">John Doe</h3>
          <p className="text-sm text-[color:var(--text-subtle)]">Software Engineer</p>
        </div>
      </div>
      <Separator className="my-4" />
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-[color:var(--text-subtle)]">Email</span>
          <span className="text-sm">john@example.com</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-[color:var(--text-subtle)]">Phone</span>
          <span className="text-sm">+1 234 567 890</span>
        </div>
      </div>
      <Separator className="my-4" />
      <div className="flex justify-between">
        <button className="text-sm text-primary hover:underline">Edit Profile</button>
        <button className="text-sm text-destructive hover:underline">Delete</button>
      </div>
    </div>
  ),
};

// Responsive separator
export const Responsive: Story = {
  render: () => (
    <div className="w-full max-w-[600px] space-y-4">
      <p className="text-sm text-[color:var(--text-subtle)]">
        These separators adapt to their container width
      </p>

      <div className="space-y-4">
        <div className="rounded-lg border p-4">
          <h4 className="mb-2 font-medium">Full Width Container</h4>
          <Separator />
          <p className="mt-2 text-sm text-[color:var(--text-subtle)]">
            Separator spans the full width of its container
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-lg border p-4">
            <h4 className="mb-2 font-medium">Column 1</h4>
            <Separator />
            <p className="mt-2 text-sm text-[color:var(--text-subtle)]">Content</p>
          </div>
          <div className="rounded-lg border p-4">
            <h4 className="mb-2 font-medium">Column 2</h4>
            <Separator />
            <p className="mt-2 text-sm text-[color:var(--text-subtle)]">Content</p>
          </div>
        </div>
      </div>
    </div>
  ),
};

// Semantic color showcase
export const SemanticColors: Story = {
  render: () => (
    <div className="w-[400px] space-y-6">
      <div>
        <div className="mb-2 flex items-center gap-2">
          <div className="size-3 rounded-full bg-border" />
          <p className="text-sm font-medium">Default (--border)</p>
        </div>
        <Separator />
        <p className="mt-2 text-xs text-[color:var(--text-subtle)]">
          Uses the semantic border color variable
        </p>
      </div>

      <div>
        <div className="mb-2 flex items-center gap-2">
          <div className="size-3 rounded-full bg-primary" />
          <p className="text-sm font-medium">Primary emphasis</p>
        </div>
        <Separator className="bg-primary/50" />
        <p className="mt-2 text-xs text-[color:var(--text-subtle)]">
          Primary color at 50% opacity for subtle emphasis
        </p>
      </div>

      <div>
        <div className="mb-2 flex items-center gap-2">
          <div className="size-3 rounded-full bg-secondary" />
          <p className="text-sm font-medium">Secondary style</p>
        </div>
        <Separator className="bg-secondary" />
        <p className="mt-2 text-xs text-[color:var(--text-subtle)]">
          Secondary color for alternative styling
        </p>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <h4 className="mb-2 font-medium">In context</h4>
        <Separator />
        <p className="mt-2 text-sm text-[color:var(--text-subtle)]">
          The separator automatically adapts to the card's color scheme
        </p>
      </div>

      <div className="rounded-lg bg-secondary p-4">
        <h4 className="mb-2 font-medium text-secondary-foreground">Secondary background</h4>
        <Separator className="bg-secondary-foreground/20" />
        <p className="mt-2 text-sm text-secondary-foreground/70">
          Separator using secondary-foreground color for contrast
        </p>
      </div>
    </div>
  ),
};

// Decorative vs Semantic
export const DecorativeVsSemantic: Story = {
  render: () => (
    <div className="w-[400px] space-y-6">
      <div>
        <h3 className="mb-2 font-semibold">Decorative Separator</h3>
        <p className="text-sm text-[color:var(--text-subtle)]">
          Used for visual separation only (decorative=true)
        </p>
        <Separator decorative={true} className="my-3" />
        <p className="text-sm">
          This separator has no semantic meaning and is ignored by screen readers.
        </p>
      </div>

      <div>
        <h3 className="mb-2 font-semibold">Semantic Separator</h3>
        <p className="text-sm text-[color:var(--text-subtle)]">
          Used to separate distinct sections (decorative=false)
        </p>
        <Separator decorative={false} className="my-3" />
        <p className="text-sm">
          This separator indicates a thematic break and is announced by screen readers.
        </p>
      </div>
    </div>
  ),
};