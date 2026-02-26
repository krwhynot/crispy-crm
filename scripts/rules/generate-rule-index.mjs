import { readFileSync, writeFileSync } from "node:fs";

const legacyPath = ".claude/rules/LEGACY_RULE_ITEMS.json";
const outJsonPath = ".claude/rules/RULE_INDEX.json";
const outMdPath = ".claude/rules/RULE_INDEX.md";

/** @typedef {{itemId:string, sourceFile:string, line:number, type:string, text:string, key:string}} LegacyItem */

/** @type {Record<string, string[]>} */
const ruleSequenceByFile = {
  "CODE_QUALITY.md": [
    "CORE-002",
    "CORE-002",
    "CORE-022",
    "CORE-002",
    "CORE-003",
    "CORE-003",
    "CORE-003",
    "CORE-003",
    "CORE-003",
    "CORE-003",
    "CORE-003",
    "CORE-004",
    "DOM-009",
    "CORE-003",
    "CORE-018",
    "CORE-018",
    "CORE-019",
    "CORE-014",
    "CORE-014",
    "CORE-015",
    "CORE-014",
    "CORE-014",
    "CORE-021",
    "CORE-021",
  ],
  "DATABASE_LAYER.md": [
    "DB-001",
    "DB-003",
    "DB-005",
    "DB-003",
    "DB-007",
    "DB-008",
    "DB-012",
    "DB-010",
    "DB-003",
    "DB-003",
    "DB-001",
    "DB-013",
    "DB-001",
    "DB-001",
    "DB-003",
    "DB-004",
    "DB-010",
    "DB-011",
    "DB-007",
    "DB-003",
    "DB-008",
    "DB-009",
  ],
  "DOMAIN_INTEGRITY.md": [
    "DOM-001",
    "DOM-005",
    "DOM-006",
    "DOM-003",
    "DOM-008",
    "DOM-008",
    "DOM-009",
    "DOM-001",
    "DOM-010",
    "DOM-003",
    "DOM-004",
    "DOM-005",
    "DOM-007",
    "DOM-008",
    "DOM-009",
  ],
  "MODULE_CHECKLIST.md": [
    "MOD-001",
    "MOD-003",
    "MOD-005",
    "MOD-007",
    "MOD-008",
    "MOD-009",
    "MOD-003",
    "MOD-001",
    "MOD-001",
    "MOD-003",
    "MOD-004",
    "MOD-005",
    "MOD-005",
    "MOD-006",
    "MOD-007",
    "MOD-007",
    "MOD-008",
    "MOD-008",
    "MOD-009",
    "MOD-010",
  ],
  "PROVIDER_RULES.md": [
    "PRV-001",
    "PRV-002",
    "PRV-003",
    "PRV-005",
    "PRV-007",
    "PRV-006",
    "PRV-009",
    "PRV-010",
    "PRV-010",
    "PRV-011",
    "PRV-012",
    "PRV-013",
    "PRV-004",
    "PRV-001",
    "PRV-001",
    "PRV-001",
    "PRV-002",
    "PRV-002",
    "PRV-003",
    "PRV-005",
    "PRV-009",
    "PRV-004",
    "PRV-010",
    "PRV-011",
    "PRV-014",
  ],
  "STALE_STATE_STRATEGY.md": [
    "STALE-001",
    "STALE-001",
    "STALE-002",
    "STALE-002",
    "STALE-003",
    "STALE-004",
    "STALE-005",
    "STALE-006",
    "STALE-007",
    "STALE-007",
    "STALE-007",
    "STALE-008",
    "STALE-008",
    "STALE-009",
    "STALE-010",
    "STALE-007",
    "STALE-001",
    "STALE-002",
    "STALE-003",
    "STALE-009",
    "STALE-006",
    "STALE-007",
    "STALE-010",
    "STALE-004",
  ],
  "UI_STANDARDS.md": [
    "UI-001",
    "UI-002",
    "UI-004",
    "UI-005",
    "UI-006",
    "UI-007",
    "UI-007",
    "UI-006",
    "UI-008",
    "UI-001",
    "UI-001",
    "UI-001",
    "UI-006",
    "UI-002",
    "UI-002",
    "UI-006",
    "UI-006",
    "UI-003",
    "UI-003",
    "UI-004",
  ],
};

/** @type {LegacyItem[]} */
const legacyRaw = readFileSync(legacyPath, "utf8").replace(/^\uFEFF/, "");
const legacyItems = JSON.parse(legacyRaw);

const byFile = new Map();
for (const item of legacyItems) {
  if (!byFile.has(item.sourceFile)) byFile.set(item.sourceFile, []);
  byFile.get(item.sourceFile).push(item);
}

for (const [file, items] of byFile) {
  items.sort((a, b) => a.line - b.line);
  const expected = ruleSequenceByFile[file];
  if (!expected) {
    throw new Error(`No rule sequence configured for ${file}`);
  }
  if (expected.length !== items.length) {
    throw new Error(
      `Sequence length mismatch for ${file}: expected ${expected.length}, got ${items.length}`
    );
  }
}

const mapping = [];
for (const [file, items] of [...byFile.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  const seq = ruleSequenceByFile[file];
  for (let i = 0; i < items.length; i += 1) {
    mapping.push({
      itemId: items[i].itemId,
      sourceFile: items[i].sourceFile,
      line: items[i].line,
      type: items[i].type,
      text: items[i].text,
      ruleId: seq[i],
    });
  }
}

mapping.sort((a, b) => Number(a.itemId.slice(1)) - Number(b.itemId.slice(1)));
writeFileSync(outJsonPath, `${JSON.stringify(mapping, null, 2)}\n`, "utf8");

const lines = [];
lines.push("# Rule Index");
lines.push("");
lines.push(
  "This index maps every legacy rule item (`L001`..`L150`) to exactly one stable Rule ID."
);
lines.push("Legacy item definitions (file, line, type, text) live in `LEGACY_RULE_ITEMS.json`.");
lines.push("");
lines.push("## Mapping Ranges");
lines.push("");

for (const [file, _items] of [...byFile.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  const mapped = mapping
    .filter((entry) => entry.sourceFile === file)
    .sort((a, b) => Number(a.itemId.slice(1)) - Number(b.itemId.slice(1)));

  lines.push(`### ${file}`);
  lines.push("");

  let start = mapped[0];
  let prev = mapped[0];

  for (let i = 1; i <= mapped.length; i += 1) {
    const curr = mapped[i];
    const isBreak =
      !curr ||
      curr.ruleId !== prev.ruleId ||
      Number(curr.itemId.slice(1)) !== Number(prev.itemId.slice(1)) + 1;

    if (isBreak) {
      if (start.itemId === prev.itemId) {
        lines.push(`- \`${start.itemId}\` -> \`${start.ruleId}\``);
      } else {
        lines.push(`- \`${start.itemId}-${prev.itemId}\` -> \`${start.ruleId}\``);
      }
      if (curr) start = curr;
    }

    prev = curr;
  }

  lines.push("");
}

lines.push("## Integrity Contract");
lines.push("");
lines.push("- Every `Lxxx` item has exactly one `ruleId` in `RULE_INDEX.json`.");
lines.push("- `RULE_INDEX.md` is a compressed view of the same mapping.");
lines.push("- Run `CMD-008` to enforce one-to-one coverage.");

writeFileSync(outMdPath, `${lines.join("\n")}\n`, "utf8");

console.log(`Generated ${mapping.length} mappings.`);
