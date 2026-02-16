#!/usr/bin/env node

/**
 * Sharded test runner — prevents OOM by splitting the test suite into sequential
 * shards, each running as a fresh Node process with its own memory budget.
 *
 * Vitest 3.2.x has a known memory regression (vitest-dev/vitest#8293) where
 * worker processes accumulate ~40MB per jsdom test file without release. With
 * 100+ test files, a single run exceeds V8's heap limit (~4.3GB default).
 *
 * Sharding splits test files into N groups. Each shard runs in its own process,
 * so memory is fully reclaimed between shards.
 *
 * Usage:
 *   node scripts/test-sharded.mjs              # 4 shards (default)
 *   node scripts/test-sharded.mjs --shards=2   # 2 shards
 *   node scripts/test-sharded.mjs --verbose     # verbose reporter
 */

import { execSync } from "node:child_process";

const args = process.argv.slice(2);
const shardArg = args.find((a) => a.startsWith("--shards="));
const totalShards = shardArg ? parseInt(shardArg.split("=")[1], 10) : 4;
const verbose = args.includes("--verbose");
const reporter = verbose ? "--reporter=verbose" : "";
const heapSize = 4096; // MB per shard

console.log(`Running test suite in ${totalShards} shards (${heapSize}MB heap each)...\n`);

let allPassed = true;

for (let i = 1; i <= totalShards; i++) {
  const cmd = `node --max-old-space-size=${heapSize} node_modules/vitest/vitest.mjs run ${reporter} --shard=${i}/${totalShards}`;
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Shard ${i}/${totalShards}`);
  console.log(`${"=".repeat(60)}\n`);

  try {
    execSync(cmd, { stdio: "inherit", env: { ...process.env } });
  } catch {
    allPassed = false;
    console.error(`\nShard ${i}/${totalShards} failed.`);
  }
}

if (!allPassed) {
  console.error("\nSome test shards failed.");
  process.exit(1);
}

console.log("\nAll shards passed.");
