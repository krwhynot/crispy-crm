/**
 * Draft Persistence Utilities
 *
 * Manages localStorage-based draft persistence for activity forms.
 * Drafts auto-expire after 24 hours to avoid stale data.
 *
 * Usage:
 * ```typescript
 * import { loadDraft, saveDraft, clearDraft } from './utils/activityDraftStorage';
 *
 * const draft = loadDraft('my-draft-key');
 * saveDraft('my-draft-key', formData);
 * clearDraft('my-draft-key');
 * ```
 */

import { safeJsonParse } from "@/atomic-crm/utils/safeJsonParse";
import {
  activityDraftSchema,
  type ActivityDraft,
} from "@/atomic-crm/activities/activityDraftSchema";
import type { ActivityLogInput } from "@/atomic-crm/validation/activities";

// ═══════════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════════

/** Default localStorage key for draft persistence */
export const DEFAULT_DRAFT_STORAGE_KEY = "quick-log-activity-draft";

/** Debounce delay for saving drafts to avoid excessive writes */
export const DRAFT_SAVE_DEBOUNCE_MS = 500;

/** Draft expiration time (24 hours in milliseconds) */
export const DRAFT_EXPIRY_MS = 24 * 60 * 60 * 1000;

// ═══════════════════════════════════════════════════════════════════════════════
// Draft Persistence Functions
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Load a draft from localStorage
 *
 * @param storageKey - localStorage key to load from
 * @returns Parsed form data or null if not found/expired/invalid
 *
 * @example
 * ```typescript
 * const draft = loadDraft('quick-log-activity-draft');
 * if (draft) {
 *   setFormData(draft);
 * }
 * ```
 */
export function loadDraft(storageKey: string): Partial<ActivityLogInput> | null {
  if (typeof window === "undefined") return null;

  const stored = localStorage.getItem(storageKey);
  if (!stored) return null;

  const draft = safeJsonParse(stored, activityDraftSchema);
  if (!draft) {
    localStorage.removeItem(storageKey);
    return null;
  }

  // Check if draft has expired
  if (Date.now() - draft.savedAt > DRAFT_EXPIRY_MS) {
    localStorage.removeItem(storageKey);
    return null;
  }

  return draft.formData;
}

/**
 * Save a draft to localStorage
 *
 * Empty drafts (no notes, no entities) are automatically removed.
 * This should typically be debounced by the caller.
 *
 * @param storageKey - localStorage key to save to
 * @param formData - Partial form data to persist
 *
 * @example
 * ```typescript
 * // With debouncing
 * const debouncedSave = useMemo(
 *   () => debounce((data) => saveDraft('my-key', data), 500),
 *   []
 * );
 *
 * // In onChange handler
 * debouncedSave(formData);
 * ```
 */
export function saveDraft(storageKey: string, formData: Partial<ActivityLogInput>): void {
  if (typeof window === "undefined") return;

  // Don't save empty drafts
  const hasContent =
    formData.notes || formData.contactId || formData.organizationId || formData.opportunityId;

  if (!hasContent) {
    localStorage.removeItem(storageKey);
    return;
  }

  const draft: ActivityDraft = {
    formData,
    savedAt: Date.now(),
  };

  localStorage.setItem(storageKey, JSON.stringify(draft));
}

/**
 * Clear a draft from localStorage
 *
 * @param storageKey - localStorage key to clear
 *
 * @example
 * ```typescript
 * // After successful form submission
 * clearDraft('quick-log-activity-draft');
 * ```
 */
export function clearDraft(storageKey: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(storageKey);
}

/**
 * Generate a unique draft storage key based on context
 *
 * Useful when multiple dialogs could be open in different contexts
 * (e.g., dashboard vs specific entity slide-over)
 *
 * @param baseKey - Base key prefix
 * @param contextId - Optional context identifier (e.g., entityId)
 * @returns Unique storage key
 *
 * @example
 * ```typescript
 * // Dashboard context
 * const key1 = generateDraftKey('activity-draft'); // "activity-draft"
 *
 * // Contact slide-over context
 * const key2 = generateDraftKey('activity-draft', 'contact-123'); // "activity-draft-contact-123"
 * ```
 */
export function generateDraftKey(baseKey: string, contextId?: string): string {
  return contextId ? `${baseKey}-${contextId}` : baseKey;
}
