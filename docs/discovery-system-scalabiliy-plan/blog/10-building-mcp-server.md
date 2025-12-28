# Building an MCP Server: Giving Claude Code Superpowers

Your vector database is humming. Your code index is fresh. Your semantic search returns perfect results.

Claude Code has no idea any of this exists.

You built a sports car and left it in the garage.

This article is about handing Claude the keys.

---

## The Gap

You can run `just discover-search "form validation"` in your terminal. Results appear. Great.

But ask Claude Code "find form validation hooks" and it does not know about your search command.

It falls back to reading files. Grepping. Guessing.

All that indexing work? Wasted.

Claude needs a bridge. A way to call your tools directly.

That bridge is called MCP.

---

## What Is MCP?

MCP stands for Model Context Protocol. It is a standardized way for AI assistants to call external tools.

Think of it like a restaurant menu.

The menu lists dishes the kitchen can make. The customer reads it, picks something, and the kitchen makes it. Without the menu, the customer would have to guess what is available.

MCP is the menu.

Your server advertises tools:

```
Tool: semantic_search
Description: Search codebase by meaning
Parameters: query (string), limit (number)
Returns: Array of matching code chunks
```

Claude reads this. Understands when to use it. Calls it with the right parameters.

The server executes. Returns results. Claude incorporates them into its response.

That is the missing link.

---
  FastMCP API Discovery:
  - The blog post example was outdated - FastMCP's API changed
  - Constructor takes { name, version, ... } object, not (name, options)
  - Method is start() not run() for stdio transport
 ★ Insight ─────────────────────────────────────
  FastMCP Response Format:
  - Tools must return string, { type: "text", text: "..." }, or other MCP content types
  - Our tools return custom objects like { definitions: [...] } which FastMCP doesn't understand
  - Fix: Return JSON stringified text or TextContent objects
  - 
## FastMCP: Skip the Boilerplate

Building an MCP server from scratch means handling JSON-RPC, tool registration, parameter validation, and stdio communication.

JSON-RPC is a protocol for remote procedure calls using JSON. It is how Claude and your server exchange messages.

That is 500 lines of protocol code before you write a single tool.

FastMCP handles all of it:

```typescript
import { FastMCP } from "fastmcp";
import { z } from "zod";

const server = new FastMCP("discovery");

server.addTool({
  name: "hello",
  description: "Say hello",
  parameters: z.object({ name: z.string() }),
  execute: async ({ name }) => `Hello, ${name}!`,
});

server.run();
```

That is a complete, working MCP server. Fifteen lines.

It is like Express for HTTP. Handles the protocol so you can focus on functionality.

---

## Project Setup

Start fresh:

```bash
mkdir -p .claude/mcp/discovery-server
cd .claude/mcp/discovery-server
npm init -y
npm install fastmcp zod @lancedb/lancedb
npm install -D typescript tsx @types/node
```

Create your entry point:

```typescript
// src/index.ts
import { FastMCP } from "fastmcp";

const server = new FastMCP("discovery");
server.run();
```

Run it:

```bash
npx tsx src/index.ts
```

The server starts. Waits for connections on stdio.

Not exciting yet. Let us add real tools.

---

## Tool 1: Semantic Search

The first tool exposes vector search:

```typescript
server.addTool({
  name: "semantic_search",
  description: "Search codebase by meaning. Use for 'find code that does X' queries.",
  parameters: z.object({
    query: z.string().describe("What to search for"),
    limit: z.number().optional().default(10),
  }),
  execute: async ({ query, limit }) => {
    const db = await lancedb.connect(DB_PATH);
    const table = await db.openTable("code_chunks");
    const embedding = await generateEmbedding(query);
    const results = await table.vectorSearch(embedding).limit(limit).toArray();
    return results.map(r => ({
      file: r.filePath,
      lines: `${r.startLine}-${r.endLine}`,
      preview: r.content.slice(0, 150),
    }));
  },
});
```

Three things matter here.

**Descriptions.** Claude reads the description to decide when to use the tool. Be specific. Include examples.

**Zod schemas.** Parameters get validated before your code runs. Add `.describe()` to help Claude understand each one. It is like giving Claude a form with helpful labels.

**Structured output.** Return objects, not formatted strings. Claude reasons about JSON better than prose.

---

## Tool 2: Component Lookup

Vector search handles fuzzy queries. But sometimes Claude needs exact information.

"What props does ContactForm accept?"

For this, you need structured lookups:

```typescript
server.addTool({
  name: "component_lookup",
  description: "Look up a React component by exact name. Returns props, hooks, children.",
  parameters: z.object({
    name: z.string().describe("Component name"),
  }),
  execute: async ({ name }) => {
    const files = await fs.readdir(INVENTORY_PATH);
    for (const file of files.filter(f => f.endsWith(".json"))) {
      const content = JSON.parse(await fs.readFile(path.join(INVENTORY_PATH, file), "utf-8"));
      const component = content.items?.find((c: any) => c.name === name);
      if (component) return component;
    }
    return { error: `Component "${name}" not found` };
  },
});
```

Different use case. Different implementation.

This tool does exact lookup. No fuzzy matching. No embeddings.

It is like the difference between a Google search and a dictionary lookup.

---

## Tool 3: Call Graph Queries

Who calls what? The call graph knows:

```typescript
server.addTool({
  name: "call_graph_query",
  description: `Query code relationships. Use for:
    - "What calls this function?"
    - "What does this component render?"
    - "Show dependencies of X"`,
  parameters: z.object({
    nodeName: z.string().describe("Function, component, or hook name"),
    direction: z.enum(["callers", "callees", "both"]).default("both"),
  }),
  execute: async ({ nodeName, direction }) => {
    const manifest = JSON.parse(await fs.readFile(MANIFEST_PATH, "utf-8"));
    const node = await findNodeInChunks(nodeName, manifest);
    if (!node) return { error: `Node "${nodeName}" not found` };
    return {
      name: node.name,
      type: node.nodeType,
      callers: direction !== "callees" ? node.callers : undefined,
      callees: direction !== "callers" ? node.callees : undefined,
    };
  },
});
```

"What renders ContactForm?" requires the render graph. Vector search cannot answer that.

This tool can.

---

## Wiring It Together

Three tools. Different purposes. One server:

```typescript
import { FastMCP } from "fastmcp";
import { semanticSearchTool } from "./tools/semantic-search";
import { componentLookupTool } from "./tools/component-lookup";
import { callGraphTool } from "./tools/call-graph";

const server = new FastMCP("discovery", {
  version: "1.0.0",
  description: "Code intelligence and semantic search",
});

server.addTool(semanticSearchTool);
server.addTool(componentLookupTool);
server.addTool(callGraphTool);

server.run();
```

That is it.

---

## Connecting to Claude Code

The server exists. Claude Code needs to know about it.

Create your MCP configuration:

```json
{
  "mcpServers": {
    "discovery": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/src/index.ts"],
      "env": {
        "VECTOR_DB_PATH": "/absolute/path/to/.claude/vectordb"
      }
    }
  }
}
```

**Use absolute paths.** MCP servers run in their own process. Relative paths resolve from the wrong directory. This trips up everyone.

**Pass configuration through env.** Do not hardcode paths in your server.

Restart Claude Code. It connects automatically.

---

## Testing Before Connecting

Test your server locally first.

List tools:

```bash
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | npx tsx src/index.ts
```

Call a tool:

```bash
echo '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"semantic_search","arguments":{"query":"form validation"}},"id":2}' | npx tsx src/index.ts
```

For interactive testing:

```bash
npx @modelcontextprotocol/inspector npx tsx src/index.ts
```

This opens a web UI. Browse tools. Test calls. See responses.

It is like Postman for MCP.

---

## Tool Design That Works

Patterns emerge after building many tools.

**One tool, one job.** Do not make a "search" tool that handles semantic search, exact lookup, and regex matching. Make three tools. Claude picks the right one.

**Rich descriptions win.** Claude reads descriptions to choose tools.

```typescript
// Bad
description: "Search code"

// Good
description: `Search codebase semantically by meaning.
Use for: "Find authentication handlers", "Where is validation done?"
Do NOT use for exact symbol lookup - use component_lookup instead.`
```

See the difference? The good description explains when to use it and when not to.

**Structured output always.** Return objects. Not strings.

```typescript
// Bad
return `Found 3 results:\n1. file.ts:10`;

// Good
return [{ file: "file.ts", line: 10, content: "..." }];
```

**Return errors as objects.** Do not throw. Claude cannot recover from exceptions.

```typescript
if (!found) return { error: "Not found", suggestion: "Try semantic_search" };
```

Include suggestions. Help Claude try something else.

---

## The Gotchas

MCP will bite you. Here is where.

**Too many tools confuse the model.** Stick to 5-10 well-designed tools. Claude has limited context for understanding when to use each one. It is like a restaurant with a 50-page menu. Nobody reads page 47.

**stdout breaks everything.** MCP uses stdio. Print to stdout for debugging and you corrupt the protocol.

```typescript
console.error("Debug info"); // stderr - safe
console.log("This breaks MCP"); // stdout - dangerous
```

Use stderr for logging. Always.

**Tool changes require restarts.** Change a tool definition? Restart Claude Code. During development, you will restart often. Make your server start fast.

**Timeouts kill slow operations.** MCP calls have timeouts. If your tool does something slow, return a job ID and provide a separate status-check tool. For code search, timeouts rarely matter. For index rebuilds? Watch out.

---

## The Complete Server

Everything in one file:

```typescript
import { FastMCP } from "fastmcp";
import { z } from "zod";
import * as lancedb from "@lancedb/lancedb";
import * as fs from "node:fs/promises";
import * as path from "node:path";

const DB_PATH = process.env.VECTOR_DB_PATH || ".claude/vectordb";
const INVENTORY_PATH = process.env.INVENTORY_PATH || ".claude/state";

const server = new FastMCP("discovery");

server.addTool({
  name: "semantic_search",
  description: "Search codebase by meaning.",
  parameters: z.object({ query: z.string(), limit: z.number().default(10) }),
  execute: async ({ query, limit }) => {
    const db = await lancedb.connect(DB_PATH);
    const table = await db.openTable("code_chunks");
    const embedding = await generateEmbedding(query);
    return await table.vectorSearch(embedding).limit(limit).toArray();
  },
});

server.addTool({
  name: "component_lookup",
  description: "Look up a React component by exact name.",
  parameters: z.object({ name: z.string() }),
  execute: async ({ name }) => findComponent(name, INVENTORY_PATH),
});

server.run();
```

Three tools. Semantic search. Component lookup. Index stats.

That is your discovery server.

---

## What You Have Now

Claude Code can search semantically. Look up components. Query the call graph.

All without reading every file from scratch.

But indexes get stale. Change a file and the vectors are outdated.

The next article tackles incremental updates. Detecting stale files. Re-indexing only what changed. Keeping the discovery system fresh without full rebuilds.

One file changes. One chunk re-embeds. Everything stays current.

---

## Quick Reference

**Installation:**

```bash
npm install fastmcp zod
```

**Minimal server:**

```typescript
const server = new FastMCP("my-server");
server.addTool({
  name: "my_tool",
  description: "What it does",
  parameters: z.object({ input: z.string() }),
  execute: async ({ input }) => ({ result: input.toUpperCase() }),
});
server.run();
```

**Configuration:**

```json
{
  "mcpServers": {
    "my-server": { "command": "npx", "args": ["tsx", "/path/to/server.ts"] }
  }
}
```

**Testing:**

```bash
npx @modelcontextprotocol/inspector npx tsx server.ts
```

**Tool checklist:**
- One job per tool
- Rich description with examples
- Zod schema with `.describe()` on parameters
- Structured output (objects, not strings)
- Error objects with suggestions

---

*Part 10 of 12: Building Local Code Intelligence*
