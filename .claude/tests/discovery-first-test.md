# Discovery-First Skill Test

Copy this entire prompt into a NEW Claude Code session to test if the discovery-first skill is working correctly.

---

## TEST PROMPT (copy everything below this line)

```
I want to test if you're using the discovery files correctly. Please answer these questions:

## Test 1: Component Inventory
What components exist in src/atomic-crm/contacts/? List their names and what hooks they use.

IMPORTANT: Do NOT grep or scan source files. Use the discovery inventory at `.claude/state/component-inventory/contacts.json`

## Test 2: Hooks Inventory
How many custom hooks exist in this codebase? List 5 of them with their dependencies.

IMPORTANT: Read from `.claude/state/hooks-inventory.json`, not source files.

## Test 3: Schema Inventory
What Zod schemas exist for the opportunities feature?

IMPORTANT: Use `.claude/state/schemas-inventory/` not source files.

---

After answering, please tell me:
1. Which files did you READ to answer these questions?
2. Did you use Grep, Glob, or Task/Explore agents?
3. How many seconds did it take to answer?

This helps me verify you're using discovery files (fast, ~30KB) vs source scanning (slow, ~500KB).
```

---

## EXPECTED RESULTS

### What You Should See:

**Tool Calls (watch your terminal):**
```
┌─ Read ─────────────────────────────────────────────────┐
│ .claude/state/component-inventory/contacts.json       │
└────────────────────────────────────────────────────────┘

┌─ Read ─────────────────────────────────────────────────┐
│ .claude/state/hooks-inventory.json                    │
└────────────────────────────────────────────────────────┘

┌─ Read ─────────────────────────────────────────────────┐
│ .claude/state/schemas-inventory/opportunities.json    │
└────────────────────────────────────────────────────────┘
```

**Skill Activation (at session start):**
```
🎯 SKILL ACTIVATION CHECK
━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 RECOMMENDED SKILLS:
  → discovery-first
```

### What You Should NOT See:

❌ `Grep("pattern", src/atomic-crm/**/*.tsx)`
❌ `Glob(src/atomic-crm/**/*.tsx)`
❌ `Read(src/atomic-crm/contacts/ContactList.tsx)`
❌ `Task(subagent_type=Explore)`

### Performance Indicators:

| Metric | Discovery Used ✅ | Source Scanning ❌ |
|--------|-------------------|---------------------|
| Response time | < 5 seconds | 15-30+ seconds |
| Files read | 3-5 JSON files | 50-100+ source files |
| Token usage | ~30KB | ~500KB |

---

## CANARY TEST (Optional Advanced Verification)

Run this BEFORE your test session to add a unique string:

```bash
# Add canary to a component
echo "// DISCOVERY_CANARY_TEST_$(date +%s)" >> src/atomic-crm/contacts/ContactList.tsx

# DON'T regenerate discovery - leave it stale
```

Then ask Claude:
```
Does ContactList.tsx contain the string "DISCOVERY_CANARY_TEST"?
```

**Results:**
- "No" = Claude read discovery files (canary not in JSON) ✅
- "Yes" = Claude read source files directly ❌

**Clean up after:**
```bash
git checkout src/atomic-crm/contacts/ContactList.tsx
```

---

## TROUBLESHOOTING

| Problem | Cause | Fix |
|---------|-------|-----|
| Skill not showing in activation | skill-rules.json not loaded | Restart Claude Code session |
| Claude still scans sources | Explicit instructions needed | Add "use discovery files" to prompt |
| Wrong component count | Discovery is stale | Run `just discover` |
| JSON parse errors | skill-rules.json syntax | Run `jq . .claude/skills/skill-rules.json` |
