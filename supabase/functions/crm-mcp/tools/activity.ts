// supabase/functions/crm-mcp/tools/activity.ts

import { registerTool } from "./registry.ts";
import { supabaseAdmin } from "../shared/supabaseClient.ts";
import { MCPSession } from "../types/mcp.ts";
import { validationError, notFoundError, internalError } from "../shared/errors.ts";

const ACTIVITY_TYPES = [
  "call",
  "email",
  "sample",
  "meeting",
  "demo",
  "proposal",
  "follow_up",
  "trade_show",
  "site_visit",
  "contract_review",
  "check_in",
  "social",
  "note",
] as const;

interface ActivityLogResult {
  id: number;
  type: string;
  subject: string;
  description: string | null;
  outcome: string | null;
  opportunity_id: number | null;
  contact_id: number | null;
  created_at: string;
  activity_date: string;
}

registerTool(
  {
    name: "crm_activity_log",
    description: "Log an activity against an opportunity. Creates an activity record and updates the opportunity's updated_at timestamp to reset the stale timer. Activity types: call, email, sample, meeting, demo, proposal, follow_up, trade_show, site_visit, contract_review, check_in, social, note",
    inputSchema: {
      type: "object",
      properties: {
        type: {
          type: "string",
          description: "Type of activity",
          enum: ACTIVITY_TYPES,
        },
        opportunity_id: {
          type: "number",
          description: "ID of the opportunity this activity is related to (optional, but recommended)",
        },
        contact_id: {
          type: "number",
          description: "ID of the contact involved in this activity (optional)",
        },
        subject: {
          type: "string",
          description: "Brief subject line or title for the activity",
        },
        notes: {
          type: "string",
          description: "Detailed notes about the activity (optional)",
        },
        outcome: {
          type: "string",
          description: "Outcome or result of the activity (optional)",
        },
      },
      required: ["type", "subject"],
    },
  },
  async (args: Record<string, unknown>, session: MCPSession): Promise<ActivityLogResult> => {
    const type = args.type as string;
    const opportunityId = args.opportunity_id as number | undefined;
    const contactId = args.contact_id as number | undefined;
    const subject = args.subject as string;
    const notes = args.notes as string | undefined;
    const outcome = args.outcome as string | undefined;

    // Validate activity type
    if (!ACTIVITY_TYPES.includes(type as typeof ACTIVITY_TYPES[number])) {
      throw validationError(
        `Invalid activity type. Must be one of: ${ACTIVITY_TYPES.join(", ")}`,
        { provided: type }
      );
    }

    // Validate subject is not empty
    if (!subject || subject.trim().length === 0) {
      throw validationError("Subject cannot be empty");
    }

    try {
      // Look up the sales.id for the current user
      const { data: salesData, error: salesError } = await supabaseAdmin
        .from("sales")
        .select("id")
        .eq("user_id", session.userId)
        .single();

      if (salesError || !salesData) {
        throw internalError("Failed to find sales record for user", salesError);
      }

      const createdBy = salesData.id;

      // If opportunity_id is provided, verify it exists and update its updated_at
      if (opportunityId) {
        const { data: oppData, error: oppError } = await supabaseAdmin
          .from("opportunities")
          .select("id")
          .eq("id", opportunityId)
          .is("deleted_at", null)
          .single();

        if (oppError || !oppData) {
          throw notFoundError("Opportunity", opportunityId);
        }

        // Update opportunity's updated_at to reset stale timer
        const { error: updateError } = await supabaseAdmin
          .from("opportunities")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", opportunityId);

        if (updateError) {
          throw internalError("Failed to update opportunity timestamp", updateError);
        }
      }

      // If contact_id is provided, verify it exists
      if (contactId) {
        const { data: contactData, error: contactError } = await supabaseAdmin
          .from("contacts")
          .select("id")
          .eq("id", contactId)
          .is("deleted_at", null)
          .single();

        if (contactError || !contactData) {
          throw notFoundError("Contact", contactId);
        }
      }

      // Insert activity record
      const { data: activity, error: insertError } = await supabaseAdmin
        .from("activities")
        .insert({
          type,
          activity_type: "interaction",
          subject: subject.trim(),
          description: notes?.trim() || null,
          outcome: outcome?.trim() || null,
          opportunity_id: opportunityId || null,
          contact_id: contactId || null,
          created_by: createdBy,
        })
        .select("id, type, subject, description, outcome, opportunity_id, contact_id, created_at, activity_date")
        .single();

      if (insertError || !activity) {
        throw internalError("Failed to create activity", insertError);
      }

      return {
        id: activity.id,
        type: activity.type,
        subject: activity.subject,
        description: activity.description,
        outcome: activity.outcome,
        opportunity_id: activity.opportunity_id,
        contact_id: activity.contact_id,
        created_at: activity.created_at,
        activity_date: activity.activity_date,
      };
    } catch (error) {
      if (error instanceof Error && error.name === "MCPToolError") {
        throw error;
      }
      throw internalError("Unknown error while logging activity", error);
    }
  }
);
