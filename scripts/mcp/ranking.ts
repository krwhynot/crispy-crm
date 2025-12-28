/**
 * RRF (Reciprocal Rank Fusion) Ranking Algorithm
 *
 * Combines results from FTS5 (exact match) and vector search (semantic)
 * using the Reciprocal Rank Fusion formula to produce a unified ranking.
 *
 * RRF Formula: RRF(d) = sum(1 / (k + rank_i))
 * where k is a constant (default 60) and rank_i is the 1-based rank in each result set.
 *
 * Items found by both sources receive boosted scores as their RRF contributions
 * are summed together.
 */

export interface SearchResult {
  file: string;
  line: number;
  content: string;
}

export interface RankedResult {
  file: string;
  line: number;
  content: string;
  score: number;
  sources: ("fts" | "vector")[];
}

interface IntermediateResult {
  file: string;
  line: number;
  content: string;
  score: number;
  sources: Set<"fts" | "vector">;
}

/**
 * Creates a unique key for deduplication based on file path and line number.
 */
function makeKey(file: string, line: number): string {
  return `${file}:${line}`;
}

/**
 * Computes RRF score for a given rank.
 *
 * @param rank - 1-based rank position
 * @param k - RRF constant (default 60)
 * @returns RRF score contribution
 */
function computeRRFScore(rank: number, k: number): number {
  return 1 / (k + rank);
}

/**
 * Combines results from FTS5 and vector search using Reciprocal Rank Fusion.
 *
 * Algorithm:
 * 1. Create a map keyed by `${file}:${line}` for deduplication
 * 2. For FTS results: add RRF score = 1/(k + rank), mark source as "fts"
 * 3. For vector results: add RRF score = 1/(k + rank), mark source as "vector"
 * 4. If item exists in both, combine scores and add both sources
 * 5. Sort by final score descending
 * 6. Return array of RankedResult
 *
 * @param ftsResults - Results from FTS5 exact match search (ordered by relevance)
 * @param vectorResults - Results from vector/semantic search (ordered by similarity)
 * @param k - RRF constant, default 60 (higher values favor items ranked highly in both lists)
 * @returns Merged and ranked results with combined scores
 *
 * @example
 * const fts = [{ file: "a.ts", line: 10, content: "function foo" }];
 * const vector = [{ file: "a.ts", line: 10, content: "function foo" }];
 * const ranked = rrfRank(fts, vector);
 * // ranked[0].sources includes both "fts" and "vector"
 * // ranked[0].score is higher due to appearing in both lists
 */
export function rrfRank(
  ftsResults: SearchResult[],
  vectorResults: SearchResult[],
  k: number = 60
): RankedResult[] {
  const resultMap = new Map<string, IntermediateResult>();

  for (let i = 0; i < ftsResults.length; i++) {
    const result = ftsResults[i];
    const key = makeKey(result.file, result.line);
    const rank = i + 1;
    const rrfScore = computeRRFScore(rank, k);

    const existing = resultMap.get(key);
    if (existing) {
      existing.score += rrfScore;
      existing.sources.add("fts");
    } else {
      resultMap.set(key, {
        file: result.file,
        line: result.line,
        content: result.content,
        score: rrfScore,
        sources: new Set(["fts"]),
      });
    }
  }

  for (let i = 0; i < vectorResults.length; i++) {
    const result = vectorResults[i];
    const key = makeKey(result.file, result.line);
    const rank = i + 1;
    const rrfScore = computeRRFScore(rank, k);

    const existing = resultMap.get(key);
    if (existing) {
      existing.score += rrfScore;
      existing.sources.add("vector");
    } else {
      resultMap.set(key, {
        file: result.file,
        line: result.line,
        content: result.content,
        score: rrfScore,
        sources: new Set(["vector"]),
      });
    }
  }

  const results = Array.from(resultMap.values());

  results.sort((a, b) => b.score - a.score);

  return results.map((r) => ({
    file: r.file,
    line: r.line,
    content: r.content,
    score: r.score,
    sources: Array.from(r.sources) as ("fts" | "vector")[],
  }));
}
