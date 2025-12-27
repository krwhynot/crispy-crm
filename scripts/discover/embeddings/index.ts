/**
 * Embeddings module for Discovery System
 *
 * Provides text embedding generation for semantic search and similarity.
 * Includes vector storage via Qdrant for fast similarity search.
 */

export {
  generateEmbedding,
  generateBatchEmbeddings,
  checkOllamaHealth,
  getHealthDetails as getOllamaHealthDetails,
  OllamaError,
} from "./ollama.js";

export {
  qdrant,
  ensureCollection,
  upsertPoints,
  search,
  clearCollection,
  checkQdrantHealth,
  getHealthDetails as getQdrantHealthDetails,
  getCollectionInfo,
  QdrantError,
  type CodePointPayload,
  type SearchResult,
  type UpsertPoint,
} from "./qdrant.js";
