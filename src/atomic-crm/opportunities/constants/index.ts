/**
 * Centralized constants for opportunities module
 *
 * Split into focused modules for maintainability:
 * - stage-enums: Core stage constants and predicates
 * - stage-config: Stage display configuration and helpers
 * - stage-health: Health monitoring and sorting logic
 * - ui-constants: UI constants and filter configuration
 */

// Stage enums and predicates (foundation layer)
export * from "./stage-enums";

// Stage display configuration (depends on enums)
export * from "./stage-config";

// Stage health and sorting (depends on enums and config)
export * from "./stage-health";

// UI constants and filters (depends on enums and config)
export * from "./ui-constants";
