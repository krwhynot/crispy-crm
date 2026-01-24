/**
 * Activities validation module - Barrel export
 *
 * This file re-exports from the split module structure for backward compatibility.
 * Import from '@/atomic-crm/validation/activities' (resolves to activities/index.ts)
 *
 * Module structure:
 * - types.ts: Type schemas and type exports
 * - constants.ts: UI options and display mappings
 * - schemas.ts: Zod validation schemas
 * - validation.ts: Validation functions for data provider
 * - transforms.ts: UI display transforms (QuickLogForm)
 */

export * from "./activities/index";
