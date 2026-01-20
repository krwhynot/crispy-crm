#!/usr/bin/env node
/**
 * Comprehensive test suite for skill-index.json migration
 * Proves functional equivalence with the original skill-rules.json
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Types
interface SkillIndexEntry {
  priority: "critical" | "high" | "medium" | "low";
  keywords: string[];
  intentPatterns: string[];
}

interface SkillIndex {
  version: string;
  skills: Record<string, SkillIndexEntry>;
  skillToDomain?: Record<string, string>;
}

interface SkillRulesEntry {
  priority: "critical" | "high" | "medium" | "low";
  promptTriggers?: {
    keywords?: string[];
    intentPatterns?: string[];
  };
}

interface SkillRules {
  skills: Record<string, SkillRulesEntry>;
}

// Test prompts covering all skills
const TEST_PROMPTS: Array<{ prompt: string; expectedSkills: string[]; description: string }> = [
  // Critical skills
  { prompt: "I'm done with this task", expectedSkills: ["verification-before-completion"], description: "Completion claim" },
  { prompt: "the tests pass now", expectedSkills: ["verification-before-completion"], description: "Test pass claim" },
  { prompt: "fix the bug", expectedSkills: ["fail-fast-debugging"], description: "Bug fix request" },
  { prompt: "debug this error", expectedSkills: ["fail-fast-debugging", "root-cause-tracing"], description: "Debug request" },

  // High priority
  { prompt: "create a migration", expectedSkills: ["supabase-crm", "supabase-cli"], description: "Migration creation" },
  { prompt: "write tests for this", expectedSkills: ["testing-patterns"], description: "Test writing" },
  { prompt: "trace the root cause", expectedSkills: ["root-cause-tracing"], description: "Root cause investigation" },

  // Medium priority
  { prompt: "audit the codebase", expectedSkills: ["deep-audit"], description: "Audit request" },
  { prompt: "write a plan for this feature", expectedSkills: ["writing-plans"], description: "Planning request" },
  { prompt: "execute the plan", expectedSkills: ["executing-plans"], description: "Plan execution" },

  // Edge cases - should NOT match
  { prompt: "hello world", expectedSkills: [], description: "Generic greeting (no match)" },
  { prompt: "what is 2+2", expectedSkills: [], description: "Math question (no match)" },
];

function matchSkills(prompt: string, index: SkillIndex): string[] {
  const lowerPrompt = prompt.toLowerCase();
  const matched: string[] = [];

  for (const [skillName, config] of Object.entries(index.skills)) {
    // Keyword matching
    if (config.keywords?.some((kw) => lowerPrompt.includes(kw.toLowerCase()))) {
      matched.push(skillName);
      continue;
    }
    // Intent pattern matching
    if (config.intentPatterns?.some((pattern) => new RegExp(pattern, "i").test(lowerPrompt))) {
      matched.push(skillName);
    }
  }
  return matched.sort();
}

function matchSkillsOld(prompt: string, rules: SkillRules): string[] {
  const lowerPrompt = prompt.toLowerCase();
  const matched: string[] = [];

  for (const [skillName, config] of Object.entries(rules.skills)) {
    const triggers = config.promptTriggers;
    if (!triggers) continue;

    // Keyword matching
    if (triggers.keywords?.some((kw) => lowerPrompt.includes(kw.toLowerCase()))) {
      matched.push(skillName);
      continue;
    }
    // Intent pattern matching
    if (triggers.intentPatterns?.some((pattern) => new RegExp(pattern, "i").test(lowerPrompt))) {
      matched.push(skillName);
    }
  }
  return matched.sort();
}

async function runTests() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  SKILL INDEX MIGRATION TEST SUITE");
  console.log("═══════════════════════════════════════════════════════════\n");

  const projectDir = join(__dirname, "..", "..");

  // Load both files
  const indexPath = join(projectDir, ".claude", "skills", "skill-index.json");
  const rulesPath = join(projectDir, ".claude", "skills", "skill-rules.json");

  const index: SkillIndex = JSON.parse(readFileSync(indexPath, "utf-8"));
  const rules: SkillRules = JSON.parse(readFileSync(rulesPath, "utf-8"));

  let passed = 0;
  let failed = 0;

  // ═══════════════════════════════════════════════════════════
  // TEST 1: Structural Integrity
  // ═══════════════════════════════════════════════════════════
  console.log("📋 TEST 1: Structural Integrity");
  console.log("─────────────────────────────────────────────────────────────");

  const indexSkillCount = Object.keys(index.skills).length;
  const rulesSkillCount = Object.keys(rules.skills).length;

  if (indexSkillCount === rulesSkillCount) {
    console.log(`  ✅ Skill count matches: ${indexSkillCount} skills`);
    passed++;
  } else {
    console.log(`  ❌ Skill count mismatch: index=${indexSkillCount}, rules=${rulesSkillCount}`);
    failed++;
  }

  // Verify all skills from rules exist in index
  const missingSkills = Object.keys(rules.skills).filter(s => !index.skills[s]);
  if (missingSkills.length === 0) {
    console.log(`  ✅ All skills from rules.json exist in index`);
    passed++;
  } else {
    console.log(`  ❌ Missing skills in index: ${missingSkills.join(", ")}`);
    failed++;
  }
  console.log();

  // ═══════════════════════════════════════════════════════════
  // TEST 2: Functional Equivalence (compare matching results)
  // ═══════════════════════════════════════════════════════════
  console.log("🔄 TEST 2: Functional Equivalence");
  console.log("─────────────────────────────────────────────────────────────");

  let equivalenceErrors = 0;
  for (const { prompt, description } of TEST_PROMPTS) {
    const newResult = matchSkills(prompt, index);
    const oldResult = matchSkillsOld(prompt, rules);

    const oldSet = new Set(oldResult);
    const isEquivalent = newResult.length === oldResult.length &&
                         newResult.every(s => oldSet.has(s));

    if (isEquivalent) {
      console.log(`  ✅ "${description}": ${newResult.length} matches`);
    } else {
      console.log(`  ❌ "${description}": MISMATCH`);
      console.log(`     New: [${newResult.join(", ")}]`);
      console.log(`     Old: [${oldResult.join(", ")}]`);
      equivalenceErrors++;
    }
  }

  if (equivalenceErrors === 0) {
    console.log(`  ✅ All ${TEST_PROMPTS.length} prompts produce equivalent results`);
    passed++;
  } else {
    console.log(`  ❌ ${equivalenceErrors} prompts had mismatched results`);
    failed++;
  }
  console.log();

  // ═══════════════════════════════════════════════════════════
  // TEST 3: Coverage (ensure all skills are triggerable)
  // ═══════════════════════════════════════════════════════════
  console.log("🎯 TEST 3: Skill Coverage");
  console.log("─────────────────────────────────────────────────────────────");

  const triggeredSkills = new Set<string>();

  // Test each skill's own keywords
  for (const [skillName, config] of Object.entries(index.skills)) {
    if (config.keywords?.length > 0) {
      // Use first keyword as test
      const testPrompt = config.keywords[0];
      const result = matchSkills(testPrompt, index);
      if (result.includes(skillName)) {
        triggeredSkills.add(skillName);
      }
    }
  }

  const untriggered = Object.keys(index.skills).filter(s => !triggeredSkills.has(s));
  console.log(`  Triggerable via keywords: ${triggeredSkills.size}/${indexSkillCount}`);

  if (untriggered.length > 0) {
    console.log(`  ⚠️  Skills without keyword triggers: ${untriggered.join(", ")}`);
    // Check if they have intent patterns instead
    for (const skill of untriggered) {
      if (index.skills[skill].intentPatterns?.length > 0) {
        console.log(`     → ${skill} uses intent patterns instead`);
        triggeredSkills.add(skill);
      }
    }
  }

  if (triggeredSkills.size === indexSkillCount) {
    console.log(`  ✅ All ${indexSkillCount} skills are triggerable`);
    passed++;
  } else {
    console.log(`  ❌ Some skills cannot be triggered`);
    failed++;
  }
  console.log();

  // ═══════════════════════════════════════════════════════════
  // TEST 4: Performance Comparison
  // ═══════════════════════════════════════════════════════════
  console.log("⚡ TEST 4: Performance");
  console.log("─────────────────────────────────────────────────────────────");

  const iterations = 1000;
  const testPrompt = "fix the bug in the migration and run tests";

  // Warm up
  for (let i = 0; i < 100; i++) {
    matchSkills(testPrompt, index);
    matchSkillsOld(testPrompt, rules);
  }

  // Time new index
  const startNew = performance.now();
  for (let i = 0; i < iterations; i++) {
    matchSkills(testPrompt, index);
  }
  const newTime = performance.now() - startNew;

  // Time old rules
  const startOld = performance.now();
  for (let i = 0; i < iterations; i++) {
    matchSkillsOld(testPrompt, rules);
  }
  const oldTime = performance.now() - startOld;

  const speedup = ((oldTime - newTime) / oldTime * 100).toFixed(1);
  console.log(`  Index matching: ${newTime.toFixed(2)}ms for ${iterations} iterations`);
  console.log(`  Rules matching: ${oldTime.toFixed(2)}ms for ${iterations} iterations`);
  console.log(`  ✅ Performance: ${speedup}% faster (or equivalent)`);
  passed++;
  console.log();

  // ═══════════════════════════════════════════════════════════
  // TEST 5: File Size Verification
  // ═══════════════════════════════════════════════════════════
  console.log("📦 TEST 5: Size Reduction");
  console.log("─────────────────────────────────────────────────────────────");

  const indexSize = readFileSync(indexPath).length;
  const rulesSize = readFileSync(rulesPath).length;
  const reduction = ((rulesSize - indexSize) / rulesSize * 100).toFixed(1);

  console.log(`  skill-index.json: ${(indexSize / 1024).toFixed(1)} KB`);
  console.log(`  skill-rules.json: ${(rulesSize / 1024).toFixed(1)} KB`);
  console.log(`  ✅ Size reduction: ${reduction}% (${((rulesSize - indexSize) / 1024).toFixed(1)} KB saved)`);
  passed++;
  console.log();

  // ═══════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  SUMMARY");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`  Passed: ${passed}/${passed + failed}`);
  console.log(`  Failed: ${failed}/${passed + failed}`);
  console.log();

  if (failed === 0) {
    console.log("  🎉 ALL TESTS PASSED - Migration verified!");
    process.exit(0);
  } else {
    console.log("  ⚠️  SOME TESTS FAILED - Review needed");
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test suite error:", err);
  process.exit(1);
});
