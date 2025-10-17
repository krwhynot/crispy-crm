import type { Meta, StoryObj } from '@storybook/react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction,
} from './card';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { MoreHorizontal } from 'lucide-react';
import React from 'react';

const meta = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-[400px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic card with header, content, footer
export const Default: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm">
          This is the main content area of the card. You can add any content here including text, images, forms, or other components.
        </p>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="mr-2">Cancel</Button>
        <Button>Confirm</Button>
      </CardFooter>
    </Card>
  ),
};

// Card with header action
export const WithHeaderAction: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>Manage your notification preferences</CardDescription>
        <CardAction>
          <Button variant="ghost" size="icon" aria-label="More options">
            <MoreHorizontal className="size-4" />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="text-sm">You have 3 unread notifications.</p>
      </CardContent>
    </Card>
  ),
};

// Card with image
export const WithImage: Story = {
  render: () => (
    <Card className="overflow-hidden">
      <div className="h-48 bg-gradient-to-br from-primary/20 to-primary/10" />
      <CardHeader>
        <CardTitle>Beautiful Landscape</CardTitle>
        <CardDescription>A stunning view from the mountains</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm">
          Experience the breathtaking beauty of nature with this panoramic mountain view.
        </p>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full">View Gallery</Button>
      </CardFooter>
    </Card>
  ),
};

// Card with form inputs
export const WithForm: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Create Account</CardTitle>
        <CardDescription>Enter your details to get started</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" placeholder="Enter your name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="Enter your email" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" placeholder="Enter password" />
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full">Create Account</Button>
      </CardFooter>
    </Card>
  ),
};

// Nested cards
export const Nested: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Project Overview</CardTitle>
        <CardDescription>Current sprint progress</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">In Progress</CardTitle>
            <CardDescription className="text-xs">5 tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">Currently working on authentication flow</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Completed</CardTitle>
            <CardDescription className="text-xs">12 tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">Database schema and API endpoints ready</p>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  ),
};

// Simple card without footer
export const WithoutFooter: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Quick Note</CardTitle>
        <CardDescription>A simple card without a footer</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm">
          Sometimes you just need a simple card to display content without any actions at the bottom.
        </p>
      </CardContent>
    </Card>
  ),
};

// Minimal card with only content
export const MinimalContent: Story = {
  render: () => (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm">
          A minimal card with only content. No header or footer needed.
        </p>
      </CardContent>
    </Card>
  ),
};

// Interactive card with hover state
export const Interactive: Story = {
  render: () => (
    <Card className="transition-colors hover:border-primary cursor-pointer">
      <CardHeader>
        <CardTitle>Clickable Card</CardTitle>
        <CardDescription>This entire card is interactive</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm">Click anywhere on this card to select it.</p>
      </CardContent>
    </Card>
  ),
};

// Card with statistics
export const Statistics: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Revenue</CardTitle>
        <CardDescription>Total revenue this month</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">$45,231.89</div>
        <p className="text-xs text-[color:var(--text-subtle)]">
          +20.1% from last month
        </p>
      </CardContent>
    </Card>
  ),
};

// Card with list items
export const WithList: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Your latest actions</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center">
            <span className="w-2 h-2 rounded-full bg-primary mr-2" />
            Updated profile settings
          </li>
          <li className="flex items-center">
            <span className="w-2 h-2 rounded-full bg-primary mr-2" />
            Changed password
          </li>
          <li className="flex items-center">
            <span className="w-2 h-2 rounded-full bg-primary mr-2" />
            Connected new integration
          </li>
        </ul>
      </CardContent>
    </Card>
  ),
};