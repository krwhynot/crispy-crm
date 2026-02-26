import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const RULE_DIR = ".claude/rules";
const stripBom = (text) => text.replace(/^\uFEFF/, "");

const normalize = (text) =>
  text
    .toLowerCase()
    .replace(/`/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

/** @type {Map<string, Array<{ruleId:string,file:string,line:number,text:string}>>} */
const byNormalizedText = new Map();

for (const file of readdirSync(RULE_DIR)) {
  if (!file.endsWith(".md")) continue;
  if (file === "RULE_INDEX.md") continue;

  const content = stripBom(readFileSync(join(RULE_DIR, file), "utf8"));
  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    const match = line.match(/^\s*-\s*\[((?:CORE|DB|DOM|MOD|PRV|STALE|UI)-\d{3})\]\s+(.+)$/);
    if (!match) return;

    const [, ruleId, rawText] = match;
    const normalized = normalize(rawText);
    if (!byNormalizedText.has(normalized)) byNormalizedText.set(normalized, []);
    byNormalizedText.get(normalized).push({
      ruleId,
      file,
      line: index + 1,
      text: rawText.trim(),
    });
  });
}

const duplicateGroups = [];
for (const [normalized, entries] of byNormalizedText.entries()) {
  const distinctRuleIds = new Set(entries.map((entry) => entry.ruleId));
  if (distinctRuleIds.size > 1) {
    duplicateGroups.push({ normalized, entries });
  }
}

if (duplicateGroups.length > 0) {
  console.error("Rules duplication check FAILED");
  for (const group of duplicateGroups) {
    console.error(`- duplicated statement: "${group.normalized}"`);
    for (const entry of group.entries) {
      console.error(`  - ${entry.ruleId} at ${entry.file}:${entry.line} -> ${entry.text}`);
    }
  }
  process.exit(1);
}

const totalRules = [...byNormalizedText.values()].reduce((sum, entries) => sum + entries.length, 0);
console.log("Rules duplication check passed.");
console.log(`- normalized statements: ${byNormalizedText.size}`);
console.log(`- rule declarations scanned: ${totalRules}`);
