/**
 * Daily Digest Email Generator
 *
 * Generates HTML email content by compiling the template with provided data.
 * Uses simple string replacement to avoid runtime dependencies.
 */

import type { DailyDigestData, OverdueTask, AtRiskDeal, TodayTask } from "./daily-digest.types";
import { STAGE_COLORS, STALE_THRESHOLDS, ROW_COLORS } from "./daily-digest.types";
import { STAGE } from "@/atomic-crm/opportunities/constants";

// Import the template at build time (Vite handles this)
import templateHtml from "./daily-digest.template.html?raw";

/**
 * Compiles the daily digest email template with the provided data.
 *
 * @param data - The digest data to populate the template
 * @returns Compiled HTML string ready to send
 *
 * @example
 * ```ts
 * const html = generateDailyDigestEmail({
 *   user_first_name: "John",
 *   overdue_tasks: [...],
 *   // ... other fields
 * });
 * await sendEmail({ to: user.email, html });
 * ```
 */
export function generateDailyDigestEmail(data: DailyDigestData): string {
  let html = templateHtml;

  // Replace simple variables
  const simpleReplacements: Record<string, string | number> = {
    digest_title: data.digest_title,
    preheader_text: data.preheader_text,
    formatted_date: data.formatted_date,
    time_of_day: data.time_of_day,
    user_first_name: escapeHtml(data.user_first_name),
    open_opportunities_count: data.open_opportunities_count,
    tasks_due_today_count: data.tasks_due_today_count,
    overdue_count: data.overdue_count,
    at_risk_count: data.at_risk_count,
    dashboard_url: data.dashboard_url,
    user_email: escapeHtml(data.user_email),
    preferences_url: data.preferences_url,
    unsubscribe_url: data.unsubscribe_url,
    current_year: data.current_year,
  };

  for (const [key, value] of Object.entries(simpleReplacements)) {
    html = html.replace(new RegExp(`{{${key}}}`, "g"), String(value));
  }

  // Handle pluralization
  html = html.replace(/{{#if overdue_plural}}s{{\/if}}/g, data.overdue_plural ? "s" : "");
  html = html.replace(/{{#if at_risk_plural}}s{{\/if}}/g, data.at_risk_plural ? "s" : "");

  // Handle conditional sections
  html = processConditional(html, "has_overdue_tasks", data.has_overdue_tasks);
  html = processConditional(html, "has_at_risk_deals", data.has_at_risk_deals);
  html = processConditional(html, "has_today_tasks", data.has_today_tasks);

  // Process array loops
  html = processOverdueTasks(html, data.overdue_tasks);
  html = processAtRiskDeals(html, data.at_risk_deals);
  html = processTodayTasks(html, data.today_tasks);

  return html;
}

/**
 * Escapes HTML special characters to prevent XSS in email content.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Processes conditional blocks in the template.
 * {{#if condition}}...{{/if}}
 */
function processConditional(html: string, condition: string, value: boolean): string {
  const regex = new RegExp(`{{#if ${condition}}}([\\s\\S]*?){{/if}}`, "g");

  if (value) {
    // Keep the content, remove the markers
    return html.replace(regex, "$1");
  } else {
    // Remove the entire block
    return html.replace(regex, "");
  }
}

/**
 * Processes the overdue tasks array loop.
 */
function processOverdueTasks(html: string, tasks: OverdueTask[]): string {
  const loopRegex = /{{#each overdue_tasks}}([\s\S]*?){{\/each}}/g;
  const templateMatch = loopRegex.exec(html);

  if (!templateMatch) return html;

  const rowTemplate = templateMatch[1];
  const rows = tasks
    .map((task, index) => {
      let row = rowTemplate;
      row = row.replace(/{{task_title}}/g, escapeHtml(task.task_title));
      row = row.replace(/{{due_date_formatted}}/g, task.due_date_formatted);
      row = row.replace(/{{related_entity}}/g, escapeHtml(task.related_entity));
      row = row.replace(/{{days_overdue}}/g, String(task.days_overdue));
      row = row.replace(/{{#if days_plural}}s{{\/if}}/g, task.days_plural ? "s" : "");
      row = row.replace(/{{row_bg_color}}/g, index % 2 === 0 ? ROW_COLORS.even : ROW_COLORS.odd);
      return row;
    })
    .join("");

  return html.replace(loopRegex, rows);
}

/**
 * Processes the at-risk deals array loop.
 */
function processAtRiskDeals(html: string, deals: AtRiskDeal[]): string {
  const loopRegex = /{{#each at_risk_deals}}([\s\S]*?){{\/each}}/g;
  const templateMatch = loopRegex.exec(html);

  if (!templateMatch) return html;

  const rowTemplate = templateMatch[1];
  const rows = deals
    .map((deal, index) => {
      let row = rowTemplate;
      row = row.replace(/{{opportunity_name}}/g, escapeHtml(deal.opportunity_name));
      row = row.replace(/{{principal_name}}/g, escapeHtml(deal.principal_name));
      row = row.replace(/{{customer_name}}/g, escapeHtml(deal.customer_name));
      row = row.replace(/{{stage_label}}/g, deal.stage_label);
      row = row.replace(/{{stage_bg_color}}/g, deal.stage_bg_color);
      row = row.replace(/{{stage_text_color}}/g, deal.stage_text_color);
      row = row.replace(/{{days_stale}}/g, String(deal.days_stale));
      row = row.replace(/{{#if days_plural}}s{{\/if}}/g, deal.days_plural ? "s" : "");
      row = row.replace(/{{row_bg_color}}/g, index % 2 === 0 ? ROW_COLORS.even : ROW_COLORS.odd);
      return row;
    })
    .join("");

  return html.replace(loopRegex, rows);
}

/**
 * Processes the today's tasks array loop.
 */
function processTodayTasks(html: string, tasks: TodayTask[]): string {
  const loopRegex = /{{#each today_tasks}}([\s\S]*?){{\/each}}/g;
  const templateMatch = loopRegex.exec(html);

  if (!templateMatch) return html;

  const rowTemplate = templateMatch[1];
  const rows = tasks
    .map((task) => {
      let row = rowTemplate;
      row = row.replace(/{{task_title}}/g, escapeHtml(task.task_title));

      // Handle optional related_entity
      if (task.related_entity) {
        row = row.replace(/{{#if related_entity}}([\s\S]*?){{\/if}}/g, "$1");
        row = row.replace(/{{related_entity}}/g, escapeHtml(task.related_entity));
      } else {
        row = row.replace(/{{#if related_entity}}[\s\S]*?{{\/if}}/g, "");
      }

      return row;
    })
    .join("");

  return html.replace(loopRegex, rows);
}

/**
 * Helper to determine time of day based on hour.
 */
export function getTimeOfDay(hour: number): "morning" | "afternoon" | "evening" {
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

/**
 * Helper to format a date for the email header.
 */
export function formatDigestDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Helper to calculate days between two dates.
 */
export function daysBetween(date1: Date, date2: Date): number {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay));
}

/**
 * Determines if a deal is "at risk" based on stage and days since last activity.
 */
export function isAtRisk(stage: string, daysSinceActivity: number): boolean {
  const threshold = STALE_THRESHOLDS[stage];
  if (!threshold) return false;
  return daysSinceActivity >= threshold;
}

/**
 * Gets stage styling for the email template.
 */
export function getStageStyle(stage: string): {
  bg: string;
  text: string;
  label: string;
} {
  return (
    STAGE_COLORS[stage] || {
      bg: "#F3F4F6",
      text: "#4B5563",
      label: stage.replace(/_/g, " "),
    }
  );
}

/**
 * Creates sample data for testing/previewing the template.
 */
export function createSampleDigestData(): DailyDigestData {
  const now = new Date();

  return {
    digest_title: "Your Daily Sales Digest",
    preheader_text: "2 overdue tasks, 3 deals need attention. View your dashboard for details.",
    formatted_date: formatDigestDate(now),
    time_of_day: getTimeOfDay(now.getHours()),
    user_first_name: "Sarah",
    open_opportunities_count: 12,
    tasks_due_today_count: 5,
    overdue_count: 2,
    overdue_plural: true,
    has_overdue_tasks: true,
    overdue_tasks: [
      {
        task_id: "1",
        task_title: "Follow up with Sysco buyer",
        due_date: "2024-11-25",
        due_date_formatted: "Nov 25",
        related_entity: "Sysco Chicago",
        days_overdue: 4,
        days_plural: true,
        row_bg_color: ROW_COLORS.even,
      },
      {
        task_id: "2",
        task_title: "Send McCRUM samples",
        due_date: "2024-11-27",
        due_date_formatted: "Nov 27",
        related_entity: "Portillo's Hot Dogs",
        days_overdue: 2,
        days_plural: true,
        row_bg_color: ROW_COLORS.odd,
      },
    ],
    has_at_risk_deals: true,
    at_risk_count: 3,
    at_risk_plural: true,
    at_risk_deals: [
      {
        opportunity_id: "1",
        opportunity_name: "McCRUM Fries Launch",
        principal_name: "McCRUM",
        customer_name: "Portillo's Hot Dogs",
        stage: STAGE.SAMPLE_VISIT_OFFERED,
        stage_label: "Sample",
        stage_bg_color: "#FEF3E2",
        stage_text_color: "#B8640A",
        days_stale: 8,
        days_plural: true,
        row_bg_color: ROW_COLORS.even,
      },
      {
        opportunity_id: "2",
        opportunity_name: "Rapid Rasoi Expansion",
        principal_name: "Rapid Rasoi",
        customer_name: "The Chopping Block",
        stage: STAGE.DEMO_SCHEDULED,
        stage_label: "Demo",
        stage_bg_color: "#DBEAFE",
        stage_text_color: "#1D4ED8",
        days_stale: 5,
        days_plural: true,
        row_bg_color: ROW_COLORS.odd,
      },
      {
        opportunity_id: "3",
        opportunity_name: "New Menu Items Q1",
        principal_name: "Local Harvest",
        customer_name: "Girl & The Goat",
        stage: "feedback_logged",
        stage_label: "Feedback",
        stage_bg_color: "#FEF9C3",
        stage_text_color: "#A16207",
        days_stale: 6,
        days_plural: true,
        row_bg_color: ROW_COLORS.even,
      },
    ],
    has_today_tasks: true,
    today_tasks: [
      {
        task_id: "3",
        task_title: "Call Mike at USF about pricing",
        related_entity: "US Foods",
      },
      {
        task_id: "4",
        task_title: "Prepare demo materials for Thursday",
        related_entity: "Rapid Rasoi",
      },
      {
        task_id: "5",
        task_title: "Review Q4 targets",
      },
    ],
    dashboard_url: "https://crm.mfbfoods.com/",
    user_email: "sarah@mfbfoods.com",
    preferences_url: "https://crm.mfbfoods.com/settings/notifications",
    unsubscribe_url: "https://crm.mfbfoods.com/unsubscribe?token=xxx",
    current_year: now.getFullYear(),
  };
}
