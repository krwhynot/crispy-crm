import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const RULE_DIR = ".claude/rules";
const LEGACY_PATH = join(RULE_DIR, "LEGACY_RULE_ITEMS.json");
const INDEX_PATH = join(RULE_DIR, "RULE_INDEX.json");

const stripBom = (text) => text.replace(/^\uFEFF/, "");
const parseJson = (path) => JSON.parse(stripBom(readFileSync(path, "utf8")));

const legacy = parseJson(LEGACY_PATH);
const index = parseJson(INDEX_PATH);

const errors = [];
const warn = [];

if (!Array.isArray(legacy) || !Array.isArray(index)) {
  throw new Error("Legacy/index JSON must be arrays.");
}

const legacyIds = new Set(legacy.map((item) => item.itemId));
const mapByItem = new Map();
for (const entry of index) {
  if (!mapByItem.has(entry.itemId)) mapByItem.set(entry.itemId, []);
  mapByItem.get(entry.itemId).push(entry);
}

for (const id of legacyIds) {
  const mapped = mapByItem.get(id) || [];
  if (mapped.length === 0) {
    errors.push(`Missing mapping for ${id}`);
  } else if (mapped.length > 1) {
    errors.push(`Multiple mappings for ${id}`);
  }
}

for (const id of mapByItem.keys()) {
  if (!legacyIds.has(id)) {
    errors.push(`Index contains unknown legacy item ${id}`);
  }
}

const ruleIdPattern = /^(CORE|DB|DOM|MOD|PRV|STALE|UI)-\d{3}$/;
for (const entry of index) {
  if (!ruleIdPattern.test(entry.ruleId)) {
    errors.push(`Invalid ruleId format: ${entry.itemId} -> ${entry.ruleId}`);
  }
}

const definedRuleIds = new Set();
for (const file of readdirSync(RULE_DIR)) {
  if (!file.endsWith(".md")) continue;
  const content = readFileSync(join(RULE_DIR, file), "utf8");
  const lines = stripBom(content).split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\s*-\s*\[((?:CORE|DB|DOM|MOD|PRV|STALE|UI)-\d{3})\]\s+/);
    if (match) definedRuleIds.add(match[1]);
  }
}

for (const entry of index) {
  if (!definedRuleIds.has(entry.ruleId)) {
    errors.push(`Mapped ruleId is not defined in rule markdown: ${entry.itemId} -> ${entry.ruleId}`);
  }
}

if (index.length !== legacy.length) {
  warn.push(`Index size (${index.length}) differs from legacy item count (${legacy.length}). Coverage checks still enforce one-to-one by itemId.`);
}

if (errors.length > 0) {
  console.error("Rules coverage check FAILED");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Rules coverage check passed.");
console.log(`- legacy items: ${legacy.length}`);
console.log(`- mapped entries: ${index.length}`);
console.log(`- unique mapped rule IDs: ${new Set(index.map((e) => e.ruleId)).size}`);

for (const message of warn) {
  console.log(`WARN: ${message}`);
}
