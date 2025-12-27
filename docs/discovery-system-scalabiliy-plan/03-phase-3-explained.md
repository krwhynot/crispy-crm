# Phase 3 Explained: The Integration Layer

> **Reading Time:** 12-15 minutes
> **Goal:** Understand how Claude Code talks to our discovery system through MCP

---

## Wait, What Is This About?

You have been reading about building search databases and vector embeddings. Now suddenly we are talking about "MCP servers" and "tools." What happened?

Here is the situation.

We built two powerful search systems:
1. **Phase 1:** A precision search that knows exactly where every function is defined
2. **Phase 2:** A semantic search that understands meaning, not just keywords

But there is a problem. These systems just sit there. They are like having a brilliant research librarian locked in a basement office with no phone line. The librarian has all the answers, but nobody can ask them questions.

Phase 3 builds the phone line.

We are creating a way for Claude Code (the AI assistant you are talking to right now) to call our search systems directly. When you ask "where is the form validation code?", Claude will not just search text files. Claude will pick up the phone and ask our specialized research librarian.

---

## What Is MCP?

MCP stands for Model Context Protocol.

Think of it this way. You walk into a restaurant. You do not go into the kitchen and start cooking. Instead, you look at a menu, choose items, and tell the waiter what you want. The waiter takes your order to the kitchen. The kitchen prepares the food. The waiter brings it back to you.

MCP is the waiter.

It is a standardized way for AI assistants like Claude to:
1. See what capabilities are available (the menu)
2. Request specific actions (placing an order)
3. Receive results (getting your food)

Without MCP, Claude would have to run raw commands, parse text output, and hope things work. With MCP, Claude reads a clean menu of tools, calls them with proper parameters, and receives structured data back.

The protocol is simple but powerful. Claude asks "what can you do?" The MCP server responds with a list of tools. Claude picks a tool, provides inputs, and gets outputs. Like ordering from a menu.

---

## What Is an MCP Server?

The MCP server is like the restaurant's front-of-house manager.

It stands between Claude (the customer) and your code (the kitchen). When Claude wants to search code or find function definitions, it talks to the MCP server. The MCP server translates that request into actual database queries. Then it translates the results back into a format Claude understands.

You do not need to know how the kitchen works. The manager handles everything.

In our case, the MCP server:
- Connects to SQLite (the precision search database from Phase 1)
- Connects to LanceDB (the semantic search database from Phase 2)
- Exposes three tools that Claude can call
- Handles all the translation between Claude and our databases

The server runs as a small program on your computer. It starts when Claude Code starts. It stays running in the background. Claude sends requests through a communication channel called "stdio" (standard input/output, which we will explain shortly).

---

## So What Exactly Are "Tools"?

In the MCP world, a tool is like an item on the restaurant menu.

Each tool has:
1. **A name** - like "Margherita Pizza" on a menu
2. **A description** - what it does and when to use it
3. **An input schema** - what information you need to provide (like pizza toppings)
4. **An output schema** - what you will get back (like a pizza)

When Claude sees a tool, it knows exactly what that tool can do and how to call it properly.

Here is a simplified example:

```
Tool: search_code
Description: Search codebase using text patterns or natural language
Inputs needed:
  - query: what you are looking for (required)
  - limit: how many results to return (optional, defaults to 10)
  - search_type: exact, semantic, or hybrid (optional, defaults to hybrid)
Outputs:
  - list of matching code locations with file paths and line numbers
```

Claude reads this and knows: "When the user asks about finding code, I can use this tool. I need to provide a query. I might want to limit results. I can choose the search type."

---

## The Three Tools We Are Building

We are giving Claude three specialized tools. Each one does something different.

### Tool 1: search_code

This is the main search tool. It combines both of our search engines.

**What it does:**
- Takes a query (text or natural language)
- Searches both the exact-match database and the semantic database
- Combines and ranks the results
- Returns the best matches

**When Claude uses it:**
- "Find code that handles form validation"
- "Search for error handling patterns"
- "Where do we use Zod schemas?"

**Why it matters:**
Claude no longer has to run ripgrep and parse messy text output. It calls one tool and gets structured, ranked results. Much more reliable.

### Tool 2: go_to_definition

This is the precision navigation tool.

**What it does:**
- Takes a symbol name (like a function or variable name)
- Looks up exactly where that symbol is defined
- Returns the file path, line number, and column

**When Claude uses it:**
- "Where is useContactForm defined?"
- "What file contains the ContactSchema?"
- "Jump to the definition of validateEmail"

**Why it matters:**
Instead of searching for text and guessing which match is the actual definition, Claude gets compiler-verified accuracy. No false positives.

### Tool 3: find_references

This is the impact analysis tool.

**What it does:**
- Takes a symbol name
- Finds every place in the codebase where that symbol is used
- Returns all locations with surrounding context

**When Claude uses it:**
- "What uses the useIsMobile hook?"
- "If I change this function, what breaks?"
- "Show me everywhere ContactSchema is validated"

**Why it matters:**
When you want to refactor something, you need to know what depends on it. This tool provides that complete picture.

---

## What Is StdioServerTransport?

This sounds very technical. Let me break it down.

Think about how two people can communicate.

**Option 1: Walkie-talkies (HTTP/Network)**
You press a button, talk into a device, radio waves travel through the air, the other person's device picks them up. Works over long distances. Requires batteries, radio frequencies, potential interference.

**Option 2: Two tin cans with a string (Stdio)**
You talk into one can, vibrations travel through the string, the other person hears through their can. Only works if you are connected by the string. Very simple. No batteries. Very reliable for short distances.

StdioServerTransport is the tin can approach.

When Claude Code starts our MCP server, it connects directly to the server process. Claude writes to the server's "standard input" (like talking into the can). The server writes back to its "standard output" (like the other person hearing through their can).

This is called "stdio transport" because it uses standard input/output streams.

Why not use network calls like a web API? Two reasons:

1. **Speed.** Network calls have latency. Even localhost network calls add milliseconds. Stdio is essentially instant because it is just passing bytes between processes.

2. **Simplicity.** No ports to configure. No firewall issues. No authentication complexity. Just start the process and start talking.

For a local development tool, stdio is the right choice.

---

## Let Me Make Sure I Have This Straight

So far we have:

1. **Phase 1** built a database that knows where every symbol is defined
2. **Phase 2** built a database that understands what code means
3. **Phase 3** builds a server that lets Claude ask questions to both databases
4. The server exposes three tools: search, go-to-definition, find-references
5. Claude talks to the server through a direct process connection (stdio)

Is that right?

Yes. That is the core of Phase 3.

But there is one more important piece: when you use both search engines at once, how do you combine their results?

---

## The Restaurant Recommendation Problem

Imagine you ask two friends for restaurant recommendations.

**Friend A** is a food critic. She ranks restaurants purely on food quality. Her top 5 are based on taste, ingredients, and cooking technique.

**Friend B** is a logistics expert. He ranks restaurants on location, price, and wait times. His top 5 are based on convenience.

Both lists are useful, but they are ranked differently. How do you combine them into one list?

You cannot just add the scores together. Friend A rates on a 100-point scale. Friend B uses 1-5 stars. The numbers are incomparable.

This is exactly our problem with search results.

---

## What Is Hybrid Ranking?

When you run a "hybrid" search, you get two sets of results:

1. **Exact matches** from SQLite (ranked by text relevance)
2. **Semantic matches** from LanceDB (ranked by meaning similarity)

Both sets use different scoring systems. Exact match scores come from a formula called BM25 (a text relevance algorithm). Semantic scores come from vector distance (how close two embeddings are in meaning-space).

These scores are like apples and oranges. You cannot directly compare them.

Hybrid ranking is the technique that combines these incompatible lists into one unified ranking.

---

## What Is RRF (Reciprocal Rank Fusion)?

RRF is a proven method for combining ranked lists. The name sounds intimidating, but the idea is simple.

**The insight:** We care about position, not score.

If Friend A says Restaurant X is her #1 pick, and Friend B says it is his #3 pick, that restaurant is probably good. We do not care about their actual scores. We care that both friends ranked it highly.

Here is how RRF works:

1. Take the position of each result in each list
2. Calculate a new score based on position: `1 / (60 + position)`
3. If a result appears in both lists, add the scores together
4. Sort by the combined score

Why `60 + position`? This is a magic number from the original research paper. It prevents the top result from dominating too much. The exact number matters less than the concept: transform position into a score that can be added.

**Example:**

Result A:
- Exact search: position 1 -> score = 1/(60+1) = 0.0164
- Semantic search: position 5 -> score = 1/(60+5) = 0.0154
- Combined: 0.0164 + 0.0154 = 0.0318

Result B:
- Exact search: position 3 -> score = 1/(60+3) = 0.0159
- Not in semantic results -> 0
- Combined: 0.0159

Result A wins because it appeared in both lists. Being found by both methods is a strong signal of relevance.

---

## What Happens When Claude Asks a Question?

Let me walk through a complete example.

You type: "Where is the code that validates contact forms?"

### Step 1: Claude Decides to Use a Tool

Claude reads your question and thinks: "This is a code search question. I should use the search_code tool."

### Step 2: Claude Calls the Tool

Claude sends a request to the MCP server:

```
Tool: search_code
Inputs:
  query: "code that validates contact forms"
  limit: 10
  search_type: hybrid
```

### Step 3: The Server Processes the Request

The MCP server receives the request and:

1. Runs an exact-text search in SQLite
   - Looks for "code", "validates", "contact", "forms"
   - Gets back 15 results ranked by text relevance

2. Runs a semantic search in LanceDB
   - Converts the query into a 768-dimensional embedding
   - Finds the 15 nearest neighbors in meaning-space
   - Gets back 15 results ranked by vector similarity

3. Combines results using RRF
   - Some results appear in both lists (boosted)
   - Removes duplicates
   - Takes top 10

### Step 4: The Server Returns Results

The server sends back structured data:

```json
{
  "results": [
    {
      "file_path": "src/atomic-crm/validation/contactSchema.ts",
      "line_start": 15,
      "line_end": 42,
      "content": "export const ContactSchema = z.object({...",
      "score": 0.892,
      "match_type": "hybrid"
    },
    {
      "file_path": "src/atomic-crm/contacts/ContactCreate.tsx",
      "line_start": 55,
      "line_end": 78,
      "content": "const validate = (data) => {...",
      "score": 0.834,
      "match_type": "semantic"
    }
    // ... more results
  ],
  "total_count": 10
}
```

### Step 5: Claude Uses the Results

Claude now has structured data. It knows exactly which files contain relevant code, exactly which line numbers to look at. It can read those specific files instead of scanning the entire codebase.

Claude responds: "I found the contact form validation code. The main schema is defined in `contactSchema.ts` at line 15. The validation is used in the ContactCreate component starting at line 55. Let me read those files to give you more details..."

---

## What Will Be Different When This Is Done?

### Before Phase 3

Claude's workflow for finding code:

1. Run ripgrep across the entire codebase
2. Parse text output (hope nothing breaks)
3. Guess which results are actually relevant
4. Read files to verify
5. Often miss semantic matches (code that does the thing but uses different words)

Time: 5-30 seconds depending on codebase size and search complexity.
Accuracy: Maybe 70% if Claude is careful.

### After Phase 3

Claude's workflow for finding code:

1. Call the search_code tool
2. Receive structured, ranked results
3. Get both exact and semantic matches
4. Know exactly which file and line to read

Time: Under 200 milliseconds.
Accuracy: Compiler-verified for definitions. Semantic understanding for concepts.

### The Real Improvement

It is not just faster. It is fundamentally better.

The hybrid search finds code that keyword search misses. When you ask "where do we handle user mistakes?", the system finds:
- Code with "error" in the name (exact match)
- Code with try/catch blocks (semantic match)
- Validation failure handling (semantic match)
- Result type error cases (semantic match)

All from one query. All properly ranked. All with precise line numbers.

---

## How Do I Configure Claude Code to Use This?

Once we build the MCP server, Claude Code needs to know about it.

We create a file at `.claude/mcp.json` in the project:

```json
{
  "mcpServers": {
    "code-intel": {
      "command": "npx",
      "args": ["tsx", "scripts/mcp/server.ts"]
    }
  }
}
```

This tells Claude Code:
- There is a server called "code-intel"
- To start it, run `npx tsx scripts/mcp/server.ts`
- It uses stdio transport (the default)

When Claude Code starts in this project, it automatically starts the MCP server and connects. No manual steps needed after initial configuration.

---

## Do I Need to Know All This to Use the System?

No. Once Phase 3 is complete:

1. You open the project in Claude Code
2. The MCP server starts automatically
3. You ask questions about code
4. Claude uses the tools behind the scenes
5. You get better, faster answers

You do not need to understand RRF or embeddings or stdio transport. Those are implementation details. The benefit is automatic: smarter code search, faster navigation, more accurate references.

The complexity is hidden. The power is exposed.

---

## What Is the FastMCP Framework?

You might see references to "FastMCP" in some documentation. It is worth a quick explanation.

Building an MCP server from scratch requires handling:
- Protocol negotiation
- Message parsing
- Request routing
- Error handling
- Transport management

FastMCP is a framework that handles all the boilerplate. Instead of writing 200 lines of infrastructure code, you write tool definitions and FastMCP handles the rest.

Think of it like the difference between building a restaurant from raw lumber versus opening a franchise where the building is already constructed. FastMCP gives you the building. You just focus on the menu (your tools).

In Phase 3, we use the official MCP TypeScript SDK which provides similar convenience. The code we write focuses on our three tools, not on protocol plumbing.

---

## Quick Architecture Summary

Here is the complete picture of what we are building:

```
 +------------------+
 |   Claude Code    |    <- You talk to Claude
 +--------+---------+
          |
          | (stdio transport)
          |
 +--------v---------+
 |   MCP Server     |    <- Translates requests
 |   (code-intel)   |
 +---+-------+------+
     |       |
     |       +------------+
     |                    |
 +---v-----+        +-----v-----+
 | SQLite  |        |  LanceDB  |
 | (Phase 1)|       | (Phase 2) |
 | Precision|       | Semantic  |
 +---------+        +-----------+
```

Claude talks to the MCP server. The MCP server queries both databases. Results are combined using RRF. Structured data flows back to Claude.

One interface. Two search engines. Best of both worlds.

---

## What Could Go Wrong?

### "Claude does not see the server"

Check that `.claude/mcp.json` exists and has correct syntax. Run `cat .claude/mcp.json | jq .` to validate the JSON. Restart Claude Code after adding the config.

### "Server fails to start"

The databases from Phase 1 and Phase 2 must exist. Check:
- `.claude/state/search.db` (SQLite from Phase 1)
- `.claude/state/vectors.lance/` (LanceDB from Phase 2)

If missing, run the indexing steps from earlier phases first.

### "Semantic search is slow"

The embedding model needs to be loaded into memory on first use. Subsequent queries are fast. Also, ensure Ollama is running if using local embeddings.

### "Results seem weird"

If the index is stale, results will not match current code. Rerun the indexers:
- `just scip-index` for Phase 1
- `just embed-code` for Phase 2

---

## Verification Checklist

Before calling Phase 3 complete:

- [ ] MCP server starts in under 2 seconds
- [ ] `search_code` returns results in under 200 milliseconds
- [ ] `go_to_definition` finds cross-file definitions
- [ ] `find_references` locates all usages of a symbol
- [ ] Hybrid search surfaces results from both search types
- [ ] Claude Code shows "code-intel: connected" in MCP list
- [ ] Claude can call the tools automatically during conversation

---

## Quick Glossary

**MCP (Model Context Protocol)**
A standard way for AI assistants to use external tools. Like a waiter taking orders between customers and the kitchen.

**MCP Server**
A program that exposes tools to Claude. Translates Claude's requests into actions and returns structured results.

**Tool**
A capability exposed through MCP. Has a name, description, input schema, and output schema. Like an item on a menu.

**StdioServerTransport**
Communication method using standard input/output streams. Fast and simple for local processes. Like two tin cans connected by a string.

**Hybrid Search**
Combining exact-text search with semantic search to get the best of both approaches.

**RRF (Reciprocal Rank Fusion)**
A method for combining ranked lists from different sources. Uses position rather than raw scores to merge results fairly.

**BM25**
A text relevance scoring algorithm. Used by SQLite FTS5 for exact-text search ranking.

**Vector Distance**
How far apart two embeddings are in meaning-space. Smaller distance means more similar meaning.

---

## Summary

Phase 3 connects everything together.

We built two search engines in earlier phases. Phase 3 exposes them to Claude through MCP. Three tools give Claude superpowers: search code, find definitions, locate references.

The hybrid ranking ensures Claude gets the best results from both search methods. Results found by both exact and semantic search are boosted. The final ranking reflects true relevance.

When complete, Claude can answer code questions in milliseconds instead of seconds. More importantly, Claude can find code by meaning, not just by keywords. Ask "where do we validate user input?" and get every validation pattern, regardless of naming conventions.

The integration layer is the phone line to the research librarian. Now Claude can call for help whenever it needs to understand the codebase.

---

**Next:** [Phase 4: Testing and Optimization](./04-phase-4-testing-optimization.md)
