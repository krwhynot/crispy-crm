import type { Meta, StoryObj } from '@storybook/react';
import { Combobox, MultiSelectCombobox, type ComboboxOption } from './combobox';
import React from 'react';

const meta = {
  title: 'UI/Combobox',
  component: Combobox,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Autocomplete/combobox component with search and filtering capabilities.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="flex min-h-[400px] w-full items-center justify-center">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Combobox>;

export default meta;
type Story = StoryObj<typeof meta>;

const frameworks: ComboboxOption[] = [
  { value: 'next.js', label: 'Next.js' },
  { value: 'sveltekit', label: 'SvelteKit' },
  { value: 'nuxt.js', label: 'Nuxt.js' },
  { value: 'remix', label: 'Remix' },
  { value: 'astro', label: 'Astro' },
  { value: 'gatsby', label: 'Gatsby' },
  { value: 'vite', label: 'Vite' },
];

const languages: ComboboxOption[] = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'csharp', label: 'C#' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'cpp', label: 'C++' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' },
];

const countries: ComboboxOption[] = [
  { value: 'us', label: 'United States' },
  { value: 'uk', label: 'United Kingdom' },
  { value: 'ca', label: 'Canada' },
  { value: 'au', label: 'Australia' },
  { value: 'de', label: 'Germany' },
  { value: 'fr', label: 'France' },
  { value: 'jp', label: 'Japan' },
  { value: 'cn', label: 'China' },
  { value: 'in', label: 'India' },
  { value: 'br', label: 'Brazil' },
];

// Default combobox
const DefaultComboboxComponent = () => {
  const [value, setValue] = React.useState('');

  return (
    <div>
      <Combobox
        options={frameworks}
        value={value}
        onValueChange={setValue}
        placeholder="Select framework..."
      />
      <p className="mt-4 text-sm text-[color:var(--text-subtle)]">Selected: {value || 'None'}</p>
    </div>
  );
};

export const Default: Story = {
  render: () => <DefaultComboboxComponent />,
};

// With initial value
const WithInitialValueComponent = () => {
  const [value, setValue] = React.useState('next.js');

  return (
    <Combobox
      options={frameworks}
      value={value}
      onValueChange={setValue}
      placeholder="Select framework..."
    />
  );
};

export const WithInitialValue: Story = {
  render: () => <WithInitialValueComponent />,
};

// Custom placeholders
const CustomPlaceholdersComponent = () => {
  const [value, setValue] = React.useState('');

  return (
    <Combobox
      options={languages}
      value={value}
      onValueChange={setValue}
      placeholder="Choose your language..."
      searchPlaceholder="Type to filter..."
      emptyText="No language matches your search."
    />
  );
};

export const CustomPlaceholders: Story = {
  render: () => <CustomPlaceholdersComponent />,
};

// Disabled state
const DisabledComponent = () => {
  const [value, setValue] = React.useState('typescript');

  return (
    <Combobox
      options={languages}
      value={value}
      onValueChange={setValue}
      placeholder="Select language..."
      disabled
    />
  );
};

export const Disabled: Story = {
  render: () => <DisabledComponent />,
};

// Long list (scrollable)
const LongListComponent = () => {
  const [value, setValue] = React.useState('');

  const manyOptions: ComboboxOption[] = Array.from({ length: 50 }, (_, i) => ({
    value: `option-${i}`,
    label: `Option ${i + 1}`,
  }));

  return (
    <Combobox
      options={manyOptions}
      value={value}
      onValueChange={setValue}
      placeholder="Select from many options..."
      searchPlaceholder="Search options..."
    />
  );
};

export const LongList: Story = {
  render: () => <LongListComponent />,
};

// Multi-select combobox
const MultiSelectComponent = () => {
  const [values, setValues] = React.useState<string[]>([]);

  return (
    <div>
      <MultiSelectCombobox
        options={languages}
        value={values}
        onValueChange={setValues}
        placeholder="Select languages..."
      />
      <p className="mt-4 text-sm text-[color:var(--text-subtle)]">
        Selected: {values.length > 0 ? values.join(', ') : 'None'}
      </p>
    </div>
  );
};

export const MultiSelect: Story = {
  render: () => <MultiSelectComponent />,
};

// Multi-select with initial values
const MultiSelectWithInitialValuesComponent = () => {
  const [values, setValues] = React.useState<string[]>(['javascript', 'typescript', 'python']);

  return (
    <div>
      <MultiSelectCombobox
        options={languages}
        value={values}
        onValueChange={setValues}
        placeholder="Select languages..."
      />
      <div className="mt-4 space-y-1">
        {values.map((val) => (
          <p key={val} className="text-sm">
            • {languages.find((l) => l.value === val)?.label}
          </p>
        ))}
      </div>
    </div>
  );
};

export const MultiSelectWithInitialValues: Story = {
  render: () => <MultiSelectWithInitialValuesComponent />,
};

// Interactive search demo
const InteractiveSearchComponent = () => {
  const [value, setValue] = React.useState('');
  const [searchCount, setSearchCount] = React.useState(0);

  return (
    <div>
      <p className="mb-4 text-sm text-[color:var(--text-subtle)]">
        Search count: {searchCount} | Selected: {value || 'None'}
      </p>
      <Combobox
        options={countries}
        value={value}
        onValueChange={(val) => {
          setValue(val);
          setSearchCount((count) => count + 1);
        }}
        placeholder="Select country..."
        searchPlaceholder="Type country name..."
        emptyText="Country not found."
      />
    </div>
  );
};

export const InteractiveSearch: Story = {
  render: () => <InteractiveSearchComponent />,
};

// Keyboard navigation demo
const KeyboardNavigationComponent = () => {
  const [value, setValue] = React.useState('');
  const [history, setHistory] = React.useState<string[]>([]);

  const handleChange = (newValue: string) => {
    setValue(newValue);
    if (newValue) {
      setHistory((prev) => [...prev, newValue]);
    }
  };

  return (
    <div>
      <p className="mb-4 text-sm text-[color:var(--text-subtle)]">
        Use Tab to focus, Space/Enter to open, arrows to navigate, Enter to select
      </p>
      <Combobox
        options={frameworks}
        value={value}
        onValueChange={handleChange}
        placeholder="Test keyboard navigation..."
      />
      {history.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium">Selection History:</p>
          <ul className="mt-2 space-y-1">
            {history.map((item, index) => (
              <li key={index} className="text-sm text-[color:var(--text-subtle)]">
                {index + 1}. {frameworks.find((f) => f.value === item)?.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export const KeyboardNavigation: Story = {
  render: () => <KeyboardNavigationComponent />,
};

// Different widths
const CustomWidthsComponent = () => {
  const [value1, setValue1] = React.useState('');
  const [value2, setValue2] = React.useState('');
  const [value3, setValue3] = React.useState('');

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-sm font-medium">Small (150px)</p>
        <Combobox
          options={frameworks}
          value={value1}
          onValueChange={setValue1}
          className="w-[150px]"
          placeholder="Small..."
        />
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">Medium (250px)</p>
        <Combobox
          options={frameworks}
          value={value2}
          onValueChange={setValue2}
          className="w-[250px]"
          placeholder="Medium width..."
        />
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">Large (350px)</p>
        <Combobox
          options={frameworks}
          value={value3}
          onValueChange={setValue3}
          className="w-[350px]"
          placeholder="Large width combobox..."
        />
      </div>
    </div>
  );
};

export const CustomWidths: Story = {
  render: () => <CustomWidthsComponent />,
};

// Form integration example
const FormIntegrationComponent = () => {
  const [framework, setFramework] = React.useState('');
  const [language, setLanguage] = React.useState('');
  const [country, setCountry] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(
      `Submitted:\nFramework: ${framework}\nLanguage: ${language}\nCountry: ${country}`
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <div className="text-sm font-medium mb-1">Framework</div>
        <Combobox
          options={frameworks}
          value={framework}
          onValueChange={setFramework}
          placeholder="Select framework..."
          className="w-full"
        />
      </div>
      <div>
        <div className="text-sm font-medium mb-1">Language</div>
        <Combobox
          options={languages}
          value={language}
          onValueChange={setLanguage}
          placeholder="Select language..."
          className="w-full"
        />
      </div>
      <div>
        <div className="text-sm font-medium mb-1">Country</div>
        <Combobox
          options={countries}
          value={country}
          onValueChange={setCountry}
          placeholder="Select country..."
          className="w-full"
        />
      </div>
      <button
          type="submit"
          className="rounded bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
        >
          Submit
        </button>
      </form>
    );
  },
};