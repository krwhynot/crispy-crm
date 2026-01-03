import type { LucideIcon } from "lucide-react";
import type { RaRecord } from "ra-core";

/**
 * A single swipe action button configuration
 */
export interface SwipeAction {
  /** Unique identifier for the action */
  id: string;
  /** Label for accessibility (aria-label) */
  label: string;
  /** Lucide icon component */
  icon: LucideIcon;
}

/**
 * Configuration for swipe actions on a list resource
 * @template T - The record type (e.g., Contact, Organization)
 */
export interface SwipeActionsConfig<T extends RaRecord = RaRecord> {
  /**
   * Dynamic actions per record.
   * Allows hiding actions based on record state (e.g., hide "Call" if no phone).
   */
  getActions: (record: T) => SwipeAction[];

  /**
   * Handler called when an action button is tapped.
   * @param actionId - The id of the tapped action
   * @param record - The full record data
   */
  onAction: (actionId: string, record: T) => void;
}

/**
 * Position data for a table row in the overlay
 */
export interface RowPosition {
  /** Top offset from overlay container */
  top: number;
  /** Row height in pixels */
  height: number;
}

/**
 * Props for the SwipeActionRow component
 */
export interface SwipeActionRowProps {
  /** Record ID for this row */
  recordId: number | string;
  /** Top position from useRowPositions */
  top: number;
  /** Row height (typically 52px) */
  height: number;
  /** Actions to display for this row */
  actions: SwipeAction[];
  /** Callback when an action button is clicked */
  onActionClick: (actionId: string) => void;
}

/**
 * Props for the SwipeActionButton component
 */
export interface SwipeActionButtonProps {
  /** Lucide icon component */
  icon: LucideIcon;
  /** Accessible label */
  label: string;
  /** Click handler */
  onClick: () => void;
  /** Visual variant */
  variant?: "default" | "primary" | "muted";
}

/**
 * Context value for SwipeActionsProvider
 */
export interface SwipeActionsContextValue {
  /** Currently open row ID, or null if none */
  openRowId: number | string | null;
  /** Whether a gesture is currently in progress */
  isGestureActive: boolean;
  /** Open actions for a specific row */
  openRow: (id: number | string) => void;
  /** Close any open row */
  closeRow: () => void;
  /** Set gesture active state (prevents row click during swipe) */
  setGestureActive: (active: boolean) => void;
}
