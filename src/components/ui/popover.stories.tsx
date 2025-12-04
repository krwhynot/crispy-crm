import type { Meta, StoryObj } from "@storybook/react";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { Info, Settings, HelpCircle, User, Calendar, Clock } from "lucide-react";
import React from "react";

const meta = {
  title: "UI/Popover",
  component: Popover,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "Displays rich content in a portal, triggered by a button.",
      },
    },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="flex min-h-[400px] w-full items-center justify-center">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic popover
export const Default: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Open popover</Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Dimensions</h4>
            <p className="text-sm text-muted-foreground">Set the dimensions for the layer.</p>
          </div>
          <div className="grid gap-2">
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="width">Width</Label>
              <Input id="width" defaultValue="100%" className="col-span-2 h-8" />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="maxWidth">Max. width</Label>
              <Input id="maxWidth" defaultValue="300px" className="col-span-2 h-8" />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="height">Height</Label>
              <Input id="height" defaultValue="25px" className="col-span-2 h-8" />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="maxHeight">Max. height</Label>
              <Input id="maxHeight" defaultValue="none" className="col-span-2 h-8" />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
};

// With icon trigger
export const IconTrigger: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon">
          <Info className="size-4" />
          <span className="sr-only">More information</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="space-y-2">
          <h4 className="font-medium">Information</h4>
          <p className="text-sm text-muted-foreground">
            This popover is triggered by an icon button. It's useful for providing additional
            context without cluttering the interface.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  ),
};

// Different alignments
export const Alignments: Story = {
  render: () => (
    <div className="flex gap-8">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Left aligned</Button>
        </PopoverTrigger>
        <PopoverContent align="start">
          <p className="text-sm">This popover is aligned to the start (left).</p>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Center aligned</Button>
        </PopoverTrigger>
        <PopoverContent align="center">
          <p className="text-sm">This popover is center-aligned.</p>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Right aligned</Button>
        </PopoverTrigger>
        <PopoverContent align="end">
          <p className="text-sm">This popover is aligned to the end (right).</p>
        </PopoverContent>
      </Popover>
    </div>
  ),
};

// Different sides
export const Sides: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-8">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Top</Button>
        </PopoverTrigger>
        <PopoverContent side="top">
          <p className="text-sm">This popover appears on top.</p>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Right</Button>
        </PopoverTrigger>
        <PopoverContent side="right">
          <p className="text-sm">This popover appears on the right.</p>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Bottom</Button>
        </PopoverTrigger>
        <PopoverContent side="bottom">
          <p className="text-sm">This popover appears on the bottom.</p>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Left</Button>
        </PopoverTrigger>
        <PopoverContent side="left">
          <p className="text-sm">This popover appears on the left.</p>
        </PopoverContent>
      </Popover>
    </div>
  ),
};

// Controlled popover
const ControlledPopover = () => {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button onClick={() => setOpen(true)}>Open programmatically</Button>
        <Button onClick={() => setOpen(false)} variant="outline">
          Close programmatically
        </Button>
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline">{open ? "Close" : "Open"} popover</Button>
        </PopoverTrigger>
        <PopoverContent>
          <div className="space-y-2">
            <h4 className="font-medium">Controlled Popover</h4>
            <p className="text-sm text-muted-foreground">
              This popover's open state is controlled programmatically.
            </p>
            <Button onClick={() => setOpen(false)} size="sm">
              Close from inside
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export const Controlled: Story = {
  render: () => <ControlledPopover />,
};

// Complex content
export const ComplexContent: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <Settings className="mr-2 size-4" />
          Settings
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Settings</h4>
            <p className="text-sm text-muted-foreground">Manage your application preferences.</p>
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="notifications">Notifications</Label>
              <input type="checkbox" id="notifications" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="marketing">Marketing emails</Label>
              <input type="checkbox" id="marketing" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="security">Security alerts</Label>
              <input type="checkbox" id="security" defaultChecked />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="language">Language</Label>
            <select id="language" className="rounded border p-1">
              <option>English</option>
              <option>Spanish</option>
              <option>French</option>
            </select>
          </div>
          <Button className="w-full">Save preferences</Button>
        </div>
      </PopoverContent>
    </Popover>
  ),
};

// User profile popover
export const UserProfile: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <User className="size-6" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="end">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center space-x-2">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
              <User className="size-5" />
            </div>
            <div>
              <p className="text-sm font-medium">John Doe</p>
              <p className="text-xs text-muted-foreground">john@example.com</p>
            </div>
          </div>
          <div className="border-t pt-2">
            <button className="w-full text-left text-sm py-1 hover:bg-muted rounded px-2">
              Profile
            </button>
            <button className="w-full text-left text-sm py-1 hover:bg-muted rounded px-2">
              Settings
            </button>
            <button className="w-full text-left text-sm py-1 hover:bg-muted rounded px-2">
              Sign out
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
};

// Help popover
export const HelpPopover: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon">
          <HelpCircle className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-3">
          <div>
            <h4 className="font-medium mb-1">Need help?</h4>
            <p className="text-sm text-muted-foreground">
              Here are some resources to get you started.
            </p>
          </div>
          <div className="space-y-2">
            <button className="flex items-center text-sm hover:underline">📚 Documentation</button>
            <button className="flex items-center text-sm hover:underline">
              💬 Community Forum
            </button>
            <button className="flex items-center text-sm hover:underline">
              📧 Contact Support
            </button>
            <button className="flex items-center text-sm hover:underline">
              🎥 Video Tutorials
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
};

// Date picker popover (mock)
const DatePickerPopover = () => {
  const [date, setDate] = React.useState("");

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-[240px] justify-start text-left">
          <Calendar className="mr-2 size-4" />
          {date || "Pick a date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-4">
          <div className="space-y-4">
            <div className="text-center">
              <h4 className="font-medium">March 2024</h4>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                <div key={day} className="font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
              {Array.from({ length: 31 }, (_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setDate(`March ${i + 1}, 2024`);
                  }}
                  className="h-8 w-8 rounded hover:bg-muted"
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export const DatePicker: Story = {
  render: () => <DatePickerPopover />,
};

// Time picker popover
const TimePickerPopover = () => {
  const [time, setTime] = React.useState("");

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-[180px] justify-start text-left">
          <Clock className="mr-2 size-4" />
          {time || "Select time"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2">
        <div className="grid gap-1">
          {["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM"].map((t) => (
            <button
              key={t}
              onClick={() => setTime(t)}
              className="text-left px-2 py-1 text-sm rounded hover:bg-muted"
            >
              {t}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export const TimePicker: Story = {
  render: () => <TimePickerPopover />,
};

// Keyboard navigation demo
const KeyboardNavigationPopover = () => {
  const [value, setValue] = React.useState("");

  return (
    <div>
      <p className="mb-4 text-sm text-muted-foreground">
        Tab to focus trigger, Space/Enter to open, Escape to close
      </p>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Test keyboard navigation</Button>
        </PopoverTrigger>
        <PopoverContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Keyboard Test</h4>
              <p className="text-sm text-muted-foreground">
                Tab through the form fields below. Press Escape to close.
              </p>
            </div>
            <div className="space-y-2">
              <div>
                <Label htmlFor="field1">Field 1</Label>
                <Input
                  id="field1"
                  placeholder="Tab to next field"
                  onChange={(e) => setValue(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="field2">Field 2</Label>
                <Input id="field2" placeholder="Tab to button" />
              </div>
              <Button className="w-full">Submit (Tab here, then Escape)</Button>
            </div>
            {value && <p className="text-sm text-muted-foreground">You typed: {value}</p>}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export const KeyboardNavigation: Story = {
  render: () => <KeyboardNavigationPopover />,
};
