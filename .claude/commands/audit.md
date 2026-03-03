---
description: "Run a full Three Pillars codebase audit. Deploys 6 specialized agents in phases, validates JSON output, cross-references findings, and produces standardized reports. On subsequent runs, loads previous baselines and improves confidence incrementally."
allowed-tools: Read, Write, Grep, Glob, Bash
---

<context>
You are the lead orchestrator for a Three Pillars codebase audit. You coordinate
a team of specialized subagents that work in parallel, validate their output,
synthesize findings, and produce a final report.

This is a self-improving system. Each audit run loads previous JSON baselines,
compares against the current codebase, increases confidence on verified items,
and flags items where confidence has decayed.
</context>

<autonomy level="conservative">
This is a read-only audit. Do not modify any source files. The only files you
and your subagents should create or update are in docs/audit/.
</autonomy>

<workflow>

**Phase 0 - Setup and Reconnaissance (you do this directly)**

```bash
mkdir -p docs/audit/baseline docs/audit/reports
```

Scan the top-level directory structure. Count modules, packages, and directories.
Check if previous baselines exist in docs/audit/baseline/:
- If yes: this is an incremental run. Note the previous audit date from audit-meta.json.
- If no: this is a first run. All agents will create baselines from scratch.

**Phase 1 - Discovery (deploy these 3 agents in parallel)**

Each agent writes to its own separate JSON file (no write conflicts):

1. **feature-scanner** -> docs/audit/baseline/feature-inventory.json
   Instruction: "Crawl the codebase and produce a feature inventory as JSON.
   If docs/audit/baseline/feature-inventory.json exists, read it as the
   previous baseline and improve incrementally. Apply confidence decay rules
   for missing or significantly changed files."

2. **dependency-mapper** -> docs/audit/baseline/dependency-map.json
   Instruction: "Map all project dependencies as JSON. If a previous baseline
   exists, read it and note changes."

3. **documentation-auditor** -> docs/audit/baseline/documentation-coverage.json
   Instruction: "Catalog all existing documentation as JSON. If a previous
   baseline exists, read it and track improvements."

Wait for all three to complete.

**JSON Validation Gate (you do this directly)**

After Phase 1 completes, validate each JSON file:

```bash
node -e "JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'))" docs/audit/baseline/feature-inventory.json > /dev/null 2>&1 && echo "feature-inventory: VALID" || echo "feature-inventory: INVALID"
node -e "JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'))" docs/audit/baseline/dependency-map.json > /dev/null 2>&1 && echo "dependency-map: VALID" || echo "dependency-map: INVALID"
node -e "JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'))" docs/audit/baseline/documentation-coverage.json > /dev/null 2>&1 && echo "documentation-coverage: VALID" || echo "documentation-coverage: INVALID"
```

If any file is INVALID:
- Read the file to identify the JSON error
- Re-deploy the agent with instructions to fix the JSON
- If it fails twice, fall back to the previous baseline for that file and log the failure

**Phase 2 - Analysis (deploy these 2 agents in parallel)**

Each agent reads Phase 1 JSON summaries and writes to its own file:

4. **risk-assessor** -> docs/audit/baseline/risk-assessment.json
   Instruction: "Assess risk for every module. Read the summary sections from
   feature-inventory.json, dependency-map.json, and documentation-coverage.json
   for context. If a previous risk-assessment.json exists, read it as baseline."

5. **integration-scanner** -> docs/audit/baseline/integration-map.json
   Instruction: "Identify all external integration touchpoints. If a previous
   baseline exists, read it and track changes."

Wait for both to complete.

**JSON Validation Gate**

```bash
node -e "JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'))" docs/audit/baseline/risk-assessment.json > /dev/null 2>&1 && echo "risk-assessment: VALID" || echo "risk-assessment: INVALID"
node -e "JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'))" docs/audit/baseline/integration-map.json > /dev/null 2>&1 && echo "integration-map: VALID" || echo "integration-map: INVALID"
```

Same fallback logic as Phase 1 if invalid.

**Phase 3 - Synthesis (you do this directly)**

Read the `summary` section from each of the 5 JSON baselines. Do NOT load full
files into context unless you need to drill into a specific finding.

Cross-reference:
- Dependency map high-coupling modules against risk assessment ratings
- Feature inventory dead code items against integration scanner findings
- Documentation gaps against risk levels (undocumented high-risk = priority)

Scan for document linkage:
- List all files in docs/brds/, docs/prds/, docs/adrs/
- For each feature in feature-inventory.json, check if BRD/PRD/ADR exists
- Write linkage data to docs/audit/baseline/document-linkage.json

Update audit metadata:
- Write docs/audit/baseline/audit-meta.json with run timestamp, confidence
  deltas, and summary of changes

**Phase 4 - Report Generation (deploy sequentially)**

6. **report-generator**
   Instruction: "Read all JSON baselines in docs/audit/baseline/ and produce
   Markdown reports in docs/audit/reports/. Include the confidence changelog
   and document coverage gap summary."

Wait for completion.

**Final Summary**

After Phase 4, print a summary:
- Confidence changes (items upgraded, decayed, new, unchanged)
- Document coverage (BRDs, PRDs, ADRs found vs. gaps)
- Security issues count
- High risk module count
- Location of reports
</workflow>

<scaling_rules>
Scale effort to codebase size:
- Small (< 10 modules): agents can read most files directly
- Medium (10-30 modules): agents sample 3-5 files per module, read critical ones fully
- Large (30+ modules): agents read summaries and samples, drill into specifics only for high-risk modules
</scaling_rules>

<context_awareness>
If your context window approaches its limit during Phase 3 synthesis:
1. Save current state to audit-meta.json
2. Write a synthesis-progress note listing what's been cross-referenced
3. Continue with report generation using what you have
Do not stop the audit early due to token concerns.
</context_awareness>
