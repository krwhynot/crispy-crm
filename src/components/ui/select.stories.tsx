import type { Meta, StoryObj } from "@storybook/react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "./select";
import React from "react";

const meta = {
  title: "UI/Select",
  component: Select,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    disabled: {
      control: "boolean",
      description: "Whether the select is disabled",
    },
    defaultValue: {
      control: "text",
      description: "Default selected value",
    },
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default size stories
export const Default: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select an option" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="option1">Option 1</SelectItem>
        <SelectItem value="option2">Option 2</SelectItem>
        <SelectItem value="option3">Option 3</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const WithValue: Story = {
  render: () => (
    <Select defaultValue="option2">
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select an option" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="option1">Option 1</SelectItem>
        <SelectItem value="option2">Option 2</SelectItem>
        <SelectItem value="option3">Option 3</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const SmallSize: Story = {
  render: () => (
    <Select>
      <SelectTrigger size="sm" className="w-[180px]">
        <SelectValue placeholder="Small select" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="sm1">Small Option 1</SelectItem>
        <SelectItem value="sm2">Small Option 2</SelectItem>
        <SelectItem value="sm3">Small Option 3</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const SmallWithValue: Story = {
  render: () => (
    <Select defaultValue="sm2">
      <SelectTrigger size="sm" className="w-[180px]">
        <SelectValue placeholder="Small select" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="sm1">Small Option 1</SelectItem>
        <SelectItem value="sm2">Small Option 2</SelectItem>
        <SelectItem value="sm3">Small Option 3</SelectItem>
      </SelectContent>
    </Select>
  ),
};

// State variations
export const Disabled: Story = {
  render: () => (
    <Select disabled>
      <SelectTrigger className="w-[200px]" disabled>
        <SelectValue placeholder="Disabled select" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="option1">Option 1</SelectItem>
        <SelectItem value="option2">Option 2</SelectItem>
        <SelectItem value="option3">Option 3</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const DisabledWithValue: Story = {
  render: () => (
    <Select disabled defaultValue="option1">
      <SelectTrigger className="w-[200px]" disabled>
        <SelectValue placeholder="Disabled select" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="option1">Option 1</SelectItem>
        <SelectItem value="option2">Option 2</SelectItem>
        <SelectItem value="option3">Option 3</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const Invalid: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-[200px]" aria-invalid="true">
        <SelectValue placeholder="Invalid select" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="option1">Option 1</SelectItem>
        <SelectItem value="option2">Option 2</SelectItem>
        <SelectItem value="option3">Option 3</SelectItem>
      </SelectContent>
    </Select>
  ),
};

// With many options
export const ManyOptions: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select a number" />
      </SelectTrigger>
      <SelectContent>
        {Array.from({ length: 20 }, (_, i) => (
          <SelectItem key={i} value={`option${i + 1}`}>
            Option {i + 1}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  ),
};

// With groups
export const WithGroups: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Citrus</SelectLabel>
          <SelectItem value="orange">Orange</SelectItem>
          <SelectItem value="lemon">Lemon</SelectItem>
          <SelectItem value="lime">Lime</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Berries</SelectLabel>
          <SelectItem value="strawberry">Strawberry</SelectItem>
          <SelectItem value="blueberry">Blueberry</SelectItem>
          <SelectItem value="raspberry">Raspberry</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Tropical</SelectLabel>
          <SelectItem value="mango">Mango</SelectItem>
          <SelectItem value="pineapple">Pineapple</SelectItem>
          <SelectItem value="papaya">Papaya</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
};

// With disabled options
export const WithDisabledOptions: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Some options disabled" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="available1">Available Option 1</SelectItem>
        <SelectItem value="disabled1" disabled>
          Disabled Option
        </SelectItem>
        <SelectItem value="available2">Available Option 2</SelectItem>
        <SelectItem value="disabled2" disabled>
          Another Disabled
        </SelectItem>
        <SelectItem value="available3">Available Option 3</SelectItem>
      </SelectContent>
    </Select>
  ),
};

// Long option text
export const LongOptionText: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-[300px]">
        <SelectValue placeholder="Select an option with long text" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="short">Short</SelectItem>
        <SelectItem value="medium">This is a medium length option</SelectItem>
        <SelectItem value="long">
          This is a very long option text that might need to be truncated
        </SelectItem>
        <SelectItem value="verylong">
          This is an extremely long option text that definitely needs proper handling to avoid
          layout issues
        </SelectItem>
      </SelectContent>
    </Select>
  ),
};

// Country selector example
export const CountrySelector: Story = {
  render: () => (
    <Select defaultValue="us">
      <SelectTrigger className="w-[240px]">
        <SelectValue placeholder="Select a country" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>North America</SelectLabel>
          <SelectItem value="us">🇺🇸 United States</SelectItem>
          <SelectItem value="ca">🇨🇦 Canada</SelectItem>
          <SelectItem value="mx">🇲🇽 Mexico</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Europe</SelectLabel>
          <SelectItem value="uk">🇬🇧 United Kingdom</SelectItem>
          <SelectItem value="fr">🇫🇷 France</SelectItem>
          <SelectItem value="de">🇩🇪 Germany</SelectItem>
          <SelectItem value="es">🇪🇸 Spain</SelectItem>
          <SelectItem value="it">🇮🇹 Italy</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Asia</SelectLabel>
          <SelectItem value="jp">🇯🇵 Japan</SelectItem>
          <SelectItem value="cn">🇨🇳 China</SelectItem>
          <SelectItem value="in">🇮🇳 India</SelectItem>
          <SelectItem value="kr">🇰🇷 South Korea</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
};

// Status selector
export const StatusSelector: Story = {
  render: () => (
    <Select defaultValue="active">
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="active">
          <span className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-success" />
            Active
          </span>
        </SelectItem>
        <SelectItem value="pending">
          <span className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-warning" />
            Pending
          </span>
        </SelectItem>
        <SelectItem value="inactive">
          <span className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-muted-foreground" />
            Inactive
          </span>
        </SelectItem>
        <SelectItem value="error">
          <span className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-destructive" />
            Error
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
  ),
};

// Time zone selector
export const TimeZoneSelector: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-[280px]">
        <SelectValue placeholder="Select time zone" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Americas</SelectLabel>
          <SelectItem value="pst">PST - Pacific Standard Time</SelectItem>
          <SelectItem value="mst">MST - Mountain Standard Time</SelectItem>
          <SelectItem value="cst">CST - Central Standard Time</SelectItem>
          <SelectItem value="est">EST - Eastern Standard Time</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Europe</SelectLabel>
          <SelectItem value="gmt">GMT - Greenwich Mean Time</SelectItem>
          <SelectItem value="cet">CET - Central European Time</SelectItem>
          <SelectItem value="eet">EET - Eastern European Time</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Asia Pacific</SelectLabel>
          <SelectItem value="jst">JST - Japan Standard Time</SelectItem>
          <SelectItem value="cst-china">CST - China Standard Time</SelectItem>
          <SelectItem value="aest">AEST - Australian Eastern Time</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
};
