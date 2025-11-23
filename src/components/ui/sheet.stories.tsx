import type { Meta, StoryObj } from "@storybook/react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./sheet";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import React, { useState } from "react";
import { Separator } from "./separator";

const meta = {
  title: "UI/Sheet",
  component: Sheet,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="flex min-h-[600px] min-w-[600px] items-center justify-center">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Sheet>;

export default meta;
type Story = StoryObj<typeof meta>;

// Right side sheet (default)
export const RightSide: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button>Open Right Sheet</Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Right Side Sheet</SheetTitle>
          <SheetDescription>
            This sheet slides in from the right side of the screen.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input id="name" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input id="email" type="email" className="col-span-3" />
          </div>
        </div>
        <SheetFooter>
          <Button type="submit">Save changes</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
};

// Left side sheet
export const LeftSide: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open Left Sheet</Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Navigation Menu</SheetTitle>
          <SheetDescription>
            A sheet that slides in from the left, commonly used for navigation.
          </SheetDescription>
        </SheetHeader>
        <nav className="flex flex-col gap-2 py-4">
          <Button variant="ghost" className="justify-start">
            Dashboard
          </Button>
          <Button variant="ghost" className="justify-start">
            Profile
          </Button>
          <Button variant="ghost" className="justify-start">
            Settings
          </Button>
          <Separator className="my-2" />
          <Button variant="ghost" className="justify-start">
            Logout
          </Button>
        </nav>
      </SheetContent>
    </Sheet>
  ),
};

// Top side sheet
export const TopSide: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="secondary">Open Top Sheet</Button>
      </SheetTrigger>
      <SheetContent side="top" className="h-auto">
        <SheetHeader>
          <SheetTitle>Notification Panel</SheetTitle>
          <SheetDescription>Important notifications and alerts appear here.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-2 py-4">
          <div className="rounded-lg border bg-card p-3">
            <p className="text-sm font-medium">New message received</p>
            <p className="text-xs text-muted-foreground">2 minutes ago</p>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <p className="text-sm font-medium">Update available</p>
            <p className="text-xs text-muted-foreground">1 hour ago</p>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <p className="text-sm font-medium">Backup completed</p>
            <p className="text-xs text-muted-foreground">3 hours ago</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  ),
};

// Bottom side sheet
export const BottomSide: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="destructive">Open Bottom Sheet</Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-auto">
        <SheetHeader>
          <SheetTitle>Confirm Action</SheetTitle>
          <SheetDescription>
            This action cannot be undone. This will permanently delete your data.
          </SheetDescription>
        </SheetHeader>
        <div className="flex gap-2 py-4">
          <Button variant="outline" className="flex-1">
            Cancel
          </Button>
          <Button variant="destructive" className="flex-1">
            Delete
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  ),
};

// Controlled sheet with animation state tracking
const ControlledSheet = () => {
  const [open, setOpen] = useState(false);
  const [animationState, setAnimationState] = useState("closed");

  return (
    <div className="flex flex-col gap-4">
      <div className="text-sm text-muted-foreground">
        Animation State: <span className="font-mono font-semibold">{animationState}</span>
      </div>
      <Sheet
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          setAnimationState(isOpen ? "opening → open" : "closing → closed");
          if (isOpen) {
            setTimeout(() => setAnimationState("open"), 500);
          } else {
            setTimeout(() => setAnimationState("closed"), 300);
          }
        }}
      >
        <SheetTrigger asChild>
          <Button>Controlled Sheet</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Controlled Sheet</SheetTitle>
            <SheetDescription>
              This sheet's open state is controlled programmatically.
            </SheetDescription>
          </SheetHeader>
          <div className="py-4">
            <p>Sheet is currently: {open ? "open" : "closed"}</p>
            <Button className="mt-4" onClick={() => setOpen(false)} variant="outline">
              Close Sheet
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export const Controlled: Story = {
  render: () => <ControlledSheet />,
};

// Long content with scrolling
export const WithScrollableContent: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button>Open Scrollable Sheet</Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Terms of Service</SheetTitle>
          <SheetDescription>Please read and accept our terms of service.</SheetDescription>
        </SheetHeader>
        <div className="py-4">
          {Array.from({ length: 20 }, (_, i) => (
            <div key={i} className="mb-4">
              <h3 className="mb-2 font-semibold">Section {i + 1}</h3>
              <p className="text-sm text-muted-foreground">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
                incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
                exercitation ullamco laboris.
              </p>
            </div>
          ))}
        </div>
        <SheetFooter>
          <Button variant="outline">Decline</Button>
          <Button>Accept</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
};

// Mobile responsive behavior
export const MobileResponsive: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button>Open Mobile Sheet</Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>Mobile Responsive</SheetTitle>
          <SheetDescription>
            This sheet takes full width on mobile devices and has a max width on larger screens.
          </SheetDescription>
        </SheetHeader>
        <div className="py-4">
          <p className="text-sm">
            Resize your viewport to see how this sheet adapts to different screen sizes.
          </p>
          <div className="mt-4 space-y-2">
            <div className="rounded bg-primary/10 p-2 text-xs">Mobile: Full width</div>
            <div className="rounded bg-secondary/10 p-2 text-xs">Tablet/Desktop: max-w-sm</div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  ),
};

// Nested sheets
export const NestedSheets: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button>Open First Sheet</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>First Sheet</SheetTitle>
          <SheetDescription>
            This is the first sheet. You can open another sheet from here.
          </SheetDescription>
        </SheetHeader>
        <div className="py-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">Open Second Sheet</Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>Second Sheet</SheetTitle>
                <SheetDescription>
                  This is a nested sheet that opens from the opposite side.
                </SheetDescription>
              </SheetHeader>
              <div className="py-4">
                <p>This demonstrates nested sheet functionality.</p>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </SheetContent>
    </Sheet>
  ),
};

// All directions showcase
export const AllDirections: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline">↑ Top</Button>
        </SheetTrigger>
        <SheetContent side="top" className="h-[200px]">
          <SheetHeader>
            <SheetTitle>Top Sheet</SheetTitle>
            <SheetDescription>Slides from top</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>

      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline">→ Right</Button>
        </SheetTrigger>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Right Sheet</SheetTitle>
            <SheetDescription>Slides from right</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>

      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline">↓ Bottom</Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[200px]">
          <SheetHeader>
            <SheetTitle>Bottom Sheet</SheetTitle>
            <SheetDescription>Slides from bottom</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>

      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline">← Left</Button>
        </SheetTrigger>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>Left Sheet</SheetTitle>
            <SheetDescription>Slides from left</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    </div>
  ),
};

// Semantic color usage showcase
export const SemanticColors: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button>Open Color Showcase</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Semantic Colors</SheetTitle>
          <SheetDescription>Demonstrating proper semantic color usage in sheets.</SheetDescription>
        </SheetHeader>
        <div className="space-y-4 py-4">
          <div className="rounded-lg border border-border bg-background p-3">
            <p className="text-sm font-medium">Default Border & Background</p>
            <p className="text-xs text-muted-foreground">Using --border and --background</p>
          </div>

          <div className="rounded-lg border border-primary bg-primary/10 p-3">
            <p className="text-sm font-medium text-primary">Primary Accent</p>
            <p className="text-xs text-muted-foreground">Using --primary for emphasis</p>
          </div>

          <div className="rounded-lg border border-destructive bg-destructive/10 p-3">
            <p className="text-sm font-medium text-destructive">Destructive State</p>
            <p className="text-xs text-muted-foreground">Using --destructive for warnings</p>
          </div>

          <div className="rounded-lg border border-secondary bg-secondary p-3">
            <p className="text-sm font-medium text-secondary-foreground">Secondary Style</p>
            <p className="text-xs text-muted-foreground">Using --secondary colors</p>
          </div>
        </div>
        <SheetFooter>
          <Button variant="outline">Close</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
};
