import type { Meta, StoryObj } from '@storybook/react';
import { Switch } from './switch';
import React, { useState } from 'react';
import { Label } from './label';

const meta = {
  title: 'UI/Switch',
  component: Switch,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    checked: {
      control: 'boolean',
      description: 'The controlled checked state of the switch',
    },
    defaultChecked: {
      control: 'boolean',
      description: 'The default checked state when uncontrolled',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the switch is disabled',
    },
    required: {
      control: 'boolean',
      description: 'Whether the switch is required',
    },
    name: {
      control: 'text',
      description: 'The name of the switch for form submission',
    },
    value: {
      control: 'text',
      description: 'The value of the switch for form submission',
    },
  },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic states
export const Default: Story = {
  args: {},
};

export const On: Story = {
  args: {
    defaultChecked: true,
  },
};

export const Off: Story = {
  args: {
    defaultChecked: false,
  },
};

// Disabled states
export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const DisabledOn: Story = {
  args: {
    disabled: true,
    defaultChecked: true,
  },
};

export const DisabledOff: Story = {
  args: {
    disabled: true,
    defaultChecked: false,
  },
};

// With labels
export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Switch id="airplane-mode" />
      <Label htmlFor="airplane-mode">Airplane Mode</Label>
    </div>
  ),
};

export const WithLabelLeft: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Label htmlFor="notifications">Notifications</Label>
      <Switch id="notifications" />
    </div>
  ),
};

export const WithLabelDescription: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Switch id="marketing" />
      <div className="grid gap-1.5 leading-none">
        <Label htmlFor="marketing">Marketing emails</Label>
        <p className="text-sm text-muted-foreground">
          Receive emails about new products and features.
        </p>
      </div>
    </div>
  ),
};

// Controlled component
export const Controlled: Story = {
  render: () => {
    const ControlledExample = () => {
      const [checked, setChecked] = useState(false);

      return (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="controlled"
              checked={checked}
              onCheckedChange={setChecked}
            />
            <Label htmlFor="controlled">Controlled switch</Label>
          </div>
          <p className="text-sm text-muted-foreground">
            State: {checked ? 'On' : 'Off'}
          </p>
        </div>
      );
    };
    return <ControlledExample />;
  },
};

// Form integration
export const InForm: Story = {
  render: () => (
    <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
      <div className="flex items-center space-x-2">
        <Switch id="form-switch" name="notifications" />
        <Label htmlFor="form-switch">Enable notifications</Label>
      </div>
      <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded">
        Save preferences
      </button>
    </form>
  ),
};

// Settings panel example
export const SettingsPanel: Story = {
  render: () => {
    const SettingsPanelExample = () => {
      const [settings, setSettings] = useState({
        notifications: true,
        darkMode: false,
        autoSave: true,
        analytics: false,
        betaFeatures: false,
      });

      return (
        <div className="w-full max-w-sm space-y-4">
          <h3 className="text-lg font-medium">Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="notifications">Notifications</Label>
              <Switch
                id="notifications"
                checked={settings.notifications}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, notifications: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="dark-mode">Dark Mode</Label>
              <Switch
                id="dark-mode"
                checked={settings.darkMode}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, darkMode: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-save">Auto Save</Label>
              <Switch
                id="auto-save"
                checked={settings.autoSave}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, autoSave: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="analytics">Analytics</Label>
              <Switch
                id="analytics"
                checked={settings.analytics}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, analytics: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="beta">Beta Features</Label>
              <Switch
                id="beta"
                checked={settings.betaFeatures}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, betaFeatures: checked })
                }
              />
            </div>
          </div>
        </div>
      );
    };
    return <SettingsPanelExample />;
  },
};

// Accessibility
export const WithAriaLabel: Story = {
  args: {
    'aria-label': 'Toggle dark mode',
  },
};

export const WithAriaDescribedBy: Story = {
  render: () => (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Switch id="described" aria-describedby="description" />
        <Label htmlFor="described">Auto-save</Label>
      </div>
      <p id="description" className="text-sm text-muted-foreground">
        Automatically save your work every 5 minutes
      </p>
    </div>
  ),
};

// Required field
export const Required: Story = {
  render: () => (
    <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
      <div className="flex items-center space-x-2">
        <Switch id="required" required />
        <Label htmlFor="required">Accept terms *</Label>
      </div>
      <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded">
        Continue
      </button>
    </form>
  ),
};

// Invalid state
export const Invalid: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Switch id="invalid" aria-invalid="true" aria-describedby="invalid-error" />
      <Label htmlFor="invalid" className="text-destructive">
        Invalid selection
      </Label>
    </div>
  ),
};

// Focus state (visual testing)
export const Focused: Story = {
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Tab to focus the switch</p>
      <Switch autoFocus />
    </div>
  ),
};

// Size variations (custom styling)
export const SmallSwitch: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Switch id="small" className="h-4 w-7 [&>span]:h-3 [&>span]:w-3" />
      <Label htmlFor="small" className="text-sm">Small switch</Label>
    </div>
  ),
};

export const LargeSwitch: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Switch id="large" className="h-7 w-12 [&>span]:h-6 [&>span]:w-6" />
      <Label htmlFor="large" className="text-lg">Large switch</Label>
    </div>
  ),
};