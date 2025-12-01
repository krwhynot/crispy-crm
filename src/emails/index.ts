/**
 * Email Templates Module
 *
 * Exports all email template generators and types for the CRM.
 *
 * @example
 * ```ts
 * import {
 *   generateDailyDigestEmail,
 *   type DailyDigestData,
 *   createSampleDigestData,
 * } from "@/emails";
 *
 * // Generate email HTML
 * const html = generateDailyDigestEmail(data);
 *
 * // Preview with sample data
 * const previewHtml = generateDailyDigestEmail(createSampleDigestData());
 * ```
 */

// Daily Digest Email
export {
  generateDailyDigestEmail,
  getTimeOfDay,
  formatDigestDate,
  daysBetween,
  isAtRisk,
  getStageStyle,
  createSampleDigestData,
} from "./daily-digest.generator";

export type { DailyDigestData, OverdueTask, AtRiskDeal, TodayTask } from "./daily-digest.types";

export { STAGE_COLORS, STALE_THRESHOLDS, MFB_EMAIL_COLORS, ROW_COLORS } from "./daily-digest.types";
