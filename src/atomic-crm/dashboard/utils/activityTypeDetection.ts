/**
 * Activity Type Auto-Detection Utility
 *
 * Feature: Dashboard Quick Actions
 * Design: docs/plans/2025-11-10-dashboard-quick-actions-design.md
 *
 * Infers activity type from task title keywords to pre-populate
 * the activity type dropdown in the quick actions modal.
 */

import type { InteractionType } from '@/atomic-crm/validation/activities';

/**
 * Infers activity type from task title by detecting keywords
 *
 * Detection rules (first match wins):
 * - "call" or "phone" → call
 * - "email" or "e-mail" → email
 * - "meeting", "demo", "presentation", "appointment" → meeting
 * - Default → check_in
 *
 * @param taskTitle - The task title to analyze
 * @returns The inferred activity type
 *
 * @example
 * inferActivityTypeFromTaskTitle("Call about pricing") // "call"
 * inferActivityTypeFromTaskTitle("Send email proposal") // "email"
 * inferActivityTypeFromTaskTitle("Follow up on contract") // "check_in"
 */
export function inferActivityTypeFromTaskTitle(taskTitle: string): string {
  const title = taskTitle.toLowerCase().trim();

  // Use word boundaries to avoid matching partial words
  // \b ensures we match whole words only
  if (/\b(call|phone)\b/.test(title)) {
    return 'call';
  }

  if (/\b(email|e-mail)\b/.test(title)) {
    return 'email';
  }

  if (/\b(meeting|demo|presentation|appointment)\b/.test(title)) {
    return 'meeting';
  }

  // Default fallback
  return 'check_in';
}
