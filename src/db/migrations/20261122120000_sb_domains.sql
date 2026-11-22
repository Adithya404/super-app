-- Migration: 20261122120000_sb_domains.sql
-- Chat domains + domain-scoped knowledge and chats

BEGIN;

CREATE TABLE IF NOT EXISTS sabre.sb_domain (
  domain_id   TEXT PRIMARY KEY,
  slug        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  description TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO sabre.sb_domain (domain_id, slug, name, description)
VALUES
  ('domain_sabre', 'sabre', 'Sabre', 'Sabre product and app documentation'),
  ('domain_hr', 'hr', 'HR', 'HR policies, benefits, and internal people guidance')
ON CONFLICT (domain_id) DO NOTHING;

ALTER TABLE sabre.sb_chat
  ADD COLUMN IF NOT EXISTS domain_id TEXT REFERENCES sabre.sb_domain (domain_id);

UPDATE sabre.sb_chat
SET domain_id = 'domain_sabre'
WHERE domain_id IS NULL;

ALTER TABLE sabre.sb_chat
  ALTER COLUMN domain_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS sb_chat_user_domain_updated_idx
  ON sabre.sb_chat (user_id, domain_id, updated_at DESC, chat_id DESC);

ALTER TABLE sabre.sb_resource
  ADD COLUMN IF NOT EXISTS domain_id TEXT REFERENCES sabre.sb_domain (domain_id);

UPDATE sabre.sb_resource
SET domain_id = 'domain_sabre'
WHERE domain_id IS NULL;

ALTER TABLE sabre.sb_resource
  ALTER COLUMN domain_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS sb_resource_domain_created_idx
  ON sabre.sb_resource (domain_id, created_at DESC);

COMMIT;