/**
 * Timeline Handler - Read-only DataProvider for entity_timeline view
 *
 * The entity_timeline view unions activities and tasks into a single
 * chronological feed. This handler:
 * - Only supports getList (read-only view)
 * - Requires either contact_id or organization_id filter
 * - Returns entry_type discriminator for frontend rendering
 * - Returns sales_id for task permission checks
 *
 * Best Practice: Explicit filters help PostgreSQL query planner
 * even though the view already filters soft-deleted records.
 *
 * Engineering Constitution: Read-only view = no validation wrapper
 */

import type {
  DataProvider,
  GetListParams,
  GetListResult,
  GetOneParams,
  GetOneResult,
  GetManyParams,
  GetManyResult,
  GetManyReferenceParams,
  GetManyReferenceResult,
  CreateParams,
  CreateResult,
  UpdateParams,
  UpdateResult,
  UpdateManyParams,
  UpdateManyResult,
  DeleteParams,
  DeleteResult,
  DeleteManyParams,
  DeleteManyResult,
  RaRecord,
} from "react-admin";
import { HttpError } from "react-admin";
import { supabase } from "../supabase";

/**
 * Timeline entry from entity_timeline view
 *
 * Discriminated union of activities and tasks with common fields
 * for unified timeline display.
 */
interface TimelineEntry extends RaRecord {
  id: number;
  entry_type: "activity" | "task";
  subtype: string;
  title: string;
  description?: string;
  entry_date: string;
  contact_id?: number;
  organization_id?: number;
  opportunity_id?: number;
  created_by?: number;
  sales_id?: number;
  created_at: string;
}

/**
 * Create a read-only handler for entity_timeline view
 *
 * This handler directly queries the Supabase view without using
 * the base provider, since:
 * 1. Views are read-only (no create/update/delete)
 * 2. No validation needed (no write operations)
 * 3. No lifecycle callbacks needed (no mutations)
 *
 * The handler is wrapped with withErrorLogging at composition time
 * in the main provider factory for consistent error handling.
 *
 * @param _baseProvider - Unused (view doesn't need base provider operations)
 * @returns DataProvider with getList only; other methods throw HttpError
 */
export function createTimelineHandler(_baseProvider: DataProvider): DataProvider {
  return {
    /**
     * Fetch timeline entries for a specific entity
     *
     * Supports filtering by:
     * - contact_id: Show timeline for a specific contact
     * - organization_id: Show timeline for a specific organization
     * - opportunity_id: Show timeline for a specific opportunity
     *
     * Default sort: entry_date DESC (most recent first)
     *
     * @param _resource - Resource name (unused, always "entity_timeline")
     * @param params - React Admin list params with filter, sort, pagination
     * @returns Paginated timeline entries with total count
     */
    getList: async <RecordType extends RaRecord = TimelineEntry>(
      _resource: string,
      params: GetListParams
    ): Promise<GetListResult<RecordType>> => {
      const { filter, sort, pagination } = params;

      let query = supabase.from("entity_timeline").select("*", { count: "exact" });

      // Extract entity filters from @or filter or direct filter properties
      const orFilter = filter?.["@or"] as Record<string, number> | undefined;
      const entityFilters: string[] = [];

      // Build OR conditions from @or filter or direct properties
      const contactId = orFilter?.contact_id ?? filter?.contact_id;
      const orgId = orFilter?.organization_id ?? filter?.organization_id;
      const oppId = orFilter?.opportunity_id ?? filter?.opportunity_id;

      if (contactId) entityFilters.push(`contact_id.eq.${contactId}`);
      if (orgId) entityFilters.push(`organization_id.eq.${orgId}`);
      if (oppId) entityFilters.push(`opportunity_id.eq.${oppId}`);

      // Fail-closed: require at least one entity filter
      if (entityFilters.length === 0) {
        throw new HttpError(
          "Timeline requires contact_id, organization_id, or opportunity_id filter",
          400
        );
      }

      // Apply OR filter if multiple conditions, else single eq for better query plan
      if (entityFilters.length > 1) {
        query = query.or(entityFilters.join(","));
      } else {
        if (contactId) query = query.eq("contact_id", contactId);
        else if (orgId) query = query.eq("organization_id", orgId);
        else if (oppId) query = query.eq("opportunity_id", oppId);
      }

      // Secondary filter: entry_type (not an entity filter)
      if (filter?.entry_type) {
        query = query.eq("entry_type", filter.entry_type);
      }

      const sortField = sort?.field || "entry_date";
      const sortAscending = sort?.order === "ASC";
      query = query.order(sortField, { ascending: sortAscending });

      const { page = 1, perPage = 25 } = pagination || {};
      const from = (page - 1) * perPage;
      const to = from + perPage - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        throw new HttpError(error.message, 500);
      }

      return {
        data: (data || []) as RecordType[],
        total: count || 0,
      };
    },

    getOne: async <RecordType extends RaRecord = TimelineEntry>(
      _resource: string,
      _params: GetOneParams<RecordType>
    ): Promise<GetOneResult<RecordType>> => {
      throw new HttpError(
        "Timeline entries cannot be fetched individually. Use getList with filter.",
        400
      );
    },

    getMany: async <RecordType extends RaRecord = TimelineEntry>(
      _resource: string,
      _params: GetManyParams
    ): Promise<GetManyResult<RecordType>> => {
      throw new HttpError("Timeline does not support getMany. Use getList with filter.", 400);
    },

    getManyReference: async <RecordType extends RaRecord = TimelineEntry>(
      _resource: string,
      _params: GetManyReferenceParams
    ): Promise<GetManyReferenceResult<RecordType>> => {
      throw new HttpError(
        "Timeline does not support getManyReference. Use getList with filter.",
        400
      );
    },

    create: async <RecordType extends RaRecord = TimelineEntry>(
      _resource: string,
      _params: CreateParams
    ): Promise<CreateResult<RecordType>> => {
      throw new HttpError("Timeline is read-only. Create activities or tasks directly.", 400);
    },

    update: async <RecordType extends RaRecord = TimelineEntry>(
      _resource: string,
      _params: UpdateParams
    ): Promise<UpdateResult<RecordType>> => {
      throw new HttpError("Timeline is read-only. Update activities or tasks directly.", 400);
    },

    updateMany: async (_resource: string, _params: UpdateManyParams): Promise<UpdateManyResult> => {
      throw new HttpError("Timeline is read-only.", 400);
    },

    delete: async <RecordType extends RaRecord = TimelineEntry>(
      _resource: string,
      _params: DeleteParams<RecordType>
    ): Promise<DeleteResult<RecordType>> => {
      throw new HttpError("Timeline is read-only. Delete activities or tasks directly.", 400);
    },

    deleteMany: async (_resource: string, _params: DeleteManyParams): Promise<DeleteManyResult> => {
      throw new HttpError("Timeline is read-only.", 400);
    },
  };
}
