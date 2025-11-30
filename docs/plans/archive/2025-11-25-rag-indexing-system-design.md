# RAG Indexing System for Project Knowledge

**Created:** 2025-11-25
**Status:** Design Complete
**Purpose:** Claude Code context enhancement via semantic search

---

## Executive Summary

This system intercepts Claude Code queries, performs semantic search against indexed project knowledge, and injects only relevant context - reducing token usage by ~67% (75K → 25K tokens typical).

### Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Storage** | SQLite + sqlite-vss | Zero latency, offline-capable, easy inspection |
| **Content** | Code + Docs + Skills | Covers "what", "why", and "how" |
| **Chunking** | Hybrid (AST + fixed) | Semantic boundaries for code, paragraphs for docs |
| **Updates** | Hook + Git + CLI | Real-time, batch, and manual options |
| **Embeddings** | 3 options documented | OpenAI, Ollama, Sentence Transformers |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Claude Code Session                          │
└─────────────────────────┬───────────────────────────────────────┘
                          │ User Query
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                 UserPromptSubmit Hook                            │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │ Extract Query │───▶│ Embed Query  │───▶│ Search Index │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│                                                   │              │
│                                                   ▼              │
│                                          ┌──────────────┐       │
│                                          │ Top-K Results│       │
│                                          └──────┬───────┘       │
│                                                 │               │
│                              ┌──────────────────┘               │
│                              ▼                                  │
│                    ┌──────────────────┐                         │
│                    │ Inject Context   │                         │
│                    │ (system-reminder)│                         │
│                    └────────┬─────────┘                         │
└─────────────────────────────┼───────────────────────────────────┘
                              │ Enhanced Query
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Claude Processes Query                       │
│                  (with focused 25K token context)                │
└─────────────────────────────────────────────────────────────────┘
```

### Index Update Flow

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   PostToolUse    │     │   Git Commit     │     │   Manual CLI     │
│   Hook (Write)   │     │   Hook           │     │   npm run rag:*  │
└────────┬─────────┘     └────────┬─────────┘     └────────┬─────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Index Manager                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │ Detect Change│───▶│ Chunk File   │───▶│ Embed Chunks │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│                                                   │              │
│                                                   ▼              │
│                                          ┌──────────────┐       │
│                                          │ Upsert SQLite│       │
│                                          └──────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

---

## File Structure

```
.claude/
├── rag/
│   ├── index.db              # SQLite database with sqlite-vss
│   ├── config.json           # RAG configuration
│   ├── embedder.py           # Embedding generation script
│   ├── indexer.py            # Chunking + indexing logic
│   ├── searcher.py           # Query + retrieval logic
│   └── requirements.txt      # Python dependencies
├── hooks/
│   ├── rag-query-hook.sh     # UserPromptSubmit hook (new)
│   ├── rag-index-hook.sh     # PostToolUse hook (new)
│   └── ... (existing hooks)
└── settings.json             # Hook configuration (updated)
```

---

## Component Details

### 1. SQLite Database Schema

```sql
-- Main chunks table
CREATE TABLE chunks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_path TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    chunk_type TEXT NOT NULL,  -- 'code', 'doc', 'skill', 'migration'
    symbol_name TEXT,          -- For AST chunks: function/class name
    start_line INTEGER,
    end_line INTEGER,
    token_count INTEGER,
    file_hash TEXT NOT NULL,   -- For change detection
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(file_path, chunk_index)
);

-- Metadata table
CREATE TABLE index_metadata (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- sqlite-vss virtual table (created after extension load)
-- Dimensions depend on embedding model:
--   OpenAI: 1536
--   Ollama nomic-embed-text: 768
--   Sentence Transformers all-MiniLM-L6-v2: 384

CREATE VIRTUAL TABLE vss_chunks USING vss0(
    embedding(384)  -- Adjust based on model choice
);
```

### 2. Configuration File

```json
// .claude/rag/config.json
{
  "version": "1.0.0",
  "embedding": {
    "provider": "sentence-transformers",  // or "openai", "ollama"
    "model": "all-MiniLM-L6-v2",
    "dimensions": 384,
    "batch_size": 32
  },
  "indexing": {
    "sources": [
      {
        "pattern": "src/**/*.{ts,tsx}",
        "type": "code",
        "chunking": "ast"
      },
      {
        "pattern": "docs/**/*.md",
        "type": "doc",
        "chunking": "fixed",
        "chunk_size": 500,
        "overlap": 50
      },
      {
        "pattern": ".claude/skills/**/*.md",
        "type": "skill",
        "chunking": "fixed",
        "chunk_size": 500,
        "overlap": 50
      },
      {
        "pattern": ".claude/commands/**/*.md",
        "type": "skill",
        "chunking": "fixed",
        "chunk_size": 500,
        "overlap": 50
      },
      {
        "pattern": "CLAUDE.md",
        "type": "doc",
        "chunking": "fixed",
        "chunk_size": 500,
        "overlap": 50
      }
    ],
    "exclude": [
      "node_modules/**",
      "dist/**",
      "**/*.test.ts",
      "**/*.spec.ts"
    ]
  },
  "search": {
    "top_k": 20,
    "min_similarity": 0.3,
    "max_tokens": 25000,
    "rerank": true
  }
}
```

---

## Setup Instructions

### Prerequisites (All Options)

```bash
# 1. Install Python 3.10+ (if not present)
python3 --version  # Should be 3.10+

# 2. Create virtual environment
cd /home/krwhynot/projects/crispy-crm
python3 -m venv .claude/rag/.venv
source .claude/rag/.venv/bin/activate

# 3. Install base dependencies
pip install sqlite-vss tree-sitter tree-sitter-typescript
```

---

## Option A: OpenAI Embeddings

**Best for:** Highest quality code understanding, low cost (~$0.02/1M tokens)

### Setup

```bash
# 1. Activate virtual environment
source .claude/rag/.venv/bin/activate

# 2. Install OpenAI SDK
pip install openai

# 3. Set API key (add to .env or export)
export OPENAI_API_KEY="sk-..."

# 4. Update config.json
```

```json
// .claude/rag/config.json - embedding section
{
  "embedding": {
    "provider": "openai",
    "model": "text-embedding-3-small",
    "dimensions": 1536,
    "batch_size": 100
  }
}
```

### Embedder Implementation

```python
# .claude/rag/embedders/openai_embedder.py
"""OpenAI embedding provider for RAG system."""

import os
from typing import List
from openai import OpenAI

class OpenAIEmbedder:
    """Generate embeddings using OpenAI API."""

    def __init__(self, model: str = "text-embedding-3-small"):
        self.client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
        self.model = model
        self.dimensions = 1536

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        """Embed multiple texts in a single API call."""
        response = self.client.embeddings.create(
            model=self.model,
            input=texts
        )
        return [item.embedding for item in response.data]

    def embed_query(self, query: str) -> List[float]:
        """Embed a single query string."""
        return self.embed_texts([query])[0]


# Usage example
if __name__ == "__main__":
    embedder = OpenAIEmbedder()

    # Test embedding
    texts = ["How does the dashboard work?", "Contact management system"]
    embeddings = embedder.embed_texts(texts)

    print(f"Generated {len(embeddings)} embeddings")
    print(f"Dimensions: {len(embeddings[0])}")
```

### Cost Estimation

| Content | Estimated Tokens | Cost |
|---------|-----------------|------|
| Source code (~683 files) | ~500K tokens | $0.01 |
| Documentation (~50 files) | ~100K tokens | $0.002 |
| Skills/Commands (~30 files) | ~50K tokens | $0.001 |
| **Total initial index** | ~650K tokens | **~$0.013** |
| Daily re-indexing (10 files) | ~10K tokens | ~$0.0002 |

---

## Option B: Ollama Local Embeddings

**Best for:** Offline capability, privacy, good quality

### Setup

```bash
# 1. Install Ollama (if not present)
curl -fsSL https://ollama.com/install.sh | sh

# 2. Pull the embedding model
ollama pull nomic-embed-text

# 3. Verify installation
ollama list  # Should show nomic-embed-text

# 4. Activate virtual environment
source .claude/rag/.venv/bin/activate

# 5. Install Ollama Python client
pip install ollama

# 6. Update config.json
```

```json
// .claude/rag/config.json - embedding section
{
  "embedding": {
    "provider": "ollama",
    "model": "nomic-embed-text",
    "dimensions": 768,
    "batch_size": 32,
    "base_url": "http://localhost:11434"
  }
}
```

### Embedder Implementation

```python
# .claude/rag/embedders/ollama_embedder.py
"""Ollama embedding provider for RAG system."""

from typing import List
import ollama

class OllamaEmbedder:
    """Generate embeddings using local Ollama server."""

    def __init__(self, model: str = "nomic-embed-text"):
        self.model = model
        self.dimensions = 768
        self.client = ollama.Client()

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        """Embed multiple texts (sequential calls)."""
        embeddings = []
        for text in texts:
            response = self.client.embeddings(
                model=self.model,
                prompt=text
            )
            embeddings.append(response["embedding"])
        return embeddings

    def embed_query(self, query: str) -> List[float]:
        """Embed a single query string."""
        response = self.client.embeddings(
            model=self.model,
            prompt=query
        )
        return response["embedding"]


# Usage example
if __name__ == "__main__":
    embedder = OllamaEmbedder()

    # Test embedding
    texts = ["How does the dashboard work?", "Contact management system"]
    embeddings = embedder.embed_texts(texts)

    print(f"Generated {len(embeddings)} embeddings")
    print(f"Dimensions: {len(embeddings[0])}")
```

### Performance Notes

- **First run:** Model loads into memory (~2-3 seconds)
- **Subsequent:** ~50-100ms per embedding
- **Memory:** ~2GB RAM while model is loaded
- **GPU:** Automatically uses CUDA if available

---

## Option C: Sentence Transformers (Fully Local)

**Best for:** Fastest setup, zero dependencies, CPU-only friendly

### Setup

```bash
# 1. Activate virtual environment
source .claude/rag/.venv/bin/activate

# 2. Install sentence-transformers
pip install sentence-transformers

# 3. Download model (happens automatically on first use)
python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

# 4. Update config.json
```

```json
// .claude/rag/config.json - embedding section
{
  "embedding": {
    "provider": "sentence-transformers",
    "model": "all-MiniLM-L6-v2",
    "dimensions": 384,
    "batch_size": 64
  }
}
```

### Embedder Implementation

```python
# .claude/rag/embedders/st_embedder.py
"""Sentence Transformers embedding provider for RAG system."""

from typing import List
from sentence_transformers import SentenceTransformer

class SentenceTransformersEmbedder:
    """Generate embeddings using local Sentence Transformers."""

    def __init__(self, model: str = "all-MiniLM-L6-v2"):
        self.model = SentenceTransformer(model)
        self.dimensions = 384

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        """Embed multiple texts in a single batch."""
        embeddings = self.model.encode(
            texts,
            convert_to_numpy=True,
            show_progress_bar=False
        )
        return embeddings.tolist()

    def embed_query(self, query: str) -> List[float]:
        """Embed a single query string."""
        embedding = self.model.encode(
            query,
            convert_to_numpy=True
        )
        return embedding.tolist()


# Usage example
if __name__ == "__main__":
    embedder = SentenceTransformersEmbedder()

    # Test embedding
    texts = ["How does the dashboard work?", "Contact management system"]
    embeddings = embedder.embed_texts(texts)

    print(f"Generated {len(embeddings)} embeddings")
    print(f"Dimensions: {len(embeddings[0])}")
```

### Performance Notes

- **Model size:** ~90MB download
- **Memory:** ~500MB RAM
- **Speed:** ~100 embeddings/second on CPU
- **Quality:** Good for general text, slightly less optimal for code

---

## Unified Embedder Factory

```python
# .claude/rag/embedder.py
"""Factory for creating embedding providers."""

import json
from pathlib import Path
from typing import Protocol, List

class Embedder(Protocol):
    """Protocol for embedding providers."""
    dimensions: int
    def embed_texts(self, texts: List[str]) -> List[List[float]]: ...
    def embed_query(self, query: str) -> List[float]: ...


def create_embedder(config_path: str = None) -> Embedder:
    """Create embedder based on config.json settings."""
    if config_path is None:
        config_path = Path(__file__).parent / "config.json"

    with open(config_path) as f:
        config = json.load(f)

    provider = config["embedding"]["provider"]
    model = config["embedding"]["model"]

    if provider == "openai":
        from embedders.openai_embedder import OpenAIEmbedder
        return OpenAIEmbedder(model=model)

    elif provider == "ollama":
        from embedders.ollama_embedder import OllamaEmbedder
        return OllamaEmbedder(model=model)

    elif provider == "sentence-transformers":
        from embedders.st_embedder import SentenceTransformersEmbedder
        return SentenceTransformersEmbedder(model=model)

    else:
        raise ValueError(f"Unknown embedding provider: {provider}")


if __name__ == "__main__":
    # Test factory
    embedder = create_embedder()
    print(f"Created embedder with {embedder.dimensions} dimensions")
```

---

## Chunking Strategies

### AST-Based Chunking (TypeScript/TSX)

```python
# .claude/rag/chunkers/ast_chunker.py
"""AST-aware chunking for TypeScript/TSX files."""

from typing import List, Dict, Any
from pathlib import Path
import tree_sitter_typescript as ts_typescript
from tree_sitter import Language, Parser

class ASTChunker:
    """Chunk TypeScript files by semantic boundaries."""

    def __init__(self):
        # Initialize tree-sitter for TypeScript
        self.ts_language = Language(ts_typescript.language_typescript())
        self.tsx_language = Language(ts_typescript.language_tsx())
        self.parser = Parser()

    def chunk_file(self, file_path: str) -> List[Dict[str, Any]]:
        """Split file into semantic chunks (functions, classes, components)."""
        path = Path(file_path)
        content = path.read_text()

        # Select language based on extension
        if path.suffix == ".tsx":
            self.parser.language = self.tsx_language
        else:
            self.parser.language = self.ts_language

        tree = self.parser.parse(content.encode())
        chunks = []

        # Walk AST for exportable symbols
        self._extract_chunks(tree.root_node, content, chunks, file_path)

        return chunks

    def _extract_chunks(self, node, content: str, chunks: List, file_path: str):
        """Recursively extract function/class/component definitions."""
        # Types to extract as separate chunks
        chunk_types = {
            "function_declaration",
            "arrow_function",
            "class_declaration",
            "interface_declaration",
            "type_alias_declaration",
            "export_statement",
            "lexical_declaration",  # const Component = ...
        }

        if node.type in chunk_types:
            start_line = node.start_point[0] + 1
            end_line = node.end_point[0] + 1
            chunk_content = content[node.start_byte:node.end_byte]

            # Extract symbol name
            symbol_name = self._get_symbol_name(node, content)

            if chunk_content.strip():
                chunks.append({
                    "content": chunk_content,
                    "symbol_name": symbol_name,
                    "start_line": start_line,
                    "end_line": end_line,
                    "chunk_type": "code",
                    "file_path": file_path
                })

        # Recurse into children
        for child in node.children:
            self._extract_chunks(child, content, chunks, file_path)

    def _get_symbol_name(self, node, content: str) -> str:
        """Extract the name of a symbol from an AST node."""
        # Look for identifier child nodes
        for child in node.children:
            if child.type == "identifier":
                return content[child.start_byte:child.end_byte]
            if child.type == "variable_declarator":
                for subchild in child.children:
                    if subchild.type in ("identifier", "property_identifier"):
                        return content[subchild.start_byte:subchild.end_byte]
        return "anonymous"
```

### Fixed-Size Chunking (Markdown/SQL)

```python
# .claude/rag/chunkers/fixed_chunker.py
"""Fixed-size chunking with overlap for prose content."""

from typing import List, Dict, Any
from pathlib import Path
import tiktoken

class FixedChunker:
    """Chunk files into fixed-size pieces with overlap."""

    def __init__(self, chunk_size: int = 500, overlap: int = 50):
        self.chunk_size = chunk_size
        self.overlap = overlap
        self.tokenizer = tiktoken.get_encoding("cl100k_base")

    def chunk_file(self, file_path: str, chunk_type: str = "doc") -> List[Dict[str, Any]]:
        """Split file into overlapping fixed-size chunks."""
        path = Path(file_path)
        content = path.read_text()

        # Tokenize content
        tokens = self.tokenizer.encode(content)
        chunks = []

        # Slide window with overlap
        start = 0
        chunk_index = 0

        while start < len(tokens):
            end = min(start + self.chunk_size, len(tokens))
            chunk_tokens = tokens[start:end]
            chunk_content = self.tokenizer.decode(chunk_tokens)

            # Calculate approximate line numbers
            prefix_content = self.tokenizer.decode(tokens[:start])
            start_line = prefix_content.count('\n') + 1
            end_line = start_line + chunk_content.count('\n')

            chunks.append({
                "content": chunk_content,
                "symbol_name": None,
                "start_line": start_line,
                "end_line": end_line,
                "chunk_type": chunk_type,
                "file_path": file_path,
                "chunk_index": chunk_index,
                "token_count": len(chunk_tokens)
            })

            # Move window (with overlap)
            start = end - self.overlap if end < len(tokens) else len(tokens)
            chunk_index += 1

        return chunks
```

### Hybrid Chunker (Factory)

```python
# .claude/rag/chunker.py
"""Unified chunker that selects strategy based on file type."""

import json
from pathlib import Path
from typing import List, Dict, Any
from chunkers.ast_chunker import ASTChunker
from chunkers.fixed_chunker import FixedChunker

class HybridChunker:
    """Route files to appropriate chunking strategy."""

    def __init__(self, config_path: str = None):
        if config_path is None:
            config_path = Path(__file__).parent / "config.json"

        with open(config_path) as f:
            self.config = json.load(f)

        self.ast_chunker = ASTChunker()
        self.fixed_chunker = FixedChunker(
            chunk_size=500,
            overlap=50
        )

    def chunk_file(self, file_path: str) -> List[Dict[str, Any]]:
        """Chunk file using appropriate strategy."""
        path = Path(file_path)

        # Determine chunk type and strategy from config
        for source in self.config["indexing"]["sources"]:
            if path.match(source["pattern"]):
                chunk_type = source["type"]
                strategy = source["chunking"]

                if strategy == "ast":
                    return self.ast_chunker.chunk_file(file_path)
                else:
                    return self.fixed_chunker.chunk_file(
                        file_path,
                        chunk_type=chunk_type
                    )

        # Default to fixed chunking
        return self.fixed_chunker.chunk_file(file_path, chunk_type="unknown")
```

---

## Indexer Implementation

```python
# .claude/rag/indexer.py
"""Main indexing orchestrator."""

import json
import hashlib
import sqlite3
from pathlib import Path
from typing import List, Optional
from glob import glob

from chunker import HybridChunker
from embedder import create_embedder

class RAGIndexer:
    """Index project files for semantic search."""

    def __init__(self, project_root: str = None, config_path: str = None):
        self.project_root = Path(project_root or Path.cwd())
        self.config_path = config_path or self.project_root / ".claude/rag/config.json"

        with open(self.config_path) as f:
            self.config = json.load(f)

        self.db_path = self.project_root / ".claude/rag/index.db"
        self.chunker = HybridChunker(self.config_path)
        self.embedder = create_embedder(self.config_path)

        self._init_db()

    def _init_db(self):
        """Initialize SQLite database with sqlite-vss."""
        self.db_path.parent.mkdir(parents=True, exist_ok=True)

        conn = sqlite3.connect(self.db_path)
        conn.enable_load_extension(True)
        conn.load_extension("vss0")

        conn.executescript("""
            CREATE TABLE IF NOT EXISTS chunks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                file_path TEXT NOT NULL,
                chunk_index INTEGER NOT NULL,
                content TEXT NOT NULL,
                chunk_type TEXT NOT NULL,
                symbol_name TEXT,
                start_line INTEGER,
                end_line INTEGER,
                token_count INTEGER,
                file_hash TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(file_path, chunk_index)
            );

            CREATE TABLE IF NOT EXISTS index_metadata (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_chunks_file_path ON chunks(file_path);
            CREATE INDEX IF NOT EXISTS idx_chunks_type ON chunks(chunk_type);
        """)

        # Create VSS table if not exists
        dimensions = self.config["embedding"]["dimensions"]
        try:
            conn.execute(f"""
                CREATE VIRTUAL TABLE IF NOT EXISTS vss_chunks
                USING vss0(embedding({dimensions}))
            """)
        except sqlite3.OperationalError:
            pass  # Table exists

        conn.commit()
        conn.close()

    def _file_hash(self, file_path: Path) -> str:
        """Calculate SHA256 hash of file content."""
        content = file_path.read_bytes()
        return hashlib.sha256(content).hexdigest()

    def _get_files_to_index(self) -> List[Path]:
        """Get all files matching configured patterns."""
        files = []

        for source in self.config["indexing"]["sources"]:
            pattern = source["pattern"]
            matches = glob(str(self.project_root / pattern), recursive=True)
            files.extend(Path(m) for m in matches)

        # Apply exclusions
        exclude_patterns = self.config["indexing"].get("exclude", [])
        filtered = []
        for f in files:
            rel_path = str(f.relative_to(self.project_root))
            excluded = any(
                Path(rel_path).match(excl)
                for excl in exclude_patterns
            )
            if not excluded:
                filtered.append(f)

        return filtered

    def _needs_reindex(self, file_path: Path, conn: sqlite3.Connection) -> bool:
        """Check if file needs re-indexing based on hash."""
        current_hash = self._file_hash(file_path)
        rel_path = str(file_path.relative_to(self.project_root))

        cursor = conn.execute(
            "SELECT file_hash FROM chunks WHERE file_path = ? LIMIT 1",
            (rel_path,)
        )
        row = cursor.fetchone()

        if row is None:
            return True
        return row[0] != current_hash

    def index_file(self, file_path: Path, force: bool = False) -> int:
        """Index a single file. Returns number of chunks created."""
        conn = sqlite3.connect(self.db_path)
        conn.enable_load_extension(True)
        conn.load_extension("vss0")

        rel_path = str(file_path.relative_to(self.project_root))

        # Check if re-indexing needed
        if not force and not self._needs_reindex(file_path, conn):
            conn.close()
            return 0

        # Delete existing chunks for this file
        cursor = conn.execute(
            "SELECT rowid FROM chunks WHERE file_path = ?",
            (rel_path,)
        )
        old_rowids = [row[0] for row in cursor.fetchall()]

        if old_rowids:
            conn.execute(
                f"DELETE FROM chunks WHERE file_path = ?",
                (rel_path,)
            )
            for rowid in old_rowids:
                conn.execute(
                    "DELETE FROM vss_chunks WHERE rowid = ?",
                    (rowid,)
                )

        # Chunk the file
        chunks = self.chunker.chunk_file(str(file_path))
        if not chunks:
            conn.commit()
            conn.close()
            return 0

        # Generate embeddings
        contents = [c["content"] for c in chunks]
        embeddings = self.embedder.embed_texts(contents)

        # Insert chunks and embeddings
        file_hash = self._file_hash(file_path)

        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            cursor = conn.execute("""
                INSERT INTO chunks
                (file_path, chunk_index, content, chunk_type, symbol_name,
                 start_line, end_line, token_count, file_hash)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                rel_path,
                i,
                chunk["content"],
                chunk["chunk_type"],
                chunk.get("symbol_name"),
                chunk.get("start_line"),
                chunk.get("end_line"),
                chunk.get("token_count", len(chunk["content"].split())),
                file_hash
            ))

            rowid = cursor.lastrowid

            # Insert embedding
            embedding_json = json.dumps(embedding)
            conn.execute(
                "INSERT INTO vss_chunks (rowid, embedding) VALUES (?, ?)",
                (rowid, embedding_json)
            )

        conn.commit()
        conn.close()

        return len(chunks)

    def index_all(self, force: bool = False) -> dict:
        """Index all configured files. Returns statistics."""
        files = self._get_files_to_index()

        stats = {
            "total_files": len(files),
            "indexed_files": 0,
            "skipped_files": 0,
            "total_chunks": 0
        }

        for file_path in files:
            try:
                chunks_created = self.index_file(file_path, force=force)
                if chunks_created > 0:
                    stats["indexed_files"] += 1
                    stats["total_chunks"] += chunks_created
                else:
                    stats["skipped_files"] += 1
            except Exception as e:
                print(f"Error indexing {file_path}: {e}")

        return stats


if __name__ == "__main__":
    import sys

    indexer = RAGIndexer()

    if len(sys.argv) > 1 and sys.argv[1] == "--force":
        stats = indexer.index_all(force=True)
    else:
        stats = indexer.index_all()

    print(f"Indexing complete:")
    print(f"  Total files: {stats['total_files']}")
    print(f"  Indexed: {stats['indexed_files']}")
    print(f"  Skipped (unchanged): {stats['skipped_files']}")
    print(f"  Total chunks: {stats['total_chunks']}")
```

---

## Searcher Implementation

```python
# .claude/rag/searcher.py
"""Semantic search against indexed content."""

import json
import sqlite3
from pathlib import Path
from typing import List, Dict, Any, Optional

from embedder import create_embedder

class RAGSearcher:
    """Search indexed content using semantic similarity."""

    def __init__(self, project_root: str = None, config_path: str = None):
        self.project_root = Path(project_root or Path.cwd())
        self.config_path = config_path or self.project_root / ".claude/rag/config.json"

        with open(self.config_path) as f:
            self.config = json.load(f)

        self.db_path = self.project_root / ".claude/rag/index.db"
        self.embedder = create_embedder(self.config_path)

        self.top_k = self.config["search"]["top_k"]
        self.min_similarity = self.config["search"]["min_similarity"]
        self.max_tokens = self.config["search"]["max_tokens"]

    def search(
        self,
        query: str,
        top_k: Optional[int] = None,
        chunk_types: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """Search for relevant chunks. Returns ranked results."""
        top_k = top_k or self.top_k

        # Embed query
        query_embedding = self.embedder.embed_query(query)
        query_json = json.dumps(query_embedding)

        # Connect to database
        conn = sqlite3.connect(self.db_path)
        conn.enable_load_extension(True)
        conn.load_extension("vss0")

        # Search VSS index
        cursor = conn.execute("""
            SELECT
                rowid,
                distance
            FROM vss_chunks
            WHERE vss_search(embedding, ?)
            LIMIT ?
        """, (query_json, top_k * 2))  # Fetch extra for filtering

        vss_results = cursor.fetchall()

        # Fetch chunk details
        results = []
        for rowid, distance in vss_results:
            # Convert distance to similarity (cosine)
            similarity = 1 - distance

            if similarity < self.min_similarity:
                continue

            cursor = conn.execute("""
                SELECT
                    file_path, chunk_index, content, chunk_type,
                    symbol_name, start_line, end_line, token_count
                FROM chunks
                WHERE rowid = ?
            """, (rowid,))

            row = cursor.fetchone()
            if row:
                chunk_type = row[3]

                # Filter by chunk type if specified
                if chunk_types and chunk_type not in chunk_types:
                    continue

                results.append({
                    "file_path": row[0],
                    "chunk_index": row[1],
                    "content": row[2],
                    "chunk_type": chunk_type,
                    "symbol_name": row[4],
                    "start_line": row[5],
                    "end_line": row[6],
                    "token_count": row[7],
                    "similarity": round(similarity, 4)
                })

        conn.close()

        # Sort by similarity and limit
        results.sort(key=lambda x: x["similarity"], reverse=True)
        return results[:top_k]

    def search_with_token_limit(
        self,
        query: str,
        max_tokens: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Search and return results up to token limit."""
        max_tokens = max_tokens or self.max_tokens

        # Get more results than needed
        results = self.search(query, top_k=50)

        # Select results up to token limit
        selected = []
        total_tokens = 0

        for result in results:
            token_count = result.get("token_count", len(result["content"].split()))

            if total_tokens + token_count <= max_tokens:
                selected.append(result)
                total_tokens += token_count
            else:
                break

        return selected

    def format_context(self, results: List[Dict[str, Any]]) -> str:
        """Format search results as context string for injection."""
        if not results:
            return ""

        lines = ["<rag-context>"]

        for r in results:
            file_path = r["file_path"]
            start_line = r.get("start_line", "?")
            end_line = r.get("end_line", "?")
            symbol = r.get("symbol_name", "")
            similarity = r["similarity"]

            header = f"### {file_path}"
            if symbol:
                header += f" - {symbol}"
            header += f" (L{start_line}-{end_line}, sim={similarity})"

            lines.append(header)
            lines.append("```")
            lines.append(r["content"])
            lines.append("```")
            lines.append("")

        lines.append("</rag-context>")

        return "\n".join(lines)


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python searcher.py <query>")
        sys.exit(1)

    query = " ".join(sys.argv[1:])
    searcher = RAGSearcher()

    results = searcher.search_with_token_limit(query)
    context = searcher.format_context(results)

    print(f"Query: {query}")
    print(f"Results: {len(results)}")
    print("-" * 50)
    print(context)
```

---

## Hook Integration

### Query Hook (UserPromptSubmit)

```bash
#!/usr/bin/env bash
# .claude/hooks/rag-query-hook.sh
# Intercepts user prompts and injects relevant context

set -euo pipefail

# Read JSON input from stdin
input=$(cat)

# Extract the user's message
message=$(echo "$input" | grep -oP '"message"\s*:\s*"\K[^"]+' || echo "")

# Skip if no message or too short
if [ -z "$message" ] || [ ${#message} -lt 10 ]; then
    exit 0
fi

# Get project directory
project_dir="${CLAUDE_PROJECT_DIR:-$(pwd)}"
rag_dir="$project_dir/.claude/rag"

# Check if RAG is configured
if [ ! -f "$rag_dir/index.db" ]; then
    exit 0
fi

# Activate virtual environment and run search
source "$rag_dir/.venv/bin/activate" 2>/dev/null || exit 0

# Search and get context
context=$(python "$rag_dir/searcher.py" "$message" 2>/dev/null || echo "")

# If context found, output it for injection
if [ -n "$context" ] && [ "$context" != "Results: 0" ]; then
    echo "$context"
fi

exit 0
```

### Index Hook (PostToolUse)

```bash
#!/usr/bin/env bash
# .claude/hooks/rag-index-hook.sh
# Re-indexes files after Write/Edit operations

set -euo pipefail

# Read JSON input from stdin
input=$(cat)

# Extract the file path
file_path=$(echo "$input" | grep -oP '"file_path"\s*:\s*"\K[^"]+' || echo "")

# Skip if no file path
if [ -z "$file_path" ]; then
    exit 0
fi

# Get project directory
project_dir="${CLAUDE_PROJECT_DIR:-$(pwd)}"
rag_dir="$project_dir/.claude/rag"

# Check if RAG is configured
if [ ! -f "$rag_dir/config.json" ]; then
    exit 0
fi

# Check if file matches indexing patterns
should_index=$(python -c "
import json
from pathlib import Path

config = json.load(open('$rag_dir/config.json'))
file_path = Path('$file_path')

for source in config['indexing']['sources']:
    if file_path.match(source['pattern']):
        print('yes')
        break
" 2>/dev/null || echo "no")

if [ "$should_index" != "yes" ]; then
    exit 0
fi

# Re-index the file in background
source "$rag_dir/.venv/bin/activate" 2>/dev/null || exit 0

python -c "
from indexer import RAGIndexer
from pathlib import Path

indexer = RAGIndexer('$project_dir')
indexer.index_file(Path('$file_path'), force=True)
" 2>/dev/null &

exit 0
```

### Settings.json Updates

```json
// Add to .claude/settings.json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/rag-query-hook.sh"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/rag-index-hook.sh"
          }
        ]
      }
    ]
  }
}
```

---

## CLI Commands

Add to `package.json`:

```json
{
  "scripts": {
    "rag:index": "cd .claude/rag && source .venv/bin/activate && python indexer.py",
    "rag:index:force": "cd .claude/rag && source .venv/bin/activate && python indexer.py --force",
    "rag:search": "cd .claude/rag && source .venv/bin/activate && python searcher.py",
    "rag:stats": "cd .claude/rag && sqlite3 index.db 'SELECT chunk_type, COUNT(*) FROM chunks GROUP BY chunk_type'"
  }
}
```

### Git Hook (Post-Commit)

```bash
#!/usr/bin/env bash
# .git/hooks/post-commit
# Index changed files after commit

project_dir="$(git rev-parse --show-toplevel)"
rag_dir="$project_dir/.claude/rag"

# Check if RAG is configured
if [ ! -f "$rag_dir/config.json" ]; then
    exit 0
fi

# Get changed files from last commit
changed_files=$(git diff-tree --no-commit-id --name-only -r HEAD)

# Activate venv and index each file
source "$rag_dir/.venv/bin/activate" 2>/dev/null || exit 0

for file in $changed_files; do
    if [ -f "$project_dir/$file" ]; then
        python -c "
from indexer import RAGIndexer
from pathlib import Path

indexer = RAGIndexer('$project_dir')
indexer.index_file(Path('$project_dir/$file'), force=True)
" 2>/dev/null
    fi
done

exit 0
```

---

## Full Setup Checklist

### Initial Setup

```bash
# 1. Create RAG directory structure
mkdir -p .claude/rag/embedders
mkdir -p .claude/rag/chunkers

# 2. Create Python virtual environment
python3 -m venv .claude/rag/.venv
source .claude/rag/.venv/bin/activate

# 3. Install base dependencies
pip install sqlite-vss tiktoken tree-sitter tree-sitter-typescript

# 4. Install embedding provider (choose one)
# Option A: OpenAI
pip install openai

# Option B: Ollama
pip install ollama
ollama pull nomic-embed-text

# Option C: Sentence Transformers
pip install sentence-transformers

# 5. Copy Python files from this document to .claude/rag/
# - config.json
# - embedder.py
# - indexer.py
# - searcher.py
# - chunker.py
# - chunkers/ast_chunker.py
# - chunkers/fixed_chunker.py
# - embedders/openai_embedder.py (if using OpenAI)
# - embedders/ollama_embedder.py (if using Ollama)
# - embedders/st_embedder.py (if using Sentence Transformers)

# 6. Update config.json with your embedding choice

# 7. Copy hook scripts
# - .claude/hooks/rag-query-hook.sh
# - .claude/hooks/rag-index-hook.sh

# 8. Make hooks executable
chmod +x .claude/hooks/rag-*.sh

# 9. Update .claude/settings.json with hook configuration

# 10. Initial indexing
npm run rag:index

# 11. Verify
npm run rag:stats
```

### Verification

```bash
# Test search
npm run rag:search "how does the dashboard work"

# Should return relevant chunks from:
# - src/atomic-crm/dashboard/v3/*.tsx
# - docs/dashboard/*.md
# - CLAUDE.md (dashboard section)
```

---

## Troubleshooting

### sqlite-vss Installation Issues

```bash
# If pip install sqlite-vss fails, try:
pip install sqlite-vss --no-binary :all:

# Or build from source:
git clone https://github.com/asg017/sqlite-vss.git
cd sqlite-vss
make loadable
```

### Embedding Model Not Found (Ollama)

```bash
# Ensure Ollama is running
ollama serve

# Pull model
ollama pull nomic-embed-text
```

### Index Database Corruption

```bash
# Delete and rebuild
rm .claude/rag/index.db
npm run rag:index:force
```

### Hook Not Firing

```bash
# Check hook permissions
ls -la .claude/hooks/rag-*.sh

# Test hook manually
echo '{"message": "test query"}' | .claude/hooks/rag-query-hook.sh
```

---

## Performance Benchmarks

| Metric | Expected |
|--------|----------|
| Initial indexing (800 files) | 2-5 minutes |
| Single file re-index | <500ms |
| Search query | <50ms |
| Context injection | <10ms |

---

## Future Enhancements

1. **Reranking:** Add cross-encoder reranking for better relevance
2. **Caching:** LRU cache for frequent queries
3. **Incremental updates:** Only re-embed changed portions
4. **Multi-modal:** Index images/diagrams with CLIP embeddings
5. **Query expansion:** Expand queries with synonyms/related terms

---

*Design document generated: 2025-11-25*
