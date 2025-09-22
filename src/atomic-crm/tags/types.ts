import type { TagColorName } from '@/lib/color-types';

/**
 * Represents a tag in the system
 */
export interface Tag {
  id: string;
  name: string;
  color: TagColorName | string; // Allow string during migration period
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

/**
 * Tag creation payload
 */
export interface CreateTagInput {
  name: string;
  color: TagColorName;
}

/**
 * Tag update payload
 */
export interface UpdateTagInput {
  id: string;
  name?: string;
  color?: TagColorName;
}

/**
 * Tag with usage count
 */
export interface TagWithCount extends Tag {
  count: number;
}

/**
 * Tag selection state
 */
export interface TagSelection {
  tagId: string;
  selected: boolean;
}

/**
 * Tag filter options
 */
export interface TagFilterOptions {
  colors?: TagColorName[];
  searchTerm?: string;
}