import type { Meta, StoryObj } from '@storybook/react';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import React from 'react';

const meta = {
  title: 'UI/Avatar',
  component: Avatar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

// Avatar with image
export const Default: Story = {
  render: () => (
    <Avatar>
      <AvatarImage
        src="https://github.com/shadcn.png"
        alt="@shadcn"
      />
      <AvatarFallback>CN</AvatarFallback>
    </Avatar>
  ),
};

// Avatar with fallback initials
export const FallbackInitials: Story = {
  render: () => (
    <Avatar>
      <AvatarImage
        src="/broken-image.jpg"
        alt="John Doe"
      />
      <AvatarFallback>JD</AvatarFallback>
    </Avatar>
  ),
};

// Different sizes
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      {/* Extra Small */}
      <Avatar className="size-6">
        <AvatarImage src="https://github.com/shadcn.png" alt="XS Avatar" />
        <AvatarFallback className="text-xs">XS</AvatarFallback>
      </Avatar>

      {/* Small */}
      <Avatar className="size-8">
        <AvatarImage src="https://github.com/shadcn.png" alt="SM Avatar" />
        <AvatarFallback className="text-sm">SM</AvatarFallback>
      </Avatar>

      {/* Default */}
      <Avatar className="size-10">
        <AvatarImage src="https://github.com/shadcn.png" alt="MD Avatar" />
        <AvatarFallback>MD</AvatarFallback>
      </Avatar>

      {/* Large */}
      <Avatar className="size-12">
        <AvatarImage src="https://github.com/shadcn.png" alt="LG Avatar" />
        <AvatarFallback className="text-lg">LG</AvatarFallback>
      </Avatar>

      {/* Extra Large */}
      <Avatar className="size-16">
        <AvatarImage src="https://github.com/shadcn.png" alt="XL Avatar" />
        <AvatarFallback className="text-xl">XL</AvatarFallback>
      </Avatar>

      {/* 2XL */}
      <Avatar className="size-20">
        <AvatarImage src="https://github.com/shadcn.png" alt="2XL Avatar" />
        <AvatarFallback className="text-2xl">2XL</AvatarFallback>
      </Avatar>
    </div>
  ),
};

// Avatar group
export const AvatarGroup: Story = {
  render: () => (
    <div className="flex -space-x-3">
      <Avatar className="border-2 border-background">
        <AvatarImage src="https://github.com/shadcn.png" alt="User 1" />
        <AvatarFallback>U1</AvatarFallback>
      </Avatar>
      <Avatar className="border-2 border-background">
        <AvatarImage src="https://github.com/vercel.png" alt="User 2" />
        <AvatarFallback>U2</AvatarFallback>
      </Avatar>
      <Avatar className="border-2 border-background">
        <AvatarImage src="https://github.com/zeit.png" alt="User 3" />
        <AvatarFallback>U3</AvatarFallback>
      </Avatar>
      <Avatar className="border-2 border-background">
        <AvatarFallback className="bg-muted text-[color:var(--text-subtle)]">+5</AvatarFallback>
      </Avatar>
    </div>
  ),
};

// With status indicator
export const WithStatus: Story = {
  render: () => (
    <div className="flex gap-4">
      {/* Online */}
      <div className="relative">
        <Avatar>
          <AvatarImage src="https://github.com/shadcn.png" alt="Online user" />
          <AvatarFallback>ON</AvatarFallback>
        </Avatar>
        <span className="absolute bottom-0 right-0 size-3 bg-green-500 border-2 border-background rounded-full" />
      </div>

      {/* Away */}
      <div className="relative">
        <Avatar>
          <AvatarImage src="https://github.com/vercel.png" alt="Away user" />
          <AvatarFallback>AW</AvatarFallback>
        </Avatar>
        <span className="absolute bottom-0 right-0 size-3 bg-yellow-500 border-2 border-background rounded-full" />
      </div>

      {/* Busy */}
      <div className="relative">
        <Avatar>
          <AvatarImage src="https://github.com/zeit.png" alt="Busy user" />
          <AvatarFallback>BS</AvatarFallback>
        </Avatar>
        <span className="absolute bottom-0 right-0 size-3 bg-red-500 border-2 border-background rounded-full" />
      </div>

      {/* Offline */}
      <div className="relative">
        <Avatar>
          <AvatarImage src="/broken.jpg" alt="Offline user" />
          <AvatarFallback>OF</AvatarFallback>
        </Avatar>
        <span className="absolute bottom-0 right-0 size-3 bg-gray-500 border-2 border-background rounded-full" />
      </div>
    </div>
  ),
};

// Loading state (shimmer effect)
export const Loading: Story = {
  render: () => (
    <Avatar>
      <AvatarFallback className="animate-pulse bg-muted" />
    </Avatar>
  ),
};

// Different fallback colors
export const FallbackColors: Story = {
  render: () => (
    <div className="flex gap-4">
      <Avatar>
        <AvatarFallback className="bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400">
          RD
        </AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback className="bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400">
          GR
        </AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback className="bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
          BL
        </AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback className="bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
          PR
        </AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback className="bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400">
          OR
        </AvatarFallback>
      </Avatar>
    </div>
  ),
};

// Square avatar variant
export const Square: Story = {
  render: () => (
    <div className="flex gap-4">
      <Avatar className="rounded-md">
        <AvatarImage src="https://github.com/shadcn.png" alt="Square avatar" />
        <AvatarFallback className="rounded-md">SQ</AvatarFallback>
      </Avatar>
      <Avatar className="rounded-lg">
        <AvatarImage src="https://github.com/vercel.png" alt="Rounded square" />
        <AvatarFallback className="rounded-lg">RS</AvatarFallback>
      </Avatar>
      <Avatar className="rounded-none">
        <AvatarImage src="https://github.com/zeit.png" alt="No rounding" />
        <AvatarFallback className="rounded-none">NR</AvatarFallback>
      </Avatar>
    </div>
  ),
};

// With border
export const WithBorder: Story = {
  render: () => (
    <div className="flex gap-4">
      <Avatar className="ring-2 ring-primary">
        <AvatarImage src="https://github.com/shadcn.png" alt="Primary ring" />
        <AvatarFallback>PR</AvatarFallback>
      </Avatar>
      <Avatar className="ring-2 ring-destructive">
        <AvatarImage src="https://github.com/vercel.png" alt="Destructive ring" />
        <AvatarFallback>DS</AvatarFallback>
      </Avatar>
      <Avatar className="ring-2 ring-muted">
        <AvatarImage src="https://github.com/zeit.png" alt="Muted ring" />
        <AvatarFallback>MT</AvatarFallback>
      </Avatar>
    </div>
  ),
};

// Single letter fallback
export const SingleLetter: Story = {
  render: () => (
    <div className="flex gap-4">
      <Avatar>
        <AvatarFallback>A</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>B</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>C</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>D</AvatarFallback>
      </Avatar>
    </div>
  ),
};

// With emoji fallback
export const EmojiFallback: Story = {
  render: () => (
    <div className="flex gap-4">
      <Avatar>
        <AvatarFallback>😊</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>🚀</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>⭐</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>🎨</AvatarFallback>
      </Avatar>
    </div>
  ),
};

// User list example
export const UserList: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage src="https://github.com/shadcn.png" alt="Alice Johnson" />
          <AvatarFallback>AJ</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium">Alice Johnson</p>
          <p className="text-xs text-[color:var(--text-subtle)]">alice@example.com</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage src="https://github.com/vercel.png" alt="Bob Smith" />
          <AvatarFallback>BS</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium">Bob Smith</p>
          <p className="text-xs text-[color:var(--text-subtle)]">bob@example.com</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage src="/broken.jpg" alt="Carol White" />
          <AvatarFallback>CW</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium">Carol White</p>
          <p className="text-xs text-[color:var(--text-subtle)]">carol@example.com</p>
        </div>
      </div>
    </div>
  ),
};

// Profile card example
export const ProfileCard: Story = {
  render: () => (
    <div className="flex flex-col items-center gap-2 p-6 border rounded-lg">
      <Avatar className="size-24">
        <AvatarImage src="https://github.com/shadcn.png" alt="John Doe" />
        <AvatarFallback className="text-2xl">JD</AvatarFallback>
      </Avatar>
      <div className="text-center">
        <h3 className="font-semibold">John Doe</h3>
        <p className="text-sm text-[color:var(--text-subtle)]">Software Engineer</p>
      </div>
    </div>
  ),
};