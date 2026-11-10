-- Migration: 20261029005557_sb_rag_embedding_dims.sql
-- Switch embeddings to 384 dims for Xenova/all-MiniLM-L6-v2 (Transformers.js)

BEGIN;

DROP INDEX IF EXISTS sabre.sb_embedding_hnsw_idx;

TRUNCATE sabre.sb_embedding;

ALTER TABLE sabre.sb_embedding DROP COLUMN embedding;
ALTER TABLE sabre.sb_embedding ADD COLUMN embedding vector(384) NOT NULL;

CREATE INDEX IF NOT EXISTS sb_embedding_hnsw_idx
  ON sabre.sb_embedding
  USING hnsw (embedding vector_cosine_ops);

COMMIT;
