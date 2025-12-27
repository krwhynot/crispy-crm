# What Is a Code Index, Really?

The index at the back of a textbook changed everything.

Before indexes existed, finding information meant flipping through pages. Hoping you would stumble on what you needed. Wasting hours on what should take seconds.

Then someone had a brilliant idea: read the book once, write down where everything is, and put that list at the back.

Revolutionary.

Code indexes work the same way. And understanding them will change how you think about developer tooling forever.

---

## The Problem

Picture this.

You are working on a codebase with 500 files. You need to find every place that calls the `validateContact` function.

What do you do?

Maybe you grep for it. That works for simple cases. But grep is dumb. It matches text, not meaning. It cannot tell you if `validateContact` is a function, a variable, a comment, or a string literal.

Search for "validateContact" and you will find:
- The actual function definition (good)
- A comment that says "// TODO: implement validateContact" (not helpful)
- A test file that mocks "validateContact" (maybe relevant)
- A string literal "validateContact is deprecated" (definitely not what you want)

Grep cannot tell these apart. It just matches characters.

Maybe you use your IDE's "Find Usages" feature. That works better. Your IDE actually understands code structure. It knows the difference between a function call and a comment.

But have you noticed how it sometimes takes a few seconds? Or how it occasionally misses things in files you have not opened yet?

Here is what happens behind the scenes.

When you click "Find Usages," your IDE has to parse every file that might contain a reference. It builds an in-memory representation of the code. It walks through that representation looking for matches.

For 100 files, this is fast. Maybe a second or two.

Now imagine that codebase is 10,000 files.

Every "Find Usages" request means your IDE has to think harder. Parse more files. Hold more information in memory.

Your laptop has maybe 16GB of RAM. The code representation for a large codebase can easily eat 2-4GB. Add in the memory for your browser, Slack, Spotify, and everything else, and suddenly things get tight.

At some point, things start breaking. Your IDE gets sluggish. Features stop working reliably. The "Go to Definition" that used to be instant now takes 5 seconds. Sometimes it times out entirely.

This is the fundamental problem with on-the-fly code analysis.

Every time you ask a question, the tool has to re-read and re-understand the code. As codebases grow, this becomes unsustainable.

The bigger the codebase, the longer you wait. The more memory you consume. The more likely something crashes.

There has to be a better way.

---

## The Textbook Index Analogy

Back to that textbook index.

Open any programming book. Flip to the back. Find the index.

You will see something like:

```
recursion .......................... 42, 87, 156-159
  base case ....................... 88, 157
  tail recursion .................. 158
```

This tells you everything you need to know:
- The word "recursion" appears on pages 42, 87, and 156-159
- There is a sub-topic "base case" on pages 88 and 157
- There is a sub-topic "tail recursion" on page 158

Notice what the index does NOT do.

It does not reprint the content from those pages. It just tells you where to look. The index is a map, not a copy.

This is exactly what a code index does.

A code index says: "The function `validateContact` is defined at line 47 of `contacts.ts`. It is referenced at line 23 of `ContactForm.tsx`, line 156 of `ContactEdit.tsx`, and line 89 of `api-handlers.ts`."

The index does not contain the actual code. It just knows where everything lives.

But here is the key insight.

Once you build the index, answering questions becomes trivial. You are not parsing code anymore. You are just looking things up.

"Where is recursion mentioned?" Flip to the index. Done.

"Where is `validateContact` used?" Query the index. Done.

No re-reading. No re-parsing. No memory explosion.

---

## What SCIP Actually Captures

SCIP stands for Source Code Intelligence Protocol.

It is an index format created by Sourcegraph. You know, the company that runs code search for millions of developers. GitHub uses it. Meta uses it. It powers the "Go to Definition" and "Find References" features in many tools.

So what does SCIP actually store?

Three things: symbols, definitions, and references.

**Symbols** are the names in your code. Function names. Variable names. Class names. Type names. Interface names. Every named thing gets a symbol.

But SCIP does not just store the name. It stores a fully-qualified path.

Consider this code:

```typescript
// src/validation/contacts.ts
export function validateContact(data: unknown) {
  // ...
}
```

The symbol is not just "validateContact". It is something like:

```
npm @crispy-crm 1.0.0 src/validation/`contacts.ts`/validateContact().
```

That long string uniquely identifies this specific function in this specific file in this specific package. There might be another `validateContact` in a different file. SCIP can tell them apart.

**Definitions** are where symbols are created. The line where you write `function validateContact`. The line where you declare `const userId`. The line where you define `interface Contact`.

SCIP stores the exact file path and line number for every definition.

**References** are where symbols are used. Every time you call `validateContact()`. Every time you read `userId`. Every time you use `Contact` as a type.

SCIP stores every single reference, with file paths and line numbers.

Here is why this matters.

With these three pieces of information, you can answer almost any code navigation question instantly:

- "Where is X defined?" Look up the definition.
- "Where is X used?" Look up all references.
- "What does this file export?" List all definitions in that file.
- "What does this file import?" List all references to symbols defined elsewhere.

No parsing required. Just lookup.

---

## Why SCIP Over LSIF

You might have heard of LSIF. Language Server Index Format. It came before SCIP and tries to solve the same problem.

So why not use LSIF?

Numbers tell the story.

For the same codebase, SCIP produces an index that is 8x smaller than LSIF. Eight times.

SCIP indexes also generate 10x faster than LSIF.

Why such a dramatic difference?

LSIF was designed to be a generic dump of everything a language server knows. It includes hover information, diagnostics, semantic tokens, and a bunch of other stuff that is nice for IDEs but overkill for code navigation.

SCIP was designed from the ground up for one thing: code intelligence. Symbols, definitions, references. That is it.

By focusing on exactly what matters, SCIP stays lean and fast.

There is another difference.

LSIF stores relationships as pointers. "Symbol A is defined at Location 1." "Symbol A is referenced at Location 2, 3, and 4."

SCIP stores relationships by proximity. All the references within a single file are grouped together. This means you can read a SCIP file sequentially, which is much faster than jumping around following pointers.

For a 100,000 line codebase:
- LSIF might produce a 500MB index that takes 10 minutes to generate
- SCIP produces a 60MB index in under a minute

That difference matters when you are running this in CI on every commit.

---

## Let's Build It

Enough theory. Let's make an index.

First, install the TypeScript indexer:

```bash
npm install -D @sourcegraph/scip-typescript
```

This package knows how to read TypeScript code and output a SCIP index.

Now run it:

```bash
npx scip-typescript index --output .claude/state/index.scip
```

That is it. One command.

Let's break down what happens:

1. **Find your `tsconfig.json`** - The indexer needs to know which files belong to your project and how TypeScript is configured. It looks for `tsconfig.json` in the current directory.

2. **Read all the TypeScript files it references** - Whatever files are included by your tsconfig (and not explicitly excluded) get processed.

3. **Parse them using the TypeScript compiler** - This is the same compiler that runs when you do `tsc`. The indexer piggybacks on TypeScript's own understanding of your code.

4. **Extract all symbols, definitions, and references** - For every named thing in your code, record what it is and where it appears.

5. **Write everything to `index.scip`** - Serialize all that information into a compact binary file.

For a medium-sized codebase (50,000 lines), this takes about 30 seconds.

For a larger codebase (500,000 lines), maybe 2-3 minutes.

But here is the beautiful part.

Once the index exists, it sits on disk. It does not use memory until you query it. It does not slow down your editor. It just waits.

Compare that to the old approach where every query required loading the entire codebase into memory.

You can regenerate the index whenever your code changes. In CI, you might run it on every push. Locally, you might run it once a day or whenever you need fresh data.

Some teams even set up file watchers that automatically regenerate the index when source files change. That way the index is always fresh without manual intervention.

The key insight: indexing is a separate step from querying.

Build the index occasionally (when code changes). Query it constantly (whenever you need information).

This separation is what makes code intelligence scale.

---

## Deep Dive: Inside the .scip File

Curious what is actually in that `.scip` file?

SCIP uses Protocol Buffers (protobuf) for serialization. Protobuf is a binary format, so you cannot just open the file in a text editor. But you can decode it.

At the top level, a SCIP index has this structure:

```protobuf
message Index {
  Metadata metadata = 1;
  repeated Document documents = 2;
  repeated SymbolInformation external_symbols = 3;
}
```

**Metadata** contains basic info: the version of SCIP, what tool created the index, the root path of the project.

**Documents** is where the real data lives. Each document represents one source file.

**External symbols** are symbols defined outside your project (in dependencies) that your code references.

Let's zoom into a document:

```protobuf
message Document {
  string relative_path = 1;
  repeated Occurrence occurrences = 2;
  repeated SymbolInformation symbols = 3;
}
```

**relative_path** is the file path (like `src/validation/contacts.ts`).

**occurrences** is a list of every symbol occurrence in the file. Each occurrence has:
- A range (start line, start column, end line, end column)
- A symbol identifier (that long string from earlier)
- A role (definition, reference, import, export, etc.)

**symbols** contains information about symbols defined in this file. Each one has:
- The symbol identifier
- Documentation (if any)
- The symbol kind (function, variable, class, etc.)
- Relationships to other symbols

Here is what an occurrence might look like for our `validateContact` function:

```
Occurrence {
  range: [47, 16, 47, 31]  // line 47, columns 16-31
  symbol: "npm @crispy-crm 1.0.0 src/validation/`contacts.ts`/validateContact()."
  symbol_roles: DEFINITION
}
```

And a reference to it elsewhere:

```
Occurrence {
  range: [23, 8, 23, 23]  // line 23, columns 8-23
  symbol: "npm @crispy-crm 1.0.0 src/validation/`contacts.ts`/validateContact()."
  symbol_roles: REFERENCE
}
```

The symbol identifier is the same in both cases. That is how you know they are referring to the same function.

To find all references, you just scan through all documents looking for occurrences with that symbol identifier and the REFERENCE role. With a proper data structure (like a hash map from symbol to occurrences), this is extremely fast.

Here is a concrete example of what a query might look like:

```
Query: "Find all references to validateContact"

1. Look up symbol by name: "validateContact"
   → Found: "npm @crispy-crm 1.0.0 src/validation/`contacts.ts`/validateContact()."

2. Scan all occurrences for that symbol with REFERENCE role
   → Found 3 matches:
     - src/components/ContactForm.tsx:23
     - src/components/ContactEdit.tsx:156
     - src/api/handlers.ts:89

3. Return results
```

The entire operation takes milliseconds.

Compare that to parsing 500 files looking for function calls. The index approach wins by orders of magnitude.

---

## Watch Out For

[GOTCHA: TBD after implementation]

Real-world code indexing has sharp edges. Here are the ones we have discovered so far:

**Build before indexing.** SCIP uses the TypeScript compiler, which needs your code to type-check. If you have compilation errors, the indexer might skip those files or produce incomplete data. Always run `tsc --noEmit` first to make sure your code compiles.

**Watch your tsconfig scope.** The indexer only processes files included by your `tsconfig.json`. If you have a `tsconfig.json` that excludes certain directories (like test files), those files will not be indexed. For complete coverage, you might need a separate tsconfig just for indexing.

**Dependencies are external.** By default, SCIP treats everything in `node_modules` as external. You get references TO those dependencies, but not the internal structure OF those dependencies. This is usually what you want, but be aware of it.

**Regenerate after refactoring.** The index is a snapshot. If you rename a function or move a file, the old index is stale. In active development, regenerate frequently. In CI, regenerate on every change.

**Binary files can get big.** For very large codebases (1M+ lines), the SCIP file can be 100MB+. That is still way smaller than keeping everything in memory, but it is worth knowing. Consider whether you want to commit it to git or regenerate it in CI.

More gotchas will emerge as we run this in production. This section will grow.

---

## What's Next

Now you know what a code index is and why it matters.

You understand the difference between on-the-fly parsing (slow, memory-hungry) and pre-computed indexing (fast, disk-based).

You can generate a SCIP index for your TypeScript codebase with two commands.

But generating the index is just the beginning.

An index file sitting on disk is like an unread encyclopedia. All the information is there, but you need a way to access it.

The next article covers how to query a SCIP index. How to extract the symbols, definitions, and references you need. How to turn that raw data into structured output that tools can consume.

We will build actual query functions. We will extract component hierarchies. We will trace dependencies across files.

Because the magic is not in having an index. The magic is in asking it questions and getting answers instantly.

That is where we are headed next.

---

## Quick Reference

**Install scip-typescript:**
```bash
npm install -D @sourcegraph/scip-typescript
```

**Generate an index:**
```bash
npx scip-typescript index --output .claude/state/index.scip
```

**SCIP stores:**
- Symbols (fully-qualified names)
- Definitions (where symbols are created)
- References (where symbols are used)

**SCIP vs LSIF:**
- 8x smaller files
- 10x faster generation
- Focused on code navigation, not everything

**Key insight:**
Index once, query many times. Separate the expensive work (parsing) from the frequent work (answering questions).

**When to regenerate:**
- After refactoring or renaming
- After adding new files
- In CI on every push
- Locally when starting a new work session

---

*This is part 2 of a series on scaling codebase discovery. Part 1 covered why we need a new approach. Part 3 will cover querying SCIP indexes to extract meaningful information.*
