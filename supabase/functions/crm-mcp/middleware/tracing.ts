// supabase/functions/crm-mcp/middleware/tracing.ts

import { MCPSession } from "../types/mcp.ts";

export interface MCPSpan {
  op: string;
  name: string;
  startTime: number;
  endTime?: number;
  data: Record<string, string | number | boolean>;
}

export interface TraceContext {
  sessionId: string;
  requestId: string;
  spans: MCPSpan[];
}

let traceContext: TraceContext | null = null;

export function startTrace(sessionId: string, requestId: string): TraceContext {
  traceContext = {
    sessionId,
    requestId,
    spans: [],
  };
  return traceContext;
}

export function startToolSpan(
  toolName: string,
  args: Record<string, unknown>,
  session: MCPSession
): MCPSpan {
  const span: MCPSpan = {
    op: "mcp.server",
    name: `tools/call ${toolName}`,
    startTime: Date.now(),
    data: {
      "mcp.method.name": "tools/call",
      "mcp.tool.name": toolName,
      "mcp.transport": "http",
      "network.transport": "tcp",
      "mcp.session.id": session.sessionId,
      "mcp.request.id": traceContext?.requestId || "unknown",
      "network.protocol.version": "2.0",
    },
  };

  // Add arguments as span attributes
  for (const [key, value] of Object.entries(args)) {
    if (value !== undefined && value !== null) {
      span.data[`mcp.request.argument.${key}`] = String(value);
    }
  }

  traceContext?.spans.push(span);
  return span;
}

export function endToolSpan(
  span: MCPSpan,
  isError: boolean,
  resultCount: number
): void {
  span.endTime = Date.now();
  span.data["mcp.tool.result.is_error"] = isError;
  span.data["mcp.tool.result.content_count"] = resultCount;

  // Log span for now (replace with Sentry in production)
  console.log("MCP Span:", JSON.stringify({
    ...span,
    duration_ms: span.endTime - span.startTime,
  }));
}

export function getTraceContext(): TraceContext | null {
  return traceContext;
}
