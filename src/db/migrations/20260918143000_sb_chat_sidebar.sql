-- Migration: 20260918143000_sb_chat_sidebar.sql
-- Favorite, visibility, and list pagination index for Sabre chat sidebar

BEGIN;

ALTER TABLE sabre.sb_chat
  ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'private';

CREATE INDEX IF NOT EXISTS sb_chat_user_updated_idx
  ON sabre.sb_chat (user_id, updated_at DESC, chat_id DESC);

COMMIT;
