/**
 * MCP Server for Crispy CRM Code Intelligence
 *
 * Exposes 3 tools to Claude Code:
 * - search_code: Hybrid FTS5 + vector search with RRF ranking
 * - go_to_definition: Jump to symbol definitions
 * - find_references: Find all usages of a symbol
 *
 * Uses FastMCP for simplified protocol handling.
 *
 * @example
 * # Start server
 * npx tsx scripts/mcp/server.ts
 *
 * # Test with JSON-RPC
 * echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npx tsx scripts/mcp/server.ts
 */

import { FastMCP } from "fastmcp";
import { searchCodeTool } from "./tools/search.js";
import { goToDefinitionTool } from "./tools/goto.js";
import { findReferencesTool } from "./tools/refs.js";

const server = new FastMCP({
  name: "crispy-code-intel",
  version: "1.0.0",
});

// Register all tools
server.addTool(searchCodeTool);
server.addTool(goToDefinitionTool);
server.addTool(findReferencesTool);

// Start the server (stdio transport)
server.start();
