// supabase/functions/crm-mcp/index.ts

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { MCPRequest, MCPResponse, MCP_ERRORS } from "./types/mcp.ts";
import { authenticateRequest } from "./middleware/auth.ts";
import { MCPSession } from "./types/mcp.ts";
import { getToolDefinitions, executeTool, hasTool } from "./tools/registry.ts";
import { startTrace, startToolSpan, endToolSpan } from "./middleware/tracing.ts";
import { MCPToolError } from "./shared/errors.ts";

let currentSession: MCPSession | null = null;

function createErrorResponse(id: string | number, code: number, message: string): MCPResponse {
  return {
    jsonrpc: "2.0",
    id,
    error: { code, message },
  };
}

function createSuccessResponse(id: string | number, result: unknown): MCPResponse {
  return {
    jsonrpc: "2.0",
    id,
    result,
  };
}

async function handleRequest(request: MCPRequest, session: MCPSession): Promise<MCPResponse> {
  const { id, method, params } = request;

  startTrace(session.sessionId, String(id));

  switch (method) {
    case "initialize":
      return createSuccessResponse(id, {
        protocolVersion: "2024-11-05",
        serverInfo: {
          name: "crispy-crm",
          version: "1.0.0",
        },
        capabilities: {
          tools: {},
        },
      });

    case "tools/list":
      return createSuccessResponse(id, {
        tools: getToolDefinitions(),
      });

    case "tools/call": {
      const toolName = (params as { name?: string })?.name;
      const toolArgs = (params as { arguments?: Record<string, unknown> })?.arguments || {};

      if (!toolName) {
        return createErrorResponse(id, MCP_ERRORS.INVALID_PARAMS, "Missing tool name");
      }

      if (!hasTool(toolName)) {
        return createErrorResponse(id, MCP_ERRORS.METHOD_NOT_FOUND, `Tool not found: ${toolName}`);
      }

      const span = startToolSpan(toolName, toolArgs, session);

      try {
        const result = await executeTool(toolName, toolArgs, session);
        const resultArray = Array.isArray(result) ? result : [result];
        endToolSpan(span, false, resultArray.length);

        return createSuccessResponse(id, {
          content: [{ type: "text", text: JSON.stringify(result) }],
        });
      } catch (error) {
        endToolSpan(span, true, 0);

        if (error instanceof MCPToolError) {
          return createErrorResponse(id, error.code, error.message);
        }
        return createErrorResponse(id, MCP_ERRORS.INTERNAL_ERROR, String(error));
      }
    }

    default:
      return createErrorResponse(id, MCP_ERRORS.METHOD_NOT_FOUND, `Unknown method: ${method}`);
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-MCP-Session-Id",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Authenticate request
  const authResult = await authenticateRequest(req);
  if (!authResult.success) {
    return new Response(
      JSON.stringify(createErrorResponse(0, MCP_ERRORS.AUTH_ERROR, authResult.error || "Unauthorized")),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }
  currentSession = authResult.session!;

  try {
    const body = await req.json() as MCPRequest;

    if (body.jsonrpc !== "2.0" || !body.method || !body.id) {
      return new Response(
        JSON.stringify(createErrorResponse(body.id || 0, MCP_ERRORS.INVALID_REQUEST, "Invalid JSON-RPC request")),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const response = await handleRequest(body, currentSession!);
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("MCP server error:", error);
    return new Response(
      JSON.stringify(createErrorResponse(0, MCP_ERRORS.PARSE_ERROR, "Failed to parse request")),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
});
