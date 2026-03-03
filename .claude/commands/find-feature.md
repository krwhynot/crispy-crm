---
description: "Find a feature in the codebase by name, domain, or keyword. Interactive: always asks if the developer wants a quick scan or a deep scan with 95%+ confidence verification."
argument-hint: <feature name or keyword>
allowed-tools: Read, Grep, Glob, Bash
---

Search for "$1" to help the developer locate and understand a feature.

**Step 0: Detect category search**

Some keywords are too broad to match a single feature. They describe a category
of components across the entire codebase. Detect these and switch to filtered
list mode:

Category keywords:
- "UI", "UX", "forms", "screens", "views", "windows" -> list all UI components (forms, pages, views, routes)
- "API", "endpoints", "services", "REST", "providers" -> list all service integrations
- "database", "tables", "SQL", "data" -> list all data access components
- "tests", "testing", "coverage" -> list test coverage by module
- "security", "auth", "credentials" -> list security-related findings
- "hardware", "printer", "COM", "serial" -> list hardware integrations

If a category keyword is detected:
```
"$1" is a broad category. Here's a filtered view from the baseline:

  [Table showing all matching components with: name, domain, file count,
   confidence, risk level]

  Total: N components across M domains

  Want to drill into a specific one?
  [1] [component name] - deep scan
  [2] [component name] - deep scan
  ...
  [N] Export this list as markdown
```

If "$1" is NOT a category keyword, proceed to Step 1 (normal feature search).

**Step 1: Search the JSON baseline**

Read `docs/audit/baseline/feature-inventory.json` and search for features
matching "$1" by name, domain, namespace, or entry point keywords.

If no baseline exists, skip to Step 3 (live search).

**Step 2: Present findings and ask**

Show the developer what was found:
- Feature name, domain, confidence score
- Linked documents (BRD, PRD, ADR) if any
- Current status (verified, unverified-missing, etc.)

Then ask:

"How would you like to explore this?"
1. **Quick scan** - Show location, tables, risk level, linked docs (done in seconds)
2. **Deep scan** - Read actual source files, trace code paths, verify to 95%+ confidence (2-3 minutes)

Wait for the developer's choice.

**Step 3: Quick Scan (if chosen)**

Pull from the JSON baseline and risk-assessment.json:
- **Location:** Project, namespace, key files
- **Entry Points:** Forms, controllers, or service methods
- **Database Tables:** Tables this feature reads or writes
- **External Dependencies:** APIs, hardware, services
- **Test Coverage:** What tests exist (or don't)
- **Risk Level:** Safe / Caution / High Risk
- **Phase:** 1 / 2 / 3
- **Linked Docs:** BRD, PRD, ADR links (or "None")
- **Notes:** Any assumptions or requires-review flags

**Step 4: Deep Scan (if chosen)**

Go beyond the baseline:
1. Read every entry point file listed for this feature
2. Trace callers and callees using Grep
3. Read database access code to confirm table names
4. Check for feature flags that gate this feature
5. Search for test files that cover this feature
6. Verify or correct every [ASSUMPTION] tag

After verification:
- Update the feature's confidence score in feature-inventory.json
- Add a confidence_history entry with today's date and source "deep-scan"
- Validate the JSON after writing

Then present the detailed findings:
- Full code path walkthrough
- Confirmed database tables (with file:line evidence)
- All callers found across the codebase
- Feature flags that control behavior
- Test coverage details
- Updated confidence score

Finally ask:
"Would you like to generate a PRD for this feature?"
1. Yes (will be available in Phase 2 build)
2. No, I have what I need

**Step 5: Feature Not Found**

If the feature is NOT in the baseline JSON, search the live codebase:
- Grep for "$1" across all .ts and .tsx files
- Glob for files with "$1" in their name
- Present findings with a note: "This feature was not found in the audit
  baseline. Run /audit to include it in the next scan."

Keep all responses concise. Developers want quick reference, not full reports.
