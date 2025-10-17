import type { Meta, StoryObj } from '@storybook/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { CreditCard, Settings, User, Lock, Bell, Palette } from 'lucide-react';
import React from 'react';

const meta = {
  title: 'UI/Tabs',
  component: Tabs,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-[600px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic horizontal tabs
export const Default: Story = {
  render: () => (
    <Tabs defaultValue="account" className="w-full">
      <TabsList className="w-full">
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>
      <TabsContent value="account" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>
              Make changes to your account here. Click save when you're done.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="name">Name</Label>
              <Input id="name" defaultValue="Pedro Duarte" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="username">Username</Label>
              <Input id="username" defaultValue="@peduarte" />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="password" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>
              Change your password here. After saving, you'll be logged out.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="current">Current password</Label>
              <Input id="current" type="password" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="new">New password</Label>
              <Input id="new" type="password" />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="settings" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>
              Manage your general application settings and preferences.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="notifications">Email notifications</Label>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="privacy">Privacy settings</Label>
                <Button variant="outline" size="sm">Manage</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  ),
};

// Tabs with icons
export const WithIcons: Story = {
  render: () => (
    <Tabs defaultValue="profile" className="w-full">
      <TabsList className="w-full">
        <TabsTrigger value="profile">
          <User className="mr-2 h-4 w-4" />
          Profile
        </TabsTrigger>
        <TabsTrigger value="billing">
          <CreditCard className="mr-2 h-4 w-4" />
          Billing
        </TabsTrigger>
        <TabsTrigger value="preferences">
          <Settings className="mr-2 h-4 w-4" />
          Preferences
        </TabsTrigger>
      </TabsList>
      <TabsContent value="profile" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your profile details</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">Manage your public profile information.</p>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="billing" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Billing & Subscription</CardTitle>
            <CardDescription>Manage your subscription and payment methods</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">View and update your billing information.</p>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="preferences" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>App Preferences</CardTitle>
            <CardDescription>Customize your experience</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">Set your application preferences.</p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  ),
};

// Tabs with disabled state
export const WithDisabled: Story = {
  render: () => (
    <Tabs defaultValue="general" className="w-full">
      <TabsList className="w-full">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
        <TabsTrigger value="advanced" disabled>
          Advanced (Pro only)
        </TabsTrigger>
      </TabsList>
      <TabsContent value="general" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>Basic configuration options</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">Configure general application settings.</p>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="security" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Security Settings</CardTitle>
            <CardDescription>Manage security preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">Configure security and privacy options.</p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  ),
};

// Simple tabs without cards
export const Simple: Story = {
  render: () => (
    <Tabs defaultValue="tab1" className="w-full">
      <TabsList>
        <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        <TabsTrigger value="tab3">Tab 3</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1" className="mt-4">
        <p>Content for tab 1</p>
      </TabsContent>
      <TabsContent value="tab2" className="mt-4">
        <p>Content for tab 2</p>
      </TabsContent>
      <TabsContent value="tab3" className="mt-4">
        <p>Content for tab 3</p>
      </TabsContent>
    </Tabs>
  ),
};

// Many tabs (scrollable)
export const ManyTabs: Story = {
  render: () => (
    <Tabs defaultValue="tab1" className="w-full">
      <TabsList className="w-full">
        <TabsTrigger value="tab1">Overview</TabsTrigger>
        <TabsTrigger value="tab2">Analytics</TabsTrigger>
        <TabsTrigger value="tab3">Reports</TabsTrigger>
        <TabsTrigger value="tab4">Notifications</TabsTrigger>
        <TabsTrigger value="tab5">Settings</TabsTrigger>
        <TabsTrigger value="tab6">Advanced</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">Overview content goes here.</p>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="tab2" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">Analytics content goes here.</p>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="tab3" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">Reports content goes here.</p>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="tab4" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">Notifications content goes here.</p>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="tab5" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">Settings content goes here.</p>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="tab6" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Advanced</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">Advanced content goes here.</p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  ),
};

// Settings page example
export const SettingsPage: Story = {
  render: () => (
    <Tabs defaultValue="account" className="w-full">
      <TabsList className="w-full">
        <TabsTrigger value="account">
          <User className="mr-2 h-4 w-4" />
          Account
        </TabsTrigger>
        <TabsTrigger value="security">
          <Lock className="mr-2 h-4 w-4" />
          Security
        </TabsTrigger>
        <TabsTrigger value="notifications">
          <Bell className="mr-2 h-4 w-4" />
          Notifications
        </TabsTrigger>
        <TabsTrigger value="appearance">
          <Palette className="mr-2 h-4 w-4" />
          Appearance
        </TabsTrigger>
      </TabsList>
      <TabsContent value="account" className="mt-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your public profile information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Display Name</Label>
              <Input defaultValue="John Doe" />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input type="email" defaultValue="john@example.com" />
            </div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="security" className="mt-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>Update your password</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Current Password</Label>
              <Input type="password" />
            </div>
            <div className="space-y-1">
              <Label>New Password</Label>
              <Input type="password" />
            </div>
            <div className="space-y-1">
              <Label>Confirm Password</Label>
              <Input type="password" />
            </div>
            <Button>Update Password</Button>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="notifications" className="mt-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Email Notifications</CardTitle>
            <CardDescription>Configure email preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Marketing emails</p>
                <p className="text-xs text-[color:var(--text-subtle)]">Receive emails about new features and updates</p>
              </div>
              <Button variant="outline" size="sm">Configure</Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Security alerts</p>
                <p className="text-xs text-[color:var(--text-subtle)]">Receive alerts about account security</p>
              </div>
              <Button variant="outline" size="sm">Configure</Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="appearance" className="mt-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Theme</CardTitle>
            <CardDescription>Customize the appearance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Color Scheme</Label>
                <p className="text-sm text-[color:var(--text-subtle)]">Choose between light and dark mode</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline">Light</Button>
                <Button variant="outline">Dark</Button>
                <Button variant="outline">System</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  ),
};

// Compact tabs
export const Compact: Story = {
  render: () => (
    <Tabs defaultValue="recent" className="w-[400px]">
      <TabsList className="w-full">
        <TabsTrigger value="recent">Recent</TabsTrigger>
        <TabsTrigger value="popular">Popular</TabsTrigger>
        <TabsTrigger value="trending">Trending</TabsTrigger>
      </TabsList>
      <TabsContent value="recent" className="mt-2">
        <div className="space-y-2">
          <p className="text-sm font-medium">Recent Items</p>
          <p className="text-xs text-[color:var(--text-subtle)]">Items from the last 24 hours</p>
        </div>
      </TabsContent>
      <TabsContent value="popular" className="mt-2">
        <div className="space-y-2">
          <p className="text-sm font-medium">Popular Items</p>
          <p className="text-xs text-[color:var(--text-subtle)]">Most viewed this week</p>
        </div>
      </TabsContent>
      <TabsContent value="trending" className="mt-2">
        <div className="space-y-2">
          <p className="text-sm font-medium">Trending Items</p>
          <p className="text-xs text-[color:var(--text-subtle)]">Rising in popularity</p>
        </div>
      </TabsContent>
    </Tabs>
  ),
};