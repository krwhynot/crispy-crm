import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './badge';
import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react';
import React from 'react';

const meta = {
  title: 'UI/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'destructive', 'outline'],
      description: 'The visual style variant of the badge',
    },
    asChild: {
      control: 'boolean',
      description: 'Whether to render as a child component',
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic variants
export const Default: Story = {
  args: {
    children: 'Default',
    variant: 'default',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Secondary',
    variant: 'secondary',
  },
};

export const Destructive: Story = {
  args: {
    children: 'Destructive',
    variant: 'destructive',
  },
};

export const Outline: Story = {
  args: {
    children: 'Outline',
    variant: 'outline',
  },
};

// With icons
export const DefaultWithIcon: Story = {
  args: {
    children: (
      <>
        <CheckCircle2 className="size-3" />
        Success
      </>
    ),
    variant: 'default',
  },
};

export const SecondaryWithIcon: Story = {
  args: {
    children: (
      <>
        <Info className="size-3" />
        Info
      </>
    ),
    variant: 'secondary',
  },
};

export const DestructiveWithIcon: Story = {
  args: {
    children: (
      <>
        <XCircle className="size-3" />
        Error
      </>
    ),
    variant: 'destructive',
  },
};

export const OutlineWithIcon: Story = {
  args: {
    children: (
      <>
        <AlertCircle className="size-3" />
        Warning
      </>
    ),
    variant: 'outline',
  },
};

// Status badges
export const StatusNew: Story = {
  args: {
    children: 'NEW',
    variant: 'default',
  },
};

export const StatusActive: Story = {
  args: {
    children: 'ACTIVE',
    variant: 'secondary',
  },
};

export const StatusPending: Story = {
  args: {
    children: 'PENDING',
    variant: 'outline',
  },
};

export const StatusClosed: Story = {
  args: {
    children: 'CLOSED',
    variant: 'destructive',
  },
};

// Number badges
export const NumberBadge: Story = {
  args: {
    children: '99+',
    variant: 'default',
  },
};

export const CountBadge: Story = {
  args: {
    children: '3',
    variant: 'destructive',
  },
};

export const VersionBadge: Story = {
  args: {
    children: 'v2.0.0',
    variant: 'secondary',
  },
};

// Category badges
export const CategoryBadge: Story = {
  args: {
    children: 'Feature',
    variant: 'default',
  },
};

export const BugBadge: Story = {
  args: {
    children: 'Bug',
    variant: 'destructive',
  },
};

export const ImprovementBadge: Story = {
  args: {
    children: 'Improvement',
    variant: 'secondary',
  },
};

export const DocumentationBadge: Story = {
  args: {
    children: 'Docs',
    variant: 'outline',
  },
};

// Priority badges
export const PriorityHigh: Story = {
  args: {
    children: 'High Priority',
    variant: 'destructive',
  },
};

export const PriorityMedium: Story = {
  args: {
    children: 'Medium Priority',
    variant: 'secondary',
  },
};

export const PriorityLow: Story = {
  args: {
    children: 'Low Priority',
    variant: 'outline',
  },
};

// Size variations (using text size)
export const SmallText: Story = {
  args: {
    children: 'Small',
    variant: 'default',
    className: 'text-[10px]',
  },
};

export const LargeText: Story = {
  args: {
    children: 'Large',
    variant: 'default',
    className: 'text-sm',
  },
};

// Long text
export const LongText: Story = {
  args: {
    children: 'This is a very long badge text',
    variant: 'default',
  },
};

export const VeryLongText: Story = {
  args: {
    children: 'This is an extremely long badge text that might need special handling',
    variant: 'outline',
  },
};

// Badge as link (using asChild)
export const AsLink: Story = {
  args: {
    asChild: true,
    children: <a href="#">Clickable Badge</a>,
    variant: 'outline',
  },
};

// Grouped badges showcase
export const GroupedBadges: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">React</Badge>
      <Badge variant="default">TypeScript</Badge>
      <Badge variant="default">Tailwind</Badge>
      <Badge variant="secondary">Vite</Badge>
      <Badge variant="secondary">ESLint</Badge>
      <Badge variant="outline">v3.0.0</Badge>
    </div>
  ),
};

// Environment badges
export const EnvironmentDev: Story = {
  args: {
    children: 'Development',
    variant: 'secondary',
  },
};

export const EnvironmentStaging: Story = {
  args: {
    children: 'Staging',
    variant: 'outline',
  },
};

export const EnvironmentProd: Story = {
  args: {
    children: 'Production',
    variant: 'default',
  },
};

// Role badges
export const RoleAdmin: Story = {
  args: {
    children: 'Admin',
    variant: 'destructive',
  },
};

export const RoleUser: Story = {
  args: {
    children: 'User',
    variant: 'secondary',
  },
};

export const RoleGuest: Story = {
  args: {
    children: 'Guest',
    variant: 'outline',
  },
};

// Combined showcase
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <Badge variant="default">Default</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="destructive">Destructive</Badge>
        <Badge variant="outline">Outline</Badge>
      </div>
      <div className="flex gap-2">
        <Badge variant="default">
          <CheckCircle2 className="size-3" />
          With Icon
        </Badge>
        <Badge variant="secondary">
          <Info className="size-3" />
          Info Badge
        </Badge>
        <Badge variant="destructive">
          <XCircle className="size-3" />
          Error
        </Badge>
        <Badge variant="outline">
          <AlertCircle className="size-3" />
          Warning
        </Badge>
      </div>
    </div>
  ),
};