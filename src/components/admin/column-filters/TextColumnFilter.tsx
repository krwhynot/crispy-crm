import React, { useState, useEffect, useRef, useCallback } from "react";
import { useListContext } from "react-admin";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Search } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Props for TextColumnFilter component
 */
export interface TextColumnFilterProps {
  /** Field name to filter on (e.g., "name") */
  source: string;
  /** Placeholder text for input */
  placeholder?: string;
  /** Debounce delay in milliseconds (default: 300ms) */
  debounceMs?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Text-based column filter with debounced search
 *
 * Features:
 * - Debounced input (300ms default) to prevent excessive API calls
 * - Clear button (X) to remove filter
 * - Syncs with useListContext for filter state management
 * - Touch target: 48px minimum height
 *
 * @example
 * <TextColumnFilter source="name" placeholder="Search organizations..." />
 */
export function TextColumnFilter({
  source,
  placeholder = "Filter...",
  debounceMs = 300,
  className,
}: TextColumnFilterProps) {
  const { filterValues, setFilters } = useListContext();
  const inputRef = useRef<HTMLInputElement>(null);

  // Local state for immediate input responsiveness
  const [localValue, setLocalValue] = useState<string>("");
  // Track if component has initialized from filterValues
  const [isInitialized, setIsInitialized] = useState(false);
  // Track if user is actively typing to prevent external sync interference
  const isTypingRef = useRef(false);

  // Initialize local state from filterValues on mount
  useEffect(() => {
    if (!isInitialized && filterValues) {
      const currentFilter = filterValues[source];
      if (typeof currentFilter === "string") {
        setLocalValue(currentFilter);
      }
      setIsInitialized(true);
    }
  }, [filterValues, source, isInitialized]);

  // Debounce effect: sync local value to filterValues after delay
  useEffect(() => {
    if (!isInitialized) return;

    const handler = setTimeout(() => {
      // Typing session ended - allow external sync again
      isTypingRef.current = false;

      const currentFilters = filterValues || {};
      const currentFilterValue = currentFilters[source];

      // Only update if value actually changed
      if (localValue !== (currentFilterValue || "")) {
        if (localValue.trim() === "") {
          // Remove filter if empty
          const { [source]: _, ...rest } = currentFilters;
          setFilters(rest);
        } else {
          // Update filter
          setFilters({ ...currentFilters, [source]: localValue.trim() });
        }
      }
    }, debounceMs);

    return () => clearTimeout(handler);
  }, [localValue, debounceMs, source, filterValues, setFilters, isInitialized]);

  // Sync external filter changes (e.g., from FilterChipBar removal)
  // Skip sync while user is actively typing to prevent clearing mid-input
  useEffect(() => {
    if (isTypingRef.current) return;

    if (isInitialized) {
      const externalValue = filterValues?.[source];
      if (typeof externalValue === "string" && externalValue !== localValue) {
        setLocalValue(externalValue);
      } else if (externalValue === undefined && localValue !== "") {
        // Filter was cleared externally
        setLocalValue("");
      }
    }
  }, [filterValues, source, isInitialized]); // Removed localValue - only sync on external changes

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    isTypingRef.current = true; // Mark as typing to prevent external sync
    setLocalValue(e.target.value);
  }, []);

  const handleClear = useCallback(() => {
    setLocalValue("");
    // Immediate clear (no debounce)
    const currentFilters = filterValues || {};
    const { [source]: _, ...rest } = currentFilters;
    setFilters(rest);
    inputRef.current?.focus();
  }, [filterValues, setFilters, source]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        handleClear();
        inputRef.current?.blur();
      }
    },
    [handleClear]
  );

  const hasValue = localValue.length > 0;

  return (
    <div className={cn("relative flex items-center", className)}>
      <Search
        className="absolute left-2.5 h-4 w-4 text-muted-foreground pointer-events-none"
        aria-hidden="true"
      />
      <Input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn(
          "pl-8 pr-8",
          // Ensure touch target
          "min-h-[48px]",
          // Width transitions smoothly
          "transition-[width] duration-200"
        )}
        aria-label={`Filter by ${source}`}
      />
      {hasValue && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleClear}
          className={cn(
            "absolute right-1 h-8 w-8",
            "text-muted-foreground hover:text-foreground",
            "focus-visible:ring-1 focus-visible:ring-ring"
          )}
          aria-label="Clear filter"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
