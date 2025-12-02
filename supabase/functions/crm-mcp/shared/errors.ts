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
