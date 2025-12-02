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
