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
 * TODO PAT-01: Validation function naming is inconsistent across modules
 * Three patterns currently exist:
 * 1. validate[Resource]Form - Used in products, organizations, contacts, opportunities, sales, activities
 * 2. validateCreate[Resource] - Used in distributorAuthorizations, notes, tags, organizations, contacts
 * 3. validate[Resource]ForSubmission - Used in organizations, segments, operatorSegments, notes, tags
 *
 * Preferred pattern (to standardize in future refactor):
 * - validate[Resource] for base/general validation
 * - validateCreate[Resource] for create-specific validation
 * - validateUpdate[Resource] for update-specific validation
 *
 * DO NOT rename now - would break imports across codebase.
 * Plan: Create new validators with standard names, deprecate old ones, migrate gradually.
 */

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
