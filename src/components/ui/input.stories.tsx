import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './input';
import React from 'react';

const meta = {
  title: 'UI/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'search', 'tel', 'url'],
      description: 'The type of input',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the input is disabled',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
    defaultValue: {
      control: 'text',
      description: 'Default value',
    },
    'aria-invalid': {
      control: 'boolean',
      description: 'Marks the input as invalid',
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default states
export const Default: Story = {
  args: {
    type: 'text',
    placeholder: 'Enter text...',
  },
};

export const WithValue: Story = {
  args: {
    type: 'text',
    defaultValue: 'Hello world',
    placeholder: 'Enter text...',
  },
};

export const Disabled: Story = {
  args: {
    type: 'text',
    placeholder: 'Disabled input',
    disabled: true,
  },
};

export const DisabledWithValue: Story = {
  args: {
    type: 'text',
    defaultValue: 'Cannot edit this',
    disabled: true,
  },
};

export const Invalid: Story = {
  args: {
    type: 'text',
    defaultValue: 'Invalid input',
    'aria-invalid': true,
    'aria-describedby': 'error-message',
  },
};

export const InvalidEmpty: Story = {
  args: {
    type: 'text',
    placeholder: 'Required field',
    'aria-invalid': true,
    'aria-describedby': 'error-message',
  },
};

// Different input types
export const TextInput: Story = {
  args: {
    type: 'text',
    placeholder: 'Enter text...',
  },
};

export const EmailInput: Story = {
  args: {
    type: 'email',
    placeholder: 'user@example.com',
  },
};

export const EmailWithValue: Story = {
  args: {
    type: 'email',
    defaultValue: 'john.doe@example.com',
  },
};

export const PasswordInput: Story = {
  args: {
    type: 'password',
    placeholder: 'Enter password',
  },
};

export const PasswordWithValue: Story = {
  args: {
    type: 'password',
    defaultValue: 'supersecret123',
  },
};

export const NumberInput: Story = {
  args: {
    type: 'number',
    placeholder: '0',
  },
};

export const NumberWithValue: Story = {
  args: {
    type: 'number',
    defaultValue: '42',
    min: 0,
    max: 100,
  },
};

export const SearchInput: Story = {
  args: {
    type: 'search',
    placeholder: 'Search...',
  },
};

export const SearchWithValue: Story = {
  args: {
    type: 'search',
    defaultValue: 'search query',
  },
};

export const TelInput: Story = {
  args: {
    type: 'tel',
    placeholder: '+1 (555) 123-4567',
  },
};

export const UrlInput: Story = {
  args: {
    type: 'url',
    placeholder: 'https://example.com',
  },
};

// Special states
export const Focused: Story = {
  args: {
    type: 'text',
    placeholder: 'This input auto-focuses',
    autoFocus: true,
  },
};

export const ReadOnly: Story = {
  args: {
    type: 'text',
    defaultValue: 'Read-only value',
    readOnly: true,
  },
};

export const Required: Story = {
  args: {
    type: 'text',
    placeholder: 'Required field',
    required: true,
    'aria-required': true,
  },
};

export const WithMinMaxLength: Story = {
  args: {
    type: 'text',
    placeholder: 'Min 3, Max 10 characters',
    minLength: 3,
    maxLength: 10,
  },
};

export const WithPattern: Story = {
  args: {
    type: 'text',
    placeholder: 'Letters only',
    pattern: '[A-Za-z]+',
    title: 'Only letters are allowed',
  },
};

export const WithAutoComplete: Story = {
  args: {
    type: 'email',
    placeholder: 'Email with autocomplete',
    autoComplete: 'email',
  },
};

// File input
export const FileInput: Story = {
  args: {
    type: 'file',
    accept: 'image/*',
  },
};

export const MultipleFileInput: Story = {
  args: {
    type: 'file',
    accept: 'image/*',
    multiple: true,
  },
};

// Long placeholder
export const LongPlaceholder: Story = {
  args: {
    type: 'text',
    placeholder: 'This is a very long placeholder text to test how the input handles overflow',
  },
};

// Full width
export const FullWidth: Story = {
  args: {
    type: 'text',
    placeholder: 'Full width input',
    style: { width: '400px' },
  },
};