import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

/**
 * Migration Status Utilities
 *
 * Provides helpers to check if resources/patterns have been migrated to the unified design system.
 * Used to skip tests for unmigrated components and provide clear feedback to developers.
 */

// ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface MigrationStatus {
  version: string;
  lastUpdated: string;
  resources: Record<string, ResourceStatus>;
  patterns: Record<string, PatternStatus>;
  instructions: Record<string, string>;
}

export interface ResourceStatus {
  listLayout: PatternImplementation;
  slideOver: PatternImplementation;
  createForm: PatternImplementation;
  visualPrimitives: PatternImplementation;
}

export interface PatternImplementation {
  migrated: boolean;
  notes: string;
  [key: string]: any; // Allow additional flags like hasDataTestIds, hasFilterSidebar, etc.
}

export interface PatternStatus {
  totalResources: number;
  migrated: number;
  inProgress: number;
  percentage: number;
}

let cachedStatus: MigrationStatus | null = null;

/**
 * Load migration status from JSON file
 */
export function loadMigrationStatus(): MigrationStatus {
  if (cachedStatus) {
    return cachedStatus;
  }

  const statusPath = path.join(__dirname, '../../design-system/migration-status.json');
  const statusJson = fs.readFileSync(statusPath, 'utf-8');
  cachedStatus = JSON.parse(statusJson);
  return cachedStatus;
}

/**
 * Check if a resource has migrated a specific pattern
 */
export function isPatternMigrated(resource: string, pattern: keyof ResourceStatus): boolean {
  const status = loadMigrationStatus();
  const resourceStatus = status.resources[resource];

  if (!resourceStatus) {
    return false;
  }

  return resourceStatus[pattern]?.migrated ?? false;
}

/**
 * Get list of resources that have migrated a pattern
 */
export function getMigratedResources(pattern: keyof ResourceStatus): string[] {
  const status = loadMigrationStatus();
  return Object.keys(status.resources).filter(resource =>
    isPatternMigrated(resource, pattern)
  );
}

/**
 * Check if resource is in UNIFIED_DS_RESOURCES env var
 */
export function isResourceEnabled(resource: string): boolean {
  const enabledResources = process.env.UNIFIED_DS_RESOURCES?.split(',').map(r => r.trim()) ?? [];

  // If env var not set, check migration status
  if (enabledResources.length === 0) {
    return false;
  }

  return enabledResources.includes(resource);
}

/**
 * Should skip test based on migration status
 *
 * Tests are skipped if:
 * 1. Pattern not migrated AND resource not in UNIFIED_DS_RESOURCES env var
 * 2. This allows developers to test work-in-progress by setting UNIFIED_DS_RESOURCES=contacts
 */
export function shouldSkipTest(resource: string, pattern: keyof ResourceStatus): boolean {
  // If explicitly enabled via env var, don't skip (even if not marked migrated)
  if (isResourceEnabled(resource)) {
    return false;
  }

  // Otherwise, skip if not migrated
  return !isPatternMigrated(resource, pattern);
}

/**
 * Get skip reason message for test
 */
export function getSkipReason(resource: string, pattern: keyof ResourceStatus): string {
  const status = loadMigrationStatus();
  const resourceStatus = status.resources[resource];

  if (!resourceStatus) {
    return `Resource '${resource}' not found in migration status`;
  }

  const patternStatus = resourceStatus[pattern];
  if (!patternStatus) {
    return `Pattern '${pattern}' not tracked for resource '${resource}'`;
  }

  if (patternStatus.migrated) {
    return ''; // Not skipped
  }

  const notes = patternStatus.notes || 'Component not yet migrated';
  return `${resource} ${pattern} not migrated: ${notes}. Set UNIFIED_DS_RESOURCES=${resource} to test work-in-progress.`;
}

/**
 * Get migration progress summary
 */
export function getMigrationProgress(): string {
  const status = loadMigrationStatus();
  const patterns = status.patterns;

  const lines = [
    'Unified Design System Migration Progress:',
    '',
  ];

  for (const [patternName, patternStatus] of Object.entries(patterns)) {
    const percentage = patternStatus.percentage;
    const bar = '█'.repeat(Math.floor(percentage / 5)) + '░'.repeat(20 - Math.floor(percentage / 5));
    lines.push(`  ${patternName.padEnd(20)} [${bar}] ${percentage}% (${patternStatus.migrated}/${patternStatus.totalResources})`);
  }

  lines.push('');
  lines.push('To enable tests for work-in-progress:');
  lines.push('  UNIFIED_DS_RESOURCES=contacts,organizations npx playwright test tests/e2e/design-system/');

  return lines.join('\n');
}

/**
 * Validate migration status file
 */
export function validateMigrationStatus(): string[] {
  const errors: string[] = [];
  const status = loadMigrationStatus();

  // Check version
  if (!status.version) {
    errors.push('Missing version field');
  }

  // Check resources
  if (!status.resources || Object.keys(status.resources).length === 0) {
    errors.push('No resources defined');
  }

  // Validate pattern counts
  for (const [patternName, patternStatus] of Object.entries(status.patterns)) {
    const actualMigrated = Object.values(status.resources).filter(
      r => r[patternName as keyof ResourceStatus]?.migrated
    ).length;

    if (actualMigrated !== patternStatus.migrated) {
      errors.push(
        `Pattern '${patternName}' shows ${patternStatus.migrated} migrated but actual count is ${actualMigrated}`
      );
    }
  }

  return errors;
}
