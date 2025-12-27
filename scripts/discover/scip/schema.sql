-- SCIP Index SQLite Schema with FTS5 Trigram Search
--
-- This schema stores SCIP index data in SQLite with full-text search
-- capabilities using the FTS5 trigram tokenizer.
--
-- The trigram tokenizer breaks text into 3-character chunks:
--   "useForm" -> "use", "seF", "eFo", "For", "orm"
-- This enables substring matching and fuzzy search.

-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- ============================================================================
-- Core Tables
-- ============================================================================

-- Files/documents in the codebase
CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    relative_path TEXT NOT NULL UNIQUE,
    language TEXT DEFAULT 'typescript',
    indexed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    content_hash TEXT  -- For incremental updates
);

-- Symbol definitions (functions, classes, types, etc.)
CREATE TABLE IF NOT EXISTS symbols (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    name TEXT NOT NULL,           -- Short name (e.g., "useForm")
    full_symbol TEXT NOT NULL,    -- SCIP symbol (e.g., "scip-typescript npm...")
    kind TEXT NOT NULL,           -- function, class, interface, type, etc.
    line INTEGER NOT NULL,        -- 0-indexed line number
    column INTEGER NOT NULL,      -- 0-indexed column
    end_line INTEGER NOT NULL,
    end_column INTEGER NOT NULL,
    documentation TEXT,           -- JSDoc/TSDoc
    signature TEXT,               -- Type signature if available
    UNIQUE(full_symbol)
);

-- Symbol references (usages across the codebase)
CREATE TABLE IF NOT EXISTS "references" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol_id INTEGER NOT NULL REFERENCES symbols(id) ON DELETE CASCADE,
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    line INTEGER NOT NULL,
    column INTEGER NOT NULL,
    end_line INTEGER NOT NULL,
    end_column INTEGER NOT NULL,
    role TEXT NOT NULL DEFAULT 'read',  -- read, write, import, definition
    UNIQUE(symbol_id, document_id, line, column)
);

-- ============================================================================
-- Full-Text Search Tables (FTS5 with Trigram Tokenizer)
-- ============================================================================

-- FTS5 virtual table for symbol search
-- tokenize='trigram' enables substring matching
CREATE VIRTUAL TABLE IF NOT EXISTS symbols_fts USING fts5(
    name,
    full_symbol,
    documentation,
    content='symbols',
    content_rowid='id',
    tokenize='trigram'
);

-- FTS5 virtual table for file content search
CREATE VIRTUAL TABLE IF NOT EXISTS file_contents_fts USING fts5(
    relative_path,
    content,
    tokenize='trigram'
);

-- ============================================================================
-- Triggers for FTS Sync
-- ============================================================================

-- Keep symbols_fts in sync with symbols table
CREATE TRIGGER IF NOT EXISTS symbols_ai AFTER INSERT ON symbols BEGIN
    INSERT INTO symbols_fts(rowid, name, full_symbol, documentation)
    VALUES (new.id, new.name, new.full_symbol, new.documentation);
END;

CREATE TRIGGER IF NOT EXISTS symbols_ad AFTER DELETE ON symbols BEGIN
    INSERT INTO symbols_fts(symbols_fts, rowid, name, full_symbol, documentation)
    VALUES ('delete', old.id, old.name, old.full_symbol, old.documentation);
END;

CREATE TRIGGER IF NOT EXISTS symbols_au AFTER UPDATE ON symbols BEGIN
    INSERT INTO symbols_fts(symbols_fts, rowid, name, full_symbol, documentation)
    VALUES ('delete', old.id, old.name, old.full_symbol, old.documentation);
    INSERT INTO symbols_fts(rowid, name, full_symbol, documentation)
    VALUES (new.id, new.name, new.full_symbol, new.documentation);
END;

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_symbols_name ON symbols(name);
CREATE INDEX IF NOT EXISTS idx_symbols_document ON symbols(document_id);
CREATE INDEX IF NOT EXISTS idx_symbols_kind ON symbols(kind);
CREATE INDEX IF NOT EXISTS idx_references_symbol ON references(symbol_id);
CREATE INDEX IF NOT EXISTS idx_references_document ON references(document_id);
CREATE INDEX IF NOT EXISTS idx_documents_path ON documents(relative_path);

-- ============================================================================
-- Views for Common Queries
-- ============================================================================

-- Symbols with their file paths
CREATE VIEW IF NOT EXISTS symbols_with_paths AS
SELECT
    s.id,
    s.name,
    s.full_symbol,
    s.kind,
    s.line,
    s.column,
    s.documentation,
    d.relative_path
FROM symbols s
JOIN documents d ON s.document_id = d.id;

-- Reference counts per symbol
CREATE VIEW IF NOT EXISTS symbol_reference_counts AS
SELECT
    s.id,
    s.name,
    s.kind,
    d.relative_path,
    COUNT(r.id) as reference_count
FROM symbols s
JOIN documents d ON s.document_id = d.id
LEFT JOIN references r ON s.id = r.symbol_id
GROUP BY s.id;

-- Hooks view (React hooks starting with "use")
CREATE VIEW IF NOT EXISTS hooks AS
SELECT * FROM symbols_with_paths
WHERE kind = 'function' AND name LIKE 'use%'
ORDER BY name;
