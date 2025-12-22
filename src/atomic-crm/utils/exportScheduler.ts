/**
 * Export Scheduler - Manages recurring report exports with multiple formats and recipients
 *
 * Features:
 * - Daily, weekly, and monthly scheduling
 * - CSV, Excel, and PDF export formats
 * - Multiple recipient management
 * - LocalStorage persistence for offline support
 * - Active/inactive toggle for schedule management
 *
 * @example
 * const scheduler = new ExportScheduler();
 *
 * const schedule = scheduler.createSchedule({
 *   name: 'Weekly Sales Report',
 *   frequency: 'weekly',
 *   dayOfWeek: 3, // Wednesday
 *   hour: 14,     // 2 PM
 *   format: 'excel',
 *   recipients: ['sales-team@company.com'],
 * });
 *
 * // Later: add more recipients
 * scheduler.addRecipient(schedule.id, 'manager@company.com');
 */

import { z } from "zod";
import { safeJsonParse } from "./safeJsonParse";

export type ExportFormat = "csv" | "excel" | "pdf";
export type ScheduleFrequency = "daily" | "weekly" | "monthly";

export interface ExportSchedule {
  id: string;
  name: string;
  frequency: ScheduleFrequency;
  format: ExportFormat;
  recipients: string[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Timing properties (optional based on frequency)
  hour?: number; // 0-23 (required for all)
  dayOfWeek?: number; // 0-6 (required for weekly)
  dayOfMonth?: number; // 1-31 (required for monthly)
  minute?: number; // 0-59 (optional, defaults to 0)
}

export interface CreateScheduleInput {
  name: string;
  frequency: ScheduleFrequency;
  format: ExportFormat;
  recipients: string[];
  hour?: number;
  dayOfWeek?: number;
  dayOfMonth?: number;
  minute?: number;
}

export interface UpdateScheduleInput {
  name?: string;
  frequency?: ScheduleFrequency;
  format?: ExportFormat;
  recipients?: string[];
  hour?: number;
  dayOfWeek?: number;
  dayOfMonth?: number;
  minute?: number;
}

const exportScheduleStorageSchema = z.strictObject({
  id: z.string().min(1).max(100),
  name: z.string().max(255),
  frequency: z.enum(["daily", "weekly", "monthly"]),
  format: z.enum(["csv", "excel", "pdf"]),
  recipients: z.array(z.string().email()).max(50),
  active: z.boolean(),
  createdAt: z.string().max(50),
  updatedAt: z.string().max(50),
  hour: z.number().int().min(0).max(23).optional(),
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  minute: z.number().int().min(0).max(59).optional(),
});
const exportScheduleArraySchema = z.array(exportScheduleStorageSchema).max(1000);

/**
 * Manages export schedules with persistence to localStorage
 */
export class ExportScheduler {
  private schedules: Map<string, ExportSchedule>;
  private readonly storageKey = "exportSchedules";

  constructor() {
    this.schedules = new Map();
    this.loadFromStorage();
  }

  /**
   * Create a new export schedule
   * @param input Schedule configuration
   * @returns The created schedule
   */
  createSchedule(input: CreateScheduleInput): ExportSchedule {
    const id = this.generateId();
    const now = new Date();

    const schedule: ExportSchedule = {
      id,
      name: input.name,
      frequency: input.frequency,
      format: input.format,
      recipients: [...input.recipients], // Copy array to prevent mutations
      active: true,
      createdAt: now,
      updatedAt: now,
      hour: input.hour,
      dayOfWeek: input.dayOfWeek,
      dayOfMonth: input.dayOfMonth,
      minute: input.minute ?? 0,
    };

    this.schedules.set(id, schedule);
    this.saveToStorage();

    return schedule;
  }

  /**
   * Retrieve a schedule by ID
   * @param id Schedule ID
   * @returns The schedule, or undefined if not found
   */
  getSchedule(id: string): ExportSchedule | undefined {
    return this.schedules.get(id);
  }

  /**
   * List all schedules
   * @returns Array of all schedules
   */
  listSchedules(): ExportSchedule[] {
    return Array.from(this.schedules.values());
  }

  /**
   * Update a schedule
   * @param id Schedule ID
   * @param updates Partial schedule updates
   * @returns The updated schedule, or undefined if not found
   */
  updateSchedule(id: string, updates: UpdateScheduleInput): ExportSchedule | undefined {
    const schedule = this.schedules.get(id);
    if (!schedule) {
      return undefined;
    }

    const updated: ExportSchedule = {
      ...schedule,
      ...updates,
      recipients: updates.recipients ? [...updates.recipients] : schedule.recipients,
      updatedAt: new Date(),
    };

    this.schedules.set(id, updated);
    this.saveToStorage();

    return updated;
  }

  /**
   * Delete a schedule
   * @param id Schedule ID
   * @returns True if deleted, false if not found
   */
  deleteSchedule(id: string): boolean {
    const deleted = this.schedules.delete(id);
    if (deleted) {
      this.saveToStorage();
    }
    return deleted;
  }

  /**
   * Toggle schedule active status
   * @param id Schedule ID
   * @returns True if toggled, false if not found
   */
  toggleScheduleActive(id: string): boolean {
    const schedule = this.schedules.get(id);
    if (!schedule) {
      return false;
    }

    schedule.active = !schedule.active;
    schedule.updatedAt = new Date();
    this.saveToStorage();

    return true;
  }

  /**
   * Add a recipient to a schedule (prevents duplicates)
   * @param id Schedule ID
   * @param email Recipient email address
   * @returns True if added, false if already exists or schedule not found
   */
  addRecipient(id: string, email: string): boolean {
    const schedule = this.schedules.get(id);
    if (!schedule) {
      return false;
    }

    if (schedule.recipients.includes(email)) {
      return false; // Duplicate prevention
    }

    schedule.recipients.push(email);
    schedule.updatedAt = new Date();
    this.saveToStorage();

    return true;
  }

  /**
   * Remove a recipient from a schedule
   * @param id Schedule ID
   * @param email Recipient email address
   * @returns True if removed, false if not found
   */
  removeRecipient(id: string, email: string): boolean {
    const schedule = this.schedules.get(id);
    if (!schedule) {
      return false;
    }

    const initialLength = schedule.recipients.length;
    schedule.recipients = schedule.recipients.filter((r) => r !== email);

    if (schedule.recipients.length < initialLength) {
      schedule.updatedAt = new Date();
      this.saveToStorage();
      return true;
    }

    return false;
  }

  /**
   * Get the next scheduled run time for a schedule
   * @param id Schedule ID
   * @returns Date of next scheduled run, or undefined if not found
   */
  getNextRunTime(id: string): Date | undefined {
    const schedule = this.schedules.get(id);
    if (!schedule || !schedule.active) {
      return undefined;
    }

    const now = new Date();
    const nextRun = new Date();

    switch (schedule.frequency) {
      case "daily":
        // Set to next occurrence of specified hour
        nextRun.setHours(schedule.hour ?? 0, schedule.minute ?? 0, 0, 0);
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
        break;

      case "weekly": {
        // Set to next occurrence of specified day/hour
        const targetDay = schedule.dayOfWeek ?? 0;
        const daysUntilTarget = (targetDay - now.getDay() + 7) % 7;
        nextRun.setDate(now.getDate() + (daysUntilTarget === 0 ? 7 : daysUntilTarget));
        nextRun.setHours(schedule.hour ?? 0, schedule.minute ?? 0, 0, 0);

        if (daysUntilTarget === 0 && nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 7);
        }
        break;
      }

      case "monthly":
        // Set to next occurrence of specified day/hour
        nextRun.setDate(schedule.dayOfMonth ?? 1);
        nextRun.setHours(schedule.hour ?? 0, schedule.minute ?? 0, 0, 0);

        if (nextRun <= now) {
          nextRun.setMonth(nextRun.getMonth() + 1);
        }
        break;
    }

    return nextRun;
  }

  // Private helper methods

  private generateId(): string {
    return `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private saveToStorage(): void {
    try {
      const data = Array.from(this.schedules.values()).map((schedule) => ({
        ...schedule,
        createdAt: schedule.createdAt.toISOString(),
        updatedAt: schedule.updatedAt.toISOString(),
      }));
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error("Failed to save export schedules to localStorage:", error);
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) {
        return;
      }

      const data = safeJsonParse(stored, exportScheduleArraySchema);
      if (!data) {
        return;
      }

      data.forEach((schedule) => {
        this.schedules.set(schedule.id, {
          ...schedule,
          createdAt: new Date(schedule.createdAt),
          updatedAt: new Date(schedule.updatedAt),
        });
      });
    } catch (error) {
      console.error("Failed to load export schedules from localStorage:", error);
      this.schedules.clear();
    }
  }
}

/**
 * Singleton instance for global access
 * Usage: import { globalExportScheduler } from './exportScheduler'
 */
export const globalExportScheduler = new ExportScheduler();
