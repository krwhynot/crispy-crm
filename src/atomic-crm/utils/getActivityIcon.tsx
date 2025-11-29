/**
 * Get the appropriate Lucide icon component for an activity type
 *
 * @param activityType - Activity type string (one of 13 interaction types)
 * @returns Lucide icon component
 *
 * Mapping (13 activity types from validation/activities.ts):
 * - call → Phone
 * - email → Mail
 * - meeting → Users
 * - demo → Presentation
 * - proposal → FileCheck
 * - follow_up → RefreshCw
 * - trade_show → Store
 * - site_visit → MapPin
 * - contract_review → FileSignature
 * - check_in → MessageCircle
 * - social → Share2
 * - note → FileText
 * - sample → Package (added for sample visits)
 * - Default → FileText (for unknown types)
 *
 * Note: Matching is case-insensitive and handles leading/trailing whitespace
 */

import {
  Phone,
  Mail,
  Users,
  Presentation,
  FileCheck,
  RefreshCw,
  Store,
  MapPin,
  FileSignature,
  MessageCircle,
  Share2,
  FileText,
  Package,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function getActivityIcon(activityType: string): LucideIcon {
  // Normalize input: trim whitespace and convert to lowercase
  const normalizedType = activityType.trim().toLowerCase();

  // Map all 13 activity types to icons
  const iconMap: Record<string, LucideIcon> = {
    call: Phone,
    email: Mail,
    meeting: Users,
    demo: Presentation,
    proposal: FileCheck,
    follow_up: RefreshCw,
    trade_show: Store,
    site_visit: MapPin,
    contract_review: FileSignature,
    check_in: MessageCircle,
    social: Share2,
    note: FileText,
    sample: Package,
  };

  // Return mapped icon or default to FileText
  return iconMap[normalizedType] ?? FileText;
}
