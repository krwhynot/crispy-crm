/**
 * Embeddings module for Discovery System
 *
 * Provides text embedding generation for semantic search and similarity.
 * Includes vector storage via LanceDB for fast similarity search.
 */

export {
  generateEmbedding,
  generateBatchEmbeddings,
  checkOllamaHealth,
  getHealthDetails as getOllamaHealthDetails,
  OllamaError,
} from "./ollama.js";

export {
  ensureCollection,
  upsertPoints,
  search,
  searchByType,
  clearCollection,
  checkLanceDBHealth,
  getHealthDetails as getLanceDBHealthDetails,
  getCollectionInfo,
  LanceDBError,
  type CodePointPayload,
  type SearchResult,
  type UpsertPoint,
} from "./lancedb.js";
