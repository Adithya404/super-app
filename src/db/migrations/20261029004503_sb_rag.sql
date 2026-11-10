-- Migration: 20261029004503_sb_rag.sql
-- Sabre RAG: plain-text resources + pgvector embeddings

BEGIN;

CREATE EXTENSION IF NOT EXISTS vector;

CREATE SCHEMA IF NOT EXISTS sabre;

CREATE TABLE IF NOT EXISTS sabre.sb_resource (
  resource_id TEXT PRIMARY KEY,
  title       TEXT,
  content     TEXT NOT NULL,
  created_by  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sabre.sb_embedding (
  embedding_id TEXT PRIMARY KEY,
  resource_id  TEXT NOT NULL REFERENCES sabre.sb_resource(resource_id) ON DELETE CASCADE,
  content      TEXT NOT NULL,
  embedding    vector(768) NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sb_embedding_hnsw_idx
  ON sabre.sb_embedding
  USING hnsw (embedding vector_cosine_ops);

COMMIT;
