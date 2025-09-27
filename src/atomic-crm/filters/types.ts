/**
 * Type definitions for filter system
 * Provides comprehensive type safety across filter components
 */

/**
 * Possible filter value types
 */
export type SingleFilterValue = string | number | boolean | null | undefined;
export type ArrayFilterValue = string[] | number[];
export type FilterValue = SingleFilterValue | ArrayFilterValue;

/**
 * Filter values object from React Admin
 */
export interface FilterValues {
  [key: string]: FilterValue;
}

/**
 * Individual filter chip data
 */
export interface FilterChipData {
  key: string;
  value: SingleFilterValue;
  label?: string;
}

/**
 * Filter choice option
 */
export interface FilterChoice {
  id: string | number;
  name: string;
}

/**
 * Filter configuration
 */
export interface FilterConfig {
  key: string;
  label: string;
  type: 'select' | 'multiselect' | 'reference' | 'search' | 'toggle';
  choices?: FilterChoice[];
  defaultValue?: FilterValue;
  dynamicChoices?: boolean;
  reference?: string;
}

/**
 * Filter precedence levels for default values
 */
export enum FilterPrecedence {
  URL = 1,
  LOCAL_STORAGE = 2,
  DEFAULT = 3,
}

/**
 * Filter preference storage
 */
export interface FilterPreferences {
  hiddenStages?: string[];
  defaultFilters?: FilterValues;
  lastUsedFilters?: FilterValues;
}

/**
 * Organization data for reference filters
 */
export interface Organization {
  id: string | number;
  name: string;
}

/**
 * Filter formatter function type
 */
export type FilterFormatter = (value: SingleFilterValue) => string;

/**
 * Filter validator function type
 */
export type FilterValidator = (value: FilterValue) => boolean;

/**
 * Filter transform function type
 */
export type FilterTransform = (value: FilterValue) => any;

/**
 * Type guards for filter values
 */
export const isArrayFilterValue = (value: FilterValue): value is ArrayFilterValue => {
  return Array.isArray(value);
};

export const isSingleFilterValue = (value: FilterValue): value is SingleFilterValue => {
  return !Array.isArray(value);
};

export const isValidFilterValue = (value: any): value is FilterValue => {
  if (value === null || value === undefined) return true;

  if (Array.isArray(value)) {
    return value.every(item =>
      typeof item === 'string' ||
      typeof item === 'number'
    );
  }

  return typeof value === 'string' ||
         typeof value === 'number' ||
         typeof value === 'boolean';
};

/**
 * Constants for filter keys
 */
export const FILTER_KEYS = {
  STAGE: 'stage',
  PRIORITY: 'priority',
  CATEGORY: 'category',
  CUSTOMER_ORGANIZATION: 'customer_organization_id',
  ONLY_MINE: 'only_mine',
  SEARCH: 'q',
  DELETED_AT: 'deleted_at',
} as const;

export type FilterKey = typeof FILTER_KEYS[keyof typeof FILTER_KEYS];