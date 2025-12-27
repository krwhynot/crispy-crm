# Phase 3: Qdrant + Ollama Semantic Search (Days 4-5)

> This phase builds on [Phase 1: Chunk-Based Output](./01-phase-1-chunked-output.md) and [Phase 2: Incremental Extraction](./02-phase-2-incremental-extraction.md). Ensure those are complete before proceeding.

**Goal:** Add vector-based semantic search using Qdrant (self-hosted) and Ollama (free local embeddings).

---

## Task 3.1: Docker Compose setup

**File:** `docker-compose.yml` (add to existing or create)

```yaml
services:
  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"
    volumes:
      - .claude/qdrant:/qdrant/storage

  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - .claude/ollama:/root/.ollama
```

---

## Task 3.2: Start services and pull model

```bash
docker compose up -d qdrant ollama
docker exec ollama ollama pull nomic-embed-text
```

Verify services are running:
```bash
curl http://localhost:6333/health          # Qdrant health check
curl http://localhost:11434/api/version    # Ollama version
```

---

## Task 3.3: Create AST-aware chunking script

**New File:** `scripts/discover/embeddings/chunk.ts`

Uses Tree-sitter for semantic boundaries (functions, classes, interfaces).

```typescript
import Parser from 'tree-sitter';
import TypeScript from 'tree-sitter-typescript';

interface CodeChunk {
  id: string;
  filePath: string;
  type: 'function' | 'class' | 'interface' | 'type' | 'component';
  name: string;
  content: string;
  startLine: number;
  endLine: number;
}

const parser = new Parser();
parser.setLanguage(TypeScript.typescript);

export function chunkFile(filePath: string, content: string): CodeChunk[] {
  const tree = parser.parse(content);
  const chunks: CodeChunk[] = [];

  const visit = (node: Parser.SyntaxNode) => {
    const chunkTypes = [
      'function_declaration',
      'arrow_function',
      'class_declaration',
      'interface_declaration',
      'type_alias_declaration',
    ];

    if (chunkTypes.includes(node.type)) {
      const name = extractName(node);
      if (name) {
        chunks.push({
          id: `${filePath}:${name}`,
          filePath,
          type: mapNodeType(node.type),
          name,
          content: node.text,
          startLine: node.startPosition.row + 1,
          endLine: node.endPosition.row + 1,
        });
      }
    }

    for (const child of node.children) {
      visit(child);
    }
  };

  visit(tree.rootNode);
  return chunks;
}

function extractName(node: Parser.SyntaxNode): string | null {
  const nameNode = node.childForFieldName('name');
  return nameNode?.text ?? null;
}

function mapNodeType(nodeType: string): CodeChunk['type'] {
  switch (nodeType) {
    case 'function_declaration':
    case 'arrow_function':
      return 'function';
    case 'class_declaration':
      return 'class';
    case 'interface_declaration':
      return 'interface';
    case 'type_alias_declaration':
      return 'type';
    default:
      return 'function';
  }
}
```

---

## Task 3.4: Create Ollama embedding client

**New File:** `scripts/discover/embeddings/ollama.ts`

```typescript
const OLLAMA_BASE_URL = process.env.OLLAMA_URL ?? 'http://localhost:11434';

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'nomic-embed-text',
      prompt: text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama embedding failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.embedding; // 768-dimensional vector
}

export async function generateBatchEmbeddings(
  texts: string[]
): Promise<number[][]> {
  const embeddings: number[][] = [];

  for (const text of texts) {
    const embedding = await generateEmbedding(text);
    embeddings.push(embedding);
  }

  return embeddings;
}
```

---

## Task 3.5: Create Qdrant client

**New File:** `scripts/discover/embeddings/qdrant.ts`

```typescript
import { QdrantClient } from '@qdrant/js-client-rest';

const QDRANT_URL = process.env.QDRANT_URL ?? 'http://localhost:6333';
const COLLECTION_NAME = 'crispy_code';
const VECTOR_SIZE = 768; // nomic-embed-text dimension

export const qdrant = new QdrantClient({ url: QDRANT_URL });

export async function ensureCollection(): Promise<void> {
  const collections = await qdrant.getCollections();
  const exists = collections.collections.some(c => c.name === COLLECTION_NAME);

  if (!exists) {
    await qdrant.createCollection(COLLECTION_NAME, {
      vectors: {
        size: VECTOR_SIZE,
        distance: 'Cosine',
      },
    });
    console.log(`✅ Created collection: ${COLLECTION_NAME}`);
  }
}

export async function upsertPoints(
  points: {
    id: string;
    vector: number[];
    payload: Record<string, unknown>;
  }[]
): Promise<void> {
  await qdrant.upsert(COLLECTION_NAME, {
    wait: true,
    points: points.map((p, i) => ({
      id: i, // Qdrant requires numeric or UUID ids
      vector: p.vector,
      payload: { ...p.payload, originalId: p.id },
    })),
  });
}

export async function search(
  queryVector: number[],
  limit = 10
): Promise<
  {
    score: number;
    payload: Record<string, unknown>;
  }[]
> {
  const results = await qdrant.search(COLLECTION_NAME, {
    vector: queryVector,
    limit,
    with_payload: true,
  });

  return results.map(r => ({
    score: r.score,
    payload: r.payload as Record<string, unknown>,
  }));
}
```

---

## Task 3.6: Create embedding indexer

**New File:** `scripts/discover/embeddings/index.ts`

Orchestrates chunking, embedding generation, and Qdrant indexing.

```typescript
import { glob } from 'glob';
import fs from 'fs/promises';
import path from 'path';
import { chunkFile } from './chunk';
import { generateEmbedding } from './ollama';
import { ensureCollection, upsertPoints, search } from './qdrant';

const SOURCE_GLOBS = [
  'src/**/*.ts',
  'src/**/*.tsx',
  '!src/**/*.test.ts',
  '!src/**/*.test.tsx',
  '!node_modules/**',
];

export async function indexCodebase(rootDir: string): Promise<void> {
  console.log('🔍 Starting semantic indexing...');

  await ensureCollection();

  const files = await glob(SOURCE_GLOBS, { cwd: rootDir, absolute: true });
  console.log(`📁 Found ${files.length} source files`);

  let totalChunks = 0;
  const batchSize = 50;
  const points: {
    id: string;
    vector: number[];
    payload: Record<string, unknown>;
  }[] = [];

  for (const filePath of files) {
    const content = await fs.readFile(filePath, 'utf-8');
    const relativePath = path.relative(rootDir, filePath);
    const chunks = chunkFile(relativePath, content);

    for (const chunk of chunks) {
      const embedding = await generateEmbedding(chunk.content);
      points.push({
        id: chunk.id,
        vector: embedding,
        payload: {
          filePath: chunk.filePath,
          type: chunk.type,
          name: chunk.name,
          startLine: chunk.startLine,
          endLine: chunk.endLine,
          preview: chunk.content.slice(0, 200),
        },
      });

      if (points.length >= batchSize) {
        await upsertPoints(points);
        totalChunks += points.length;
        console.log(`📤 Indexed ${totalChunks} chunks...`);
        points.length = 0;
      }
    }
  }

  if (points.length > 0) {
    await upsertPoints(points);
    totalChunks += points.length;
  }

  console.log(`✅ Indexed ${totalChunks} code chunks`);
}

export async function semanticSearch(
  query: string,
  limit = 10
): Promise<
  {
    score: number;
    filePath: string;
    name: string;
    type: string;
    preview: string;
  }[]
> {
  const queryVector = await generateEmbedding(query);
  const results = await search(queryVector, limit);

  return results.map(r => ({
    score: r.score,
    filePath: r.payload.filePath as string,
    name: r.payload.name as string,
    type: r.payload.type as string,
    preview: r.payload.preview as string,
  }));
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  const rootDir = process.cwd();

  if (command === 'index') {
    indexCodebase(rootDir).catch(console.error);
  } else if (command === 'search') {
    const query = process.argv.slice(3).join(' ');
    if (!query) {
      console.error('Usage: npx tsx embeddings/index.ts search <query>');
      process.exit(1);
    }
    semanticSearch(query).then(results => {
      console.log('\n🔎 Search Results:\n');
      results.forEach((r, i) => {
        console.log(`${i + 1}. [${r.score.toFixed(3)}] ${r.type}: ${r.name}`);
        console.log(`   📁 ${r.filePath}`);
        console.log(`   ${r.preview.slice(0, 100)}...\n`);
      });
    });
  } else {
    console.log('Usage:');
    console.log('  npx tsx embeddings/index.ts index     # Index codebase');
    console.log('  npx tsx embeddings/index.ts search <query>  # Semantic search');
  }
}
```

---

## Dependencies

**Add to `package.json`:**

```json
{
  "devDependencies": {
    "@qdrant/js-client-rest": "^1.8.0",
    "tree-sitter": "^0.21.0",
    "tree-sitter-typescript": "^0.21.0"
  }
}
```

Install:
```bash
npm install -D @qdrant/js-client-rest tree-sitter tree-sitter-typescript
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `scripts/discover/embeddings/chunk.ts` | AST-aware code chunking with Tree-sitter |
| `scripts/discover/embeddings/ollama.ts` | Ollama embedding generation client |
| `scripts/discover/embeddings/qdrant.ts` | Qdrant vector database client |
| `scripts/discover/embeddings/index.ts` | Orchestrator: chunking, embedding, indexing |

---

## Phase 3 Verification

```bash
# 1. Start services
docker compose up -d qdrant ollama

# 2. Verify containers running
docker ps | grep -E "qdrant|ollama"

# 3. Verify Qdrant health
curl http://localhost:6333/health
# Expected: {"title":"qdrant - vector search engine","version":"..."}

# 4. Verify Ollama running
curl http://localhost:11434/api/version
# Expected: {"version":"..."}

# 5. Pull embedding model
docker exec ollama ollama pull nomic-embed-text

# 6. Index codebase
npx tsx scripts/discover/embeddings/index.ts index

# 7. Test semantic search
npx tsx scripts/discover/embeddings/index.ts search "form validation"
npx tsx scripts/discover/embeddings/index.ts search "data provider"
npx tsx scripts/discover/embeddings/index.ts search "Zod schema"
```

**Checklist:**

- [ ] Qdrant container running on port 6333
- [ ] Ollama container running on port 11434
- [ ] nomic-embed-text model downloaded
- [ ] Codebase indexed without errors
- [ ] Semantic search returns relevant results
