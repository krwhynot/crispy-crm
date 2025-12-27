# Phase 1 Explained: Installing SCIP

**What We're Doing and Why (For Complete Beginners)**

---

## The Big Picture

Before we dive into commands, let's understand what problem we're solving.

Right now, our discovery system uses a tool called ts-morph to read TypeScript code. It's like having a very thorough but very slow librarian. They read every single book from cover to cover just to answer one question about your library.

We're replacing that with SCIP. It's like hiring a professional archivist who creates an index once, then can answer any question instantly by looking things up.

---

## What is scip-typescript?

Think of scip-typescript as a professional archivist you're hiring for your codebase.

Instead of reading through your code every time you have a question, this archivist goes through everything once and creates a detailed catalog. Every function, every component, every import - all cataloged and cross-referenced.

The technical name is "indexer." It indexes your code. But really, it's just making a searchable map of everything in your project.

**Why this matters:** Our current tool (ts-morph) loads your entire codebase into memory every time it runs. For big projects, your computer runs out of memory and crashes. SCIP creates a file on disk instead - your computer's memory doesn't care how big your project is.

---

## What is an "Index" in This Context?

Open any textbook and flip to the back. See that index? "Arrays, page 47. Functions, page 89."

That's exactly what `index.scip` is for your code.

Instead of "page numbers," it stores "file paths and line numbers." Instead of "topic names," it stores "function names and component names."

When you want to know "where is the ContactList component used?", the index already knows. No searching required.

**The file we create:** `.claude/state/index.scip`

This single file contains the complete map of your codebase. It's binary (computer-readable), so you can't open it in a text editor. But it's incredibly efficient.

---

## Command #1: Installing the Tool

```bash
npm install -D @sourcegraph/scip-typescript
```

**What does this actually do?**

It's like ordering the archiving tool from a catalog (npm is the catalog, Sourcegraph makes the tool).

Let's break down each part:

- `npm install` - "Download and install this package"
- `-D` - "This is a dev dependency"
- `@sourcegraph/scip-typescript` - "The package name"

**What's a dev dependency?**

The `-D` flag means "only needed during development."

It's like the difference between kitchen equipment and ingredients. When you ship a meal to a customer, they get the ingredients (the app). They don't need your oven or mixing bowls (development tools).

SCIP is a tool we use to build things. Users never need it.

---

## Command #2: Creating the Index

```bash
npx scip-typescript index --output .claude/state/index.scip
```

This is the main event. Let's decode it:

**What is `npx`?**

It runs a command from a package you've installed. Think of npm as "the store where you buy tools" and npx as "using the tool you bought."

**What is `scip-typescript index`?**

This tells our archivist: "Go catalog everything."

**What is `--output .claude/state/index.scip`?**

This says: "Put the finished catalog in this specific folder, with this specific filename."

It's like telling the archivist: "When you're done, file the catalog in the `.claude/state/` drawer and label it `index.scip`."

---

## Command #3: Installing the SCIP CLI

```bash
npm install -g @sourcegraph/scip
```

Wait, another install? What's the difference?

The first package (`scip-typescript`) creates indexes. This package (`scip`) reads them and creates human-readable versions.

**What's the `-g` flag?**

It means "global" - install this for your whole computer, not just this project.

It's like the difference between a power drill you keep in one workshop versus one you can use in any room of the house.

We install this globally because you might want to inspect SCIP indexes from multiple projects.

---

## Command #4: Creating Snapshots

```bash
scip snapshot --from .claude/state/index.scip --to .claude/state/scip-snapshot/
```

The index file is binary. Your eyes can't read it. Snapshots convert it to something humans can understand.

**Why would you want this?**

Debugging. "Did SCIP actually find my ContactList component? Let me check."

You open the snapshot folder and can see plain text files showing exactly what got indexed.

Think of it like this: The index is the filing system. The snapshot is a printed report of what's in the filing system.

---

## Wait, What Are We Deleting?

The plan mentions deleting `scripts/discover/utils/project.ts`. Why?

This file contains our old ts-morph setup. It's like returning rental equipment after buying your own.

We rented ts-morph to do the job. Now we own SCIP. We don't need the rental anymore.

**Important:** Don't delete this file until SCIP is working. Verify first, delete second.

---

## What Does "< 10MB" Mean?

The verification says: "`.claude/state/index.scip` generated (< 10MB for current codebase)"

This is a sanity check. SCIP indexes are remarkably efficient.

It's like checking the size of your filing cabinet. If you index a small office and the cabinet takes up an entire warehouse, something went wrong.

For our codebase (around 500 files), the index should be under 10MB. If it's 500MB, we have a problem. If it's 3MB, that's perfect.

SCIP typically produces indexes that are smaller than the source code they describe. That's part of why it's so good.

---

## What Could Go Wrong?

### "Command not found: scip-typescript"

You forgot to install it. Run the npm install command again.

### "Could not find tsconfig.json"

SCIP needs your TypeScript configuration file. Make sure you're running from the project root (where `package.json` lives).

### The index is way bigger than expected

Something might be indexing `node_modules`. Check if there's a `.scipignore` file or similar. We only want to index our source code, not dependencies.

### Snapshots look empty

The index might have failed silently. Re-run the index command and watch for errors.

---

## You Know You're Done When...

Open a terminal and run through this checklist:

1. **The index command completes without errors**
   ```bash
   npx scip-typescript index --output .claude/state/index.scip
   ```
   You should see progress output, then completion. No red error messages.

2. **The index file exists and has reasonable size**
   ```bash
   ls -lh .claude/state/index.scip
   ```
   You should see a file. Size should be a few MB (not 0 bytes, not 500MB).

3. **Snapshots generate successfully**
   ```bash
   scip snapshot --from .claude/state/index.scip --to .claude/state/scip-snapshot/
   ls .claude/state/scip-snapshot/
   ```
   You should see files in the snapshot directory.

4. **Snapshots contain your code**
   Pick any file in the snapshot folder and open it. You should see references to actual components and functions from your codebase.

---

## Quick Summary

| Step | Command | What It Does |
|------|---------|--------------|
| 1 | `npm install -D @sourcegraph/scip-typescript` | Get the indexing tool |
| 2 | `npx scip-typescript index --output .claude/state/index.scip` | Create the index |
| 3 | `npm install -g @sourcegraph/scip` | Get the snapshot tool |
| 4 | `scip snapshot --from ... --to ...` | Create human-readable output |

---

## What's Next?

Phase 1 gives us the raw catalog. Phase 2 teaches our discovery system how to read that catalog instead of using ts-morph.

Think of it this way: Phase 1 hired the archivist and got the catalog. Phase 2 trains the staff to use the catalog instead of wandering through the stacks.

---

## Glossary

| Term | Plain English |
|------|---------------|
| **SCIP** | A format for storing code information (like PDF is a format for documents) |
| **Index** | The catalog file that describes your code |
| **Snapshot** | Human-readable version of the index |
| **ts-morph** | The old tool we're replacing |
| **Dev dependency** | A tool used during development, not shipped to users |
| **npx** | A way to run commands from installed packages |
| **Binary file** | A file meant for computers, not human eyes |
