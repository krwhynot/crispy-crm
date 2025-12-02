// supabase/functions/crm-mcp/index.ts

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { MCPRequest, MCPResponse, MCP_ERRORS } from "./types/mcp.ts";
import { authenticateRequest } from "./middleware/auth.ts";
import { MCPSession } from "./types/mcp.ts";

let currentSession: MCPSession | null = null;

const TOOLS: Record<string, unknown> = {};

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

async function handleRequest(request: MCPRequest): Promise<MCPResponse> {
  const { id, method, params } = request;

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
        tools: Object.values(TOOLS),
      });

    case "tools/call":
      return createErrorResponse(id, MCP_ERRORS.METHOD_NOT_FOUND, "No tools implemented yet");

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

    const response = await handleRequest(body);
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
