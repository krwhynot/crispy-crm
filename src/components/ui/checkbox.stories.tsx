import type { Meta, StoryObj } from '@storybook/react';
import { Checkbox } from './checkbox';
import React, { useState } from 'react';
import { Label } from './label';

const meta = {
  title: 'UI/Checkbox',
  component: Checkbox,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    checked: {
      control: 'boolean',
      description: 'The controlled checked state of the checkbox',
    },
    defaultChecked: {
      control: 'boolean',
      description: 'The default checked state when uncontrolled',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the checkbox is disabled',
    },
    required: {
      control: 'boolean',
      description: 'Whether the checkbox is required',
    },
    name: {
      control: 'text',
      description: 'The name of the checkbox for form submission',
    },
    value: {
      control: 'text',
      description: 'The value of the checkbox for form submission',
    },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic states
export const Default: Story = {
  args: {},
};

export const Checked: Story = {
  args: {
    defaultChecked: true,
  },
};

export const Unchecked: Story = {
  args: {
    defaultChecked: false,
  },
};

export const Indeterminate: Story = {
  render: () => {
    const IndeterminateExample = () => {
      const [checked, setChecked] = useState<boolean | 'indeterminate'>('indeterminate');

      return (
        <div className="flex items-center space-x-2">
          <Checkbox
            id="indeterminate"
            checked={checked}
            onCheckedChange={(value) => {
              if (value === 'indeterminate') return;
              setChecked(value);
            }}
          />
          <Label htmlFor="indeterminate">Indeterminate state</Label>
        </div>
      );
    };
    return <IndeterminateExample />;
  },
};

// Disabled states
export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const DisabledChecked: Story = {
  args: {
    disabled: true,
    defaultChecked: true,
  },
};

export const DisabledUnchecked: Story = {
  args: {
    disabled: true,
    defaultChecked: false,
  },
};

// With labels
export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Checkbox id="terms" />
      <Label htmlFor="terms">Accept terms and conditions</Label>
    </div>
  ),
};

export const WithLabelDescription: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Checkbox id="marketing" />
      <div className="grid gap-1.5 leading-none">
        <Label htmlFor="marketing">Marketing emails</Label>
        <p className="text-sm text-[color:var(--text-subtle)]">
          Receive emails about new products and features.
        </p>
      </div>
    </div>
  ),
};

// Form states
export const Required: Story = {
  render: () => (
    <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
      <div className="flex items-center space-x-2">
        <Checkbox id="required" required />
        <Label htmlFor="required">Required field *</Label>
      </div>
      <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded">
        Submit
      </button>
    </form>
  ),
};

export const Invalid: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Checkbox id="invalid" aria-invalid="true" aria-describedby="invalid-error" />
      <Label htmlFor="invalid" className="text-destructive">
        Invalid selection
      </Label>
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
            <Checkbox
              id="controlled"
              checked={checked}
              onCheckedChange={(value) => {
                if (typeof value === 'boolean') {
                  setChecked(value);
                }
              }}
            />
            <Label htmlFor="controlled">Controlled checkbox</Label>
          </div>
          <p className="text-sm text-[color:var(--text-subtle)]">
            State: {checked ? 'Checked' : 'Unchecked'}
          </p>
        </div>
      );
    };
    return <ControlledExample />;
  },
};

// Multiple checkboxes
export const CheckboxGroup: Story = {
  render: () => {
    const CheckboxGroupExample = () => {
      const [selectedItems, setSelectedItems] = useState<string[]>([]);

      const items = [
        { id: 'option1', label: 'Option 1' },
        { id: 'option2', label: 'Option 2' },
        { id: 'option3', label: 'Option 3' },
        { id: 'option4', label: 'Option 4' },
      ];

      return (
        <div className="space-y-4">
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-center space-x-2">
                <Checkbox
                  id={item.id}
                  checked={selectedItems.includes(item.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedItems([...selectedItems, item.id]);
                    } else {
                      setSelectedItems(selectedItems.filter(id => id !== item.id));
                    }
                  }}
                />
                <Label htmlFor={item.id}>{item.label}</Label>
              </div>
            ))}
          </div>
          <p className="text-sm text-[color:var(--text-subtle)]">
            Selected: {selectedItems.join(', ') || 'None'}
          </p>
        </div>
      );
    };
    return <CheckboxGroupExample />;
  },
};

// Accessibility
export const WithAriaLabel: Story = {
  args: {
    'aria-label': 'Accept terms',
  },
};

export const WithAriaDescribedBy: Story = {
  render: () => (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Checkbox id="described" aria-describedby="description" />
        <Label htmlFor="described">Notifications</Label>
      </div>
      <p id="description" className="text-sm text-[color:var(--text-subtle)]">
        Get notified when someone follows you
      </p>
    </div>
  ),
};

// Focus states (visual testing)
export const Focused: Story = {
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-[color:var(--text-subtle)]">Tab to focus the checkbox</p>
      <Checkbox autoFocus />
    </div>
  ),
};

// Size variations (if needed with custom styles)
export const SmallCheckbox: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Checkbox id="small" className="h-3 w-3" />
      <Label htmlFor="small" className="text-sm">Small checkbox</Label>
    </div>
  ),
};

export const LargeCheckbox: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Checkbox id="large" className="h-6 w-6" />
      <Label htmlFor="large" className="text-lg">Large checkbox</Label>
    </div>
  ),
};