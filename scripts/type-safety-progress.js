#!/usr/bin/env node
/**
 * Type Safety Progress Tracker
 *
 * This script tracks TypeScript type safety improvements by counting
 * warnings from type-checking ESLint rules.
 *
 * Usage: npm run lint:check 2>&1 | node scripts/type-safety-progress.js
 */

import { createInterface } from "readline";

const rules = {
  "@typescript-eslint/no-explicit-any": 0,
  "@typescript-eslint/no-unsafe-assignment": 0,
  "@typescript-eslint/no-unsafe-member-access": 0,
  "@typescript-eslint/no-unsafe-call": 0,
  "@typescript-eslint/no-unsafe-return": 0,
  "@typescript-eslint/no-unsafe-argument": 0,
  "@typescript-eslint/prefer-nullish-coalescing": 0,
  "@typescript-eslint/prefer-optional-chain": 0,
};

let totalWarnings = 0;
let totalErrors = 0;

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

rl.on("line", (line) => {
  // Parse ESLint output lines
  const warningMatch = line.match(/warning\s+(.+?)\s+(@typescript-eslint\/[\w-]+)/);
  const errorMatch = line.match(/error\s+(.+?)\s+(@typescript-eslint\/[\w-]+)/);

  if (warningMatch) {
    const rule = warningMatch[2];
    if (rules.hasOwnProperty(rule)) {
      rules[rule]++;
      totalWarnings++;
    }
  }

  if (errorMatch) {
    totalErrors++;
  }
});

rl.on("close", () => {
  console.log("\n=== TypeScript Type Safety Progress Report ===\n");

  console.log("Rule-specific counts:");
  Object.entries(rules).forEach(([rule, count]) => {
    if (count > 0) {
      console.log(`  ${rule}: ${count} warnings`);
    }
  });

  console.log(`\nTotal type safety warnings: ${totalWarnings}`);
  console.log(`Total errors: ${totalErrors}`);

  // Provide recommendations based on counts
  console.log("\nRecommendations:");

  if (rules["@typescript-eslint/no-explicit-any"] > 0) {
    console.log(
      `  • Priority: Fix ${rules["@typescript-eslint/no-explicit-any"]} explicit 'any' usages`
    );
    console.log("    Focus on security-critical files first (auth, file upload, data processing)");
  }

  if (rules["@typescript-eslint/no-unsafe-assignment"] > 0) {
    console.log(
      `  • Review ${rules["@typescript-eslint/no-unsafe-assignment"]} unsafe assignments for potential type violations`
    );
  }

  if (rules["@typescript-eslint/no-unsafe-member-access"] > 0) {
    console.log(
      `  • ${rules["@typescript-eslint/no-unsafe-member-access"]} unsafe member accesses could cause runtime errors`
    );
  }

  console.log("\nPhase progression:");
  console.log('  Phase 1 (Current): All rules set to "warn" - identify and catalog issues');
  console.log('  Phase 2 (Next): Upgrade critical rules to "error" after fixing security paths');
  console.log("  Phase 3 (Future): Full enforcement with selective exceptions");
});
