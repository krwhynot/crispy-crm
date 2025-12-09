/**
 * Digest Service - Query logic for overdue tasks and stale deals
 *
 * Provides TypeScript service layer for digest queries using per-stage
 * stale thresholds as defined in PRD Section 6.3.
 *
 * Features:
 *   - getOverdueTasksForUser: Tasks past due date, not completed
 *   - getStaleDealsForUser: Opportunities exceeding per-stage thresholds
 *   - getUserDigestSummary: Combined summary with counts and details
 *
 * @module services/digest
 */

import { z } from "zod";
import type { ExtendedDataProvider } from "../providers/supabase/extensions/types";
import { STAGE_STALE_THRESHOLDS, type ActivePipelineStage } from "../utils/stalenessCalculation";

// =====================================================
// Zod Schemas for Type Safety and Validation
// =====================================================

/**
 * Schema for overdue task records returned from database
 */
export const OverdueTaskSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  due_date: z.string(), // ISO date string
  days_overdue: z.number().int().min(1),
  priority: z.enum(["low", "medium", "high", "critical"]).nullable(),
  type: z.enum(["Call", "Email", "Meeting", "Follow-up", "Demo", "Proposal", "Other"]).nullable(),
  contact_id: z.number().nullable(),
  contact_name: z.string().nullable(),
  opportunity_id: z.number().nullable(),
  opportunity_name: z.string().nullable(),
  organization_id: z.number().nullable(),
  organization_name: z.string().nullable(),
});

export type OverdueTask = z.infer<typeof OverdueTaskSchema>;

/**
 * Schema for tasks due today records returned from database
 */
export const TodayTaskSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  priority: z.enum(["low", "medium", "high", "critical"]).nullable(),
  type: z.enum(["Call", "Email", "Meeting", "Follow-up", "Demo", "Proposal", "Other"]).nullable(),
  contact_id: z.number().nullable(),
  contact_name: z.string().nullable(),
  opportunity_id: z.number().nullable(),
  opportunity_name: z.string().nullable(),
  organization_id: z.number().nullable(),
  organization_name: z.string().nullable(),
});

export type TodayTask = z.infer<typeof TodayTaskSchema>;

/**
 * Schema for stale deal records with per-stage threshold info
 */
export const StaleDealSchema = z.object({
  id: z.number(),
  name: z.string(),
  stage: z.string(),
  stage_threshold_days: z.number().int().positive(),
  days_since_activity: z.number().int().min(0),
  days_over_threshold: z.number().int(),
  last_activity_date: z.string().nullable(), // ISO timestamp
  customer_name: z.string().nullable(),
  principal_name: z.string().nullable(),
  priority: z.enum(["low", "medium", "high", "critical"]).nullable(),
  estimated_close_date: z.string().nullable(), // ISO date string
});

export type StaleDeal = z.infer<typeof StaleDealSchema>;

/**
 * Schema for complete user digest summary
 */
export const UserDigestSummarySchema = z.object({
  sales_id: z.number(),
  user_id: z.string().uuid(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  email: z.string().email().nullable(),
  tasks_due_today: z.number().int().min(0),
  tasks_overdue: z.number().int().min(0),
  stale_deals: z.number().int().min(0),
  opportunities_updated_24h: z.number().int().min(0),
  activities_logged_24h: z.number().int().min(0),
  overdue_tasks: z.array(OverdueTaskSchema),
  stale_deals_list: z.array(StaleDealSchema),
  tasks_due_today_list: z.array(TodayTaskSchema),
});

export type UserDigestSummary = z.infer<typeof UserDigestSummarySchema>;

/**
 * Schema for digest generation result
 */
export const DigestGenerationResultSchema = z.object({
  success: z.boolean(),
  digestsGenerated: z.number().int().min(0),
  notificationsCreated: z.number().int().min(0),
  executedAt: z.string(),
  version: z.string().optional(),
});

export type DigestGenerationResult = z.infer<typeof DigestGenerationResultSchema>;

// =====================================================
// DigestService Class
// =====================================================

/**
 * Service for digest query operations
 *
 * Follows Engineering Constitution principle #14:
 * Service Layer orchestration for business operations
 *
 * @example
 * ```typescript
 * const digestService = new DigestService();
 *
 * // Get overdue tasks for current user
 * const tasks = await digestService.getOverdueTasksForUser(salesId);
 *
 * // Get stale deals using per-stage thresholds
 * const deals = await digestService.getStaleDealsForUser(salesId);
 *
 * // Get complete digest summary
 * const summary = await digestService.getUserDigestSummary(salesId);
 * ```
 */
export class DigestService {
  constructor(private dataProvider: ExtendedDataProvider) {}

  /**
   * Get overdue tasks for a specific sales user
   *
   * Tasks are considered overdue when:
   * - due_date < today
   * - completed = false
   * - deleted_at IS NULL
   *
   * @param salesId - The sales.id of the user
   * @returns Array of overdue tasks sorted by days overdue (most urgent first)
   * @throws Error if RPC call fails
   */
  async getOverdueTasksForUser(salesId: number): Promise<OverdueTask[]> {
    try {
      const data = await this.dataProvider.rpc("get_overdue_tasks_for_user", {
        p_sales_id: salesId,
      });

      // Validate and parse response
      const parsed = z.array(OverdueTaskSchema).safeParse(data);
      if (!parsed.success) {
        const errorDetails = parsed.error.errors
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join(", ");
        throw new Error(`Overdue tasks validation failed: ${errorDetails}`);
      }

      return parsed.data;
    } catch (error: any) {
      console.error("[DigestService] Failed to get overdue tasks", { salesId, error });
      throw new Error(`Failed to get overdue tasks: ${error.message}`);
    }
  }

  /**
   * Get tasks due today for a specific sales user
   *
   * Tasks are considered due today when:
   * - due_date = today
   * - completed = false
   * - deleted_at IS NULL
   *
   * @param salesId - The sales.id of the user
   * @returns Array of tasks due today sorted by priority (critical first)
   * @throws Error if RPC call fails
   */
  async getTasksDueTodayForUser(salesId: number): Promise<TodayTask[]> {
    try {
      const data = await this.dataProvider.rpc("get_tasks_due_today_for_user", {
        p_sales_id: salesId,
      });

      // Validate and parse response
      const parsed = z.array(TodayTaskSchema).safeParse(data);
      if (!parsed.success) {
        const errorDetails = parsed.error.errors
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join(", ");
        throw new Error(`Tasks due today validation failed: ${errorDetails}`);
      }

      return parsed.data;
    } catch (error: any) {
      console.error("[DigestService] Failed to get tasks due today", { salesId, error });
      throw new Error(`Failed to get tasks due today: ${error.message}`);
    }
  }

  /**
   * Get stale deals for a specific sales user using per-stage thresholds
   *
   * Per-stage thresholds (PRD Section 6.3):
   * - new_lead: 7 days
   * - initial_outreach: 14 days
   * - sample_visit_offered: 14 days
   * - feedback_logged: 21 days
   * - demo_scheduled: 14 days
   *
   * Staleness is calculated from the most recent activity_date in activities table.
   * Falls back to opportunity.created_at if no activities exist.
   *
   * @param salesId - The sales.id of the user (opportunity_owner_id)
   * @returns Array of stale deals sorted by days over threshold
   * @throws Error if RPC call fails
   */
  async getStaleDealsForUser(salesId: number): Promise<StaleDeal[]> {
    try {
      const data = await this.dataProvider.rpc("get_stale_deals_for_user", {
        p_sales_id: salesId,
      });

      // Validate and parse response
      const parsed = z.array(StaleDealSchema).safeParse(data);
      if (!parsed.success) {
        const errorDetails = parsed.error.errors
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join(", ");
        throw new Error(`Stale deals validation failed: ${errorDetails}`);
      }

      return parsed.data;
    } catch (error: any) {
      console.error("[DigestService] Failed to get stale deals", { salesId, error });
      throw new Error(`Failed to get stale deals: ${error.message}`);
    }
  }

  /**
   * Get complete digest summary for a sales user
   *
   * Returns aggregated counts and detail lists:
   * - tasks_due_today: Count of tasks due today
   * - tasks_overdue: Count of overdue tasks
   * - stale_deals: Count of deals exceeding stage thresholds
   * - opportunities_updated_24h: Opportunities updated in last 24 hours
   * - activities_logged_24h: Activities logged in last 24 hours
   * - overdue_tasks: Array of top 10 overdue task details
   * - stale_deals_list: Array of top 10 stale deal details
   * - tasks_due_today_list: Array of top 10 tasks due today details
   *
   * @param salesId - The sales.id of the user
   * @returns Complete digest summary or null if user not found/disabled
   * @throws Error if RPC call fails
   */
  async getUserDigestSummary(salesId: number): Promise<UserDigestSummary | null> {
    try {
      const data = await this.dataProvider.rpc("get_user_digest_summary", {
        p_sales_id: salesId,
      });

      // RPC returns null if user not found or disabled
      if (!data) {
        return null;
      }

      // Validate and parse response
      const parsed = UserDigestSummarySchema.safeParse(data);
      if (!parsed.success) {
        console.warn("[DigestService] Digest summary validation warning", {
          salesId,
          errors: parsed.error.errors,
        });
        return data as UserDigestSummary;
      }

      return parsed.data;
    } catch (error: any) {
      console.error("[DigestService] Failed to get digest summary", { salesId, error });
      throw new Error(`Failed to get digest summary: ${error.message}`);
    }
  }

  /**
   * Generate daily digests for all active users (v2)
   *
   * Uses per-stage stale thresholds and creates notifications
   * with enhanced metadata including detail lists.
   *
   * @returns Result with counts of digests generated and notifications created
   * @throws Error if RPC call fails
   */
  async generateDailyDigests(): Promise<DigestGenerationResult> {
    try {
      const data = await this.dataProvider.rpc("generate_daily_digest_v2", {});

      // Validate response
      const parsed = DigestGenerationResultSchema.safeParse(data);
      if (!parsed.success) {
        console.warn("[DigestService] Digest generation result validation warning", {
          errors: parsed.error.errors,
        });
        return data as DigestGenerationResult;
      }

      return parsed.data;
    } catch (error: any) {
      console.error("[DigestService] Failed to generate daily digests", { error });
      throw new Error(`Failed to generate daily digests: ${error.message}`);
    }
  }

  /**
   * Get the stale threshold for a given pipeline stage
   *
   * Utility method to expose threshold configuration to callers.
   * Returns undefined for closed stages (closed_won, closed_lost).
   *
   * @param stage - Pipeline stage name
   * @returns Threshold in days, or undefined for closed stages
   */
  getStaleThreshold(stage: string): number | undefined {
    if (stage in STAGE_STALE_THRESHOLDS) {
      return STAGE_STALE_THRESHOLDS[stage as ActivePipelineStage];
    }
    return undefined;
  }

  /**
   * Check if a deal would be considered stale given its stage and last activity
   *
   * Client-side calculation using the same logic as database functions.
   * Useful for real-time UI updates without database round-trip.
   *
   * @param stage - Current pipeline stage
   * @param lastActivityDate - ISO date string of last activity, or null
   * @param referenceDate - Date to compare against (defaults to now)
   * @returns true if deal is stale, false otherwise
   */
  isDealStale(
    stage: string,
    lastActivityDate: string | null,
    referenceDate: Date = new Date()
  ): boolean {
    const threshold = this.getStaleThreshold(stage);

    // Closed stages are never stale
    if (threshold === undefined) {
      return false;
    }

    // No activity date means stale (needs immediate attention)
    if (!lastActivityDate) {
      return true;
    }

    const lastActivity = new Date(lastActivityDate);
    const daysSinceActivity = Math.floor(
      (referenceDate.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
    );

    return daysSinceActivity > threshold;
  }
}

// Factory function to create DigestService with dataProvider
export const createDigestService = (dataProvider: ExtendedDataProvider) =>
  new DigestService(dataProvider);
