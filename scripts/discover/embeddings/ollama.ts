/**
 * Ollama Embedding Client for Discovery System
 *
 * Generates 768-dimensional embeddings using nomic-embed-text model.
 * Uses native fetch (Node 18+) for HTTP requests.
 *
 * API Gotchas (for blog documentation):
 * 1. Ollama uses "prompt" not "input" for the embedding endpoint (unlike OpenAI)
 * 2. Response structure is { embedding: number[] } not { embeddings: number[][] }
 * 3. No batch endpoint - must call sequentially for multiple texts
 * 4. Model must be pulled first: `ollama pull nomic-embed-text`
 * 5. Empty strings return valid embeddings (768 zeros) - validate input if needed
 */

const OLLAMA_BASE_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";
const DEFAULT_MODEL = "nomic-embed-text";
const EXPECTED_DIMENSIONS = 768;

interface OllamaEmbeddingRequest {
  model: string;
  prompt: string;
}

interface OllamaEmbeddingResponse {
  embedding: number[];
}

interface OllamaTagsResponse {
  models: Array<{ name: string }>;
}

/**
 * Error class for Ollama-specific failures.
 * Provides informative messages for common issues.
 */
export class OllamaError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = "OllamaError";
  }
}

/**
 * Generate embedding for a single text.
 *
 * @param text - The text to generate an embedding for
 * @param model - The model to use (defaults to nomic-embed-text)
 * @returns A 768-dimensional embedding vector
 * @throws OllamaError if the request fails
 *
 * @example
 * const embedding = await generateEmbedding("function hello() { return 'world'; }");
 * console.log(`Dimensions: ${embedding.length}`); // 768
 */
export async function generateEmbedding(
  text: string,
  model: string = DEFAULT_MODEL
): Promise<number[]> {
  const url = `${OLLAMA_BASE_URL}/api/embeddings`;

  const requestBody: OllamaEmbeddingRequest = {
    model,
    prompt: text,
  };

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
  } catch (error) {
    const cause = error instanceof Error ? error : new Error(String(error));
    throw new OllamaError(
      `Failed to connect to Ollama at ${OLLAMA_BASE_URL}. ` +
        `Is Ollama running? Start with: ollama serve`,
      undefined,
      cause
    );
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");

    if (response.status === 404) {
      throw new OllamaError(
        `Model "${model}" not found. Pull it with: ollama pull ${model}`,
        response.status
      );
    }

    throw new OllamaError(
      `Ollama API error (${response.status}): ${errorText}`,
      response.status
    );
  }

  let data: OllamaEmbeddingResponse;
  try {
    data = (await response.json()) as OllamaEmbeddingResponse;
  } catch (error) {
    throw new OllamaError(
      "Failed to parse Ollama response as JSON",
      response.status,
      error instanceof Error ? error : undefined
    );
  }

  if (!Array.isArray(data.embedding)) {
    throw new OllamaError(
      `Invalid response: expected embedding array, got ${typeof data.embedding}`
    );
  }

  if (data.embedding.length !== EXPECTED_DIMENSIONS) {
    throw new OllamaError(
      `Unexpected embedding dimensions: expected ${EXPECTED_DIMENSIONS}, got ${data.embedding.length}`
    );
  }

  return data.embedding;
}

/**
 * Generate embeddings for multiple texts sequentially.
 *
 * Note: Ollama does not have a batch embedding endpoint, so this
 * processes texts one at a time. For large batches, consider
 * parallelizing with rate limiting.
 *
 * @param texts - Array of texts to generate embeddings for
 * @param model - The model to use (defaults to nomic-embed-text)
 * @returns Array of 768-dimensional embedding vectors (same order as input)
 * @throws OllamaError if any request fails
 *
 * @example
 * const embeddings = await generateBatchEmbeddings([
 *   "function add(a, b) { return a + b; }",
 *   "const sum = (x, y) => x + y;",
 * ]);
 * console.log(`Generated ${embeddings.length} embeddings`);
 */
export async function generateBatchEmbeddings(
  texts: string[],
  model: string = DEFAULT_MODEL
): Promise<number[][]> {
  if (texts.length === 0) {
    return [];
  }

  const embeddings: number[][] = [];

  for (const text of texts) {
    const embedding = await generateEmbedding(text, model);
    embeddings.push(embedding);
  }

  return embeddings;
}

/**
 * Health check - verify Ollama is running with the required model.
 *
 * Checks:
 * 1. Ollama server is reachable
 * 2. The nomic-embed-text model is available
 *
 * @returns true if Ollama is healthy and model is available
 *
 * @example
 * if (await checkOllamaHealth()) {
 *   console.log("Ollama ready for embedding generation");
 * } else {
 *   console.error("Ollama not available");
 * }
 */
export async function checkOllamaHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);

    if (!response.ok) {
      return false;
    }

    const data = (await response.json()) as OllamaTagsResponse;
    const models = data.models || [];

    const hasModel = models.some(
      (m) => m.name === DEFAULT_MODEL || m.name.startsWith(`${DEFAULT_MODEL}:`)
    );

    return hasModel;
  } catch {
    return false;
  }
}

/**
 * Get detailed health status for diagnostics.
 *
 * @returns Object with server status, available models, and any issues
 */
export async function getHealthDetails(): Promise<{
  serverReachable: boolean;
  modelAvailable: boolean;
  availableModels: string[];
  error?: string;
}> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);

    if (!response.ok) {
      return {
        serverReachable: true,
        modelAvailable: false,
        availableModels: [],
        error: `API returned ${response.status}`,
      };
    }

    const data = (await response.json()) as OllamaTagsResponse;
    const models = data.models || [];
    const modelNames = models.map((m) => m.name);

    const hasModel = modelNames.some(
      (name) => name === DEFAULT_MODEL || name.startsWith(`${DEFAULT_MODEL}:`)
    );

    return {
      serverReachable: true,
      modelAvailable: hasModel,
      availableModels: modelNames,
      error: hasModel
        ? undefined
        : `Model "${DEFAULT_MODEL}" not found. Run: ollama pull ${DEFAULT_MODEL}`,
    };
  } catch (error) {
    return {
      serverReachable: false,
      modelAvailable: false,
      availableModels: [],
      error:
        error instanceof Error
          ? `Connection failed: ${error.message}`
          : "Connection failed",
    };
  }
}
