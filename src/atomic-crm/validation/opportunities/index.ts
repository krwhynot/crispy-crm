/**
 * Opportunity validation schemas - modular exports
 * Split from monolithic 739-line file per 500-line rule (CQ-006)
 */

// Core schemas and types
export * from "./opportunities-core";

// Operation-specific schemas (create, update, close)
export * from "./opportunities-operations";

// Duplicate detection
export * from "./opportunities-duplicates";

// Junction table schemas (participants, contacts)
export * from "./opportunities-junctions";
