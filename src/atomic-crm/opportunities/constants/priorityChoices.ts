/**
 * Priority choice definitions for opportunities
 * Centralized to maintain single source of truth
 */

export const priorityChoices = [
  { id: "low", name: "Low" },
  { id: "medium", name: "Medium" },
  { id: "high", name: "High" },
  { id: "critical", name: "Critical" },
];

export type PriorityLevel = "low" | "medium" | "high" | "critical";
