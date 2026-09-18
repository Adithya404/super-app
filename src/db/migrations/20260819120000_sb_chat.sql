-- Migration: 20260819120000_sb_chat.sql
-- Sabre module chat persistence (no foreign key constraints)

BEGIN;

CREATE SCHEMA IF NOT EXISTS sabre;

CREATE TABLE sabre.sb_chat (
  chat_id    TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  title      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX sb_chat_user_id_idx ON sabre.sb_chat (user_id);

CREATE TABLE sabre.sb_chat_message (
  message_id TEXT PRIMARY KEY,
  chat_id    TEXT NOT NULL,
  role       TEXT NOT NULL,
  parts      JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata   JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX sb_chat_message_chat_id_idx ON sabre.sb_chat_message (chat_id);

COMMIT;
