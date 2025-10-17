import type { Meta, StoryObj } from '@storybook/react';
import { RadioGroup, RadioGroupItem } from './radio-group';
import React, { useState } from 'react';
import { Label } from './label';

const meta = {
  title: 'UI/RadioGroup',
  component: RadioGroup,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    defaultValue: {
      control: 'text',
      description: 'The default selected value',
    },
    value: {
      control: 'text',
      description: 'The controlled selected value',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the radio group is disabled',
    },
    required: {
      control: 'boolean',
      description: 'Whether the radio group is required',
    },
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
      description: 'The orientation of the radio group',
    },
  },
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic radio group
export const Default: Story = {
  render: () => (
    <RadioGroup defaultValue="comfortable">
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="default" id="r1" />
        <Label htmlFor="r1">Default</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="comfortable" id="r2" />
        <Label htmlFor="r2">Comfortable</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="compact" id="r3" />
        <Label htmlFor="r3">Compact</Label>
      </div>
    </RadioGroup>
  ),
};

// With descriptions
export const WithDescriptions: Story = {
  render: () => (
    <RadioGroup defaultValue="card">
      <div className="flex items-start space-x-2">
        <RadioGroupItem value="card" id="card" className="mt-1" />
        <div className="grid gap-1.5 leading-none">
          <Label htmlFor="card">Card Payment</Label>
          <p className="text-sm text-[color:var(--text-subtle)]">
            Pay with credit or debit card
          </p>
        </div>
      </div>
      <div className="flex items-start space-x-2">
        <RadioGroupItem value="paypal" id="paypal" className="mt-1" />
        <div className="grid gap-1.5 leading-none">
          <Label htmlFor="paypal">PayPal</Label>
          <p className="text-sm text-[color:var(--text-subtle)]">
            Pay with your PayPal account
          </p>
        </div>
      </div>
      <div className="flex items-start space-x-2">
        <RadioGroupItem value="apple" id="apple" className="mt-1" />
        <div className="grid gap-1.5 leading-none">
          <Label htmlFor="apple">Apple Pay</Label>
          <p className="text-sm text-[color:var(--text-subtle)]">
            Pay with Apple Pay
          </p>
        </div>
      </div>
    </RadioGroup>
  ),
};

// Disabled state
export const Disabled: Story = {
  render: () => (
    <RadioGroup disabled defaultValue="option2">
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option1" id="option1" />
        <Label htmlFor="option1">Option 1</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option2" id="option2" />
        <Label htmlFor="option2">Option 2 (selected)</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option3" id="option3" />
        <Label htmlFor="option3">Option 3</Label>
      </div>
    </RadioGroup>
  ),
};

// Individual disabled items
export const WithDisabledItems: Story = {
  render: () => (
    <RadioGroup defaultValue="free">
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="free" id="free" />
        <Label htmlFor="free">Free Plan</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="pro" id="pro" />
        <Label htmlFor="pro">Pro Plan - $9/month</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="enterprise" id="enterprise" disabled />
        <Label htmlFor="enterprise" className="opacity-50">
          Enterprise (Contact Sales)
        </Label>
      </div>
    </RadioGroup>
  ),
};

// Controlled component
export const Controlled: Story = {
  render: () => {
    const ControlledExample = () => {
      const [value, setValue] = useState('option1');

      return (
        <div className="space-y-4">
          <RadioGroup value={value} onValueChange={setValue}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="option1" id="opt1" />
              <Label htmlFor="opt1">Option 1</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="option2" id="opt2" />
              <Label htmlFor="opt2">Option 2</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="option3" id="opt3" />
              <Label htmlFor="opt3">Option 3</Label>
            </div>
          </RadioGroup>
          <p className="text-sm text-[color:var(--text-subtle)]">
            Selected: {value}
          </p>
        </div>
      );
    };
    return <ControlledExample />;
  },
};

// Horizontal layout
export const Horizontal: Story = {
  render: () => (
    <RadioGroup defaultValue="small" className="flex flex-row gap-4">
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="small" id="small" />
        <Label htmlFor="small">Small</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="medium" id="medium" />
        <Label htmlFor="medium">Medium</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="large" id="large" />
        <Label htmlFor="large">Large</Label>
      </div>
    </RadioGroup>
  ),
};

// Form integration
export const InForm: Story = {
  render: () => (
    <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
      <div className="space-y-2">
        <Label>Shipping Method</Label>
        <RadioGroup defaultValue="standard" name="shipping">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="standard" id="standard" />
            <Label htmlFor="standard">Standard (5-7 days)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="express" id="express" />
            <Label htmlFor="express">Express (2-3 days)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="overnight" id="overnight" />
            <Label htmlFor="overnight">Overnight</Label>
          </div>
        </RadioGroup>
      </div>
      <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded">
        Continue
      </button>
    </form>
  ),
};

// Survey/Rating example
export const SurveyRating: Story = {
  render: () => (
    <div className="space-y-4">
      <Label>How satisfied are you with our service?</Label>
      <RadioGroup defaultValue="satisfied">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="very-satisfied" id="vs" />
          <Label htmlFor="vs">Very Satisfied</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="satisfied" id="s" />
          <Label htmlFor="s">Satisfied</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="neutral" id="n" />
          <Label htmlFor="n">Neutral</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="dissatisfied" id="d" />
          <Label htmlFor="d">Dissatisfied</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="very-dissatisfied" id="vd" />
          <Label htmlFor="vd">Very Dissatisfied</Label>
        </div>
      </RadioGroup>
    </div>
  ),
};

// Required field
export const Required: Story = {
  render: () => (
    <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
      <div className="space-y-2">
        <Label>Choose an option *</Label>
        <RadioGroup required>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yes" id="yes" />
            <Label htmlFor="yes">Yes</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no" id="no" />
            <Label htmlFor="no">No</Label>
          </div>
        </RadioGroup>
      </div>
      <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded">
        Submit
      </button>
    </form>
  ),
};

// Invalid state
export const Invalid: Story = {
  render: () => (
    <div className="space-y-2">
      <Label className="text-destructive">Select a valid option</Label>
      <RadioGroup aria-invalid="true" aria-describedby="error-message">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="option1" id="inv1" />
          <Label htmlFor="inv1">Option 1</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="option2" id="inv2" />
          <Label htmlFor="inv2">Option 2</Label>
        </div>
      </RadioGroup>
      <p id="error-message" className="text-sm text-destructive">
        Please select one of the options above
      </p>
    </div>
  ),
};

// Accessibility features
export const WithAriaDescribedBy: Story = {
  render: () => (
    <div className="space-y-2">
      <Label>Notification Preference</Label>
      <RadioGroup defaultValue="email" aria-describedby="notification-help">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="email" id="email-pref" />
          <Label htmlFor="email-pref">Email</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="sms" id="sms-pref" />
          <Label htmlFor="sms-pref">SMS</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="push" id="push-pref" />
          <Label htmlFor="push-pref">Push Notifications</Label>
        </div>
      </RadioGroup>
      <p id="notification-help" className="text-sm text-[color:var(--text-subtle)]">
        Choose how you'd like to receive updates
      </p>
    </div>
  ),
};

// Focus state (visual testing)
export const Focused: Story = {
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-[color:var(--text-subtle)]">Tab to focus the radio group</p>
      <RadioGroup defaultValue="focused">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="focused" id="f1" autoFocus />
          <Label htmlFor="f1">Focused item</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="not-focused" id="f2" />
          <Label htmlFor="f2">Not focused</Label>
        </div>
      </RadioGroup>
    </div>
  ),
};

// Complex layout with icons
export const WithIcons: Story = {
  render: () => (
    <RadioGroup defaultValue="private" className="grid gap-4">
      <div className="flex items-start space-x-2">
        <RadioGroupItem value="public" id="public" className="mt-1" />
        <div className="grid gap-1.5 leading-none">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <Label htmlFor="public">Public</Label>
          </div>
          <p className="text-sm text-[color:var(--text-subtle)]">
            Anyone on the internet can see this
          </p>
        </div>
      </div>
      <div className="flex items-start space-x-2">
        <RadioGroupItem value="private" id="private" className="mt-1" />
        <div className="grid gap-1.5 leading-none">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <Label htmlFor="private">Private</Label>
          </div>
          <p className="text-sm text-[color:var(--text-subtle)]">
            Only you can see this
          </p>
        </div>
      </div>
    </RadioGroup>
  ),
};