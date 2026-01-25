interface QuickAddNameFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  onErrorClear: () => void;
  disabled?: boolean;
}

/**
 * Name input field for quick-add opportunity form
 * Handles validation error display and auto-clear on user input
 */
export function QuickAddNameField({
  value,
  onChange,
  error,
  onErrorClear,
  disabled,
}: QuickAddNameFieldProps) {
  return (
    <div className="mb-4">
      <label htmlFor="name" className="block text-sm font-medium mb-1">
        Name <span className="text-destructive">*</span>
      </label>
      <input
        id="name"
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          // Clear error when user starts typing
          if (error) onErrorClear();
        }}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
          error ? "border-destructive" : "border-border"
        }`}
        placeholder="Enter opportunity name"
        disabled={disabled}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? "name-error" : undefined}
        // eslint-disable-next-line jsx-a11y/no-autofocus -- Modal has role="dialog" + aria-modal, autoFocus is appropriate
        autoFocus
      />
      {error && (
        <p id="name-error" role="alert" className="mt-1 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
