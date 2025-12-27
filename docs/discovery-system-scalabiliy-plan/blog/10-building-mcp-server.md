# Building an MCP Server: Giving Claude Code Superpowers

Your vector database is humming. Your code index is fresh. Your semantic search returns perfect results.

But Claude Code has no idea any of this exists.

You built a sports car and left it in the garage.

This article is about handing Claude the keys.

---

## The Interpretation Layer Problem

Right now, there is a gap between your discovery system and Claude Code.

You can run `just discover-search "form validation"` in your terminal. You get results. Great.

But when you ask Claude Code "find form validation hooks," it does not know about your search command. It falls back to reading files. Grepping. Guessing.

All that indexing work? Wasted.

Claude Code needs a way to invoke your tools directly. It needs to know: "When the user asks about code, I can call this semantic search function instead of reading every file."

That bridge is called MCP - the Model Context Protocol.

---

## What Is MCP?

MCP is a protocol that lets AI assistants call external tools.

Think of it like a restaurant menu. The menu lists dishes the kitchen can make. The customer (Claude) reads the menu, picks something, and the kitchen (your MCP server) makes it.

Without the menu, Claude would have to guess what the kitchen can make. Or try random things and see what works.

MCP provides the menu.

Your MCP server advertises tools:

```
Tool: semantic_search
Description: Search codebase by meaning, not keywords
Parameters:
  - query: string (required) - What to search for
  - limit: number (optional) - Max results (default 10)
Returns: Array of matching code chunks with file paths and scores
```

Claude reads this description, understands when to use it, and calls it with appropriate parameters.

The MCP server executes the tool and returns results. Claude incorporates those results into its response.

This is the missing link between your discovery infrastructure and AI assistance.

---

## FastMCP: MCP Without the Boilerplate

Building an MCP server from scratch requires handling JSON-RPC, tool registration, parameter validation, error handling, and stdio communication.

That is 500 lines of protocol code before you write a single tool.

FastMCP handles all of it:

```typescript
import { FastMCP } from "fastmcp";

const server = new FastMCP("discovery");

server.addTool({
  name: "hello",
  description: "Say hello",
  parameters: z.object({
    name: z.string(),
  }),
  execute: async ({ name }) => {
    return `Hello, ${name}!`;
  },
});

server.run();
```

That is a complete, working MCP server. Twenty lines.

FastMCP is to MCP what Express is to HTTP. It handles the protocol so you can focus on functionality.

---

## Let's Build It: Project Setup

Start with a new directory for your MCP server:

```bash
mkdir -p .claude/mcp/discovery-server
cd .claude/mcp/discovery-server
npm init -y
npm install fastmcp zod @lancedb/lancedb
npm install -D typescript tsx @types/node
```

Create a TypeScript config:

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist"
  },
  "include": ["src/**/*"]
}
```

Create the server entry point:

```typescript
// src/index.ts
import { FastMCP } from "fastmcp";
import { z } from "zod";

const server = new FastMCP("discovery");

// Tools will go here

server.run();
```

Run it:

```bash
npx tsx src/index.ts
```

The server starts, waiting for MCP connections on stdio. Not very exciting yet.

Let us add real tools.

---

## Let's Build It: Semantic Search Tool

The first tool exposes our vector search:

```typescript
// src/tools/semantic-search.ts
import { z } from "zod";
import * as lancedb from "@lancedb/lancedb";

const DB_PATH = process.env.VECTOR_DB_PATH || ".claude/vectordb";

// Embedding function (simplified - use your actual implementation)
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch("http://localhost:11434/api/embeddings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "nomic-embed-text",
      prompt: text,
    }),
  });

  const data = await response.json();
  return data.embedding;
}

export const semanticSearchTool = {
  name: "semantic_search",
  description: `Search the codebase semantically. Use this when the user asks to find code by description rather than exact text. Examples:
  - "Find authentication logic"
  - "Where is form validation handled?"
  - "Show me hooks that manage state"

  Returns code chunks ranked by semantic similarity to the query.`,

  parameters: z.object({
    query: z.string().describe("Natural language description of code to find"),
    limit: z.number().optional().default(10).describe("Maximum results"),
    pathFilter: z.string().optional().describe("Filter to paths containing this string"),
  }),

  execute: async ({ query, limit, pathFilter }: {
    query: string;
    limit?: number;
    pathFilter?: string;
  }) => {
    const db = await lancedb.connect(DB_PATH);
    const table = await db.openTable("code_chunks");

    const queryVector = await generateEmbedding(query);

    let search = table.vectorSearch(queryVector).limit(limit || 10);

    if (pathFilter) {
      search = search.where(`filePath LIKE '%${pathFilter}%'`);
    }

    const results = await search.toArray();

    return results.map((row) => ({
      filePath: row.filePath,
      lines: `${row.startLine}-${row.endLine}`,
      score: row._distance.toFixed(4),
      preview: row.content.slice(0, 200),
    }));
  },
};
```

The key parts:

**Description matters.** Claude reads the description to decide when to use the tool. Be specific about use cases. Include examples.

**Zod schemas validate parameters.** If Claude sends bad input, Zod catches it before your code runs. Add `.describe()` to help Claude understand each parameter.

**Return structured data.** Claude can parse JSON. Return objects it can reason about.

---

## Let's Build It: Component Lookup Tool

Vector search is great for fuzzy queries. But sometimes Claude needs exact information:

"What props does ContactForm accept?"

For this, we need structured lookups:

```typescript
// src/tools/component-lookup.ts
import { z } from "zod";
import * as fs from "node:fs/promises";
import * as path from "node:path";

const INVENTORY_PATH = ".claude/state/component-inventory";

export const componentLookupTool = {
  name: "component_lookup",
  description: `Look up detailed information about a specific React component. Use this when the user asks about a particular component by name. Returns props, hooks used, child components, and file location.`,

  parameters: z.object({
    componentName: z.string().describe("Exact name of the component to look up"),
  }),

  execute: async ({ componentName }: { componentName: string }) => {
    // Read all inventory chunks
    const chunkFiles = await fs.readdir(INVENTORY_PATH);
    const jsonFiles = chunkFiles.filter((f) => f.endsWith(".json") && f !== "manifest.json");

    for (const file of jsonFiles) {
      const content = await fs.readFile(path.join(INVENTORY_PATH, file), "utf-8");
      const chunk = JSON.parse(content);

      for (const component of chunk.items || []) {
        if (component.name === componentName) {
          return {
            name: component.name,
            filePath: component.filePath,
            props: component.props || [],
            hooks: component.hooks || [],
            childComponents: component.childComponents || [],
            contextDependencies: component.contextDependencies || [],
            componentRole: component.componentRole,
          };
        }
      }
    }

    return { error: `Component "${componentName}" not found in inventory` };
  },
};
```

This tool does exact lookup, not fuzzy search. Different use case, different implementation.

---

## Let's Build It: Call Graph Query Tool

Who calls what? This is call graph territory:

```typescript
// src/tools/call-graph.ts
import { z } from "zod";
import * as fs from "node:fs/promises";
import * as path from "node:path";

const CALLGRAPH_PATH = ".claude/state/call-graph-inventory";

export const callGraphTool = {
  name: "call_graph_query",
  description: `Query the call graph to understand code relationships. Use this when the user asks:
  - "What calls this function?"
  - "What does this component render?"
  - "Show dependencies of X"
  - "Are there any circular dependencies?"`,

  parameters: z.object({
    nodeName: z.string().describe("Name of function, component, or hook to query"),
    direction: z.enum(["callers", "callees", "both"]).default("both")
      .describe("Direction: who calls this (callers), what this calls (callees), or both"),
  }),

  execute: async ({ nodeName, direction }: {
    nodeName: string;
    direction?: "callers" | "callees" | "both";
  }) => {
    // Read call graph manifest
    const manifestPath = path.join(CALLGRAPH_PATH, "manifest.json");
    const manifest = JSON.parse(await fs.readFile(manifestPath, "utf-8"));

    // Find the node
    let targetNode = null;
    let nodeChunk = null;

    for (const [chunkName, chunkInfo] of Object.entries(manifest.chunks || {})) {
      const chunkPath = path.join(CALLGRAPH_PATH, (chunkInfo as any).file);
      const chunk = JSON.parse(await fs.readFile(chunkPath, "utf-8"));

      for (const node of chunk.items || []) {
        if (node.name === nodeName) {
          targetNode = node;
          nodeChunk = chunk;
          break;
        }
      }
      if (targetNode) break;
    }

    if (!targetNode) {
      return { error: `Node "${nodeName}" not found in call graph` };
    }

    const result: any = {
      name: targetNode.name,
      type: targetNode.nodeType,
      filePath: targetNode.filePath,
    };

    if (direction === "callers" || direction === "both") {
      result.callers = targetNode.callers || [];
    }

    if (direction === "callees" || direction === "both") {
      result.callees = targetNode.callees || [];
    }

    return result;
  },
};
```

The call graph tool answers structural questions that vector search cannot. "What renders ContactForm?" requires knowing the render graph, not semantic similarity.

---

## Let's Build It: Wiring It Together

Now assemble all the tools:

```typescript
// src/index.ts
import { FastMCP } from "fastmcp";
import { semanticSearchTool } from "./tools/semantic-search";
import { componentLookupTool } from "./tools/component-lookup";
import { callGraphTool } from "./tools/call-graph";

const server = new FastMCP("discovery", {
  version: "1.0.0",
  description: "Code intelligence and semantic search for the codebase",
});

// Register all tools
server.addTool(semanticSearchTool);
server.addTool(componentLookupTool);
server.addTool(callGraphTool);

// Start the server
server.run();

console.error("Discovery MCP server started");
```

That is your complete MCP server. Three tools, each serving a different type of code query.

---

## Connecting to Claude Code

The server exists. Now Claude Code needs to know about it.

Create or edit your Claude Code MCP configuration:

```json
// ~/.claude/claude_desktop_config.json (or project-level .claude/mcp.json)
{
  "mcpServers": {
    "discovery": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/project/.claude/mcp/discovery-server/src/index.ts"],
      "env": {
        "VECTOR_DB_PATH": "/absolute/path/to/project/.claude/vectordb"
      }
    }
  }
}
```

Key points:

**Absolute paths.** MCP servers run in their own process. Relative paths resolve from the wrong directory.

**Environment variables.** Pass configuration through env rather than hardcoding.

**npx tsx.** Runs TypeScript directly without compilation step.

Restart Claude Code. It should connect to your MCP server automatically.

---

## Testing MCP Tools Locally

Before connecting to Claude Code, test your server directly.

FastMCP provides a testing mode:

```bash
echo '{"jsonrpc": "2.0", "method": "tools/list", "id": 1}' | npx tsx src/index.ts
```

You should see your tool definitions in the response.

Test a tool call:

```bash
echo '{"jsonrpc": "2.0", "method": "tools/call", "params": {"name": "semantic_search", "arguments": {"query": "form validation"}}, "id": 2}' | npx tsx src/index.ts
```

You should see search results.

For interactive testing, use the MCP inspector:

```bash
npx @modelcontextprotocol/inspector npx tsx src/index.ts
```

This opens a web UI where you can browse tools and test calls interactively.

---

## Tool Design Principles

After building many MCP tools, patterns emerge.

**One tool, one job.** Do not make a "search" tool that handles semantic search, exact lookup, and regex matching. Make three tools. Claude will pick the right one.

**Rich descriptions.** Claude reads descriptions to choose tools. Explain when to use it, with examples.

```typescript
// Bad
description: "Search code"

// Good
description: `Search the codebase semantically by meaning, not keywords.
Use this when looking for code by description:
- "Find authentication handlers"
- "Where is validation done?"
- "Show me state management hooks"
Do NOT use for exact symbol lookup - use component_lookup instead.`
```

**Structured output.** Return objects, not formatted strings. Claude can reason about structured data better.

```typescript
// Bad
return `Found 3 results:\n1. file.ts:10\n2. other.ts:20`;

// Good
return [
  { file: "file.ts", line: 10, content: "..." },
  { file: "other.ts", line: 20, content: "..." },
];
```

**Handle errors gracefully.** Return error objects, do not throw unhandled exceptions.

```typescript
// Bad
if (!found) throw new Error("Not found");

// Good
if (!found) return { error: "Component not found", suggestion: "Try semantic_search" };
```

**Include suggestions.** When a tool cannot help, suggest alternatives.

---

## Watch Out For

MCP has gotchas. Here is what will bite you.

### Tool Count Limits

Too many tools confuse the model. It has limited context for understanding when to use each one.

Stick to 5-10 well-designed tools rather than 50 narrow ones.

If you need many operations, group them:

```typescript
// Instead of: search_by_name, search_by_type, search_by_path...
// Do:
name: "search",
parameters: z.object({
  query: z.string(),
  searchType: z.enum(["semantic", "name", "path"]),
})
```

### Timeout Handling

MCP calls have timeouts. Long-running operations will fail.

If your tool needs to do something slow:
- Return early with a job ID
- Provide a separate tool to check job status
- Or stream results if FastMCP supports it

For code search, timeouts are rarely an issue. But if you add tools that rebuild indexes, watch out.

### stdio Buffering

MCP uses stdio. If your tool prints to stdout for debugging, it corrupts the protocol.

Use stderr for logging:

```typescript
console.error("Debug info goes here"); // stderr - safe
console.log("This breaks MCP");        // stdout - dangerous
```

### Server Restart Requirements

When you change tool definitions, Claude Code needs to restart its MCP connection.

During development, you will restart frequently. Make sure your server starts fast.

### Path Resolution

Your MCP server runs in its own process. Paths relative to the project root will not work unless you set the working directory correctly.

Either:
- Use absolute paths everywhere
- Set cwd in the MCP configuration
- Resolve paths relative to __dirname

```typescript
// Safe path resolution
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../../../..");
const inventoryPath = path.join(projectRoot, ".claude/state/component-inventory");
```

---

## The Complete Server

Here is the full MCP server in one file:

```typescript
// src/index.ts
import { FastMCP } from "fastmcp";
import { z } from "zod";
import * as lancedb from "@lancedb/lancedb";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../../../..");
const DB_PATH = process.env.VECTOR_DB_PATH || path.join(projectRoot, ".claude/vectordb");
const INVENTORY_PATH = path.join(projectRoot, ".claude/state");

const server = new FastMCP("discovery", {
  version: "1.0.0",
  description: "Code intelligence and semantic search",
});

// Semantic search tool
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

    const response = await fetch("http://localhost:11434/api/embeddings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "nomic-embed-text", prompt: query }),
    });
    const { embedding } = await response.json();

    const results = await table.vectorSearch(embedding).limit(limit).toArray();

    return results.map((r) => ({
      file: r.filePath,
      lines: `${r.startLine}-${r.endLine}`,
      score: r._distance.toFixed(3),
      preview: r.content.slice(0, 150),
    }));
  },
});

// Component lookup tool
server.addTool({
  name: "component_lookup",
  description: "Look up a React component by exact name. Returns props, hooks, children.",
  parameters: z.object({
    name: z.string().describe("Component name"),
  }),
  execute: async ({ name }) => {
    const inventoryDir = path.join(INVENTORY_PATH, "component-inventory");
    const files = await fs.readdir(inventoryDir);

    for (const file of files.filter((f) => f.endsWith(".json") && f !== "manifest.json")) {
      const content = JSON.parse(await fs.readFile(path.join(inventoryDir, file), "utf-8"));
      const component = (content.items || []).find((c: any) => c.name === name);
      if (component) return component;
    }

    return { error: `Component "${name}" not found` };
  },
});

// Index stats tool
server.addTool({
  name: "index_stats",
  description: "Get statistics about the code index. Use to check freshness.",
  parameters: z.object({}),
  execute: async () => {
    const db = await lancedb.connect(DB_PATH);
    const table = await db.openTable("code_chunks");
    const count = await table.countRows();

    const manifestPath = path.join(INVENTORY_PATH, "component-inventory/manifest.json");
    const manifest = JSON.parse(await fs.readFile(manifestPath, "utf-8"));

    return {
      vectorChunks: count,
      components: manifest.summary?.total || "unknown",
      lastIndexed: manifest.generated_at,
    };
  },
});

server.run();
console.error("Discovery MCP server running");
```

---

## What's Next

Your MCP server is live. Claude Code can now search semantically, look up components, and query the call graph.

But the index gets stale. Change a file, and the vectors are outdated.

The next article tackles incremental updates: detecting stale files, re-indexing only what changed, and keeping the discovery system fresh without full rebuilds.

We will build a manifest-based staleness checker that makes incremental updates fast and reliable.

One file changes. One chunk re-embeds. Everything stays current.

---

## Quick Reference

### FastMCP Installation

```bash
npm install fastmcp zod
```

### Minimal Server

```typescript
import { FastMCP } from "fastmcp";
import { z } from "zod";

const server = new FastMCP("my-server");

server.addTool({
  name: "my_tool",
  description: "What it does",
  parameters: z.object({
    input: z.string(),
  }),
  execute: async ({ input }) => {
    return { result: input.toUpperCase() };
  },
});

server.run();
```

### Claude Code Configuration

```json
{
  "mcpServers": {
    "my-server": {
      "command": "npx",
      "args": ["tsx", "/path/to/server.ts"]
    }
  }
}
```

### Testing

```bash
# List tools
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | npx tsx server.ts

# Call tool
echo '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"my_tool","arguments":{"input":"test"}},"id":2}' | npx tsx server.ts

# Interactive inspector
npx @modelcontextprotocol/inspector npx tsx server.ts
```

### Tool Design Checklist

- [ ] One job per tool
- [ ] Rich description with examples
- [ ] Zod schema with .describe() on parameters
- [ ] Structured output (objects, not strings)
- [ ] Graceful error handling
- [ ] Suggestions when tool cannot help

---

*This is part 10 of a 12-part series on building local code intelligence.*
