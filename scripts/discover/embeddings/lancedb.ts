/**
 * LanceDB Vector Database Client for Discovery System
 *
 * Stores and searches code embeddings using LanceDB (embedded vector database).
 * Replaces Qdrant with a serverless, file-based solution.
 *
 * Key advantages over Qdrant:
 * 1. No Docker container required - just files on disk
 * 2. Native string ID support - no numeric ID workaround needed
 * 3. Faster cold start - no server startup time
 * 4. Simpler deployment - just files in .gitignore
 *
 * API Notes:
 * 1. LanceDB uses cosine distance (0 = identical, 2 = opposite)
 *    We convert to Qdrant-style scores (1 = identical, -1 = opposite)
 * 2. Tables are created on first insert (schema inferred from data)
 * 3. mergeInsert handles upserts by matching on "id" column
 * 4. Filter syntax uses SQL-like WHERE clauses
 */

import * as lancedb from "@lancedb/lancedb";
import * as fs from "node:fs/promises";
import * as path from "node:path";

const DB_PATH = ".claude/state/vectors.lance";
const TABLE_NAME = "code_chunks";
const VECTOR_SIZE = 768; // nomic-embed-text dimension

// Lazy connection - initialized on first use
let db: lancedb.Connection | null = null;

export interface CodePointPayload {
  originalId: string;
  filePath: string;
  type: string;
  name: string;
  startLine: number;
  endLine: number;
  content: string; // Full content (was "preview" in Qdrant, now stores full source)
}

export interface SearchResult {
  score: number;
  payload: CodePointPayload;
}

export interface UpsertPoint {
  id: string;
  vector: number[];
  payload: CodePointPayload;
}

// Internal record format for LanceDB table
interface CodeChunkRecord {
  id: string;
  filePath: string;
  type: string;
  name: string;
  content: string;
  startLine: number;
  endLine: number;
  vector: number[];
}

/**
 * Error class for LanceDB-specific failures.
 * Provides informative messages for common issues.
 */
export class LanceDBError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = "LanceDBError";
  }
}

/**
 * Get or create database connection.
 * LanceDB connections are lightweight - just a directory handle.
 */
async function getConnection(): Promise<lancedb.Connection> {
  if (db) {
    return db;
  }

  try {
    // Ensure parent directory exists
    const dbDir = path.dirname(DB_PATH);
    await fs.mkdir(dbDir, { recursive: true });

    db = await lancedb.connect(DB_PATH);
    return db;
  } catch (error) {
    const cause = error instanceof Error ? error : new Error(String(error));
    throw new LanceDBError(`Failed to connect to LanceDB at "${DB_PATH}"`, cause);
  }
}

/**
 * Check if table exists.
 */
async function tableExists(): Promise<boolean> {
  try {
    const conn = await getConnection();
    const tables = await conn.tableNames();
    return tables.includes(TABLE_NAME);
  } catch {
    return false;
  }
}

/**
 * Create table if it doesn't exist.
 *
 * LanceDB tables are created on first insert, so this just ensures
 * the database directory exists and connection works.
 *
 * @throws LanceDBError if setup fails
 *
 * @example
 * await ensureCollection();
 * console.log("LanceDB ready for indexing");
 */
export async function ensureCollection(): Promise<void> {
  try {
    await getConnection();
    // Table will be created on first upsert - LanceDB infers schema from data
  } catch (error) {
    const cause = error instanceof Error ? error : new Error(String(error));
    throw new LanceDBError(`Failed to ensure LanceDB collection at "${DB_PATH}"`, cause);
  }
}

/**
 * Upsert points (embeddings with metadata) into the table.
 *
 * Uses mergeInsert for true upsert behavior - updates existing records
 * or inserts new ones based on the "id" column.
 *
 * @param points - Array of points with string ID, vector, and payload
 * @throws LanceDBError if upsert fails
 *
 * @example
 * await upsertPoints([
 *   {
 *     id: "component:ContactList",
 *     vector: [...768 floats...],
 *     payload: {
 *       originalId: "component:ContactList",
 *       filePath: "src/atomic-crm/contacts/ContactList.tsx",
 *       type: "component",
 *       name: "ContactList",
 *       startLine: 10,
 *       endLine: 150,
 *       content: "export function ContactList() { ..."
 *     }
 *   }
 * ]);
 */
export async function upsertPoints(points: UpsertPoint[]): Promise<void> {
  if (points.length === 0) {
    return;
  }

  try {
    const conn = await getConnection();

    // Convert to flat records for LanceDB
    const records: CodeChunkRecord[] = points.map((point) => ({
      id: point.id,
      filePath: point.payload.filePath,
      type: point.payload.type,
      name: point.payload.name,
      content: point.payload.content,
      startLine: point.payload.startLine,
      endLine: point.payload.endLine,
      vector: point.vector,
    }));

    const exists = await tableExists();

    if (!exists) {
      // Create table with first batch of data
      // Cast to Record<string, unknown>[] to satisfy LanceDB's type requirements
      await conn.createTable(TABLE_NAME, records as unknown as Record<string, unknown>[]);
    } else {
      // Upsert into existing table using merge insert (builder pattern)
      const table = await conn.openTable(TABLE_NAME);
      await table
        .mergeInsert("id")
        .whenMatchedUpdateAll()
        .whenNotMatchedInsertAll()
        .execute(records as unknown as Record<string, unknown>[]);
    }
  } catch (error) {
    const cause = error instanceof Error ? error : new Error(String(error));
    throw new LanceDBError(
      `Failed to upsert ${points.length} points to LanceDB table "${TABLE_NAME}"`,
      cause
    );
  }
}

/**
 * Convert LanceDB cosine distance to Qdrant-style similarity score.
 *
 * LanceDB cosine distance: 0 = identical, 2 = opposite
 * Qdrant cosine score: 1 = identical, -1 = opposite
 *
 * Formula: score = 1 - (distance / 2)
 */
function distanceToScore(distance: number): number {
  return 1 - distance / 2;
}

/**
 * Search for similar vectors in the table.
 *
 * Returns points ordered by similarity score (highest first).
 * The score ranges from -1 to 1, where 1 means identical vectors.
 *
 * @param queryVector - The 768-dimensional query vector
 * @param limit - Maximum number of results to return (default: 10)
 * @returns Array of search results with scores and payloads
 * @throws LanceDBError if search fails
 *
 * @example
 * const results = await search(queryEmbedding, 5);
 * results.forEach(r => {
 *   console.log(`${r.payload.name}: ${r.score.toFixed(3)}`);
 * });
 */
export async function search(queryVector: number[], limit: number = 10): Promise<SearchResult[]> {
  if (queryVector.length !== VECTOR_SIZE) {
    throw new LanceDBError(
      `Query vector has ${queryVector.length} dimensions, expected ${VECTOR_SIZE}`
    );
  }

  try {
    const exists = await tableExists();
    if (!exists) {
      return []; // No table yet means no results
    }

    const conn = await getConnection();
    const table = await conn.openTable(TABLE_NAME);

    const results = await table
      .vectorSearch(queryVector)
      .distanceType("cosine")
      .limit(limit)
      .toArray();

    return results.map((row) => ({
      score: distanceToScore(row._distance as number),
      payload: {
        originalId: row.id as string,
        filePath: row.filePath as string,
        type: row.type as string,
        name: row.name as string,
        startLine: row.startLine as number,
        endLine: row.endLine as number,
        content: row.content as string,
      },
    }));
  } catch (error) {
    const cause = error instanceof Error ? error : new Error(String(error));
    throw new LanceDBError(`Failed to search in LanceDB table "${TABLE_NAME}"`, cause);
  }
}

/**
 * Search for similar vectors filtered by type.
 *
 * New feature! Allows filtering results to specific code element types
 * like "component", "function", "hook", etc.
 *
 * @param queryVector - The 768-dimensional query vector
 * @param type - Code element type to filter by
 * @param limit - Maximum number of results to return (default: 10)
 * @returns Array of search results with scores and payloads
 * @throws LanceDBError if search fails
 *
 * @example
 * const components = await searchByType(queryEmbedding, "component", 5);
 * components.forEach(r => {
 *   console.log(`Component: ${r.payload.name}`);
 * });
 */
export async function searchByType(
  queryVector: number[],
  type: string,
  limit: number = 10
): Promise<SearchResult[]> {
  if (queryVector.length !== VECTOR_SIZE) {
    throw new LanceDBError(
      `Query vector has ${queryVector.length} dimensions, expected ${VECTOR_SIZE}`
    );
  }

  try {
    const exists = await tableExists();
    if (!exists) {
      return [];
    }

    const conn = await getConnection();
    const table = await conn.openTable(TABLE_NAME);

    const results = await table
      .vectorSearch(queryVector)
      .distanceType("cosine")
      .where(`type = '${type}'`)
      .limit(limit)
      .toArray();

    return results.map((row) => ({
      score: distanceToScore(row._distance as number),
      payload: {
        originalId: row.id as string,
        filePath: row.filePath as string,
        type: row.type as string,
        name: row.name as string,
        startLine: row.startLine as number,
        endLine: row.endLine as number,
        content: row.content as string,
      },
    }));
  } catch (error) {
    const cause = error instanceof Error ? error : new Error(String(error));
    throw new LanceDBError(
      `Failed to search by type "${type}" in LanceDB table "${TABLE_NAME}"`,
      cause
    );
  }
}

/**
 * Delete all points from the table (for re-indexing).
 *
 * Drops and recreates the table to ensure a clean slate.
 *
 * @throws LanceDBError if clearing fails
 *
 * @example
 * await clearCollection();
 * console.log("Table cleared, ready for fresh indexing");
 */
export async function clearCollection(): Promise<void> {
  try {
    const conn = await getConnection();
    const exists = await tableExists();

    if (exists) {
      await conn.dropTable(TABLE_NAME);
    }

    // Table will be recreated on next upsert
  } catch (error) {
    const cause = error instanceof Error ? error : new Error(String(error));
    throw new LanceDBError(`Failed to clear LanceDB table "${TABLE_NAME}"`, cause);
  }
}

/**
 * Health check - verify LanceDB is accessible.
 *
 * Since LanceDB is file-based, this checks if we can connect
 * and optionally if the table exists.
 *
 * @returns true if LanceDB is healthy
 *
 * @example
 * if (await checkLanceDBHealth()) {
 *   console.log("LanceDB ready for vector operations");
 * } else {
 *   console.error("LanceDB not available");
 * }
 */
export async function checkLanceDBHealth(): Promise<boolean> {
  try {
    await getConnection();
    return true;
  } catch {
    return false;
  }
}

/**
 * Get detailed health status for diagnostics.
 *
 * @returns Object with database status, table info, and any issues
 */
export async function getHealthDetails(): Promise<{
  serverReachable: boolean; // Kept for API compatibility, means "db accessible"
  collectionExists: boolean;
  pointCount: number;
  error?: string;
}> {
  try {
    const conn = await getConnection();
    const exists = await tableExists();

    let pointCount = 0;
    if (exists) {
      const table = await conn.openTable(TABLE_NAME);
      pointCount = await table.countRows();
    }

    return {
      serverReachable: true,
      collectionExists: exists,
      pointCount,
      error: exists ? undefined : `Table "${TABLE_NAME}" not found. Run indexer to create it.`,
    };
  } catch (error) {
    return {
      serverReachable: false,
      collectionExists: false,
      pointCount: 0,
      error:
        error instanceof Error ? `LanceDB error: ${error.message}` : "LanceDB connection failed",
    };
  }
}

/**
 * Get table statistics.
 *
 * @returns Table info including point count and vector config
 * @throws LanceDBError if table doesn't exist or query fails
 */
export async function getCollectionInfo(): Promise<{
  pointCount: number;
  vectorSize: number;
  distance: string;
}> {
  try {
    const exists = await tableExists();
    if (!exists) {
      throw new LanceDBError(`Table "${TABLE_NAME}" does not exist. Run indexer first.`);
    }

    const conn = await getConnection();
    const table = await conn.openTable(TABLE_NAME);
    const pointCount = await table.countRows();

    return {
      pointCount,
      vectorSize: VECTOR_SIZE,
      distance: "cosine",
    };
  } catch (error) {
    if (error instanceof LanceDBError) {
      throw error;
    }
    const cause = error instanceof Error ? error : new Error(String(error));
    throw new LanceDBError(`Failed to get table info for "${TABLE_NAME}"`, cause);
  }
}
