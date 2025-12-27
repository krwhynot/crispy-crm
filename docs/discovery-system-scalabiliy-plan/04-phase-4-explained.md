# Phase 4 Explained: Making It Automatic and Reliable

You have built an amazing discovery system. But here is the problem: humans forget things.

You will forget to run `just discover` after changing code. Your teammates will forget. And when the discovery index gets out of sync with the actual code, Claude gets confused and gives wrong answers.

Phase 4 solves this by making a robot do the remembering for you.

---

## What is a justfile?

Think of a justfile like a recipe book for your terminal.

When you want to bake cookies, you do not memorize "preheat to 350, mix flour and sugar, add eggs, bake for 12 minutes" every time. You just open the recipe book.

A justfile works the same way. Instead of typing `npx tsx scripts/discover/index.ts --output .claude/state/`, you just type `just discover`. The justfile remembers the complicated command so you do not have to.

---

## What is CI (Continuous Integration)?

Imagine a security guard at a building entrance.

Every person who tries to enter gets their ID checked. No exceptions. The guard does not get tired, does not take breaks, and never says "eh, you look trustworthy, go ahead."

CI is that security guard for your code. Every time someone tries to add code to the project, CI runs automated tests. If any test fails, the code cannot get in.

---

## What is GitHub Actions?

It is like hiring a robot butler that lives at GitHub.

You write instructions in a special file. Every time you push code, GitHub wakes up your robot butler and says "follow these instructions." The butler runs your tests and reports back.

```yaml
name: Discovery Staleness Check
on: [pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: just discover-check
```

In plain English: "When someone opens a pull request, grab the code, install dependencies, and run the staleness check."

---

## What is a "staleness check"?

Picture the expiration date on a carton of milk.

If you do not check the date, you might pour spoiled milk into your coffee. The expiration date tells you whether the milk is still valid.

A staleness check works the same way. When we run `just discover`, we record the current state of all source files. Later, we compare that recorded state against the actual files. If you changed `ContactList.tsx` but did not re-run discovery, the index is "stale" - like expired milk.

---

## Why hash files?

Think of a fingerprint.

Every person has a unique fingerprint. If you want to know whether two people are the same, you do not need to compare their entire bodies. Just compare fingerprints.

File hashing creates a fingerprint for files. We crunch the entire file contents down into a short string like `a3f8b2c1`. If even one character changes, the hash changes completely. This is way faster than comparing files character by character.

```typescript
function hashFile(filePath: string): string {
  const content = fs.readFileSync(filePath, 'utf-8');
  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);
}
```

---

## What does exit code 0 vs 1 mean?

It is like a thumbs up or thumbs down.

When a program finishes running, it sends a secret signal back to the terminal. Zero means "everything went great" (thumbs up). Any other number means "something went wrong" (thumbs down).

CI watches for this signal. If your staleness check returns 0, CI says "passed!" If it returns 1, CI says "failed!" and blocks your code.

```typescript
process.exit(stale ? 1 : 0);  // thumbs down (1) or thumbs up (0)
```

---

## Why remove ts-morph?

Imagine you buy a new winter coat. Your old coat still works, but now you have two coats taking up closet space. Every time you open the closet, you think "which coat do I wear today?"

ts-morph was the old way we analyzed code. SCIP is the new way. Keeping both means larger installs, confusion about which to use, and unmaintained code. Once SCIP is working, we delete ts-morph. Clean closet, clear mind.

---

## What is a manifest?

Picture a shipping receipt that lists everything in a box.

When Amazon ships you a package, they include a slip: "1x Blue Shirt, 1x USB Cable." If something is missing, you check the receipt.

Our manifest records every source file we indexed and each file's fingerprint. The staleness check compares this receipt against reality.

```json
{
  "sourceHashes": {
    "src/contacts/ContactList.tsx": "a3f8b2c1d4e5f6a7"
  },
  "generatedAt": "2025-12-27T10:30:00Z"
}
```

---

## The justfile Recipes

| Command | What it does |
|---------|--------------|
| `just discover` | Runs full discovery: SCIP index + extraction + embeddings |
| `just discover-check` | Checks if discovery is stale (for CI) |
| `just discover-scip` | Just generates the SCIP index |
| `just discover-embeddings` | Just generates semantic search embeddings |

Think of these like microwave presets. One button for popcorn, one for defrost. Each does something specific without you needing to remember the settings.

---

## The CI Workflow Step by Step

When you open a pull request:

1. **Checkout** - The robot butler grabs your code from GitHub
2. **Setup Node** - Installs the right version of Node.js
3. **Install deps** - Runs `npm ci` to install packages
4. **Staleness check** - Runs `just discover-check`

If step 4 returns exit code 1, your PR gets a red X. You cannot merge until you run `just discover` and commit the updated index. No exceptions, no "I forgot."

---

## Cleanup: Why It Matters

After Phase 4, we delete `scripts/discover/utils/project.ts` and remove `ts-morph` from package.json.

This is not just tidying up. Leftover code causes problems: someone might accidentally import the old code, security scanners flag outdated dependencies, and new developers get confused. Delete the old. Embrace the new.

---

## The Full Picture: How All 4 Phases Connect

```
Phase 1: SCIP Installation → "Install a better code analyzer"
              |
Phase 2: Extractor Migration → "Rewrite discovery to use SCIP"
              |
Phase 3: Qdrant + Ollama → "Add semantic search with AI"
              |
Phase 4: CI Integration → "Automate everything"
```

Think of it like building a house. Phase 1 buys better power tools. Phase 2 frames the walls. Phase 3 installs smart home features. Phase 4 sets up the security system.

You do not skip the security system just because the house is built. It protects everything you created.

---

## Verification Checklist

Before calling Phase 4 complete:

- [ ] `just discover` completes in under 30 seconds
- [ ] `just discover-check` returns exit code 0 when fresh
- [ ] `just discover-check` returns exit code 1 when stale
- [ ] CI workflow runs on pull requests
- [ ] No ts-morph imports remain in the codebase
- [ ] ts-morph removed from package.json

Run each check. Do not assume. Verify.

---

## What Success Looks Like

After completing Phase 4, you will have one command that does everything, CI that blocks stale code automatically, no old dependencies cluttering your project, and documentation that matches reality.

Most importantly, you will have confidence that Claude always sees accurate information about your codebase.

Congratulations - you have completed the entire discovery system scalability plan. Go build something amazing.
