import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const RULE_DIR = ".claude/rules";
const DEFAULT_BUDGET = 7000;

const budget = Number(process.env.RULE_TOKEN_BUDGET || DEFAULT_BUDGET);
if (Number.isNaN(budget) || budget <= 0) {
  throw new Error(`Invalid RULE_TOKEN_BUDGET: ${process.env.RULE_TOKEN_BUDGET}`);
}

const stripBom = (text) => text.replace(/^\uFEFF/, "");

const stats = readdirSync(RULE_DIR)
  .filter((file) => file.endsWith(".md"))
  .sort()
  .map((file) => {
    const content = stripBom(readFileSync(join(RULE_DIR, file), "utf8"));
    const chars = content.length;
    const words = content.split(/\s+/).filter(Boolean).length;
    const estTokens = chars / 3.8;
    return { file, chars, words, estTokens };
  })
  .sort((a, b) => b.estTokens - a.estTokens);

const totalChars = stats.reduce((sum, row) => sum + row.chars, 0);
const totalWords = stats.reduce((sum, row) => sum + row.words, 0);
const totalTokens = totalChars / 3.8;

console.log("Rule token budget report");
console.log(`- files: ${stats.length}`);
console.log(`- total chars: ${totalChars}`);
console.log(`- total words: ${totalWords}`);
console.log(`- estimated tokens (chars/3.8): ${Math.round(totalTokens)}`);
console.log(`- budget: ${budget}`);
console.log("- top files:");
for (const row of stats) {
  console.log(`  - ${row.file}: ${Math.round(row.estTokens)} tokens (${row.chars} chars)`);
}

if (totalTokens > budget) {
  console.error(`Rule token budget FAILED: estimated ${Math.round(totalTokens)} > budget ${budget}`);
  process.exit(1);
}

console.log("Rule token budget passed.");
