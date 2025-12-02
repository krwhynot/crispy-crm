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
  stale_count: number;
}

interface PipelineSummaryResult {
  stages: PipelineStageSummary[];
  total_open: number;
  total_stale: number;
}

registerTool(
  {
    name: "crm_pipeline_summary",
    description: "Get aggregated pipeline summary by stage with counts and stale opportunity indicators",
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
        .select("id, stage, updated_at, opportunity_owner_id, principal_organization_id")
        .is("deleted_at", null)
        .not("stage", "in", "(closed_won,closed_lost)");

      if (principalId) {
        query = query.eq("principal_organization_id", principalId);
      }

      if (userId) {
        // Note: userId is string UUID, opportunity_owner_id is bigint sales.id
        // Need to look up sales.id from user_id
        const { data: salesData } = await supabaseAdmin
          .from("sales")
          .select("id")
          .eq("user_id", userId)
          .single();

        if (salesData) {
          query = query.eq("opportunity_owner_id", salesData.id);
        }
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
          stageMap.set(stage, { stage, count: 0, stale_count: 0 });
        }
      }

      // Aggregate
      for (const opp of opportunities || []) {
        const stageSummary = stageMap.get(opp.stage);
        if (!stageSummary) continue;

        stageSummary.count++;

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
      const totalStale = stages.reduce((sum, s) => sum + s.stale_count, 0);

      return {
        stages,
        total_open: totalOpen,
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
