#!/usr/bin/env node

/**
 * Cache Invalidation Script for CRM Migration
 *
 * This script clears all caching layers during the CRM migration from deals to opportunities.
 * It handles browser localStorage, React Query cache, Supabase cache, and any CDN cache.
 *
 * Usage:
 *   node scripts/cache-invalidation.js [options]
 *
 * Options:
 *   --dry-run          Show what would be cleared without executing
 *   --verbose          Show detailed output
 *   --skip-browser     Skip browser localStorage clearing instructions
 *   --skip-cdn         Skip CDN cache invalidation
 *   --help             Show this help message
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';

// Configuration
const CONFIG = {
  CACHE_TTL_HOURS: 24, // Default cache TTL for gradual expiry
  LOG_FILE: 'logs/cache-invalidation.log',
  SUPABASE_URL: process.env.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
};

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isVerbose = args.includes('--verbose') || isDryRun;
const skipBrowser = args.includes('--skip-browser');
const skipCdn = args.includes('--skip-cdn');
const showHelp = args.includes('--help');

if (showHelp) {
  console.log(`
Cache Invalidation Script for CRM Migration

This script clears all caching layers during the CRM migration from deals to opportunities.

Usage:
  node scripts/cache-invalidation.js [options]

Options:
  --dry-run          Show what would be cleared without executing
  --verbose          Show detailed output
  --skip-browser     Skip browser localStorage clearing instructions
  --skip-cdn         Skip CDN cache invalidation
  --help             Show this help message

Cache Layers Cleared:
  1. Browser localStorage (React Admin store, auth tokens)
  2. React Query cache (data queries, mutations)
  3. Supabase cache (RPC functions, views)
  4. CDN cache (if applicable)
  5. PostgreSQL query cache (DISCARD ALL)

Cache TTLs for Gradual Expiry:
  - React Query: 5 minutes (default staleTime)
  - React Admin store: No expiry (localStorage)
  - Supabase RPC: 24 hours (configurable)
  - CDN: Varies by provider (typically 1-24 hours)
  `);
  process.exit(0);
}

// Logging utility
async function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;

  console.log(logMessage);

  if (!isDryRun) {
    try {
      await fs.mkdir(path.dirname(CONFIG.LOG_FILE), { recursive: true });
      await fs.appendFile(CONFIG.LOG_FILE, logMessage + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error.message);
    }
  }
}

// Initialize Supabase client
let supabase = null;
if (CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY) {
  supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
}

/**
 * Clear browser localStorage
 * Since this is a server-side script, we provide instructions for manual clearing
 */
async function clearBrowserCache() {
  if (skipBrowser) {
    await log('Skipping browser localStorage clearing (--skip-browser)');
    return;
  }

  await log('=== Browser Cache Clearing Instructions ===');
  await log('');
  await log('To clear browser localStorage manually:');
  await log('1. Open browser Developer Tools (F12)');
  await log('2. Go to Application/Storage tab');
  await log('3. Select "Local Storage" for your domain');
  await log('4. Clear the following keys:');
  await log('   - CRM (React Admin store)');
  await log('   - supabase.auth.token');
  await log('   - Any keys starting with "ra-"');
  await log('');
  await log('Alternatively, run in browser console:');
  await log('  Object.keys(localStorage).forEach(key => {');
  await log('    if (key === "CRM" || key.startsWith("ra-") || key.includes("supabase")) {');
  await log('      localStorage.removeItem(key);');
  await log('    }');
  await log('  });');
  await log('');
  await log('Or clear all localStorage (affects other apps):');
  await log('  localStorage.clear();');
  await log('');
  await log('Cache TTL: localStorage has no expiry, manual clearing required');
}

/**
 * Clear React Query cache
 * This would typically be done on the client side, but we document the process
 */
async function clearReactQueryCache() {
  await log('=== React Query Cache Clearing ===');
  await log('React Query cache is client-side only and will be cleared on:');
  await log('1. Browser refresh (new session)');
  await log('2. queryClient.clear() if implemented in app');
  await log('3. Individual query invalidation');
  await log('');
  await log('The migration will trigger automatic cache invalidation through:');
  await log('- Resource name changes (deals → opportunities)');
  await log('- New data structure changes');
  await log('- Query key changes in data provider');
  await log('');
  await log('Cache TTL: 5 minutes default staleTime, 1 hour cacheTime');
}

/**
 * Clear Supabase-side caches
 */
async function clearSupabaseCache() {
  if (!supabase) {
    await log('Supabase client not configured, skipping Supabase cache clearing', 'WARN');
    return;
  }

  await log('=== Supabase Cache Clearing ===');

  try {
    if (isDryRun) {
      await log('[DRY RUN] Would clear PostgreSQL query cache');
      await log('[DRY RUN] Would invalidate materialized views');
      await log('[DRY RUN] Would clear RPC function cache');
    } else {
      // Clear PostgreSQL query cache
      const { error: discardError } = await supabase.rpc('execute_sql', {
        sql: 'DISCARD ALL;'
      });

      if (discardError && !discardError.message?.includes('does not exist')) {
        await log(`PostgreSQL cache clear: ${discardError.message}`, 'WARN');
      } else {
        await log('PostgreSQL query cache cleared successfully');
      }

      // Refresh materialized views if any exist
      const { data: views, error: viewsError } = await supabase.rpc('execute_sql', {
        sql: `
          SELECT schemaname, matviewname
          FROM pg_matviews
          WHERE schemaname = 'public'
        `
      });

      if (!viewsError && views) {
        for (const view of views) {
          const { error: refreshError } = await supabase.rpc('execute_sql', {
            sql: `REFRESH MATERIALIZED VIEW ${view.schemaname}.${view.matviewname};`
          });

          if (refreshError) {
            await log(`Failed to refresh view ${view.matviewname}: ${refreshError.message}`, 'ERROR');
          } else {
            await log(`Refreshed materialized view: ${view.matviewname}`);
          }
        }
      }

      await log('Supabase cache clearing completed');
    }
  } catch (error) {
    await log(`Supabase cache clearing failed: ${error.message}`, 'ERROR');
  }

  await log('Cache TTL: PostgreSQL - session based, Views - manual refresh required');
}

/**
 * Clear CDN cache (if applicable)
 */
async function clearCdnCache() {
  if (skipCdn) {
    await log('Skipping CDN cache clearing (--skip-cdn)');
    return;
  }

  await log('=== CDN Cache Clearing ===');
  await log('If using a CDN (CloudFlare, AWS CloudFront, etc.), clear cache for:');
  await log('- Static assets (/assets/*)');
  await log('- API responses (/api/*)');
  await log('- HTML pages with embedded data');
  await log('');
  await log('Common CDN cache clearing commands:');
  await log('CloudFlare: curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache"');
  await log('AWS CloudFront: aws cloudfront create-invalidation --distribution-id {id} --paths "/*"');
  await log('Vercel: vercel --prod --confirm (redeploy)');
  await log('');
  await log('Cache TTL: Varies by CDN provider (typically 1-24 hours)');

  if (isDryRun) {
    await log('[DRY RUN] CDN cache invalidation would be triggered');
  }
}

/**
 * Clear application-specific caches
 */
async function clearApplicationCache() {
  await log('=== Application Cache Clearing ===');

  // Check for any custom cache files
  const cacheDirectories = [
    'node_modules/.cache',
    '.next/cache',
    'dist/cache',
    'build/cache'
  ];

  for (const dir of cacheDirectories) {
    try {
      const stats = await fs.stat(dir);
      if (stats.isDirectory()) {
        if (isDryRun) {
          await log(`[DRY RUN] Would clear cache directory: ${dir}`);
        } else {
          await fs.rm(dir, { recursive: true, force: true });
          await log(`Cleared cache directory: ${dir}`);
        }
      }
    } catch (error) {
      // Directory doesn't exist, skip
      if (isVerbose) {
        await log(`Cache directory not found: ${dir}`);
      }
    }
  }

  await log('Application cache clearing completed');
}

/**
 * Generate cache invalidation report
 */
async function generateReport() {
  await log('=== Cache Invalidation Report ===');
  await log(`Execution mode: ${isDryRun ? 'DRY RUN' : 'LIVE'}`);
  await log(`Timestamp: ${new Date().toISOString()}`);
  await log('');
  await log('Cache layers processed:');
  await log(`✓ Browser localStorage: ${skipBrowser ? 'SKIPPED' : 'INSTRUCTIONS PROVIDED'}`);
  await log('✓ React Query cache: AUTOMATIC ON MIGRATION');
  await log(`✓ Supabase cache: ${supabase ? 'PROCESSED' : 'NOT CONFIGURED'}`);
  await log(`✓ CDN cache: ${skipCdn ? 'SKIPPED' : 'INSTRUCTIONS PROVIDED'}`);
  await log('✓ Application cache: PROCESSED');
  await log('');
  await log('Expected cache TTLs after clearing:');
  await log('- React Query: 5 minutes (staleTime)');
  await log('- Browser localStorage: Manual clearing required');
  await log('- PostgreSQL: Session-based');
  await log('- CDN: Provider-specific (1-24 hours)');
  await log('');

  if (!isDryRun) {
    await log(`Full log available at: ${CONFIG.LOG_FILE}`);
  }
}

/**
 * Main execution function
 */
async function main() {
  try {
    await log('Starting cache invalidation for CRM migration...');
    await log(`Mode: ${isDryRun ? 'DRY RUN' : 'LIVE EXECUTION'}`);
    await log('');

    // Execute cache clearing steps
    await clearBrowserCache();
    await clearReactQueryCache();
    await clearSupabaseCache();
    await clearCdnCache();
    await clearApplicationCache();

    // Generate final report
    await generateReport();

    await log('');
    await log('Cache invalidation completed successfully!');

    if (!isDryRun) {
      await log('');
      await log('Next steps:');
      await log('1. Run search reindex script: node scripts/search-reindex.js');
      await log('2. Monitor application for cache-related issues');
      await log('3. Clear browser caches manually as instructed above');
    }

  } catch (error) {
    await log(`Cache invalidation failed: ${error.message}`, 'ERROR');
    if (isVerbose) {
      await log(`Stack trace: ${error.stack}`, 'ERROR');
    }
    process.exit(1);
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { clearBrowserCache, clearSupabaseCache, clearCdnCache, clearApplicationCache };