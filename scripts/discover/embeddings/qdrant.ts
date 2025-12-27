/**
 * Qdrant Vector Database Client for Discovery System
 *
 * Stores and searches code embeddings using Qdrant vector database.
 * Uses the @qdrant/js-client-rest package for HTTP API access.
 *
 * API Gotchas (for blog documentation):
 * 1. Qdrant IDs must be numeric (unsigned 64-bit integer) or UUID strings - no arbitrary strings
 *    Solution: Use incremental integers and store original string ID in payload as `originalId`
 * 2. The JS client's `search()` method is deprecated - use `query()` instead for new code
 * 3. `createCollection` throws if collection exists - must check with `collectionExists()` first
 * 4. `upsert` uses `{ points: [...] }` not `{ batch: {...} }` for simple cases
 * 5. Distance metrics: "Cosine" is case-sensitive (not "cosine")
 * 6. Empty collection deletion: `deleteCollection` succeeds even if collection doesn't exist
 * 7. Search results include `id` which is the numeric ID, not the original string ID
 *    Must retrieve `originalId` from payload for mapping back to source entities
 * 8. The `wait: true` option ensures writes are persisted before returning (sync mode)
 */

import { QdrantClient } from "@qdrant/js-client-rest";

const QDRANT_URL = process.env.QDRANT_URL ?? "http://localhost:6333";
const COLLECTION_NAME = "crispy_code";
const VECTOR_SIZE = 768; // nomic-embed-text dimension

export const qdrant = new QdrantClient({ url: QDRANT_URL });

export interface CodePointPayload {
  originalId: string;
  filePath: string;
  type: string;
  name: string;
  startLine: number;
  endLine: number;
  preview: string;
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

let nextPointId = 1;
const idMapping = new Map<string, number>();

function getNumericId(stringId: string): number {
  const existing = idMapping.get(stringId);
  if (existing !== undefined) {
    return existing;
  }
  const numericId = nextPointId++;
  idMapping.set(stringId, numericId);
  return numericId;
}

/**
 * Error class for Qdrant-specific failures.
 * Provides informative messages for common issues.
 */
export class QdrantError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = "QdrantError";
  }
}

/**
 * Create collection if it doesn't exist.
 *
 * Uses Cosine distance for code similarity as it normalizes for vector magnitude,
 * making it ideal for comparing semantic similarity regardless of content length.
 *
 * @throws QdrantError if collection creation fails
 *
 * @example
 * await ensureCollection();
 * console.log("Collection ready for indexing");
 */
export async function ensureCollection(): Promise<void> {
  try {
    const exists = await qdrant.collectionExists(COLLECTION_NAME);

    if (exists.exists) {
      return;
    }

    await qdrant.createCollection(COLLECTION_NAME, {
      vectors: {
        size: VECTOR_SIZE,
        distance: "Cosine",
      },
    });
  } catch (error) {
    const cause = error instanceof Error ? error : new Error(String(error));
    throw new QdrantError(
      `Failed to ensure collection "${COLLECTION_NAME}" exists. ` +
        `Is Qdrant running at ${QDRANT_URL}?`,
      undefined,
      cause
    );
  }
}

/**
 * Upsert points (embeddings with metadata) into the collection.
 *
 * Converts string IDs to numeric IDs (Qdrant requirement) and stores
 * the original string ID in the payload as `originalId`.
 *
 * @param points - Array of points with string ID, vector, and payload
 * @throws QdrantError if upsert fails
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
 *       preview: "export function ContactList() { ..."
 *     }
 *   }
 * ]);
 */
export async function upsertPoints(points: UpsertPoint[]): Promise<void> {
  if (points.length === 0) {
    return;
  }

  try {
    const qdrantPoints = points.map((point) => ({
      id: getNumericId(point.id),
      vector: point.vector,
      payload: point.payload as unknown as Record<string, unknown>,
    }));

    await qdrant.upsert(COLLECTION_NAME, {
      wait: true,
      points: qdrantPoints,
    });
  } catch (error) {
    const cause = error instanceof Error ? error : new Error(String(error));
    throw new QdrantError(
      `Failed to upsert ${points.length} points to collection "${COLLECTION_NAME}"`,
      undefined,
      cause
    );
  }
}

/**
 * Search for similar vectors in the collection.
 *
 * Returns points ordered by similarity score (highest first for Cosine distance).
 * The score ranges from -1 to 1 for Cosine, where 1 means identical vectors.
 *
 * @param queryVector - The 768-dimensional query vector
 * @param limit - Maximum number of results to return (default: 10)
 * @returns Array of search results with scores and payloads
 * @throws QdrantError if search fails
 *
 * @example
 * const results = await search(queryEmbedding, 5);
 * results.forEach(r => {
 *   console.log(`${r.payload.name}: ${r.score.toFixed(3)}`);
 * });
 */
export async function search(
  queryVector: number[],
  limit: number = 10
): Promise<SearchResult[]> {
  if (queryVector.length !== VECTOR_SIZE) {
    throw new QdrantError(
      `Query vector has ${queryVector.length} dimensions, expected ${VECTOR_SIZE}`
    );
  }

  try {
    const response = await qdrant.query(COLLECTION_NAME, {
      query: queryVector,
      limit,
      with_payload: true,
    });

    return response.points.map((point) => ({
      score: point.score ?? 0,
      payload: point.payload as unknown as CodePointPayload,
    }));
  } catch (error) {
    const cause = error instanceof Error ? error : new Error(String(error));
    throw new QdrantError(
      `Failed to search in collection "${COLLECTION_NAME}"`,
      undefined,
      cause
    );
  }
}

/**
 * Delete all points from the collection (for re-indexing).
 *
 * This deletes and recreates the collection to ensure a clean slate.
 * The ID mapping is also reset.
 *
 * @throws QdrantError if clearing fails
 *
 * @example
 * await clearCollection();
 * console.log("Collection cleared, ready for fresh indexing");
 */
export async function clearCollection(): Promise<void> {
  try {
    const exists = await qdrant.collectionExists(COLLECTION_NAME);

    if (exists.exists) {
      await qdrant.deleteCollection(COLLECTION_NAME);
    }

    await qdrant.createCollection(COLLECTION_NAME, {
      vectors: {
        size: VECTOR_SIZE,
        distance: "Cosine",
      },
    });

    nextPointId = 1;
    idMapping.clear();
  } catch (error) {
    const cause = error instanceof Error ? error : new Error(String(error));
    throw new QdrantError(
      `Failed to clear collection "${COLLECTION_NAME}"`,
      undefined,
      cause
    );
  }
}

/**
 * Health check - verify Qdrant is running and accessible.
 *
 * @returns true if Qdrant is healthy
 *
 * @example
 * if (await checkQdrantHealth()) {
 *   console.log("Qdrant ready for vector operations");
 * } else {
 *   console.error("Qdrant not available");
 * }
 */
export async function checkQdrantHealth(): Promise<boolean> {
  try {
    await qdrant.getCollections();
    return true;
  } catch {
    return false;
  }
}

/**
 * Get detailed health status for diagnostics.
 *
 * @returns Object with server status, collection info, and any issues
 */
export async function getHealthDetails(): Promise<{
  serverReachable: boolean;
  collectionExists: boolean;
  pointCount: number;
  error?: string;
}> {
  try {
    const collections = await qdrant.getCollections();
    const hasCollection = collections.collections.some(
      (c) => c.name === COLLECTION_NAME
    );

    let pointCount = 0;
    if (hasCollection) {
      const info = await qdrant.getCollection(COLLECTION_NAME);
      pointCount = info.points_count ?? 0;
    }

    return {
      serverReachable: true,
      collectionExists: hasCollection,
      pointCount,
      error: hasCollection
        ? undefined
        : `Collection "${COLLECTION_NAME}" not found. Run ensureCollection() first.`,
    };
  } catch (error) {
    return {
      serverReachable: false,
      collectionExists: false,
      pointCount: 0,
      error:
        error instanceof Error
          ? `Connection failed: ${error.message}`
          : "Connection failed",
    };
  }
}

/**
 * Get collection statistics.
 *
 * @returns Collection info including point count and vector config
 * @throws QdrantError if collection doesn't exist or query fails
 */
export async function getCollectionInfo(): Promise<{
  pointCount: number;
  vectorSize: number;
  distance: string;
}> {
  try {
    const info = await qdrant.getCollection(COLLECTION_NAME);

    const vectorsConfig = info.config?.params?.vectors;
    let vectorSize = VECTOR_SIZE;
    let distance = "Cosine";

    if (
      vectorsConfig &&
      typeof vectorsConfig === "object" &&
      "size" in vectorsConfig
    ) {
      const config = vectorsConfig as { size: number; distance?: string };
      vectorSize = config.size;
      distance = config.distance ?? "Cosine";
    }

    return {
      pointCount: info.points_count ?? 0,
      vectorSize,
      distance,
    };
  } catch (error) {
    const cause = error instanceof Error ? error : new Error(String(error));
    throw new QdrantError(
      `Failed to get collection info for "${COLLECTION_NAME}"`,
      undefined,
      cause
    );
  }
}
