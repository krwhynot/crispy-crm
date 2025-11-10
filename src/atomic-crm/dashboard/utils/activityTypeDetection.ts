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
 * - "call" or "phone" → Call
 * - "email" or "e-mail" → Email
 * - "meeting", "demo", "presentation", "appointment" → Meeting
 * - Default → Note
 *
 * @param taskTitle - The task title to analyze
 * @returns The inferred activity type
 *
 * @example
 * inferActivityTypeFromTaskTitle("Call about pricing") // "Call"
 * inferActivityTypeFromTaskTitle("Send email proposal") // "Email"
 * inferActivityTypeFromTaskTitle("Follow up on contract") // "Note"
 */
export function inferActivityTypeFromTaskTitle(taskTitle: string): InteractionType {
  const title = taskTitle.toLowerCase().trim();

  // Use word boundaries to avoid matching partial words
  // \b ensures we match whole words only
  if (/\b(call|phone)\b/.test(title)) {
    return 'Call';
  }

  if (/\b(email|e-mail)\b/.test(title)) {
    return 'Email';
  }

  if (/\b(meeting|demo|presentation|appointment)\b/.test(title)) {
    return 'Meeting';
  }

  // Default fallback
  return 'Note';
}
