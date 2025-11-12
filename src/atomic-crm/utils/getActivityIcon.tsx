/**
 * Get the appropriate Lucide icon component for an activity type
 *
 * @param activityType - Activity type string (e.g., "Call", "Email", "Meeting", "Note")
 * @returns Lucide icon component
 *
 * Mapping:
 * - Call → Phone
 * - Email → Mail
 * - Meeting → Calendar
 * - Note → FileText
 * - Default → FileText (for unknown types)
 *
 * Note: Matching is case-insensitive and handles leading/trailing whitespace
 */

import { Phone, Mail, Calendar, FileText, LucideIcon } from "lucide-react";

export function getActivityIcon(activityType: string): LucideIcon {
  // Normalize input: trim whitespace and convert to lowercase
  const normalizedType = activityType.trim().toLowerCase();

  // Map activity types to icons
  const iconMap: Record<string, LucideIcon> = {
    call: Phone,
    email: Mail,
    meeting: Calendar,
    note: FileText,
  };

  // Return mapped icon or default to FileText
  return iconMap[normalizedType] ?? FileText;
}
