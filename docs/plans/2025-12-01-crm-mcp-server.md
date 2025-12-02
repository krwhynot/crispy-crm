# CRM MCP Server Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a custom MCP server exposing CRM-specific tools for AI-assisted development workflows.

**Architecture:** Single Supabase Edge Function using mcp-lite for zero cold starts. Tools organized by domain (opportunity, activity, task, pipeline). JWT auth via Supabase, OpenTelemetry-style tracing for observability.

**Tech Stack:** Deno, mcp-lite, Supabase Edge Functions, Sentry (tracing), Zod (validation)

---

## Phase 1: Foundation (Tasks 1-5)

### Task 1: Create Edge Function Skeleton

**Files:**
- Create: `supabase/functions/crm-mcp/index.ts`
- Create: `supabase/functions/crm-mcp/types/mcp.ts`

**Step 1: Create the MCP types file**

```typescript
// supabase/functions/crm-mcp/types/mcp.ts

export interface MCPRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

export interface MCPResponse {
  jsonrpc: "2.0";
  id: string | number;
  result?: unknown;
  error?: MCPError;
}

export interface MCPError {
  code: number;
  message: string;
  data?: unknown;
}

export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface MCPSession {
  sessionId: string;
  userId: string;
  salesId: number;
  role: "admin" | "manager" | "rep";
}

// MCP Error Codes (JSON-RPC 2.0)
export const MCP_ERRORS = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  AUTH_ERROR: -32001,
} as const;
```

**Step 2: Create the main Edge Function entry point**

```typescript
// supabase/functions/crm-mcp/index.ts

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { MCPRequest, MCPResponse, MCP_ERRORS } from "./types/mcp.ts";

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
```

**Step 3: Test locally**

Run:
```bash
npx supabase functions serve crm-mcp --no-verify-jwt
```

In another terminal:
```bash
curl -X POST http://localhost:54321/functions/v1/crm-mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize"}'
```

Expected: `{"jsonrpc":"2.0","id":1,"result":{"protocolVersion":"2024-11-05",...}}`

**Step 4: Commit**

```bash
git add supabase/functions/crm-mcp/
git commit -m "feat(mcp): create Edge Function skeleton with MCP protocol support"
```

---

### Task 2: Add Authentication Middleware

**Files:**
- Create: `supabase/functions/crm-mcp/middleware/auth.ts`
- Modify: `supabase/functions/crm-mcp/index.ts`

**Step 1: Create auth middleware**

```typescript
// supabase/functions/crm-mcp/middleware/auth.ts

import { createClient } from "jsr:@supabase/supabase-js@2";
import { MCPSession } from "../types/mcp.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export interface AuthResult {
  success: boolean;
  session?: MCPSession;
  error?: string;
}

export async function authenticateRequest(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return { success: false, error: "Missing or invalid Authorization header" };
  }

  const token = authHeader.slice(7);

  try {
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return { success: false, error: authError?.message || "Invalid token" };
    }

    // Get sales record for user
    const { data: sales, error: salesError } = await supabaseAdmin
      .from("sales")
      .select("id, role")
      .eq("user_id", user.id)
      .single();

    if (salesError || !sales) {
      return { success: false, error: "User not found in sales table" };
    }

    const sessionId = req.headers.get("X-MCP-Session-Id") || crypto.randomUUID();

    return {
      success: true,
      session: {
        sessionId,
        userId: user.id,
        salesId: sales.id,
        role: sales.role as "admin" | "manager" | "rep",
      },
    };
  } catch (error) {
    console.error("Auth error:", error);
    return { success: false, error: "Authentication failed" };
  }
}
```

**Step 2: Update index.ts to use auth middleware**

Add to `supabase/functions/crm-mcp/index.ts` after imports:

```typescript
import { authenticateRequest, AuthResult } from "./middleware/auth.ts";
import { MCPSession } from "./types/mcp.ts";

let currentSession: MCPSession | null = null;
```

Update `Deno.serve` handler before `handleRequest`:

```typescript
Deno.serve(async (req) => {
  // ... CORS handling stays the same ...

  // Authenticate request
  const authResult = await authenticateRequest(req);
  if (!authResult.success) {
    return new Response(
      JSON.stringify(createErrorResponse(0, MCP_ERRORS.AUTH_ERROR, authResult.error || "Unauthorized")),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }
  currentSession = authResult.session!;

  // ... rest of handler ...
});
```

**Step 3: Test authentication**

Run:
```bash
npx supabase functions serve crm-mcp
```

Test without token (should fail):
```bash
curl -X POST http://localhost:54321/functions/v1/crm-mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize"}'
```

Expected: `{"jsonrpc":"2.0","id":0,"error":{"code":-32001,"message":"Missing or invalid Authorization header"}}`

**Step 4: Commit**

```bash
git add supabase/functions/crm-mcp/middleware/auth.ts supabase/functions/crm-mcp/index.ts
git commit -m "feat(mcp): add JWT authentication middleware"
```

---

### Task 3: Add Tracing Middleware

**Files:**
- Create: `supabase/functions/crm-mcp/middleware/tracing.ts`
- Modify: `supabase/functions/crm-mcp/index.ts`

**Step 1: Create tracing middleware following OpenTelemetry MCP conventions**

```typescript
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
```

**Step 2: Verify tracing types match conventions**

The span attributes match the OpenTelemetry MCP conventions:
- `mcp.method.name` = "tools/call"
- `mcp.tool.name` = actual tool name
- `mcp.transport` = "http"
- `network.transport` = "tcp"
- `mcp.session.id` = session identifier
- `mcp.request.id` = request identifier
- `mcp.request.argument.<key>` = per-argument attributes
- `mcp.tool.result.is_error` = boolean
- `mcp.tool.result.content_count` = number

**Step 3: Commit**

```bash
git add supabase/functions/crm-mcp/middleware/tracing.ts
git commit -m "feat(mcp): add OpenTelemetry-style tracing middleware"
```

---

### Task 4: Create Shared Supabase Client & Error Handling

**Files:**
- Create: `supabase/functions/crm-mcp/shared/supabaseClient.ts`
- Create: `supabase/functions/crm-mcp/shared/errors.ts`

**Step 1: Create shared Supabase client**

```typescript
// supabase/functions/crm-mcp/shared/supabaseClient.ts

import { createClient, SupabaseClient } from "jsr:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

export const supabaseAdmin: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey);
```

**Step 2: Create error handling utilities**

```typescript
// supabase/functions/crm-mcp/shared/errors.ts

import { MCPError, MCP_ERRORS } from "../types/mcp.ts";

export class MCPToolError extends Error {
  code: number;
  data?: unknown;

  constructor(code: number, message: string, data?: unknown) {
    super(message);
    this.name = "MCPToolError";
    this.code = code;
    this.data = data;
  }

  toMCPError(): MCPError {
    return {
      code: this.code,
      message: this.message,
      data: this.data,
    };
  }
}

export function validationError(message: string, details?: unknown): MCPToolError {
  return new MCPToolError(MCP_ERRORS.INVALID_PARAMS, message, details);
}

export function notFoundError(entityType: string, id: string | number): MCPToolError {
  return new MCPToolError(MCP_ERRORS.INVALID_PARAMS, `${entityType} not found: ${id}`, { entityType, id });
}

export function businessRuleError(rule: string, context?: unknown): MCPToolError {
  return new MCPToolError(MCP_ERRORS.INTERNAL_ERROR, `Business rule violation: ${rule}`, { rule, context });
}

export function internalError(message: string, originalError?: unknown): MCPToolError {
  console.error("Internal error:", message, originalError);
  return new MCPToolError(MCP_ERRORS.INTERNAL_ERROR, message);
}
```

**Step 3: Commit**

```bash
git add supabase/functions/crm-mcp/shared/
git commit -m "feat(mcp): add shared Supabase client and error handling"
```

---

### Task 5: Create Tool Registry Pattern

**Files:**
- Create: `supabase/functions/crm-mcp/tools/registry.ts`
- Modify: `supabase/functions/crm-mcp/index.ts`

**Step 1: Create tool registry**

```typescript
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
```

**Step 2: Update index.ts to use registry**

Update `supabase/functions/crm-mcp/index.ts`:

```typescript
// Add import at top
import { getToolDefinitions, executeTool, hasTool } from "./tools/registry.ts";
import { startTrace, startToolSpan, endToolSpan } from "./middleware/tracing.ts";

// Update handleRequest function
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
```

Also add MCPToolError import:
```typescript
import { MCPToolError } from "./shared/errors.ts";
```

And update the Deno.serve handler to pass session:
```typescript
const response = await handleRequest(body, currentSession!);
```

**Step 3: Commit**

```bash
git add supabase/functions/crm-mcp/tools/registry.ts supabase/functions/crm-mcp/index.ts
git commit -m "feat(mcp): add tool registry pattern with tracing integration"
```

---

## Phase 2: First Tool (Tasks 6-8)

### Task 6: Implement crm_pipeline_summary Tool

**Files:**
- Create: `supabase/functions/crm-mcp/tools/pipeline.ts`
- Modify: `supabase/functions/crm-mcp/index.ts`

**Step 1: Create pipeline tools file**

```typescript
// supabase/functions/crm-mcp/tools/pipeline.ts

import { registerTool } from "./registry.ts";
import { supabaseAdmin } from "../shared/supabaseClient.ts";
import { MCPSession } from "../types/mcp.ts";
import { internalError } from "../shared/errors.ts";

// Pipeline stages from PRD
const PIPELINE_STAGES = [
  "new_lead",
  "initial_outreach",
  "sample_visit_offered",
  "feedback_logged",
  "demo_scheduled",
  "closed_won",
  "closed_lost",
] as const;

// Stale thresholds per stage (days)
const STALE_THRESHOLDS: Record<string, number> = {
  new_lead: 7,
  initial_outreach: 14,
  sample_visit_offered: 14,
  feedback_logged: 21,
  demo_scheduled: 14,
};

interface PipelineStageSummary {
  stage: string;
  count: number;
  total_value: number;
  stale_count: number;
}

interface PipelineSummaryResult {
  stages: PipelineStageSummary[];
  total_open: number;
  total_value: number;
  total_stale: number;
}

registerTool(
  {
    name: "crm_pipeline_summary",
    description: "Get aggregated pipeline summary by stage with counts, values, and stale opportunity indicators",
    inputSchema: {
      type: "object",
      properties: {
        user_id: {
          type: "string",
          description: "Filter by specific user (optional, defaults to all users)",
        },
        principal_id: {
          type: "number",
          description: "Filter by specific principal (optional)",
        },
      },
    },
  },
  async (args: Record<string, unknown>, session: MCPSession): Promise<PipelineSummaryResult> => {
    const userId = args.user_id as string | undefined;
    const principalId = args.principal_id as number | undefined;

    try {
      // Build query
      let query = supabaseAdmin
        .from("opportunities")
        .select("id, stage, expected_value, updated_at, sales_id, principal_id")
        .is("deleted_at", null)
        .not("stage", "in", "(closed_won,closed_lost)");

      if (principalId) {
        query = query.eq("principal_id", principalId);
      }

      const { data: opportunities, error } = await query;

      if (error) {
        throw internalError("Failed to fetch opportunities", error);
      }

      // Calculate summary by stage
      const now = new Date();
      const stageMap = new Map<string, PipelineStageSummary>();

      // Initialize all stages
      for (const stage of PIPELINE_STAGES) {
        if (stage !== "closed_won" && stage !== "closed_lost") {
          stageMap.set(stage, { stage, count: 0, total_value: 0, stale_count: 0 });
        }
      }

      // Aggregate
      for (const opp of opportunities || []) {
        const stageSummary = stageMap.get(opp.stage);
        if (!stageSummary) continue;

        stageSummary.count++;
        stageSummary.total_value += opp.expected_value || 0;

        // Check if stale
        const threshold = STALE_THRESHOLDS[opp.stage];
        if (threshold) {
          const updatedAt = new Date(opp.updated_at);
          const daysSinceUpdate = Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24));
          if (daysSinceUpdate > threshold) {
            stageSummary.stale_count++;
          }
        }
      }

      const stages = Array.from(stageMap.values());
      const totalOpen = stages.reduce((sum, s) => sum + s.count, 0);
      const totalValue = stages.reduce((sum, s) => sum + s.total_value, 0);
      const totalStale = stages.reduce((sum, s) => sum + s.stale_count, 0);

      return {
        stages,
        total_open: totalOpen,
        total_value: totalValue,
        total_stale: totalStale,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw internalError(error.message, error);
      }
      throw internalError("Unknown error", error);
    }
  }
);
```

**Step 2: Import pipeline tools in index.ts**

Add to `supabase/functions/crm-mcp/index.ts` after other imports:

```typescript
// Import tools to register them
import "./tools/pipeline.ts";
```

**Step 3: Test the tool locally**

Start the function:
```bash
npx supabase functions serve crm-mcp
```

Get a valid JWT (use Supabase dashboard or existing auth flow), then:
```bash
curl -X POST http://localhost:54321/functions/v1/crm-mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "crm_pipeline_summary",
      "arguments": {}
    }
  }'
```

Expected: JSON response with stages array, counts, and values.

**Step 4: Commit**

```bash
git add supabase/functions/crm-mcp/tools/pipeline.ts supabase/functions/crm-mcp/index.ts
git commit -m "feat(mcp): implement crm_pipeline_summary tool"
```

---

### Task 7: Implement crm_stale_opportunities Tool

**Files:**
- Modify: `supabase/functions/crm-mcp/tools/pipeline.ts`

**Step 1: Add crm_stale_opportunities to pipeline.ts**

Add after the crm_pipeline_summary registration:

```typescript
interface StaleOpportunity {
  id: number;
  name: string;
  stage: string;
  days_stale: number;
  threshold_days: number;
  expected_value: number | null;
  principal_name: string | null;
  customer_name: string | null;
  assigned_to: string | null;
}

registerTool(
  {
    name: "crm_stale_opportunities",
    description: "Find opportunities that have exceeded their stage-specific stale thresholds. Thresholds: new_lead (7 days), initial_outreach (14 days), sample_visit_offered (14 days), feedback_logged (21 days), demo_scheduled (14 days)",
    inputSchema: {
      type: "object",
      properties: {
        stage: {
          type: "string",
          description: "Filter by specific stage (optional)",
          enum: ["new_lead", "initial_outreach", "sample_visit_offered", "feedback_logged", "demo_scheduled"],
        },
        assigned_to: {
          type: "number",
          description: "Filter by sales_id (optional)",
        },
        limit: {
          type: "number",
          description: "Maximum results to return (default: 20)",
        },
      },
    },
  },
  async (args: Record<string, unknown>, session: MCPSession): Promise<StaleOpportunity[]> => {
    const stage = args.stage as string | undefined;
    const assignedTo = args.assigned_to as number | undefined;
    const limit = (args.limit as number) || 20;

    try {
      let query = supabaseAdmin
        .from("opportunities")
        .select(`
          id,
          name,
          stage,
          expected_value,
          updated_at,
          sales_id,
          principal:organizations!opportunities_principal_id_fkey(name),
          customer:organizations!opportunities_customer_id_fkey(name),
          sales(first_name, last_name)
        `)
        .is("deleted_at", null)
        .not("stage", "in", "(closed_won,closed_lost)");

      if (stage) {
        query = query.eq("stage", stage);
      }

      if (assignedTo) {
        query = query.eq("sales_id", assignedTo);
      }

      const { data: opportunities, error } = await query;

      if (error) {
        throw internalError("Failed to fetch opportunities", error);
      }

      const now = new Date();
      const staleOpps: StaleOpportunity[] = [];

      for (const opp of opportunities || []) {
        const threshold = STALE_THRESHOLDS[opp.stage];
        if (!threshold) continue;

        const updatedAt = new Date(opp.updated_at);
        const daysSinceUpdate = Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24));

        if (daysSinceUpdate > threshold) {
          staleOpps.push({
            id: opp.id,
            name: opp.name,
            stage: opp.stage,
            days_stale: daysSinceUpdate - threshold,
            threshold_days: threshold,
            expected_value: opp.expected_value,
            principal_name: (opp.principal as { name: string } | null)?.name || null,
            customer_name: (opp.customer as { name: string } | null)?.name || null,
            assigned_to: opp.sales
              ? `${(opp.sales as { first_name: string; last_name: string }).first_name} ${(opp.sales as { first_name: string; last_name: string }).last_name}`.trim()
              : null,
          });
        }
      }

      // Sort by days_stale descending
      staleOpps.sort((a, b) => b.days_stale - a.days_stale);

      return staleOpps.slice(0, limit);
    } catch (error) {
      if (error instanceof Error) {
        throw internalError(error.message, error);
      }
      throw internalError("Unknown error", error);
    }
  }
);
```

**Step 2: Test the tool**

```bash
curl -X POST http://localhost:54321/functions/v1/crm-mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "crm_stale_opportunities",
      "arguments": {"limit": 5}
    }
  }'
```

Expected: Array of stale opportunities sorted by days_stale.

**Step 3: Commit**

```bash
git add supabase/functions/crm-mcp/tools/pipeline.ts
git commit -m "feat(mcp): implement crm_stale_opportunities tool with stage thresholds"
```

---

### Task 8: Deploy to Production

**Files:**
- None (deployment only)

**Step 1: Verify all tools respond correctly**

Run tools/list:
```bash
curl -X POST http://localhost:54321/functions/v1/crm-mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

Expected: List containing `crm_pipeline_summary` and `crm_stale_opportunities`.

**Step 2: Deploy to Supabase**

```bash
npx supabase functions deploy crm-mcp --project-ref aaqnanddcqvfiwhshndl
```

Expected: "Function deployed successfully"

**Step 3: Test production endpoint**

```bash
curl -X POST https://aaqnanddcqvfiwhshndl.supabase.co/functions/v1/crm-mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize"}'
```

Expected: Successful initialize response.

**Step 4: Commit deployment marker**

```bash
git add -A
git commit -m "deploy(mcp): deploy crm-mcp to production with 2 tools"
```

---

## Phase 3: Additional Tools (Tasks 9-14)

### Task 9: Implement crm_activity_log Tool

**Files:**
- Create: `supabase/functions/crm-mcp/tools/activity.ts`
- Modify: `supabase/functions/crm-mcp/index.ts`

**Step 1: Create activity tools file**

```typescript
// supabase/functions/crm-mcp/tools/activity.ts

import { registerTool } from "./registry.ts";
import { supabaseAdmin } from "../shared/supabaseClient.ts";
import { MCPSession } from "../types/mcp.ts";
import { validationError, internalError } from "../shared/errors.ts";

const ACTIVITY_TYPES = [
  "call", "email", "sample", "meeting", "demo", "proposal",
  "follow_up", "trade_show", "site_visit", "contract_review",
  "check_in", "social", "note"
] as const;

type ActivityType = typeof ACTIVITY_TYPES[number];

interface ActivityLogResult {
  activity_id: number;
  logged_at: string;
  type: ActivityType;
  opportunity_id: number | null;
  contact_id: number | null;
}

registerTool(
  {
    name: "crm_activity_log",
    description: "Log an activity (call, email, sample, meeting, demo, proposal, follow_up, trade_show, site_visit, contract_review, check_in, social, note) against an opportunity and/or contact",
    inputSchema: {
      type: "object",
      properties: {
        type: {
          type: "string",
          description: "Activity type",
          enum: ACTIVITY_TYPES,
        },
        opportunity_id: {
          type: "number",
          description: "Associated opportunity ID (optional if contact_id provided)",
        },
        contact_id: {
          type: "number",
          description: "Associated contact ID (optional if opportunity_id provided)",
        },
        notes: {
          type: "string",
          description: "Activity notes/description",
        },
        outcome: {
          type: "string",
          description: "Outcome of the activity (optional)",
        },
      },
      required: ["type", "notes"],
    },
  },
  async (args: Record<string, unknown>, session: MCPSession): Promise<ActivityLogResult> => {
    const activityType = args.type as ActivityType;
    const opportunityId = args.opportunity_id as number | undefined;
    const contactId = args.contact_id as number | undefined;
    const notes = args.notes as string;
    const outcome = args.outcome as string | undefined;

    // Validate activity type
    if (!ACTIVITY_TYPES.includes(activityType)) {
      throw validationError(`Invalid activity type: ${activityType}. Valid types: ${ACTIVITY_TYPES.join(", ")}`);
    }

    // At least one association required
    if (!opportunityId && !contactId) {
      throw validationError("Either opportunity_id or contact_id must be provided");
    }

    try {
      const { data: activity, error } = await supabaseAdmin
        .from("activities")
        .insert({
          type: activityType,
          opportunity_id: opportunityId || null,
          contact_id: contactId || null,
          notes,
          outcome: outcome || null,
          sales_id: session.salesId,
          created_at: new Date().toISOString(),
        })
        .select("id, created_at, type, opportunity_id, contact_id")
        .single();

      if (error) {
        throw internalError("Failed to log activity", error);
      }

      // Update opportunity's updated_at to reset stale timer
      if (opportunityId) {
        await supabaseAdmin
          .from("opportunities")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", opportunityId);
      }

      return {
        activity_id: activity.id,
        logged_at: activity.created_at,
        type: activity.type,
        opportunity_id: activity.opportunity_id,
        contact_id: activity.contact_id,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw internalError(error.message, error);
      }
      throw internalError("Unknown error", error);
    }
  }
);
```

**Step 2: Import in index.ts**

Add to `supabase/functions/crm-mcp/index.ts`:

```typescript
import "./tools/activity.ts";
```

**Step 3: Test**

```bash
curl -X POST http://localhost:54321/functions/v1/crm-mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "crm_activity_log",
      "arguments": {
        "type": "call",
        "opportunity_id": 1,
        "notes": "Discussed pricing options"
      }
    }
  }'
```

**Step 4: Commit**

```bash
git add supabase/functions/crm-mcp/tools/activity.ts supabase/functions/crm-mcp/index.ts
git commit -m "feat(mcp): implement crm_activity_log tool for 13 activity types"
```

---

### Task 10-14: Remaining Tools (Summary)

The following tools follow the same pattern. Implement each in order:

| Task | Tool | File | Key Logic |
|------|------|------|-----------|
| 10 | `crm_task_create` | `tools/task.ts` | Insert into tasks table |
| 11 | `crm_tasks_due` | `tools/task.ts` | Query by due_date buckets |
| 12 | `crm_opportunity_get` | `tools/opportunity.ts` | Select with contacts join |
| 13 | `crm_opportunity_create` | `tools/opportunity.ts` | Insert with validation |
| 14 | Update CLAUDE.md | `CLAUDE.md` | Document available tools |

Each task follows the same structure:
1. Write the tool registration
2. Import in index.ts
3. Test locally
4. Commit

---

## Verification Checklist

After completing all tasks:

```
[ ] All 7 MVP tools respond correctly
[ ] tools/list returns all tool definitions
[ ] Tracing spans appear in logs with correct attributes
[ ] Auth rejects invalid tokens
[ ] Production deployment successful
[ ] CLAUDE.md documents available tools
```

---

## Rollback Commands

If issues arise:

```bash
# Disable in Claude Code
# Edit .mcp.json, remove crispy-crm entry

# Delete function entirely
npx supabase functions delete crm-mcp --project-ref aaqnanddcqvfiwhshndl

# Revert changes
git revert HEAD~N  # N = number of commits to revert
```
