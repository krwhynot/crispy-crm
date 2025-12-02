// supabase/functions/crm-mcp/tools/registry.ts

import { MCPToolDefinition, MCPSession } from "../types/mcp.ts";
import { MCPToolError } from "../shared/errors.ts";

export type ToolHandler = (
  args: Record<string, unknown>,
  session: MCPSession
) => Promise<unknown>;

interface RegisteredTool {
  definition: MCPToolDefinition;
  handler: ToolHandler;
}

const tools: Map<string, RegisteredTool> = new Map();

export function registerTool(
  definition: MCPToolDefinition,
  handler: ToolHandler
): void {
  tools.set(definition.name, { definition, handler });
  console.log(`Registered tool: ${definition.name}`);
}

export function getToolDefinitions(): MCPToolDefinition[] {
  return Array.from(tools.values()).map(t => t.definition);
}

export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  session: MCPSession
): Promise<unknown> {
  const tool = tools.get(name);

  if (!tool) {
    throw new MCPToolError(-32601, `Tool not found: ${name}`);
  }

  return await tool.handler(args, session);
}

export function hasTool(name: string): boolean {
  return tools.has(name);
}
