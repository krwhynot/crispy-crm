import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';
import { ChevronRight, Download, Mail, Plus, Save, Trash2, X } from 'lucide-react';
import React from 'react';

const meta = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
      description: 'The visual style variant of the button',
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
      description: 'The size of the button',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the button is disabled',
    },
    asChild: {
      control: 'boolean',
      description: 'Whether to render as a child component',
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default variant - all sizes
export const Default: Story = {
  args: {
    children: 'Button',
    variant: 'default',
    size: 'default',
  },
};

export const DefaultSmall: Story = {
  args: {
    children: 'Small',
    variant: 'default',
    size: 'sm',
  },
};

export const DefaultLarge: Story = {
  args: {
    children: 'Large',
    variant: 'default',
    size: 'lg',
  },
};

export const DefaultIcon: Story = {
  args: {
    children: <Plus className="size-4" />,
    variant: 'default',
    size: 'icon',
    'aria-label': 'Add item',
  },
};

// Destructive variant - all sizes
export const Destructive: Story = {
  args: {
    children: 'Delete',
    variant: 'destructive',
    size: 'default',
  },
};

export const DestructiveSmall: Story = {
  args: {
    children: 'Delete',
    variant: 'destructive',
    size: 'sm',
  },
};

export const DestructiveLarge: Story = {
  args: {
    children: 'Delete',
    variant: 'destructive',
    size: 'lg',
  },
};

export const DestructiveIcon: Story = {
  args: {
    children: <Trash2 className="size-4" />,
    variant: 'destructive',
    size: 'icon',
    'aria-label': 'Delete item',
  },
};

// Outline variant - all sizes
export const Outline: Story = {
  args: {
    children: 'Outline',
    variant: 'outline',
    size: 'default',
  },
};

export const OutlineSmall: Story = {
  args: {
    children: 'Outline',
    variant: 'outline',
    size: 'sm',
  },
};

export const OutlineLarge: Story = {
  args: {
    children: 'Outline',
    variant: 'outline',
    size: 'lg',
  },
};

export const OutlineIcon: Story = {
  args: {
    children: <Download className="size-4" />,
    variant: 'outline',
    size: 'icon',
    'aria-label': 'Download',
  },
};

// Secondary variant - all sizes
export const Secondary: Story = {
  args: {
    children: 'Secondary',
    variant: 'secondary',
    size: 'default',
  },
};

export const SecondarySmall: Story = {
  args: {
    children: 'Secondary',
    variant: 'secondary',
    size: 'sm',
  },
};

export const SecondaryLarge: Story = {
  args: {
    children: 'Secondary',
    variant: 'secondary',
    size: 'lg',
  },
};

export const SecondaryIcon: Story = {
  args: {
    children: <Save className="size-4" />,
    variant: 'secondary',
    size: 'icon',
    'aria-label': 'Save',
  },
};

// Ghost variant - all sizes
export const Ghost: Story = {
  args: {
    children: 'Ghost',
    variant: 'ghost',
    size: 'default',
  },
};

export const GhostSmall: Story = {
  args: {
    children: 'Ghost',
    variant: 'ghost',
    size: 'sm',
  },
};

export const GhostLarge: Story = {
  args: {
    children: 'Ghost',
    variant: 'ghost',
    size: 'lg',
  },
};

export const GhostIcon: Story = {
  args: {
    children: <X className="size-4" />,
    variant: 'ghost',
    size: 'icon',
    'aria-label': 'Close',
  },
};

// Link variant - all sizes
export const Link: Story = {
  args: {
    children: 'Link',
    variant: 'link',
    size: 'default',
  },
};

export const LinkSmall: Story = {
  args: {
    children: 'Small Link',
    variant: 'link',
    size: 'sm',
  },
};

export const LinkLarge: Story = {
  args: {
    children: 'Large Link',
    variant: 'link',
    size: 'lg',
  },
};

export const LinkIcon: Story = {
  args: {
    children: <Mail className="size-4" />,
    variant: 'link',
    size: 'icon',
    'aria-label': 'Email',
  },
};

// State variations
export const Disabled: Story = {
  args: {
    children: 'Disabled',
    disabled: true,
    variant: 'default',
  },
};

export const DisabledDestructive: Story = {
  args: {
    children: 'Disabled',
    disabled: true,
    variant: 'destructive',
  },
};

export const DisabledOutline: Story = {
  args: {
    children: 'Disabled',
    disabled: true,
    variant: 'outline',
  },
};

// Icon placement examples
export const WithIconLeft: Story = {
  args: {
    children: (
      <>
        <Mail className="size-4" />
        Email
      </>
    ),
    variant: 'default',
  },
};

export const WithIconRight: Story = {
  args: {
    children: (
      <>
        Next
        <ChevronRight className="size-4" />
      </>
    ),
    variant: 'default',
  },
};

export const WithIconBoth: Story = {
  args: {
    children: (
      <>
        <Save className="size-4" />
        Save Draft
        <ChevronRight className="size-4" />
      </>
    ),
    variant: 'secondary',
  },
};

// Loading state simulation (using disabled + custom content)
export const Loading: Story = {
  args: {
    children: (
      <>
        <span className="animate-spin">⏳</span>
        Loading...
      </>
    ),
    disabled: true,
    variant: 'default',
  },
};

// Long text handling
export const WithLongText: Story = {
  args: {
    children: 'Button with very long text content that should not wrap',
    variant: 'default',
  },
};
