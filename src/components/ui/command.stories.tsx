import type { Meta, StoryObj } from "@storybook/react";
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from "./command";
import { Button } from "./button";
import {
  Calculator,
  Calendar,
  CreditCard,
  Settings,
  Smile,
  User,
  Search,
  Mail,
  MessageSquare,
  Music,
  Plane,
  Plus,
  FileText,
  Archive,
  Trash,
  Star,
  Clock,
  Download,
  Upload,
} from "lucide-react";
import React from "react";

const meta = {
  title: "UI/Command",
  component: Command,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "Command menu component with search and keyboard navigation.",
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
} satisfies Meta<typeof Command>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic command palette
export const Default: Story = {
  render: () => (
    <Command className="rounded-lg border shadow-md">
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Suggestions">
          <CommandItem>
            <Calendar className="mr-2 size-4" />
            Calendar
          </CommandItem>
          <CommandItem>
            <Smile className="mr-2 size-4" />
            Search Emoji
          </CommandItem>
          <CommandItem>
            <Calculator className="mr-2 size-4" />
            Calculator
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Settings">
          <CommandItem>
            <User className="mr-2 size-4" />
            Profile
            <CommandShortcut>⌘P</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <CreditCard className="mr-2 size-4" />
            Billing
            <CommandShortcut>⌘B</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <Settings className="mr-2 size-4" />
            Settings
            <CommandShortcut>⌘S</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
};

// Command dialog
const CommandDialogExample = () => {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <>
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-4">
          Press{" "}
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>{" "}
          to open command palette
        </p>
        <Button onClick={() => setOpen(true)}>Open Command Palette</Button>
      </div>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Suggestions">
            <CommandItem onSelect={() => setOpen(false)}>
              <Calendar className="mr-2 size-4" />
              Calendar
            </CommandItem>
            <CommandItem onSelect={() => setOpen(false)}>
              <Smile className="mr-2 size-4" />
              Search Emoji
            </CommandItem>
            <CommandItem onSelect={() => setOpen(false)}>
              <Calculator className="mr-2 size-4" />
              Calculator
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Settings">
            <CommandItem onSelect={() => setOpen(false)}>
              <User className="mr-2 size-4" />
              Profile
              <CommandShortcut>⌘P</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => setOpen(false)}>
              <CreditCard className="mr-2 size-4" />
              Billing
              <CommandShortcut>⌘B</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => setOpen(false)}>
              <Settings className="mr-2 size-4" />
              Settings
              <CommandShortcut>⌘S</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
};

export const DialogExample: Story = {
  render: () => <CommandDialogExample />,
};

// With search functionality
const CommandWithSearch = () => {
  const [search, setSearch] = React.useState("");

  const items = [
    { id: 1, name: "Calendar", icon: Calendar, group: "Apps" },
    { id: 2, name: "Search Emoji", icon: Smile, group: "Apps" },
    { id: 3, name: "Calculator", icon: Calculator, group: "Apps" },
    { id: 4, name: "Profile", icon: User, group: "Settings" },
    { id: 5, name: "Billing", icon: CreditCard, group: "Settings" },
    { id: 6, name: "Settings", icon: Settings, group: "Settings" },
    { id: 7, name: "Mail", icon: Mail, group: "Communication" },
    { id: 8, name: "Messages", icon: MessageSquare, group: "Communication" },
  ];

  const groups = [...new Set(items.map((item) => item.group))];

  return (
    <Command className="rounded-lg border shadow-md">
      <CommandInput placeholder="Search..." value={search} onValueChange={setSearch} />
      <CommandList>
        <CommandEmpty>No results found for "{search}"</CommandEmpty>
        {groups.map((group) => (
          <CommandGroup key={group} heading={group}>
            {items
              .filter((item) => item.group === group)
              .map((item) => (
                <CommandItem key={item.id}>
                  <item.icon className="mr-2 size-4" />
                  {item.name}
                </CommandItem>
              ))}
          </CommandGroup>
        ))}
      </CommandList>
    </Command>
  );
};

export const WithSearch: Story = {
  render: () => <CommandWithSearch />,
};

// With many items (scrollable)
export const LongList: Story = {
  render: () => (
    <Command className="rounded-lg border shadow-md">
      <CommandInput placeholder="Search files..." />
      <CommandList className="h-[300px]">
        <CommandEmpty>No files found.</CommandEmpty>
        <CommandGroup heading="Recent">
          {Array.from({ length: 10 }, (_, i) => (
            <CommandItem key={`recent-${i}`}>
              <FileText className="mr-2 size-4" />
              Document {i + 1}.pdf
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Favorites">
          {Array.from({ length: 5 }, (_, i) => (
            <CommandItem key={`fav-${i}`}>
              <Star className="mr-2 size-4" />
              Favorite {i + 1}.doc
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  ),
};

// With disabled items
export const WithDisabledItems: Story = {
  render: () => (
    <Command className="rounded-lg border shadow-md">
      <CommandInput placeholder="Type a command..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Actions">
          <CommandItem>
            <Plus className="mr-2 size-4" />
            Create New
          </CommandItem>
          <CommandItem disabled>
            <Upload className="mr-2 size-4" />
            Upload (Disabled)
          </CommandItem>
          <CommandItem>
            <Download className="mr-2 size-4" />
            Download
          </CommandItem>
          <CommandItem disabled>
            <Archive className="mr-2 size-4" />
            Archive (Disabled)
          </CommandItem>
          <CommandItem>
            <Trash className="mr-2 size-4" />
            Delete
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
};

// Interactive filtering demo
const CommandInteractiveFilter = () => {
  const [selectedItem, setSelectedItem] = React.useState("");

  return (
    <div>
      <p className="mb-4 text-sm text-muted-foreground">
        Selected: {selectedItem || "None"}
      </p>
      <Command className="rounded-lg border shadow-md">
        <CommandInput placeholder="Start typing to filter..." />
        <CommandList>
          <CommandEmpty>No matching commands.</CommandEmpty>
          <CommandGroup heading="Quick Actions">
            <CommandItem onSelect={() => setSelectedItem("New File")}>
              <FileText className="mr-2 size-4" />
              New File
              <CommandShortcut>⌘N</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => setSelectedItem("Open File")}>
              <FileText className="mr-2 size-4" />
              Open File
              <CommandShortcut>⌘O</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => setSelectedItem("Save File")}>
              <Download className="mr-2 size-4" />
              Save File
              <CommandShortcut>⌘S</CommandShortcut>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Applications">
            <CommandItem onSelect={() => setSelectedItem("Music Player")}>
              <Music className="mr-2 size-4" />
              Music Player
            </CommandItem>
            <CommandItem onSelect={() => setSelectedItem("Travel Planner")}>
              <Plane className="mr-2 size-4" />
              Travel Planner
            </CommandItem>
            <CommandItem onSelect={() => setSelectedItem("Time Tracker")}>
              <Clock className="mr-2 size-4" />
              Time Tracker
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  );
};

export const InteractiveFilter: Story = {
  render: () => <CommandInteractiveFilter />,
};

// Keyboard navigation demo
const CommandKeyboardNavigation = () => {
  const [selected, setSelected] = React.useState("");

  return (
    <div>
      <p className="mb-4 text-sm text-muted-foreground">
        Use ↑↓ arrows to navigate, Enter to select, Esc to clear focus
      </p>
      <p className="mb-4 text-sm">Selected: {selected || "None"}</p>
      <Command className="rounded-lg border shadow-md">
        <CommandInput placeholder="Focus here and use arrow keys..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigation Test">
            <CommandItem onSelect={() => setSelected("First Item")}>
              First Item (↓ to next)
            </CommandItem>
            <CommandItem onSelect={() => setSelected("Second Item")}>Second Item</CommandItem>
            <CommandItem disabled>Disabled (skipped in navigation)</CommandItem>
            <CommandItem onSelect={() => setSelected("Third Item")}>Third Item</CommandItem>
            <CommandItem onSelect={() => setSelected("Last Item")}>
              Last Item (↑ to previous)
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  );
};

export const KeyboardNavigation: Story = {
  render: () => <CommandKeyboardNavigation />,
};

// Complex multi-group example
const ComplexMultiGroupCommand = () => {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Complex Command Menu</Button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Command Center"
        description="Quick access to all features"
      >
        <CommandInput placeholder="What would you like to do?" />
        <CommandList>
          <CommandEmpty>No commands found. Try a different search.</CommandEmpty>
          <CommandGroup heading="Suggestions">
            <CommandItem onSelect={() => setOpen(false)}>
              <Search className="mr-2 size-4" />
              Search Everything
              <CommandShortcut>⌘K</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => setOpen(false)}>
              <Plus className="mr-2 size-4" />
              Create New
              <CommandShortcut>⌘N</CommandShortcut>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Files">
            <CommandItem onSelect={() => setOpen(false)}>
              <FileText className="mr-2 size-4" />
              Recent Documents
            </CommandItem>
            <CommandItem onSelect={() => setOpen(false)}>
              <Archive className="mr-2 size-4" />
              Archived Files
            </CommandItem>
            <CommandItem onSelect={() => setOpen(false)}>
              <Trash className="mr-2 size-4" />
              Trash
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Communication">
            <CommandItem onSelect={() => setOpen(false)}>
              <Mail className="mr-2 size-4" />
              Email
              <CommandShortcut>⌘E</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => setOpen(false)}>
              <MessageSquare className="mr-2 size-4" />
              Messages
              <CommandShortcut>⌘M</CommandShortcut>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Tools">
            <CommandItem onSelect={() => setOpen(false)}>
              <Calculator className="mr-2 size-4" />
              Calculator
            </CommandItem>
            <CommandItem onSelect={() => setOpen(false)}>
              <Calendar className="mr-2 size-4" />
              Calendar
            </CommandItem>
            <CommandItem onSelect={() => setOpen(false)}>
              <Music className="mr-2 size-4" />
              Music
            </CommandItem>
            <CommandItem onSelect={() => setOpen(false)}>
              <Plane className="mr-2 size-4" />
              Travel
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
};

export const ComplexMultiGroup: Story = {
  render: () => <ComplexMultiGroupCommand />,
};
