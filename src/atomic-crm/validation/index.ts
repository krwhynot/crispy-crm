/**
 * Validation module for Atomic CRM
 *
 * Centralized Zod schemas for API boundary validation following Core Principle #3:
 * Single point validation with Zod schemas at the API boundary only.
 *
 * Schema modules will be added in subsequent tasks:
 * - Core entities: opportunities, organizations, contacts
 * - Supporting entities: tasks, tags, notes
 * - Business rules and custom validators
 *
 * PAT-01 RESOLVED: Validation function naming standardized.
 * Two patterns are now canonical:
 * 1. validate[Resource]Form - General/base validation (e.g., validateOrganizationForm)
 * 2. validateCreate[Resource] / validateUpdate[Resource] - Operation-specific validation
 */

// Re-export ZodError for UI error handling
// UI components should import ZodError from validation layer, not directly from 'zod'
// This keeps Zod imports centralized per Engineering Constitution
export { ZodError } from "zod";

// Constants and utilities
export * from "./constants";
export * from "./utils";

// Core entity schemas
export * from "./opportunities";
export * from "./organizations";
export * from "./contacts";

// Supporting entity schemas
// Note: tasks validation is inline in the task feature module
export * from "./tags";
export * from "./notes";
export * from "./segments";
export * from "./activities";
export * from "./distributorAuthorizations";
export * from "./productDistributors";

// Filter schemas
export * from "./filters";
