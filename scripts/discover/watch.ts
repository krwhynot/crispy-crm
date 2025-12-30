#!/usr/bin/env npx tsx
/**
 * Watch mode for discovery system.
 * Automatically runs incremental discovery when source files change.
 */
import chokidar from 'chokidar';
import { execSync } from 'child_process';
import chalk from 'chalk';

const WATCH_PATTERNS = [
  'src/atomic-crm/**/*.ts',
  'src/atomic-crm/**/*.tsx',
  'src/components/**/*.ts',
  'src/components/**/*.tsx',
];

const IGNORED_PATTERNS = [
  '**/node_modules/**',
  '**/__tests__/**',
  '**/*.test.ts',
  '**/*.test.tsx',
];

console.log(chalk.cyan.bold('\n👁️  Discovery Watch Mode\n'));
console.log(chalk.gray('Watching for changes in:'));
WATCH_PATTERNS.forEach(p => console.log(chalk.gray(`  - ${p}`)));
console.log(chalk.gray('\nPress Ctrl+C to stop.\n'));

let isRunning = false;
let pendingRun = false;

async function runIncrementalDiscovery(changedPath: string) {
  if (isRunning) {
    pendingRun = true;
    return;
  }

  isRunning = true;
  console.log(chalk.yellow(`\n📁 Changed: ${changedPath}`));
  console.log(chalk.cyan('🔄 Running incremental discovery...\n'));

  try {
    execSync('npx tsx scripts/discover/index.ts --incremental', {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
    console.log(chalk.green('\n✅ Discovery updated successfully\n'));
  } catch (_error) {
    console.error(chalk.red('\n❌ Discovery failed\n'));
  }

  isRunning = false;

  if (pendingRun) {
    pendingRun = false;
    runIncrementalDiscovery('(batched changes)');
  }
}

const watcher = chokidar.watch(WATCH_PATTERNS, {
  ignoreInitial: true,
  ignored: IGNORED_PATTERNS,
  awaitWriteFinish: {
    stabilityThreshold: 300,
    pollInterval: 100,
  },
});

watcher
  .on('change', runIncrementalDiscovery)
  .on('add', runIncrementalDiscovery)
  .on('unlink', runIncrementalDiscovery);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log(chalk.gray('\n\n👋 Stopping watch mode...\n'));
  watcher.close();
  process.exit(0);
});
